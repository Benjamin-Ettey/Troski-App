# Troski Booking, Driver Matching, Payment and Trip Lifecycle Test Plan

**Purpose:** A step-by-step integration test guide for the booking and payment functionality represented by the supplied TypeScript code.

**Test environment:** Local or staging API, MongoDB replica set/Atlas, Paystack test integration, and two or more approved driver accounts.

---

## 1. What this test plan covers

The tests cover the complete flow and its supporting operations:

1. Passenger fare estimation.
2. Driver onboarding prerequisites and approval.
3. Driver going online, starting a run and sending location heartbeats.
4. Finding a suitable run and creating a booking offer.
5. Driver accepting or declining an offer.
6. Automatically trying the next-best driver after a decline.
7. Seat reservation and release.
8. MoMo payment initialization, verification, escrow and ledger postings.
9. Protecting driver, vehicle, pickup and live-location information before payment.
10. Live tracking after the payment gate is satisfied.
11. Driver arrival, trip start and trip completion.
12. Passenger and driver cancellation, refund and cancellation penalty.
13. Booking expiry, unpaid-booking expiry and stale-run cleanup.
14. Unmet-demand recording, clustering and driver demand acceptance.
15. Authorization, duplicate requests, race conditions and failure handling.

The code supplied does not include the payment controller/routes, the application bootstrap, all Mongoose models, or the Paystack webhook route. Where those are required, this guide identifies what to locate rather than inventing endpoint paths.

---

## 2. Code review: fix or confirm these before relying on the tests

Do not skip this section. The test steps later in this document include expected failures for the issues below so you can verify that the fixes have actually been applied.

### 2.1 MongoDB session cleanup in `acceptBookingService()` is still incorrect

In the supplied `booking.service.ts`, the `finally` block closes the session only when `session.inTransaction()` is true. After a successful commit or abort, that condition can be false. There is also an explicit `session.endSession()` in the insufficient-capacity branch, which can lead to ending the same session twice once the `finally` block is corrected.

**Required correction:**

- Remove the `session.endSession()` call from inside the insufficient-capacity branch.
- Keep the transaction abort and the booking update in that branch.
- Always close the session in `finally`.

The cleanup should end up in this shape:

```typescript
} finally {
  await session.endSession();
}
```

Do not keep the old `if (session.inTransaction())` condition. Make sure every return and thrown error passes through the `finally` block.

### 2.2 Late payment after a completed booking is not covered

The supplied `payment.service.ts` checks these terminal statuses:

```typescript
const terminalStatuses = ["cancelled", "no_drivers", "expired"];
```

It does not include `completed`. Therefore, a successful payment verification arriving after the trip has completed can be recorded as escrow held even though the booking is no longer eligible for payment.

There is another ordering problem: the code publishes `ride_unlocked` before performing the terminal-status check. A late payment for a cancelled or expired booking could therefore emit an unlock event before the refund logic runs.

**Required minimum correction:**

- Treat `completed` as terminal for payment acceptance as well.
- Move the `ride_unlocked` publication so it happens only after the booking has passed the payment-eligibility check.
- Re-read the booking status close to the point where payment is applied. Do not rely only on a booking document fetched before the provider verification request, because the booking could change while Paystack is being contacted.
- Make the database update conditional on the booking still being in a payable state (currently `accepted` or `arrived`). Handle the late-success case explicitly and refund/reconcile the provider charge without unlocking ride details.

Simply adding `"completed"` to the array is a necessary minimum, but does not by itself eliminate a race between a concurrent completion/cancellation and payment verification. Exercise the race test in Section 12.7 before treating this as production-safe.

### 2.3 Paystack verification errors can leave a transaction stuck in `processing`

The supplied `payment.service.ts` claims the transaction by changing `escrowStatus` to `processing`, then calls:

```typescript
const verify = await paystack.verifyTransaction(reference);
```

That call is outside a catch block that resets the claim. A timeout, network error or provider exception can therefore leave the transaction in `processing`, blocking normal retries.

**Required correction:** Wrap the provider verification call in error handling. On a thrown provider/network error, conditionally release the claim only if the same transaction is still in `processing`, while preserving a retryable payment state. Log the error and allow the API/webhook layer to return an appropriate retryable failure.

Example shape:

```typescript
let verify;

try {
  verify = await paystack.verifyTransaction(reference);
} catch (error) {
  await PaymentTransaction.updateOne(
    { _id: claimed._id, escrowStatus: "processing" },
    { $set: { escrowStatus: "none" } },
  );

  throw error;
}
```

Use the actual type returned by your `PaystackService` for `verify` rather than leaving it implicitly typed if your TypeScript configuration requires an explicit type. A provider timeout can be ambiguous: the customer may have paid even though your server did not receive the verification response. The webhook/retry path must be able to verify the same reference safely, and ledger postings must remain idempotent.

### 2.4 The two copies of `match.service.ts` and `booking.service.ts` are inconsistent

The first `booking.service.ts` copy imports:

```typescript
import { findNextBestDriver, bookingDeclinesCache } from "./match.service";
```

But the first `match.service.ts` copy in the document does not export either symbol. A later duplicate copy of `match.service.ts` does export them.

**Before testing:** Confirm that the actual project `match.service.ts` exports both `findNextBestDriver` and `bookingDeclinesCache`. Then run the TypeScript compiler. Do not assume the two pasted copies can be combined by simply pasting one after the other.

The decline cache is process memory (`Map`). It is adequate for a controlled single-process development test, but it is not durable across server restarts and is not shared between multiple API instances. For production, persist declined driver IDs on the booking (or in a durable matching-attempt collection) and use an atomic reassignment strategy.

### 2.5 The ride-details route is handled in the controller but is missing from the supplied booking router

The first controller copy defines `getBookingRideDetails`, but the supplied `booking.routes.ts` does not import or register it.

Add the handler to the router and register the route, for example:

```typescript
import { getBookingRideDetails } from "../controllers/booking.controller";

router.get(
  "/:id/ride-details",
  authorizeRoles("passenger"),
  getBookingRideDetails,
);
```

Keep this route before the generic `router.get("/:id", ...)` route for clarity. Verify that the generic booking-detail route is also protected by authentication/authorization at this router or its parent. In the supplied route file, `GET /:id` has no route-level `authorizeRoles` middleware, while its controller expects `req.user` to exist.

