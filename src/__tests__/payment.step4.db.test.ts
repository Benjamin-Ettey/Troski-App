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
import { driverWalletKey } from "../services/payment/ledger.core";
import { connectTestDb, clearDb, closeTestDb } from "./helpers/db";

const fakePaystack: PaymentPaystack = {
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
  refund: async ({ reference }) => ({ status: "pending", reference }),
  verifyWebhookSignature: () => true,
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
    status: "in_progress",
  });
  bookingId = booking._id;
});

// Put a held escrow payment onto the booking.
const chargeToEscrow = async (svc: ReturnType<typeof createPaymentService>) => {
  const init = await svc.initializeCharge(passengerId, String(bookingId));
  await svc.applyChargeSuccessByReference(init.data.reference);
  return init.data.reference;
};

describe("Payments Step 4 — release escrow to driver on completion", () => {
  it("credits the driver wallet + platform revenue, empties escrow, and is idempotent", async () => {
    const svc = createPaymentService({ paystack: fakePaystack });
    await chargeToEscrow(svc);
    expect(await getBalance("escrow")).toBe(7);

    const res = await svc.releaseEscrowForBooking(String(bookingId));
    expect(res.status).toBe(StatusCodes.OK);

    const { driverShare, platformShare } = res.data;
    expect(driverShare + platformShare).toBeCloseTo(7, 2);

    expect(await getBalance("escrow")).toBe(0);
    expect(await getBalance(driverWalletKey(String(driverProfileId)))).toBe(
      driverShare,
    );
    expect(await getBalance("platform_revenue")).toBe(platformShare);

    const tx = await PaymentTransaction.findOne({ booking: bookingId });
    expect(tx?.escrowStatus).toBe("released");
    const booking = await Booking.findById(bookingId);
    expect(booking?.paymentStatus).toBe("released");

    // Idempotent: releasing again doesn't double-pay.
    await svc.releaseEscrowForBooking(String(bookingId));
    expect(await getBalance(driverWalletKey(String(driverProfileId)))).toBe(
      driverShare,
    );
    expect(await getBalance("escrow")).toBe(0);
  });

  it("is a safe no-op when there is no escrowed payment", async () => {
    const svc = createPaymentService({ paystack: fakePaystack });
    const res = await svc.releaseEscrowForBooking(String(bookingId));
    expect(res.status).toBe(StatusCodes.OK);
    expect(res.message).toMatch(/no escrowed payment/i);
    expect(await getBalance("escrow")).toBe(0);
  });

  it("will not release funds that were never held", async () => {
    const svc = createPaymentService({ paystack: fakePaystack });
    // Create a pending (not held) transaction.
    await svc.initializeCharge(passengerId, String(bookingId));
    const res = await svc.releaseEscrowForBooking(String(bookingId));
    expect(res.status).toBe(StatusCodes.CONFLICT);
  });
});
