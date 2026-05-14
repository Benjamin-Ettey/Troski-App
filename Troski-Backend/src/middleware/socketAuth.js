const jwt = require("jsonwebtoken");
const signature = require("cookie-signature");

const socketAuth = (socket, next) => {
  console.log("--- New Socket Connection Attempt ---");
  try {
    const tokenHeader = socket.handshake.headers.token;
    console.log("Raw Token Header received:", tokenHeader);

    if (!tokenHeader) {
      console.log("Error: No token header found");
      return next(new Error("No token provided"));
    }

    // Decode URL characters (like %3A)
    let decodedToken = decodeURIComponent(tokenHeader);

    let finalToken = decodedToken;
    if (decodedToken.startsWith("s:")) {
      finalToken = signature.unsign(
        decodedToken.slice(2),
        process.env.JWT_SECRET,
      );
      if (!finalToken) {
        console.log(
          "Error: Signature unsigning failed. Check your JWT_SECRET.",
        );
        return next(new Error("Invalid signature"));
      }
    }

    const payload = jwt.verify(finalToken, process.env.JWT_SECRET);

    console.log("Success: JWT Verified for User:", payload.user.userId);

    socket.user = { userId: payload.user.userId, role: payload.user.role };
    next();
  } catch (err) {
    console.log("Socket Auth Catch Block:", err.message);
    next(new Error("Authentication failed"));
  }
};

module.exports = socketAuth;
