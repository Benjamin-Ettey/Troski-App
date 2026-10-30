# 🚐 Troski Booking API Integration Guide

This document covers the ride-booking system: how drivers go live on a route, how passengers get matched to a trotro and tracked in real time, the seat/trip lifecycle, and driver approval. It reflects the **route-following model** that mirrors how trotros actually work in Ghana.

## 📌 1. Important Rules & Architecture

- **Base URLs:** passenger/booking endpoints under `/api/v1/bookings`, driver endpoints under `/api/v1/driver`, admin review under `/api/v1/admin`. All require an authenticated session (same cookie auth as the rest of the app); role is enforced per route.
- **The model:** trotros run **fixed routes** (From → To). A passenger does **not** get a door-to-door pickup — they are matched to a van already heading their way and told to **walk to a pickup point on the van's route**. The van never diverts.
- **Locations are flexible:** pickup, destination, and a driver's route endpoints can each be a **dropped pin (coordinates)** from the app's map/place picker, **or** a town name. The backend derives the pricing _zone_ from the nearest known town, so you can go anywhere on the map.
- **Maps:** distances/ETAs/route shapes use Google's **Routes API**; addresses use the **Geocoding API**. If the maps key is absent, the system **falls back** to straight-line distance and estimated ETAs — everything still functions, just less precise.
- **Real-time:** live van tracking and alerts are delivered over **Server-Sent Events (SSE)**, not WebSockets. The passenger app opens an `EventSource`; the driver app sends GPS over normal HTTP.
- **Driver gating:** a driver can only go live / be matched when they are **approved AND have an approved vehicle** (both enforced together).

---

## 🔄 2. Core Flows

### A. Driver goes live (a "run")

1. `POST /driver/runs/start` with the route (From → To). The driver goes online; available seats default to the vehicle capacity.
2. The app streams GPS every few seconds via `PATCH /driver/runs/location`.
3. Seats are kept current (driver/conductor) via `PATCH /driver/runs/seats` as people board/alight.
4. `PATCH /driver/runs/end` ends the run and goes offline.

### B. Passenger gets a ride

1. `POST /bookings/match` with the passenger's current location + destination.
2. The system finds the nearest van heading to that destination with free seats, reserves a seat, and returns a **pickup point on the route** + the van's **ETA**.
3. The passenger opens `GET /bookings/:id/track` (SSE) to watch the van and receives a **"head to pickup"** alert when it's ~3 min away.
4. The driver advances the trip (`arrived` → `in_progress`), and the trip ends — automatically (van reaches destination) or when the driver marks it `completed`.

### C. Seat & trip lifecycle

- A seat is **reserved** the moment a passenger is matched.
- It is **returned** to the van when the trip completes, is cancelled, or expires.
- Trips end **automatically** when: (a) the van reaches the destination (geofence), or (b) the driver ends the run (rides are completed, never-boarded passengers are expired + refunded).

---

## 🧍 3. Endpoint Reference: Passenger

### POST `/api/v1/bookings/match`

#### Purpose

Match the passenger to the best nearby trotro heading to their destination, reserve a seat, and return the pickup point + ETA.

#### Request body

```json
{
  "pickupLat": 5.5602,
  "pickupLng": -0.205,
  "destLat": 5.681,
  "destLng": -0.167,
  "seats": 1
}
```

`destLat`/`destLng` (a dropped pin) **or** `destinationTown: "Madina"` — at least one is required. `pickupLat`/`pickupLng` are required. `seats` defaults to 1.

#### Success (HTTP 201)

```json
{
  "message": "Matched! Walk to Awudome Junction — your trotro arrives in about 6 min.",
  "data": {
    "booking": {
      "_id": "...",
      "status": "accepted",
      "run": "...",
      "fareEstimate": 7,
      "etaMinutes": 6
    },
    "pickupPoint": { "name": "Awudome Junction", "lat": 5.559, "lng": -0.204 },
    "etaMinutes": 6,
    "seatsRemaining": 2,
    "fare": {
      "total": 7,
      "finalFare": 7,
      "driverPay": 6.03,
      "troskiProfit": 0.97
    }
  }
}
```

#### Errors

- `400` - Missing destination.
- `404` - No trotro heading that way nearby (tell the passenger to retry shortly).
- `409` - The passenger already has an active ride, or seats just filled up.

#### What frontend should do

Show the pickup point on the map with a walking route, display the ETA, and open the tracking stream (below).

---

### GET `/api/v1/bookings/:id/track` (SSE stream)

#### Purpose

Live stream of the van's position and trip events. Open with `EventSource` (send credentials so the auth cookie is included).

#### Events

| Event            | When                                     | Payload                                                           |
| ---------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| `van_location`   | every GPS update (+ an initial snapshot) | `{ van: {latitude, longitude}, etaMinutes, pickupPoint, status }` |
| `head_to_pickup` | van is ~3 min from the pickup (once)     | `{ pickupPoint, etaMinutes }`                                     |
| `driver_arrived` | driver marks `arrived`                   | `{ status }`                                                      |
| `trip_started`   | driver marks `in_progress`               | `{ status }`                                                      |
| `trip_completed` | trip ends                                | `{ bookingId, fare }`                                             |
| `trip_expired`   | matched but run ended before boarding    | `{ bookingId }`                                                   |

#### Errors

- `401` - Not authenticated. `403` - Not a participant on this booking. `404` - Booking not found.

#### What frontend should do

Animate the van marker between `van_location` updates; on `head_to_pickup`, prompt the passenger to start walking; on `trip_completed`, show the receipt screen.

---

### PATCH `/api/v1/bookings/:id/cancel`

