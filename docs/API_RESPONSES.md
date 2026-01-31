# WashNow API – Endpoints & Response Reference

Base URL: `{{baseURL}}` (e.g. `https://carwashapp.shoppypie.in`)  
All user (visitor) and owner APIs, with expected request/response shapes used by the app.

---

## Quick reference – all API responses (user & owner)

| # | Endpoint | Method | Role | Success response keys (app uses) |
|---|----------|--------|------|-----------------------------------|
| 1 | `/api/v1/auth/visitor/login` | POST | User | `data.token`, `data.userData` (id, name, email, phone, carmake, carmodel, vehicle_no, status, created_at) |
| 2 | `/api/v1/auth/user/login` | POST | Owner | `data.token`, `data.userData` (+ `service_centre`: phone, address, weekoff_days, is_24h_open, open_time, close_time, clat, clong) |
| 3 | `/api/v1/auth/visitor/register` | POST | User | `data.token`, `data.userData` (same as login) |
| 4 | `/api/v1/auth/visitor/request-otp` | POST | User | `data` (OTP sent) |
| 5 | `/api/v1/auth/visitor/verify-otp` | POST | User | `data.token`, `data.userData` |
| 6 | `/api/v1/visitor/servicecentrelist` | POST | User | `data.list` (array of centres: id, name, address, email, phone, weekoff_days, clat, clong, services_offered) |
| 7 | `/api/v1/visitor/timeslotsforcentre` | POST | User | `data.list.timeSlots` (id, name, available) |
| 8 | `/api/v1/visitor/booknow` | POST | User | `data.bookingData.booking_id`, `data.bookingData.bookingno` (or data.booking_id, data.bookingno) |
| 9 | `/api/v1/visitor/bookinglist` | GET | User | `data.bookinglist` (array of bookings) |
| 10 | `/api/v1/visitor/cancle-booking` | POST | User | `success`, `message` |
| 11 | `/api/v1/visitor/bookingreschedule` | POST | User | `success`, `message` |
| 12 | `/api/v1/visitor/initiatepayment` | POST | User | `data.payment_id`, `data.booking_id` |
| 13 | `/api/v1/visitor/editprofile` | POST | User | `success`, `message`, `data.userData` |
| 14 | `/api/v1/visitor/logout` | POST | User | `success` |
| 15 | `/api/v1/visitor/change-password` | POST | User | `success`, `message` |
| 16 | `/api/v1/visitor/alerts` | POST | User | `data.alertslist` or `data.alerts` or `data` (array) |
| 17 | `/api/v1/visitor/alerts/:id/read` | POST | User | `success`, `message` |
| 18 | `/api/v1/visitor/alerts/read-all` | POST | User | `success` |
| 19 | `/api/v1/visitor/faqlist` | GET | User | `data.faqslist` or `data.faqlist` (array: id, question, answer) |
| 20 | `/api/v1/visitor/savefcmtoken` | POST | User | `success`, `message` |
| 21 | `/api/v1/user/logout` | POST | Owner | `success` |
| 22 | `/api/v1/user/bookings` | GET | Owner | `data.bookingsList.bookings`, `data.bookingsList.booking_status_totals` (or data.bookings, data) |
| 23 | `/api/v1/user/cancle-booking` | POST | Owner | `success`, `message` |
| 24 | `/api/v1/user/completed-booking` | POST | Owner | `success`, `message` |
| 25 | `/api/v1/user/editprofile` | POST | Owner | `success`, `message` |
| 26 | `/api/v1/user/alerts` | POST | Owner | same as visitor alerts |
| 27 | `/api/v1/user/alerts/:id/read` | POST | Owner | `success`, `message` |
| 28 | `/api/v1/user/alerts/read-all` | POST | Owner | `success` |
| 29 | `/api/v1/user/change-password` | POST | Owner | `success`, `message` |
| 30 | `/api/v1/user/faqlist` | GET | Owner | `data.faqslist` or `data.faqlist` (array) |
| 31 | `/api/v1/user/savefcmtoken` | POST | Owner | `success`, `message` |
| 32 | `/api/create-payment-intent` | POST | Both | `clientSecret` or app payment payload |
| 33 | `/api/v1/auth/validate` | GET | Both | token valid / 200 OK |

---

## Auth (no token)

### 1. Visitor Login  
**POST** ` /api/v1/auth/visitor/login`  
**Headers:** `Accept: application/json`, `Content-Type: application/json`  
**Body (JSON):** `{ "email": string, "password": string }`

