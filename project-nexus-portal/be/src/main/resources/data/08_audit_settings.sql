-- ==========================================================
-- 08_audit_settings.sql: System Settings & Security Audit Logs
-- ==========================================================

-- 1. System Settings Configuration
INSERT INTO system_settings (id, category, description, setting_key, setting_value, created_at, updated_at) VALUES
  (1, 'GENERAL', 'Portal title displayed across navigation headers and browser title bar', 'SYSTEM_NAME', 'Nexus Portal - HCMUTE', NOW(6), NOW(6)),
  (2, 'ACADEMIC', 'Active academic semester for capstone and thesis workflows', 'CURRENT_SEMESTER', 'Fall Semester (2026 - 2027)', NOW(6), NOW(6)),
  (3, 'ACADEMIC', 'Minimum number of students required per team', 'MIN_TEAM_MEMBERS', '1', NOW(6), NOW(6)),
  (4, 'ACADEMIC', 'Maximum number of students allowed per team', 'MAX_TEAM_MEMBERS', '3', NOW(6), NOW(6)),
  (5, 'FEATURE', 'Allow students to publish teammate matchmaking requests and browse peers', 'ALLOW_STUDENT_MATCHMAKING', 'true', NOW(6), NOW(6)),
  (6, 'SECURITY', 'Global system maintenance mode switch (restricts non-admin access)', 'MAINTENANCE_MODE', 'false', NOW(6), NOW(6)),
  (7, 'WORKFLOW', 'Automatically approve topic registrations when criteria are met', 'AUTO_APPROVE_TOPIC_REGISTRATION', 'false', NOW(6), NOW(6)),
  (8, 'STORAGE', 'Maximum allowed file size for document and thesis report uploads in Megabytes', 'MAX_REPORT_FILE_SIZE_MB', '10', NOW(6), NOW(6)),
  (9, 'SCORING', 'Weight percentage for reviewer assessment in final grade formula (30%)', 'SCORING_REVIEW_WEIGHT', '0.30', NOW(6), NOW(6)),
  (10, 'SCORING', 'Weight percentage for defense council assessment in final grade formula (70%)', 'SCORING_DEFENSE_WEIGHT', '0.70', NOW(6), NOW(6)),
  (11, 'SCORING', 'Minimum passing score threshold for graduation thesis defense (scale 0-10)', 'PASSING_SCORE_THRESHOLD', '5.00', NOW(6), NOW(6)),
  (12, 'NOTIFICATION', 'Send automated email notifications upon status changes and defense assignments', 'ENABLE_EMAIL_NOTIFICATIONS', 'true', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE 
  setting_value = VALUES(setting_value),
  description = VALUES(description),
  category = VALUES(category),
  updated_at = NOW(6);

-- 2. Security & Compliance Audit Logs
DELETE FROM audit_logs WHERE id BETWEEN 1 AND 100;

INSERT INTO audit_logs (id, user_id, username, action, resource, details, ip_address, user_agent, status, created_at) VALUES
  (1, 1, 'superadmin', 'SYSTEM_INIT', '/system/initialize', 'Initialized database schema and RBAC roles', '127.0.0.1', 'NexusSystem/1.0', 'SUCCESS', NOW(6) - INTERVAL 30 DAY),
  (2, 1, 'superadmin', 'LOGIN_SUCCESS', '/auth/login', 'Admin logged into portal dashboard', '192.168.1.10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 29 DAY),
  (3, 2, 'principal', 'CREATE_PERIOD', '/periods', 'Created Registration Period ID: 1 for K21 FIT', '192.168.1.15', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 28 DAY),
  (4, 2, 'principal', 'BROADCAST_NOTIFICATION', '/notifications', 'Published announcement for KLTN Term 1 kickoff', '192.168.1.15', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 28 DAY),
  (5, 3, 'teacher', 'CREATE_TOPIC', '/topics', 'Proposed Topic ID 1: AI-Powered Code Review', '192.168.1.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'SUCCESS', NOW(6) - INTERVAL 27 DAY),
  (6, 14, 'teacher3', 'CREATE_TOPIC', '/topics', 'Proposed Topic ID 2: Smart Campus IoT Monitoring', '192.168.1.25', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'SUCCESS', NOW(6) - INTERVAL 27 DAY),
  (7, 16, 'teacher5', 'CREATE_TOPIC', '/topics', 'Proposed Topic ID 3: Blockchain Academic Credentials', '192.168.1.28', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 26 DAY),
  (8, 15, 'teacher4', 'CREATE_TOPIC', '/topics', 'Proposed Topic ID 4: LLM Clinical Diagnosis Support', '192.168.1.22', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'SUCCESS', NOW(6) - INTERVAL 26 DAY),
  (9, 5, 'student', 'LOGIN_SUCCESS', '/auth/login', 'Student Le Anh Tuan logged in', '192.168.1.105', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 25 DAY),
  (10, 5, 'student', 'CREATE_TEAM', '/teams', 'Created Team Nexus Alpha (ID: 2)', '192.168.1.105', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 25 DAY),
  (11, 5, 'student', 'INVITE_MEMBER', '/teams/2/invitations', 'Invited student2 (Pham Minh Quan) to Team 2', '192.168.1.105', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 24 DAY),
  (12, 6, 'student2', 'ACCEPT_INVITATION', '/teams/invitations/1/accept', 'Accepted invitation to join Team Nexus Alpha', '192.168.1.106', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'SUCCESS', NOW(6) - INTERVAL 24 DAY),
  (13, 5, 'student', 'INVITE_MEMBER', '/teams/2/invitations', 'Invited student3 (Vo Hoang Yen) to Team 2', '192.168.1.105', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 23 DAY),
  (14, 7, 'student3', 'ACCEPT_INVITATION', '/teams/invitations/2/accept', 'Accepted invitation to join Team Nexus Alpha', '192.168.1.107', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'SUCCESS', NOW(6) - INTERVAL 23 DAY),
  (15, 5, 'student', 'SUBMIT_REGISTRATION', '/registrations', 'Submitted registration application for Topic ID 1', '192.168.1.105', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 22 DAY),
  (16, 3, 'teacher', 'REVIEW_REGISTRATION', '/registrations/1/review', 'Approved topic registration for Team 2 (Status: APPROVED)', '192.168.1.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'SUCCESS', NOW(6) - INTERVAL 21 DAY),
  (17, 8, 'individual_user', 'CREATE_MATCHMAKING', '/matchmaking/posts', 'Created matchmaking post: Solo student seeking team', '192.168.1.110', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 20 DAY),
  (18, 5, 'student', 'CREATE_TASK', '/progress/teams/2/tasks', 'Created Kanban task: System Architecture Design', '192.168.1.105', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 19 DAY),
  (19, 6, 'student2', 'UPDATE_TASK_STATUS', '/progress/tasks/2/status', 'Updated task status to DONE', '192.168.1.106', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'SUCCESS', NOW(6) - INTERVAL 18 DAY),
  (20, 3, 'teacher', 'ADD_TASK_FEEDBACK', '/progress/tasks/2/feedback', 'Added advisor feedback comment on system architecture', '192.168.1.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'SUCCESS', NOW(6) - INTERVAL 17 DAY),
  (21, 5, 'student', 'UPLOAD_DOCUMENT', '/reports/registrations/1/documents', 'Uploaded report document v1: KLTN_AI_CodeScanner_v1.pdf', '192.168.1.105', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 15 DAY),
  (22, 5, 'student', 'UPLOAD_DOCUMENT', '/reports/registrations/1/documents', 'Uploaded updated report document v2: KLTN_AI_CodeScanner_v2.pdf', '192.168.1.105', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 10 DAY),
  (23, 2, 'principal', 'CREATE_COUNCIL', '/councils', 'Established Council 01: SE Defense Council Room A3-201', '192.168.1.15', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 10 DAY),
  (24, 2, 'principal', 'ASSIGN_COUNCIL_TEAM', '/councils/1/assignments', 'Assigned Registration ID 1 to Council 1', '192.168.1.15', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 9 DAY),
  (25, 4, 'council', 'SUBMIT_ASSESSMENT', '/assessments/1/submit', 'Submitted Review Assessment for Student 5 (Score: 8.67)', '192.168.1.40', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 6 DAY),
  (26, 2, 'principal', 'SUBMIT_ASSESSMENT', '/assessments/4/submit', 'Submitted Defense Assessment for Student 5 (Score: 8.50)', '192.168.1.15', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 5 DAY),
  (27, 2, 'principal', 'COMPLETE_COUNCIL', '/councils/1/status', 'Marked Council 1 as COMPLETED', '192.168.1.15', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 5 DAY),
  (28, 2, 'principal', 'CALCULATE_SCORE', '/results/assignments/1', 'Automated weighted grade calculation (30% Review + 70% Defense)', '192.168.1.15', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 4 DAY),
  (29, 2, 'principal', 'PUBLISH_RESULTS', '/results/assignments/1/publish', 'Published official immutable results for Team 2', '192.168.1.15', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 4 DAY),
  (30, 5, 'student', 'VIEW_RESULTS', '/results/me', 'Student queried personal transcript: Final Score 8.43 (PASSED)', '192.168.1.105', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 3 DAY),
  (31, 2, 'principal', 'EXPORT_REPORT', '/results/reports.csv', 'Exported full cohort graduation statistics CSV report', '192.168.1.15', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 2 DAY),
  (32, 1, 'superadmin', 'UPDATE_SETTING', '/system/settings', 'Updated system setting: SCORING_REVIEW_WEIGHT = 0.30', '192.168.1.10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6) - INTERVAL 1 DAY),
  (33, 9, 'admin2', 'SECURITY_AUDIT', '/admin/security', 'Reviewed authentication logs and access tokens', '192.168.1.12', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'SUCCESS', NOW(6)),
  (34, 8, 'individual_user', 'LOGIN_FAILED', '/auth/login', 'Failed login attempt: Invalid credentials entered', '192.168.1.150', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'FAILED', NOW(6) - INTERVAL 12 HOUR),
  (35, 8, 'individual_user', 'LOGIN_SUCCESS', '/auth/login', 'User logged in after password retry', '192.168.1.150', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'SUCCESS', NOW(6) - INTERVAL 12 HOUR);

