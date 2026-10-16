import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

export const sql = neon(process.env.DATABASE_URL);
export const SECTIONS = ['jhs', 'primary'];

const secret = () => process.env.AUTH_SECRET || 'change-me';
const sig = (s) => crypto.createHmac('sha256', secret()).update(s).digest('hex');
export const same = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export const makeToken = (user) => {
  const body = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 12 * 3600 * 1000 })).toString('base64url');
  return `${body}.${sig(body)}`;
};
const readToken = (t = '') => {
  const [body, s] = t.split('.');
  if (!body || !s || !same(s, sig(body))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
};

export const hashPw = (pw) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
};
export const checkPw = (pw, stored = '') => {
  const [salt, h] = stored.split(':');
  return !!salt && !!h && same(crypto.scryptSync(pw, salt, 64).toString('hex'), h);
};

let ready;
const init = () => (ready ??= (async () => {
  await sql`CREATE TABLE IF NOT EXISTS members (id SERIAL PRIMARY KEY, name TEXT NOT NULL, class_name TEXT DEFAULT '', student_id TEXT DEFAULT '', section TEXT NOT NULL DEFAULT 'jhs', created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS sessions (id SERIAL PRIMARY KEY, session_date DATE NOT NULL, topic TEXT DEFAULT '', section TEXT NOT NULL DEFAULT 'jhs', created_at TIMESTAMPTZ DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS attendance (session_id INT REFERENCES sessions(id) ON DELETE CASCADE, member_id INT REFERENCES members(id) ON DELETE CASCADE, status TEXT NOT NULL CHECK (status IN ('present','late','absent')), PRIMARY KEY (session_id, member_id))`;
  // Upgrade path for databases created before sections existed.
  await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'jhs'`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'jhs'`;
  // Gender and department support (safe to run on existing databases).
  await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT ''`;
  await sql`UPDATE members SET department = 'jhs' WHERE department = '' AND section = 'jhs'`;
  await sql`CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, name TEXT NOT NULL, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, section TEXT NOT NULL DEFAULT 'jhs', created_at TIMESTAMPTZ DEFAULT now())`;
})());

// Wraps a handler with schema setup, auth and error handling.
export const guard = (fn, { open = false, superOnly = false } = {}) => async (req, res) => {
  try {
    await init();
    if (!open) {
      const a = readToken((req.headers.authorization || '').replace('Bearer ', ''));
      if (!a) return res.status(401).json({ error: 'Please sign in again.' });
      if (a.role !== 'super') {
        const [row] = await sql`SELECT section FROM admins WHERE id = ${a.id}`;
        if (!row) return res.status(401).json({ error: 'This account no longer exists.' });
        a.section = row.section;
      }
      if (superOnly && a.role !== 'super') return res.status(403).json({ error: 'Main admin only.' });
      req.auth = a;
    }
    await fn(req, res);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error. Check your database settings.' });
  }
};

// The group this request works on. Single-group admins are locked to theirs.
export const section = (req) => {
  const a = req.auth;
  if (a.section !== 'all') return a.section;
  return SECTIONS.includes(req.query.section) ? req.query.section : 'jhs';
};
