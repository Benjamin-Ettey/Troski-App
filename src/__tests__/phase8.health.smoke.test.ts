import request from "supertest";
import app from "../app";

describe("Phase 8 — health endpoint (no DB)", () => {
  it("GET /healthz returns 200 with status + db state", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body).toHaveProperty("db");
    expect(res.body).toHaveProperty("uptime");
  });
});
