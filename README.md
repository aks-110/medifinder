# MediFinder

A production-grade, full-stack healthcare platform for diagnostic test discovery, price comparison, slot booking, home sample collection, and digital report delivery. MediFinder bridges patients, diagnostic centers/labs, and system administrators under a single unified ecosystem.

---

## What It Does

MediFinder lets patients search for medical diagnostic tests (e.g. Chest X-Ray, MRI Brain, Blood Tests) across verified diagnostic centers, compare prices and turnaround times, reserve specific appointment slots, manage family member profiles, and access digital test reports seamlessly.

```
Patient: "Find lipid profile tests near me with home collection"

MediFinder: [scans nearby diagnostic providers]
  "Top 3 Options:
   1. City Diagnostic Center — ₹450 · Report in 8 hrs · Home Collection Available
   2. Metro Care Labs         — ₹400 · Report in 12 hrs · Fastest Slot Today 14:00
   3. HealthFirst Imaging    — ₹550 · Report in 6 hrs · Best Rated (4.9 ★)"
```

---

## Architecture

```
[User / Patient]          [Provider Portal]          [Admin Dashboard]
       │                         │                           │
       └─────────────────────────┼───────────────────────────┘
                                 │
                                 ▼
                     [Express.js API Gateway]
                                 │
       ┌─────────────────────────┼───────────────────────────┐
       ▼                         ▼                           ▼
[Authentication]        [Booking Controller]        [Notification Engine]
 (JWT + Bcrypt)        (PG ACID Transaction)       (In-App / Email / SMS)
       │                         │                           │
       ├─────────────────────────┼───────────────────────────┤
       ▼                         ▼                           ▼
[PostgreSQL DB]          [MongoDB Audit Store]       [Redis Cache Engine]
(Core Relational Data)  (Reports & Activity Logs)  (Rate Limiting & Caching)
```

Full flow diagrams → [`architecture/flow_diagram.md`](architecture/flow_diagram.md)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + Vite |
| Styling | TailwindCSS + Framer Motion |
| State & Query | React Query (@tanstack/react-query) + React Hook Form |
| Routing & Icons | React Router DOM v6 + Lucide React |
| Backend Runtime | Node.js + Express.js (ES Modules) |
| Relational Database | PostgreSQL 16 + `pg` client (ACID Transactions) |
| Document Database | MongoDB 7 (Report metadata & review logs) |
| Cache & Rate Limiter | Redis 7 (IORedis) |
| Authentication | Dual JWT (Access + Refresh tokens) with bcryptjs |
| Data Validation | Zod |
| Payments | Razorpay SDK + Simulated Fallback Engine |
| Notifications | Nodemailer (SMTP), Twilio (SMS & WhatsApp) |
| Containerization | Docker + Docker Compose |

---

## Features

**Patient Experience**
- **Smart Test Search & Comparison** — Filter by distance, price, turnaround time, ratings, home collection, and open status.
- **Slot Selection & Booking Engine** — Real-time slot availability, local timezone date formatting, and slot capacity tracking.
- **Family Member Management** — Add and manage dependents/family members for test bookings.
- **Home Sample Collection** — Book trained phlebotomists/technicians for home visits with address validation.
- **Digital Report Storage** — Secure PDF upload, category tagging, and instant downloading.
- **Multi-channel Notifications** — In-app updates alongside optional SMTP email, SMS, and WhatsApp alerts.

**Provider Portal**
- **Catalog & Test Management** — Enable or disable test offerings and adjust prices dynamically.
- **Slot Publishing** — Generate and configure capacity for daily/weekly appointment slots.
- **Sample Fulfillment Tracking** — Update collection status (`technician_assigned`, `collected`, `processing`, `report_ready`).
- **Report Uploads** — Directly upload patient test reports (PDF/Images) upon completion.

**Admin Dashboard**
- **System Metrics Overview** — Track overall platform revenue, total bookings, active users, and verified providers.
- **Provider Governance** — Review provider applications, manage verification badges, and inspect listed services.
- **User & Booking Management** — Platform-wide visibility over user accounts and active booking workflows.

---

## Quick Start

**1. Clone and navigate**
```bash
git clone https://github.com/abhi13jaat/medifinderProd.git
cd medifinderProd
```

