// Per-zone pricing for fare calculation. Each zone has its own base fare,
// per-km rate, and minimum. Known popular routes override the formula
// with a flat rate via the `routes` map.

const zonesConfig = {
  ACCRA_CBD: { baseFare: 1.5, perKm: 0.95, minFare: 6 },
  NORTH_ACC: { baseFare: 2.1, perKm: 0.85, minFare: 7 },
  EAST_ACC: { baseFare: 2.1, perKm: 0.85, minFare: 7 },
  WEST_ACC: { baseFare: 2.5, perKm: 0.8, minFare: 8 },
  CENTRAL_ACC: { baseFare: 1.5, perKm: 0.8, minFare: 6 },

  KUMASI_CBD: { baseFare: 1.5, perKm: 0.4, minFare: 2.5 },
  KUMASI_NORTH: { baseFare: 2.0, perKm: 0.35, minFare: 3.0 },
  KUMASI_SOUTH: { baseFare: 2.0, perKm: 0.35, minFare: 3.0 },
  KUMASI_EAST: { baseFare: 2.0, perKm: 0.35, minFare: 3.5 },
  KUMASI_WEST: { baseFare: 2.0, perKm: 0.35, minFare: 3.5 },

  TAKORADI_CORE: { baseFare: 1.5, perKm: 0.45, minFare: 3.5 },
  TAKORADI_OUTSKIRTS: { baseFare: 2.0, perKm: 0.4, minFare: 4.5 },
  CAPE_COAST_CORE: { baseFare: 1.5, perKm: 0.45, minFare: 3.5 },
  CAPE_COAST_OUTSKIRTS: { baseFare: 2.0, perKm: 0.4, minFare: 4.5 },

  TAMALE_CORE: { baseFare: 1.2, perKm: 0.3, minFare: 2.5 },
  SUNYANI_CORE: { baseFare: 1.2, perKm: 0.3, minFare: 2.5 },
  HO_CORE: { baseFare: 1.2, perKm: 0.3, minFare: 2.5 },
  WA_CORE: { baseFare: 1.2, perKm: 0.3, minFare: 2.5 },
  BOLGA_CORE: { baseFare: 1.2, perKm: 0.3, minFare: 2.5 },
  TECHIMAN_CORE: { baseFare: 1.2, perKm: 0.3, minFare: 2.5 },

  REGIONAL_RURAL: { baseFare: 1.0, perKm: 0.35, minFare: 2.0 },

  routes: {
    "ACCRA_CBD-NORTH_ACC": 3.5,
    "ACCRA_CBD-EAST_ACC": 4.0,
    "ACCRA_CBD-WEST_ACC": 4.5,
    "NORTH_ACC-WEST_ACC": 4.0,
    "KUMASI_CBD-KUMASI_NORTH": 2.5,
    "KUMASI_CBD-KUMASI_SOUTH": 2.5,
    "TAKORADI_CORE-TAKORADI_OUTSKIRTS": 2.5,
    "CAPE_COAST_CORE-CAPE_COAST_OUTSKIRTS": 2.5,
  },
};

module.exports = zonesConfig;
