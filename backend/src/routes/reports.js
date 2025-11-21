import { Router } from "express";
import path from "node:path";
import { requireAuth } from "../middleware/auth.js";
import * as repo from "../db/repo.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const mine = await repo.listReportsForUser(req.user.id);
  res.json({
    reports: mine.map((b) => ({
      bookingId: b.id,
      testName: b.testName,
      providerName: b.providerName,
      category: b.reportCategory || "General",
      date: b.slot.date,
      fileName: b.reportFileName,
    })),
  });
});

router.get("/:bookingId/download", async (req, res) => {
  const booking = await repo.getBooking(req.params.bookingId);
  if (!booking || booking.userId !== req.user.id) return res.status(404).json({ error: "Report not found" });
  if (!booking.reportUrl) return res.status(404).json({ error: "No report has been uploaded for this booking yet" });

  const filePath = path.resolve(process.env.UPLOAD_DIR || "./uploads", path.basename(booking.reportUrl));
  res.download(filePath, booking.reportFileName || "report.pdf");
});

export default router;
