import { sql, guard, section } from './_lib.js';

export default guard(async (req, res) => {
  const sec = section(req);
  if (req.method === 'GET') {
    return res.json(await sql`
      SELECT s.id, to_char(s.session_date, 'YYYY-MM-DD') AS date, s.topic,
        count(a.*) FILTER (WHERE a.status = 'present') AS present,
        count(a.*) FILTER (WHERE a.status = 'late') AS late,
        count(a.*) FILTER (WHERE a.status = 'absent') AS absent
      FROM sessions s LEFT JOIN attendance a ON a.session_id = s.id
      WHERE s.section = ${sec}
      GROUP BY s.id ORDER BY s.session_date DESC, s.id DESC`);
  }
  if (req.method === 'POST') {
    const { date, topic = '' } = req.body || {};
    if (!date) return res.status(400).json({ error: 'Date is required.' });
    const [row] = await sql`INSERT INTO sessions (session_date, topic, section) VALUES (${date}, ${topic.trim()}, ${sec}) RETURNING id`;
    return res.json(row);
  }
  if (req.method === 'DELETE') {
    await sql`DELETE FROM sessions WHERE id = ${Number(req.query.id)} AND section = ${sec}`;
    return res.json({ ok: true });
  }
  res.status(405).end();
});
