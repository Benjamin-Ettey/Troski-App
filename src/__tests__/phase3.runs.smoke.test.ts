import request from "supertest";
import app from "../app";

// No DB needed: the auth guard rejects unauthenticated callers before any DB
// access, confirming the run routes are mounted and protected.
describe("Booking Phase 3 — run routes require auth (no DB)", () => {
  it("get active run requires auth", async () => {
    const res = await request(app).get("/api/v1/driver/runs/active");
    expect(res.status).toBe(401);
  });

  it("start run requires auth", async () => {
    const res = await request(app)
      .post("/api/v1/driver/runs/start")
      .send({ fromTown: "Goaso", toTown: "Mim" });
    expect(res.status).toBe(401);
  });

  it("location heartbeat requires auth", async () => {
    const res = await request(app)
      .patch("/api/v1/driver/runs/location")
      .send({ latitude: 5.56, longitude: -0.2 });
    expect(res.status).toBe(401);
  });

  it("seats update requires auth", async () => {
    const res = await request(app)
      .patch("/api/v1/driver/runs/seats")
      .send({ delta: -1 });
    expect(res.status).toBe(401);
  });
});
