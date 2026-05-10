const axios = require("axios");

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const paystackRequest = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

// Initialize a transaction — returns authorizationURL and reference
const initializeTransaction = async ({ email, amountGHS, reference, channels }) => {
  const amountKobo = Math.round(amountGHS * 100); // Paystack uses pesewas (kobo equiv)

  const payload = {
    email,
    amount: amountKobo,
    currency: "GHS",
    reference,
    channels: channels || ["mobile_money", "card"],
  };

  const { data } = await paystackRequest.post("/transaction/initialize", payload);

  return {
    authorizationURL: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
};

// Charge mobile money directly (no redirect needed)
const chargeMobileMoney = async ({ email, amountGHS, reference, phone, provider }) => {
  const amountKobo = Math.round(amountGHS * 100);

  const providerMap = { mtn: "mtn", vodafone: "vod", tigo: "atl" };

  const payload = {
    email,
    amount: amountKobo,
    currency: "GHS",
    reference,
    mobile_money: {
      phone,
      provider: providerMap[provider] || provider,
    },
  };

  const { data } = await paystackRequest.post("/charge", payload);

  return data.data;
};

// Poll charge status
const checkCharge = async (reference) => {
  const { data } = await paystackRequest.get(`/charge/${reference}`);
  return data.data;
};

// Verify a completed transaction
const verifyTransaction = async (reference) => {
  const { data } = await paystackRequest.get(`/transaction/verify/${reference}`);
  return data.data;
};

// Validate Paystack webhook signature
const validateWebhookSignature = (rawBody, signature) => {
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
};

module.exports = {
  initializeTransaction,
  chargeMobileMoney,
  checkCharge,
  verifyTransaction,
  validateWebhookSignature,
};
