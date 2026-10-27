import {
  subscribe,
  publish,
  sendTo,
  subscriberCount,
} from "../services/realtime/sse";

// Minimal fake Express Response that records what was written.
const makeRes = () => {
  const writes: string[] = [];
  let closeCb: (() => void) | undefined;
  const res: any = {
    writes,
    setHeader() {},
    flushHeaders() {},
    write(chunk: string) {
      writes.push(chunk);
      return true;
    },
    on(event: string, cb: () => void) {
      if (event === "close") closeCb = cb;
    },
    triggerClose() {
      closeCb?.();
    },
  };
  return res;
};

describe("Booking Phase 5 — SSE hub", () => {
  it("delivers published events to subscribers of a channel", () => {
    const res = makeRes();
    subscribe("booking:A", res);
    expect(subscriberCount("booking:A")).toBe(1);

    publish("booking:A", "van_location", { van: { latitude: 5.5, longitude: -0.2 } });

    const joined = res.writes.join("");
    expect(joined).toContain("event: van_location");
    expect(joined).toContain('"latitude":5.5');
  });

  it("does not deliver to other channels", () => {
    const a = makeRes();
    const b = makeRes();
    subscribe("booking:X", a);
    subscribe("booking:Y", b);

    publish("booking:X", "ping", { n: 1 });
    expect(a.writes.join("")).toContain("event: ping");
    expect(b.writes.join("")).not.toContain("event: ping");
  });

  it("sendTo writes to a single response", () => {
    const res = makeRes();
    sendTo(res, "snapshot", { ok: true });
    expect(res.writes.join("")).toContain("event: snapshot");
  });

  it("removes a subscriber on close", () => {
    const res = makeRes();
    subscribe("booking:Z", res);
    expect(subscriberCount("booking:Z")).toBe(1);
    res.triggerClose();
    expect(subscriberCount("booking:Z")).toBe(0);
  });
});
