const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'campus.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')),
      name TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      staff_no TEXT UNIQUE NOT NULL,
      department TEXT
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_no TEXT UNIQUE NOT NULL,
      grade TEXT,
      class_name TEXT
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      credits INTEGER NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      semester TEXT NOT NULL,
      schedule TEXT,
      capacity INTEGER DEFAULT 30
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(class_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enrollment_id INTEGER UNIQUE NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
      score INTEGER NOT NULL CHECK(score >= 0 AND score <= 100),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
    CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
    CREATE INDEX IF NOT EXISTS idx_classes_course_id ON classes(course_id);
    CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
    CREATE INDEX IF NOT EXISTS idx_grades_enrollment_id ON grades(enrollment_id);
  `);
}

function seedData() {
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (existing.cnt > 0) return;

  const seedDir = '/workspace/data/021/seed';
  if (!fs.existsSync(seedDir)) return;

  const users = JSON.parse(fs.readFileSync(path.join(seedDir, 'users.json'), 'utf8'));
  const teachersData = JSON.parse(fs.readFileSync(path.join(seedDir, 'teachers.json'), 'utf8'));
  const studentsData = JSON.parse(fs.readFileSync(path.join(seedDir, 'students.json'), 'utf8'));
  const coursesData = JSON.parse(fs.readFileSync(path.join(seedDir, 'courses.json'), 'utf8'));
  const classesData = JSON.parse(fs.readFileSync(path.join(seedDir, 'classes.json'), 'utf8'));

  const insertUser = db.prepare(
    'INSERT INTO users (username, password_hash, role, name, email) VALUES (?, ?, ?, ?, ?)'
  );
  const insertTeacher = db.prepare(
    'INSERT INTO teachers (user_id, staff_no, department) VALUES (?, ?, ?)'
  );
  const insertStudent = db.prepare(
    'INSERT INTO students (user_id, student_no, grade, class_name) VALUES (?, ?, ?, ?)'
  );
  const insertCourse = db.prepare(
    'INSERT INTO courses (code, name, credits, description) VALUES (?, ?, ?, ?)'
  );
  const insertClass = db.prepare(
    'INSERT INTO classes (course_id, teacher_id, semester, schedule, capacity) VALUES (?, ?, ?, ?, ?)'
  );

  const seedAll = db.transaction(() => {
    const userMap = {};
    for (const u of users) {
      const hash = bcrypt.hashSync(u.password, 10);
      const info = insertUser.run(u.username, hash, u.role, u.name, u.email);
      userMap[u.username] = info.lastInsertRowid;
    }

    const teacherMap = {};
    for (const t of teachersData) {
      const userId = userMap[t.username];
      if (userId) {
        const info = insertTeacher.run(userId, t.staff_no, t.department);
        teacherMap[t.staff_no] = info.lastInsertRowid;
      }
    }

    for (const s of studentsData) {
      const userId = userMap[s.username];
      if (userId) {
        insertStudent.run(userId, s.student_no, s.grade, s.class_name);
      }
    }

    const courseMap = {};
    for (const c of coursesData) {
      const info = insertCourse.run(c.code, c.name, c.credits, c.description);
      courseMap[c.code] = info.lastInsertRowid;
    }

    for (const cl of classesData) {
      const courseId = courseMap[cl.course_code];
      const teacherId = teacherMap[cl.teacher_staff_no];
      if (courseId && teacherId) {
        insertClass.run(courseId, teacherId, cl.semester, cl.schedule, cl.capacity);
      }
    }
  });

  seedAll();
  console.log('Seed data loaded successfully.');
}

module.exports = { db, initDb, seedData };
