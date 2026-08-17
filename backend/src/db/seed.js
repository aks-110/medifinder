// Creates the schema and seeds catalog data (tests, providers, pricing,
// a week of slots) plus demo provider/admin logins. Safe to re-run - it
// clears and re-inserts the catalog tables each time (never touches
// users/bookings/reviews created by real signups).
//
// Usage: npm run db:setup   (from backend/)
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { pool } from "./pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tests = [
  { id: "t1", slug: "chest-xray", name: "Chest X-Ray", category: "diagnostic", description: "A quick imaging scan of the lungs, heart, and chest wall used to spot infections, fractures, and other conditions.", preparation: "No special preparation needed. Remove metal jewellery before the scan.", reportTimeHours: 2 },
  { id: "t2", slug: "mri-brain", name: "MRI - Brain", category: "diagnostic", description: "Detailed imaging of brain tissue using magnetic fields, used to investigate headaches, injuries, or neurological symptoms.", preparation: "Remove all metal objects. Inform staff of any implants.", reportTimeHours: 24 },
  { id: "t3", slug: "ct-scan-abdomen", name: "CT Scan - Abdomen", category: "diagnostic", description: "Cross-sectional imaging of abdominal organs for diagnosis of pain, injury, or disease.", preparation: "Fast for 4-6 hours before the scan. Contrast dye may be used.", reportTimeHours: 12 },
  { id: "t4", slug: "cbc", name: "Complete Blood Count (CBC)", category: "lab", description: "Measures red cells, white cells, and platelets to screen for anemia, infection, and other disorders.", preparation: "No fasting required.", reportTimeHours: 6 },
  { id: "t5", slug: "lipid-profile", name: "Lipid Profile", category: "lab", description: "Measures cholesterol and triglyceride levels to assess heart disease risk.", preparation: "Fast for 9-12 hours before the test.", reportTimeHours: 8 },
  { id: "t6", slug: "thyroid-profile", name: "Thyroid Profile (T3, T4, TSH)", category: "lab", description: "Checks thyroid hormone levels to diagnose thyroid disorders.", preparation: "No fasting required. Morning sample preferred.", reportTimeHours: 12 },
  { id: "t7", slug: "full-body-checkup", name: "Full Body Checkup", category: "package", description: "A comprehensive panel covering blood work, organ function, and vital screening tests.", preparation: "Fast for 10-12 hours before the appointment.", reportTimeHours: 24 },
  { id: "t8", slug: "diabetes-package", name: "Diabetes Package", category: "package", description: "Blood sugar, HbA1c, and related markers to monitor or screen for diabetes.", preparation: "Fast for 8 hours before the test.", reportTimeHours: 12 },
  { id: "t9", slug: "ultrasound-abdomen", name: "Ultrasound - Whole Abdomen", category: "diagnostic", description: "An imaging test that uses sound waves to look at organs in the abdomen, including the liver, gallbladder, spleen, pancreas, and kidneys.", preparation: "Fast for 8-12 hours before the test. Drink water before the exam.", reportTimeHours: 4 },
  { id: "t10", slug: "xray-knee", name: "X-Ray - Knee Joint", category: "diagnostic", description: "Imaging of the knee joint to check for fractures, arthritis, or other issues.", preparation: "No special preparation needed.", reportTimeHours: 2 },
  { id: "t11", slug: "mri-spine", name: "MRI - Spine", category: "diagnostic", description: "Detailed imaging of the spine, looking at bones, discs, and nerves.", preparation: "Remove all metal objects.", reportTimeHours: 24 },
  { id: "t12", slug: "vitamin-d", name: "Vitamin D Test", category: "lab", description: "Measures the level of vitamin D in your blood to check for bone health.", preparation: "No fasting required.", reportTimeHours: 12 },
];

