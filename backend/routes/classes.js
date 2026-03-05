const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const { semester } = req.query;
  let sql = `
    SELECT cl.id, cl.course_id, cl.teacher_id, cl.semester, cl.schedule, cl.capacity,
           c.code as course_code, c.name as course_name, c.credits,
           u.name as teacher_name, t.staff_no as teacher_staff_no
    FROM classes cl
    JOIN courses c ON cl.course_id = c.id
    JOIN teachers t ON cl.teacher_id = t.id
    JOIN users u ON t.user_id = u.id
  `;
  const params = [];
  if (semester) {
    sql += ' WHERE cl.semester = ?';
    params.push(semester);
  }
  sql += ' ORDER BY cl.id';
  const classes = db.prepare(sql).all(...params);
  res.json(classes);
});

router.get('/:id', authenticate, (req, res) => {
  const cls = db.prepare(`
    SELECT cl.id, cl.course_id, cl.teacher_id, cl.semester, cl.schedule, cl.capacity,
           c.code as course_code, c.name as course_name, c.credits,
           u.name as teacher_name, t.staff_no as teacher_staff_no
    FROM classes cl
    JOIN courses c ON cl.course_id = c.id
    JOIN teachers t ON cl.teacher_id = t.id
    JOIN users u ON t.user_id = u.id
    WHERE cl.id = ?
  `).get(req.params.id);
  if (!cls) return res.status(404).json({ error: '开课记录不存在' });
  res.json(cls);
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { course_id, teacher_id, semester, schedule, capacity } = req.body;
  if (!course_id || !teacher_id || !semester) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(course_id);
  if (!course) return res.status(400).json({ error: '课程不存在' });
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(teacher_id);
  if (!teacher) return res.status(400).json({ error: '教师不存在' });

  const info = db.prepare(
    'INSERT INTO classes (course_id, teacher_id, semester, schedule, capacity) VALUES (?, ?, ?, ?, ?)'
  ).run(course_id, teacher_id, semester, schedule || null, capacity || 30);

  res.status(201).json({
    id: Number(info.lastInsertRowid),
    course_id,
    teacher_id,
    semester,
    schedule: schedule || null,
    capacity: capacity || 30
  });
});

router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  const { course_id, teacher_id, semester, schedule, capacity } = req.body;
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
  if (!cls) return res.status(404).json({ error: '开课记录不存在' });

  db.prepare(`UPDATE classes SET
    course_id = COALESCE(?, course_id),
    teacher_id = COALESCE(?, teacher_id),
    semester = COALESCE(?, semester),
    schedule = COALESCE(?, schedule),
    capacity = COALESCE(?, capacity) WHERE id = ?`)
    .run(course_id || null, teacher_id || null, semester || null, schedule || null, capacity || null, req.params.id);

  const updated = db.prepare(`
    SELECT cl.id, cl.course_id, cl.teacher_id, cl.semester, cl.schedule, cl.capacity,
           c.code as course_code, c.name as course_name, c.credits,
           u.name as teacher_name
    FROM classes cl
    JOIN courses c ON cl.course_id = c.id
    JOIN teachers t ON cl.teacher_id = t.id
    JOIN users u ON t.user_id = u.id
    WHERE cl.id = ?
  `).get(req.params.id);
  res.json(updated);
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
  if (!cls) return res.status(404).json({ error: '开课记录不存在' });
  db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
