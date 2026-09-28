import User from "../models/User";
import DriverProfile from "../models/DriverProfile";
import Withdrawal from "../models/Withdrawal";
import {
  createPayoutService,
  type PayoutPaystack,
} from "../services/payment/payout.service";
import { postTransaction, getBalance } from "../services/payment/ledger.service";
import { driverWalletKey } from "../services/payment/ledger.core";
import { connectTestDb, clearDb, closeTestDb } from "./helpers/db";

// Fake transfer client that records calls and can be told to fail.
const makePaystack = (opts: { failTransfer?: boolean } = {}) => {
  const recipientCalls: any[] = [];
  const transferCalls: any[] = [];
  const paystack: PayoutPaystack = {
    createTransferRecipient: async (p) => {
      recipientCalls.push(p);
      return { recipientCode: "RCP_TEST" };
    },
    initiateTransfer: async (p) => {
      transferCalls.push(p);
      if (opts.failTransfer) throw new Error("transfer refused");
      return { status: "success", transferCode: "TRF_TEST", reference: p.reference };
    },
  };
  return { paystack, recipientCalls, transferCalls };
};

let driverProfileId: string;

beforeAll(async () => {
  await connectTestDb();
});
afterAll(async () => {
  await closeTestDb();
});
afterEach(async () => {
  await clearDb();
});

beforeEach(async () => {
  const driverUser = await User.create({
    name: "Kofi Driver", email: "driver@example.com", phoneNumber: "0241234567",
    role: "driver", pinHash: "1234", phoneVerified: true,
  });
  const profile = await DriverProfile.create({
    user: driverUser._id,
    verificationStatus: "approved",
    momoNumber: "0241234567",
  });
  driverProfileId = String(profile._id);
});

// Fund a driver wallet by an amount (balanced: gateway debit, wallet credit).
const fundWallet = async (amount: number) => {
  await postTransaction({
    type: "test_funding",
    reference: { kind: "test", id: "seed" },
    entries: [
      { account: "gateway", direction: "debit", amount },
      { account: driverWalletKey(driverProfileId), direction: "credit", amount },
    ],
  });
};

describe("Payments Step 6 — driver payout", () => {
  it("sweeps the wallet to MoMo, records the withdrawal, and caches the recipient", async () => {
    const { paystack, recipientCalls, transferCalls } = makePaystack();
    const svc = createPayoutService({ paystack });
    await fundWallet(6.03);

    const res = await svc.payoutDriver(driverProfileId);

    expect(res.ok).toBe(true);
    expect(res.amount).toBe(6.03);
    expect(await getBalance(driverWalletKey(driverProfileId))).toBe(0);

    expect(recipientCalls).toHaveLength(1);
    expect(transferCalls[0].amount).toBe(6.03);

    const wd = await Withdrawal.findOne({ driver: driverProfileId });
    expect(wd?.status).toBe("success");
    expect(wd?.transferCode).toBe("TRF_TEST");

    // Recipient code cached on the profile.
    const profile = await DriverProfile.findById(driverProfileId);
    expect(profile?.transferRecipientCode).toBe("RCP_TEST");
  });

  it("skips wallets below the minimum", async () => {
    const { paystack, transferCalls } = makePaystack();
    const svc = createPayoutService({ paystack });
    await fundWallet(0.5);

    const res = await svc.payoutDriver(driverProfileId);
    expect(res.skipped).toBe(true);
    expect(res.reason).toBe("below_minimum");
    expect(transferCalls).toHaveLength(0);
  });

  it("reverses the reservation if the transfer fails (driver keeps their balance)", async () => {
    const { paystack } = makePaystack({ failTransfer: true });
    const svc = createPayoutService({ paystack });
    await fundWallet(6.03);

    const res = await svc.payoutDriver(driverProfileId);
    expect(res.failed).toBe(true);

    // Balance restored.
    expect(await getBalance(driverWalletKey(driverProfileId))).toBe(6.03);
    const wd = await Withdrawal.findOne({ driver: driverProfileId });
    expect(wd?.status).toBe("failed");
  });

  it("does not start a second payout while one is in flight", async () => {
    const { paystack } = makePaystack();
    const svc = createPayoutService({ paystack });
    await fundWallet(6.03);
    await Withdrawal.create({
      driver: driverProfileId,
      amount: 3,
      reference: "payout_existing",
      status: "pending",
    });

    const res = await svc.payoutDriver(driverProfileId);
    expect(res.skipped).toBe(true);
    expect(res.reason).toBe("in_flight");
  });

  it("runScheduledPayouts sweeps eligible wallets", async () => {
    const { paystack } = makePaystack();
    const svc = createPayoutService({ paystack });
    await fundWallet(6.03);

    const summary = await svc.runScheduledPayouts();
    expect(summary.processed).toBe(1);
    expect(summary.paid).toBe(1);
    expect(await getBalance(driverWalletKey(driverProfileId))).toBe(0);
  });
});