**Success response (app expects):**
```json
{
  "success": true,
  "data": {
    "token": "string",
    "loginType": "visitor",
    "userData": {
      "id": number,
      "name": string,
      "email": string,
      "phone": string,
      "carmake": string,
      "carmodel": string,
      "vehicle_no": string,
      "status": string,
      "created_at": string,
      "updated_at": string
    }
  }
}
```

---

### 2. Owner Login  
**POST** ` /api/v1/auth/user/login`  
**Headers:** `Accept: application/json`  
**Body:** FormData `email`, `password`

**Success response (app expects):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "string",
    "loginType": "user",
    "userData": {
      "id": number,
      "name": string,
      "email": string,
      "tenant_id": number,
      "service_id": number,
      "role": string,
      "status": string,
      "service_centre": {
        "id": number,
        "name": string,
        "email": string,
        "phone": string,
        "address": string,
        "weekoff_days": ["Monday", "Tuesday", ...],
        "is_24h_open": boolean,
        "open_time": "09:30:00",
        "close_time": "18:30:00",
        "status": string,
        "clat": string,
        "clong": string,
        "created_at": string,
        "updated_at": string
      },
      "bookings_by_service": []
    }
  }
}
```

---

### 3. Visitor Register  
**POST** ` /api/v1/auth/visitor/register`  
**Headers:** `Accept: application/json`, `Content-Type: application/json`  
**Body (JSON):**  
`name`, `email`, `phone`, `password`, `password_confirmation`, `carmake`, `carmodel`, `vehicle_no`, `device_token`

**Success response (app expects):**
```json
{
  "success": true,
  "data": {
    "token": "string",
    "loginType": "visitor",
    "userData": { "id", "name", "email", "phone", "carmake", "carmodel", "vehicle_no", "status", "created_at", "updated_at" }
  }
}
```

---

### 4. Request OTP  
**POST** ` /api/v1/auth/visitor/request-otp`  
**Headers:** `Accept: application/json`, `Content-Type: application/json`  
**Body (JSON):** phone number  
**Success:** `{ "success": true, "data": { ... } }`

---

### 5. Verify OTP  
**POST** ` /api/v1/auth/visitor/verify-otp`  
**Headers:** `Accept: application/json`, `Content-Type: application/json`  
**Body (JSON):** OTP + phone  
**Success:** `{ "success": true, "data": { "token", "userData" } }`

---

## User (Visitor) – Bearer token

### 6. Service Centre List  
**POST** ` /api/v1/visitor/servicecentrelist`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Body (JSON):** `lat`, `lng`, `activeService`, `radius` (optional)

**Success response (app expects):**
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": number,
        "name": string,
        "address": string,
        "email": string,
        "phone": string,
        "weekoff_days": [],
        "clat": string,
        "clong": string,
        "services_offered": [],
        "status": string
      }
    ]
  }
}
```

---

### 7. Time Slots for Centre  
**POST** ` /api/v1/visitor/timeslotsforcentre`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Body (JSON):** `{ "centreId": string, "bookingDate": "YYYY-MM-DD" }`

**Success response (app expects):**
```json
{
  "success": true,
  "data": {
    "list": {
      "timeSlots": [
        { "id": number, "name": string, "available": number, ... }
      ]
    }
  }
}
```

---

### 8. Book Now  
**POST** ` /api/v1/visitor/booknow`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
**Body:** FormData (service_centre_id, service_id, booking_date, time_slot_id, vehicle_no, etc.)

**Success response (app expects):**
```json
{
  "success": true,
  "data": {
    "bookingData": {
      "booking_id": number,
      "bookingno": string,
      "booking_no": string
    }
  }
}
```
App also reads: `data.booking_id`, `data.bookingno`, `data.bookingData.id`, etc.

---

