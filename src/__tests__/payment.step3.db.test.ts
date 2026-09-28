import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import User from "../models/User";
import Booking from "../models/Booking";
import PaymentTransaction from "../models/PaymentTransaction";
import {
  createPaymentService,
  type PaymentPaystack,
} from "../services/payment/payment.service";
import { getBalance } from "../services/payment/ledger.service";
import { connectTestDb, clearDb, closeTestDb } from "./helpers/db";

const WEBHOOK_SECRET = "test_webhook_secret";

// Configurable fake Paystack.
const makePaystack = (
  verify: Partial<{ status: string; amount: number; channel: string }> = {},
): PaymentPaystack => ({
  initializeTransaction: async ({ reference }) => ({
    authorizationUrl: `https://checkout.test/${reference}`,
    accessCode: "ACCESS",
    reference,
  }),
  verifyTransaction: async (reference) => ({
    reference,
    status: verify.status ?? "success",
    amount: verify.amount ?? 7,
    currency: "GHS",
    channel: verify.channel ?? "mobile_money",
    paidAt: "2026-09-28T10:00:00Z",
    gatewayResponse: "Approved",
    customerEmail: "rider@example.com",
  }),
  refund: async ({ reference }) => ({ status: "pending", reference }),
  // Treat the "signature" as valid only if it is the real HMAC of the body.
  verifyWebhookSignature: (rawBody, signature) => {
    if (!signature) return false;
    const expected = crypto
      .createHmac("sha512", WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    return expected === signature;
  },
});

let passengerId: any;
let bookingId: any;

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
  const passenger = await User.create({
    name: "Ama Rider",
    email: "rider@example.com",
    phoneNumber: "+233240000001",
    role: "passenger",
    pinHash: "1234",
    phoneVerified: true,
  });
  passengerId = passenger._id;

  const booking = await Booking.create({
    passenger: passenger._id,
    pickup: { town: "Kaneshie", zoneId: "ACCRA_CBD", latitude: 5.55, longitude: -0.23 },
    destination: { town: "Madina", zoneId: "NORTH_ACC", latitude: 5.68, longitude: -0.16 },
    distanceKm: 12,
    seatsRequested: 1,
    fareEstimate: 7,
  });
  bookingId = booking._id;
});

describe("Payments Step 3 — initialize charge", () => {
  it("creates a pending transaction and returns a checkout URL", async () => {
    const svc = createPaymentService({ paystack: makePaystack() });
    const res = await svc.initializeCharge(passengerId, String(bookingId));

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.data.authorizationUrl).toContain("checkout.test");
    expect(res.data.amount).toBe(7);

    const tx = await PaymentTransaction.findOne({ reference: res.data.reference });
    expect(tx?.status).toBe("pending");
    expect(tx?.escrowStatus).toBe("none");
  });

  it("blocks paying for someone else's booking", async () => {
    const svc = createPaymentService({ paystack: makePaystack() });
    const stranger = await User.create({
      name: "Kojo", email: "kojo@example.com", phoneNumber: "+233240000009",
      role: "passenger", pinHash: "1234", phoneVerified: true,
    });
    const res = await svc.initializeCharge(stranger._id, String(bookingId));
    expect(res.status).toBe(StatusCodes.FORBIDDEN);
  });
});

describe("Payments Step 3 — charge success holds funds in escrow", () => {
  it("moves funds into escrow, marks the booking, and is idempotent", async () => {
    const svc = createPaymentService({ paystack: makePaystack({ amount: 7 }) });
    const init = await svc.initializeCharge(passengerId, String(bookingId));
    const { reference } = init.data;

    const applied = await svc.applyChargeSuccessByReference(reference);
    expect(applied.status).toBe(StatusCodes.OK);

    // Ledger: escrow holds 7, gateway (money at Paystack) 7
    expect(await getBalance("escrow")).toBe(7);
    expect(await getBalance("gateway")).toBe(7);

    const tx = await PaymentTransaction.findOne({ reference });
    expect(tx?.status).toBe("success");
    expect(tx?.escrowStatus).toBe("held");
    expect(tx?.method).toBe("momo");

    const booking = await Booking.findById(bookingId);
    expect(booking?.paymentStatus).toBe("escrow_held");

    // Idempotent: applying again does not double-post to the ledger.
    await svc.applyChargeSuccessByReference(reference);
    expect(await getBalance("escrow")).toBe(7);
  });

  it("does not hold funds when the payment did not succeed", async () => {
    const svc = createPaymentService({ paystack: makePaystack({ status: "failed" }) });
    const init = await svc.initializeCharge(passengerId, String(bookingId));
    const res = await svc.applyChargeSuccessByReference(init.data.reference);

    expect(res.status).toBe(StatusCodes.PAYMENT_REQUIRED);
    expect(await getBalance("escrow")).toBe(0);
    const tx = await PaymentTransaction.findOne({ reference: init.data.reference });
    expect(tx?.escrowStatus).toBe("none");
  });

  it("rejects a paid amount that doesn't match the fare", async () => {
    const svc = createPaymentService({ paystack: makePaystack({ amount: 5 }) });
    const init = await svc.initializeCharge(passengerId, String(bookingId));
    const res = await svc.applyChargeSuccessByReference(init.data.reference);

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(await getBalance("escrow")).toBe(0);
  });
});

describe("Payments Step 3 — webhook", () => {
  it("verifies signature, holds escrow, and dedupes retries", async () => {
    const svc = createPaymentService({ paystack: makePaystack({ amount: 7 }) });
    const init = await svc.initializeCharge(passengerId, String(bookingId));

    const body = JSON.stringify({
      event: "charge.success",
      data: { reference: init.data.reference },
    });
    const signature = crypto
      .createHmac("sha512", WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    const r1 = await svc.handleWebhook(Buffer.from(body), signature);
    expect(r1.ok).toBe(true);
    expect(await getBalance("escrow")).toBe(7);

    // Retry of the same event: still ok, no double-charge.
    const r2 = await svc.handleWebhook(Buffer.from(body), signature);
    expect(r2.ok).toBe(true);
    expect(await getBalance("escrow")).toBe(7);
  });

  it("rejects a bad signature", async () => {
    const svc = createPaymentService({ paystack: makePaystack() });
    const r = await svc.handleWebhook(Buffer.from("{}"), "bad");
    expect(r.ok).toBe(false);
    expect(r.status).toBe(401);
  });
});
