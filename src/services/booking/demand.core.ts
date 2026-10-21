import { latLngToCell, gridDisk } from "h3-js";

/**
 * Pure demand-clustering logic (uses h3-js, which is pure JS — offline
 * testable). H3 is Uber's hexagonal grid: every point maps to a fixed cell at a
 * chosen resolution, so we can bucket passengers by "same area". Resolution 8
 * gives ~0.46 km hex edges — a walkable cluster. We also merge a cell with its
 * immediate neighbours (gridDisk k=1) so a cluster isn't split by a hex boundary.
 */

export const DEMAND_H3_RES = 8;
export const MIN_CLUSTER = 5;

/** Map a coordinate to its H3 cell at the demand resolution. */
export const toCell = (lat: number, lng: number): string =>
  latLngToCell(lat, lng, DEMAND_H3_RES);

export type DemandItem = {
  id: string;
  h3: string;
  destZone: string;
  lat: number;
  lng: number;
  seats: number;
};

export type Cluster = {
  destZone: string;
  requestIds: string[];
  centroid: { lat: number; lng: number };
  passengerCount: number;
  totalSeats: number;
};

const centroidOf = (items: DemandItem[]): { lat: number; lng: number } => {
  const n = items.length;
  const sum = items.reduce(
    (acc, it) => ({ lat: acc.lat + it.lat, lng: acc.lng + it.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / n, lng: sum.lng / n };
};

/**
 * Form clusters from pending demand. Groups by destination zone, then greedily
 * builds clusters of passengers in the same H3 cell (plus adjacent cells). A
 * cluster is emitted only when it reaches `minCluster` passengers.
 */
export const formClusters = (
  items: DemandItem[],
  minCluster = MIN_CLUSTER,
): Cluster[] => {
  const byDest = new Map<string, DemandItem[]>();
  for (const it of items) {
    const list = byDest.get(it.destZone) ?? [];
    list.push(it);
    byDest.set(it.destZone, list);
  }

  const clusters: Cluster[] = [];

  for (const [destZone, group] of byDest) {
    const cellMap = new Map<string, DemandItem[]>();
    for (const it of group) {
      const list = cellMap.get(it.h3) ?? [];
      list.push(it);
      cellMap.set(it.h3, list);
    }

    const visited = new Set<string>();
    // Deterministic order so clustering is reproducible.
    const cells = [...cellMap.keys()].sort();

    for (const cell of cells) {
      // Gather unvisited passengers in this cell + its immediate neighbours.
      const neighbourCells = gridDisk(cell, 1);
      const members: DemandItem[] = [];
      for (const nc of neighbourCells) {
        for (const it of cellMap.get(nc) ?? []) {
          if (!visited.has(it.id)) members.push(it);
        }
      }

      if (members.length >= minCluster) {
        members.forEach((m) => visited.add(m.id));
        clusters.push({
          destZone,
          requestIds: members.map((m) => m.id),
          centroid: centroidOf(members),
          passengerCount: members.length,
          totalSeats: members.reduce((s, m) => s + m.seats, 0),
        });
      }
    }
  }

  return clusters;
};
