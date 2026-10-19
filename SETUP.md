# ShareBite — Setup & Installation Guide

This guide details how to set up and run the ShareBite platform in development and production environments.

---

## 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn** or **pnpm**
- **MongoDB**: Optional (ShareBite includes an automated in-memory & file-backed persistent database out of the box with realistic seed data). To connect an external MongoDB Atlas cluster, simply provide `MONGODB_URI`.

---

## 2. Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your variables in `.env`:
```env
# Google Gemini API key for ShareBite AI Assistant
GEMINI_API_KEY="your-gemini-api-key"

# JWT Secret for user tokens
JWT_SECRET="sharebite_super_secret_jwt_key_2026"

# MongoDB connection string (Optional)
# If left empty, ShareBite automatically uses its embedded persistent storage
MONGODB_URI="mongodb://localhost:27017/sharebite"

# Server Port
PORT=3000
```

---

## 3. Installation

Install all project dependencies:
```bash
npm install
```

---

## 4. Running the Application

### Development Mode (Full-Stack with Vite HMR):
```bash
npm run dev
```
The full-stack application will be live at `http://localhost:3000`.

### Production Build:
```bash
# 1. Build the frontend client
npm run build

# 2. Start the production Node/Express server
npm start
```

---

## 5. Pre-Configured Demo Accounts

For immediate testing, use the floating **Demo Role Switcher** at the bottom-left of the screen or sign in with:

| Role | Email | Password | Details |
|---|---|---|---|
| **Platform Admin** | `admin@sharebite.org` | `admin123` | Access to Admin Operations Console & Analytics |
| **Restaurant Donor** | `greenbistro@sharebite.org` | `donor123` | Green Table Bistro (Active listings & requests) |
| **Verified NGO** | `hopekitchen@ngo.org` | `ngo123` | City Hope Kitchen & Shelter (Verified badge) |
| **Community Recipient**| `sarah.j@example.com` | `user123` | Local resident rescuing surplus food |

---

## 6. End-to-End Workflow Testing

1. **AI-Assisted Listing**:
   - Switch to **Restaurant Donor**.
   - Navigate to **Donate Food**.
   - Type: `"I have 20 plates of vegetable rice and dal left from today's event."`
   - Click **Generate with AI**. The assistant will auto-fill title, category, priority, portions, and storage guidelines.
   - Click **Publish Food Listing**.

2. **Discover & Request**:
   - Switch to **Verified NGO** or **Community Member**.
   - Browse the listing on `/discover`.
   - Click **Request Food**, choose portion size, and submit.

3. **Acceptance & Pickup Verification**:
   - Switch back to **Restaurant Donor**.
   - Open **Dashboard ➔ My Donations**.
   - Click **Accept Request**. The recipient is assigned a 6-digit PIN.
   - Recipient sees PIN on their **My Requests** tab.
   - Donor enters the 6-digit PIN under **Verify Recipient PIN & Complete**.
   - Food is marked **Collected** and carbon & meal impact is credited to both accounts!
