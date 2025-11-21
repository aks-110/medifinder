// All real SQL against Postgres. Every route imports from here - there is
// no in-memory fallback anymore for this data (technician round-robin
// assignment is the one deliberate exception; see data/technicians.js).
import { pool, withTransaction } from "./pool.js";

export class BookingError extends Error {}

// ---------------------------------------------------------------- users --
export async function createUser({ name, email, phone, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, phone, password_hash) VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, email, phone || null, passwordHash]
  );
  return rows[0];
}

export async function findUserByEmail(email) {
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

// ---------------------------------------------------------- family members --
export async function listFamily(userId) {
  const { rows } = await pool.query(`SELECT * FROM family_members WHERE user_id = $1 ORDER BY created_at`, [userId]);
  return rows;
}

export async function addFamilyMember(userId, { name, relation, age, gender }) {
  const { rows } = await pool.query(
    `INSERT INTO family_members (user_id, name, relation, age, gender) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [userId, name, relation, age || null, gender || null]
  );
  return rows[0];
}

export async function updateFamilyMember(userId, id, patch) {
  const { rows } = await pool.query(
    `UPDATE family_members SET name = COALESCE($3,name), relation = COALESCE($4,relation),
       age = COALESCE($5,age), gender = COALESCE($6,gender)
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, patch.name, patch.relation, patch.age, patch.gender]
  );
  return rows[0] || null;
}

export async function deleteFamilyMember(userId, id) {
  const { rowCount } = await pool.query(`DELETE FROM family_members WHERE id = $1 AND user_id = $2`, [id, userId]);
  return rowCount > 0;
}

export async function getFamilyMember(userId, id) {
  const { rows } = await pool.query(`SELECT * FROM family_members WHERE id = $1 AND user_id = $2`, [id, userId]);
  return rows[0] || null;
}