### 2.6 The payment gate is not consistently enforced on live tracking

The controller's `trackBooking()` checks `canAccessRideDetails()` before sending the initial GPS snapshot. However, the supplied `tracking.service.ts` publishes `van_location` and `head_to_pickup` for every booking in its tracking statuses without checking payment eligibility.

A passenger can therefore be denied the initial GPS snapshot and still receive later location events through the subscribed SSE channel.

**Required correction:** Enforce the same payment/booking access policy before every passenger-facing GPS and pickup event is published. A clean approach is to move the policy helper into a small shared booking-access/policy module that both the controller and tracking service can import, avoiding a circular import. Do not rely on the mobile app to hide events after the server has sent them.

Test both the initial SSE connection and subsequent driver heartbeats before and after payment.

### 2.7 The initial match response may still expose protected data

The later duplicate `match.service.ts` attempts to mask `pickupPoint` for MoMo requests, but the booking object still contains other potentially sensitive properties, including `driver`, `run`, `vehicle`, and the `pickup` subdocument coordinates. The earlier duplicate returns the full booking and exact pickup details directly.

The `maskSensitiveBooking()` helper also removes coordinates from `pickupPoint`, but it does not remove `pickup.latitude` and `pickup.longitude`. Applying that helper only in `getMyBookingsService()` and `getBookingByIdService()` does not protect the initial `matchRideService()` response.

**Required correction:** Construct a passenger-safe response DTO for an unpaid MoMo booking. Do not return the raw Mongoose booking object and then remove only one nested field. Check the complete serialized JSON for:

- Driver profile ID or populated driver details.
- Vehicle ID or vehicle details.
- Run ID or run details.
- `pickup.latitude` and `pickup.longitude`.
- `pickupPoint.latitude` and `pickupPoint.longitude`.
- Exact pickup address/name if that identifies the boarding point.
- Precise van ETA, walking instructions or other information that defeats the intended privacy gate.

The server may keep these values internally for matching and the driver offer; they should not be included in the passenger response before payment.

### 2.8 Cash bookings bypass the payment gate by design in the supplied helper

The supplied helper says:

```typescript
return (
  booking.paymentMethod === "cash" ||
  booking.paymentStatus === "escrow_held"
);
```

This means a cash booking can access ride details without digital payment. That may be intentional for a cash option, but it does not protect Troski against a passenger using a cash booking to discover a vehicle and then paying the driver outside the app.

Decide the product policy before running the security tests:

- If cash remains supported, record that cash bookings deliberately receive details without escrow and accept that the MoMo payment gate does not protect that flow.
- If the initial launch is cashless, reject `cash` in the match validator/service and make the access policy require `paymentStatus === "escrow_held"` for passenger disclosure.

Do not mark a cash booking as a successful test of the MoMo privacy gate.

### 2.9 The MoMo payment initialization allows card as well

The supplied initializer sends both channels:

```typescript
channels: ["mobile_money", "card"]
```

But the booking's payment method is represented as `"momo"`. If Troski intends to accept both card and MoMo, make the payment selection and stored method accurately represent both. If this flow must be MoMo-only, restrict the allowed Paystack channel to mobile money and validate the verified channel before setting `paymentStatus` to escrow held.

Test and document the intended policy; do not silently treat a card payment as MoMo.

### 2.10 The fare-estimate controller rejects zero-valued coordinates

The supplied controller tests coordinates with `!pickupLatitude` and similar checks. A valid coordinate value of `0` is treated as missing. Ghana test coordinates will normally be non-zero, but use numeric/null checks such as `Number.isFinite(Number(value))` rather than truthiness checks.

### 2.11 Refund state is currently treated as complete too early

The supplied `refundForBooking()` changes the local transaction to `refunded` after Paystack accepts the refund request. The response text says the refund was initiated, but the internal state can be interpreted as a completed refund. The supplied webhook handler processes `charge.success`; refund-status reconciliation is not shown.

Before real-money launch, distinguish at least refund requested/processing from refund completed, and reconcile the final provider refund result/webhook. Until that is implemented, manually verify the final refund status in the Paystack dashboard during sandbox testing and do not equate an accepted refund request with money received by the passenger.

### 2.12 Scheduler startup must be confirmed

The document shows `startBookingScheduler()` and `startDemandScheduler()` definitions, but does not show the application bootstrap that calls them.

Confirm that each scheduler is started exactly once after dependencies/database setup. If they are never started, the 15-minute request expiry and 5-minute unpaid MoMo expiry will not run automatically, and demand clustering will not run on its configured schedule.

---

## 3. Test environment and preparation

### 3.1 Use a safe environment

- Use a local or staging API, not the production API.
- Use Paystack test credentials and test transactions. Do not run these scenarios with real passenger money.
- Use a MongoDB replica set or MongoDB Atlas because the acceptance and ledger flows use multi-document transactions. A standalone MongoDB server will not support those transactions correctly.
- Ensure your MongoDB geospatial indexes are created for the `DriverRun.currentLocation` GeoJSON field. The matcher uses `$near` when Redis GEO is unavailable.
- If Redis is enabled, verify that GEO upsert/removal is working. Also test the MongoDB fallback separately if you intend to support it.
- Configure the Maps API key if you want to test Google route, walking and road-distance results. The code contains straight-line fallback calculations, but fallback success does not prove Google routing is working.
- Configure a publicly reachable staging webhook URL for Paystack, using a secure tunnel if testing locally. Ensure the webhook route receives the raw request body needed for signature verification.
- Keep the booking and demand schedulers enabled in the test environment, but make sure you can also invoke their service functions directly in a controlled test.

### 3.2 Confirm environment variables

Review the actual `.env.example` and configuration files. The supplied code reads these values where present:

| Variable | Purpose | Supplied default |
|---|---|---|
| `MATCH_DEST_CORRIDOR_KM` | Maximum destination distance from the driver's route | `1.5` km |
| `MATCH_READY_BUFFER_MIN` | Passenger readiness buffer | `2` minutes |
| `MATCH_MAX_WAIT_MIN` | Maximum passenger wait after reaching pickup | `10` minutes |
| `BOOKING_EXPIRY_CRON` | Booking expiry scheduler | Every minute |
| `DEMAND_CRON` | Demand clustering scheduler | Every 2 minutes |

Other required values such as MongoDB URI, Paystack secret, Maps key and Redis configuration are project-specific; use the names in your actual configuration rather than copying guessed names from this guide.

