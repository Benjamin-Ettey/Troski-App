import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import User from "../models/User";
import DriverProfile from "../models/DriverProfile";
import Vehicle from "../models/Vehicle";
import {
  listDriversService,
  listVehiclesService,
  getDriverDetailService,
} from "../services/admin/admin.service";
import { getVerificationStatusService } from "../services/driver/driver.service";
import { requireApprovedDriver } from "../middleware/requireApprovedDriver";
import { connectTestDb, clearDb, closeTestDb } from "./helpers/db";

let plateSeq = 0;

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

afterEach(async () => {
  await clearDb();
});

type Statuses = {
  verificationStatus?:
    | "incomplete"
    | "pending"
    | "approved"
    | "rejected"
    | "suspended";
  vehicleStatus?: "pending" | "approved" | "rejected" | null;
  name?: string;
};

// Create a driver user + profile (+ optional vehicle) with the given statuses,
// setting approval states directly so we don't trigger the email-sending admin
// service. Returns the created docs.
async function makeDriver({
  verificationStatus = "pending",
  vehicleStatus = "pending",
  name = "Kwame Driver",
}: Statuses = {}) {
  const n = ++plateSeq;
  const user = await User.create({
    name,
    email: `driver${n}@example.com`,
    phoneNumber: `+23324000000${n}`,
    role: "driver",
    pinHash: "1234",
    phoneVerified: true,
  });

  const profile = await DriverProfile.create({
    user: user._id,
    verificationStatus,
  });

  let vehicle = null;
  if (vehicleStatus) {
    vehicle = await Vehicle.create({
      driver: profile._id,
      vehicleMake: "Toyota Hiace",
      plateNumber: `GT${1000 + n}23`,
      vehicleColor: "Yellow",
      vehicleCapacity: 15,
      vehicleImage: "img",
      insuranceCertImage: "img",
      vehicleRegDocImage: "img",
      DVLARoadworthyImage: "img",
      vehicleStatus,
    });
  }

  return { user, profile, vehicle };
}

function mockRes() {
  const res: any = {};
  res.statusCode = undefined;
  res.body = undefined;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: unknown) => {
    res.body = body;
    return res;
  };
  return res;
}

describe("Phase 1 — driver 'my status' endpoint", () => {
  it("reports dispatchable when profile AND vehicle are both approved", async () => {
    const { user } = await makeDriver({
      verificationStatus: "approved",
      vehicleStatus: "approved",
    });

    const result = await getVerificationStatusService(user._id);

    expect(result.status).toBe(StatusCodes.OK);
    expect(result.data.verificationStatus).toBe("approved");
    expect(result.data.vehicleStatus).toBe("approved");
    expect(result.data.isDispatchable).toBe(true);
  });

  it("is NOT dispatchable when the profile is approved but there is no vehicle", async () => {
    const { user } = await makeDriver({
      verificationStatus: "approved",
      vehicleStatus: null,
    });

    const result = await getVerificationStatusService(user._id);

    expect(result.data.hasVehicle).toBe(false);
    expect(result.data.vehicleStatus).toBeNull();
    expect(result.data.isDispatchable).toBe(false);
  });

  it("is NOT dispatchable when the vehicle is approved but the profile is still pending", async () => {
    const { user } = await makeDriver({
      verificationStatus: "pending",
      vehicleStatus: "approved",
    });

    const result = await getVerificationStatusService(user._id);

    expect(result.data.isDispatchable).toBe(false);
  });

  it("returns 404 for a user with no driver profile", async () => {
    const user = await User.create({
      name: "No Profile",
      email: "noprofile@example.com",
      phoneNumber: "+233240999999",
      role: "driver",
      pinHash: "1234",
      phoneVerified: true,
    });

    const result = await getVerificationStatusService(user._id);
    expect(result.status).toBe(StatusCodes.NOT_FOUND);
  });
});

describe("Phase 1 — admin review queues", () => {
  it("defaults to pending drivers and attaches each driver's vehicle", async () => {
    await makeDriver({ verificationStatus: "pending", name: "Pending One" });
    await makeDriver({ verificationStatus: "approved", name: "Approved One" });
    await makeDriver({ verificationStatus: "rejected", name: "Rejected One" });

    const result = await listDriversService({});

    expect(result.status).toBe(StatusCodes.OK);
    expect(result.data.drivers).toHaveLength(1);
    expect(result.data.drivers[0].verificationStatus).toBe("pending");
    // Vehicle attached inline
    expect(result.data.drivers[0].vehicle).not.toBeNull();
    expect(result.data.drivers[0].vehicle.plateNumber).toMatch(/^GT/);
    expect(result.data.pagination.total).toBe(1);
  });

  it("returns everyone when status=all", async () => {
    await makeDriver({ verificationStatus: "pending" });
    await makeDriver({ verificationStatus: "approved" });
    await makeDriver({ verificationStatus: "rejected" });

    const result = await listDriversService({ status: "all" });
    expect(result.data.drivers).toHaveLength(3);
    expect(result.data.pagination.total).toBe(3);
  });

  it("paginates", async () => {
    for (let i = 0; i < 5; i++) {
      await makeDriver({ verificationStatus: "pending" });
    }

    const page1 = await listDriversService({ page: 1, limit: 2 });
    expect(page1.data.drivers).toHaveLength(2);
    expect(page1.data.pagination.pages).toBe(3);
    expect(page1.data.pagination.total).toBe(5);
  });

  it("lists pending vehicles with the owning driver populated", async () => {
    await makeDriver({ vehicleStatus: "pending", name: "Owner A" });
    await makeDriver({ vehicleStatus: "approved", name: "Owner B" });

    const result = await listVehiclesService({});
    expect(result.data.vehicles).toHaveLength(1);
    expect(result.data.vehicles[0].vehicleStatus).toBe("pending");
    // driver -> user populated
    expect(result.data.vehicles[0].driver.user.name).toBe("Owner A");
  });

  it("returns full driver detail, 404 for unknown id", async () => {
    const { profile } = await makeDriver({ vehicleStatus: "approved" });

    const ok = await getDriverDetailService(String(profile._id));
    expect(ok.status).toBe(StatusCodes.OK);
    expect(ok.data.vehicle).not.toBeNull();

    const missing = await getDriverDetailService(
      new mongoose.Types.ObjectId().toString(),
    );
    expect(missing.status).toBe(StatusCodes.NOT_FOUND);
  });
});

describe("Phase 1 — requireApprovedDriver reconciles profile + vehicle approval", () => {
  it("blocks a driver whose profile is not approved", async () => {
    const { user } = await makeDriver({
      verificationStatus: "pending",
      vehicleStatus: "approved",
    });

    const req: any = { user: { _id: user._id } };
    const res = mockRes();
    const next = jest.fn();

    await requireApprovedDriver(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(StatusCodes.FORBIDDEN);
  });

  it("blocks an approved driver who has no approved vehicle", async () => {
    const { user } = await makeDriver({
      verificationStatus: "approved",
      vehicleStatus: "pending",
    });

    const req: any = { user: { _id: user._id } };
    const res = mockRes();
    const next = jest.fn();

    await requireApprovedDriver(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(StatusCodes.FORBIDDEN);
    expect(res.body.message).toMatch(/approved vehicle/i);
  });

  it("allows a driver with an approved profile AND approved vehicle", async () => {
    const { user } = await makeDriver({
      verificationStatus: "approved",
      vehicleStatus: "approved",
    });

    const req: any = { user: { _id: user._id } };
    const res = mockRes();
    const next = jest.fn();

    await requireApprovedDriver(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeUndefined();
  });
});