**2. Environment configuration**

Create `backend/.env` (or copy from `backend/.env.example`):
```env
PORT=4000
JWT_ACCESS_SECRET=your_access_token_secret_32_bytes_min
JWT_REFRESH_SECRET=your_refresh_token_secret_32_bytes_min
CLIENT_ORIGIN=http://localhost:5173

# Databases
DATABASE_URL=postgres://medifinder:medifinder@localhost:5432/medifinder
MONGODB_URI=mongodb://localhost:27017/medifinder
REDIS_URL=redis://localhost:6379

# Optional Third-Party Services (Dev fallbacks kick in automatically if empty)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

**3. Run with Docker Compose (Recommended)**
```bash
docker compose up --build
```
Starts PostgreSQL, MongoDB, Redis, performs database setup & seeding, and launches backend (`http://localhost:4000`) and frontend (`http://localhost:8080`).

**4. Or Run Locally for Development**

*Terminal 1 (Backend & Database Setup)*
```bash
cd backend
npm install
npm run db:setup     # Applies schema.sql and seeds catalog & demo accounts
npm run dev          # Starts server on http://localhost:4000
```

*Terminal 2 (Frontend)*
```bash
cd frontend
npm install
npm run dev          # Starts Vite dev server on http://localhost:5173
```

---

## Demo Accounts

After running `npm run db:setup`, the following pre-configured demo credentials are available:

| Account Type | Email | Password | Access URL |
|--------------|-------|----------|------------|
| **Patient** | `john@example.com` | `password123` | `/login` |
| **Provider (Owner)** | `owner@p1.medifinder.demo` | `provider123` | `/provider/login` |
| **Admin** | `admin@medifinder.demo` | `admin123` | `/admin/login` |

---

## API Endpoints

### Auth Routes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new patient account | Public |
| POST | `/api/auth/login` | Patient login → returns JWT | Public |
| POST | `/api/auth/refresh` | Refresh access token | Public |
| GET | `/api/auth/me` | Current patient profile | Patient |

### Diagnostic & Slot Routes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/tests` | Search tests & compare providers | Public |
| GET | `/api/tests/:slug` | Get specific test detail & providers | Public |
| GET | `/api/tests/:slug/slots` | Fetch available slots for provider | Public |
| GET | `/api/providers` | List all verified providers | Public |

### Booking Routes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/bookings` | Create new slot booking | Patient |
| GET | `/api/bookings/me` | Fetch patient's upcoming & past bookings | Patient |
| POST | `/api/bookings/:id/cancel` | Cancel existing booking | Patient |

### Provider & Admin Routes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/provider/auth/login` | Provider owner login | Public |
| GET | `/api/provider/bookings` | Provider booking management | Provider |
| POST | `/api/provider/reports/upload` | Upload patient test report | Provider |
| POST | `/api/admin/auth/login` | Admin portal login | Public |
| GET | `/api/admin/stats` | System overview stats | Admin |

---

## Project Structure

```
medifinderProd/
├── architecture/
│   └── flow_diagram.md     # Comprehensive architecture & system flow diagrams
├── backend/
│   ├── db/
│   │   └── schema.sql       # Core PostgreSQL schema
│   ├── src/
│   │   ├── data/            # Helper domain models
│   │   ├── db/              # Pool connection, repo queries, seed script
│   │   ├── lib/             # Mongo & Redis clients
│   │   ├── middleware/      # JWT authentication middleware
│   │   ├── routes/          # Express route controllers
│   │   ├── services/        # Notification & payment integration services
│   │   ├── utils/           # JWT token signers & helpers
│   │   └── server.js        # Server bootstrap entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios instance & API wrapper calls
│   │   ├── components/      # Reusable UI components & layouts
│   │   ├── context/         # Auth, ProviderAuth & AdminAuth context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Patient, Provider, and Admin view pages
│   │   ├── App.jsx          # Route configuration
│   │   └── main.jsx         # React application entry point
│   ├── Dockerfile
│   ├── nginx.conf           # Production Nginx reverse proxy config
│   └── package.json
├── .gitignore
├── docker-compose.yml
└── README.md
```

