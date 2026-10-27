import {
  subscribe,
  publish,
  handleBackplaneMessage,
} from "../services/realtime/sse";
import {
  isRedisEnabled,
  geoNearby,
  geoUpsert,
  geoRemove,
} from "../services/realtime/redis";

const makeRes = () => {
  const writes: string[] = [];
  const res: any = {
    writes,
    setHeader() {},
    flushHeaders() {},
    write(c: string) {
      writes.push(c);
      return true;
    },
    on() {},
  };
  return res;
};

// With no REDIS_URL (the default, incl. this test env) everything falls back to
// the in-process SSE hub + Mongo 2dsphere.
describe("Phase 8 — Redis-disabled fallback", () => {
  it("reports Redis disabled without REDIS_URL", () => {
    expect(isRedisEnabled()).toBe(false);
  });

  it("GEO helpers are safe no-ops when disabled", async () => {
    expect(await geoNearby(-0.2, 5.6, 5)).toBeNull(); // caller uses Mongo
    await expect(geoUpsert("run1", -0.2, 5.6)).resolves.toBeUndefined();
    await expect(geoRemove("run1")).resolves.toBeUndefined();
  });

  it("publish delivers in-process when Redis is disabled", () => {
    const res = makeRes();
    subscribe("booking:R1", res);
    publish("booking:R1", "van_location", { x: 1 });
    expect(res.writes.join("")).toContain("event: van_location");
  });
});

// This is the logic Redis would invoke on each instance: a backplane message is
// delivered to that instance's local subscribers. Testable without real Redis.
describe("Phase 8 — SSE backplane delivery (cross-instance path)", () => {
  it("delivers a backplane message to local subscribers", () => {
    const res = makeRes();
    subscribe("booking:R2", res);
    handleBackplaneMessage(
      JSON.stringify({
        channel: "booking:R2",
        event: "head_to_pickup",
        data: { etaMinutes: 2 },
      }),
    );
    expect(res.writes.join("")).toContain("event: head_to_pickup");
    expect(res.writes.join("")).toContain('"etaMinutes":2');
  });

  it("ignores a malformed backplane message", () => {
    expect(() => handleBackplaneMessage("not-json")).not.toThrow();
  });
});
