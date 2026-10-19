-- ==========================================================
-- 02_academic_data.sql: Master Academic Classification Data
-- ==========================================================

-- 1. Faculties
INSERT INTO faculties (id, code, name, created_at, updated_at) VALUES
  (1, 'FIT', 'Khoa Công nghệ Thông tin', NOW(6), NOW(6)),
  (2, 'FEE', 'Khoa Điện - Điện tử', NOW(6), NOW(6)),
  (3, 'FME', 'Khoa Cơ khí Chế tạo máy', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Departments
INSERT INTO departments (id, faculty_id, code, name, created_at, updated_at) VALUES
  (1, 1, 'SE', 'Bộ môn Kỹ thuật Phần mềm', NOW(6), NOW(6)),
  (2, 1, 'CN', 'Bộ môn Mạng máy tính', NOW(6), NOW(6)),
  (3, 1, 'IS', 'Bộ môn Hệ thống Thông tin', NOW(6), NOW(6)),
  (4, 1, 'CS', 'Bộ môn Khoa học Máy tính', NOW(6), NOW(6)),
  (5, 2, 'EE', 'Bộ môn Kỹ thuật Điện tử', NOW(6), NOW(6)),
  (6, 2, 'AC', 'Bộ môn Tự động hóa', NOW(6), NOW(6)),
  (7, 3, 'ME', 'Bộ môn Cơ điện tử', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE name = VALUES(name), faculty_id = VALUES(faculty_id);

-- 3. Majors
INSERT INTO majors (id, department_id, code, name, created_at, updated_at) VALUES
  (1, 1, '7480103', 'Kỹ thuật Phần mềm', NOW(6), NOW(6)),
  (2, 3, '7480104', 'Hệ thống Thông tin', NOW(6), NOW(6)),
  (3, 4, '7480101', 'Khoa học Máy tính', NOW(6), NOW(6)),
  (4, 2, '7480102', 'Mạng máy tính & Truyền thông', NOW(6), NOW(6)),
  (5, 1, '7480201', 'Công nghệ Thông tin', NOW(6), NOW(6)),
  (6, 6, '7520216', 'Điều khiển & Tự động hóa', NOW(6), NOW(6)),
  (7, 7, '7520114', 'Kỹ thuật Cơ điện tử', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE name = VALUES(name), department_id = VALUES(department_id);

-- 4. Cohorts
INSERT INTO cohorts (id, code, name, admission_year, graduation_year, created_at, updated_at) VALUES
  (1, 'K21', 'Khóa 2021 (2021 - 2025)', 2021, 2025, NOW(6), NOW(6)),
  (2, 'K22', 'Khóa 2022 (2022 - 2026)', 2022, 2026, NOW(6), NOW(6)),
  (3, 'K23', 'Khóa 2023 (2023 - 2027)', 2023, 2027, NOW(6), NOW(6)),
  (4, 'K20', 'Khóa 2020 (Đã tốt nghiệp)', 2020, 2024, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE name = VALUES(name), admission_year = VALUES(admission_year), graduation_year = VALUES(graduation_year);
