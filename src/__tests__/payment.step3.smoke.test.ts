import request from "supertest";
import app from "../app";

// No DB needed: the webhook rejects bad signatures before any DB access, and the
// payment routes reject unauthenticated callers at the auth guard.
describe("Payments Step 3 — webhook & route protection (no DB)", () => {
  it("rejects a webhook with a bad signature", async () => {
    const res = await request(app)
      .post("/api/v1/payments/webhook")
      .set("x-paystack-signature", "not-a-real-signature")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ event: "charge.success", data: { reference: "x" } }));
    expect(res.status).toBe(401);
  });

  it("rejects a webhook with no signature", async () => {
    const res = await request(app)
      .post("/api/v1/payments/webhook")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ event: "charge.success" }));
    expect(res.status).toBe(401);
  });

  it("requires auth to initialize a payment", async () => {
    const res = await request(app)
      .post("/api/v1/payments/initialize")
      .send({ bookingId: "abc" });
    expect(res.status).toBe(401);
  });

  it("requires auth to verify a payment", async () => {
    const res = await request(app).get("/api/v1/payments/ref123/verify");
    expect(res.status).toBe(401);
  });
});
