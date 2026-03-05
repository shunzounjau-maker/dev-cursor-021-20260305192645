const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  if (req.user.role === 'student') {
    const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(req.user.id);
    if (!student) return res.status(404).json({ error: '学生信息未找到' });

    const grades = db.prepare(`
      SELECT g.id, g.score, g.updated_at, c.name as course_name, c.code as course_code,
             c.credits, cl.semester, u.name as teacher_name
      FROM grades g
      JOIN enrollments e ON g.enrollment_id = e.id
      JOIN classes cl ON e.class_id = cl.id
      JOIN courses c ON cl.course_id = c.id
      JOIN teachers t ON cl.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE e.student_id = ?
      ORDER BY cl.semester DESC, c.code
    `).all(student.id);
    return res.json(grades);
  }

  if (req.user.role === 'teacher') {
    const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(req.user.id);
    if (!teacher) return res.status(404).json({ error: '教师信息未找到' });

    const { class_id } = req.query;
    if (class_id) {
      const cls = db.prepare('SELECT * FROM classes WHERE id = ? AND teacher_id = ?').get(class_id, teacher.id);
      if (!cls) return res.status(403).json({ error: '非本人授课' });

      const grades = db.prepare(`
        SELECT g.id, g.score, g.enrollment_id, g.updated_at,
               u.name as student_name, s.student_no, e.id as enrollment_id
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN grades g ON g.enrollment_id = e.id
        WHERE e.class_id = ?
      `).all(class_id);
      return res.json(grades);
    }
  }

  if (req.user.role === 'admin') {
    const grades = db.prepare(`
      SELECT g.*, e.class_id, e.student_id FROM grades g
      JOIN enrollments e ON g.enrollment_id = e.id
    `).all();
    return res.json(grades);
  }

  res.status(403).json({ error: '权限不足' });
});

router.post('/', authenticate, authorize('teacher'), (req, res) => {
  const { enrollment_id, score } = req.body;
  if (!enrollment_id || score == null) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  if (score < 0 || score > 100) {
    return res.status(400).json({ error: '分数须在0-100之间' });
  }

  const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(req.user.id);
  if (!teacher) return res.status(404).json({ error: '教师信息未找到' });

  const enrollment = db.prepare(`
    SELECT e.*, cl.teacher_id FROM enrollments e
    JOIN classes cl ON e.class_id = cl.id WHERE e.id = ?
  `).get(enrollment_id);
  if (!enrollment) return res.status(404).json({ error: '选课记录不存在' });
  if (enrollment.teacher_id !== teacher.id) {
    return res.status(403).json({ error: '非本人授课，无法录入成绩' });
  }

  const existing = db.prepare('SELECT * FROM grades WHERE enrollment_id = ?').get(enrollment_id);
  if (existing) {
    return res.status(409).json({ error: '成绩已存在，请使用修改接口' });
  }

  const info = db.prepare(
    'INSERT INTO grades (enrollment_id, score) VALUES (?, ?)'
  ).run(enrollment_id, score);

  res.status(201).json({
    id: Number(info.lastInsertRowid),
    enrollment_id,
    score,
    message: '成绩录入成功'
  });
});

router.put('/:id', authenticate, authorize('teacher'), (req, res) => {
  const { score } = req.body;
  if (score == null || score < 0 || score > 100) {
    return res.status(400).json({ error: '分数须在0-100之间' });
  }

  const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(req.user.id);
  if (!teacher) return res.status(404).json({ error: '教师信息未找到' });

  const grade = db.prepare(`
    SELECT g.*, cl.teacher_id FROM grades g
    JOIN enrollments e ON g.enrollment_id = e.id
    JOIN classes cl ON e.class_id = cl.id
    WHERE g.id = ?
  `).get(req.params.id);
  if (!grade) return res.status(404).json({ error: '成绩记录不存在' });
  if (grade.teacher_id !== teacher.id) {
    return res.status(403).json({ error: '非本人授课，无法修改成绩' });
  }

  db.prepare('UPDATE grades SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(score, req.params.id);

  res.json({
    id: grade.id,
    enrollment_id: grade.enrollment_id,
    score,
    message: '成绩修改成功'
  });
});

module.exports = router;
