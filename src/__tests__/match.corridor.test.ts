import { assessCorridor } from "../services/booking/match.service";
import { encodePolyline, decodePolyline, type Point } from "../utils/polyline";

// A straight west->east route along lat 5.50, lng -0.30 .. -0.10.
const route: Point[] = Array.from({ length: 11 }, (_, i) => ({
  lat: 5.5,
  lng: -0.3 + i * 0.02,
}));
const VAN_START = { lat: 5.5, lng: -0.3 }; // index 0
const PICKUP = { lat: 5.5, lng: -0.26 }; // ~index 2
const DEST_AHEAD = { lat: 5.5, lng: -0.14 }; // ~index 8

describe("Matching — route corridor + direction", () => {
  it("serves a trip whose destination is ahead on the route", () => {
    const r = assessCorridor(route, VAN_START, PICKUP, DEST_AHEAD);
    expect(r.serves).toBe(true);
    expect(r.pickupPoint?.lng).toBeCloseTo(-0.26, 2);
  });

  it("does NOT serve when the destination is behind the pickup", () => {
    const destBehind = { lat: 5.5, lng: -0.28 }; // index ~1, before pickup
    expect(assessCorridor(route, VAN_START, PICKUP, destBehind).serves).toBe(false);
  });

  it("does NOT serve when the destination is far off the route", () => {
    const offRoute = { lat: 5.6, lng: -0.14 }; // ~11 km north of the line
    expect(assessCorridor(route, VAN_START, PICKUP, offRoute).serves).toBe(false);
  });

  it("does NOT serve when the van has already passed the pickup", () => {
    const vanPast = { lat: 5.5, lng: -0.2 }; // index ~5, past pickup (index ~2)
    expect(assessCorridor(route, vanPast, PICKUP, DEST_AHEAD).serves).toBe(false);
  });
});

describe("Polyline encode/decode round-trip", () => {
  it("recovers the original points", () => {
    const encoded = encodePolyline(route);
    const decoded = decodePolyline(encoded);
    expect(decoded).toHaveLength(route.length);
    decoded.forEach((pt, i) => {
      expect(pt.lat).toBeCloseTo(route[i].lat, 5);
      expect(pt.lng).toBeCloseTo(route[i].lng, 5);
    });
  });
});
