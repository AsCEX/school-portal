-- ALNAVARROCES School Portal — Multi-School / Multi-Tenant D1 Migration
-- Stores school details in the database and scopes all portal content by school_id
-- so additional schools can be integrated cleanly on the same platform.

CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  school_code TEXT,
  short_name TEXT NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  grade_levels TEXT NOT NULL DEFAULT 'Kindergarten to Grade 6',
  hero_description TEXT NOT NULL,
  hero_image_url TEXT NOT NULL DEFAULT '/assets/campus-hero.jpg',
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#07187C',
  primary_dark_color TEXT NOT NULL DEFAULT '#041246',
  academic_year TEXT NOT NULL,
  current_term TEXT NOT NULL,
  admissions_status TEXT NOT NULL,
  campus_hours TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  custom_domain TEXT UNIQUE,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug);
CREATE INDEX IF NOT EXISTS idx_schools_is_default ON schools(is_default);
CREATE INDEX IF NOT EXISTS idx_schools_is_active ON schools(is_active);
CREATE INDEX IF NOT EXISTS idx_schools_custom_domain ON schools(custom_domain);

-- Seed ALNAVARROCES as the initial default school (id = 1)
INSERT OR IGNORE INTO schools (
  id,
  slug,
  school_code,
  short_name,
  name,
  tagline,
  grade_levels,
  hero_description,
  hero_image_url,
  logo_url,
  primary_color,
  primary_dark_color,
  academic_year,
  current_term,
  admissions_status,
  campus_hours,
  phone,
  email,
  address,
  custom_domain,
  is_default,
  is_active
) VALUES (
  1,
  'alnavarroces',
  '129652',
  'ALNAVARROCES',
  'A.L. Navarro Central Elementary School',
  'ALNAVARROCES Official School Portal',
  'Kindergarten to Grade 6',
  'Welcome to the ALNAVARROCES official school portal — your central hub for announcements, upcoming campus events, school statistics, and our dedicated teaching and non-teaching personnel directory.',
  '/assets/campus-hero.jpg',
  NULL,
  '#07187C',
  '#041246',
  'SY 2026–2027',
  'Second Quarter · Active',
  'Early Enrollment Open (K–6)',
  'Mon–Fri, 7:00 AM – 4:30 PM',
  '(082) 234-8900',
  'portal@alnavarroces.edu.ph',
  'A.L. Navarro Central Elementary School Campus, Lasang, Davao City',
  NULL,
  1,
  1
);

-- Scope users to a school (NULL = platform super-admin who can manage all schools)
ALTER TABLE users ADD COLUMN school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL;
UPDATE users SET school_id = 1 WHERE role != 'admin' AND school_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);

-- Scope all portal content tables to schools(id)
ALTER TABLE announcements ADD COLUMN school_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_announcements_school_id ON announcements(school_id);

ALTER TABLE campus_events ADD COLUMN school_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_campus_events_school_id ON campus_events(school_id);

ALTER TABLE school_stats ADD COLUMN school_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_school_stats_school_id ON school_stats(school_id);

ALTER TABLE employees ADD COLUMN school_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_employees_school_id ON employees(school_id);
