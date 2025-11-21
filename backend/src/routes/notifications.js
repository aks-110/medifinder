import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as repo from "../db/repo.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    repo.listNotifications(req.user.id),
    repo.unreadNotificationCount(req.user.id),
  ]);
  res.json({ notifications, unreadCount });
});

router.post("/:id/read", async (req, res) => {
  const n = await repo.markNotificationRead(req.user.id, req.params.id);
  if (!n) return res.status(404).json({ error: "Notification not found" });
  res.json({ notification: n });
});

export default router;
