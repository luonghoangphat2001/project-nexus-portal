-- ==========================================================
-- 20261022_fix_real_email_user_relations.sql
-- Ensure real email users have proper roles, faculties, departments, and majors
-- ==========================================================

-- Roles
INSERT IGNORE INTO user_roles (user_id, role_id) 
SELECT id, 5 FROM users WHERE username IN ('hoangpn2004', 'hcmute_25810188');
INSERT IGNORE INTO user_roles (user_id, role_id) 
SELECT id, 3 FROM users WHERE username = 'phamnhathoang';

-- Faculties (Faculty of IT id=1)
INSERT IGNORE INTO user_faculties (user_id, faculty_id)
SELECT id, 1 FROM users WHERE username IN ('hoangpn2004', 'phamnhathoang', 'hcmute_25810188');

-- Departments (Software Engineering id=1)
INSERT IGNORE INTO user_departments (user_id, department_id)
SELECT id, 1 FROM users WHERE username IN ('hoangpn2004', 'phamnhathoang', 'hcmute_25810188');

-- Teacher majors & cohorts
INSERT IGNORE INTO user_majors (user_id, major_id)
SELECT id, 1 FROM users WHERE username = 'phamnhathoang';
INSERT IGNORE INTO user_majors (user_id, major_id)
SELECT id, 2 FROM users WHERE username = 'phamnhathoang';

INSERT IGNORE INTO user_cohorts (user_id, cohort_id)
SELECT id, 1 FROM users WHERE username = 'phamnhathoang';
INSERT IGNORE INTO user_cohorts (user_id, cohort_id)
SELECT id, 2 FROM users WHERE username = 'phamnhathoang';

-- Bump AUTO_INCREMENT past any seed records
ALTER TABLE topic_registrations AUTO_INCREMENT = 1000;
ALTER TABLE report_documents AUTO_INCREMENT = 1000;
ALTER TABLE assessments AUTO_INCREMENT = 1000;
ALTER TABLE defense_assignments AUTO_INCREMENT = 1000;
ALTER TABLE defense_councils AUTO_INCREMENT = 1000;
ALTER TABLE matchmaking_posts AUTO_INCREMENT = 1000;
ALTER TABLE team_join_requests AUTO_INCREMENT = 1000;
ALTER TABLE team_invitations AUTO_INCREMENT = 1000;
ALTER TABLE notifications AUTO_INCREMENT = 1000;
