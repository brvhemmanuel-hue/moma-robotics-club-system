import { sql, guard, section } from './_lib.js';

const OK = ['present', 'late', 'absent'];

export default guard(async (req, res) => {
  const sec = section(req);
  if (req.method === 'GET') {
    const id = Number(req.query.session_id);
    return res.json(await sql`SELECT a.member_id, a.status FROM attendance a JOIN sessions s ON s.id = a.session_id WHERE a.session_id = ${id} AND s.section = ${sec}`);
  }
  if (req.method === 'POST') {
    const { session_id, records = [] } = req.body || {};
    const rows = records.filter((r) => OK.includes(r.status));
    if (!session_id || !rows.length) return res.status(400).json({ error: 'Nothing to save.' });
    const ids = rows.map((r) => Number(r.member_id));
    const sts = rows.map((r) => r.status);
    // Only saves members and sessions that belong to this group.
    await sql`INSERT INTO attendance (session_id, member_id, status)
      SELECT s.id, t.m, t.st FROM unnest(${ids}::int[], ${sts}::text[]) AS t(m, st)
      JOIN members mm ON mm.id = t.m
      JOIN sessions s ON s.id = ${Number(session_id)} AND s.section = mm.section AND s.section = ${sec}
      ON CONFLICT (session_id, member_id) DO UPDATE SET status = EXCLUDED.status`;
    return res.json({ saved: rows.length });
  }
  res.status(405).end();
});
