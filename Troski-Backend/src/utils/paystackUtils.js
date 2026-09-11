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

// ── TRANSFERS (driver payouts to mobile money) ──────────────────────
//
// Paystack Transfer flow:
//   1. createTransferRecipient — one-time setup per MoMo number; returns
//      a recipient_code we cache on the Driver doc.
//   2. initiateTransfer — fires the actual payout. Returns immediately
//      with status: 'pending' / 'otp'. The final outcome arrives via
//      webhook event "transfer.success" or "transfer.failed".
//
// NOTE: Paystack TEST mode requires an OTP for every transfer (sent to
// the merchant's email). LIVE mode can disable OTPs once the account is
// approved. This is an operational toggle, not a code concern.

const NETWORK_TO_BANK_CODE = {
  mtn: "MTN",
  vodafone: "VOD",
  tigo: "ATL",
};

const createTransferRecipient = async ({ name, accountNumber, network }) => {
  const bankCode = NETWORK_TO_BANK_CODE[network];
  if (!bankCode) throw new Error(`Unknown mobile money network: ${network}`);
  const { data } = await paystackRequest.post("/transferrecipient", {
    type: "mobile_money",
    name,
    account_number: accountNumber,
    bank_code: bankCode,
    currency: "GHS",
  });
  return data.data.recipient_code;
};

const initiateTransfer = async ({
  amountGHS,
  recipientCode,
  reference,
  reason,
}) => {
  const amountPesewas = Math.round(amountGHS * 100);
  const { data } = await paystackRequest.post("/transfer", {
    source: "balance",
    amount: amountPesewas,
    recipient: recipientCode,
    reason: reason || "Driver withdrawal",
    reference,
  });
  return data.data;
};

module.exports = {
  initializeTransaction,
  chargeMobileMoney,
  checkCharge,
  verifyTransaction,
  validateWebhookSignature,
  createTransferRecipient,
  initiateTransfer,
};
