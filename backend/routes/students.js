const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const students = db.prepare(`
    SELECT s.id, u.username, u.name, s.student_no, s.grade, s.class_name, u.email
    FROM students s JOIN users u ON s.user_id = u.id
  `).all();
  res.json(students);
});

router.get('/:id', authenticate, (req, res) => {
  const student = db.prepare(`
    SELECT s.id, u.username, u.name, s.student_no, s.grade, s.class_name, u.email
    FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?
  `).get(req.params.id);
  if (!student) return res.status(404).json({ error: '学生不存在' });
  res.json(student);
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { username, password, name, student_no, grade, class_name, email } = req.body;
  if (!username || !password || !name || !student_no) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  try {
    const result = db.transaction(() => {
      const hash = bcrypt.hashSync(password, 10);
      const userInfo = db.prepare(
        'INSERT INTO users (username, password_hash, role, name, email) VALUES (?, ?, ?, ?, ?)'
      ).run(username, hash, 'student', name, email || null);

      const studentInfo = db.prepare(
        'INSERT INTO students (user_id, student_no, grade, class_name) VALUES (?, ?, ?, ?)'
      ).run(userInfo.lastInsertRowid, student_no, grade || null, class_name || null);

      return {
        id: Number(studentInfo.lastInsertRowid),
        username,
        name,
        student_no,
        grade: grade || null,
        class_name: class_name || null,
        email: email || null
      };
    })();
    res.status(201).json(result);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: '用户名或学号已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  const { name, student_no, grade, class_name, email } = req.body;
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: '学生不存在' });

  db.transaction(() => {
    if (name || email) {
      db.prepare('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?')
        .run(name || null, email || null, student.user_id);
    }
    db.prepare(`UPDATE students SET
      student_no = COALESCE(?, student_no),
      grade = COALESCE(?, grade),
      class_name = COALESCE(?, class_name) WHERE id = ?`)
      .run(student_no || null, grade || null, class_name || null, req.params.id);
  })();

  const updated = db.prepare(`
    SELECT s.id, u.username, u.name, s.student_no, s.grade, s.class_name, u.email
    FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?
  `).get(req.params.id);
  res.json(updated);
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: '学生不存在' });

  db.transaction(() => {
    db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(student.user_id);
  })();

  res.json({ message: '删除成功' });
});

module.exports = router;
