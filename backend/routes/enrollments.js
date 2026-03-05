const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const MAX_CREDITS_PER_SEMESTER = 30;

function getStudentByUserId(userId) {
  return db.prepare('SELECT * FROM students WHERE user_id = ?').get(userId);
}

router.get('/', authenticate, (req, res) => {
  const { class_id } = req.query;

  if (req.user.role === 'student') {
    const student = getStudentByUserId(req.user.id);
    if (!student) return res.status(404).json({ error: '学生信息未找到' });

    let sql = `
      SELECT e.id, e.class_id, e.student_id, e.enrolled_at,
             c.name as course_name, c.code as course_code, c.credits,
             cl.semester, cl.schedule, u.name as teacher_name
      FROM enrollments e
      JOIN classes cl ON e.class_id = cl.id
      JOIN courses c ON cl.course_id = c.id
      JOIN teachers t ON cl.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE e.student_id = ?
    `;
    return res.json(db.prepare(sql).all(student.id));
  }

  if (class_id) {
    const enrollments = db.prepare(`
      SELECT e.id, e.class_id, e.student_id, e.enrolled_at,
             u.name as student_name, s.student_no
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE e.class_id = ?
    `).all(class_id);
    return res.json(enrollments);
  }

  const enrollments = db.prepare('SELECT * FROM enrollments').all();
  res.json(enrollments);
});

router.post('/', authenticate, authorize('student'), (req, res) => {
  const { class_id } = req.body;
  if (!class_id) return res.status(400).json({ error: '缺少class_id' });

  const student = getStudentByUserId(req.user.id);
  if (!student) return res.status(404).json({ error: '学生信息未找到' });

  const cls = db.prepare(`
    SELECT cl.*, c.credits, c.name as course_name FROM classes cl
    JOIN courses c ON cl.course_id = c.id WHERE cl.id = ?
  `).get(class_id);
  if (!cls) return res.status(404).json({ error: '开课记录不存在' });

  const existingEnrollment = db.prepare(
    'SELECT * FROM enrollments WHERE class_id = ? AND student_id = ?'
  ).get(class_id, student.id);
  if (existingEnrollment) return res.status(409).json({ error: '已选此课程' });

  const enrolledCount = db.prepare(
    'SELECT COUNT(*) as cnt FROM enrollments WHERE class_id = ?'
  ).get(class_id);
  if (enrolledCount.cnt >= cls.capacity) {
    return res.status(400).json({ error: '课程已满' });
  }

  const currentCredits = db.prepare(`
    SELECT COALESCE(SUM(c.credits), 0) as total
    FROM enrollments e
    JOIN classes cl ON e.class_id = cl.id
    JOIN courses c ON cl.course_id = c.id
    WHERE e.student_id = ? AND cl.semester = ?
  `).get(student.id, cls.semester);
  if (currentCredits.total + cls.credits > MAX_CREDITS_PER_SEMESTER) {
    return res.status(400).json({ error: '超过学分上限' });
  }

  const info = db.prepare(
    'INSERT INTO enrollments (class_id, student_id) VALUES (?, ?)'
  ).run(class_id, student.id);

  res.status(201).json({
    id: Number(info.lastInsertRowid),
    class_id,
    student_id: student.id,
    message: '选课成功'
  });
});

router.delete('/:id', authenticate, authorize('student'), (req, res) => {
  const student = getStudentByUserId(req.user.id);
  if (!student) return res.status(404).json({ error: '学生信息未找到' });

  const enrollment = db.prepare(
    'SELECT * FROM enrollments WHERE id = ? AND student_id = ?'
  ).get(req.params.id, student.id);
  if (!enrollment) return res.status(404).json({ error: '选课记录不存在' });

  const grade = db.prepare('SELECT * FROM grades WHERE enrollment_id = ?').get(enrollment.id);
  if (grade) return res.status(400).json({ error: '已录入成绩，无法退课' });

  db.prepare('DELETE FROM enrollments WHERE id = ?').run(req.params.id);
  res.json({ message: '退课成功' });
});

module.exports = router;
