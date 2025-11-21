import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import * as repo from "../db/repo.js";

const router = Router();
router.use(requireAuth);

const memberSchema = z.object({
  name: z.string().min(2),
  relation: z.enum(["self", "spouse", "child", "parent", "other"]),
  age: z.number().int().positive().optional(),
  gender: z.string().optional(),
});

router.get("/", async (req, res) => {
  res.json({ members: await repo.listFamily(req.user.id) });
});

router.post("/", async (req, res) => {
  const parsed = memberSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  res.status(201).json({ member: await repo.addFamilyMember(req.user.id, parsed.data) });
});

router.put("/:id", async (req, res) => {
  const parsed = memberSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const member = await repo.updateFamilyMember(req.user.id, req.params.id, parsed.data);
  if (!member) return res.status(404).json({ error: "Family member not found" });
  res.json({ member });
});

router.delete("/:id", async (req, res) => {
  const ok = await repo.deleteFamilyMember(req.user.id, req.params.id);
  if (!ok) return res.status(404).json({ error: "Family member not found" });
  res.status(204).end();
});

export default router;
