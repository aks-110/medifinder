import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as repo from "../db/repo.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/stats", async (req, res) => res.json(await repo.adminStats()));
router.get("/users", async (req, res) => res.json({ users: await repo.adminListUsers() }));
router.get("/providers", async (req, res) => res.json({ providers: await repo.listProviders() }));

router.patch("/providers/:id/verify", async (req, res) => {
  const provider = await repo.toggleProviderVerified(req.params.id);
  if (!provider) return res.status(404).json({ error: "Provider not found" });
  res.json({ provider });
});

router.get("/bookings", async (req, res) => res.json({ bookings: await repo.adminListBookings() }));
router.get("/reviews/flagged", async (req, res) => res.json({ flagged: await repo.listFlaggedReviews() }));

export default router;
