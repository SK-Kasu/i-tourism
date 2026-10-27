# I-Tourism Planner

A booking marketplace for hotels and guesthouses in Nyanza and Western Kenya. built with React, Node.js/Express, PostgreSQL, and M-Pesa (Daraja API) integration.

This repository is a monorepo containing two independent projects:

- **`itourism-frontend/`**— React 18 + Vite + Tailwind CSS
- **`itourism-backend/`** — Node.js + Express + Prisma + PostgreSQL

See the accompanying project documentation for the full business model, technical architecture, system diagrams, and sprint-by-sprint coding roadmap this scaffold was built from.



### 2. Prerequisites

- Node.js 20 LTS
- PostgreSQL 15+ running locally (or a connection string to a hosted instance)
- Redis 7 running locally 

### 3. Backend setup

```bash
cd itourism-backend
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL at minimum. Daraja/SMS/Cloudinary keys can
# stay blank until you reach those sprints.

npx prisma migrate dev --name initial_schema
npm run dev
```

### 4. Frontend setup

In a second terminal:

```bash
cd itourism-frontend
npm install
cp .env.example .env
npm run dev
# App now running on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:4000`, so the frontend and backend talk to each other out of the box in local development.

## What's implemented vs. what's scaffolded

This codebase was generated as a working starting point, not a finished product. Fully implemented:

- Authentication (register, login, logout, JWT in httpOnly cookie)
- Property search (with Redis caching and graceful fallback if Redis is down)
- Booking creation with transactional row-locking to prevent double-booking
- Room/availability management
- M-Pesa STK Push initiation and callback handling
- M-Pesa B2C payout logic and commission calculation
- SMS notification service (Africa's Talking)
- Daily payout cron job (scheduling logic in place; wire up the eligible-bookings query before going live)

Scaffolded but not built out (each file is commented with which sprint covers it, per the coding roadmap document):

- All frontend page components — currently placeholder screens
- Frontend data-fetching wired through the `hooks/` directory (`useSearch`, `useBooking`, `usePaymentStatus` are implemented; page components don't call them yet)
- Image upload (Multer + Sharp + Cloudinary) — service file not yet created
- Test fixtures for the concurrency test in `itourism-backend/test/`

## Before going to production

- Fill in real Daraja and Africa's Talking credentials in `.env` (never commit this file)
- Replace the placeholder `InitiatorName` and `SecurityCredential` in `payoutService.js` with your actual Safaricom B2C initiator credentials
- Decide and hardcode the final commission rate, cancellation window, and no-show grace period (flagged as open questions in the technical documentation)
- Add the test fixtures needed to un-skip `booking.concurrency.test.js` and confirm the double-booking lock holds under real concurrent load
