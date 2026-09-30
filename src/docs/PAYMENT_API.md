# 💳 Troski Payment API Integration Guide

This document outlines the payment workflow, rules, and endpoints for the Troski applications (Passenger App, Driver App, and Admin Panel). It covers passenger charges, the escrow model, driver wallets, and scheduled payouts.

## 📌 1. Important Rules & Architecture
* **Base URL:** Payment endpoints are prefixed with `/api/v1/payments`. The admin payout trigger lives under `/api/v1/admin`.
* **Provider:** All electronic payments run through **Paystack** — Mobile Money (MTN, Telecel/Vodafone, AirtelTigo) and cards.
* **Electronic only:** This system never handles cash. Riders who pay the conductor in cash are settled off-platform and never touch these endpoints.
* **Currency:** All amounts in requests and responses are in **whole Ghana Cedis (GHS)**. (Internally we convert to pesewas for Paystack; the frontend never deals with that.)
* **Auth:** Passenger payment endpoints require an authenticated **passenger** session (the same cookie-based session as the rest of the app). The webhook is public but signature-verified.
* **Escrow model:** Paystack has no native escrow, so we hold funds logically. A passenger's payment lands in the single Troski Paystack balance; our **double-entry ledger** is the source of truth for who each cedi belongs to:
  * On **ride completion** → funds move to the **driver's wallet** (minus commission).
  * On **cancellation** → funds are **refunded** to the passenger.
* **Ledger integrity:** Every money movement is a balanced double-entry posting, and each wallet entry is HMAC hash-chained for tamper-evidence. Balances are derived from the ledger, never edited directly.

---

## 🔄 2. Core Payment Flow (Passenger)

Money is charged **at booking request** and held in escrow until the ride resolves.

1. **Book the ride** (booking API) → you get a `bookingId`.
2. **Initialize payment:** `POST /payments/initialize` with the `bookingId`. The backend returns a Paystack `authorizationUrl`.
3. **Pay:** Open the `authorizationUrl` (Paystack checkout) so the passenger pays with MoMo or card.
4. **Confirm:** Paystack notifies our **webhook**, which places the funds in escrow. As a fallback (and for immediate UX), the app can also call `GET /payments/:reference/verify` after checkout to confirm right away.
5. **Resolution:**
   * Ride **completed** by the driver → escrow is released to the driver's wallet automatically.
   * Ride **cancelled** → the passenger is refunded to source automatically.

```
Book ──▶ initialize ──▶ pay on Paystack ──▶ webhook / verify ──▶ escrow HELD
                                                                    │
                                        ride completed ────────────▶ RELEASED to driver
                                        ride cancelled ────────────▶ REFUNDED to passenger
```

---

## 📖 3. Endpoint Reference: Passenger App

### POST `/api/v1/payments/initialize`
#### Purpose
Starts a charge for a booking and returns the Paystack checkout details. Creates a pending payment transaction.

#### Request body
```json
{
  "bookingId": "665f0c2a1a1a1a1a1a1a1a1a"
}
```

#### Success (HTTP 200)
```json
{
  "message": "Payment initialized",
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/abc123",
    "accessCode": "ACCESS_xxx",
    "reference": "troski_9f2c1b...",
    "amount": 7
  }
}
```

#### Errors
* `400` - Booking is not in a payable state, or has no fare.
* `403` - You are trying to pay for a booking that isn't yours.
* `404` - Booking not found.
* `409` - This booking is already paid for (escrow already held).

#### What frontend should do
Open the `authorizationUrl` in an in-app browser / Paystack SDK so the passenger can pay. Keep the returned `reference` — you'll use it to verify.

---

### GET `/api/v1/payments/:reference/verify`
#### Purpose
Confirms the payment with Paystack and, if successful, holds the funds in escrow. Use this as the fallback/poll after the passenger returns from checkout (no webhook needed for this to work).

#### Request
No body. `:reference` is the value returned from `/initialize`.

#### Success (HTTP 200)
```json
{
  "message": "Payment received and held in escrow",
  "data": {
    "reference": "troski_9f2c1b...",
    "escrowStatus": "held",
    "amount": 7
  }
}
```
If the payment hasn't completed yet, you'll get `402 Payment Required` with a message like `"Payment not completed (abandoned)"`.

#### Errors
* `400` - Paid amount does not match the booking fare.
* `402` - Payment not completed.
* `403` - This payment is not yours.
* `404` - Payment not found.

#### What frontend should do
On success, show a "Payment confirmed — searching for a driver" state. If you receive `402`, keep the passenger on a "waiting for payment" screen and let them retry verification.

