import request from "supertest";
import app from "../app";

// These checks need NO database: they exercise route mounting and the auth
// guard's rejection path (which returns 401 before any DB access). They verify
// the Phase 1 endpoints are wired and protected.
describe("Phase 1 — route wiring & protection (no DB)", () => {
  it("admin driver review queue requires auth", async () => {
    const res = await request(app).get("/api/v1/admin/drivers");
    expect(res.status).toBe(401);
  });

  it("admin vehicle review queue requires auth", async () => {
    const res = await request(app).get("/api/v1/admin/vehicles");
    expect(res.status).toBe(401);
  });

  it("admin driver detail requires auth", async () => {
    const res = await request(app).get("/api/v1/admin/drivers/123");
    expect(res.status).toBe(401);
  });

  it("driver 'my status' requires auth", async () => {
    const res = await request(app).get("/api/v1/driver/status");
    expect(res.status).toBe(401);
  });

  it("unknown route returns 404", async () => {
    const res = await request(app).get("/api/v1/nope");
    expect(res.status).toBe(404);
  });
});
