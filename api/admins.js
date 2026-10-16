import { sql, guard, hashPw } from './_lib.js';

const owner = () => (process.env.ADMIN_USERNAME || 'admin').toLowerCase();

export default guard(async (req, res) => {
  if (req.method === 'GET') {
    return res.json(await sql`SELECT id, name, username, section FROM admins ORDER BY name`);
  }
  if (req.method === 'POST') {
    const { name = '', username = '', password = '', section = 'jhs' } = req.body || {};
    const u = username.trim().toLowerCase();
    if (!name.trim() || !u || password.length < 6) return res.status(400).json({ error: 'Name, username and a password of at least 6 characters are required.' });
    if (!['jhs', 'primary', 'all'].includes(section)) return res.status(400).json({ error: 'Invalid section.' });
    if (u === owner()) return res.status(400).json({ error: 'That username is reserved.' });
    const [dup] = await sql`SELECT 1 FROM admins WHERE username = ${u}`;
    if (dup) return res.status(409).json({ error: 'That username is already taken.' });
    await sql`INSERT INTO admins (name, username, password_hash, section) VALUES (${name.trim()}, ${u}, ${hashPw(password)}, ${section})`;
    return res.json({ ok: true });
  }
  if (req.method === 'PUT') {
    const { id, password = '' } = req.body || {};
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    await sql`UPDATE admins SET password_hash = ${hashPw(password)} WHERE id = ${Number(id)}`;
    return res.json({ ok: true });
  }
  if (req.method === 'DELETE') {
    await sql`DELETE FROM admins WHERE id = ${Number(req.query.id)}`;
    return res.json({ ok: true });
  }
  res.status(405).end();
}, { superOnly: true });
