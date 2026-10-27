import { latLngToCell, gridDisk, cellToLatLng } from "h3-js";
import {
  formClusters,
  toCell,
  DEMAND_H3_RES,
  type DemandItem,
} from "../services/booking/demand.core";

const item = (
  id: string,
  lat: number,
  lng: number,
  destZone = "NORTH_ACC",
  seats = 1,
): DemandItem => ({ id, lat, lng, destZone, seats, h3: toCell(lat, lng) });

describe("Booking Phase 7 — demand clustering (H3)", () => {
  it("forms a cluster when >= 5 passengers share an area + destination", () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      item(`r${i}`, 5.6 + i * 0.0003, -0.2 + i * 0.0003),
    );
    const clusters = formClusters(items);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].passengerCount).toBe(5);
    expect(clusters[0].totalSeats).toBe(5);
  });

  it("does not form a cluster below the threshold", () => {
    const items = Array.from({ length: 4 }, (_, i) =>
      item(`r${i}`, 5.6 + i * 0.0003, -0.2 + i * 0.0003),
    );
    expect(formClusters(items)).toHaveLength(0);
  });

  it("does not merge passengers heading to different destinations", () => {
    const items = [
      ...Array.from({ length: 3 }, (_, i) => item(`a${i}`, 5.6, -0.2, "NORTH_ACC")),
      ...Array.from({ length: 3 }, (_, i) => item(`b${i}`, 5.6, -0.2, "EAST_ACC")),
    ];
    // 3 + 3 to different zones — neither reaches 5.
    expect(formClusters(items)).toHaveLength(0);
  });

  it("merges passengers in adjacent H3 cells (not split by a hex boundary)", () => {
    const base = latLngToCell(5.6, -0.2, DEMAND_H3_RES);
    const neighbour = gridDisk(base, 1).find((c) => c !== base)!;
    const [nLat, nLng] = cellToLatLng(neighbour);

    const items = [
      item("a1", 5.6, -0.2),
      item("a2", 5.6001, -0.2001),
      item("a3", 5.5999, -0.1999),
      item("b1", nLat, nLng),
      item("b2", nLat, nLng),
    ];
    // 3 in the base cell + 2 in an adjacent cell = one cluster of 5.
    const clusters = formClusters(items);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].passengerCount).toBe(5);
  });
});
