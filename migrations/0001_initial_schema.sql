-- ALNAVARROCES School Portal — Initial D1 (SQLite) Schema

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'faculty', 'student', 'parent')),
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT 'school-portal-web',
  token_hash TEXT NOT NULL UNIQUE,
  last_used_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Important', 'Academics', 'Admissions', 'Campus Life')),
  is_pinned INTEGER NOT NULL DEFAULT 0 CHECK (is_pinned IN (0, 1)),
  published_at TEXT NOT NULL,
  office TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at);

CREATE TABLE IF NOT EXISTS campus_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Academic', 'Community', 'Athletics', 'Arts')),
  event_date TEXT NOT NULL,
  time_range TEXT NOT NULL,
  location TEXT NOT NULL,
  host TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_campus_events_category ON campus_events(category);
CREATE INDEX IF NOT EXISTS idx_campus_events_event_date ON campus_events(event_date);

CREATE TABLE IF NOT EXISTS school_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  numeric_target REAL NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 0,
  suffix TEXT,
  subtitle TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'students' CHECK (icon IN ('students', 'graduation', 'ratio', 'staff', 'clubs', 'library')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_school_stats_sort_order ON school_stats(sort_order);

CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role_type TEXT NOT NULL CHECK (role_type IN ('Teaching', 'Non-Teaching')),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  photo_url TEXT,
  years_of_service TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  office TEXT NOT NULL,
  office_hours TEXT NOT NULL,
  education TEXT NOT NULL,
  summary TEXT NOT NULL,
  bio TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_employees_role_type ON employees(role_type);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
