import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import fs from "node:fs";

import { pool } from "./db/pool.js";

import authRoutes from "./routes/auth.js";
import testRoutes from "./routes/tests.js";
import providerRoutes from "./routes/providers.js";
import bookingRoutes from "./routes/bookings.js";
import familyRoutes from "./routes/family.js";
import notificationRoutes from "./routes/notifications.js";
import reportRoutes from "./routes/reports.js";
import reviewRoutes from "./routes/reviews.js";
import paymentRoutes from "./routes/payments.js";
import providerAuthRoutes from "./routes/providerAuth.js";
import providerPortalRoutes from "./routes/providerPortal.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import adminRoutes from "./routes/admin.js";

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => res.send("MediFinder API is running"));
app.head("/", (req, res) => res.status(200).end());

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "degraded", db: "unreachable", error: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/providers", reviewRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/provider-auth", providerAuthRoutes);
app.use("/api/provider", providerPortalRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our end" });
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("[db] connected");
  } catch (err) {
    console.error(
      "[db] could not connect to Postgres. Run `npm run db:setup` after starting Postgres " +
        "(e.g. `docker compose up -d postgres` from the project root), then restart this server."
    );
    console.error(err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`MediFinder API running on http://localhost:${PORT}`);
  });
}

start();
