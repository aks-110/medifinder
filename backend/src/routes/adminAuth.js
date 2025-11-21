import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import * as repo from "../db/repo.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { rateLimitAllow } from "../lib/redis.js";

const router = Router();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const allowed = await rateLimitAllow(`admin-login:${req.ip}`, 10, 60);
  if (!allowed) return res.status(429).json({ error: "Too many login attempts. Try again in a minute." });

  const { email, password } = parsed.data;
  const account = await repo.findAdminByEmail(email);
  if (!account) return res.status(401).json({ error: "Incorrect email or password" });

  const valid = await bcrypt.compare(password, account.password_hash);
  if (!valid) return res.status(401).json({ error: "Incorrect email or password" });

  const claims = { role: "admin" };
  res.json({
    account: { id: account.id, name: account.name, email: account.email },
    accessToken: signAccessToken({ id: account.id, name: account.name, email: account.email }, claims),
    refreshToken: signRefreshToken({ id: account.id }, claims),
  });
});

export default router;