### 3.3 Prepare test accounts

Use separate cookie jars/sessions for these accounts:

| Account | Required setup | Purpose |
|---|---|---|
| Passenger A | Active passenger account | Main booking flow |
| Passenger B | Separate passenger account | Ownership and unauthorized-access tests |
| Driver A | Approved driver profile and approved vehicle | First match candidate |
| Driver B | Approved driver profile and approved vehicle | Second-best candidate after decline |
| Driver C | Approved driver profile and approved vehicle | Third candidate or negative route candidate |
| Admin | Admin account, if your project uses one | Driver approval and administrative checks |

Use the authentication mechanism configured by your API. If the project uses cookie authentication, keep separate cookie jars for each user; do not accidentally reuse the passenger cookie when testing driver routes.

### 3.4 Prepare driver routes and seats

For the matching and retry tests, prepare at least two suitable active runs and preferably one unsuitable run:

- Driver A: valid active run on the desired corridor, closest/soonest candidate.
- Driver B: valid active run on the same corridor, expected to be the next-best candidate.
- Driver C: run on the wrong corridor, already past the passenger's pickup point, stale, or with insufficient seats. Use it to confirm that unsuitable runs are rejected.

Use coordinates inside the areas supported by the project's `zonesConfig` and `locationLookup` data. Do not invent coordinates; use the same verified Ghana test points already used by your application.

Keep location heartbeats coming more frequently than the 2-minute stale-run threshold in `run.service.ts`. A driver whose `lastLocationAt` is older than the threshold can be ended as stale when `findNearbyRuns()` executes.

### 3.5 Capture baseline data before each scenario

Before a test, record:

- Booking ID and initial status.
- Driver profile ID and run ID.
- Run `availableSeats` and `totalSeats`.
- Booking `paymentStatus` and payment method.
- Payment transaction reference and `escrowStatus`, if one exists.
- Ledger posting IDs and account balances.
- SSE events received by passenger and driver.

For a clean repeatable test, cancel/end previous test bookings, end old driver runs, and restore test seats. Do not delete ledger records from a shared database just to reset a test; use a dedicated test database or a documented cleanup script.

---

## 4. Run the static checks first

Run these before Postman testing:

```bash
npx tsc --noEmit
npm run build
```

If your project defines lint and test scripts, also run:

```bash
npm run lint
npm test
```

If a script does not exist, use the scripts shown by `npm run` rather than assuming it is configured.

**Do not proceed until you have resolved:**

- Missing `findNextBestDriver` or `bookingDeclinesCache` exports.
- Missing `getBookingRideDetails` route registration.
- Type errors from duplicate or mismatched versions of the pasted files.
- MongoDB transaction environment errors.

The uploaded document includes more than one copy of several files. Make sure your actual project contains one coherent implementation rather than a mixture of the old and updated copies.

---

## 5. API route inventory from the supplied routers

The router code in the document shows these booking routes. The base path is assumed to be the one you previously used, `/api/v1/bookings`; confirm the router mount in the app.

| Method | Path | Role/use |
|---|---|---|
| `POST` | `/api/v1/bookings/estimate` | Passenger fare estimate |
| `PATCH` | `/api/v1/bookings/match` | Passenger matching request |
| `GET` | `/api/v1/bookings/demand/:id` | Passenger checks unmet demand |
| `PATCH` | `/api/v1/bookings/:id/accept` | Assigned driver accepts |
| `PATCH` | `/api/v1/bookings/:id/decline` | Assigned driver declines |
| `PATCH` | `/api/v1/bookings/:id/status` | Driver changes trip status |
| `GET` | `/api/v1/bookings/` | Passenger/driver booking list |
| `PATCH` | `/api/v1/bookings/:id/cancel` | Passenger or assigned driver cancels |
| `GET` | `/api/v1/bookings/:id/track` | SSE tracking connection |
| `GET` | `/api/v1/bookings/:id` | Booking detail |
| `GET` | `/api/v1/bookings/:id/ride-details` | **Required route; handler exists in the controller copy but route is missing in the supplied router** |

The supplied driver router shows these route suffixes. Confirm the actual mount path in your app (for example, `/api/v1/drivers`).

| Method | Path suffix | Purpose |
|---|---|---|
| `GET` | `/status` | Driver status |
| `POST` | `/kyc` | Driver KYC submission |
| `POST` | `/vehicle` | Vehicle/document submission |
| `PATCH` | `/toggle-online` | Online status |
| `GET` | `/runs/active` | Current active run |
| `POST` | `/runs/start` | Start run |
| `PATCH` | `/runs/location` | Location heartbeat |
| `PATCH` | `/runs/seats` | Update available seats |
| `PATCH` | `/runs/end` | End run |
| `GET` | `/demand` | Demand clusters near driver |
| `POST` | `/demand/:id/accept` | Driver accepts a demand cluster |

**Payment routes are not included in the supplied code.** Find the actual payment controller/router and write down the exact paths for:

- Initializing a booking payment.
- Verifying a payment/reference, if the client calls a verification endpoint.
- Receiving the Paystack webhook.

Use those real paths in the payment tests below. Do not create guessed route names from this document.

---

## 6. Test 1 — Driver approval and access control

### Steps

1. Log in as a driver who has not completed approval.
2. Call the driver's status endpoint.
3. Try to start a run.
4. Submit KYC and vehicle details using the fields required by the actual validators. Upload the required files as multipart form data.
5. Complete the project's admin approval process for the driver and vehicle.
6. Log in again or refresh the driver's session if approval changes are not immediately reflected.
7. Call the status endpoint and try to start a run again.

### Expected results

- An unapproved driver cannot use protected run operations because the routes use `requireApprovedDriver`.
- Approved driver and approved vehicle records are associated with the correct driver profile.
- A driver cannot start a second active run while one already exists.
- A passenger account cannot access driver-only run endpoints.

Record the driver profile ID and approved vehicle ID for the next tests.

---

## 7. Test 2 — Driver run creation, location and seat management

### 7.1 Start a run

1. Log in as Driver A.
2. Call `POST <DRIVER_BASE>/runs/start` with a supported origin, destination and initial available-seat count.
3. Save the returned run ID.
4. Call `GET <DRIVER_BASE>/runs/active`.

**Expected:** The run is active, has the expected origin/destination, total seats, available seats, starting location and timestamps. The driver profile should be online.

