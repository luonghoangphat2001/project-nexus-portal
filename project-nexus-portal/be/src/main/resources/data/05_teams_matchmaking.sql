-- ==========================================================
-- 05_teams_matchmaking.sql: Teams, Members, Registrations, and Matchmaking
-- ==========================================================

-- 1. Student Teams
INSERT INTO teams (id, name, leader_id, period_id, faculty_id, cohort_id, major_id, status, created_at, updated_at) VALUES
  (2, 'Team Nexus Alpha (3 Students)', 5, 1, 1, 1, 1, 'READY', NOW(6), NOW(6)),
  (3, 'Team Vision AI Labs', 22, 1, 1, 1, 1, 'READY', NOW(6), NOW(6)),
  (4, 'Team CloudOps Pioneers', 25, 1, 1, 1, 4, 'READY', NOW(6), NOW(6)),
  (5, 'Team FinTech Analytics', 28, 1, 1, 1, 2, 'READY', NOW(6), NOW(6)),
  (6, 'Team CyberSec Hunters', 31, 1, 1, 1, 3, 'READY', NOW(6), NOW(6)),
  (7, 'Team Smart Robotics', 34, 1, 2, 1, 6, 'FORMING', NOW(6), NOW(6)),
  (8, 'Team Mobile Innovators', 36, 1, 2, 1, 6, 'FORMING', NOW(6), NOW(6)),
  (9, 'Team Data Dynamics', 38, 1, 3, 1, 7, 'READY', NOW(6), NOW(6)),
  (10, 'Team NextGen K22', 42, 1, 1, 2, 1, 'FORMING', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  leader_id = VALUES(leader_id),
  period_id = VALUES(period_id),
  faculty_id = VALUES(faculty_id),
  cohort_id = VALUES(cohort_id),
  major_id = VALUES(major_id),
  status = VALUES(status),
  updated_at = NOW(6);

-- 2. Team Members
DELETE FROM team_members WHERE team_id BETWEEN 2 AND 10;
INSERT INTO team_members (team_id, user_id, role_in_team, joined_at, created_at, updated_at) VALUES
  -- Team 2 (Nexus Alpha)
  (2, 5, 'LEADER', NOW(), NOW(6), NOW(6)),
  (2, 6, 'MEMBER', NOW(), NOW(6), NOW(6)),
  (2, 7, 'MEMBER', NOW(), NOW(6), NOW(6)),

  -- Team 3 (Vision AI)
  (3, 22, 'LEADER', NOW(), NOW(6), NOW(6)),
  (3, 23, 'MEMBER', NOW(), NOW(6), NOW(6)),
  (3, 24, 'MEMBER', NOW(), NOW(6), NOW(6)),

  -- Team 4 (CloudOps Pioneers)
  (4, 25, 'LEADER', NOW(), NOW(6), NOW(6)),
  (4, 26, 'MEMBER', NOW(), NOW(6), NOW(6)),
  (4, 27, 'MEMBER', NOW(), NOW(6), NOW(6)),

  -- Team 5 (FinTech Analytics)
  (5, 28, 'LEADER', NOW(), NOW(6), NOW(6)),
  (5, 29, 'MEMBER', NOW(), NOW(6), NOW(6)),
  (5, 30, 'MEMBER', NOW(), NOW(6), NOW(6)),

  -- Team 6 (CyberSec Hunters)
  (6, 31, 'LEADER', NOW(), NOW(6), NOW(6)),
  (6, 32, 'MEMBER', NOW(), NOW(6), NOW(6)),
  (6, 33, 'MEMBER', NOW(), NOW(6), NOW(6)),

  -- Team 7 (Smart Robotics - 2 members)
  (7, 34, 'LEADER', NOW(), NOW(6), NOW(6)),
  (7, 35, 'MEMBER', NOW(), NOW(6), NOW(6)),

  -- Team 8 (Mobile Innovators - 2 members)
  (8, 36, 'LEADER', NOW(), NOW(6), NOW(6)),
  (8, 37, 'MEMBER', NOW(), NOW(6), NOW(6)),

  -- Team 9 (Data Dynamics)
  (9, 38, 'LEADER', NOW(), NOW(6), NOW(6)),
  (9, 39, 'MEMBER', NOW(), NOW(6), NOW(6)),
  (9, 40, 'MEMBER', NOW(), NOW(6), NOW(6)),

  -- Team 10 (NextGen K22 - 2 members)
  (10, 42, 'LEADER', NOW(), NOW(6), NOW(6)),
  (10, 43, 'MEMBER', NOW(), NOW(6), NOW(6));

-- 3. Team Invitations (Historical & Active)
DELETE FROM team_invitations WHERE id BETWEEN 1 AND 20;
INSERT INTO team_invitations (id, team_id, inviter_id, invitee_id, type, status, message, created_at, updated_at) VALUES
  (1, 2, 5, 6, 'INVITE_BY_LEADER', 'ACCEPTED', 'Mời vào nhóm làm KLTN', NOW(6), NOW(6)),
  (2, 2, 5, 7, 'INVITE_BY_LEADER', 'ACCEPTED', 'Mời vào nhóm làm KLTN', NOW(6), NOW(6)),
  (3, 7, 34, 8, 'INVITE_BY_LEADER', 'PENDING', 'Mời vào nhóm làm đề tài Robot', NOW(6), NOW(6)),
  (4, 8, 36, 41, 'INVITE_BY_LEADER', 'PENDING', 'Mời vào nhóm làm mảng AI/Mobile', NOW(6), NOW(6)),
  (5, 10, 42, 44, 'INVITE_BY_LEADER', 'REJECTED', 'Mời vào nhóm Đồ án K22', NOW(6), NOW(6)),
  (6, 4, 8, 25, 'REQUEST_BY_STUDENT', 'REJECTED', 'Xin gia nhập nhóm CloudOps', NOW(6), NOW(6));

-- 4. Topic Registrations
INSERT INTO topic_registrations (id, topic_id, team_id, message, status, reviewed_by, feedback, registered_at, reviewed_at, created_at, updated_at) VALUES
  (1, 1, 2, 'Đăng ký đề tài Quét mã nguồn AI', 'APPROVED', 3, 'Đạt yêu cầu', NOW(), NOW(), NOW(6), NOW(6)),
  (2, 4, 3, 'Đăng ký đề tài Chẩn đoán y tế LLM', 'APPROVED', 15, 'Đạt yêu cầu', NOW(), NOW(), NOW(6), NOW(6)),
  (3, 2, 4, 'Đăng ký đề tài Giám sát IoT Campus', 'APPROVED', 14, 'Đạt yêu cầu', NOW(), NOW(), NOW(6), NOW(6)),
  (4, 5, 5, 'Đăng ký đề tài Quản trị FinTech', 'APPROVED', 16, 'Đạt yêu cầu', NOW(), NOW(), NOW(6), NOW(6)),
  (5, 7, 6, 'Đăng ký đề tài Zero-Trust Network', 'APPROVED', 14, 'Đạt yêu cầu', NOW(), NOW(), NOW(6), NOW(6)),
  (6, 3, 9, 'Đăng ký đề tài Xác thực Blockchain', 'APPROVED', 16, 'Đạt yêu cầu', NOW(), NOW(), NOW(6), NOW(6)),
  (7, 6, 7, 'Đăng ký đề tài Robot tự hành AMR', 'PENDING', NULL, NULL, NOW(), NULL, NOW(6), NOW(6)),
  (8, 9, 8, 'Đăng ký đề tài Microservices E-Commerce', 'PENDING', NULL, NULL, NOW(), NULL, NOW(6), NOW(6)),
  (9, 8, 10, 'Đăng ký đề tài Điều tiết giao thông', 'REJECTED', 15, 'Chưa đạt môn tiên quyết', NOW(), NOW(), NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE 
  message = VALUES(message),
  status = VALUES(status),
  reviewed_by = VALUES(reviewed_by),
  feedback = VALUES(feedback),
  reviewed_at = VALUES(reviewed_at),
  updated_at = NOW(6);

-- 5. Matchmaking Collaboration Posts
DELETE FROM matchmaking_post_skills WHERE post_id BETWEEN 1 AND 20;
DELETE FROM team_join_requests WHERE post_id BETWEEN 1 AND 20;
DELETE FROM matchmaking_posts WHERE id BETWEEN 1 AND 20;

INSERT INTO matchmaking_posts (id, post_type, author_id, team_id, title, goals, department_id, faculty_id, cohort_id, slots_needed, contact_info, status, created_at, updated_at) VALUES
  (1, 'TEAM_LOOKING_FOR_MEMBER', 34, 7, 
   'Nhóm Smart Robotics tìm 1 bạn lập trình ROS2 / C++',
   'Thực hiện đề tài robot tự hành AGV nhà kho.',
   6, 2, 1, 1, 'Email: lam.dv@nexus.edu.vn / ĐT: 0901000034', 'OPEN', NOW(6), NOW(6)),

  (2, 'TEAM_LOOKING_FOR_MEMBER', 36, 8, 
   'Nhóm Mobile Innovators tìm 1 bạn Flutter / React Native',
   'Phát triển ứng dụng Telemedicine kết nối IoT y tế.',
   6, 2, 1, 1, 'Email: duc.pv@nexus.edu.vn / ĐT: 0901000036', 'OPEN', NOW(6), NOW(6)),

  (3, 'TEAM_LOOKING_FOR_MEMBER', 42, 10, 
   'Nhóm NextGen K22 tìm 1 bạn Backend Spring Boot',
   'Xây dựng hệ thống web portal dịch vụ vi mô.',
   1, 1, 2, 1, 'Email: khang.kv@nexus.edu.vn / ĐT: 0901000042', 'OPEN', NOW(6), NOW(6)),

  (4, 'STUDENT_LOOKING_FOR_TEAM', 8, NULL, 
   'Sinh viên K21 CNPM tìm nhóm làm KLTN',
   'Mong muốn làm về mảng Cloud, DevOps hoặc Hệ thống phân tán.',
   1, 1, 1, 1, 'Email: individual_user@nexus.edu.vn / ĐT: 0901000008', 'OPEN', NOW(6), NOW(6)),

  (5, 'STUDENT_LOOKING_FOR_TEAM', 41, NULL, 
   'Sinh viên K21 có kỹ năng PyTorch & Computer Vision tìm nhóm AI',
   'Có kinh nghiệm làm YOLO, OpenCV và pipeline Deep Learning.',
   4, 1, 1, 1, 'Email: duc.nh@nexus.edu.vn / ĐT: 0901000041', 'OPEN', NOW(6), NOW(6)),

  (6, 'STUDENT_LOOKING_FOR_TEAM', 44, NULL, 
   'Sinh viên K22 KHMT tìm nhóm Đồ án Tốt nghiệp',
   'Kỹ năng tốt về Full-stack web và Generative AI.',
   4, 1, 2, 1, 'Email: son.nt@nexus.edu.vn / ĐT: 0901000044', 'OPEN', NOW(6), NOW(6)),

  (7, 'TEAM_LOOKING_FOR_MEMBER', 22, 3, 
   'Nhóm Vision AI tìm thành viên nghiên cứu Machine Learning',
   'Nghiên cứu mô hình RAG LLM chẩn đoán y tế.',
   4, 1, 1, 1, 'Email: hau.dv@nexus.edu.vn', 'FILLED', NOW(6), NOW(6)),

  (8, 'STUDENT_LOOKING_FOR_TEAM', 45, NULL, 
   'Sinh viên K22 HTTT tìm nhóm làm hệ thống doanh nghiệp',
   'Đã vào nhóm khác.',
   3, 1, 2, 1, 'Email: tai.pt@nexus.edu.vn', 'CLOSED', NOW(6), NOW(6));

-- 6. Matchmaking Post Skills
INSERT INTO matchmaking_post_skills (post_id, skill) VALUES
  (1, 'ROS2'), (1, 'C++'), (1, 'Gazebo'), (1, 'LiDAR'),
  (2, 'Flutter'), (2, 'React Native'), (2, 'Bluetooth BLE'), (2, 'WebRTC'),
  (3, 'Java'), (3, 'Spring Boot'), (3, 'MySQL'), (3, 'REST API'),
  (4, 'Docker'), (4, 'Spring Boot'), (4, 'ReactJS'), (4, 'Kubernetes'),
  (5, 'Python'), (5, 'PyTorch'), (5, 'Computer Vision'), (5, 'YOLOv10'),
  (6, 'Vue.js'), (6, 'Node.js'), (6, 'Tailwind CSS'), (6, 'PostgreSQL'),
  (7, 'LangChain'), (7, 'Vector DB'), (7, 'Python'),
  (8, 'ERP'), (8, 'SQL'), (8, 'UML');

-- 7. Team Join Requests
INSERT INTO team_join_requests (id, post_id, applicant_id, faculty_id, cohort_id, message, status, created_at, updated_at) VALUES
  (1, 1, 8, 1, 1, 'Mình có kinh nghiệm ROS2 và IoT, muốn xin vào nhóm!', 'PENDING', NOW(6), NOW(6)),
  (2, 2, 41, 1, 1, 'Mình làm được mảng Mobile AI cho Telemedicine, xin vào nhóm!', 'PENDING', NOW(6), NOW(6)),
  (3, 3, 44, 1, 2, 'K22 KHMT nắm vững Spring Boot & React, mong muốn vào nhóm.', 'PENDING', NOW(6), NOW(6)),
  (4, 7, 24, 1, 1, 'Đã nộp đơn và được duyệt vào nhóm Vision AI.', 'ACCEPTED', NOW(6), NOW(6)),
  (5, 1, 45, 1, 2, 'Đăng ký vào nhóm Robot nhưng không khớp khóa K21.', 'REJECTED', NOW(6), NOW(6));
