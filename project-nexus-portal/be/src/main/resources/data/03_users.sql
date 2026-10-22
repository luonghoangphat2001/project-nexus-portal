-- ==========================================================
-- 03_users.sql: Default User Accounts, Role Mappings & Academic Affiliations
-- ==========================================================

-- 1. Insert or update user accounts (Default password for all: password123)
-- Password BCrypt Hash: $2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS
INSERT INTO users (id, username, email, password, full_name, student_code, cohort_id, major_id, phone, avatar_url, is_active, created_at, updated_at)
VALUES 
  -- Admins
  (1, 'superadmin', 'superadmin@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'System Administrator (Super Admin)', 'ADMIN01', NULL, NULL, '0901000001', 'https://ui-avatars.com/api/?name=Super+Admin&background=6366f1&color=fff', 1, NOW(6), NOW(6)),
  (46, 'admin2', 'admin2@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Nguyen Thanh Hai (System Security Admin)', 'ADMIN02', NULL, NULL, '0901000009', 'https://ui-avatars.com/api/?name=Nguyen+Thanh+Hai&background=4f46e5&color=fff', 1, NOW(6), NOW(6)),

  -- Principals / Department Heads / Deans
  (2, 'principal', 'principal@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', ' Nguyen Van Quan (Dean of FIT)', 'DEAN01', NULL, 1, '0901000002', 'https://ui-avatars.com/api/?name=Nguyen+Van+Quan&background=f59e0b&color=fff', 1, NOW(6), NOW(6)),
  (10, 'dean_fee', 'dean_fee@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Assoc. Prof. Tran Dinh Thong (Dean of FEE)', 'DEAN02', NULL, 6, '0901000010', 'https://ui-avatars.com/api/?name=Tran+Dinh+Thong&background=d97706&color=fff', 1, NOW(6), NOW(6)),
  (11, 'head_cs', 'head_cs@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', ' Le Quang Dung (Head of Computer Science)', 'HEAD01', NULL, 3, '0901000011', 'https://ui-avatars.com/api/?name=Le+Quang+Dung&background=b45309&color=fff', 1, NOW(6), NOW(6)),
  (12, 'head_is', 'head_is@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', ' Vu Thi Mai (Head of Information Systems)', 'HEAD02', NULL, 2, '0901000012', 'https://ui-avatars.com/api/?name=Vu+Thi+Mai&background=92400e&color=fff', 1, NOW(6), NOW(6)),

  -- Teachers / Thesis Advisors
  (3, 'teacher', 'teacher@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'MSc. Tran Hoang Nam (Advisor Lecturer - SE)', 'LECT01', NULL, 1, '0901000003', 'https://ui-avatars.com/api/?name=Tran+Hoang+Nam&background=3b82f6&color=fff', 1, NOW(6), NOW(6)),
  (13, 'teacher2', 'teacher2@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', ' Hoang Minh Tri (Advisor Lecturer - SE)', 'LECT02', NULL, 1, '0901000013', 'https://ui-avatars.com/api/?name=Hoang+Minh+Tri&background=2563eb&color=fff', 1, NOW(6), NOW(6)),
  (14, 'teacher3', 'teacher3@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Assoc. Prof. Do Thi Thu Ha (Advisor - Networks)', 'LECT03', NULL, 4, '0901000014', 'https://ui-avatars.com/api/?name=Do+Thi+Thu+Ha&background=1d4ed8&color=fff', 1, NOW(6), NOW(6)),
  (15, 'teacher4', 'teacher4@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', ' Nguyen Thanh Son (Advisor - AI / CS)', 'LECT04', NULL, 3, '0901000015', 'https://ui-avatars.com/api/?name=Nguyen+Thanh+Son&background=1e40af&color=fff', 1, NOW(6), NOW(6)),
  (16, 'teacher5', 'teacher5@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'MSc. Le Van Binh (Advisor - Information Systems)', 'LECT05', NULL, 2, '0901000016', 'https://ui-avatars.com/api/?name=Le+Van+Binh&background=0284c7&color=fff', 1, NOW(6), NOW(6)),
  (17, 'teacher6', 'teacher6@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', ' Bui Quoc Thai (Advisor - Architecture)', 'LECT06', NULL, 1, '0901000017', 'https://ui-avatars.com/api/?name=Bui+Quoc+Thai&background=0369a1&color=fff', 1, NOW(6), NOW(6)),

  -- Council Evaluation Members
  (4, 'council', 'council@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Assoc. Prof. Le Hoang Council (Reviewer Member)', 'COUN01', NULL, 1, '0901000005', 'https://ui-avatars.com/api/?name=Council+Member&background=8b5cf6&color=fff', 1, NOW(6), NOW(6)),
  (18, 'council2', 'council2@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', ' Phan Thanh Hai (Senior Council Member)', 'COUN02', NULL, 4, '0901000018', 'https://ui-avatars.com/api/?name=Phan+Thanh+Hai&background=7c3aed&color=fff', 1, NOW(6), NOW(6)),
  (19, 'council3', 'council3@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'MSc. Duong Ngoc Lan (Council Secretary)', 'COUN03', NULL, 2, '0901000019', 'https://ui-avatars.com/api/?name=Duong+Ngoc+Lan&background=6d28d9&color=fff', 1, NOW(6), NOW(6)),
  (20, 'council4', 'council4@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Prof. Vo Duc Minh (Council Chair)', 'COUN04', NULL, 3, '0901000020', 'https://ui-avatars.com/api/?name=Vo+Duc+Minh&background=5b21b6&color=fff', 1, NOW(6), NOW(6)),
  (21, 'council5', 'council5@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', ' Huynh Tan Dat (Council Reviewer - Networks)', 'COUN05', NULL, 4, '0901000021', 'https://ui-avatars.com/api/?name=Huynh+Tan+Dat&background=4c1d95&color=fff', 1, NOW(6), NOW(6)),

  -- Students - Team Nexus Alpha (Team 2)
  (5, 'student', 'student@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Le Anh Tuan (Leader - Team Nexus Alpha)', '21110001', 1, 1, '0901000004', 'https://ui-avatars.com/api/?name=Le+Anh+Tuan&background=10b981&color=fff', 1, NOW(6), NOW(6)),
  (6, 'student2', 'student2@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Pham Minh Quan (Member - Team Nexus Alpha)', '21110002', 1, 1, '0901000006', 'https://ui-avatars.com/api/?name=Pham+Minh+Quan&background=06b6d4&color=fff', 1, NOW(6), NOW(6)),
  (7, 'student3', 'student3@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Vo Hoang Yen (Member - Team Nexus Alpha)', '21110003', 1, 1, '0901000007', 'https://ui-avatars.com/api/?name=Vo+Hoang+Yen&background=ec4899&color=fff', 1, NOW(6), NOW(6)),

  -- Solo Student
  (8, 'individual_user', 'individual_user@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Nguyen Van Nam (Individual Student Looking For Team)', '21110004', 1, 1, '0901000008', 'https://ui-avatars.com/api/?name=Nguyen+Van+Nam&background=059669&color=fff', 1, NOW(6), NOW(6)),

  -- Additional Students (K21 - Thesis Cohort)
  (22, 'student_k21_01', 'hau.dv@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Doan Van Hau (Leader - Team Vision AI)', '21110005', 1, 1, '0901000022', 'https://ui-avatars.com/api/?name=Doan+Van+Hau&background=059669&color=fff', 1, NOW(6), NOW(6)),
  (23, 'student_k21_02', 'hai.nq@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Nguyen Quang Hai (Member - Team Vision AI)', '21110006', 1, 1, '0901000023', 'https://ui-avatars.com/api/?name=Nguyen+Quang+Hai&background=10b981&color=fff', 1, NOW(6), NOW(6)),
  (24, 'student_k21_03', 'linh.nt@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Nguyen Tien Linh (Member - Team Vision AI)', '21110007', 1, 1, '0901000024', 'https://ui-avatars.com/api/?name=Nguyen+Tien+Linh&background=34d399&color=fff', 1, NOW(6), NOW(6)),
  (25, 'student_k21_04', 'dung.bt@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Bui Tien Dung (Leader - Team CloudOps)', '21110008', 1, 4, '0901000025', 'https://ui-avatars.com/api/?name=Bui+Tien+Dung&background=0284c7&color=fff', 1, NOW(6), NOW(6)),
  (26, 'student_k21_05', 'phuong.nc@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Nguyen Cong Phuong (Member - Team CloudOps)', '21110009', 1, 4, '0901000026', 'https://ui-avatars.com/api/?name=Nguyen+Cong+Phuong&background=06b6d4&color=fff', 1, NOW(6), NOW(6)),
  (27, 'student_k21_06', 'truong.lx@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Luong Xuan Truong (Member - Team CloudOps)', '21110010', 1, 4, '0901000027', 'https://ui-avatars.com/api/?name=Luong+Xuan+Truong&background=38bdf8&color=fff', 1, NOW(6), NOW(6)),
  (28, 'student_k21_07', 'anh.nt@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Nguyen Tuan Anh (Leader - Team FinTech)', '21110011', 1, 2, '0901000028', 'https://ui-avatars.com/api/?name=Nguyen+Tuan+Anh&background=8b5cf6&color=fff', 1, NOW(6), NOW(6)),
  (29, 'student_k21_08', 'thanh.vv@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Vu Van Thanh (Member - Team FinTech)', '21110012', 1, 2, '0901000029', 'https://ui-avatars.com/api/?name=Vu+Van+Thanh&background=a855f7&color=fff', 1, NOW(6), NOW(6)),
  (30, 'student_k21_09', 'duy.np@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Nguyen Phong Hong Duy (Member - Team FinTech)', '21110013', 1, 2, '0901000030', 'https://ui-avatars.com/api/?name=Nguyen+Phong+Hong+Duy&background=c084fc&color=fff', 1, NOW(6), NOW(6)),
  (31, 'student_k21_10', 'hai.qn@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Que Ngoc Hai (Leader - Team CyberSec)', '21110014', 1, 3, '0901000031', 'https://ui-avatars.com/api/?name=Que+Ngoc+Hai&background=f43f5e&color=fff', 1, NOW(6), NOW(6)),
  (32, 'student_k21_11', 'trong.td@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Tran Dinh Trong (Member - Team CyberSec)', '21110015', 1, 3, '0901000032', 'https://ui-avatars.com/api/?name=Tran+Dinh+Trong&background=fb7185&color=fff', 1, NOW(6), NOW(6)),
  (33, 'student_k21_12', 'manh.dd@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Do Duy Manh (Member - Team CyberSec)', '21110016', 1, 3, '0901000033', 'https://ui-avatars.com/api/?name=Do+Duy+Manh&background=fda4af&color=fff', 1, NOW(6), NOW(6)),
  (34, 'student_k21_13', 'lam.dv@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Dang Van Lam (Leader - Team Robotics)', '21110017', 1, 6, '0901000034', 'https://ui-avatars.com/api/?name=Dang+Van+Lam&background=eab308&color=fff', 1, NOW(6), NOW(6)),
  (35, 'student_k21_14', 'tai.ht@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Ho Tan Tai (Member - Team Robotics)', '21110018', 1, 6, '0901000035', 'https://ui-avatars.com/api/?name=Ho+Tan+Tai&background=facc15&color=fff', 1, NOW(6), NOW(6)),
  (36, 'student_k21_15', 'duc.pv@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Phan Van Duc (Leader - Team Mobile Innovators)', '21110019', 1, 6, '0901000036', 'https://ui-avatars.com/api/?name=Phan+Van+Duc&background=14b8a6&color=fff', 1, NOW(6), NOW(6)),
  (37, 'student_k21_16', 'toan.nv@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Nguyen Van Toan (Member - Team Mobile Innovators)', '21110020', 1, 6, '0901000037', 'https://ui-avatars.com/api/?name=Nguyen+Van+Toan&background=2dd4bf&color=fff', 1, NOW(6), NOW(6)),
  (38, 'student_k21_17', 'chinh.hd@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Ha Duc Chinh (Leader - Team Data Dynamics)', '21110021', 1, 7, '0901000038', 'https://ui-avatars.com/api/?name=Ha+Duc+Chinh&background=f97316&color=fff', 1, NOW(6), NOW(6)),
  (39, 'student_k21_18', 'chien.nd@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Nguyen Duc Chien (Member - Team Data Dynamics)', '21110022', 1, 7, '0901000039', 'https://ui-avatars.com/api/?name=Nguyen+Duc+Chien&background=fb923c&color=fff', 1, NOW(6), NOW(6)),
  (40, 'student_k21_19', 'hai.pt@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Pham Tuan Hai (Member - Team Data Dynamics)', '21110023', 1, 5, '0901000040', 'https://ui-avatars.com/api/?name=Pham+Tuan+Hai&background=fdba74&color=fff', 1, NOW(6), NOW(6)),
  (41, 'student_k21_20', 'duc.nh@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Nguyen Hoang Duc (Solo Student Seeking Team)', '21110024', 1, 5, '0901000041', 'https://ui-avatars.com/api/?name=Nguyen+Hoang+Duc&background=64748b&color=fff', 1, NOW(6), NOW(6)),

  -- Junior Students (K22 - Capstone Project Cohort)
  (42, 'student_k22_01', 'khang.kv@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Khuat Van Khang (Leader - Team NextGen K22)', '22110001', 2, 1, '0901000042', 'https://ui-avatars.com/api/?name=Khuat+Van+Khang&background=0ea5e9&color=fff', 1, NOW(6), NOW(6)),
  (43, 'student_k22_02', 'truong.nv@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Nguyen Van Truong (Member - Team NextGen K22)', '22110002', 2, 1, '0901000043', 'https://ui-avatars.com/api/?name=Nguyen+Van+Truong&background=38bdf8&color=fff', 1, NOW(6), NOW(6)),
  (44, 'student_k22_03', 'son.nt@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Nguyen Thai Son (Solo K22 Student)', '22110003', 2, 3, '0901000044', 'https://ui-avatars.com/api/?name=Nguyen+Thai+Son&background=7dd3fc&color=fff', 1, NOW(6), NOW(6)),
  (45, 'student_k22_04', 'tai.pt@nexus.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Phan Tuan Tai (Solo K22 Student)', '22110004', 2, 2, '0901000045', 'https://ui-avatars.com/api/?name=Phan+Tuan+Tai&background=bae6fd&color=fff', 1, NOW(6), NOW(6)),

  -- New Users with Real Test Emails
  (47, 'hoangpn2004', 'hoangpn2004@gmail.com', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'Pham Nhat Hoang (Student Leader K22)', '22119901', 2, 1, '0901000047', 'https://ui-avatars.com/api/?name=Pham+Nhat+Hoang&background=3b82f6&color=fff', 1, NOW(6), NOW(6)),
  (48, 'phamnhathoang', '1st.phamnhathoang@gmail.com', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'MSc. Pham Nhat Hoang (Advisor Lecturer)', 'LECT99', NULL, 1, '0901000048', 'https://ui-avatars.com/api/?name=Pham+Nhat+Hoang&background=10b981&color=fff', 1, NOW(6), NOW(6)),
  (49, 'hcmute_25810188', '25810188@student.hcmute.edu.vn', '$2a$10$mqOEWL36ye2QnsBKHuZYxecktptwsNxJ0e2ooJrCNdIuklI/mgvyS', 'HCMUTE Student (25810188)', '25810188', 1, 1, '0901000049', 'https://ui-avatars.com/api/?name=HCMUTE+Student&background=6366f1&color=fff', 1, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE 
  email = VALUES(email),
  password = VALUES(password),
  is_active = VALUES(is_active),
  full_name = VALUES(full_name),
  student_code = VALUES(student_code),
  cohort_id = VALUES(cohort_id),
  major_id = VALUES(major_id),
  phone = VALUES(phone),
  avatar_url = VALUES(avatar_url),
  updated_at = NOW(6);

-- 2. Associate users with their respective roles
DELETE FROM user_roles WHERE user_id BETWEEN 1 AND 50;

-- Admins (ROLE_ADMIN = 1)
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, 1 FROM users u WHERE u.username IN ('superadmin', 'admin2');

-- Principals (ROLE_PRINCIPAL = 2)
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, 2 FROM users u WHERE u.username IN ('principal', 'dean_fee', 'head_cs', 'head_is');

-- Teachers (ROLE_TEACHER = 3)
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, 3 FROM users u WHERE u.username IN ('teacher', 'teacher2', 'teacher3', 'teacher4', 'teacher5', 'teacher6', 'phamnhathoang');

-- Council Members (ROLE_COUNCIL = 4)
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, 4 FROM users u WHERE u.username IN ('council', 'council2', 'council3', 'council4', 'council5');

-- Students (ROLE_USER = 5)
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, 5 FROM users u WHERE u.username IN (
  'student', 'student2', 'student3', 'individual_user',
  'student_k21_01', 'student_k21_02', 'student_k21_03', 'student_k21_04', 'student_k21_05',
  'student_k21_06', 'student_k21_07', 'student_k21_08', 'student_k21_09', 'student_k21_10',
  'student_k21_11', 'student_k21_12', 'student_k21_13', 'student_k21_14', 'student_k21_15',
  'student_k21_16', 'student_k21_17', 'student_k21_18', 'student_k21_19', 'student_k21_20',
  'student_k22_01', 'student_k22_02', 'student_k22_03', 'student_k22_04',
  'hoangpn2004', 'hcmute_25810188'
);

-- 3. Associate users with academic faculties
DELETE FROM user_faculties WHERE user_id BETWEEN 1 AND 50;

-- Faculty of IT (id=1): superadmin, principal, FIT teachers, councils, and FIT students
INSERT IGNORE INTO user_faculties (user_id, faculty_id)
SELECT id, 1 FROM users WHERE id IN (
  1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49
);

-- Faculty of Electrical and Electronics (id=2): dean_fee and FEE students
INSERT IGNORE INTO user_faculties (user_id, faculty_id)
SELECT id, 2 FROM users WHERE id IN (10, 34, 35, 36, 37);

-- Faculty of Mechanical Engineering (id=3): FME students
INSERT IGNORE INTO user_faculties (user_id, faculty_id)
SELECT id, 3 FROM users WHERE id IN (38, 39);

-- 4. Associate users with academic departments
DELETE FROM user_departments WHERE user_id BETWEEN 1 AND 50;
INSERT IGNORE INTO user_departments (user_id, department_id)
VALUES 
  -- Software Engineering (id=1)
  (2, 1), (3, 1), (4, 1), (13, 1), (17, 1),
  (5, 1), (6, 1), (7, 1), (8, 1), (22, 1), (23, 1), (24, 1), (42, 1), (43, 1),
  (47, 1), (48, 1), (49, 1),

  -- Computer Networks (id=2)
  (14, 2), (21, 2), (31, 2), (32, 2), (33, 2),

  -- Information Systems (id=3)
  (4, 3), (12, 3), (16, 3), (19, 3), (28, 3), (29, 3), (30, 3), (45, 3),

  -- Computer Science (id=4)
  (11, 4), (15, 4), (18, 4), (20, 4), (25, 4), (26, 4), (27, 4), (44, 4),

  -- Electronic Engineering (id=5)
  (10, 5), (34, 5), (35, 5),

  -- Automation & Control (id=6)
  (36, 6), (37, 6),

  -- Mechatronics (id=7)
  (38, 7), (39, 7);

-- 5. Associate teachers with majors and cohorts
DELETE FROM user_majors WHERE user_id BETWEEN 1 AND 50;
INSERT IGNORE INTO user_majors (user_id, major_id)
VALUES 
  (3, 1), (3, 2),   -- Teacher advises SE and IS
  (4, 1), (4, 2), (4, 3), -- Council member evaluates SE, IS, CS
  (13, 1), (13, 5), -- Teacher2 advises SE and IT
  (14, 4), (14, 5), -- Teacher3 advises Networks and IT
  (15, 3), (15, 1), -- Teacher4 advises CS and SE
  (16, 2), (16, 1), -- Teacher5 advises IS and SE
  (17, 1), (17, 3), -- Teacher6 advises SE and CS
  (18, 3), (18, 1), -- Council2 evaluates CS and SE
  (19, 2), (19, 1), -- Council3 evaluates IS and SE
  (20, 3), (20, 4), -- Council4 evaluates CS and Networks
  (21, 4), (21, 2), -- Council5 evaluates Networks and IS
  (48, 1), (48, 2); -- Teacher phamnhathoang advises SE and IS

DELETE FROM user_cohorts WHERE user_id BETWEEN 1 AND 50;
INSERT IGNORE INTO user_cohorts (user_id, cohort_id)
VALUES 
  (3, 1), (3, 2),
  (4, 1), (4, 2),
  (13, 1), (13, 2),
  (14, 1), (14, 2),
  (15, 1), (15, 2),
  (48, 1), (48, 2),
  (16, 1), (16, 2),
  (17, 1), (17, 2),
  (18, 1), (18, 2),
  (19, 1), (19, 2),
  (20, 1), (20, 2),
  (21, 1), (21, 2);