### 7.2 Send a location heartbeat

1. Call `PATCH <DRIVER_BASE>/runs/location` with the driver's new latitude and longitude.
2. Repeat the heartbeat while testing so `lastLocationAt` stays fresh.
3. Check the DriverRun document in MongoDB.

**Expected:**

- GeoJSON coordinates are stored in `[longitude, latitude]` order.
- `lastLocationAt` is updated.
- Driver `lastSeenAt` is updated.
- The Redis GEO record is updated when Redis is enabled.
- Existing eligible bookings receive tracking updates only when the privacy/payment policy allows them (see Test 13).

### 7.3 Update seats

1. Call `PATCH <DRIVER_BASE>/runs/seats` to set available seats to a known value.
2. Call it again using the `delta` option if the validator permits that shape.
3. Try a value above total capacity and a negative value.

**Expected:** Available seats are clamped between zero and total capacity. Record the final value.

### 7.4 Duplicate active run

Try to start a second run for Driver A without ending the first.

**Expected:** Conflict response; original run remains active and unchanged.

---

## 8. Test 3 — Fare estimation

Use the actual request shape expected by `estimateFareSchema`.

### Positive test

1. Log in as Passenger A.
2. Call `POST /api/v1/bookings/estimate` with valid supported pickup and dropoff coordinates and a seat count.
3. Save the fare, distance, zones and ETA response.

**Expected:** HTTP success, a positive fare, expected seat count and correct pickup/dropoff town/zone information.

### Negative tests

Run separate requests for:

- Missing pickup coordinates.
- Missing destination coordinates.
- Invalid numeric strings.
- Unsupported pickup zone.
- Unsupported destination zone.
- Pickup and destination resolving to the same town.
- Zero-valued coordinate input, if your supported data/test set includes one.
- Invalid or excessive seat count.

**Expected:** Invalid inputs return a client error with a meaningful message. The controller's current truthiness checks reject numeric zero; fix that before treating the zero-coordinate case as passed.

---

## 9. Test 4 — Passenger matching

### 9.1 Successful match

Precondition: Driver A and Driver B have fresh active runs with sufficient seats and a compatible route. Driver A should rank first.

1. Ensure Passenger A has no active booking.
2. Connect Driver A to the driver SSE offer channel using the actual real-time connection method.
3. Call `PATCH /api/v1/bookings/match` as Passenger A with pickup, destination, seats and `paymentMethod: "momo"`.
4. Save the booking ID returned by the API.
5. Inspect the booking document in MongoDB.
6. Inspect Driver A's SSE messages.
7. Inspect Driver A and Driver B run seat counts.

**Expected business behaviour:**

- A booking is created with `status: "requested"`.
- Booking references the chosen run and driver.
- Fare and journey estimates are saved.
- `new_booking_offer` is sent to the chosen driver.
- Matching alone does not decrement `availableSeats`.
- Driver B does not receive the first offer.

**Privacy expectation for MoMo:** The passenger response must not expose the driver, vehicle, run, exact pickup coordinates/address or live location before payment. The code in the uploaded document appears to return too much of the booking object in at least one copy. Inspect the complete serialized response, not only `pickupPoint`.

### 9.2 Passenger cannot create a second active booking

Before resolving the first booking, call `/match` again as Passenger A.

**Expected:** Conflict response such as `You already have an active ride.` No second active booking is created and no second driver offer is sent.

### 9.3 No nearby candidate

1. End all test runs or move them outside the search radius.
2. Submit a valid match request.

**Expected:**

- No booking is created.
- A `DemandRequest` is recorded.
- The response contains a `demandId`.
- The passenger can check that request through `GET /api/v1/bookings/demand/:id`.

### 9.4 Candidate exists but route/timing is unsuitable

Keep a run nearby, but configure its route so the destination is not on the route, is behind the van, or the passenger cannot reach the pickup in time.

**Expected:** The run is rejected as a candidate and an unmet-demand request is recorded if no other viable run exists.

### 9.5 Ownership test

Passenger B attempts to retrieve Passenger A's booking or demand request.

**Expected:** Forbidden response. No private booking or demand data is returned.

---

## 10. Test 5 — Driver decline and automatic next-best matching

This test requires at least two viable drivers and a coherent `match.service.ts` that exports `findNextBestDriver` and `bookingDeclinesCache` as imported by the updated booking service.

### Steps

1. Set Driver A as the first candidate and Driver B as the second-best candidate.
2. Passenger A creates a MoMo booking request.
3. Confirm only Driver A receives `new_booking_offer`.
4. Driver A calls `PATCH /api/v1/bookings/:id/decline`.
5. Inspect the booking and SSE events.
6. Confirm Driver B receives the offer for the **same booking ID**.
7. Confirm the passenger receives a safe status update that a new driver is being tried, without protected driver/location details before payment.
8. Driver B declines.
9. If Driver C is viable, confirm Driver C receives the same booking. Otherwise, confirm the booking becomes `no_drivers`.
10. If Driver C receives it, have Driver C accept and continue to Test 6.

### Expected results

- Declining driver is excluded from subsequent matching attempts in the same running application process.
- The booking remains the same record during reassignment; no duplicate booking is created.
- Only one driver is assigned at a time.
- If no viable drivers remain, booking becomes `no_drivers`, `driver` and `run` are cleared, and passenger is notified.
- No seats are reserved merely because an offer is sent or declined.

### Important limitation

The decline tracking shown in the later duplicate `match.service.ts` is an in-memory `Map`. Restart the API and repeat a decline scenario as a resilience test: the cache is lost. Also consider a multi-instance test if you run more than one API process. A durable attempted-driver list is required before relying on decline exclusion in production.

---

## 11. Test 6 — Driver acceptance and seat reservation

### 11.1 Normal acceptance

Precondition: A booking is `requested`, assigned to Driver A, and Driver A's run has enough seats.

1. Record `availableSeats` before acceptance.
2. Driver A calls `PATCH /api/v1/bookings/:id/accept`.
3. Inspect the booking and run in MongoDB.
4. Repeat the same accept request.

**Expected:**

- First request succeeds and booking becomes `accepted`.
- `acceptedAt` is set.
- Available seats decrease by exactly `seatsRequested`.
- Passenger is populated in the driver's response as intended.
- Second acceptance fails with a conflict and does not decrement seats again.

