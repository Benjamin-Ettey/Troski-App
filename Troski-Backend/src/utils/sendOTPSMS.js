const axios = require("axios");
const { formatPhoneNumber } = require("./constants");

// change to hubtel later

const sendOTPSMS = async ({ phoneNumber, otpCode }) => {
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
          "api-key": process.env.ARKESEL_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    console.log(response.data);

    return response.data;
  } catch (error) {
    console.log(error.response?.data || error.message);

    throw new Error("Failed to send OTP SMS");
  }
};

module.exports = { sendOTPSMS };
