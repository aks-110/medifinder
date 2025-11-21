import { Router } from "express";
import * as repo from "../db/repo.js";

const router = Router();

router.get("/", async (req, res) => {
  res.json({ results: await repo.listProviders() });
});

router.get("/:id", async (req, res) => {
  const provider = await repo.getProvider(req.params.id);
  if (!provider) return res.status(404).json({ error: "Provider not found" });
  res.json({ provider });
});

export default router;
