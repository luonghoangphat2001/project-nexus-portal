-- ==========================================================
-- 20261022_add_real_email_users.sql
-- Add users with real emails to test live SMTP email notifications
-- ==========================================================

INSERT INTO users (id, username, email, password, full_name, student_code, cohort_id, major_id, phone, avatar_url, is_active, created_at, updated_at)
VALUES 
  (47, 'hoangpn2004', 'hoangpn2004@gmail.com', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Pham Nhat Hoang', '22119901', 2, 1, '0901000047', 'https://ui-avatars.com/api/?name=Pham+Nhat+Hoang&background=3b82f6&color=fff', 1, NOW(6), NOW(6)),
  (48, 'phamnhathoang', '1st.phamnhathoang@gmail.com', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'MSc. Pham Nhat Hoang', 'LECT99', NULL, 1, '0901000048', 'https://ui-avatars.com/api/?name=Pham+Nhat+Hoang&background=10b981&color=fff', 1, NOW(6), NOW(6)),
  (49, 'hcmute_25810188', '25810188@student.hcmute.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'HCMUTE Student', '25810188', 1, 1, '0901000049', 'https://ui-avatars.com/api/?name=HCMUTE+Student&background=6366f1&color=fff', 1, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE 
  email = VALUES(email),
  password = VALUES(password),
  is_active = VALUES(is_active),
  full_name = VALUES(full_name),
  student_code = VALUES(student_code),
  cohort_id = VALUES(cohort_id),
  major_id = VALUES(major_id),
  updated_at = NOW(6);

-- Role mappings
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES
  (47, 5), -- ROLE_USER (Student)
  (48, 3), -- ROLE_TEACHER (Lecturer)
  (49, 5); -- ROLE_USER (Student)

-- Faculty mappings (Faculty of IT id=1)
INSERT IGNORE INTO user_faculties (user_id, faculty_id) VALUES
  (47, 1),
  (48, 1),
  (49, 1);

-- Department mappings (Software Engineering id=1)
INSERT IGNORE INTO user_departments (user_id, department_id) VALUES
  (47, 1),
  (48, 1),
  (49, 1);

-- Teacher majors & cohorts for user 48
INSERT IGNORE INTO user_majors (user_id, major_id) VALUES (48, 1), (48, 2);
INSERT IGNORE INTO user_cohorts (user_id, cohort_id) VALUES (48, 1), (48, 2);
