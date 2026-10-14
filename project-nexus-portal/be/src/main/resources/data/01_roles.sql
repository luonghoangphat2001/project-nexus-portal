-- ==========================================================
-- 01_roles.sql: System Roles Seed Data
-- ==========================================================
-- System RBAC roles initialization

INSERT INTO roles (id, name, description)
VALUES 
  (1, 'ROLE_ADMIN', 'System Administrator (Full access to user management, permissions, and system settings)'),
  (2, 'ROLE_PRINCIPAL', 'Faculty Dean / Head of Department (Manages thesis periods, councils, and approval workflows)'),
  (3, 'ROLE_TEACHER', 'Advisor Lecturer (Proposes thesis topics and advises student project teams)'),
  (4, 'ROLE_COUNCIL', 'Evaluation Council Member (Reviews reports and assesses student defenses)'),
  (5, 'ROLE_USER', 'Student (Forms teams, registers topics, and submits project deliverables)')
ON DUPLICATE KEY UPDATE description = VALUES(description);