### 9. Booking List (user)  
**GET** ` /api/v1/visitor/bookinglist`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`

**Success response (app expects):**
```json
{
  "success": true,
  "data": {
    "bookinglist": [
      {
        "id": number,
        "booking_id": number,
        "booking_date": string,
        "booking_time": string,
        "status": string,
        "customer_name": string,
        "vehicle_no": string,
        "service_name": string,
        "total_amount": number,
        "created_at": string,
        ...
      }
    ]
  }
}
```

---

### 10. Cancel Booking (visitor)  
**POST** ` /api/v1/visitor/cancle-booking`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
**Body:** FormData or JSON with `booking_id`  
**Success:** `{ "success": true, "message": string }`

---

### 11. Reschedule Booking  
**POST** ` /api/v1/visitor/bookingreschedule`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Body (JSON):** `{ "id": number, "booking_date": "YYYY-MM-DD", "time_slot_id": number }`  
**Success:** `{ "success": true, "message": string }`

---

### 12. Initiate Payment  
**POST** ` /api/v1/visitor/initiatepayment`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
**Body:** FormData `booking_id`, `bookingno`, `provider`, `amount`  
**Success:** `{ "success": true, "data": { "payment_id", "booking_id" } }`

---

### 13. Visitor Edit Profile  
**POST** ` /api/v1/visitor/editprofile`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
**Body:** FormData `name`, `phone` (and any other profile fields)  
**Success:** `{ "success": true, "message": string, "data": { "userData": {} } }`

---

### 14. Visitor Logout  
**POST** ` /api/v1/visitor/logout`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
**Success:** `{ "success": true }` (app does not wait for response)

---

### 15. Visitor Change Password  
**POST** ` /api/v1/visitor/change-password`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
**Body:** current_password, new_password, etc.  
**Success:** `{ "success": true, "message": string }`

---

### 16. Visitor Alerts  
**POST** ` /api/v1/visitor/alerts`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Success response (app expects):**
```json
{
  "success": true,
  "data": {
    "alertslist": [],
    "alerts": [],
    "data": []
  }
}
```
App uses first of: `data.alertslist`, `data`, `data.alerts`, `data.data`, `data`.

---

### 17. Mark Alert Read (visitor)  
**POST** ` /api/v1/visitor/alerts/:alertId/read`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Success:** `{ "success": true, "message": string }`

---

### 18. Alerts Read All (visitor)  
**POST** ` /api/v1/visitor/alerts/read-all`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
**Success:** `{ "success": true }`

---

### 19. Visitor FAQ List  
**GET** ` /api/v1/visitor/faqlist`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
Used by HelpSupportScreen (axios).  
**Success:** `{ "success": true, "data": { "faqslist": [] } }` or `data.faqslist` / `data.faqlist` / `data` array.

---

### 20. Save FCM Token (visitor)  
**POST** ` /api/v1/visitor/savefcmtoken`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Body (JSON):** `{ "deviceToken": string, "platform": "android" | "ios" }`  
**Success:** `{ "success": true, "message": string }`

---

## Owner (User) – Bearer token

### 21. Owner Logout  
**POST** ` /api/v1/user/logout`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
**Success:** `{ "success": true }` (app does not wait)

---

### 22. Owner Bookings  
**GET** ` /api/v1/user/bookings`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`

**Success response (app expects):**
```json
{
  "success": true,
  "data": {
    "bookingsList": {
      "bookings": [],
      "booking_status_totals": {}
    }
  }
}
```
App also accepts: `data.bookings`, `data`, `data.bookings`.

---

### 23. Owner Cancel Booking  
**POST** ` /api/v1/user/cancle-booking`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
**Body:** FormData `booking_id`, `status` (e.g. cancelled)  
**Success:** `{ "success": true, "message": string }`

---

### 24. Owner Completed Booking  
**POST** ` /api/v1/user/completed-booking`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
**Body:** FormData `booking_id` (and any required fields)  
**Success:** `{ "success": true, "message": string }`

---

### 25. Owner Edit Profile  
**POST** ` /api/v1/user/editprofile`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
**Body (FormData):**
- `name`, `phone`
- `address`, `city`, `zip` / `zipcode` / `postal_code`
- `clat`, `clong`
- `is_24h_open`: `1` or `0`
- `open_time`: H:i (e.g. `09:30`)
- `close_time`: H:i (e.g. `18:30`)
- `weekoff_days[]`: array (Monday, Tuesday, ...)

**Success:** `{ "success": true, "message": string }`  
App merges response into local user; backend may return updated user object.

---

### 26. Owner Alerts  
**POST** ` /api/v1/user/alerts`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Success:** Same shape as visitor alerts (`data.alertslist` / `data.alerts` / `data` array).

---

### 27. Mark Alert Read (owner)  
**POST** ` /api/v1/user/alerts/:alertId/read`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Success:** `{ "success": true, "message": string }`

---

### 28. Alerts Read All (owner)  
**POST** ` /api/v1/user/alerts/read-all`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
**Success:** `{ "success": true }`

---

