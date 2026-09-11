// Socket.io setup. Called from server.js with the http.Server instance.
//
// Connection lifecycle:
//   - socketAuth runs first; on success, socket.user is populated
//   - The socket joins rooms based on their identity:
//       * driver:<driverId>    (if user has driver role + Driver profile)
//       * pool:drivers         (if driver is online)
//       * trip:<tripId>        (passengers and drivers join their trip room
//                               when they have an active booking/trip)
//   - The socket handles real-time location pushes from drivers
//   - On disconnect, the driver is marked offline

const { Server } = require("socket.io");
const socketAuth = require("./socketAuth");
const { init: initEmit } = require("./emit");
const Driver = require("../models/drivers");
const DriverLocation = require("../models/driverLocations");
const Booking = require("../models/bookings");
const Trip = require("../models/trips");
const { isInGhana } = require("../utils/geo");

function setupSockets(httpServer, options = {}) {
  const io = new Server(httpServer, {
    cors: options.cors || { origin: true, credentials: true },
  });

  initEmit(io);

  io.use(socketAuth);

  io.on("connection", async (socket) => {
    const user = socket.user;
    if (!user) return socket.disconnect(true);

    const userId = user.passengerId || user.userId;
    const roles = user.roles || [];

    // Always join a personal room (handy for direct user pushes later).
    socket.join(`user:${userId}`);

    let driverId = null;
    if (roles.includes("driver")) {
      const driver = await Driver.findOne({ user: userId }).select("_id activeTrip");
      if (driver) {
        driverId = driver._id;
        socket.join(`driver:${driverId}`);
        socket.join("pool:drivers");
        socket.data.driverId = driverId;

        // Store the socketId on DriverLocation for direct emits if needed.
        await DriverLocation.findOneAndUpdate(
          { driver: driverId },
          { $set: { socketId: socket.id } },
          { upsert: true, setDefaultsOnInsert: true },
        );

        // If the driver has an active trip, join that room
        if (driver.activeTrip) {
          socket.join(`trip:${driver.activeTrip}`);
        }
      }
    }

    // Passenger side: join the room of their active booking's trip
    const activeBooking = await Booking.findOne({
      passenger: userId,
      status: "active",
    }).select("trip");
    if (activeBooking) {
      socket.join(`trip:${activeBooking.trip}`);
    }

    // ----- INCOMING SOCKET EVENTS -----

    // Driver pushes location update
    socket.on("driver:location", async (payload, ack) => {
      try {
        if (!driverId) return ack?.({ ok: false, error: "Not a driver" });
        const { latitude, longitude, heading, speed } = payload || {};
        if (!isInGhana(latitude, longitude)) {
          return ack?.({ ok: false, error: "Invalid coordinates" });
        }
        const loc = await DriverLocation.findOneAndUpdate(
          { driver: driverId },
          {
            $set: {
              latitude,
              longitude,
              heading: heading ?? null,
              speed: speed ?? null,
              isOnline: true,
              socketId: socket.id,
              lastUpdate: new Date(),
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        // If on a trip, broadcast our location to passengers in that trip.
        const driver = await Driver.findById(driverId).select("activeTrip");
        if (driver?.activeTrip) {
          io.to(`trip:${driver.activeTrip}`).emit("driver:location", {
            tripId: driver.activeTrip,
            latitude,
            longitude,
            heading: heading ?? null,
            speed: speed ?? null,
          });
        }

        // Auto-end check (fire-and-forget; runs even on socket-driven pushes)
        const { checkAutoEnd } = require("../utils/autoEnd");
        checkAutoEnd(driverId, { latitude, longitude }).catch((e) =>
          console.error("autoEnd check failed (socket)", e),
        );

        ack?.({ ok: true });
      } catch (err) {
        console.error("driver:location handler error", err);
        ack?.({ ok: false, error: "internal" });
      }
    });

    // Passenger opens trip detail UI — join the trip's room (idempotent).
    socket.on("trip:join_room", async ({ tripId }, ack) => {
      try {
        if (!tripId) return ack?.({ ok: false });
        // Verify the user is a participant
        const trip = await Trip.findById(tripId).select("_id driver");
        if (!trip) return ack?.({ ok: false, error: "Trip not found" });

        const isAssignedDriver =
          driverId && String(trip.driver) === String(driverId);
        const hasBooking = await Booking.exists({
          trip: tripId,
          passenger: userId,
          status: "active",
        });
        if (!isAssignedDriver && !hasBooking) {
          return ack?.({ ok: false, error: "Not a participant" });
        }
        socket.join(`trip:${tripId}`);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: "internal" });
      }
    });

    socket.on("disconnect", async () => {
      if (driverId) {
        // Mark offline only if this was the last socket for the driver
        const remaining = await io.in(`driver:${driverId}`).fetchSockets();
        if (remaining.length === 0) {
          await DriverLocation.findOneAndUpdate(
            { driver: driverId },
            { $set: { isOnline: false, socketId: null } },
          );
        }
      }
    });
  });

  return io;
}

module.exports = setupSockets;
