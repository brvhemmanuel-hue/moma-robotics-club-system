import { sql, guard, makeToken, checkPw, same } from './_lib.js';

export const ownerName = () => (process.env.ADMIN_USERNAME || 'admin').toLowerCase();

export default guard(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { username = '', password = '' } = req.body || {};
  const u = username.trim().toLowerCase();
  if (u === ownerName() && process.env.ADMIN_PASSWORD && same(password, process.env.ADMIN_PASSWORD)) {
    const user = { name: 'Main Admin', role: 'super', section: 'all' };
    return res.json({ token: makeToken(user), user });
  }
  const [a] = await sql`SELECT id, name, section, password_hash FROM admins WHERE username = ${u}`;
  if (!a || !checkPw(password, a.password_hash)) return res.status(401).json({ error: 'Incorrect username or password.' });
  const user = { id: a.id, name: a.name, role: 'admin', section: a.section };
  res.json({ token: makeToken(user), user });
}, { open: true });
