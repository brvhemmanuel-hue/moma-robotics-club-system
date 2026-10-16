import { sql, guard, section } from './_lib.js';

const PRIMARY_DEPTS = ['lower_primary', 'upper_primary'];

// Validates and tidies the member fields for the current group.
const fields = (b = {}, sec) => {
  const name = (b.name || '').trim();
  const gender = ['male', 'female'].includes(b.gender) ? b.gender : '';
  const department = sec === 'jhs' ? 'jhs' : PRIMARY_DEPTS.includes(b.department) ? b.department : '';
  if (!name) return { error: 'Name is required.' };
  if (!gender) return { error: 'Please choose the gender.' };
  if (!department) return { error: 'Please choose Lower Primary or Upper Primary.' };
  return { name, gender, department, class_name: (b.class_name || '').trim(), student_id: (b.student_id || '').trim() };
};

export default guard(async (req, res) => {
  const sec = section(req);
  if (req.method === 'GET') {
    // The main admin can ask for the whole club with ?scope=all
    const all = req.auth.section === 'all' && req.query.scope === 'all';
    const rows = all
      ? await sql`SELECT id, name, class_name, student_id, gender, department, section FROM members ORDER BY section, name`
      : await sql`SELECT id, name, class_name, student_id, gender, department, section FROM members WHERE section = ${sec} ORDER BY name`;
    return res.json(rows);
  }
  if (req.method === 'POST') {
    const f = fields(req.body, sec);
    if (f.error) return res.status(400).json({ error: f.error });
    const [row] = await sql`INSERT INTO members (name, class_name, student_id, gender, department, section) VALUES (${f.name}, ${f.class_name}, ${f.student_id}, ${f.gender}, ${f.department}, ${sec}) RETURNING id`;
    return res.json(row);
  }
  if (req.method === 'PUT') {
    const f = fields(req.body, sec);
    if (f.error) return res.status(400).json({ error: f.error });
    await sql`UPDATE members SET name = ${f.name}, class_name = ${f.class_name}, student_id = ${f.student_id}, gender = ${f.gender}, department = ${f.department} WHERE id = ${Number(req.body.id)} AND section = ${sec}`;
    return res.json({ ok: true });
  }
  if (req.method === 'DELETE') {
    await sql`DELETE FROM members WHERE id = ${Number(req.query.id)} AND section = ${sec}`;
    return res.json({ ok: true });
  }
  res.status(405).end();
});
