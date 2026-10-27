import { resolvePlace, nearestTown } from "../utils/locationLookup";

// Offline: resolvePlace lets pickup/destination be a dropped pin (coords) or a
// town name, deriving the pricing zone from the nearest dataset town.
describe("Flexible locations — resolvePlace", () => {
  it("resolves a dropped pin (coordinates) to the exact point + a zone", () => {
    const p = resolvePlace({ lat: 5.55, lng: -0.23 });
    expect(p).not.toBeNull();
    expect(p!.latitude).toBe(5.55); // keeps the exact point...
    expect(p!.longitude).toBe(-0.23);
    expect(typeof p!.zoneId).toBe("string"); // ...and borrows a pricing zone

    // The zone is the nearest town's zone.
    const near = nearestTown(5.55, -0.23);
    expect(p!.zoneId).toBe(near!.zoneId);
  });

  it("still resolves a town name", () => {
    const p = resolvePlace({ town: "Mim" });
    expect(p?.town).toBe("Mim");
    expect(p?.latitude).toBeDefined();
  });

  it("returns null when neither coordinates nor town is given", () => {
    expect(resolvePlace({})).toBeNull();
  });

  it("prefers coordinates over a town name when both are present", () => {
    const p = resolvePlace({ lat: 6.0, lng: -1.0, town: "Mim" });
    expect(p!.latitude).toBe(6.0);
    expect(p!.longitude).toBe(-1.0);
  });
});
