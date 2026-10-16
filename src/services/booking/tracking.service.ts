import Booking from "../../models/Booking";
import { publish, bookingChannel } from "../realtime/sse";
import { haversineKm } from "../../utils/locationLookup";
import { completeBooking } from "./lifecycle.service";
import type { BookingStatus } from "../../types/booking.types";

// When the van is within this ETA of the pickup, tell the passenger to walk.
const ALERT_THRESHOLD_MIN = 3;
const URBAN_SPEED_KMH = 25;
// Van within this distance of the destination auto-ends the passenger's trip.
const DESTINATION_RADIUS_KM = 0.15; // 150 m
const TRACK_STATUSES: BookingStatus[] = ["accepted", "arrived", "in_progress"];

export { bookingChannel };

/**
 * Push the van's new position to every passenger tracking a booking on this run,
 * and fire a one-time "head to pickup" alert when the van gets close.
 *
 * Called on each driver GPS heartbeat. ETA here is a cheap straight-line
 * estimate (frequent + keyless); a Google-backed ETA can be layered on a slower
 * cadence to avoid per-tick API cost.
 */
export const broadcastRunLocation = async (run: any): Promise<void> => {
  const bookings = await Booking.find({
    run: run._id,
    status: { $in: TRACK_STATUSES },
  });
  if (!bookings.length) return;

  const vanLng = run.currentLocation.coordinates[0];
  const vanLat = run.currentLocation.coordinates[1];

  for (const booking of bookings) {
    const pLat = booking.pickupPoint?.latitude;
    const pLng = booking.pickupPoint?.longitude;

    let etaMinutes: number | null = null;
    if (pLat != null && pLng != null) {
      const km = haversineKm(vanLat, vanLng, pLat, pLng);
      etaMinutes = Math.max(0, Math.round((km / URBAN_SPEED_KMH) * 60));
    }

    const channel = bookingChannel(String(booking._id));
    publish(channel, "van_location", {
      van: { latitude: vanLat, longitude: vanLng },
      etaMinutes,
      pickupPoint: booking.pickupPoint,
      status: booking.status,
    });

    if (
      etaMinutes != null &&
      etaMinutes <= ALERT_THRESHOLD_MIN &&
      !booking.pickupAlertSent
    ) {
      publish(channel, "head_to_pickup", {
        pickupPoint: booking.pickupPoint,
        etaMinutes,
      });
      booking.pickupAlertSent = true;
      await booking.save();
    }

    // Geofence auto-complete: once a trip is in progress and the van reaches the
    // passenger's destination, end the trip automatically (settles the fare,
    // frees the seat). completeBooking is idempotent, so a later tick is a no-op.
    if (booking.status === "in_progress") {
      const dLat = booking.destination?.latitude;
      const dLng = booking.destination?.longitude;
      if (dLat != null && dLng != null) {
        const toDest = haversineKm(vanLat, vanLng, dLat, dLng);
        if (toDest <= DESTINATION_RADIUS_KM) {
          await completeBooking(String(booking._id));
        }
      }
    }
  }
};
