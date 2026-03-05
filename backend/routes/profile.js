const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, username, role, name, email, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  let extra = {};
  if (user.role === 'teacher') {
    const teacher = db.prepare('SELECT staff_no, department FROM teachers WHERE user_id = ?').get(user.id);
    if (teacher) extra = teacher;
  } else if (user.role === 'student') {
    const student = db.prepare('SELECT student_no, grade, class_name FROM students WHERE user_id = ?').get(user.id);
    if (student) extra = student;
  }

  res.json({ ...user, ...extra });
});

router.put('/', authenticate, (req, res) => {
  const { name, email } = req.body;
  db.prepare('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?')
    .run(name || null, email || null, req.user.id);

  const user = db.prepare('SELECT id, username, role, name, email FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

module.exports = router;
