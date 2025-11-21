import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as repo from "../db/repo.js";
import { notify } from "../services/notify.js";

const router = Router();
router.use(requireAuth, requireRole("provider"));

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = [".pdf", ".jpg", ".jpeg", ".png"].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error("Only PDF, JPG, or PNG reports are accepted"), ok);
  },
});

router.get("/me", async (req, res) => {
  const [provider, stats] = await Promise.all([
    repo.getProvider(req.user.providerId),
    repo.providerStats(req.user.providerId),
  ]);
  res.json({ provider, stats });
});

router.get("/tests", async (req, res) => {
  const [offered, allTests] = await Promise.all([
    repo.listProviderTestsFor(req.user.providerId),
    repo.listTests({}),
  ]);
  const offeredIds = new Set(offered.map((o) => o.testId));
  const notOffered = allTests.filter((t) => !offeredIds.has(t.id)).map((t) => ({ testId: t.id, testName: t.name }));
  res.json({ offered, notOffered });
});

const priceSchema = z.object({ price: z.number().positive(), reportTimeHours: z.number().int().positive() });

router.put("/tests/:testId", async (req, res) => {
  const parsed = priceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const row = await repo.setProviderTestPrice(req.user.providerId, req.params.testId, parsed.data);
  res.json({ testId: row.test_id, price: Number(row.price), reportTimeHours: row.report_time_hours });
});

router.delete("/tests/:testId", async (req, res) => {
  await repo.removeProviderTest(req.user.providerId, req.params.testId);
  res.status(204).end();
});

router.get("/slots/:testId", async (req, res) => {
  res.json({ slots: await repo.getSlots(req.user.providerId, req.params.testId) });
});

const slotSchema = z.object({ date: z.string(), time: z.string(), capacity: z.number().int().positive().default(3) });

router.post("/slots/:testId", async (req, res) => {
  const parsed = slotSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  try {
    const slot = await repo.addSlot(req.user.providerId, req.params.testId, parsed.data);
    res.status(201).json({ slot });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/bookings", async (req, res) => {
  res.json({ bookings: await repo.listProviderBookings(req.user.providerId) });
});

const statusSchema = z.object({
  status: z.enum(["confirmed", "completed", "cancelled"]).optional(),
  collectionStatus: z.enum(["technician_assigned", "collected", "processing", "report_ready"]).optional(),
});

router.post("/bookings/:id/status", async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const booking = await repo.updateBookingStatus(req.params.id, req.user.providerId, parsed.data);
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  if (parsed.data.status === "cancelled") {
    await notify({ userId: booking.userId, phone: booking.patient.phone, event: "booking_cancelled", data: booking });
  } else if (parsed.data.collectionStatus) {
    await notify({ userId: booking.userId, phone: booking.patient.phone, event: "collection_status", data: { ...booking, status: parsed.data.collectionStatus } });
  }

  res.json({ booking });
});

router.post("/bookings/:id/report", upload.single("report"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const booking = await repo.attachReport(req.params.id, req.user.providerId, {
    reportUrl: `/uploads/${req.file.filename}`,
    reportFileName: req.file.originalname,
    reportCategory: req.body.category || "General",
  });
  if (!booking) {
    fs.unlink(req.file.path, () => {});
    return res.status(404).json({ error: "Booking not found" });
  }

  await notify({ userId: booking.userId, phone: booking.patient.phone, event: "report_ready", data: booking });
  res.json({ booking });
});

export default router;
