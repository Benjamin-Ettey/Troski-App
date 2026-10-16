import { StatusCodes } from "http-status-codes";
import {
  createMapsService,
  mapsService,
  MapsError,
  type FetchLike,
} from "../services/maps/maps.service";
import { estimateFareService } from "../services/booking/booking.service";

// Fake fetch that answers by URL: Geocoding API vs Routes API vs Route Matrix.
const fakeFetch: FetchLike = async (url) => {
  if (url.includes("/geocode/json")) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        status: "OK",
        results: [
          {
            geometry: { location: { lat: 5.5502, lng: -0.2337 } },
            formatted_address: "Kaneshie, Accra, Ghana",
            place_id: "PLACE_123",
          },
        ],
      }),
    };
  }
  if (url.includes("computeRoutes")) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        routes: [
          {
            distanceMeters: 5200,
            duration: "900s",
            polyline: { encodedPolyline: "_p~iF~ps|U" },
          },
        ],
      }),
    };
  }
  if (url.includes("computeRouteMatrix")) {
    return {
      ok: true,
      status: 200,
      json: async () => [
        {
          originIndex: 0,
          destinationIndex: 0,
          distanceMeters: 5200,
          duration: "900s",
          condition: "ROUTE_EXISTS",
        },
      ],
    };
  }
  return { ok: false, status: 404, json: async () => ({}) };
};

describe("Phase 2 — maps.service parsing (Routes + Geocoding, fake fetch)", () => {
  const svc = createMapsService({ apiKey: "test-key", fetchFn: fakeFetch });

  it("geocodes an address", async () => {
    const r = await svc.geocodeAddress("Kaneshie");
    expect(r).toEqual({
      lat: 5.5502,
      lng: -0.2337,
      formattedAddress: "Kaneshie, Accra, Ghana",
      placeId: "PLACE_123",
    });
  });

  it("gets road distance + ETA from the Routes API", async () => {
    const r = await svc.getRoadDistance(
      { lat: 5.55, lng: -0.23 },
      { lat: 5.6, lng: -0.18 },
    );
    expect(r.distanceKm).toBe(5.2);
    expect(r.durationMin).toBe(15);
  });

  it("returns an encoded polyline from directions", async () => {
    const r = await svc.getDirections(
      { lat: 5.55, lng: -0.23 },
      { lat: 5.6, lng: -0.18 },
    );
    expect(r.polyline).toBe("_p~iF~ps|U");
    expect(r.distanceKm).toBe(5.2);
  });

  it("computes a route matrix", async () => {
    const cells = await svc.computeRouteMatrix(
      [{ lat: 5.55, lng: -0.23 }],
      [{ lat: 5.6, lng: -0.18 }],
    );
    expect(cells).toHaveLength(1);
    expect(cells[0].durationMin).toBe(15);
  });

  it("throws MapsError when the key is missing", async () => {
    const unconfigured = createMapsService({ apiKey: "", fetchFn: fakeFetch });
    await expect(unconfigured.geocodeAddress("x")).rejects.toBeInstanceOf(
      MapsError,
    );
  });
});

describe("Phase 2 — fare estimate falls back when Google is unavailable", () => {
  it("still returns a valid fare (no DB, no network needed)", async () => {
    // The singleton has no key in the test env, so quoteFare falls back to
    // straight-line distance.
    const result = await estimateFareService("Goaso", "Mim", 2);
    expect(result.status).toBe(StatusCodes.OK);
    expect(result.data.distanceKm).toBeGreaterThan(0);
    expect(result.data.total).toBeGreaterThan(0);
    expect(mapsService).toBeDefined();
  });
});

// Live suite — only runs when a real key is present (i.e. in your environment).
const liveDescribe = process.env.GOOGLE_MAPS_API_KEY ? describe : describe.skip;

liveDescribe("Phase 2 — live Google Maps (needs GOOGLE_MAPS_API_KEY)", () => {
  it("geocodes a real Accra address", async () => {
    const r = await mapsService.geocodeAddress("Kaneshie Market, Accra");
    expect(r.lat).toBeGreaterThan(4);
    expect(r.lat).toBeLessThan(12);
  });

  it("returns a real road distance + ETA", async () => {
    const r = await mapsService.getRoadDistance(
      { lat: 5.5502, lng: -0.2337 },
      { lat: 5.6037, lng: -0.187 },
    );
    expect(r.distanceKm).toBeGreaterThan(0);
    expect(r.durationMin).toBeGreaterThan(0);
  });
});
