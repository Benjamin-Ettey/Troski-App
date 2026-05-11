const driverSocketMap = require("../utils/socketStore");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(
      "Socket Manager: Connection established for",
      socket.user.userId,
    );

    const { userId, role } = socket.user;

    // IMPORTANT: Make sure 'driver' matches exactly what is in your JWT payload
    if (role === "driver") {
      driverSocketMap[userId] = socket.id;
      console.log(`✅ Driver ${userId} linked to socket ${socket.id}`);
    } else {
      console.log(
        `ℹ️ User ${userId} connected as ${role} (Not mapped as driver)`,
      );
    }

    socket.on("disconnect", () => {
      delete driverSocketMap[userId];
      console.log(`❌ Driver ${userId} disconnected`);
    });
  });
};