### 11.2 Insufficient seats at acceptance time

1. Create a request while the run has enough seats.
2. Before the driver accepts, reduce available seats below `seatsRequested`.
3. Driver attempts acceptance.

**Expected:** Acceptance fails; no seat count goes negative; the booking is moved to the configured no-driver/failure outcome and driver/run assignment is cleared as intended. Confirm the MongoDB transaction is aborted and the session is closed.

### 11.3 Two drivers cannot accept the same booking

Simulate two accept calls close together, one from the assigned driver and one from another driver.

**Expected:** Only the assigned driver can accept. Only one successful state transition and one seat decrement occur.

### 11.4 Seat count is not decremented at match time

Compare run seats before matching, after offer creation and after driver acceptance.

**Expected:** No change at match; exactly one decrement on acceptance.

---

## 12. Test 7 — MoMo payment and escrow

The payment route names are not present in the supplied document. Use the actual payment initialization, verification and webhook paths from your payment router/controller.

### 12.1 Payment cannot start before driver acceptance

1. Create a booking with `status: "requested"`.
2. Try initializing a payment.

**Expected:** Rejected because the supplied payment service allows only `accepted` and `arrived` bookings to be charged.

### 12.2 Cash booking cannot use Paystack initialization

1. Create a booking with `paymentMethod: "cash"`.
2. Try initializing a digital payment.

**Expected:** Rejected with the cash-booking message.

Also remember that `canAccessRideDetails()` currently allows cash bookings to see details without escrow. This is a separate product/privacy decision, not evidence that the MoMo payment gate works.

### 12.3 Wrong passenger cannot pay

Passenger B attempts to initialize or verify payment for Passenger A's booking/reference.

**Expected:** Forbidden response. No transaction is created or changed.

### 12.4 Initialize a valid payment

1. Use an accepted MoMo booking belonging to Passenger A.
2. Call the payment initialization endpoint.
3. Save the Paystack `reference`, `authorizationUrl`, `accessCode` and amount.
4. Inspect `PaymentTransaction` in MongoDB.

**Expected:**

- Payment initialization succeeds.
- Amount equals the booking fare.
- A transaction is stored as pending with `escrowStatus: "none"`.
- Reference is unique.
- A second initialization for the same booking is rejected or returns the existing active payment reference according to your implementation.

### 12.5 Complete a successful test payment

1. Complete the transaction using Paystack's test flow.
2. Allow the webhook to reach the staging/local webhook endpoint.
3. If the client has a verify endpoint, call it using the reference as well to test idempotency.
4. Inspect `PaymentTransaction`, `Booking`, ledger postings and SSE events.

**Expected:**

- Paystack verification confirms success and the correct amount.
- Transaction becomes `success` with `escrowStatus: "held"`.
- Booking `paymentStatus` becomes `escrow_held`.
- One balanced charge posting is recorded: gateway debit and escrow credit for the same amount.
- `ride_unlocked` is published only after the booking is still eligible for disclosure.
- Replaying the same webhook or verify request does not create a second ledger charge.

### 12.6 Failed, pending and wrong-amount payment tests

Run these as separate cases:

- Customer abandons or does not authorize the MoMo payment.
- Paystack reports a pending/non-success status.
- Verified amount differs from booking amount.
- Reference does not exist.
- Reference belongs to another passenger.
- Duplicate webhook is delivered.

**Expected:** No escrow is held and no ride details are unlocked unless the provider verifies the correct successful amount. Wrong-amount transactions must be flagged for reconciliation; do not quietly treat them as successful.

### 12.7 Paystack verification network failure

Use a mocked Paystack client or test double that throws during `verifyTransaction()` after the transaction claim has changed to `processing`.

**Expected:**

- Error is logged/returned as retryable.
- Transaction does not remain stuck indefinitely in `processing`.
- Transaction can be verified again when the provider is reachable.
- Retrying or replaying the webhook does not duplicate the ledger charge.

This test specifically verifies the correction in Section 2.3.

### 12.8 Late payment after cancellation, expiry, no-driver or completion

Use a test double to simulate a successful Paystack verification arriving after the booking has become each of these states:

- `cancelled`
- `expired`
- `no_drivers`
- `completed`

**Expected:**

- Ride details are not unlocked.
- No new driver tracking is exposed.
- The late payment is routed into the refund/reconciliation path.
- The completed booking does not end up with money unintentionally held in escrow.
- Booking state is not silently changed back to an active state.

Also simulate a race where the booking completes or is cancelled while Paystack verification is in progress. The server must perform a fresh/conditional booking-state check at the time it applies payment. This is essential; a stale pre-verification booking read is not sufficient.

---

## 13. Test 8 — Ride-detail privacy and payment gate

This section is one of the most important parts of the Troski tests.

### 13.1 Before successful MoMo payment

As Passenger A, test all of the following for an unpaid MoMo booking:

1. Inspect the response from `PATCH /bookings/match`.
2. Call `GET /bookings/`.
3. Call `GET /bookings/:id`.
4. Call `GET /bookings/:id/ride-details`.
5. Connect to `GET /bookings/:id/track`.
6. Keep the SSE connection open while Driver A sends multiple location heartbeats.

**Expected privacy behaviour:**

- The passenger may see that the request was created and a driver accepted, plus non-sensitive fare/status information.
- No driver profile, driver user, vehicle or run details are returned.
- No exact pickup coordinates/address or boarding directions are returned.
- No van GPS coordinates or precise ETA is sent through SSE.
- The ride-details endpoint returns `PAYMENT_REQUIRED` until the booking is eligible.

**Likely failures in the supplied implementation:**

- One match-service copy returns the full booking; the other only masks `pickupPoint` but can still expose `pickup` coordinates and driver/run/vehicle references.
- `maskSensitiveBooking()` does not remove coordinates under `booking.pickup`.
- `tracking.service.ts` publishes subsequent GPS events without a payment check.
- The `ride-details` route is not registered in the supplied booking router.

Do not mark these tests as passed until the complete response bodies and the full SSE stream have been inspected.

### 13.2 After successful MoMo payment

1. Complete payment and confirm `paymentStatus: "escrow_held"`.
2. Call `GET /bookings/:id/ride-details`.
3. Call `GET /bookings/:id` and `GET /bookings/`.
4. Connect to the tracking endpoint.
5. Send another driver location heartbeat.

