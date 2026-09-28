import { StatusCodes } from "http-status-codes";
import {
  createMapsService,
  mapsService,
  MapsError,
} from "../services/maps/maps.service";
import { estimateFareService } from "../services/booking/booking.service";

// A fake Google client — no network. Shapes mirror the real library responses.
const fakeClient: any = {
  geocode: async () => ({
    data: {
      status: "OK",
      results: [
        {
          geometry: { location: { lat: 5.5502, lng: -0.2337 } },
          formatted_address: "Kaneshie, Accra, Ghana",
          place_id: "PLACE_123",
        },
      ],
    },
  }),
  reverseGeocode: async () => ({
    data: {
      results: [
        {
          geometry: { location: { lat: 5.6037, lng: -0.187 } },
          formatted_address: "Achimota, Accra, Ghana",
          place_id: "PLACE_456",
        },
      ],
    },
  }),
  distancematrix: async () => ({
    data: {
      rows: [
        {
          elements: [
            {
              status: "OK",
              distance: { value: 5200, text: "5.2 km" },
              duration: { value: 900, text: "15 mins" },
            },
          ],
        },
      ],
    },
  }),
  directions: async () => ({
    data: {
      routes: [
        {
          overview_polyline: { points: "_p~iF~ps|U_ulLnnqC" },
          legs: [
            {
              distance: { value: 5200, text: "5.2 km" },
              duration: { value: 900, text: "15 mins" },
            },
          ],
        },
      ],
    },
  }),
};

describe("Phase 2 — maps.service parsing (fake client)", () => {
  const svc = createMapsService(fakeClient, "test-key");

  it("geocodes an address", async () => {
    const r = await svc.geocodeAddress("Kaneshie");
    expect(r).toEqual({
      lat: 5.5502,
      lng: -0.2337,
      formattedAddress: "Kaneshie, Accra, Ghana",
      placeId: "PLACE_123",
    });
  });

  it("parses distance (m→km) and duration (s→min)", async () => {
    const r = await svc.getRoadDistance(
      { lat: 5.55, lng: -0.23 },
      { lat: 5.6, lng: -0.18 },
    );
    expect(r.distanceKm).toBe(5.2);
    expect(r.durationMin).toBe(15);
    expect(r.distanceText).toBe("5.2 km");
  });

  it("returns the route polyline + distance + time from directions", async () => {
    const r = await svc.getDirections(
      { lat: 5.55, lng: -0.23 },
      { lat: 5.6, lng: -0.18 },
    );
    expect(r.polyline).toBe("_p~iF~ps|U_ulLnnqC");
    expect(r.distanceKm).toBe(5.2);
    expect(r.durationMin).toBe(15);
  });

  it("throws MapsError when the API key is missing", async () => {
    const unconfigured = createMapsService(fakeClient, "");
    await expect(unconfigured.geocodeAddress("x")).rejects.toBeInstanceOf(
      MapsError,
    );
  });

  it("throws MapsError when a distance element is not OK", async () => {
    const badClient: any = {
      ...fakeClient,
      distancematrix: async () => ({
        data: { rows: [{ elements: [{ status: "ZERO_RESULTS" }] }] },
      }),
    };
    const svcBad = createMapsService(badClient, "test-key");
    await expect(
      svcBad.getRoadDistance({ lat: 0, lng: 0 }, { lat: 1, lng: 1 }),
    ).rejects.toBeInstanceOf(MapsError);
  });
});

describe("Phase 2 — fare estimate falls back to straight-line when Google is unavailable", () => {
  it("still returns a valid fare (no DB, no network needed)", async () => {
    // The default mapsService singleton has no key in the test env, so
    // getRoadDistance throws and quoteFare falls back to haversine.
    const result = await estimateFareService("Goaso", "Mim", 2);

    expect(result.status).toBe(StatusCodes.OK);
    expect(result.data.distanceKm).toBeGreaterThan(0);
    expect(result.data.total).toBeGreaterThan(0);
    // With no key configured, the singleton cannot reach Google.
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
    expect(typeof r.formattedAddress).toBe("string");
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
