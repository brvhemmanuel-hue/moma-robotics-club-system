-- MOMA Robotics Club Attendance: full database schema (Neon / Postgres).
-- Optional: the app creates these tables itself on first use.
-- To run it manually, paste this into the Neon SQL Editor.

CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  class_name TEXT DEFAULT '',
  student_id TEXT DEFAULT '',
  section TEXT NOT NULL DEFAULT 'jhs',          -- 'jhs' or 'primary'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_date DATE NOT NULL,
  topic TEXT DEFAULT '',
  section TEXT NOT NULL DEFAULT 'jhs',          -- 'jhs' or 'primary'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
  session_id INT REFERENCES sessions(id) ON DELETE CASCADE,
  member_id INT REFERENCES members(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present','late','absent')),
  PRIMARY KEY (session_id, member_id)
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'jhs',          -- 'jhs', 'primary' or 'all'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS members_section_idx ON members(section);
CREATE INDEX IF NOT EXISTS sessions_section_idx ON sessions(section);
