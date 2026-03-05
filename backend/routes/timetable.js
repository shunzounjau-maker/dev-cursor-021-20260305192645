const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const { semester } = req.query;

  if (req.user.role === 'student') {
    const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(req.user.id);
    if (!student) return res.status(404).json({ error: '学生信息未找到' });

    let sql = `
      SELECT c.name as course_name, c.code as course_code, c.credits,
             u.name as teacher_name, cl.schedule, cl.semester, cl.id as class_id
      FROM enrollments e
      JOIN classes cl ON e.class_id = cl.id
      JOIN courses c ON cl.course_id = c.id
      JOIN teachers t ON cl.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE e.student_id = ?
    `;
    const params = [student.id];
    if (semester) {
      sql += ' AND cl.semester = ?';
      params.push(semester);
    }
    sql += ' ORDER BY cl.schedule';

    const timetable = db.prepare(sql).all(...params);
    return res.json(timetable);
  }

  if (req.user.role === 'teacher') {
    const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(req.user.id);
    if (!teacher) return res.status(404).json({ error: '教师信息未找到' });

    let sql = `
      SELECT c.name as course_name, c.code as course_code, c.credits,
             cl.schedule, cl.semester, cl.id as class_id, cl.capacity
      FROM classes cl
      JOIN courses c ON cl.course_id = c.id
      WHERE cl.teacher_id = ?
    `;
    const params = [teacher.id];
    if (semester) {
      sql += ' AND cl.semester = ?';
      params.push(semester);
    }
    sql += ' ORDER BY cl.schedule';

    const timetable = db.prepare(sql).all(...params);
    return res.json(timetable);
  }

  res.status(403).json({ error: '权限不足' });
});

module.exports = router;
