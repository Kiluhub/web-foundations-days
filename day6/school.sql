-- =====================================================
-- Day 6 Assignment: A School Database (SQLite)
-- =====================================================

-- SQLite does not enforce foreign keys unless this is switched on
PRAGMA foreign_keys = ON;

-- Clean start so the script can be re-run in the playground
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- -----------------------------------------------------
-- Step 2: CREATE TABLE statements
-- -----------------------------------------------------

-- students: one row per student
CREATE TABLE students (
  student_id INTEGER PRIMARY KEY AUTOINCREMENT,   -- primary key
  name       TEXT NOT NULL,                       -- a student must have a name
  email      TEXT NOT NULL UNIQUE                 -- UNIQUE: no two students share an email
);

-- courses: one row per course
CREATE TABLE courses (
  course_id INTEGER PRIMARY KEY AUTOINCREMENT,    -- primary key
  title     TEXT NOT NULL,                        -- a course must have a title
  credits   INTEGER NOT NULL CHECK (credits > 0)  -- credits must be positive
);

-- enrolments: join table linking students and courses, and holding the grade
CREATE TABLE enrolments (
  enrolment_id INTEGER PRIMARY KEY AUTOINCREMENT, -- primary key
  student_id   INTEGER NOT NULL,                  -- which student
  course_id    INTEGER NOT NULL,                  -- which course
  grade        INTEGER CHECK (grade BETWEEN 0 AND 100), -- NULL allowed = not graded yet
  FOREIGN KEY (student_id) REFERENCES students(student_id),  -- must be a real student
  FOREIGN KEY (course_id)  REFERENCES courses(course_id),    -- must be a real course
  UNIQUE (student_id, course_id)  -- the same student cannot enrol on the same course twice
);

-- Index to speed up "find all students on a course" (see school-design.md)
CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);

-- -----------------------------------------------------
-- Step 3: INSERT sample data
-- -----------------------------------------------------

-- 4 students (the 4th has no enrolments, used by query 4)
INSERT INTO students (name, email) VALUES
  ('Amina Yusuf',    'amina@school.com'),
  ('Brian Otieno',   'brian@school.com'),
  ('Cynthia Wanjiru','cynthia@school.com'),
  ('David Kamau',    'david@school.com');

-- 3 courses
INSERT INTO courses (title, credits) VALUES
  ('Web Development', 4),
  ('Databases',       3),
  ('Mathematics',     3);

-- 5 enrolments (student_id, course_id, grade)
INSERT INTO enrolments (student_id, course_id, grade) VALUES
  (1, 1, 85),  -- Amina    -> Web Development
  (1, 2, 78),  -- Amina    -> Databases
  (2, 1, 90),  -- Brian    -> Web Development
  (2, 3, 66),  -- Brian    -> Mathematics
  (3, 2, 72);  -- Cynthia  -> Databases

-- -----------------------------------------------------
-- Step 4: The five queries
-- -----------------------------------------------------

-- Query 1: all courses for one student (by name)
-- Uses JOIN through the enrolments table.
-- Expected: Web Development (85), Databases (78)
SELECT c.title, e.grade
FROM students s
JOIN enrolments e ON e.student_id = s.student_id
JOIN courses c    ON c.course_id  = e.course_id
WHERE s.name = 'Amina Yusuf';

-- Query 2: all students on one course
-- Expected: Amina Yusuf (78), Cynthia Wanjiru (72)
SELECT s.name, s.email, e.grade
FROM courses c
JOIN enrolments e ON e.course_id  = c.course_id
JOIN students s   ON s.student_id = e.student_id
WHERE c.title = 'Databases';

-- Query 3: number of students per course
-- Uses GROUP BY. LEFT JOIN keeps courses that have zero students.
-- Expected: Web Development 2, Databases 2, Mathematics 1
SELECT c.title, COUNT(e.enrolment_id) AS number_of_students
FROM courses c
LEFT JOIN enrolments e ON e.course_id = c.course_id
GROUP BY c.course_id, c.title;

-- Query 4: students who have no enrolments
-- LEFT JOIN keeps every student; students with no match have NULL on the right.
-- Expected: David Kamau
SELECT s.name, s.email
FROM students s
LEFT JOIN enrolments e ON e.student_id = s.student_id
WHERE e.enrolment_id IS NULL;

-- Query 5: update one enrolment's grade
-- Brian's Mathematics grade changes from 66 to 75.
UPDATE enrolments
SET grade = 75
WHERE student_id = (SELECT student_id FROM students WHERE name = 'Brian Otieno')
  AND course_id  = (SELECT course_id  FROM courses  WHERE title = 'Mathematics');

-- Check the update worked. Expected: Brian Otieno, Mathematics, 75
SELECT s.name, c.title, e.grade
FROM enrolments e
JOIN students s ON s.student_id = e.student_id
JOIN courses c  ON c.course_id  = e.course_id
WHERE s.name = 'Brian Otieno' AND c.title = 'Mathematics';
