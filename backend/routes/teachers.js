const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const teachers = db.prepare(`
    SELECT t.id, u.username, u.name, t.staff_no, t.department, u.email
    FROM teachers t JOIN users u ON t.user_id = u.id
  `).all();
  res.json(teachers);
});

router.get('/:id', authenticate, (req, res) => {
  const teacher = db.prepare(`
    SELECT t.id, u.username, u.name, t.staff_no, t.department, u.email
    FROM teachers t JOIN users u ON t.user_id = u.id WHERE t.id = ?
  `).get(req.params.id);
  if (!teacher) return res.status(404).json({ error: '教师不存在' });
  res.json(teacher);
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { username, password, name, staff_no, department, email } = req.body;
  if (!username || !password || !name || !staff_no) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  try {
    const result = db.transaction(() => {
      const hash = bcrypt.hashSync(password, 10);
      const userInfo = db.prepare(
        'INSERT INTO users (username, password_hash, role, name, email) VALUES (?, ?, ?, ?, ?)'
      ).run(username, hash, 'teacher', name, email || null);

      const teacherInfo = db.prepare(
        'INSERT INTO teachers (user_id, staff_no, department) VALUES (?, ?, ?)'
      ).run(userInfo.lastInsertRowid, staff_no, department || null);

      return {
        id: Number(teacherInfo.lastInsertRowid),
        username,
        name,
        staff_no,
        department: department || null,
        email: email || null
      };
    })();
    res.status(201).json(result);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: '用户名或工号已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  const { name, staff_no, department, email } = req.body;
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
  if (!teacher) return res.status(404).json({ error: '教师不存在' });

  db.transaction(() => {
    if (name || email) {
      db.prepare('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?')
        .run(name || null, email || null, teacher.user_id);
    }
    db.prepare('UPDATE teachers SET staff_no = COALESCE(?, staff_no), department = COALESCE(?, department) WHERE id = ?')
      .run(staff_no || null, department || null, req.params.id);
  })();

  const updated = db.prepare(`
    SELECT t.id, u.username, u.name, t.staff_no, t.department, u.email
    FROM teachers t JOIN users u ON t.user_id = u.id WHERE t.id = ?
  `).get(req.params.id);
  res.json(updated);
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
  if (!teacher) return res.status(404).json({ error: '教师不存在' });

  db.transaction(() => {
    db.prepare('DELETE FROM teachers WHERE id = ?').run(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(teacher.user_id);
  })();

  res.json({ message: '删除成功' });
});

module.exports = router;
