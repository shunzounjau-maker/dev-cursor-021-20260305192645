const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), (req, res) => {
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
  const teacherCount = db.prepare('SELECT COUNT(*) as count FROM teachers').get().count;
  const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
  const currentSemester = '2024-2025-2';
  const classCount = db.prepare(
    'SELECT COUNT(*) as count FROM classes WHERE semester = ?'
  ).get(currentSemester).count;
  const enrollmentCount = db.prepare(`
    SELECT COUNT(*) as count FROM enrollments e
    JOIN classes cl ON e.class_id = cl.id WHERE cl.semester = ?
  `).get(currentSemester).count;

  res.json({
    student_count: studentCount,
    teacher_count: teacherCount,
    course_count: courseCount,
    class_count: classCount,
    enrollment_count: enrollmentCount,
    current_semester: currentSemester
  });
});

module.exports = router;