**Expected:** Passenger A can now retrieve the intended driver/vehicle/pickup details and receive live tracking updates for their own booking.

### 13.3 Other users must remain blocked

Passenger B calls the same ride-details and tracking endpoints for Passenger A's booking.

**Expected:** Forbidden response; no ride details or GPS events are returned.

### 13.4 Driver access

The assigned driver should be able to see the information needed to serve the booking. A different driver must not be able to retrieve the booking or subscribe to its tracking channel.

### 13.5 Cash path

Repeat the disclosure test with a cash booking only if cash is intentionally supported. Under the current `canAccessRideDetails()` helper, cash bookings are allowed to access details without `escrow_held`. Record this as expected current behaviour, while recognizing that it does not prevent the off-platform cash-bypass problem.

---

## 14. Test 9 — Driver trip status lifecycle

Use a paid MoMo booking with `paymentStatus: "escrow_held"` and an assigned driver/run.

### 14.1 Attempt to arrive before payment

For a separate accepted but unpaid MoMo booking, Driver A calls:

```http
PATCH /api/v1/bookings/:id/status
Content-Type: application/json

{"status":"arrived"}
```

**Expected:** `PAYMENT_REQUIRED`. The booking remains `accepted` and no `arrivedAt` timestamp is saved.

### 14.2 Attempt to start before payment

The driver must not be able to progress an unpaid booking to `in_progress`. The normal transition requires `accepted` → `arrived` first, so verify the first blocked transition and then confirm there is no alternate route that bypasses it.

### 14.3 Normal paid progress

1. Driver A updates status to `arrived`.
2. Inspect `arrivedAt` and passenger SSE event.
3. Driver A updates status to `in_progress`.
4. Inspect `startedAt` and passenger SSE event.
5. Update the driver's run location until it is within the configured destination radius, or call the completion transition through the supported route.
6. Inspect the booking, run seats, payment transaction and ledger.

**Expected:**

- Valid transitions are accepted in order.
- Invalid transitions such as `requested` → `in_progress` or `completed` → `arrived` are rejected.
- On completion, booking becomes `completed`, `completedAt` is set and `fareFinal` is set from the fare estimate.
- Seats are returned exactly once.
- Escrow is released and split between driver wallet and platform revenue according to `splitEarnings()`.
- A `trip_completed` event is published.
- A repeated completion attempt does not release seats or funds twice.

### 14.4 Destination auto-completion

If using GPS auto-completion, move the run location to within `DESTINATION_RADIUS_KM` of the booking destination while booking is `in_progress`.

**Expected:** `completeBooking()` is called once and the booking completes. Also test a location outside the radius; it must not complete prematurely.

---

## 15. Test 10 — Passenger and driver cancellation

Use separate bookings for each scenario. Record seats and payment ledger state before each cancellation.

### 15.1 Passenger cancels while still requested

1. Create a requested booking.
2. Passenger A cancels it before driver acceptance.

**Expected:** Booking becomes `cancelled`; no seats are returned because none were reserved. No refund is created if no payment was held.

### 15.2 Passenger cancels after driver acceptance but before arrival

1. Create and accept a booking.
2. Confirm seats have been decremented.
3. Passenger cancels while booking is `accepted`.

**Expected:** Booking becomes `cancelled`; reserved seats are returned exactly once; held MoMo funds are sent to the refund path; no arrival penalty is applied.

### 15.3 Passenger cancels after driver arrival

1. Create and pay for a booking.
2. Driver marks it `arrived`.
3. Passenger cancels.

**Expected according to the supplied code:** `applyCancellationPenalty()` is called. The code currently uses a 30% penalty rate and calculates the remainder as a refund. Check the resulting ledger entries, driver share, platform share and refund amount. Confirm that this policy is disclosed in the app before relying on it.

### 15.4 Driver cancels

1. Create and pay for a booking.
2. Driver cancels before trip start.

**Expected:** Booking becomes cancelled, seats are returned once, and the full refund path is attempted. The passenger is notified.

### 15.5 Unauthorized cancellation

- Passenger B attempts to cancel Passenger A's booking.
- Driver B attempts to cancel Driver A's booking.
- An unrelated driver attempts to cancel a booking assigned to someone else.

**Expected:** Forbidden response and no state, seat or payment changes.

### 15.6 Invalid cancellation state

Attempt cancellation after `in_progress` and after `completed`.

**Expected:** Rejected because the supplied cancellable states are `requested`, `accepted` and `arrived` only.

### 15.7 Duplicate cancellation / seat return

Send two cancellation requests close together.

**Expected:** Only one cancellation succeeds; seats are not returned twice; refund/penalty is not processed twice. If the current implementation allows a race here, fix it with a conditional atomic state transition before production.

---

## 16. Test 11 — Booking expiry and unpaid acceptance expiry

The supplied `booking.service.ts` defines:

- Requested booking expiry after 15 minutes.
- Accepted MoMo booking payment expiry after 5 minutes if `paymentStatus` is not `escrow_held`.

The scheduler runs on a cron schedule, normally every minute.

### 16.1 Requested booking expires

1. Create a booking and leave it `requested` without driver response.
2. In a dedicated test database, set its `createdAt` older than 15 minutes or use a controlled clock in an automated test.
3. Run the booking expiry job or wait for the next scheduler execution.

**Expected:** Booking changes to `expired`, decline cache is cleared and `booking_expired` is published.

### 16.2 Accepted MoMo booking expires without payment

1. Create and accept a MoMo booking.
2. Do not initialize or complete payment.
3. In a dedicated test database, set `acceptedAt` older than 5 minutes or use a controlled clock.
4. Run the expiry job or wait for the scheduler.

**Expected:**

- Booking becomes `cancelled` with `cancellation.by: "system"` and `reason: "payment_timeout"`.
- Reserved seats are returned once.
- Passenger and driver receive the cancellation notification.
- No held payment is created.

### 16.3 Accepted and paid booking does not hit unpaid expiry

Complete payment before the five-minute deadline, then run the expiry job.

**Expected:** Booking remains active and seats remain reserved.

### 16.4 Confirm scheduler startup

Restart the API and check startup logs for both scheduler start messages. Confirm `startBookingScheduler()` and `startDemandScheduler()` are called exactly once in the actual application bootstrap. The definitions alone do not start the jobs.

---

## 17. Test 12 — Run ending and stale-driver cleanup

### 17.1 Driver manually ends a run

