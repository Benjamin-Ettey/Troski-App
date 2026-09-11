// Centralized socket emit helpers.
//
// Controllers should NEVER import the io instance directly. They call these
// helpers. The helpers are no-ops until socket/index.js initializes them
// with the live io instance, so they're safe to call at startup before the
// HTTP/socket server has actually booted.
//
// Rooms convention:
//   driver:<driverId>   — every connected socket for that driver
//   trip:<tripId>       — every passenger booked into that trip, plus the
//                         assigned driver (if any)
//   pool:drivers        — every online driver. Used for "any driver"
//                         broadcasts (e.g. "trip:removed" when one is taken).

let ioRef = null;

const init = (io) => {
  ioRef = io;
};

const safeEmit = (room, event, payload) => {
  if (!ioRef) return; // sockets not initialized yet
  ioRef.to(room).emit(event, payload);
};

const emit = {
  toDriver(driverId, event, payload) {
    safeEmit(`driver:${driverId}`, event, payload);
  },

  // Per-user room. Every socket joins user:<userId> on connect, so this
  // reaches a specific user before they've joined a trip room.
  toUser(userId, event, payload) {
    safeEmit(`user:${userId}`, event, payload);
  },

  toTripPassengers(tripId, event, payload) {
    safeEmit(`trip:${tripId}`, event, payload);
  },

  toAvailableDrivers(event, payload) {
    safeEmit("pool:drivers", event, payload);
  },
};

module.exports = { init, emit };
