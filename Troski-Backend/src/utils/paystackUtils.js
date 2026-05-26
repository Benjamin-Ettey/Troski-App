// Paystack REST wrappers. All amounts are in PESEWAS in API calls
// (= GHS × 100). All helpers here accept GHS and convert internally.

const axios = require("axios");

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const paystackRequest = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

// Initialize a transaction for a hosted-checkout flow.
// Returns { authorizationURL, accessCode, reference } — front-end redirects
// the user to authorizationURL.
const initializeTransaction = async ({
  email,
  amountGHS,
  reference,
  channels,
}) => {
  const amountKobo = Math.round(amountGHS * 100);
  const { data } = await paystackRequest.post("/transaction/initialize", {
    email,
    amount: amountKobo,
    currency: "GHS",
    reference,
    channels: channels || ["mobile_money", "card"],
  });
  return {
    authorizationURL: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
};

// Direct MoMo charge — user confirms on their phone (no redirect).
const chargeMobileMoney = async ({
  email,
  amountGHS,
  reference,
  phone,
  provider,
}) => {
  const amountKobo = Math.round(amountGHS * 100);
  const providerMap = { mtn: "mtn", vodafone: "vod", tigo: "atl" };
  const { data } = await paystackRequest.post("/charge", {
    email,
    amount: amountKobo,
    currency: "GHS",
    reference,
    mobile_money: { phone, provider: providerMap[provider] || provider },
  });
  return data.data;
};

const checkCharge = async (reference) => {
  const { data } = await paystackRequest.get(`/charge/${reference}`);
  return data.data;
};

const verifyTransaction = async (reference) => {
  const { data } = await paystackRequest.get(
    `/transaction/verify/${reference}`,
  );
  return data.data;
};

// HMAC-SHA512 verification of incoming webhook payloads. ALWAYS call this
// before trusting any webhook event — without it, an attacker can forge
// a "successful payment" and credit any wallet.
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
