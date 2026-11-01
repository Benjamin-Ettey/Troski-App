import Booking from "../../models/Booking";
import { publish, bookingChannel } from "../realtime/sse";
import { haversineKm } from "../../utils/locationLookup";
import { completeBooking } from "./lifecycle.service";
import type { BookingStatus } from "../../types/booking.types";

const ALERT_THRESHOLD_MIN = 3;
const URBAN_SPEED_KMH = 25;
const DESTINATION_RADIUS_KM = 0.15;
const TRACK_STATUSES: BookingStatus[] = ["accepted", "arrived", "in_progress"];

export { bookingChannel };

export const broadcastRunLocation = async (run: any): Promise<void> => {
  const bookings = await Booking.find({
    run: run._id,
    status: { $in: TRACK_STATUSES },
  });
  if (!bookings.length) return;

  const vanLng = run.currentLocation.coordinates[0];
  const vanLat = run.currentLocation.coordinates[1];

  for (const booking of bookings) {
    // ENFORCEMENT: Halt event broadcasting for this passenger if ride is locked
    const canAccess =
      booking.paymentMethod === "cash" ||
      booking.paymentStatus === "escrow_held";
    if (!canAccess) continue;

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
