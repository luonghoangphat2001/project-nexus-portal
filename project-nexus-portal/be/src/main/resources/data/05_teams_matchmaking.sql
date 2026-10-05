-- ==========================================================
-- 05_teams_matchmaking.sql: Sample Teams and Matchmaking Collaboration Data
-- ==========================================================

-- 1. Student Team (Created by student id=5 - Lê Anh Tuấn)
INSERT INTO teams (id, name, leader_id, period_id, faculty_id, cohort_id, major_id, status, created_at, updated_at) VALUES
  (2, 'Team Nexus Alpha (3 SV)', 5, 1, 1, 1, 1, 'READY', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Team Members (3 Sinh Viên: Lê Anh Tuấn, Phạm Minh Quân, Võ Hoàng Yến)
INSERT INTO team_members (team_id, user_id, role_in_team, joined_at, created_at, updated_at) VALUES
  (2, 5, 'LEADER', NOW(), NOW(6), NOW(6)),
  (2, 6, 'MEMBER', NOW(), NOW(6), NOW(6)),
  (2, 7, 'MEMBER', NOW(), NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE team_id = VALUES(team_id);

-- 3. Topic Registration for Topic 1
INSERT INTO topic_registrations (id, topic_id, team_id, message, status, registered_at, created_at, updated_at) VALUES
  (1, 1, 2, 'Nhóm 3 sinh viên K21 KTPM đã hoàn thành các môn tiên quyết và xin đăng ký đề tài hướng dẫn.', 'PENDING', NOW(), NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- 4. Matchmaking Posts
DELETE FROM matchmaking_post_skills WHERE post_id IN (1, 2);
DELETE FROM team_join_requests WHERE post_id IN (1, 2);
DELETE FROM matchmaking_posts WHERE id IN (1, 2);

INSERT INTO matchmaking_posts (id, post_type, author_id, team_id, title, goals, department_id, faculty_id, cohort_id, slots_needed, contact_info, status, created_at, updated_at) VALUES
  (1, 'TEAM_LOOKING_FOR_MEMBER', 5, 2, 
   'Team Nexus looking for 1 Fullstack / DevOps member for AI Code Scanner thesis',
   'Aiming for excellent grade on AI and Cloud-native software engineering capstone project.',
   1, 1, 1, 1, 'Email: student@nexus.edu.vn / Phone: 0901000004', 'OPEN', NOW(6), NOW(6));

INSERT INTO matchmaking_post_skills (post_id, skill) VALUES
  (1, 'Spring Boot'),
  (1, 'ReactJS'),
  (1, 'Docker');
