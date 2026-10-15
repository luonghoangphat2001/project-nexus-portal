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
  (1, 2, 5, 6, 'INVITE_BY_LEADER', 'ACCEPTED', 'Join Team Nexus Alpha for graduation thesis project', NOW(6), NOW(6)),
  (2, 2, 5, 7, 'INVITE_BY_LEADER', 'ACCEPTED', 'Join Team Nexus Alpha for graduation thesis project', NOW(6), NOW(6)),
  (3, 7, 34, 8, 'INVITE_BY_LEADER', 'PENDING', 'We need a software developer for robot ROS2 backend, join our team!', NOW(6), NOW(6)),
  (4, 8, 36, 41, 'INVITE_BY_LEADER', 'PENDING', 'Looking for an AI engineer to integrate mobile telemedicine models', NOW(6), NOW(6)),
  (5, 10, 42, 44, 'INVITE_BY_LEADER', 'REJECTED', 'Would you like to join K22 Capstone project team?', NOW(6), NOW(6)),
  (6, 4, 8, 25, 'REQUEST_BY_STUDENT', 'REJECTED', 'Hi Team CloudOps, I have strong Docker & k8s skills and want to join', NOW(6), NOW(6));

-- 4. Topic Registrations
INSERT INTO topic_registrations (id, topic_id, team_id, message, status, reviewed_by, feedback, registered_at, reviewed_at, created_at, updated_at) VALUES
  (1, 1, 2, 'Team of 3 K21 Software Engineering students applying for AI Code Scanner thesis topic.', 'APPROVED', 3, 'Approved. Team meets all prerequisites with excellent GPA in SE and Security.', NOW(), NOW(), NOW(6), NOW(6)),
  (2, 4, 3, 'Team Vision AI applying for LLM Clinical Diagnosis Support System topic.', 'APPROVED', 15, 'Approved. Strong foundation in NLP and deep learning coursework.', NOW(), NOW(), NOW(6), NOW(6)),
  (3, 2, 4, 'Team CloudOps Pioneers applying for Smart Campus IoT Monitoring project.', 'APPROVED', 14, 'Approved. High proficiency demonstrated in networking protocols and Linux systems.', NOW(), NOW(), NOW(6), NOW(6)),
  (4, 5, 5, 'Team FinTech Analytics applying for High-Frequency Trading Risk Engine.', 'APPROVED', 16, 'Approved. Good match with financial data modeling curriculum.', NOW(), NOW(), NOW(6), NOW(6)),
  (5, 7, 6, 'Team CyberSec Hunters applying for Zero-Trust Microsegmentation platform.', 'APPROVED', 14, 'Approved. Solid understanding of Linux kernel eBPF and network security.', NOW(), NOW(), NOW(6), NOW(6)),
  (6, 3, 9, 'Team Data Dynamics applying for Decentralized Academic Credential Verification.', 'APPROVED', 16, 'Approved. Ready for smart contract architecture and credential verification.', NOW(), NOW(), NOW(6), NOW(6)),
  (7, 6, 7, 'Team Smart Robotics applying for Autonomous Mobile Robot AMR Navigation.', 'PENDING', NULL, NULL, NOW(), NULL, NOW(6), NOW(6)),
  (8, 9, 8, 'Team Mobile Innovators applying for E-Commerce Microservices Architecture.', 'PENDING', NULL, NULL, NOW(), NULL, NOW(6), NOW(6)),
  (9, 8, 10, 'Team NextGen K22 applying for Real-Time Traffic Congestion Optimization.', 'REJECTED', 15, 'Rejected. Prerequisite Machine Learning course not yet completed by applicants.', NOW(), NOW(), NOW(6), NOW(6))
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
   'Team Smart Robotics looking for 1 ROS2 / C++ embedded software developer',
   'Targeting an innovative robotics capstone with practical warehouse AGV demo and research publication.',
   6, 2, 1, 1, 'Email: lam.dv@nexus.edu.vn / Phone: 0901000034', 'OPEN', NOW(6), NOW(6)),

  (2, 'TEAM_LOOKING_FOR_MEMBER', 36, 8, 
   'Team Mobile Innovators looking for 1 Flutter / React Native mobile engineer',
   'Building cross-platform telemedicine application connected with medical IoT devices.',
   6, 2, 1, 1, 'Email: duc.pv@nexus.edu.vn / Phone: 0901000036', 'OPEN', NOW(6), NOW(6)),

  (3, 'TEAM_LOOKING_FOR_MEMBER', 42, 10, 
   'Team NextGen K22 looking for 1 Backend developer (Spring Boot + MySQL)',
   'Building next-generation microservice web portal for capstone coursework.',
   1, 1, 2, 1, 'Email: khang.kv@nexus.edu.vn / Phone: 0901000042', 'OPEN', NOW(6), NOW(6)),

  (4, 'STUDENT_LOOKING_FOR_TEAM', 8, NULL, 
   'Senior K21 SE student looking for dedicated Graduation Thesis team',
   'Aiming for excellent honors thesis grade in Cloud, DevOps, or Distributed Systems.',
   1, 1, 1, 1, 'Email: individual_user@nexus.edu.vn / Phone: 0901000008', 'OPEN', NOW(6), NOW(6)),

  (5, 'STUDENT_LOOKING_FOR_TEAM', 41, NULL, 
   'K21 student skilled in PyTorch & Computer Vision seeking AI capstone team',
   'Experienced in YOLO, OpenCV, deep learning pipeline, seeking graduation team.',
   4, 1, 1, 1, 'Email: duc.nh@nexus.edu.vn / Phone: 0901000041', 'OPEN', NOW(6), NOW(6)),

  (6, 'STUDENT_LOOKING_FOR_TEAM', 44, NULL, 
   'Junior K22 CS student looking for Capstone Project team (Web & AI)',
   'Passionate about full-stack web and generative AI integration.',
   4, 1, 2, 1, 'Email: son.nt@nexus.edu.vn / Phone: 0901000044', 'OPEN', NOW(6), NOW(6)),

  (7, 'TEAM_LOOKING_FOR_MEMBER', 22, 3, 
   'Team Vision AI looking for Machine Learning researcher (Filled)',
   'Researching RAG LLM clinical decision support.',
   4, 1, 1, 1, 'Email: hau.dv@nexus.edu.vn', 'FILLED', NOW(6), NOW(6)),

  (8, 'STUDENT_LOOKING_FOR_TEAM', 45, NULL, 
   'K22 IS student seeking enterprise systems project team (Closed)',
   'Joined another group.',
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
  (1, 1, 8, 1, 1, 'Hi Team Smart Robotics, I have experience with robotics telemetry and IoT middleware, would love to join!', 'PENDING', NOW(6), NOW(6)),
  (2, 2, 41, 1, 1, 'Hello, I have implemented mobile AI models and can handle mobile integration for telemedicine.', 'PENDING', NOW(6), NOW(6)),
  (3, 3, 44, 1, 2, 'I am in K22 CS with strong Spring Boot and React fundamentals, eager to join your capstone group.', 'PENDING', NOW(6), NOW(6)),
  (4, 7, 24, 1, 1, 'Applied and accepted into Team Vision AI.', 'ACCEPTED', NOW(6), NOW(6)),
  (5, 1, 45, 1, 2, 'Applied to robotics but cohort requirement is K21.', 'REJECTED', NOW(6), NOW(6));
