const express = require('express');
const { db } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const courses = db.prepare('SELECT * FROM courses').all();
  res.json(courses);
});

router.get('/:id', authenticate, (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: '课程不存在' });
  res.json(course);
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { code, name, credits, description } = req.body;
  if (!code || !name || credits == null) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  try {
    const info = db.prepare(
      'INSERT INTO courses (code, name, credits, description) VALUES (?, ?, ?, ?)'
    ).run(code, name, credits, description || null);

    res.status(201).json({
      id: Number(info.lastInsertRowid),
      code,
      name,
      credits,
      description: description || null
    });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: '课程代码已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  const { code, name, credits, description } = req.body;
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: '课程不存在' });

  db.prepare(`UPDATE courses SET
    code = COALESCE(?, code),
    name = COALESCE(?, name),
    credits = COALESCE(?, credits),
    description = COALESCE(?, description) WHERE id = ?`)
    .run(code || null, name || null, credits != null ? credits : null, description || null, req.params.id);

  const updated = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: '课程不存在' });
  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
