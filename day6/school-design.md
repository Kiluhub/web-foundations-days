# School Database Design

## Tables

### students
Stores one row for each student: `student_id` (primary key), `name` and `email`. The email is `UNIQUE` so two students cannot share one, and both `name` and `email` are `NOT NULL` because a student record is useless without them.

### courses
Stores one row for each course: `course_id` (primary key), `title` and `credits`. The title is required, and credits must be greater than zero.

### enrolments
Stores the fact that a student is enrolled on a course. It has its own `enrolment_id`, a `student_id` and `course_id` (both foreign keys), and the `grade`. The grade lives here because it belongs to the pair "this student on this course", not to the student or the course alone. A `UNIQUE (student_id, course_id)` rule stops the same student enrolling on the same course twice.

## Relationships

- **students to enrolments: one-to-many.** One student can have many enrolments, but each enrolment belongs to exactly one student.
- **courses to enrolments: one-to-many.** One course can have many enrolments, but each enrolment belongs to exactly one course.
- **students to courses: many-to-many.** A student can take many courses and a course can have many students.

### Why a join table is needed
A relational table cannot store a list of values in one column, so a many-to-many relationship cannot be stored directly. Putting course ids inside the students table (or student ids inside courses) would repeat data, break `JOIN`s and make updates error-prone. The `enrolments` table solves this by turning one many-to-many relationship into two one-to-many relationships. It also gives a natural place to store the grade.

## Index

I would add an index on `enrolments(course_id)`:

- `CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);`
- **Reason:** the `UNIQUE (student_id, course_id)` rule already creates an index that helps look up enrolments by student. Looking up all students on a course (and counting students per course) filters by `course_id`, which that index cannot serve well. As the number of enrolments grows, the index avoids scanning the whole table for every course query.

## SQL or NoSQL?

I would choose SQL for this system. School data is highly structured and relational: students, courses and enrolments have fixed fields and clear links between them. SQL enforces that structure with primary keys, foreign keys, `NOT NULL`, `UNIQUE` and `CHECK` rules, so bad data such as an enrolment for a student who does not exist is rejected. It also handles questions that span tables, such as "students with no enrolments" or "students per course", with `JOIN` and `GROUP BY`, and it keeps grades accurate with transactions. NoSQL would suit data with flexible or changing shapes or extreme scale, but this system needs consistency and relationships more than flexibility.
