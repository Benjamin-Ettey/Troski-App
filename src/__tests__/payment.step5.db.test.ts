import { StatusCodes } from "http-status-codes";
import User from "../models/User";
import DriverProfile from "../models/DriverProfile";
import Booking from "../models/Booking";
import PaymentTransaction from "../models/PaymentTransaction";
import {
  createPaymentService,
  type PaymentPaystack,
} from "../services/payment/payment.service";
import { getBalance } from "../services/payment/ledger.service";
import { connectTestDb, clearDb, closeTestDb } from "./helpers/db";

// Fake Paystack that records refund calls.
const makePaystack = () => {
  const refundCalls: Array<{ reference: string }> = [];
  const paystack: PaymentPaystack = {
    initializeTransaction: async ({ reference }) => ({
      authorizationUrl: `https://checkout.test/${reference}`,
      accessCode: "ACCESS",
      reference,
    }),
    verifyTransaction: async (reference) => ({
      reference,
      status: "success",
      amount: 7,
      currency: "GHS",
      channel: "mobile_money",
      paidAt: "2026-09-28T10:00:00Z",
      gatewayResponse: "Approved",
      customerEmail: "rider@example.com",
    }),
    refund: async ({ reference }) => {
      refundCalls.push({ reference });
      return { status: "pending", reference };
    },
    verifyWebhookSignature: () => true,
  };
  return { paystack, refundCalls };
};

let passengerId: any;
let driverProfileId: any;
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
    name: "Ama Rider", email: "rider@example.com", phoneNumber: "+233240000001",
    role: "passenger", pinHash: "1234", phoneVerified: true,
  });
  passengerId = passenger._id;

  const driverUser = await User.create({
    name: "Kofi Driver", email: "driver@example.com", phoneNumber: "+233240000002",
    role: "driver", pinHash: "1234", phoneVerified: true,
  });
  const profile = await DriverProfile.create({
    user: driverUser._id,
    verificationStatus: "approved",
  });
  driverProfileId = profile._id;

  const booking = await Booking.create({
    passenger: passenger._id,
    driver: profile._id,
    pickup: { town: "Accra CBD", zoneId: "ACCRA_CBD", latitude: 5.55, longitude: -0.2 },
    destination: { town: "North Accra", zoneId: "NORTH_ACC", latitude: 5.65, longitude: -0.17 },
    distanceKm: 12,
    seatsRequested: 1,
    fareEstimate: 7,
    status: "accepted",
  });
  bookingId = booking._id;
});

const chargeToEscrow = async (svc: ReturnType<typeof createPaymentService>) => {
  const init = await svc.initializeCharge(passengerId, String(bookingId));
  await svc.applyChargeSuccessByReference(init.data.reference);
};

describe("Payments Step 5 — refund on cancellation", () => {
  it("refunds to source, reverses escrow, marks refunded, and is idempotent", async () => {
    const { paystack, refundCalls } = makePaystack();
    const svc = createPaymentService({ paystack });
    await chargeToEscrow(svc);
    expect(await getBalance("escrow")).toBe(7);

    const res = await svc.refundForBooking(String(bookingId));
    expect(res.status).toBe(StatusCodes.OK);
    expect(refundCalls).toHaveLength(1);

    // Escrow reversed and money left the platform (gateway back to 0).
    expect(await getBalance("escrow")).toBe(0);
    expect(await getBalance("gateway")).toBe(0);

    const tx = await PaymentTransaction.findOne({ booking: bookingId });
    expect(tx?.escrowStatus).toBe("refunded");
    const booking = await Booking.findById(bookingId);
    expect(booking?.paymentStatus).toBe("refunded");

    // Idempotent: no second Paystack refund, no double ledger reversal.
    await svc.refundForBooking(String(bookingId));
    expect(refundCalls).toHaveLength(1);
    expect(await getBalance("escrow")).toBe(0);
  });

  it("is a safe no-op when there is no payment", async () => {
    const { paystack, refundCalls } = makePaystack();
    const svc = createPaymentService({ paystack });

    const res = await svc.refundForBooking(String(bookingId));
    expect(res.status).toBe(StatusCodes.OK);
    expect(refundCalls).toHaveLength(0);
  });

  it("refuses to refund funds already released to the driver", async () => {
    const { paystack, refundCalls } = makePaystack();
    const svc = createPaymentService({ paystack });
    await chargeToEscrow(svc);
    await svc.releaseEscrowForBooking(String(bookingId));

    const res = await svc.refundForBooking(String(bookingId));
    expect(res.status).toBe(StatusCodes.CONFLICT);
    expect(refundCalls).toHaveLength(0);
  });
});