// -------------------------------------------------------------- catalog --
export async function listTests({ q, category }) {
  const clauses = [];
  const params = [];
  if (category) {
    params.push(category);
    clauses.push(`category = $${params.length}`);
  }
  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    clauses.push(`LOWER(name) LIKE $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { rows } = await pool.query(`SELECT * FROM tests ${where} ORDER BY name`, params);
  return rows.map(mapTest);
}

export async function findTestBySlug(slug) {
  const { rows } = await pool.query(`SELECT * FROM tests WHERE slug = $1`, [slug]);
  return rows[0] ? mapTest(rows[0]) : null;
}

export async function listProviders() {
  const { rows } = await pool.query(`SELECT * FROM providers ORDER BY name`);
  return Promise.all(rows.map(mapProviderWithRating));
}

export async function getProvider(id) {
  const { rows } = await pool.query(`SELECT * FROM providers WHERE id = $1`, [id]);
  return rows[0] ? mapProviderWithRating(rows[0]) : null;
}

async function mapProviderWithRating(row) {
  const rating = await getRating(row.id);
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    rating: rating.count ? rating.rating : Number(row.base_rating),
    reviewCount: rating.count || row.base_review_count,
    homeCollection: row.home_collection,
    insuranceAccepted: row.insurance_accepted,
    openNow: row.open_now,
    imageUrl: row.image_url,
    verified: row.verified,
  };
}

function mapTest(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    description: row.description,
    preparation: row.preparation,
    reportTimeHours: row.report_time_hours,
  };
}

// --------------------------------------------------------- offers/pricing --
export async function listOffersForTest(testId) {
  const { rows } = await pool.query(
    `SELECT pt.id AS provider_test_id, pt.price, pt.report_time_hours, p.*
     FROM provider_tests pt JOIN providers p ON p.id = pt.provider_id
     WHERE pt.test_id = $1`,
    [testId]
  );
  const offers = [];
  for (const row of rows) {
    const provider = await mapProviderWithRating(row);
    offers.push({ provider, price: Number(row.price), reportTimeHours: row.report_time_hours, providerTestId: row.provider_test_id });
  }
  return offers;
}

export async function getProviderTest(providerId, testId) {
  const { rows } = await pool.query(
    `SELECT pt.id AS provider_test_id, pt.price, pt.report_time_hours, p.*, t.id AS t_id, t.slug, t.name AS t_name,
            t.category, t.description, t.preparation, t.report_time_hours AS t_report_time_hours
     FROM provider_tests pt
     JOIN providers p ON p.id = pt.provider_id
     JOIN tests t ON t.id = pt.test_id
     WHERE pt.provider_id = $1 AND pt.test_id = $2`,
    [providerId, testId]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  const provider = await mapProviderWithRating(row);
  return {
    provider,
    test: { id: row.t_id, slug: row.slug, name: row.t_name, category: row.category, description: row.description, preparation: row.preparation, reportTimeHours: row.t_report_time_hours },
    price: Number(row.price),
    reportTimeHours: row.report_time_hours,
    providerTestId: row.provider_test_id,
  };
}

export async function setProviderTestPrice(providerId, testId, { price, reportTimeHours }) {
  const { rows } = await pool.query(
    `INSERT INTO provider_tests (provider_id, test_id, price, report_time_hours)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (provider_id, test_id) DO UPDATE SET price = $3, report_time_hours = $4
     RETURNING *`,
    [providerId, testId, price, reportTimeHours]
  );
  return rows[0];
}

export async function removeProviderTest(providerId, testId) {
  await pool.query(`DELETE FROM provider_tests WHERE provider_id = $1 AND test_id = $2`, [providerId, testId]);
}

export async function listProviderTestsFor(providerId) {
  const { rows } = await pool.query(
    `SELECT pt.*, t.name AS test_name FROM provider_tests pt JOIN tests t ON t.id = pt.test_id WHERE pt.provider_id = $1`,
    [providerId]
  );
  return rows.map((r) => ({ testId: r.test_id, testName: r.test_name, price: Number(r.price), reportTimeHours: r.report_time_hours }));
}

// ------------------------------------------------------------------ slots --
export async function getSlots(providerId, testId) {
  const { rows } = await pool.query(
    `SELECT s.* FROM slots s JOIN provider_tests pt ON pt.id = s.provider_test_id
     WHERE pt.provider_id = $1 AND pt.test_id = $2 ORDER BY s.slot_date, s.slot_time`,
    [providerId, testId]
  );
  return rows.map((s) => ({
    id: s.id,
    date: `${s.slot_date.getFullYear()}-${String(s.slot_date.getMonth() + 1).padStart(2, '0')}-${String(s.slot_date.getDate()).padStart(2, '0')}`,
    time: s.slot_time.slice(0, 5),
    capacity: s.capacity,
    bookedCount: s.booked_count,
    available: s.booked_count < s.capacity,
  }));
}

export async function addSlot(providerId, testId, { date, time, capacity = 3 }) {
  const pt = await getProviderTest(providerId, testId);
  if (!pt) throw new BookingError("This provider doesn't offer that test yet");
  const { rows } = await pool.query(
    `INSERT INTO slots (provider_test_id, slot_date, slot_time, capacity) VALUES ($1,$2,$3,$4) RETURNING *`,
    [pt.providerTestId, date, time, capacity]
  );
  return rows[0];
}

// -------------------------------------------------------------- bookings --
function mapBooking(row) {
  return {
    id: row.id,
    userId: row.user_id,
    familyMemberId: row.family_member_id,
    providerId: row.provider_id,
    testId: row.test_id,
    providerName: row.provider_name,
    testName: row.test_name,
    slot: { date: `${row.slot_date.getFullYear()}-${String(row.slot_date.getMonth() + 1).padStart(2, '0')}-${String(row.slot_date.getDate()).padStart(2, '0')}`, time: row.slot_time.slice(0, 5) },
    patient: { name: row.patient_name, age: row.patient_age, phone: row.patient_phone },
    amount: Number(row.amount),
    status: row.status,
    paymentStatus: row.payment_status,
    collectionType: row.collection_type,
    address: row.address,
    collectionStatus: row.collection_status,
    technician: row.technician_name ? { name: row.technician_name, phone: row.technician_phone } : null,
    reportUrl: row.report_url,
    reportFileName: row.report_file_name,
    reportCategory: row.report_category,
    createdAt: row.created_at,
  };
}

const BOOKING_SELECT = `
  SELECT b.*, p.name AS provider_name, t.name AS test_name, s.slot_date, s.slot_time
  FROM bookings b
  JOIN providers p ON p.id = b.provider_id
  JOIN tests t ON t.id = b.test_id
  JOIN slots s ON s.id = b.slot_id
`;

export async function createBooking({
  userId, familyMemberId, providerId, testId, slotId,
  patientName, patientAge, patientPhone, amount,
  collectionType, address, paymentOrderId, paymentId, technician,
}) {
  return withTransaction(async (client) => {
    const slotRes = await client.query(
      `UPDATE slots SET booked_count = booked_count + 1 WHERE id = $1 AND booked_count < capacity RETURNING id`,
      [slotId]
    );
    if (slotRes.rowCount === 0) throw new BookingError("This slot is no longer available");

    const insertRes = await client.query(
      `INSERT INTO bookings (
         user_id, family_member_id, provider_id, test_id, slot_id,
         patient_name, patient_age, patient_phone, amount, status, payment_status,
         payment_order_id, payment_id, collection_type, address, collection_status,
         technician_name, technician_phone
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'confirmed','paid',$10,$11,$12,$13,$14,$15,$16)
       RETURNING id`,
      [
        userId, familyMemberId || null, providerId, testId, slotId,
        patientName, patientAge || null, patientPhone, amount,
        paymentOrderId, paymentId || null, collectionType, address || null,
        collectionType === "home" ? "technician_assigned" : null,
        technician?.name || null, technician?.phone || null,
      ]
    );

    const { rows } = await client.query(`${BOOKING_SELECT} WHERE b.id = $1`, [insertRes.rows[0].id]);
    return mapBooking(rows[0]);
  });
}

export async function listMyBookings(userId) {
  const { rows } = await pool.query(`${BOOKING_SELECT} WHERE b.user_id = $1 ORDER BY b.created_at DESC`, [userId]);
  return rows.map(mapBooking);
}

export async function getBooking(id) {
  const { rows } = await pool.query(`${BOOKING_SELECT} WHERE b.id = $1`, [id]);
  return rows[0] ? mapBooking(rows[0]) : null;
}

export async function listProviderBookings(providerId) {
  const { rows } = await pool.query(`${BOOKING_SELECT} WHERE b.provider_id = $1 ORDER BY b.created_at DESC`, [providerId]);
  return rows.map(mapBooking);
}

export async function cancelBooking(id, userId) {
  const { rows } = await pool.query(
    `UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  if (!rows[0]) return null;
  return getBooking(id);
}

export async function updateBookingStatus(id, providerId, { status, collectionStatus }) {
  const { rows } = await pool.query(
    `UPDATE bookings SET status = COALESCE($3,status), collection_status = COALESCE($4,collection_status)
     WHERE id = $1 AND provider_id = $2 RETURNING id`,
    [id, providerId, status || null, collectionStatus || null]
  );
  if (!rows[0]) return null;
  return getBooking(id);
}

export async function attachReport(id, providerId, { reportUrl, reportFileName, reportCategory }) {
  const { rows } = await pool.query(
    `UPDATE bookings SET report_url = $3, report_file_name = $4, report_category = $5, status = 'completed'
     WHERE id = $1 AND provider_id = $2 RETURNING id`,
    [id, providerId, reportUrl, reportFileName, reportCategory]
  );
  if (!rows[0]) return null;
  return getBooking(id);
}

export async function listReportsForUser(userId) {
  const { rows } = await pool.query(
    `${BOOKING_SELECT} WHERE b.user_id = $1 AND b.report_url IS NOT NULL ORDER BY b.created_at DESC`,
    [userId]
  );
  return rows.map(mapBooking);
}

// -------------------------------------------------------------- reviews --
export async function addReview(providerId, userId, bookingId, payload) {
  const { rows } = await pool.query(
    `INSERT INTO reviews (provider_id, user_id, booking_id, rating, staff_rating, cleanliness_rating, wait_time_rating, comment)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [providerId, userId, bookingId, payload.rating, payload.staffRating || null, payload.cleanlinessRating || null, payload.waitTimeRating || null, payload.comment || null]
  );
  return mapReview(rows[0]);
}

export async function listReviews(providerId) {
  const { rows } = await pool.query(`SELECT * FROM reviews WHERE provider_id = $1 ORDER BY created_at DESC`, [providerId]);
  return rows.map(mapReview);
}

export async function hasReviewed(bookingId) {
  const { rows } = await pool.query(`SELECT 1 FROM reviews WHERE booking_id = $1`, [bookingId]);
  return rows.length > 0;
}

export async function getRating(providerId) {
  const { rows } = await pool.query(
    `SELECT p.base_rating, p.base_review_count,
            COALESCE(AVG(r.rating), 0) AS live_avg, COUNT(r.id) AS live_count
     FROM providers p LEFT JOIN reviews r ON r.provider_id = p.id
     WHERE p.id = $1 GROUP BY p.id`,
    [providerId]
  );
  if (!rows[0]) return { rating: 0, count: 0 };
  const { base_rating, base_review_count, live_avg, live_count } = rows[0];
  const totalCount = Number(base_review_count) + Number(live_count);
  if (totalCount === 0) return { rating: 0, count: 0 };
  const weightedSum = Number(base_rating) * Number(base_review_count) + Number(live_avg) * Number(live_count);
  return { rating: Math.round((weightedSum / totalCount) * 10) / 10, count: totalCount };
}

function mapReview(row) {
  return {
    id: row.id,
    providerId: row.provider_id,
    userId: row.user_id,
    bookingId: row.booking_id,
    rating: row.rating,
    staffRating: row.staff_rating,
    cleanlinessRating: row.cleanliness_rating,
    waitTimeRating: row.wait_time_rating,
    comment: row.comment,
    verified: row.verified,
    createdAt: row.created_at,
  };
}

// ------------------------------------------------------- portal accounts --
export async function findProviderUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT pu.*, p.name AS provider_name FROM provider_users pu JOIN providers p ON p.id = pu.provider_id WHERE pu.email = $1`,
    [email]
  );
  return rows[0] || null;
}

export async function findAdminByEmail(email) {
  const { rows } = await pool.query(`SELECT * FROM admin_users WHERE email = $1`, [email]);
  return rows[0] || null;
}

// ------------------------------------------------------------- admin ops --
export async function adminStats() {
  const [users, providersRow, bookings] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM users`),
    pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE verified) AS verified FROM providers`),
    pool.query(`SELECT COUNT(*) AS total,
                       COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
                       COALESCE(SUM(amount) FILTER (WHERE payment_status = 'paid'), 0) AS revenue
                FROM bookings`),
  ]);
  return {
    totalUsers: Number(users.rows[0].count),
    totalProviders: Number(providersRow.rows[0].total),
    verifiedProviders: Number(providersRow.rows[0].verified),
    totalBookings: Number(bookings.rows[0].total),
    cancelledBookings: Number(bookings.rows[0].cancelled),
    totalRevenue: Number(bookings.rows[0].revenue),
  };
}

