import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import * as repo from "../db/repo.js";
import { createOrder, paymentsAreLive } from "../services/payments.js";

const router = Router();
router.use(requireAuth);

const orderSchema = z.object({ providerId: z.string(), testId: z.string() });

router.post("/create-order", async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const offer = await repo.getProviderTest(parsed.data.providerId, parsed.data.testId);
  if (!offer) return res.status(404).json({ error: "This test is not offered by that provider" });

  const order = await createOrder(offer.price, `${parsed.data.providerId}-${parsed.data.testId}-${req.user.id}`);
  res.json({ ...order, live: paymentsAreLive() });
});

export default router;
