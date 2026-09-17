# 🚕 Troski Authentication API Integration Guide

This document outlines the authentication flows, rules, and endpoints for the Troski applications (Passenger App, Driver App, and Admin Panel). 

## 📌 1. Important Rules & Architecture
* **Base URL:** All endpoints are prefixed with `/api/v1/auth`.
* **Distinct Apps & Roles:** Authentication is scoped to the app being used. The backend enforces roles. Do not send role types in the login requests; the endpoints are already separated (e.g., `/passenger/login` vs `/driver/login`).
* **Rate Limiting:** 
  * Standard Auth routes: **15 requests per 15 minutes** per IP.
  * OTP Request routes: **3 requests per 15 minutes** per IP.
* **Account Lockout:** 5 failed login attempts will lock the account for 15 minutes.
* **Development Mode OTPs:** In development (`NODE_ENV=development`), SMS OTPs are NOT sent to real phones. They are printed in the backend console (e.g., `[DEV OTP] +233XXXXXXXXX: 123456`). Email OTPs, however, will be sent to the actual email via Brevo.

---

## 🔄 2. Core Authentication Flows

### Registration Flow (Passenger & Driver)
Unlike some standard flows, **OTP verification happens at the exact same time as account creation**. 
1. **Request OTP:** User enters their phone number (or email) and requests an OTP.
2. **Submit Registration:** User fills out their profile (Name, PIN, etc.), enters the OTP they received, and submits everything to the `/register` endpoint.
3. **Success:** The account is created, the phone is marked verified, and the user is immediately logged in.

### Login Flow
1. User enters Phone Number and 6-digit PIN.
2. If correct and verified, backend returns user data and sets a session/refresh token.

---

## 📖 3. Endpoint Reference: Passenger App

### POST `/api/v1/auth/passenger/request-otp`
#### Purpose
Triggers an SMS OTP to the user's phone for registration or PIN reset.

#### Request body
```json
{
  "phoneNumber": "+233XXXXXXXXX",
  "purpose": "signup" 
}
```
*(Note: `purpose` usually accepts values like `"signup"` or `"forgot-password"` based on your enums).*

#### Success (HTTP 200)
```json
{
  "status": 200,
  "message": "OTP sent successfully via SMS"
}
```

#### Errors
* `429` - Too many OTP requests (Max 3 per 15 minutes).

#### What frontend should do
Show the OTP input screen and the rest of the registration form.

---

### POST `/api/v1/auth/passenger/request-email-otp`
#### Purpose
Fallback mechanism if SMS fails. Sends the OTP to the user's email address.

#### Request body
```json
{
  "email": "john@example.com",
  "purpose": "signup"
}
```

---

### POST `/api/v1/auth/passenger/register`
#### Purpose
Verifies the OTP and creates the passenger account in one single step. Instantly logs the user in upon success.

#### Request body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+233XXXXXXXXX",
  "pin": "123456",
  "otpCode": "482913"
}
```

#### Success (HTTP 201)
```json
{
  "status": 201,
  "message": "Passenger registered successfully",
  "cookieData": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "role": "passenger",
      "accountStatus": "active"
    },
    "refreshToken": "..."
  }
}
```

#### Errors
* `400` - Email/Phone already exists, Invalid/Expired OTP, or Incorrect OTP.

#### What frontend should do
Store the returned user data in global state/context and navigate the user to the **Passenger Home** screen.

---

### POST `/api/v1/auth/passenger/login`
#### Purpose
Logs in an existing, verified passenger.

#### Request body
```json
{
  "phoneNumber": "+233XXXXXXXXX",
  "pin": "123456"
}
```

#### Success (HTTP 200)
Returns the same `cookieData` object as the registration endpoint.

#### Errors
* `401` - Invalid credentials or Phone not verified.
* `403` - Account deactivated or suspended.
* `423` - Account locked (too many failed attempts).

#### What frontend should do
Store user data and navigate to **Passenger Home**.

---

## 🚕 4. Endpoint Reference: Driver App
*Driver endpoints function identically to passenger endpoints, but interact with Driver schemas.*

* **`POST /api/v1/auth/driver/request-otp`** (Same payload as Passenger)
* **`POST /api/v1/auth/driver/request-email-otp`** (Same payload as Passenger)
* **`POST /api/v1/auth/driver/register`** (Same payload as Passenger)
  * *Important Note for Frontend:* Successful registration does **not** mean the driver can accept rides. Their `verificationStatus` defaults to `"incomplete"`. Registration should route them to the **Driver Onboarding/Document Upload** flow, not the active map.
* **`POST /api/v1/auth/driver/login`** (Same payload as Passenger)

---

## 🌐 5. Global / Shared Endpoints

### POST `/api/v1/auth/google`
#### Purpose
Authenticates a user via Google OAuth. Handles both Login (for existing users) and Registration (for new users).

#### Request body
```json
{
  "idToken": "eyJhbGciOiJSUzI1...",
  "role": "passenger", 
  "phoneNumber": "+233XXXXXXXXX" 
}
```
*Note: `role` and `phoneNumber` are **strictly required** if this is a first-time Google sign-up. For returning users, just `idToken` is sufficient, though it is safe to always send all three.*

#### Success (HTTP 200)
Returns standard user object and tokens.

#### Errors
* `400` - Role/Phone missing for new account.
* `401` - Invalid Google Token.

#### What frontend should do
If the backend throws a `400` indicating missing role/phone, prompt the user for their phone number, then retry the request with all fields.

---

### DELETE `/api/v1/auth/logout`
#### Purpose
Invalidates the refresh token and ends the user's session. Requires the user to be currently authenticated.

#### Request body
None.

#### Success (HTTP 200)
Clears database tokens. 

#### What frontend should do
Clear local user state/storage and navigate to the **Welcome/Login screen**.

---

## 🔐 6. Admin Authentication Endpoints
*For the internal Troski admin dashboard.*

### POST `/api/v1/auth/admin/register`
* **Purpose:** Creates a new admin. No OTP verification required.
* **Payload:** `{ "name": "Admin Name", "email": "admin@troski.com", "adminId": "ADM-001", "password": "securepassword" }`

### POST `/api/v1/auth/admin/login`
* **Purpose:** Admin login.
* **Payload:** `{ "adminId": "ADM-001", "password": "securepassword" }`