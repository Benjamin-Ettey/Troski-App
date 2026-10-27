import request from "supertest";
import app from "../app";

describe("Booking Phase 7 — demand route protection (no DB)", () => {
  it("requires auth to check demand status", async () => {
    const res = await request(app).get("/api/v1/bookings/demand/abc");
    expect(res.status).toBe(401);
  });

  it("requires auth to list driver demand", async () => {
    const res = await request(app).get("/api/v1/driver/demand");
    expect(res.status).toBe(401);
  });

  it("requires auth to accept demand", async () => {
    const res = await request(app).post("/api/v1/driver/demand/abc/accept");
    expect(res.status).toBe(401);
  });
});