---

## 🔔 4. Webhook (Paystack → Backend)

### POST `/api/v1/payments/webhook`
#### Purpose
Server-to-server endpoint that Paystack calls when a payment succeeds. It verifies the request signature against the raw body, then holds the funds in escrow. **Not called by any frontend.**

#### Notes for setup
* Configure this URL in your Paystack Dashboard (**Settings → API Keys & Webhooks**).
* The endpoint verifies the `x-paystack-signature` header; unsigned or forged requests get `401`.
* It is **idempotent** — Paystack retries and duplicate events are safely ignored.
* Returns `200` on success (so Paystack stops retrying), `401` on a bad signature.

---

## 🚕 5. Driver Wallet & Payouts

Drivers don't cash out on demand — their wallet balance **sweeps to their MoMo automatically on a schedule** (default: daily).

### How the wallet works
* Each completed ride **credits** the driver's wallet with their share of the fare (fare minus Troski's commission + platform fee).
* The balance is derived from the ledger; it always reconciles.
* Payouts run on a schedule (`PAYOUT_CRON`, default `0 2 * * *` — 02:00 daily) and only for balances at or above the minimum (`PAYOUT_MIN_GHS`, default `1`).
* A payout registers the driver's `momoNumber` as a Paystack transfer recipient (once, cached), reserves the funds, then sends the transfer. If the transfer fails, the reservation is reversed so the driver keeps their balance.

> ⚠️ **Requires Transfers/Payouts enabled** on the Troski Paystack account. Until then, payout attempts fail gracefully and balances are retained.

### POST `/api/v1/admin/payouts/run` (Admin only)
#### Purpose
Manually trigger a payout sweep across all eligible driver wallets (useful for testing or an on-demand run). The scheduled job runs the same routine automatically.

#### Success (HTTP 200)
```json
{
  "message": "Payout sweep complete",
  "data": {
    "processed": 3,
    "paid": 2,
    "skipped": 1,
    "failed": 0,
    "results": [
      { "driverId": "...", "ok": true, "amount": 6.03, "reference": "payout_..." },
      { "driverId": "...", "skipped": true, "reason": "below_minimum", "balance": 0.5 }
    ]
  }
}
```

---

## 🔁 6. Related Booking Endpoints That Move Money

These live in the booking API but drive the payment lifecycle:

* **Complete a ride** — `PATCH /api/v1/bookings/:id/status` with `{ "status": "completed" }` (driver). Triggers **release** of escrow to the driver's wallet.
* **Cancel a ride** — `PATCH /api/v1/bookings/:id/cancel` with `{ "reason": "..." }` (passenger or driver). Triggers a **refund** to the passenger (only if funds were held).

The frontend doesn't call any payment endpoint for these — release/refund happen automatically as a side effect of the status change.

---

## 🧾 7. Status Reference

**`PaymentTransaction.status`** (Paystack's view of the payment):
`pending` → `success` | `failed` | `abandoned`

**`PaymentTransaction.escrowStatus`** (our escrow lifecycle):
`none` → `processing` → `held` → `releasing` → `released`
                                   `held` → `refunding` → `refunded`

**`booking.paymentStatus`** (what the app usually reads):
| Value | Meaning |
|---|---|
| `pending` | Not yet paid |
| `escrow_held` | Paid; funds held in escrow |
| `released` | Ride completed; paid out to driver wallet |
| `refunded` | Cancelled; refunded to passenger |
| `failed` | Payment failed |

---

## 🧪 8. Testing (Paystack Test Mode)

* Use your **test** secret key (`sk_test_...`) in `PAYSTACK_SECRET_KEY`.
* Pay the checkout URL with a [Paystack test card or test MoMo](https://paystack.com/docs/payments/test-payments/).
* **No public webhook URL?** Use the `GET /payments/:reference/verify` poll after paying — it confirms and holds escrow without a webhook. For real webhooks in dev, expose your server with a tunnel (e.g. ngrok) and set the webhook URL to `https://<tunnel>/api/v1/payments/webhook`.
* To test payouts, fund a driver wallet by completing a paid ride, then hit `POST /api/v1/admin/payouts/run` (needs Transfers enabled).

### Relevant environment variables
| Variable | Purpose | Default |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | Paystack API key (test or live) | — |
| `WALLET_HASH_SECRET` | HMAC secret for the ledger hash chain | — |
| `PAYOUT_CRON` | Payout schedule (cron expression) | `0 2 * * *` |
| `PAYOUT_MIN_GHS` | Minimum wallet balance to pay out | `1` |
