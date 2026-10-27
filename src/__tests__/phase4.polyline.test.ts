import { decodePolyline, nearestPointOnPath } from "../utils/polyline";

describe("Booking Phase 4 — polyline decode", () => {
  it("decodes Google's canonical example", () => {
    // From Google's docs: decodes to (38.5,-120.2),(40.7,-120.95),(43.252,-126.453)
    const pts = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
    expect(pts).toHaveLength(3);
    expect(pts[0].lat).toBeCloseTo(38.5, 4);
    expect(pts[0].lng).toBeCloseTo(-120.2, 4);
    expect(pts[2].lat).toBeCloseTo(43.252, 3);
    expect(pts[2].lng).toBeCloseTo(-126.453, 3);
  });

  it("finds the nearest point on a path (near a vertex)", () => {
    const path = [
      { lat: 5.55, lng: -0.23 },
      { lat: 5.6, lng: -0.18 },
      { lat: 5.65, lng: -0.13 },
    ];
    const near = nearestPointOnPath(path, 5.61, -0.179);
    // Closest spot is right around the middle vertex (5.6, -0.18).
    expect(near?.point.lat).toBeCloseTo(5.6, 1);
    expect(near?.point.lng).toBeCloseTo(-0.18, 1);
    expect(near!.distanceKm).toBeLessThan(2);
  });

  it("projects onto a segment, not just the vertices", () => {
    // A single long straight segment; the passenger sits beside its middle.
    const path = [
      { lat: 5.5, lng: -0.3 },
      { lat: 5.5, lng: -0.1 },
    ];
    const near = nearestPointOnPath(path, 5.52, -0.2);
    // Nearest point should be mid-segment (~lng -0.2), not an endpoint.
    expect(near?.point.lng).toBeCloseTo(-0.2, 2);
    expect(near?.point.lat).toBeCloseTo(5.5, 2);
  });

  it("returns null for an empty path", () => {
    expect(nearestPointOnPath([], 5, -0.2)).toBeNull();
  });
});
