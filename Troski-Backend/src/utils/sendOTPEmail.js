const { sendEmail } = require("./sendEmail.js");
const { otpCodeEmailHTML } = require("./otpCodeEmailHTML.js");

// In dev (or when no Resend key is configured), print the OTP to the
// console and skip the real email send. This lets the auth flow be tested
// end-to-end without depending on Resend being wired up.

const sendOTPEmail = async ({ email, otpCode }) => {
  const isDev = process.env.NODE_ENV !== "production";
  const apiKey = process.env.RESEND_API_KEY;

  if (isDev || !apiKey) {
    const reason = !apiKey
      ? "(RESEND_API_KEY not set)"
      : "(NODE_ENV !== production)";
    console.log(
      "\n══════════════════════════════════════════\n" +
        `📧  OTP for EMAIL ${email}: ${otpCode}\n` +
        `    ${reason} — skipping actual email send\n` +
        "══════════════════════════════════════════\n",
    );
    return { devMode: true, otpLoggedToConsole: true };
  }

  return sendEmail({
    to: email,
    subject: "OTP Code for Troski Account Login",
    html: otpCodeEmailHTML({ otpCode }),
  });
};

module.exports = { sendOTPEmail };
