import { sql, guard, section } from './_lib.js';

export default guard(async (req, res) => {
  const sec = section(req);
  const [{ total }] = await sql`SELECT count(*)::int AS total FROM sessions WHERE section = ${sec}`;
  const members = await sql`
    SELECT m.id, m.name, m.class_name,
      count(a.*) FILTER (WHERE a.status = 'present')::int AS present,
      count(a.*) FILTER (WHERE a.status = 'late')::int AS late,
      count(a.*) FILTER (WHERE a.status = 'absent')::int AS absent
    FROM members m LEFT JOIN attendance a ON a.member_id = m.id
    WHERE m.section = ${sec}
    GROUP BY m.id ORDER BY m.name`;
  res.json({ total_sessions: total, members });
});
