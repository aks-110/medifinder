# MediFinder — Flow Diagrams

> These diagrams reflect the actual implementation in `backend/` and `frontend/`.

MediFinder supports three distinct actor workflows across the diagnostic booking lifecycle:
- **Patients / Users**: Search diagnostic tests, compare prices & turnaround times, book center visits or home collection slots, and download medical reports.
- **Healthcare Providers**: Manage test catalog, adjust pricing, configure slot capacities, assign home collection technicians, and upload completed reports.
- **Platform Administrators**: Oversee platform stats, monitor booking distributions, verify healthcare providers, and manage system users.

---

## 1. System Architecture Overview

```mermaid
flowchart TD
    A([Client Web Browser])
    A --> B[React 18 + Vite Frontend]
    B --> C[Axios HTTP Client]
    C --> D[Express.js API Gateway]
    D --> E[JWT & RBAC Middleware]
    E --> F[Route Controllers]
    F --> G[PostgreSQL Relational DB]
    F --> H[MongoDB Metadata Store]
    F --> I[Redis Caching & Rate Limiter]
    F --> J[Notification Engine]
    J --> K[Nodemailer SMTP]
    J --> L[Twilio SMS & WhatsApp]
```

---

## 2. Patient Booking & Slot Reservation Flow

```mermaid
flowchart TD
    A([User Query / Test Search])
    A --> B[Search Filter<br/>location, category, price, rating]
    B --> C[Provider Comparison Engine<br/>cheapest, fastest, best-rated]
    C --> D[Slot Selector<br/>local date parsing & capacity check]
    D --> E[Payment Verification<br/>Razorpay / simulated fallback]
    E --> F[Booking Controller<br/>PostgreSQL transaction]
    F --> G[Notification Service<br/>in-app + email + SMS]
    G --> H([Booking Confirmation])
```

---

## 3. Multi-Tier Authentication & RBAC Flow

```mermaid
flowchart TD
    A([Authentication Request])
    A --> B[Role Router]
    B --> C[Patient Auth<br/>users table]
    B --> D[Provider Auth<br/>provider_users table]
    B --> E[Admin Auth<br/>admin_users table]
    C --> F[Bcrypt Password Verification]
    D --> F
    E --> F
    F --> G[JWT Token Generator<br/>access + refresh tokens]
    G --> H[Client Local Storage]
    H --> I([Authorized Request Headers])
```

---

## 4. Multi-Database Data Management Flow

```mermaid
flowchart TD
    A([Data Write / Update Request])
    A --> B[Repository Layer]
    B --> C[PostgreSQL<br/>structured relational data]
    B --> D[MongoDB<br/>audit logs & report metadata]
    B --> E[Redis Cache<br/>comparison response & rate limits]
    C --> F([Persistent Data Store])
    D --> F
    E --> F
```

---

## 5. Home Sample Collection & Technician Workflow

```mermaid
flowchart TD
    A([Home Collection Booking])
    A --> B[Address & Contact Validator]
    B --> C[Technician Assignment Engine]
    C --> D[Provider Management Portal]
    D --> E[Sample Collection Update]
    E --> F[Lab Processing]
    F --> G[Report Upload Engine]
    G --> H[Patient Notification & Report Delivery]
    H --> I([Completed Booking])
```

---

## 6. Provider Portal Management Flow

```mermaid
flowchart TD
    A([Provider Owner Portal])
    A --> B[Test Catalog Configurator]
    B --> C[Pricing & Turnaround Settings]
    C --> D[Weekly Slot Generation]
    D --> E[Booking Fulfillment Monitor]
    E --> F[Patient Medical Report Uploader]
    F --> G([Updated Availability & Reports])
```

---

## 7. Admin Platform Oversight Flow

```mermaid
flowchart TD
    A([Admin Portal])
    A --> B[System Dashboard Controller]
    B --> C[Platform Revenue & Booking Aggregator]
    B --> D[Provider Verification Manager]
    B --> E[User & Account Governance]
    C --> F([System Overview Metrics])
    D --> F
    E --> F
```
