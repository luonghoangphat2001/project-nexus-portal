-- ==========================================================
-- 03_users.sql: Default User Accounts, Role Mappings & Academic Affiliations
-- ==========================================================

-- 1. Insert or update sample user accounts (Default password for all: password123)
INSERT INTO users (id, username, email, password, full_name, student_code, cohort_id, major_id, phone, avatar_url, is_active, created_at, updated_at)
VALUES 
  (1, 'superadmin', 'superadmin@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'System Administrator (Super Admin)', 'ADMIN01', NULL, NULL, '0901000001', 'https://ui-avatars.com/api/?name=Super+Admin&background=6366f1&color=fff', 1, NOW(6), NOW(6)),
  (2, 'principal', 'principal@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Dr. Nguyen Van Quan (Head of Department)', 'DEAN01', NULL, NULL, '0901000002', 'https://ui-avatars.com/api/?name=Nguyen+Van+Quan&background=f59e0b&color=fff', 1, NOW(6), NOW(6)),
  (3, 'teacher', 'teacher@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'MSc. Tran Hoang Nam (Advisor Lecturer)', 'LECT01', NULL, 1, '0901000003', 'https://ui-avatars.com/api/?name=Tran+Hoang+Nam&background=3b82f6&color=fff', 1, NOW(6), NOW(6)),
  (4, 'council', 'council@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Assoc. Prof. Le Hoang Council (Reviewer Member)', 'COUN01', NULL, 2, '0901000005', 'https://ui-avatars.com/api/?name=Council+Member&background=8b5cf6&color=fff', 1, NOW(6), NOW(6)),
  (5, 'student', 'student@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Le Anh Tuan (Student 1 - Team Leader)', '21110001', 1, 1, '0901000004', 'https://ui-avatars.com/api/?name=Le+Anh+Tuan&background=10b981&color=fff', 1, NOW(6), NOW(6)),
  (6, 'student2', 'student2@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Pham Minh Quan (Student 2 - Member)', '21110002', 1, 1, '0901000006', 'https://ui-avatars.com/api/?name=Pham+Minh+Quan&background=06b6d4&color=fff', 1, NOW(6), NOW(6)),
  (7, 'student3', 'student3@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Vo Hoang Yen (Student 3 - Member)', '21110003', 1, 1, '0901000007', 'https://ui-avatars.com/api/?name=Vo+Hoang+Yen&background=ec4899&color=fff', 1, NOW(6), NOW(6)),
  (8, 'individual_user', 'individual_user@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Nguyen Van Nam (Individual Student Without Team)', '21110004', 1, 1, '0901000008', 'https://ui-avatars.com/api/?name=Nguyen+Van+Nam&background=059669&color=fff', 1, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE 
  password = VALUES(password),
  is_active = VALUES(is_active),
  full_name = VALUES(full_name),
  student_code = VALUES(student_code),
  cohort_id = VALUES(cohort_id),
  major_id = VALUES(major_id),
  updated_at = NOW(6);

-- 2. Associate users with their respective roles
DELETE FROM user_roles WHERE user_id IN (1, 2, 3, 4, 5, 6, 7, 8);

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'superadmin' AND r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'principal' AND r.name = 'ROLE_PRINCIPAL';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'teacher' AND r.name = 'ROLE_TEACHER';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'council' AND r.name = 'ROLE_COUNCIL';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username IN ('student', 'student2', 'student3', 'individual_user') AND r.name = 'ROLE_USER';

-- 3. Associate users with academic faculties (All belong to Faculty of IT: id=1)
DELETE FROM user_faculties WHERE user_id IN (1, 2, 3, 4, 5, 6, 7, 8);
INSERT IGNORE INTO user_faculties (user_id, faculty_id)
VALUES (1, 1), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1), (7, 1), (8, 1);

-- 4. Associate users with academic departments
DELETE FROM user_departments WHERE user_id IN (1, 2, 3, 4, 5, 6, 7, 8);
INSERT IGNORE INTO user_departments (user_id, department_id)
VALUES 
  (2, 1), -- Head of department in Software Engineering (Department 1)
  (3, 1), -- Lecturer in Software Engineering (Department 1)
  (4, 1), -- Council member in Software Engineering (Department 1)
  (4, 3), -- Council member in Information Systems (Department 3)
  (5, 1), -- Student 1 in Software Engineering (Department 1)
  (6, 1), -- Student 2 in Software Engineering (Department 1)
  (7, 1), -- Student 3 in Software Engineering (Department 1)
  (8, 1); -- Individual student in Software Engineering (Department 1)

-- 5. Associate lecturers with majors and cohorts
DELETE FROM user_majors WHERE user_id IN (3, 4);
INSERT IGNORE INTO user_majors (user_id, major_id)
VALUES 
  (3, 1), (3, 2), -- Teacher advises SE and IS
  (4, 2), (4, 3); -- Council member advises IS and CS

DELETE FROM user_cohorts WHERE user_id IN (3, 4);
INSERT IGNORE INTO user_cohorts (user_id, cohort_id)
VALUES 
  (3, 1), (3, 2), -- Teacher advises K21 and K22
  (4, 1), (4, 2); -- Council member advises K21 and K22
