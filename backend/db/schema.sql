-- MediFinder core schema (v2) - now the actual source of truth, not aspirational.
-- Run via: npm run db:setup (creates schema + seeds catalog + demo accounts)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  password_hash   TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS family_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  relation    TEXT NOT NULL,
  age         INT,
  gender      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS providers (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,
  address         TEXT NOT NULL,
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  base_rating     NUMERIC(2,1) DEFAULT 0,
  base_review_count INT DEFAULT 0,
  home_collection BOOLEAN DEFAULT false,
  insurance_accepted BOOLEAN DEFAULT false,
  open_now        BOOLEAN DEFAULT true,
  image_url       TEXT,
  verified        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Provider portal logins, one owner account per provider.
CREATE TABLE IF NOT EXISTS provider_users (
  id            TEXT PRIMARY KEY,
  provider_id   TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tests (
  id            TEXT PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  description   TEXT,
  preparation   TEXT,
  report_time_hours INT DEFAULT 24
);

CREATE TABLE IF NOT EXISTS provider_tests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id   TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  test_id       TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  price         NUMERIC(10,2) NOT NULL,
  report_time_hours INT,
  UNIQUE (provider_id, test_id)
);

CREATE TABLE IF NOT EXISTS slots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_test_id UUID NOT NULL REFERENCES provider_tests(id) ON DELETE CASCADE,
  slot_date       DATE NOT NULL,
  slot_time       TIME NOT NULL,
  capacity        INT NOT NULL DEFAULT 3,
  booked_count    INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bookings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id),
  family_member_id  UUID REFERENCES family_members(id),
  provider_id       TEXT NOT NULL REFERENCES providers(id),
  test_id           TEXT NOT NULL REFERENCES tests(id),
  slot_id           UUID NOT NULL REFERENCES slots(id),
  patient_name      TEXT NOT NULL,
  patient_age       INT,
  patient_phone     TEXT NOT NULL,
  amount            NUMERIC(10,2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, completed, cancelled
  payment_status    TEXT NOT NULL DEFAULT 'unpaid',
  payment_order_id  TEXT,
  payment_id        TEXT,
  collection_type   TEXT NOT NULL DEFAULT 'center', -- center, home
  address           TEXT,
  collection_status TEXT, -- technician_assigned, collected, processing, report_ready
  technician_name   TEXT,
  technician_phone  TEXT,
  report_url        TEXT,
  report_file_name  TEXT,
  report_category   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id         TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES users(id),
  booking_id          UUID NOT NULL REFERENCES bookings(id),
  rating              INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  staff_rating        INT CHECK (staff_rating BETWEEN 1 AND 5),
  cleanliness_rating  INT CHECK (cleanliness_rating BETWEEN 1 AND 5),
  wait_time_rating    INT CHECK (wait_time_rating BETWEEN 1 AND 5),
  comment             TEXT,
  verified            BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_tests_test ON provider_tests(test_id);
CREATE INDEX IF NOT EXISTS idx_slots_provider_test ON slots(provider_test_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id);
