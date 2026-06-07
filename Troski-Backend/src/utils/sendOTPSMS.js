const axios = require("axios");
const { formatPhoneNumber } = require("./constants");

// Sends an OTP via Arkesel SMS in production. In development (or when no
// Arkesel API key is configured), prints the OTP to the server console so
// developers can grab it during local testing without any third-party
// dependency. This lets the auth flow be tested end-to-end before SMS is
// fully wired.

const sendOTPSMS = async ({ phoneNumber, otpCode }) => {
  const isDev = process.env.NODE_ENV !== "production";
  const apiKey = process.env.ARKESEL_API_KEY;

  if (isDev || !apiKey) {
    const reason = !apiKey
      ? "(ARKESEL_API_KEY not set)"
      : "(NODE_ENV !== production)";
    console.log(
      "\n══════════════════════════════════════════\n" +
        `🔐  OTP for SMS  ${phoneNumber}: ${otpCode}\n` +
        `    ${reason} — skipping actual SMS send\n` +
        "══════════════════════════════════════════\n",
    );
    return { devMode: true, otpLoggedToConsole: true };
  }

  try {
    const data = {
      sender: "TROSKI",
      message: `Your Troski OTP is: ${otpCode}`,
      recipients: [formatPhoneNumber(phoneNumber)],
    };
    const response = await axios.post(
      "https://sms.arkesel.com/api/v2/sms/send",
      data,
      {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(
      "Arkesel SMS failed:",
      error.response?.data || error.message,
    );
    throw new Error("Failed to send OTP SMS");
  }
};

module.exports = { sendOTPSMS };
