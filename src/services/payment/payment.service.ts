import crypto from "crypto";
import mongoose, { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";
import Booking from "../../models/Booking";
import User from "../../models/User";
import PaymentTransaction from "../../models/PaymentTransaction";
import WebhookEvent from "../../models/WebhookEvent";
import { ServiceResponse } from "../auth/local/auth.service";
import { postTransaction } from "./ledger.service";
import { driverWalletKey } from "./ledger.core";
import { calculateRouteFare } from "../fare/fare.service";
import zonesConfig from "../../data/zonesConfig";
import { paystackService, type PaystackService } from "./paystack.service";

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Split a held amount into the driver's share and the platform's share using
 * the fare algorithm's ratio, guaranteeing the two parts sum exactly to the
 * held amount (no rounding leakage).
 */
export const splitEarnings = (
  heldAmount: number,
  pickupZone: string,
  dropoffZone: string,
  distanceInKm: number,
): { driverShare: number; platformShare: number } => {
  const fare = calculateRouteFare({
    pickupZone,
    dropoffZone,
    distanceInKm,
    zonesConfig,
  });
  const driverRatio =
    fare.finalFare > 0 ? fare.driverPay / fare.finalFare : 0.9;
  const driverShare = round2(heldAmount * driverRatio);
  const platformShare = round2(heldAmount - driverShare);
  return { driverShare, platformShare };
};

// Only the parts of the Paystack client this service needs — so tests can pass
// a small fake.
export type PaymentPaystack = Pick<
  PaystackService,
  | "initializeTransaction"
  | "verifyTransaction"
  | "refund"
  | "verifyWebhookSignature"
>;

// Bookings that can still be paid for.
const CHARGEABLE_BOOKING_STATUSES = ["requested", "accepted", "arrived"];

const newReference = (): string =>
  `troski_${crypto.randomBytes(10).toString("hex")}`;

const channelToMethod = (channel: string | null): "momo" | "card" | undefined => {
  if (channel === "mobile_money") return "momo";
  if (channel === "card") return "card";
  return undefined;
};

export const createPaymentService = (deps: { paystack: PaymentPaystack }) => {
  const { paystack } = deps;

  /**
   * Start a charge for a booking. Creates a pending PaymentTransaction and
   * returns the Paystack checkout URL the passenger pays through.
   */
  const initializeCharge = async (
    passengerId: Types.ObjectId,
    bookingId: string,
  ): Promise<ServiceResponse> => {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return { status: StatusCodes.NOT_FOUND, message: "Booking not found" };
    }
    if (String(booking.passenger) !== String(passengerId)) {
      return {
        status: StatusCodes.FORBIDDEN,
        message: "You cannot pay for a booking that is not yours",
      };
    }
    if (booking.paymentStatus === "escrow_held") {
      return {
        status: StatusCodes.CONFLICT,
        message: "This booking is already paid for",
      };
    }
    if (!CHARGEABLE_BOOKING_STATUSES.includes(booking.status as string)) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: `A booking that is '${booking.status}' cannot be paid for`,
      };
    }

    const amount = booking.fareEstimate as number;
    if (!amount || amount <= 0) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: "Booking has no payable fare",
      };
    }

    const user = await User.findById(passengerId).select("email");
    if (!user?.email) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: "Passenger has no email for payment receipts",
      };
    }

    const reference = newReference();
    const init = await paystack.initializeTransaction({
      email: user.email,
      amount,
      reference,
      channels: ["mobile_money", "card"],
      metadata: { bookingId: String(booking._id), passengerId: String(passengerId) },
    });

    await PaymentTransaction.create({
      passenger: passengerId,
      booking: booking._id,
      amount,
      reference,
      status: "pending",
      escrowStatus: "none",
    });

    return {
      status: StatusCodes.OK,
      message: "Payment initialized",
      data: {
        authorizationUrl: init.authorizationUrl,
        accessCode: init.accessCode,
        reference,
        amount,
      },
    };
  };

  /**
   * Confirm a payment with Paystack and, if successful, place the funds into
   * escrow (ledger: gateway debit, escrow credit) and mark the booking
   * escrow_held. Idempotent and race-safe: only one caller ever posts the
   * escrow entry for a given reference.
   */
  const applyChargeSuccessByReference = async (
    reference: string,
  ): Promise<ServiceResponse> => {
    const tx = await PaymentTransaction.findOne({ reference });
    if (!tx) {
      return { status: StatusCodes.NOT_FOUND, message: "Payment not found" };
    }
    if (tx.escrowStatus === "held") {
      return {
        status: StatusCodes.OK,
        message: "Payment already held in escrow",
        data: { reference, escrowStatus: "held" },
      };
    }

    // Atomic claim: only the caller that flips none -> processing proceeds.
    const claimed = await PaymentTransaction.findOneAndUpdate(
      { reference, escrowStatus: "none" },
      { $set: { escrowStatus: "processing" } },
      { new: true },
    );
    if (!claimed) {
      return {
        status: StatusCodes.OK,
        message: "Payment is already being processed",
        data: { reference, escrowStatus: tx.escrowStatus },
      };
    }

    const verify = await paystack.verifyTransaction(reference);

    if (verify.status !== "success") {
      await PaymentTransaction.updateOne(
        { _id: claimed._id },
        { $set: { status: verify.status, escrowStatus: "none" } },
      );
      return {
        status: StatusCodes.PAYMENT_REQUIRED,
        message: `Payment not completed (${verify.status})`,
      };
    }

    if (Math.abs(verify.amount - (claimed.amount as number)) > 0.005) {
      // Amount doesn't match what we asked for — do not hold funds.
      await PaymentTransaction.updateOne(
        { _id: claimed._id },
        { $set: { status: "success", escrowStatus: "none" } },
      );
      return {
        status: StatusCodes.BAD_REQUEST,
        message: "Paid amount does not match the booking fare",
      };
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const posting = await postTransaction(
          {
            type: "charge",
            reference: { kind: "booking", id: String(claimed.booking) },
            entries: [
              { account: "gateway", direction: "debit", amount: claimed.amount as number },
              { account: "escrow", direction: "credit", amount: claimed.amount as number },
            ],
          },
          session,
        );

        await PaymentTransaction.updateOne(
          { _id: claimed._id },
          {
            $set: {
              status: "success",
              escrowStatus: "held",
              method: channelToMethod(verify.channel),
              ledgerPostingId: posting.postingId,
              paystack: {
                channel: verify.channel,
                gatewayResponse: verify.gatewayResponse,
                paidAt: verify.paidAt,
                customerEmail: verify.customerEmail,
              },
            },
          },
          { session },
        );

        await Booking.updateOne(
          { _id: claimed.booking },
          { $set: { paymentStatus: "escrow_held" } },
          { session },
        );
      });
    } catch (err) {
      // Release the claim so a retry (webhook/poll) can try again.
      await PaymentTransaction.updateOne(
        { _id: claimed._id, escrowStatus: "processing" },
        { $set: { escrowStatus: "none" } },
      );
      throw err;
    } finally {
      session.endSession();
    }

    return {
      status: StatusCodes.OK,
      message: "Payment received and held in escrow",
      data: { reference, escrowStatus: "held", amount: claimed.amount },
    };
  };

  /**
   * Release a booking's escrowed funds to the driver's wallet on ride
   * completion. Ledger: escrow debit (full held amount), driver_wallet credit
   * (driver share), platform_revenue credit (platform share). Idempotent and
   * race-safe via a held -> releasing claim. No-op for rides with no escrowed
   * payment (e.g. off-platform cash).
   */
  const releaseEscrowForBooking = async (
    bookingId: string,
  ): Promise<ServiceResponse> => {
    const tx = await PaymentTransaction.findOne({ booking: bookingId });
    if (!tx) {
      return {
        status: StatusCodes.OK,
        message: "No escrowed payment to release",
      };
    }
    if (tx.escrowStatus === "released") {
      return {
        status: StatusCodes.OK,
        message: "Payment already released",
        data: { reference: tx.reference, escrowStatus: "released" },
      };
    }
    if (tx.escrowStatus !== "held") {
      return {
        status: StatusCodes.CONFLICT,
        message: `Cannot release funds from state '${tx.escrowStatus}'`,
      };
    }

    const booking = await Booking.findById(bookingId);
    if (!booking?.driver) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: "Cannot release: booking has no assigned driver",
      };
    }

    // Atomic claim so only one caller releases.
    const claimed = await PaymentTransaction.findOneAndUpdate(
      { _id: tx._id, escrowStatus: "held" },
      { $set: { escrowStatus: "releasing" } },
      { new: true },
    );
    if (!claimed) {
      return {
        status: StatusCodes.OK,
        message: "Release already in progress",
        data: { reference: tx.reference },
      };
    }

    const held = claimed.amount as number;
    const { driverShare, platformShare } = splitEarnings(
      held,
      booking.pickup?.zoneId as string,
      booking.destination?.zoneId as string,
      booking.distanceKm as number,
    );
    const walletKey = driverWalletKey(String(booking.driver));

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await postTransaction(
          {
            type: "release",
            reference: { kind: "booking", id: bookingId },
            entries: [
              { account: "escrow", direction: "debit", amount: held },
              { account: walletKey, direction: "credit", amount: driverShare },
              {
                account: "platform_revenue",
                direction: "credit",
                amount: platformShare,
              },
            ],
          },
          session,
        );

        await PaymentTransaction.updateOne(
          { _id: claimed._id },
          { $set: { escrowStatus: "released" } },
          { session },
        );

        await Booking.updateOne(
          { _id: bookingId },
          { $set: { paymentStatus: "released" } },
          { session },
        );
      });
    } catch (err) {
      await PaymentTransaction.updateOne(
        { _id: claimed._id, escrowStatus: "releasing" },
        { $set: { escrowStatus: "held" } },
      );
      throw err;
    } finally {
      session.endSession();
    }

    return {
      status: StatusCodes.OK,
      message: "Funds released to driver wallet",
      data: {
        reference: claimed.reference,
        driverShare,
        platformShare,
        walletKey,
      },
    };
  };

  /**
   * Refund a booking's escrowed funds to the passenger on cancellation. Asks
   * Paystack to refund to source, then reverses the escrow ledger (escrow debit,
   * gateway credit — money leaving the platform back to the passenger) and marks
   * the booking refunded. Idempotent and race-safe via a held -> refunding claim.
   * No-op when nothing is held (e.g. unpaid or cash rides).
   */
  const refundForBooking = async (
    bookingId: string,
  ): Promise<ServiceResponse> => {
    const tx = await PaymentTransaction.findOne({ booking: bookingId });
    if (!tx) {
      return { status: StatusCodes.OK, message: "No payment to refund" };
    }
    if (tx.escrowStatus === "refunded") {
      return {
        status: StatusCodes.OK,
        message: "Payment already refunded",
        data: { reference: tx.reference, escrowStatus: "refunded" },
      };
    }
    if (tx.escrowStatus === "released") {
      return {
        status: StatusCodes.CONFLICT,
        message: "Funds were already released to the driver; cannot refund",
      };
    }
    if (tx.escrowStatus !== "held") {
      // Nothing is actually held (pending/none) — no money to return.
      return {
        status: StatusCodes.OK,
        message: "No held funds to refund",
        data: { escrowStatus: tx.escrowStatus },
      };
    }

    const claimed = await PaymentTransaction.findOneAndUpdate(
      { _id: tx._id, escrowStatus: "held" },
      { $set: { escrowStatus: "refunding" } },
      { new: true },
    );
    if (!claimed) {
      return {
        status: StatusCodes.OK,
        message: "Refund already in progress",
        data: { reference: tx.reference },
      };
    }

    const amount = claimed.amount as number;

    try {
      // Ask Paystack to send the money back to source first; only reverse our
      // books if Paystack accepts the refund request.
      await paystack.refund({ reference: claimed.reference });

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await postTransaction(
            {
              type: "refund",
              reference: { kind: "booking", id: bookingId },
              entries: [
                { account: "escrow", direction: "debit", amount },
                { account: "gateway", direction: "credit", amount },
              ],
            },
            session,
          );

          await PaymentTransaction.updateOne(
            { _id: claimed._id },
            { $set: { escrowStatus: "refunded" } },
            { session },
          );

          await Booking.updateOne(
            { _id: bookingId },
            { $set: { paymentStatus: "refunded" } },
            { session },
          );
        });
      } finally {
        session.endSession();
      }
    } catch (err) {
      // Roll the claim back so it can be retried.
      await PaymentTransaction.updateOne(
        { _id: claimed._id, escrowStatus: "refunding" },
        { $set: { escrowStatus: "held" } },
      );
      throw err;
    }

    return {
      status: StatusCodes.OK,
      message: "Refund issued to passenger",
      data: { reference: claimed.reference, amount },
    };
  };

  /**
   * Passenger-facing poll after checkout: authorize ownership, then confirm.
   */
  const verifyAndApply = async (
    passengerId: Types.ObjectId,
    reference: string,
  ): Promise<ServiceResponse> => {
    const tx = await PaymentTransaction.findOne({ reference });
    if (!tx) {
      return { status: StatusCodes.NOT_FOUND, message: "Payment not found" };
    }
    if (String(tx.passenger) !== String(passengerId)) {
      return {
        status: StatusCodes.FORBIDDEN,
        message: "This payment is not yours",
      };
    }
    return applyChargeSuccessByReference(reference);
  };

  /**
   * Handle a Paystack webhook. Verifies the signature over the RAW body, dedupes
   * by signature, and processes charge.success into escrow.
   */
  const handleWebhook = async (
    rawBody: Buffer | string,
    signature: string | undefined,
  ): Promise<{ ok: boolean; status: number }> => {
    if (!paystack.verifyWebhookSignature(rawBody, signature)) {
      return { ok: false, status: StatusCodes.UNAUTHORIZED };
    }

    let event: any;
    try {
      event = JSON.parse(
        typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"),
      );
    } catch {
      return { ok: false, status: StatusCodes.BAD_REQUEST };
    }

    const dedupeKey = signature as string;
    const existing = await WebhookEvent.findOne({ dedupeKey });
    if (existing?.processed) {
      return { ok: true, status: StatusCodes.OK };
    }

    if (event?.event === "charge.success" && event?.data?.reference) {
      // applyChargeSuccessByReference is itself idempotent + race-safe.
      await applyChargeSuccessByReference(event.data.reference);
    }

    await WebhookEvent.updateOne(
      { dedupeKey },
      {
        $set: {
          provider: "paystack",
          event: event?.event,
          reference: event?.data?.reference,
          processed: true,
          processedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return { ok: true, status: StatusCodes.OK };
  };

  return {
    initializeCharge,
    applyChargeSuccessByReference,
    releaseEscrowForBooking,
    refundForBooking,
    verifyAndApply,
    handleWebhook,
  };
};

export type PaymentService = ReturnType<typeof createPaymentService>;

export const paymentService = createPaymentService({ paystack: paystackService });
