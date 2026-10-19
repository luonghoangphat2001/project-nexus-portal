-- ==========================================================
-- 01_roles.sql: System Roles Seed Data
-- ==========================================================
-- System RBAC roles initialization

INSERT INTO roles (id, name, description)
VALUES 
  (1, 'ROLE_ADMIN', 'Quản trị viên hệ thống'),
  (2, 'ROLE_PRINCIPAL', 'Ban chủ nhiệm / Trưởng bộ môn'),
  (3, 'ROLE_TEACHER', 'Giảng viên hướng dẫn'),
  (4, 'ROLE_COUNCIL', 'Thành viên hội đồng đánh giá'),
  (5, 'ROLE_USER', 'Sinh viên')
ON DUPLICATE KEY UPDATE description = VALUES(description);
