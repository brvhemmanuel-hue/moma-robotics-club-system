import { sql, guard, section } from './_lib.js';

export default guard(async (req, res) => {
  const sec = section(req);
  if (req.method === 'GET') {
    return res.json(await sql`SELECT id, name, class_name, student_id FROM members WHERE section = ${sec} ORDER BY name`);
  }
  if (req.method === 'POST') {
    const { name = '', class_name = '', student_id = '' } = req.body || {};
    if (!name.trim()) return res.status(400).json({ error: 'Name is required.' });
    const [row] = await sql`INSERT INTO members (name, class_name, student_id, section) VALUES (${name.trim()}, ${class_name.trim()}, ${student_id.trim()}, ${sec}) RETURNING id`;
    return res.json(row);
  }
  if (req.method === 'DELETE') {
    await sql`DELETE FROM members WHERE id = ${Number(req.query.id)} AND section = ${sec}`;
    return res.json({ ok: true });
  }
  res.status(405).end();
});
