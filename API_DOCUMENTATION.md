# ShareBite — Complete REST API Documentation

This document describes all REST API endpoints available in the ShareBite food waste reduction platform.

## Base URL
`/api`

## Authentication
Authentication uses standard JSON Web Tokens (JWT). Include the JWT token in the `Authorization` header:
```http
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication & Profiles (`/api/auth`)

### `POST /api/auth/register`
Register a new user or organization.
- **Request Body:**
  ```json
  {
    "name": "Green Bistro Catering",
    "email": "bistro@example.com",
    "password": "securePassword123",
    "role": "donor", // "donor" | "recipient" | "organization" | "admin"
    "phone": "+1 (555) 019-2834",
    "address": "450 Howard St",
    "city": "San Francisco, CA",
    "organizationDetails": {
      "orgName": "Green Bistro",
      "registrationNumber": "CA-9821",
      "mission": "Zero food waste catering",
      "website": "https://example.com"
    }
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "user": { "id": "usr_...", "name": "...", "email": "...", "role": "donor", ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
  ```

### `POST /api/auth/login`
Authenticate existing user.
- **Request Body:**
  ```json
  {
    "email": "greenbistro@sharebite.org",
    "password": "donor123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "user": { "id": "usr_donor1", "name": "Marcus Vance", ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
  ```

### `POST /api/auth/demo-login`
Quick demo login without credentials.
- **Request Body:**
  ```json
  {
    "role": "donor" // "donor" | "organization" | "recipient" | "admin"
  }
  ```
- **Response (200 OK):** Returns user profile and signed JWT token.

### `GET /api/auth/me`
Retrieve currently authenticated user session.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "user": { ... },
    "unreadNotificationsCount": 2
  }
  ```

### `PUT /api/auth/profile`
Update user profile fields.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `{ "name": "...", "phone": "...", "address": "...", "avatarUrl": "..." }`

---

## 2. Food Listings (`/api/food`)

### `GET /api/food`
Search, filter, and sort food listings.
- **Query Parameters:**
  - `search`: Keyword string (matches title, description, donor, address)
  - `category`: Category string (e.g. `Prepared Meals`, `Bakery & Pastries`, `Fresh Produce`, etc.)
  - `status`: `available`, `requested`, `accepted`, `collected`, `expired`, or `all`
  - `dietary`: Dietary tag (e.g. `Vegetarian`, `Vegan`, `Halal`, `Gluten-Free`)
  - `priority`: `Urgent`, `High`, `Normal`
  - `sortBy`: `expiry_asc` (default), `distance`, `newest`, `servings`
  - `userLat`, `userLng`: Coordinates for real-time distance calculation
- **Response (200 OK):**
  ```json
  {
    "listings": [
      {
        "id": "food_1",
        "title": "Warm Vegetable Rice & Lentil Dal Platters",
        "category": "Prepared Meals",
        "quantity": 20,
        "unit": "plates",
        "estimatedServings": 24,
        "dietaryTags": ["Vegetarian", "Vegan", "Gluten-Free"],
        "status": "available",
        "rescuePriority": "Urgent",
        "imageUrl": "https://...",
        "pickupAddress": "450 Howard St",
        "expiryDate": "2026-10-07T14:30:00.000Z",
        "distanceKm": 1.2
      }
    ],
    "total": 1
  }
  ```

### `GET /api/food/:id`
Get full details of a specific food post, including donor credentials.
- **Response (200 OK):**
  ```json
  {
    "listing": { ... },
    "donor": { "id": "...", "name": "...", "mealsRescued": 320, ... }
  }
  ```

### `POST /api/food`
Create a new surplus food listing.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "title": "20 plates of vegetable rice and dal",
    "category": "Prepared Meals",
    "quantity": 20,
    "unit": "plates",
    "estimatedServings": 24,
    "description": "Freshly cooked spiced dal and vegetable rice platters.",
    "rescuePriority": "Urgent",
    "dietaryTags": ["Vegetarian", "Vegan", "Halal Friendly"],
    "imageUrl": "https://...",
    "pickupAddress": "450 Howard St",
    "expiryDate": "2026-10-07T18:00:00.000Z",
    "storageInstructions": "Keep hot above 60°C or chill below 4°C.",
    "pickupTimeWindow": "Today between 2:00 PM - 5:00 PM"
  }
  ```

### `PUT /api/food/:id`
Update an existing listing (restricted to post owner or admin).

### `DELETE /api/food/:id`
Delete a food listing.

---

## 3. Food Requests & Tracking (`/api/requests`)

Status Flow:
`available` ➔ `requested (pending)` ➔ `accepted` (with PIN) ➔ `collected` (impact awarded)

### `POST /api/requests`
Submit a request to rescue food.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "foodId": "food_1",
    "requestedQuantity": 15,
    "message": "We can distribute this immediately at our shelter van today.",
    "pickupTime": "Today at 3:30 PM"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "request": {
      "id": "req_...",
      "status": "pending",
      "pickupCode": "492815",
      ...
    }
  }
  ```

### `GET /api/requests/my`
Retrieve all requests made by the current user (includes current status and 6-digit pickup PIN).

### `GET /api/requests/donor`
Retrieve all incoming requests for food listings posted by current user.

### `PATCH /api/requests/:id/status`
Update request status.
- **Request Body for Donor Acceptance:**
  ```json
  { "status": "accepted" }
  ```
- **Request Body for Donor Decline:**
  ```json
  { "status": "declined" }
  ```
- **Request Body for Completing Handoff (PIN Verification):**
  ```json
  {
    "status": "collected",
    "pickupPin": "492815"
  }
  ```
  *Note:* Successfully marking a request as `collected` automatically computes and awards lifetime meals rescued and kg CO2 saved to both donor and recipient!

---

## 4. ShareBite AI Assistant (`/api/ai`)

All AI Donor Assistant endpoints require an authentication token (`Authorization: Bearer <token>` or `x-ai-auth-token: <token>`).

### `POST /api/ai/token`
Generates a dedicated, standalone AI Donor Assistant authentication token (e.g. for donor POS systems, kitchen terminals, or authenticated sessions).
- **Request Body (Optional):**
  ```json
  {
    "donorName": "Green Bistro Kitchen Staff",
    "expiresInDays": 30
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "token": "sb_ai_donor_muxt...",
    "type": "Bearer",
    "scope": "ai:donor_assistant",
    "donorName": "Green Bistro Kitchen Staff",
    "expiresAt": "2026-11-06T08:00:00.000Z",
    "usage": "Include as 'Authorization: Bearer sb_ai_donor_...' or 'x-ai-auth-token: sb_ai_donor_...'"
  }
  ```

### `GET /api/ai/token/verify`
Verify if an AI Donor Assistant token is active and authorized.
- **Headers:** `Authorization: Bearer <token>` OR `x-ai-auth-token: <token>`
- **Response (200 OK):**
  ```json
  {
    "valid": true,
    "user": { "name": "Green Bistro Kitchen Staff", "tokenType": "ai_donor_token" },
    "message": "AI Donor Assistant authentication token is active and authorized."
  }
  ```

### `POST /api/ai/suggest-listing`
Analyzes freeform text using Google Gemini (`gemini-3.8-flash`) with structured schema output and smart heuristic fallback.
- **Headers (Required):** `Authorization: Bearer <token>` OR `x-ai-auth-token: <token>` (Accepts user JWT or dedicated `sb_ai_donor_...` token)
- **Request Body:**
  ```json
  {
    "prompt": "I have 20 plates of vegetable rice and dal left from today's event."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "suggestion": {
      "title": "Vegetable Rice & Lentil Dal Platters",
      "category": "Prepared Meals",
      "quantity": 20,
      "unit": "plates",
      "estimatedServings": 24,
      "description": "High-quality catered basmati rice with spiced yellow lentil dal...",
      "rescuePriority": "Urgent",
      "dietaryTags": ["Vegetarian", "Vegan", "Gluten-Free", "Halal Friendly"],
      "recommendedExpiryHours": 3.5,
      "storageInstructions": "Keep hot above 60°C or chill immediately below 4°C.",
      "pickupTimeWindow": "Available for immediate pickup today within 3 hours"
    },
    "auth": {
      "authenticated": true,
      "authenticatedAs": "Green Bistro Kitchen Staff",
      "tokenType": "ai_donor_token"
    }
  }
  ```

---

## 5. Notifications (`/api/notifications`)

- `GET /api/notifications`: Get list of user notifications and unread count.
- `PATCH /api/notifications/:id/read`: Mark single notification as read.
- `POST /api/notifications/mark-all-read`: Mark all notifications as read.

---

## 6. Organizations (`/api/organizations`)

- `GET /api/organizations`: List verified non-profit partners and shelters.
- `POST /api/organizations/apply-verification`: Submit 501(c)(3) or tax registration for verification badge.

---

## 7. Admin Console (`/api/admin`)
*(Requires role: `admin`)*

- `GET /api/admin/stats`: Comprehensive metrics, weekly rescue trends, category distributions, leaderboards.
- `GET /api/admin/users`: List all users.
- `PATCH /api/admin/users/:id`: Change user role (`donor`, `recipient`, `organization`, `admin`).
- `PATCH /api/admin/verify-org/:id`: Toggle organization verification status (`verified: true/false`).
- `GET /api/admin/listings`: Full food listings moderation table.
- `GET /api/admin/requests`: Global audit trail of food requests.

---

## 8. Community Support & Contact (`/api/contact`)

### `POST /api/contact`
Submit an inquiry, support ticket, or partnership question.
- **Request Body:**
  ```json
  {
    "name": "Chef Marcus Vance",
    "email": "marcus@bistro.com",
    "phone": "+1 (555) 019-2834",
    "category": "Restaurant / Business Donor Inquiry",
    "subject": "Setting up weekly catering recovery schedule",
    "message": "We have recurring lunch catering surplus on Tuesdays and Thursdays."
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Thank you for reaching out! A ShareBite community coordinator will respond within 24 hours.",
    "id": "msg_..."
  }
  ```

