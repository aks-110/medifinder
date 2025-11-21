import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import * as repo from "../db/repo.js";
import { BookingError } from "../db/repo.js";
import { verifyPayment } from "../services/payments.js";
import { assignTechnician } from "../data/technicians.js";
import { notify } from "../services/notify.js";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  providerId: z.string(),
  testId: z.string(),
  slotId: z.string(),
  patientName: z.string().min(2),
  patientAge: z.number().int().positive().optional(),
  patientPhone: z.string().min(10),
  familyMemberId: z.string().optional(),
  collectionType: z.enum(["center", "home"]).default("center"),
  address: z.string().optional(),
  paymentOrderId: z.string(),
  paymentId: z.string().optional(),
  paymentSignature: z.string().optional(),
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  const data = parsed.data;

  if (data.familyMemberId && !(await repo.getFamilyMember(req.user.id, data.familyMemberId))) {
    return res.status(400).json({ error: "That family member wasn't found on your account" });
  }
  if (data.collectionType === "home" && !data.address) {
    return res.status(400).json({ error: "An address is required for home sample collection" });
  }

  const offer = await repo.getProviderTest(data.providerId, data.testId);
  if (!offer) return res.status(404).json({ error: "This test is not offered by that provider" });
  if (data.collectionType === "home" && !offer.provider.homeCollection) {
    return res.status(400).json({ error: "This provider doesn't offer home sample collection" });
  }

  const paid = verifyPayment({ orderId: data.paymentOrderId, paymentId: data.paymentId, signature: data.paymentSignature });
  if (!paid) return res.status(402).json({ error: "Payment could not be verified" });

  const technician = data.collectionType === "home" ? assignTechnician() : null;

  let booking;
  try {
    booking = await repo.createBooking({
      userId: req.user.id,
      familyMemberId: data.familyMemberId,
      providerId: data.providerId,
      testId: data.testId,
      slotId: data.slotId,
      patientName: data.patientName,
      patientAge: data.patientAge,
      patientPhone: data.patientPhone,
      amount: offer.price,
      collectionType: data.collectionType,
      address: data.address,
      paymentOrderId: data.paymentOrderId,
      paymentId: data.paymentId,
      technician,
    });
  } catch (err) {
    if (err instanceof BookingError) return res.status(409).json({ error: err.message });
    throw err;
  }

  await notify({ userId: req.user.id, email: req.user.email, phone: data.patientPhone, event: "booking_confirmed", data: booking });
  if (technician) {
    await notify({ userId: req.user.id, email: req.user.email, phone: data.patientPhone, event: "technician_assigned", data: { ...booking, technicianName: technician.name } });
  }

  res.status(201).json({ booking });
});

router.get("/me", async (req, res) => {
  const mine = await repo.listMyBookings(req.user.id);
  const now = new Date(new Date().toDateString());
  const upcoming = mine.filter((b) => new Date(`${b.slot.date}T00:00:00`) >= now && b.status !== "cancelled");
  const past = mine.filter((b) => new Date(`${b.slot.date}T00:00:00`) < now || b.status === "cancelled");
  res.json({ upcoming, past });
});

router.post("/:id/cancel", async (req, res) => {
  const booking = await repo.cancelBooking(req.params.id, req.user.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  await notify({ userId: req.user.id, email: req.user.email, phone: booking.patient.phone, event: "booking_cancelled", data: booking });
  res.json({ booking });
});

export default router;
