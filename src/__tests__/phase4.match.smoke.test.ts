import request from "supertest";
import app from "../app";

describe("Booking Phase 4 — match route protection (no DB)", () => {
  it("requires auth to match a ride", async () => {
    const res = await request(app)
      .post("/api/v1/bookings/match")
      .send({ pickupLat: 5.56, pickupLng: -0.2, destinationTown: "Mim" });
    expect(res.status).toBe(401);
  });
});
