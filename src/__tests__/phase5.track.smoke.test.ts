import request from "supertest";
import app from "../app";

describe("Booking Phase 5 — tracking route protection (no DB)", () => {
  it("requires auth to track a booking", async () => {
    const res = await request(app).get(
      "/api/v1/bookings/665f0c2a1a1a1a1a1a1a1a1a/track",
    );
    expect(res.status).toBe(401);
  });
});
