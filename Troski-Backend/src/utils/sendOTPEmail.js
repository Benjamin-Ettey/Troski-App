const { sendEmail } = require("./sendEmail.js");
const { otpCodeEmailHTML } = require("./otpCodeEmailHTML.js");

const sendOTPEmail = async ({ email, otpCode }) => {
  return sendEmail({
    to: email,
    subject: "OTP Code for Troski Account Login",
    html: otpCodeEmailHTML({ otpCode }),
  });
};

module.exports = { sendOTPEmail };
