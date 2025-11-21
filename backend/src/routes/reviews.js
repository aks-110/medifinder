import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import * as repo from "../db/repo.js";
import { mirrorInsert } from "../lib/mongo.js";

const router = Router();

const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  staffRating: z.number().int().min(1).max(5).optional(),
  cleanlinessRating: z.number().int().min(1).max(5).optional(),
  waitTimeRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});

router.get("/:id/reviews", async (req, res) => {
  const provider = await repo.getProvider(req.params.id);
  if (!provider) return res.status(404).json({ error: "Provider not found" });
  const [reviews, rating] = await Promise.all([repo.listReviews(req.params.id), repo.getRating(req.params.id)]);
  res.json({ reviews, ...rating });
});

router.post("/:id/reviews", requireAuth, async (req, res) => {
  const providerId = req.params.id;
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const booking = await repo.getBooking(parsed.data.bookingId);
  if (!booking || booking.userId !== req.user.id || booking.providerId !== providerId) {
    return res.status(403).json({ error: "You can only review a provider after your own completed booking with them" });
  }
  if (booking.status !== "completed") {
    return res.status(403).json({ error: "You can review once this appointment is marked completed" });
  }
  if (await repo.hasReviewed(booking.id)) {
    return res.status(409).json({ error: "You've already reviewed this appointment" });
  }

  const review = await repo.addReview(providerId, req.user.id, booking.id, parsed.data);
  await mirrorInsert("reviews", review);
  res.status(201).json({ review });
});

export default router;