### 29. Owner Change Password  
**POST** ` /api/v1/user/change-password`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
**Body:** current_password, new_password, etc.  
**Success:** `{ "success": true, "message": string }`

---

### 30. Owner FAQ List  
**GET** ` /api/v1/user/faqlist`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`  
**Success:** `{ "success": true, "data": { "faqslist": [] } }` or `data.faqlist` / `data` array.

---

### 31. Save FCM Token (owner)  
**POST** ` /api/v1/user/savefcmtoken`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Body (JSON):** `{ "deviceToken": string, "platform": "android" | "ios" }`  
**Success:** `{ "success": true, "message": string }`

---

## Other (payment / validate)

### 32. Create Payment Intent  
**POST** ` /api/create-payment-intent`  
**Headers:** `Accept: application/json`, `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Body (JSON):** amount, currency, booking info, etc.  
**Success:** Stripe-style `{ "clientSecret": string }` or app-specific success payload.

---

### 33. Auth Validate  
**GET** ` /api/v1/auth/validate`  
**Headers:** `Authorization: Bearer <token>` (if used)  
Used by authService to validate token.  
**Success:** `{ "valid": true }` or 200 OK.

---

## Common response shape

- **Success:** `{ "success": true, "message": "...", "data": { ... } }`  
- **Error:** `{ "success": false, "message": "...", "error": "...", "errors": { "field": ["msg"] } }`  
- **Auth:** 401 → app clears token and user; error message shown.

---

## Quick index

| #  | Endpoint                          | Method | Auth   | Role   |
|----|-----------------------------------|--------|--------|--------|
| 1  | /api/v1/auth/visitor/login       | POST   | No     | User   |
| 2  | /api/v1/auth/user/login          | POST   | No     | Owner  |
| 3  | /api/v1/auth/visitor/register    | POST   | No     | User   |
| 4  | /api/v1/auth/visitor/request-otp | POST   | No     | User   |
| 5  | /api/v1/auth/visitor/verify-otp  | POST   | No     | User   |
| 6  | /api/v1/visitor/servicecentrelist | POST | Bearer | User   |
| 7  | /api/v1/visitor/timeslotsforcentre | POST | Bearer | User   |
| 8  | /api/v1/visitor/booknow          | POST   | Bearer | User   |
| 9  | /api/v1/visitor/bookinglist      | GET    | Bearer | User   |
| 10 | /api/v1/visitor/cancle-booking  | POST   | Bearer | User   |
| 11 | /api/v1/visitor/bookingreschedule| POST   | Bearer | User   |
| 12 | /api/v1/visitor/initiatepayment | POST   | Bearer | User   |
| 13 | /api/v1/visitor/editprofile     | POST   | Bearer | User   |
| 14 | /api/v1/visitor/logout           | POST   | Bearer | User   |
| 15 | /api/v1/visitor/change-password  | POST   | Bearer | User   |
| 16 | /api/v1/visitor/alerts           | POST   | Bearer | User   |
| 17 | /api/v1/visitor/alerts/:id/read  | POST   | Bearer | User   |
| 18 | /api/v1/visitor/alerts/read-all | POST   | Bearer | User   |
| 19 | /api/v1/visitor/faqlist          | GET    | Bearer | User   |
| 20 | /api/v1/visitor/savefcmtoken    | POST   | Bearer | User   |
| 21 | /api/v1/user/logout             | POST   | Bearer | Owner  |
| 22 | /api/v1/user/bookings           | GET    | Bearer | Owner  |
| 23 | /api/v1/user/cancle-booking     | POST   | Bearer | Owner  |
| 24 | /api/v1/user/completed-booking  | POST   | Bearer | Owner  |
| 25 | /api/v1/user/editprofile         | POST   | Bearer | Owner  |
| 26 | /api/v1/user/alerts              | POST   | Bearer | Owner  |
| 27 | /api/v1/user/alerts/:id/read     | POST   | Bearer | Owner  |
| 28 | /api/v1/user/alerts/read-all     | POST   | Bearer | Owner  |
| 29 | /api/v1/user/change-password     | POST   | Bearer | Owner  |
| 30 | /api/v1/user/faqlist             | GET    | Bearer | Owner  |
| 31 | /api/v1/user/savefcmtoken       | POST   | Bearer | Owner  |
| 32 | /api/create-payment-intent      | POST   | Bearer | Both   |
| 33 | /api/v1/auth/validate           | GET    | Bearer | Both   |