const providers = [
  { id: "p1", name: "Sunrise Multispecialty Hospital", type: "hospital", address: "MG Road, Panipat", lat: 29.3909, lng: 76.9635, rating: 4.6, reviewCount: 812, homeCollection: false, insuranceAccepted: true, openNow: true, verified: true, imageUrl: "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=600&q=60" },
  { id: "p2", name: "MediCore Diagnostics Lab", type: "lab", address: "GT Road, Panipat", lat: 29.3805, lng: 76.9548, rating: 4.4, reviewCount: 431, homeCollection: true, insuranceAccepted: false, openNow: true, verified: true, imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=60" },
  { id: "p3", name: "CityCare Hospital", type: "hospital", address: "Model Town, Panipat", lat: 29.3958, lng: 76.9701, rating: 4.8, reviewCount: 1204, homeCollection: false, insuranceAccepted: true, openNow: false, verified: true, imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=60" },
  { id: "p4", name: "Apex Path Labs", type: "lab", address: "Sector 12, Panipat", lat: 29.3720, lng: 76.9600, rating: 4.2, reviewCount: 268, homeCollection: true, insuranceAccepted: true, openNow: true, verified: false, imageUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&q=60" },
];

const providerTests = {
  p1: { t1: [500, 2], t2: [6500, 24], t3: [4200, 12], t4: [350, 6], t7: [2800, 24], t8: [900, 12], t9: [1500, 4], t10: [600, 2], t11: [7500, 24] },
  p2: { t1: [450, 3], t4: [280, 4], t5: [600, 8], t6: [750, 10], t7: [2400, 20], t8: [799, 10], t12: [1200, 12] },
  p3: { t1: [700, 1], t2: [7200, 18], t3: [4800, 10], t4: [400, 5], t5: [650, 8], t7: [3200, 18], t9: [1800, 4], t11: [8000, 18] },
  p4: { t1: [420, 4], t4: [250, 6], t5: [550, 10], t6: [700, 12], t8: [749, 14], t12: [1100, 12] },
};

async function main() {
  console.log("[seed] applying schema…");
  const schemaSql = fs.readFileSync(path.join(__dirname, "../../db/schema.sql"), "utf8");
  await pool.query(schemaSql);

  console.log("[seed] clearing catalog tables…");
  // slots/provider_tests cascade from providers/tests; bookings/reviews that
  // reference them would too, so this is meant for fresh dev databases.
  await pool.query("TRUNCATE providers, tests RESTART IDENTITY CASCADE");
  await pool.query("DELETE FROM provider_users");
  await pool.query("DELETE FROM admin_users");

  console.log("[seed] inserting tests…");
  for (const t of tests) {
    await pool.query(
      `INSERT INTO tests (id, slug, name, category, description, preparation, report_time_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [t.id, t.slug, t.name, t.category, t.description, t.preparation, t.reportTimeHours]
    );
  }

  console.log("[seed] inserting providers…");
  for (const p of providers) {
    await pool.query(
      `INSERT INTO providers (id, name, type, address, lat, lng, base_rating, base_review_count, home_collection, insurance_accepted, open_now, image_url, verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [p.id, p.name, p.type, p.address, p.lat, p.lng, p.rating, p.reviewCount, p.homeCollection, p.insuranceAccepted, p.openNow, p.imageUrl, p.verified]
    );
  }

  console.log("[seed] inserting pricing + a week of slots…");
  const times = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
  for (const [providerId, testMap] of Object.entries(providerTests)) {
    for (const [testId, [price, reportTimeHours]] of Object.entries(testMap)) {
      const { rows } = await pool.query(
        `INSERT INTO provider_tests (provider_id, test_id, price, report_time_hours) VALUES ($1,$2,$3,$4) RETURNING id`,
        [providerId, testId, price, reportTimeHours]
      );
      const providerTestId = rows[0].id;

      for (let d = 0; d < 7; d++) {
        const date = new Date();
        date.setDate(date.getDate() + d);
        const dateStr = date.toISOString().slice(0, 10);
        for (const time of times) {
          const seed = (providerId.charCodeAt(1) + testId.charCodeAt(1) + d + time.length) % 5;
          if (seed === 0) continue; // occasionally no slot at this time
          const bookedCount = seed === 1 ? 3 : 0; // occasionally pre-filled/full
          await pool.query(
            `INSERT INTO slots (provider_test_id, slot_date, slot_time, capacity, booked_count) VALUES ($1,$2,$3,3,$4)`,
            [providerTestId, dateStr, time, bookedCount]
          );
        }
      }
    }
  }

  console.log("[seed] creating demo provider + admin logins…");
  const providerHash = bcrypt.hashSync("provider123", 10);
  for (const p of providers) {
    const email = `owner@${p.id}.medifinder.demo`;
    await pool.query(
      `INSERT INTO provider_users (id, provider_id, email, password_hash, name) VALUES ($1,$2,$3,$4,$5)`,
      [`pu_${p.id}`, p.id, email, providerHash, `${p.name} (Owner)`]
    );
  }
  const adminHash = bcrypt.hashSync("admin123", 10);
  await pool.query(
    `INSERT INTO admin_users (id, email, password_hash, name) VALUES ($1,$2,$3,$4)`,
    ["admin_1", "admin@medifinder.demo", adminHash, "MediFinder Admin"]
  );

  // Self-test: prove the hash we just wrote actually verifies, so a broken
  // login doesn't fail silently again.
  const check1 = bcrypt.compareSync("provider123", providerHash);
  const check2 = bcrypt.compareSync("admin123", adminHash);
  console.log(`[seed] credential self-test: provider=${check1 ? "OK" : "FAILED"} admin=${check2 ? "OK" : "FAILED"}`);
  if (!check1 || !check2) {
    throw new Error("Seeded password hash failed its own verification - something is wrong with bcrypt in this environment.");
  }

  console.log("[seed] done. Demo logins:");
  console.log("  provider: owner@p1.medifinder.demo / provider123 (also p2, p3, p4)");
  console.log("  admin:    admin@medifinder.demo / admin123");
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error("[seed] failed:", err);
    pool.end();
    process.exit(1);
  });
