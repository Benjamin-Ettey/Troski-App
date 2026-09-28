import "dotenv/config";
import { mapsService, isMapsConfigured } from "../src/services/maps/maps.service";

/**
 * Manual Phase 2 check: exercises the real Google Maps integration end-to-end.
 *
 *   npx tsx scripts/maps-check.ts
 *   npx tsx scripts/maps-check.ts "Kaneshie Market, Accra" "37 Military Hospital, Accra"
 *
 * Requires GOOGLE_MAPS_API_KEY in .env with Geocoding, Distance Matrix and
 * Directions APIs enabled.
 */
const origin = process.argv[2] || "Kaneshie Market, Accra";
const destination = process.argv[3] || "Achimota, Accra";

const main = async (): Promise<void> => {
  if (!isMapsConfigured()) {
    console.error(
      "GOOGLE_MAPS_API_KEY is not set in .env — add your key and retry.",
    );
    process.exit(1);
  }

  console.log(`Origin:      ${origin}`);
  console.log(`Destination: ${destination}\n`);

  const o = await mapsService.geocodeAddress(origin);
  const d = await mapsService.geocodeAddress(destination);
  console.log("Geocoded origin:     ", o);
  console.log("Geocoded destination:", d, "\n");

  const dist = await mapsService.getRoadDistance(
    { lat: o.lat, lng: o.lng },
    { lat: d.lat, lng: d.lng },
  );
  console.log("Road distance / ETA:", dist, "\n");

  const dir = await mapsService.getDirections(
    { lat: o.lat, lng: o.lng },
    { lat: d.lat, lng: d.lng },
  );
  console.log("Directions:", {
    distanceKm: dir.distanceKm,
    durationMin: dir.durationMin,
    polylinePreview: dir.polyline.slice(0, 40) + "...",
  });

  console.log("\n✓ Google Maps integration is working.");
};

main().catch((e) => {
  console.error("\n✗ Maps check failed:", e?.message || e);
  process.exit(1);
});
