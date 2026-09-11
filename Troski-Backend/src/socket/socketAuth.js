// Socket.io authentication middleware.
// Pulls the JWT from signed cookies on the handshake OR an `auth.token`
// field, verifies it, and attaches the user payload to socket.user.

const cookieParser = require("cookie-parser");
const { isTokenValid } = require("../utils/tokenUtils");

// Minimal Cookie header parser — just enough to extract a named cookie.
const getCookie = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
};

const socketAuth = (socket, next) => {
  try {
    let token = null;

    // 1. Signed `accessToken` cookie from the handshake
    const accessCookie = getCookie(
      socket.handshake.headers.cookie,
      "accessToken",
    );
    if (accessCookie) {
      const unsigned = cookieParser.signedCookie(
        accessCookie,
        process.env.JWT_SECRET,
      );
      if (unsigned) token = unsigned;
    }

    // 2. Or via handshake auth (`io(url, { auth: { token } })`)
    if (!token && socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
    }

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const payload = isTokenValid(token);
    // Token payload shape: { passenger: { passengerId, name, phoneNumber, roles } }
    socket.user = payload.passenger || payload.admin || payload;
    return next();
  } catch (err) {
    return next(new Error("Invalid auth token"));
  }
};

module.exports = socketAuth;
