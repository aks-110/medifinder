import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import * as repo from "../db/repo.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimitAllow } from "../lib/redis.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10).optional(),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  const { name, email, password, phone } = parsed.data;

  if (await repo.findUserByEmail(email)) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await repo.createUser({ name, email, phone, passwordHash });

  const claims = { role: "admin" };
  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    accessToken: signAccessToken(user, claims),
    refreshToken: signRefreshToken(user, claims),
  });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const allowed = await rateLimitAllow(`login:${req.ip}`, 10, 60);
  if (!allowed) return res.status(429).json({ error: "Too many login attempts. Try again in a minute." });

  const { email, password } = parsed.data;
  const user = await repo.findUserByEmail(email);
  if (!user) return res.status(401).json({ error: "Incorrect email or password" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Incorrect email or password" });

  const claims = { role: "admin" };
  res.json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    accessToken: signAccessToken(user, claims),
    refreshToken: signRefreshToken(user, claims),
  });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: "Missing refresh token" });
  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await repo.findUserById(payload.sub);
    if (!user) return res.status(401).json({ error: "User no longer exists" });
    res.json({ accessToken: signAccessToken(user, { role: "patient" }) });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await repo.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: "patient" });
});

export default router;