export async function adminListUsers() {
  const { rows } = await pool.query(`SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC`);
  return rows;
}

export async function adminListBookings() {
  const { rows } = await pool.query(`${BOOKING_SELECT} ORDER BY b.created_at DESC`);
  return rows.map(mapBooking);
}

export async function toggleProviderVerified(id) {
  const { rows } = await pool.query(
    `UPDATE providers SET verified = NOT verified WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] ? mapProviderWithRating(rows[0]) : null;
}

export async function providerStats(providerId) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE s.slot_date = CURRENT_DATE) AS today,
       COALESCE(SUM(b.amount) FILTER (WHERE b.payment_status = 'paid'), 0) AS revenue,
       COUNT(*) FILTER (WHERE b.collection_type = 'home' AND b.collection_status IS DISTINCT FROM 'report_ready') AS pending_collections
     FROM bookings b JOIN slots s ON s.id = b.slot_id
     WHERE b.provider_id = $1`,
    [providerId]
  );
  const r = rows[0];
  return {
    totalBookings: Number(r.total),
    todayBookings: Number(r.today),
    revenue: Number(r.revenue),
    pendingCollections: Number(r.pending_collections),
  };
}

export async function listFlaggedReviews() {
  const { rows } = await pool.query(
    `SELECT r.*, p.name AS provider_name FROM reviews r JOIN providers p ON p.id = r.provider_id WHERE r.rating <= 2 ORDER BY r.created_at DESC`
  );
  return rows.map((r) => ({ ...mapReview(r), providerName: r.provider_name }));
}

// -------------------------------------------------------------- notifications --
export async function addNotification(userId, { type, title, body }) {
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, body) VALUES ($1,$2,$3,$4)`,
    [userId, type, title, body]
  );
}

export async function listNotifications(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return rows.map((r) => ({ id: r.id, type: r.type, title: r.title, body: r.body, read: r.read, createdAt: r.created_at }));
}

export async function markNotificationRead(userId, id) {
  const { rows } = await pool.query(
    `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function unreadNotificationCount(userId) {
  const { rows } = await pool.query(`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false`, [userId]);
  return Number(rows[0].count);
}