Use a run with a mix of bookings if possible:

- One `in_progress` booking.
- One `accepted` or `arrived` booking.
- One `requested` booking.

Call `PATCH <DRIVER_BASE>/runs/end`.

**Expected according to `resolveRunBookings()`:**

- Run becomes `ended` and driver becomes offline.
- In-progress bookings are completed when `completeInProgress: true` is passed.
- Accepted/arrived bookings are expired and their seats returned/refunds attempted.
- Requested bookings are moved to `no_drivers`, their driver/run references are cleared and passengers receive a decline notification.
- Redis GEO record is removed if Redis is enabled.

### 17.2 Stale run ends after missed heartbeats

1. Start a run.
2. Stop sending location heartbeats.
3. Wait past the 2-minute stale threshold.
4. Trigger a match search or call the cleanup function in a test harness; `findNearbyRuns()` calls `endStaleRuns()`.

**Expected:** Stale run is ended, driver goes offline, and attached bookings are resolved according to their states.

Do not use a long wait in every test run; in automated tests, control `lastLocationAt` or mock the clock.

---

## 18. Test 13 — Unmet demand and clustering

This is a separate flow from an individual booking match.

### 18.1 Demand is recorded when no driver can serve the passenger

1. Ensure no suitable run is available.
2. Passenger A calls the match endpoint.
3. Save the returned `demandId`.
4. Passenger A calls `GET /api/v1/bookings/demand/:id`.
5. Passenger B tries to retrieve Passenger A's demand ID.

**Expected:** Demand record exists for Passenger A; Passenger A can see its status; Passenger B is forbidden.

### 18.2 Demand clustering

1. Create at least five pending demand requests that satisfy the clustering rules (same/compatible origin cell and destination zone, within the demand time window).
2. Run `runClustering()` or wait for the demand scheduler.
3. Inspect the created `DemandCluster` and linked `DemandRequest` documents.

**Expected:** Requests become `clustered`, reference the cluster, and the cluster counts seats/passengers correctly. If the passenger threshold is at least five, nearby active drivers receive `high_demand_alert`.

### 18.3 Driver sees nearby demand

1. Log in as an approved driver with an active run.
2. Call `GET <DRIVER_BASE>/demand`.

**Expected:** Nearby open clusters are returned within the configured radius. A driver without an active run receives the expected error.

### 18.4 Driver accepts a demand cluster

1. Driver accepts an open cluster through `POST <DRIVER_BASE>/demand/:id/accept`.
2. Inspect cluster, run and linked demand requests.

**Expected:** Cluster becomes `accepted`, driver/run references are set, run destination/route is updated when Maps routing succeeds, and requests become `served` with `demand_matched` notifications.

### 18.5 Duplicate demand acceptance

A second driver attempts to accept the already accepted cluster.

**Expected:** Conflict response; cluster is not reassigned.

---

## 19. Test 14 — Live tracking and SSE event matrix

Test the complete stream, not just the first event received after connection.

| Booking/payment state | Passenger should receive precise `van_location`? | Passenger should receive `head_to_pickup`? |
|---|---:|---:|
| `requested`, MoMo unpaid | No | No |
| `accepted`, MoMo unpaid | No | No |
| `accepted`, MoMo escrow held | Yes, if tracking is enabled for this state | Yes when alert threshold is met |
| `arrived`, MoMo escrow held | Yes | No duplicate alert if already sent |
| `in_progress`, MoMo escrow held | Yes | No new pickup alert |
| `completed` | No further live tracking required | No |
| Cancelled/expired/refunded | No | No |
| Cash booking | Depends on the explicitly chosen cash policy; current helper allows access | Depends on the cash policy |

Also verify:

- Passenger receives only their own booking events.
- Assigned driver can receive the events intended for that driver.
- Unrelated passenger/driver cannot subscribe to the booking channel.
- A booking does not receive another booking's location because IDs/channels are mixed up.
- Closing the SSE connection stops further delivery to that connection.
- `ride_unlocked` causes the client to re-fetch permitted ride details; it must not itself contain unnecessary sensitive information.

---

## 20. Test 15 — Ledger, wallet and financial reconciliation

For each financial scenario, compare the booking, payment transaction, ledger postings, escrow balance, driver wallet balance and platform revenue balance.

### 20.1 Successful charge

- One charge posting only.
- Gateway debit equals escrow credit.
- Amount equals the verified provider amount and booking fare.
- Booking/payment transaction are marked consistently.

### 20.2 Successful trip completion

- One release posting only.
- Escrow debit equals driver wallet credit plus platform revenue credit.
- Driver/platform split matches the configured fare calculation.
- Seats are returned once.

### 20.3 Full refund

- Refund provider request is created.
- Ledger refund posting reverses escrow/gateway balances once.
- Booking and payment transaction refund states are reconciled to the actual provider result, not merely the API acceptance response.

### 20.4 Passenger cancellation penalty

- Penalty amount is calculated using the configured rate (30% in the supplied code).
- Refund portion and driver/platform distribution balance to the original held amount.
- No extra refund/release is posted on repeated requests.

### 20.5 Ledger integrity

For every posting, the debit and credit totals must balance. Check that duplicate webhook deliveries, repeated API verification and repeated lifecycle calls do not create duplicate postings. The idempotency key/reference in `postTransaction()` must enforce this at the database level.

---

## 21. Test 16 — Authorization and invalid requests

Run these negative tests with Passenger A, Passenger B, Driver A, Driver B and an unapproved driver:

- Unauthenticated user calls every protected route.
- Passenger tries driver accept/decline/status/run endpoints.
- Driver tries passenger match/fare/demand-status endpoints.
- Unapproved driver tries run and booking-offer endpoints.
- Wrong driver accepts or declines another driver's booking.
- Wrong passenger retrieves booking, demand or ride details.
- Wrong user opens a tracking stream.
- Invalid MongoDB ID is supplied for booking, run or demand.
- Malformed body is supplied to every validated route.
- Seats are zero, negative, decimal or above expected limits.
- Coordinates are missing, non-numeric or out of range.
- Invalid booking status transition is supplied.

**Expected:** Appropriate 400/401/403/404/409 responses; no database, seat, payment or ledger mutation occurs on rejected requests.

---

## 22. Suggested end-to-end run order

Use this exact sequence for the first full manual run:

