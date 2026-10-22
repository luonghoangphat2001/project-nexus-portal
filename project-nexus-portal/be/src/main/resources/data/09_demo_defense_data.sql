-- ==========================================================
-- 09_demo_defense_data.sql: Hands-on data for Modules 11-13
-- Applies to the open K21 registration period (period 1).
-- Demo passwords use the same BCrypt hash as the other local seed accounts.
-- ==========================================================

-- 1. Six students form three two-member teams; one additional student stays free
--    so team invitations and joining can be demonstrated too.
INSERT INTO users (id, username, email, password, full_name, student_code, cohort_id, major_id,
                   phone, avatar_url, is_active, created_at, updated_at) VALUES
  (50, 'demo_student_01', 'demo.student01@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Nguyễn Minh An (Demo Alpha Leader)', '21110101', 1, 1, '0901010101', 'https://ui-avatars.com/api/?name=Minh+An', 1, NOW(6), NOW(6)),
  (51, 'demo_student_02', 'demo.student02@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Trần Gia Bảo (Demo Alpha Member)', '21110102', 1, 1, '0901010102', 'https://ui-avatars.com/api/?name=Gia+Bao', 1, NOW(6), NOW(6)),
  (52, 'demo_student_03', 'demo.student03@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Lê Ngọc Hà (Demo Beta Leader)', '21110103', 1, 1, '0901010103', 'https://ui-avatars.com/api/?name=Ngoc+Ha', 1, NOW(6), NOW(6)),
  (53, 'demo_student_04', 'demo.student04@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Phạm Tuấn Kiệt (Demo Beta Member)', '21110104', 1, 1, '0901010104', 'https://ui-avatars.com/api/?name=Tuan+Kiet', 1, NOW(6), NOW(6)),
  (54, 'demo_student_05', 'demo.student05@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Võ Khánh Linh (Demo Gamma Leader)', '21110105', 1, 1, '0901010105', 'https://ui-avatars.com/api/?name=Khanh+Linh', 1, NOW(6), NOW(6)),
  (55, 'demo_student_06', 'demo.student06@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Đặng Hoàng Phúc (Demo Gamma Member)', '21110106', 1, 1, '0901010106', 'https://ui-avatars.com/api/?name=Hoang+Phuc', 1, NOW(6), NOW(6)),
  (56, 'demo_student_07', 'demo.student07@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Bùi Hải Đăng (Demo Student without a team)', '21110107', 1, 1, '0901010107', 'https://ui-avatars.com/api/?name=Hai+Dang', 1, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
  username = VALUES(username), email = VALUES(email), full_name = VALUES(full_name),
  student_code = VALUES(student_code), cohort_id = VALUES(cohort_id), major_id = VALUES(major_id),
  is_active = VALUES(is_active), updated_at = NOW(6);

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT id, 5 FROM users WHERE username IN
  ('demo_student_01', 'demo_student_02', 'demo_student_03', 'demo_student_04', 'demo_student_05', 'demo_student_06', 'demo_student_07');
INSERT IGNORE INTO user_faculties (user_id, faculty_id)
SELECT id, 1 FROM users WHERE username IN
  ('demo_student_01', 'demo_student_02', 'demo_student_03', 'demo_student_04', 'demo_student_05', 'demo_student_06', 'demo_student_07');
INSERT IGNORE INTO user_departments (user_id, department_id)
SELECT id, 1 FROM users WHERE username IN
  ('demo_student_01', 'demo_student_02', 'demo_student_03', 'demo_student_04', 'demo_student_05', 'demo_student_06', 'demo_student_07');

-- 2. Demo topics are assigned and closed for registration, while their approved
-- registrations remain eligible for a defense council in the open period.
INSERT INTO topics (id, title, description, objectives, requirements, department_id, period_id,
                    type, max_students, duration, status, is_registration_open, created_at, updated_at) VALUES
  (21, 'Demo: Phân tích dữ liệu học tập', 'Bộ dữ liệu demo cho quy trình hội đồng và chấm điểm.', 'Xây dựng dashboard phân tích tiến độ học tập.', 'React, Spring Boot, SQL.', 1, 1, 'GRADUATION_THESIS', 3, '15 tuần', 'ASSIGNED', 0, NOW(6), NOW(6)),
  (22, 'Demo: Cổng dịch vụ sinh viên', 'Bộ dữ liệu demo cho quy trình hội đồng và chấm điểm.', 'Thiết kế API và giao diện dịch vụ sinh viên.', 'Java, Spring Boot, React.', 1, 1, 'GRADUATION_THESIS', 3, '15 tuần', 'ASSIGNED', 0, NOW(6), NOW(6)),
  (23, 'Demo: Theo dõi chất lượng không khí', 'Bộ dữ liệu demo cho quy trình hội đồng và chấm điểm.', 'Thu thập và trực quan hóa dữ liệu cảm biến.', 'IoT, MQTT, dashboard web.', 1, 1, 'GRADUATION_THESIS', 3, '15 tuần', 'ASSIGNED', 0, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
  title = VALUES(title), description = VALUES(description), objectives = VALUES(objectives),
  requirements = VALUES(requirements), department_id = VALUES(department_id), period_id = VALUES(period_id),
  status = VALUES(status), is_registration_open = VALUES(is_registration_open), updated_at = NOW(6);

INSERT INTO topic_lecturers (topic_id, lecturer_id, advisor_role, created_at, updated_at) VALUES
  (21, 3, 'PRIMARY', NOW(6), NOW(6)),
  (22, 17, 'PRIMARY', NOW(6), NOW(6)),
  (23, 48, 'PRIMARY', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE advisor_role = VALUES(advisor_role), updated_at = NOW(6);
INSERT IGNORE INTO topic_majors (topic_id, major_id) VALUES (21, 1), (22, 1), (23, 1);

-- 3. Approved thesis teams are LOCKED like normal approved registrations.
INSERT INTO teams (id, name, leader_id, period_id, faculty_id, cohort_id, major_id, status, created_at, updated_at) VALUES
  (11, 'Demo Defense Team Alpha', 50, 1, 1, 1, 1, 'LOCKED', NOW(6), NOW(6)),
  (12, 'Demo Defense Team Beta', 52, 1, 1, 1, 1, 'LOCKED', NOW(6), NOW(6)),
  (13, 'Demo Defense Team Gamma', 54, 1, 1, 1, 1, 'LOCKED', NOW(6), NOW(6)),
  (14, 'Demo Team for Joining', 8, 1, 1, 1, 1, 'FORMING', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
  name = VALUES(name), leader_id = VALUES(leader_id), period_id = VALUES(period_id),
  faculty_id = VALUES(faculty_id), cohort_id = VALUES(cohort_id), major_id = VALUES(major_id),
  status = VALUES(status), updated_at = NOW(6);

INSERT IGNORE INTO team_members (team_id, user_id, role_in_team, joined_at, created_at, updated_at) VALUES
  (11, 50, 'LEADER', NOW(), NOW(6), NOW(6)), (11, 51, 'MEMBER', NOW(), NOW(6), NOW(6)),
  (12, 52, 'LEADER', NOW(), NOW(6), NOW(6)), (12, 53, 'MEMBER', NOW(), NOW(6), NOW(6)),
  (13, 54, 'LEADER', NOW(), NOW(6), NOW(6)), (13, 55, 'MEMBER', NOW(), NOW(6), NOW(6)),
  (14, 8, 'LEADER', NOW(), NOW(6), NOW(6));

INSERT INTO topic_registrations (id, topic_id, team_id, message, status, reviewed_by, feedback,
                                registered_at, reviewed_at, created_at, updated_at) VALUES
  (10, 21, 11, 'Demo registration for defense workflow', 'APPROVED', 2, 'Đủ điều kiện bảo vệ demo', NOW(), NOW(), NOW(6), NOW(6)),
  (11, 22, 12, 'Demo registration for defense workflow', 'APPROVED', 2, 'Đủ điều kiện bảo vệ demo', NOW(), NOW(), NOW(6), NOW(6)),
  (12, 23, 13, 'Demo registration for defense workflow', 'APPROVED', 2, 'Đủ điều kiện bảo vệ demo', NOW(), NOW(), NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
  topic_id = VALUES(topic_id), team_id = VALUES(team_id), message = VALUES(message),
  status = VALUES(status), reviewed_by = VALUES(reviewed_by), feedback = VALUES(feedback),
  reviewed_at = VALUES(reviewed_at), updated_at = NOW(6);

-- 4. One scheduled council is ready to grade. Two other approved teams stay
-- unassigned so a manager can practice allocating them or create another council.
INSERT INTO defense_councils (id, name, department_id, period_id, room, starts_at, ends_at, status, created_at, updated_at) VALUES
  (5, 'Hội đồng Demo Module 11–13', 1, 1, 'Phòng Demo A1-101',
   TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), '08:00:00'),
   TIMESTAMP(DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), '11:00:00'), 'SCHEDULED', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
  name = VALUES(name), department_id = VALUES(department_id), period_id = VALUES(period_id),
  room = VALUES(room), starts_at = VALUES(starts_at), ends_at = VALUES(ends_at),
  status = VALUES(status), updated_at = NOW(6);

INSERT INTO defense_council_members (council_id, lecturer_id, member_role, created_at, updated_at) VALUES
  (5, 2, 'CHAIR', NOW(6), NOW(6)),
  (5, 19, 'SECRETARY', NOW(6), NOW(6)),
  (5, 4, 'REVIEWER', NOW(6), NOW(6)),
  (5, 13, 'MEMBER', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE member_role = VALUES(member_role), updated_at = NOW(6);

INSERT INTO defense_assignments (id, council_id, registration_id, created_at, updated_at) VALUES
  (7, 5, 10, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE council_id = VALUES(council_id), registration_id = VALUES(registration_id), updated_at = NOW(6);

-- 5. A small valid one-page PDF fixture enables immediate preview/download.
-- Existing versions are preserved on subsequent boots.
SET @demo_report_pdf = UNHEX('255044462D312E340A312030206F626A0A3C3C202F54797065202F436174616C6F67202F5061676573203220302052203E3E0A656E646F626A0A322030206F626A0A3C3C202F54797065202F5061676573202F4B696473205B33203020525D202F436F756E742031203E3E0A656E646F626A0A332030206F626A0A3C3C202F54797065202F50616765202F506172656E74203220302052202F4D65646961426F78205B30203020353935203834325D202F5265736F7572636573203C3C202F466F6E74203C3C202F4631203420302052203E3E203E3E202F436F6E74656E7473203520302052203E3E0A656E646F626A0A342030206F626A0A3C3C202F54797065202F466F6E74202F53756274797065202F5479706531202F42617365466F6E74202F48656C766574696361203E3E0A656E646F626A0A352030206F626A0A3C3C202F4C656E67746820313033203E3E0A73747265616D0A4254202F46312031362054662035302037383020546420284E6578757320506F7274616C2064656D6F207265706F72742920546A2030202D3330205464202F463120313120546620284D6F64756C65732031312D31332070726163746963652920546A2045540A656E6473747265616D0A656E646F626A0A787265660A3020360A303030303030303030302036353533352066200A30303030303030303039203030303030206E200A30303030303030303538203030303030206E200A30303030303030313135203030303030206E200A30303030303030323431203030303030206E200A30303030303030333131203030303030206E200A747261696C65720A3C3C202F53697A652036202F526F6F74203120302052203E3E0A7374617274787265660A3436340A2525454F460A');
INSERT IGNORE INTO report_documents (id, registration_id, submitted_by, document_type, title, note,
                                     file_name, content_type, file_size, document_version, content, created_at, updated_at) VALUES
  (10, 10, 50, 'REPORT', 'Demo thesis report - Team Alpha', 'Seeded report for Module 11–13 practice.', 'demo-alpha-report.pdf', 'application/pdf', 647, 1, @demo_report_pdf, NOW(6), NOW(6)),
  (11, 11, 52, 'REPORT', 'Demo thesis report - Team Beta', 'Seeded report for Module 11–13 practice.', 'demo-beta-report.pdf', 'application/pdf', 647, 1, @demo_report_pdf, NOW(6), NOW(6)),
  (12, 12, 54, 'REPORT', 'Demo thesis report - Team Gamma', 'Seeded report for Module 11–13 practice.', 'demo-gamma-report.pdf', 'application/pdf', 647, 1, @demo_report_pdf, NOW(6), NOW(6));