#### Purpose

Cancel a booking (passenger or the assigned driver) before the trip is over. Frees the seat and triggers a refund if the passenger had paid.

#### Request body

```json
{ "reason": "Changed my mind" }
```

`reason` is optional.

#### Errors

- `400` - The booking is already completed/cancelled. `403` - Not allowed. `404` - Not found.

---

### GET `/api/v1/bookings` and GET `/api/v1/bookings/:id`

- **`GET /bookings`** — the caller's bookings (passenger or driver), with `?status=` and `?page=&limit=` pagination.
- **`GET /bookings/:id`** — one booking; only a participant (or admin) may view it.

---

## 🚐 4. Endpoint Reference: Driver — Live Runs

_All run endpoints require an approved driver with an approved vehicle._

### POST `/api/v1/driver/runs/start`

#### Purpose

Start a run on a declared route and go online.

#### Request body

```json
{
  "fromLat": 5.5602,
  "fromLng": -0.205,
  "toLat": 5.681,
  "toLng": -0.167,
  "availableSeats": 14
}
```

Each endpoint can be coordinates (`fromLat/fromLng`, `toLat/toLng`) **or** a town name (`fromTown`, `toTown`). `availableSeats` is optional (defaults to the vehicle's capacity).

#### Success (HTTP 201)

```json
{
  "message": "Run started. You are now live.",
  "data": { "run": { "_id": "...", "status": "active", "availableSeats": 14 } }
}
```

#### Errors

- `400` - Missing/invalid route, or start == destination. `409` - You already have an active run.

---

### PATCH `/api/v1/driver/runs/location`

#### Purpose

GPS heartbeat (send every few seconds). Updates the live position and, optionally, seats. This is also what powers passenger tracking + "head to pickup" alerts + geofence auto-complete.

#### Request body

```json
{ "latitude": 5.5631, "longitude": -0.2012, "availableSeats": 12 }
```

> ⚠️ A run whose GPS goes silent for ~2 minutes is treated as a "ghost" and auto-ended (the driver is set offline). Keep the heartbeat alive while live.

---

### PATCH `/api/v1/driver/runs/seats`

#### Purpose

Update available seats as passengers board/alight.

#### Request body

```json
{ "delta": -1 }
```

Send `delta` (relative, e.g. `-1` when someone boards) **or** `availableSeats` (absolute). Clamped to `[0, capacity]`. (The app should debounce rapid taps into one call.)

---

### GET `/api/v1/driver/runs/active` · POST `/api/v1/driver/runs/end`

- **`GET /runs/active`** — the driver's current run (or `404` if none).
- **`POST /runs/end`** — end the run and go offline. Passengers mid-trip are completed (paid out); passengers matched but not yet boarded are expired + refunded.

---

### Driver trip control: PATCH `/api/v1/bookings/:id/status`

#### Purpose

Advance a specific passenger's trip. Valid transitions: `accepted → arrived → in_progress → completed`.

#### Request body

```json
{ "status": "in_progress" }
```

Marking `completed` settles the fare to the driver's wallet and frees the seat. (A trip also auto-completes when the van reaches the destination — see geofence.)

---

## 🛡️ 5. Driver Approval (onboarding gate)

A driver registers (see the Auth guide), submits KYC + vehicle docs, and an admin approves them. A driver is only dispatchable once **both** the profile and a vehicle are approved.

- **`GET /api/v1/driver/status`** — the driver checks their own state: `{ verificationStatus, vehicleStatus, isDispatchable, ...rejection reasons }`.
- **`POST /api/v1/driver/kyc`** — submit Ghana Card + licence (multipart).
- **`POST /api/v1/driver/vehicle`** — submit vehicle + documents (multipart).
- **Admin:** `GET /api/v1/admin/drivers` (review queue, defaults to pending), `GET /api/v1/admin/drivers/:driverId`, `GET /api/v1/admin/vehicles`, `PATCH /api/v1/admin/:driverId/status`, `PATCH /api/v1/admin/vehicle/:vehicleId/status`.

---

## 🧾 6. Status Reference

**Booking status:** `requested` → `accepted` → `arrived` → `in_progress` → `completed`; plus `cancelled`, `expired`, `no_drivers`.
_(In the route-following match flow a booking starts at `accepted` — the van is already assigned.)_

**Run status:** `active` → `ended`.

**Payment status** (`booking.paymentStatus`, see the Payment guide): `pending` → `escrow_held` → `released` (on completion) or `refunded` (on cancel/expire).

---

## 🔌 7. Frontend Integration Notes

- **Tracking:** `const es = new EventSource('/api/v1/bookings/<id>/track', { withCredentials: true })`, then listen for the events in §3. Smooth marker animation between updates is the app's job; the backend sends clean positions + ETAs.
- **Location input:** use a map/place picker and send coordinates — no town list required.
- **Driver heartbeat:** send `PATCH /runs/location` on a timer (e.g. every 4s) while live; interpolate the marker client-side.
- **No maps key yet?** Everything works via straight-line fallbacks; distances/ETAs sharpen once `GOOGLE_MAPS_API_KEY` (Routes API + Geocoding API enabled) is set.

---

## 🧪 8. Legacy Endpoints (being retired)

These are from the earlier town-to-town/pooled model and are superseded by `POST /bookings/match` + driver runs. Avoid building new features on them:

- `POST /api/v1/bookings/estimate` — town-to-town fare estimate.
- `POST /api/v1/bookings/` — town-to-town booking create.
- `GET /api/v1/bookings/available` + `PATCH /api/v1/bookings/:id/accept` — the old "driver picks from a request pool" flow.