1. Complete TypeScript/build checks and resolve the code-review blockers in Section 2.
2. Prepare Passenger A, Passenger B, Driver A, Driver B and Driver C.
3. Approve driver profiles and vehicles.
4. Start Driver A and Driver B runs on compatible test routes; keep sending heartbeats.
5. Confirm both runs appear as active and have known available-seat counts.
6. Estimate a fare as Passenger A.
7. Match a MoMo ride as Passenger A.
8. Confirm Driver A receives the offer and matching has not changed seat counts.
9. Have Driver A decline; confirm Driver B receives the same booking ID.
10. Have Driver B accept; confirm exactly one seat reservation decrement.
11. Attempt to arrive before payment; confirm it is blocked.
12. Initialize MoMo payment using the actual payment endpoint.
13. Complete the Paystack test payment and confirm webhook/verification processing.
14. Confirm `escrow_held`, one charge ledger posting and `ride_unlocked`.
15. Retrieve ride details as Passenger A; confirm driver/vehicle/pickup details are now available.
16. Open the tracking stream and send a driver heartbeat; confirm location updates arrive now.
17. Driver marks `arrived`, then `in_progress`.
18. Complete the trip; confirm seats return once and escrow is released once.
19. Repeat separate test bookings for passenger cancellation, driver cancellation, unpaid expiry and no-driver/refund cases.
20. Repeat with an unrelated passenger and unrelated driver to verify authorization boundaries.
21. Run unmet-demand clustering and driver acceptance as a separate test path.
22. Restart the API and repeat the decline-retry test to reveal the in-memory-cache limitation.
23. Inspect Paystack dashboard refund status for every refund scenario.

Do not mix all failure scenarios into one booking. Each scenario should start from a known state and have a recorded booking ID/reference.

---

## 23. Test result checklist

Use this checklist while testing. Mark a test only after checking both the API response and the database/event side effects.

### Setup and matching

- [ ] MongoDB transaction-capable environment confirmed.
- [ ] Geospatial indexes confirmed.
- [ ] Redis enabled/fallback behaviour confirmed.
- [ ] Maps API route and fallback behaviour confirmed.
- [ ] Driver approval and vehicle approval confirmed.
- [ ] Driver run creation confirmed.
- [ ] Location heartbeat and stale cutoff confirmed.
- [ ] Seat update/clamping confirmed.
- [ ] Fare estimate positive/negative cases confirmed.
- [ ] Passenger match creates one booking.
- [ ] Match does not decrement seats.
- [ ] Active-booking duplicate protection confirmed.
- [ ] Unmet demand recorded when no viable run exists.
- [ ] Driver decline automatically tries the next candidate.
- [ ] No-driver terminal state confirmed after candidates exhausted.
- [ ] Driver acceptance reserves seats exactly once.
- [ ] Insufficient-capacity acceptance rolls back correctly.

### Payment and privacy

- [ ] Payment blocked before an eligible booking state.
- [ ] Cash payment policy explicitly selected and tested.
- [ ] Wrong passenger cannot initialize/verify payment.
- [ ] Successful Paystack payment creates one charge posting.
- [ ] Failed/pending/wrong-amount payments do not unlock details.
- [ ] Verification network error leaves a retryable state.
- [ ] Duplicate webhook/verify delivery is idempotent.
- [ ] Late payment after cancelled/expired/no-driver booking is handled.
- [ ] Late payment after completed booking is handled.
- [ ] `ride_unlocked` only publishes after eligibility is confirmed.
- [ ] Initial match response contains no protected fields before payment.
- [ ] Booking list/detail responses mask protected fields before payment.
- [ ] Ride-details endpoint exists and is payment-gated.
- [ ] Initial and ongoing SSE events are payment-gated.
- [ ] Unrelated passenger/driver cannot access ride details or tracking.

### Lifecycle and operations

- [ ] Driver cannot arrive/start an unpaid MoMo trip.
- [ ] Paid trip progresses through arrived/in-progress/completed.
- [ ] Completion releases escrow exactly once.
- [ ] Completion returns seats exactly once.
- [ ] Passenger cancellation before arrival behaves correctly.
- [ ] Passenger cancellation after arrival applies the disclosed penalty.
- [ ] Driver cancellation triggers correct refund handling.
- [ ] Duplicate cancellation cannot return seats/refund twice.
- [ ] Requested booking expiry works.
- [ ] Unpaid accepted booking expiry works.
- [ ] Paid accepted booking is not expired by unpaid timeout.
- [ ] Manual run end resolves attached bookings.
- [ ] Stale run cleanup works.
- [ ] Demand clustering and driver acceptance work.
- [ ] Booking and demand schedulers start exactly once.
- [ ] Refund provider status is reconciled.
- [ ] Ledger debits and credits balance for all payment scenarios.

---

## 24. What is not proven by the supplied code

The document provided does not include enough implementation to confirm these items. Verify them in the actual project before calling the full system tested:

- Exact payment initialization/verification routes and their middleware.
- Exact Paystack webhook route, raw-body middleware and signature verification order.
- Application bootstrap calls for both schedulers.
- Mongoose schemas, indexes, validation and enum definitions for all statuses.
- `postTransaction()` idempotency implementation and database unique indexes.
- `PaystackService` test/live configuration and amount-unit conversion.
- Admin approval workflow for KYC and vehicles.
- App-level authentication middleware mounted before booking routes.
- Refund webhook/status reconciliation.
- Whether Redis is required or optional in the deployment configuration.

A successful Postman response alone is not proof of success. For every critical test, verify the persisted MongoDB state, available seats, payment transaction, ledger postings, and the SSE event received by the correct account.

---

## 25. Final recommendation

Run the test plan in layers:

1. **Compile and security gates first:** resolve the three named issues, route mismatch, match-service export mismatch, response masking and ongoing SSE payment enforcement.
2. **Core ride flow next:** driver run → passenger matching → driver decline/retry → driver acceptance → seat reservation.
3. **Payment next:** Paystack initialization → verification/webhook → escrow → unlock ride details.
4. **Lifecycle next:** arrival → trip start → completion → seat return → escrow release.
5. **Failure paths last:** no driver, decline exhaustion, payment timeout, provider error, late payment, cancellation, refund, stale run and demand clustering.

Only move to real-money pilot testing after the privacy tests, late-payment tests, transaction cleanup, payment verification retry, refund reconciliation and ledger integrity checks all pass.
