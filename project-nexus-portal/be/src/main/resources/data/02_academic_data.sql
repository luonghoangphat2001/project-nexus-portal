-- ==========================================================
-- 02_academic_data.sql: Master Academic Classification Data
-- ==========================================================

-- 1. Faculties
INSERT INTO faculties (id, code, name, created_at, updated_at) VALUES
  (1, 'FIT', 'Faculty of Information Technology', NOW(6), NOW(6)),
  (2, 'FEE', 'Faculty of Electrical and Electronics Engineering', NOW(6), NOW(6)),
  (3, 'FME', 'Faculty of Mechanical Engineering', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Departments
INSERT INTO departments (id, faculty_id, code, name, created_at, updated_at) VALUES
  (1, 1, 'SE', 'Software Engineering Department', NOW(6), NOW(6)),
  (2, 1, 'CN', 'Computer Networks and Communications Department', NOW(6), NOW(6)),
  (3, 1, 'IS', 'Information Systems Department', NOW(6), NOW(6)),
  (4, 1, 'CS', 'Computer Science Department', NOW(6), NOW(6)),
  (5, 2, 'EE', 'Electronic Engineering Department', NOW(6), NOW(6)),
  (6, 2, 'AC', 'Automation and Control Engineering Department', NOW(6), NOW(6)),
  (7, 3, 'ME', 'Mechatronics Engineering Department', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE name = VALUES(name), faculty_id = VALUES(faculty_id);

-- 3. Majors
INSERT INTO majors (id, department_id, code, name, created_at, updated_at) VALUES
  (1, 1, '7480103', 'Software Engineering', NOW(6), NOW(6)),
  (2, 3, '7480104', 'Information Systems', NOW(6), NOW(6)),
  (3, 4, '7480101', 'Computer Science', NOW(6), NOW(6)),
  (4, 2, '7480102', 'Data Communications and Computer Networks', NOW(6), NOW(6)),
  (5, 1, '7480201', 'Information Technology', NOW(6), NOW(6)),
  (6, 6, '7520216', 'Control Engineering and Automation', NOW(6), NOW(6)),
  (7, 7, '7520114', 'Mechatronics Engineering', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE name = VALUES(name), department_id = VALUES(department_id);

-- 4. Cohorts
INSERT INTO cohorts (id, code, name, admission_year, graduation_year, created_at, updated_at) VALUES
  (1, 'K21', 'Cohort 2021 - 2025 (Graduation Thesis)', 2021, 2025, NOW(6), NOW(6)),
  (2, 'K22', 'Cohort 2022 - 2026 (Capstone Project)', 2022, 2026, NOW(6), NOW(6)),
  (3, 'K23', 'Cohort 2023 - 2027 (Pre-Capstone)', 2023, 2027, NOW(6), NOW(6)),
  (4, 'K20', 'Cohort 2020 - 2024 (Alumni / Graduated)', 2020, 2024, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE name = VALUES(name), admission_year = VALUES(admission_year), graduation_year = VALUES(graduation_year);
