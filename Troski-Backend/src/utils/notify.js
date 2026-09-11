// Centralized notification helper.
//
// Controllers should ALWAYS call this rather than creating Notification
// docs directly. It writes the DB row AND pushes a real-time event over
// socket.io to the user's personal room, so frontends with an open socket
// see the notification instantly without polling.
//
// Errors are swallowed (logged) — a failed notification should never break
// the surrounding business operation. Best-effort only.

const Notification = require("../models/notifications");
const { emit } = require("../socket/emit");

/**
 * @param {object} params
 * @param {ObjectId|string} params.userId            — who's the notification for
 * @param {string}          params.type              — one of Notification.type enum
 * @param {string}          params.title             — short headline
 * @param {string}          params.message           — body text
 * @param {ObjectId|string} [params.relatedBooking]
 * @param {ObjectId|string} [params.relatedTrip]
 */
async function notify({
  userId,
  type,
  title,
  message,
  relatedBooking,
  relatedTrip,
}) {
  try {
    const doc = await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedBooking: relatedBooking || null,
      relatedTrip: relatedTrip || null,
    });

    // Real-time push to the user's personal socket room. Frontend listens
    // for `notification:new` and prepends to its notification list.
    emit.toUser(userId, "notification:new", {
      _id: doc._id,
      type: doc.type,
      title: doc.title,
      message: doc.message,
      relatedBooking: doc.relatedBooking,
      relatedTrip: doc.relatedTrip,
      createdAt: doc.createdAt,
      read: false,
    });

    return doc;
  } catch (err) {
    console.error("notify() failed", { userId, type, error: err.message });
    return null;
  }
}

module.exports = { notify };
