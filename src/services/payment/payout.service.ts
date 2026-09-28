import crypto from "crypto";
import mongoose from "mongoose";
import User from "../../models/User";
import DriverProfile from "../../models/DriverProfile";
import Withdrawal from "../../models/Withdrawal";
import LedgerAccount from "../../models/LedgerAccount";
import { postTransaction, getDriverWalletBalance } from "./ledger.service";
import { driverWalletKey, DRIVER_WALLET_PREFIX } from "./ledger.core";
import { paystackService, type PaystackService } from "./paystack.service";

export type MomoProvider = "MTN" | "VOD" | "ATL";

// Only the transfer parts of the Paystack client this service needs.
export type PayoutPaystack = Pick<
  PaystackService,
  "createTransferRecipient" | "initiateTransfer"
>;

// Don't pay out dust — configurable floor (keeps transfer fees sane).
const MIN_PAYOUT = Number(process.env.PAYOUT_MIN_GHS || 1);

const newReference = (): string =>
  `payout_${crypto.randomBytes(10).toString("hex")}`;

/** Best-effort MoMo provider from a Ghana number prefix. */
export const inferMomoProvider = (momoNumber: string): MomoProvider | null => {
  const digits = momoNumber.replace(/\D/g, "");
  // Normalize +233XXXXXXXXX / 233... / 0XXXXXXXXX to a leading-0 form.
  let local = digits;
  if (local.startsWith("233")) local = "0" + local.slice(3);
  if (!local.startsWith("0") && local.length === 9) local = "0" + local;
  const p = local.slice(0, 3);

  const MTN = ["024", "025", "053", "054", "055", "059"];
  const VOD = ["020", "050"];
  const ATL = ["026", "027", "056", "057"];
  if (MTN.includes(p)) return "MTN";
  if (VOD.includes(p)) return "VOD";
  if (ATL.includes(p)) return "ATL";
  return null;
};

export const providerToBankCode = (provider: MomoProvider): string => provider;

const mapTransferStatus = (
  status: string,
): "success" | "failed" | "reversed" | "processing" => {
  if (status === "success") return "success";
  if (status === "failed") return "failed";
  if (status === "reversed") return "reversed";
  return "processing"; // pending | otp | processing
};

export type PayoutResult = {
  driverId?: string;
  ok?: boolean;
  skipped?: boolean;
  failed?: boolean;
  reason?: string;
  amount?: number;
  reference?: string;
  transferStatus?: string;
  error?: string;
  balance?: number;
};

export const createPayoutService = (deps: { paystack: PayoutPaystack }) => {
  const { paystack } = deps;

  /** Ensure the driver has a Paystack transfer recipient; create + cache it. */
  const ensureRecipient = async (
    profile: any,
  ): Promise<string | null> => {
    if (profile.transferRecipientCode) return profile.transferRecipientCode;
    if (!profile.momoNumber) return null;

    const provider: MomoProvider | null =
      profile.momoProvider || inferMomoProvider(profile.momoNumber);
    if (!provider) return null;

    const user = await User.findById(profile.user).select("name");
    const { recipientCode } = await paystack.createTransferRecipient({
      name: user?.name || "Troski Driver",
      accountNumber: profile.momoNumber,
      bankCode: providerToBankCode(provider),
    });

    profile.transferRecipientCode = recipientCode;
    await profile.save();
    return recipientCode;
  };

  /** Sweep one driver's wallet balance to their MoMo. */
  const payoutDriver = async (
    driverProfileId: string,
  ): Promise<PayoutResult> => {
    const balance = await getDriverWalletBalance(driverProfileId);
    if (balance < MIN_PAYOUT) {
      return { skipped: true, reason: "below_minimum", balance };
    }

    // One payout in flight per driver (single-node guard).
    const inflight = await Withdrawal.findOne({
      driver: driverProfileId,
      status: { $in: ["pending", "processing"] },
    });
    if (inflight) return { skipped: true, reason: "in_flight" };

    const profile = await DriverProfile.findById(driverProfileId);
    if (!profile) return { failed: true, reason: "no_profile" };

    let recipientCode: string | null;
    try {
      recipientCode = await ensureRecipient(profile);
    } catch (err: any) {
      return { failed: true, reason: "recipient_error", error: err?.message };
    }
    if (!recipientCode) return { skipped: true, reason: "no_momo_recipient" };

    const reference = newReference();
    const walletKey = driverWalletKey(driverProfileId);

    // Reserve the funds: debit the wallet + record the withdrawal atomically,
    // BEFORE calling Paystack, so a crash can't send money without a record.
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await postTransaction(
          {
            type: "payout",
            reference: { kind: "withdrawal", id: reference },
            entries: [
              { account: walletKey, direction: "debit", amount: balance },
              { account: "gateway", direction: "credit", amount: balance },
            ],
          },
          session,
        );
        await Withdrawal.create(
          [
            {
              driver: driverProfileId,
              amount: balance,
              reference,
              recipientCode,
              status: "pending",
            },
          ],
          { session },
        );
      });
    } finally {
      session.endSession();
    }

    // Now actually send the money.
    try {
      const transfer = await paystack.initiateTransfer({
        amount: balance,
        recipientCode,
        reference,
        reason: "Troski driver payout",
      });
      await Withdrawal.updateOne(
        { reference },
        {
          $set: {
            status: mapTransferStatus(transfer.status),
            transferCode: transfer.transferCode,
          },
        },
      );
      return {
        ok: true,
        amount: balance,
        reference,
        transferStatus: transfer.status,
      };
    } catch (err: any) {
      // Transfer never left — reverse the reservation so the driver keeps their
      // balance and can be retried next run.
      await postTransaction({
        type: "payout_reversal",
        reference: { kind: "withdrawal", id: reference },
        entries: [
          { account: walletKey, direction: "credit", amount: balance },
          { account: "gateway", direction: "debit", amount: balance },
        ],
      });
      await Withdrawal.updateOne(
        { reference },
        { $set: { status: "failed", failureReason: err?.message } },
      );
      return { failed: true, reason: "transfer_failed", error: err?.message };
    }
  };

  /** Sweep every driver wallet at or above the payout minimum. */
  const runScheduledPayouts = async (): Promise<{
    processed: number;
    paid: number;
    skipped: number;
    failed: number;
    results: PayoutResult[];
  }> => {
    const wallets = await LedgerAccount.find({
      key: { $regex: `^${DRIVER_WALLET_PREFIX}` },
      balance: { $gte: MIN_PAYOUT },
    });

    let paid = 0;
    let skipped = 0;
    let failed = 0;
    const results: PayoutResult[] = [];

    for (const wallet of wallets) {
      const driverId = (wallet.key as string).slice(DRIVER_WALLET_PREFIX.length);
      const result = await payoutDriver(driverId);
      if (result.ok) paid++;
      else if (result.failed) failed++;
      else skipped++;
      results.push({ driverId, ...result });
    }

    return { processed: wallets.length, paid, skipped, failed, results };
  };

  return { ensureRecipient, payoutDriver, runScheduledPayouts };
};

export type PayoutService = ReturnType<typeof createPayoutService>;

export const payoutService = createPayoutService({ paystack: paystackService });
