import { assessTiming } from "../services/booking/match.service";

// readyIn = walk + buffer (default 2). feasible = readyIn <= vanEta AND
// wait (vanEta - readyIn) <= maxWait (default 10).
describe("Matching — readiness-vs-arrival feasibility", () => {
  it("is feasible when the passenger is ready before the van arrives", () => {
    // walk 7 (+2 buffer = 9) vs van 11 -> catchable, 2 min wait (the example)
    const t = assessTiming(7, 11);
    expect(t.readyIn).toBe(9);
    expect(t.waitMin).toBe(2);
    expect(t.feasible).toBe(true);
  });

  it("is NOT feasible when the van passes before the passenger is ready", () => {
    // walk 5 (+2 = 7) vs van 4 -> passenger misses it
    const t = assessTiming(5, 4);
    expect(t.feasible).toBe(false);
  });

  it("is NOT feasible when the wait would be too long", () => {
    // ready in 3, van in 20 -> 17 min wait > default max (10)
    const t = assessTiming(1, 20);
    expect(t.waitMin).toBe(17);
    expect(t.feasible).toBe(false);
  });

  it("respects custom buffer and max-wait", () => {
    expect(assessTiming(5, 6, 0, 10).feasible).toBe(true); // no buffer: ready 5 <= 6
    expect(assessTiming(5, 30, 2, 5).feasible).toBe(false); // wait 23 > 5
  });
});
