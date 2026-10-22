-- ==========================================================
-- 07_councils_assessments_results.sql: Councils, Submissions, Assessments & Results
-- ==========================================================

-- 1. Defense Councils
INSERT INTO defense_councils (id, name, department_id, period_id, room, starts_at, ends_at, status, created_at, updated_at) VALUES
  (1, 'Hội đồng 01 - KTPM & ATTT', 
   1, 1, 'Phòng A3-201', '2026-10-10 08:00:00', '2026-10-10 11:30:00', 'COMPLETED', NOW(6) - INTERVAL 10 DAY, NOW(6) - INTERVAL 5 DAY),

  (2, 'Hội đồng 02 - KHMT & AI', 
   4, 1, 'Phòng B2-105', '2026-10-11 08:00:00', '2026-10-11 11:30:00', 'COMPLETED', NOW(6) - INTERVAL 9 DAY, NOW(6) - INTERVAL 4 DAY),

  (3, 'Hội đồng 03 - MMT & IoT', 
   2, 1, 'Phòng Lab B1-304', '2026-11-20 08:00:00', '2026-11-20 11:30:00', 'SCHEDULED', NOW(6) - INTERVAL 3 DAY, NOW(6)),

  (4, 'Hội đồng 04 - HTTT', 
   3, 1, 'Hội trường B', '2026-11-22 13:30:00', '2026-11-22 17:00:00', 'SCHEDULED', NOW(6) - INTERVAL 3 DAY, NOW(6))
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  department_id = VALUES(department_id),
  period_id = VALUES(period_id),
  room = VALUES(room),
  starts_at = VALUES(starts_at),
  ends_at = VALUES(ends_at),
  status = VALUES(status),
  updated_at = NOW(6);

-- 2. Defense Council Members
DELETE FROM defense_council_members WHERE council_id BETWEEN 1 AND 4;
INSERT INTO defense_council_members (council_id, lecturer_id, member_role, created_at, updated_at) VALUES
  -- Council 1
  (1, 2, 'CHAIR', NOW(6), NOW(6)),
  (1, 13, 'SECRETARY', NOW(6), NOW(6)),
  (1, 4, 'REVIEWER', NOW(6), NOW(6)),
  (1, 17, 'MEMBER', NOW(6), NOW(6)),

  -- Council 2
  (2, 11, 'CHAIR', NOW(6), NOW(6)),
  (2, 19, 'SECRETARY', NOW(6), NOW(6)),
  (2, 18, 'REVIEWER', NOW(6), NOW(6)),
  (2, 15, 'MEMBER', NOW(6), NOW(6)),

  -- Council 3
  (3, 10, 'CHAIR', NOW(6), NOW(6)),
  (3, 19, 'SECRETARY', NOW(6), NOW(6)),
  (3, 21, 'REVIEWER', NOW(6), NOW(6)),
  (3, 14, 'MEMBER', NOW(6), NOW(6)),

  -- Council 4
  (4, 20, 'CHAIR', NOW(6), NOW(6)),
  (4, 19, 'SECRETARY', NOW(6), NOW(6)),
  (4, 18, 'REVIEWER', NOW(6), NOW(6)),
  (4, 16, 'MEMBER', NOW(6), NOW(6));

-- 3. Defense Assignments (Linking Approved Registrations to Councils)
INSERT INTO defense_assignments (id, council_id, registration_id, created_at, updated_at) VALUES
  (1, 1, 1, NOW(6) - INTERVAL 12 DAY, NOW(6)), -- Team 2 (Nexus Alpha)
  (2, 2, 2, NOW(6) - INTERVAL 12 DAY, NOW(6)), -- Team 3 (Vision AI)
  (3, 3, 3, NOW(6) - INTERVAL 5 DAY, NOW(6)),  -- Team 4 (CloudOps Pioneers)
  (4, 3, 5, NOW(6) - INTERVAL 5 DAY, NOW(6)),  -- Team 6 (CyberSec Hunters)
  (5, 4, 4, NOW(6) - INTERVAL 5 DAY, NOW(6)),  -- Team 5 (FinTech Analytics)
  (6, 4, 6, NOW(6) - INTERVAL 5 DAY, NOW(6))   -- Team 9 (Data Dynamics)
ON DUPLICATE KEY UPDATE 
  council_id = VALUES(council_id),
  registration_id = VALUES(registration_id),
  updated_at = NOW(6);

-- 4. Report Documents (Sample PDF Documents with Valid Magic Bytes)
-- Magic Bytes %PDF-1.5: 0x255044462D312E350A25E2E3CFD30A312030206F626A0A3C3C202F5469746C6520284B4C544E205265706F727429203E3E0A656E646F626A0A747261696C65720A3C3C202F53697A652031203E3E0A7374617274787265660A35300A2525454F46
DELETE FROM report_documents WHERE id BETWEEN 1 AND 25;
INSERT INTO report_documents (id, registration_id, submitted_by, document_type, title, note, file_name, content_type, file_size, document_version, content, created_at, updated_at) VALUES
  -- Team 2 (Registration 1)
  (1, 1, 5, 'REPORT', 'Báo cáo toàn văn Khóa luận Tốt nghiệp (Bản dự thảo v1)', 
   'Bản nộp đợt 1 bao gồm toàn bộ chương 1 đến chương 4 và kết quả thực nghiệm sơ bộ.',
   'KLTN_AI_CodeScanner_v1.pdf', 'application/pdf', 104, 1,
   UNHEX('255044462D312E350A25E2E3CFD30A312030206F626A0A3C3C202F5469746C6520284B4C544E205265706F727420763129203E3E0A656E646F626A0A747261696C65720A3C3C202F53697A652031203E3E0A7374617274787265660A35300A2525454F46'),
   NOW(6) - INTERVAL 15 DAY, NOW(6) - INTERVAL 15 DAY),

  (2, 1, 5, 'REPORT', 'Báo cáo toàn văn Khóa luận Tốt nghiệp (Bản chính thức v2)', 
   'Cập nhật kết quả benchmark OWASP Benchmark theo góp ý phản biện của GVHD.',
   'KLTN_AI_CodeScanner_v2_Final.pdf', 'application/pdf', 110, 2,
   UNHEX('255044462D312E350A25E2E3CFD30A312030206F626A0A3C3C202F5469746C6520284B4C544E205265706F727420763229203E3E0A656E646F626A0A747261696C65720A3C3C202F53697A652031203E3E0A7374617274787265660A35300A2525454F46'),
   NOW(6) - INTERVAL 10 DAY, NOW(6) - INTERVAL 10 DAY),

  (3, 1, 5, 'SLIDES', 'Slide thuyết trình bảo vệ trước Hội đồng chấm khóa luận', 
   'Slide trình chiếu 25 trang tóm tắt kiến trúc, công nghệ và video demo thực tế.',
   'Slide_BaoVe_TeamNexus.pdf', 'application/pdf', 106, 1,
   UNHEX('255044462D312E350A25E2E3CFD30A312030206F626A0A3C3C202F5469746C652028536C69646520446566656E736529203E3E0A656E646F626A0A747261696C65720A3C3C202F53697A652031203E3E0A7374617274787265660A35300A2525454F46'),
   NOW(6) - INTERVAL 8 DAY, NOW(6) - INTERVAL 8 DAY),

  (4, 1, 5, 'SOURCE_CODE', 'Tài liệu hướng dẫn cài đặt và đường dẫn Source Code GitHub', 
   'Hướng dẫn triển khai Docker Compose, Kubernetes manifests và API documentation.',
   'Deployment_Guide_SourceCode.pdf', 'application/pdf', 112, 1,
   UNHEX('255044462D312E350A25E2E3CFD30A312030206F626A0A3C3C202F5469746C652028536F7572636520436F646520446F6329203E3E0A656E646F626A0A747261696C65720A3C3C202F53697A652031203E3E0A7374617274787265660A35300A2525454F46'),
   NOW(6) - INTERVAL 8 DAY, NOW(6) - INTERVAL 8 DAY),

  -- Team 3 (Registration 2)
  (5, 2, 22, 'REPORT', 'Báo cáo toàn văn KLTN: Hệ thống hỗ trợ chẩn đoán lâm sàng RAG LLM', 
   'Báo cáo 85 trang kèm kết quả đánh giá thử nghiệm mù đôi cùng bác sĩ.',
   'KLTN_VisionAI_ClinicalRAG_v1.pdf', 'application/pdf', 114, 1,
   UNHEX('255044462D312E350A25E2E3CFD30A312030206F626A0A3C3C202F5469746C652028436C696E6963616C2052414729203E3E0A656E646F626A0A747261696C65720A3C3C202F53697A652031203E3E0A7374617274787265660A35300A2525454F46'),
   NOW(6) - INTERVAL 9 DAY, NOW(6) - INTERVAL 9 DAY),

  (6, 2, 22, 'SLIDES', 'Slide trình bày Hội đồng 02 - Trí tuệ nhân tạo', 
   'Bộ slide trực quan hóa cơ chế Semantic Search và Vector Similarity.',
   'Slide_VisionAI_ClinicalLLM.pdf', 'application/pdf', 108, 1,
   UNHEX('255044462D312E350A25E2E3CFD30A312030206F626A0A3C3C202F5469746C652028536C69646520566973696F6E414929203E3E0A656E646F626A0A747261696C65720A3C3C202F53697A652031203E3E0A7374617274787265660A35300A2525454F46'),
   NOW(6) - INTERVAL 8 DAY, NOW(6) - INTERVAL 8 DAY),

  -- Team 4 (Registration 3)
  (7, 3, 25, 'REPORT', 'Báo cáo toàn văn: Hệ thống giám sát môi trường Smart Campus IoT', 
   'Báo cáo kỹ thuật phần cứng ESP32 và server ingestion backend.',
   'KLTN_SmartCampus_IoT_v1.pdf', 'application/pdf', 110, 1,
   UNHEX('255044462D312E350A25E2E3CFD30A312030206F626A0A3C3C202F5469746C652028536D6172742043616D70757329203E3E0A656E646F626A0A747261696C65720A3C3C202F53697A652031203E3E0A7374617274787265660A35300A2525454F46'),
   NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY),

  -- Team 5 (Registration 4)
  (8, 4, 28, 'REPORT', 'Báo cáo đề tài: Engine giao dịch thuật toán và quản trị rủi ro VaR', 
   'Tài liệu đặc tả kiến trúc Order Book matching engine.',
   'KLTN_FinTech_Trading_v1.pdf', 'application/pdf', 110, 1,
   UNHEX('255044462D312E350A25E2E3CFD30A312030206F626A0A3C3C202F5469746C65202846696E546563682054726164696E6729203E3E0A656E646F626A0A747261696C65720A3C3C202F53697A652031203E3E0A7374617274787265660A35300A2525454F46'),
   NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY),

  -- Team 6 (Registration 5)
  (9, 5, 31, 'REPORT', 'Báo cáo: Nền tảng Zero-Trust eBPF giám sát Kubernetes Cluster', 
   'Báo cáo kiến trúc Kernel-space probe và cơ chế cảnh báo thời gian thực.',
   'KLTN_ZeroTrust_eBPF_v1.pdf', 'application/pdf', 110, 1,
   UNHEX('255044462D312E350A25E2E3CFD30A312030206F626A0A3C3C202F5469746C6520285A65726F5472757374206542504629203E3E0A656E646F626A0A747261696C65720A3C3C202F53697A652031203E3E0A7374617274787265660A35300A2525454F46'),
   NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY);

-- 5. Detailed Assessments for Defended Assignments
DELETE FROM assessments WHERE assignment_id BETWEEN 1 AND 6;

-- Assignment 1 (Team 2: students 5, 6, 7)
INSERT INTO assessments (assignment_id, evaluator_id, student_id, assessment_type, status, content_score, implementation_score, presentation_score, strengths, weaknesses, questions, comment, submitted_at, created_at, updated_at) VALUES
  -- Primary Advisor: User 3 (MSc. Tran Hoang Nam)
  (1, 3, 5, 'ADVISOR', 'SUBMITTED', 8.50, 8.50, 8.00,
   'Sinh viên nắm vững kiến trúc Cloud-Native, chủ động nghiên cứu các mô hình AI phát hiện lỗ hổng phần mềm.',
   'Cần trau dồi thêm kỹ năng trình bày bằng tiếng Anh.',
   'Khả năng mở rộng của mô hình khi phân tích các repo mã nguồn lớn?',
   'Sinh viên có thái độ học tập rất nghiêm túc, làm chủ công nghệ phát hiện lỗ hổng phần mềm bằng AI, hoàn thành xuất sắc các mục tiêu đề ra.',
   NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY),

  (1, 3, 6, 'ADVISOR', 'SUBMITTED', 8.50, 8.50, 8.00,
   'Thiết kế giao diện người dùng trực quan, phối hợp nhóm hiệu quả.',
   'Cần tối ưu thời gian phản hồi biểu đồ thống kê.',
   'Các tiêu chí nào được ưu tiên khi xếp hạng độ nghiêm trọng của lỗ hổng?',
   'Thực hiện tốt phần giao diện người dùng và trực quan hóa cảnh báo an toàn, tinh thần làm việc nhóm cao và có trách nhiệm.',
   NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY),

  (1, 3, 7, 'ADVISOR', 'SUBMITTED', 8.50, 8.50, 8.00,
   'Kỹ năng thiết lập hạ tầng Kubernetes và pipeline CI/CD tốt.',
   'Cần bổ sung thêm tài liệu hướng dẫn vận hành khi gặp lỗi node.',
   'Cơ chế rollback tự động hoạt động như thế nào khi bản build quét mã thất bại?',
   'Nắm vững kiến trúc triển khai CI/CD và hạ tầng đám mây, hoàn thành đầy đủ các nhiệm vụ kỹ thuật được phân công.',
   NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY),

  -- Reviewer: User 4 (council)
  (1, 4, 5, 'REVIEW', 'SUBMITTED', 8.50, 9.00, 8.50,
   'Kiến trúc Cloud-Native rất vững vàng, tích hợp AST parser chính xác.',
   'Cần tối ưu hóa chi phí tài nguyên điện toán đám mây.',
   'Cơ chế Auto-scaling xử lý traffic đột biến như thế nào?',
   'Khóa luận đạt chất lượng tốt, đủ điều kiện bảo vệ trước hội đồng.',
   NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY),

  (1, 4, 6, 'REVIEW', 'SUBMITTED', 8.00, 8.50, 8.00,
   'Giao diện Dashboard thiết kế khoa học, trực quan hóa tốt các lỗ hổng.',
   'Cần bổ sung thêm biểu đồ phân bổ thời gian sửa lỗi.',
   'Hệ thống lưu trữ lịch sử các lần scan code ra sao?',
   'Đạt yêu cầu phản biện.',
   NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY),

  (1, 4, 7, 'REVIEW', 'SUBMITTED', 8.00, 8.50, 8.00,
   'Pipeline CI/CD tự động kích hoạt webhook ổn định, tốc độ scan nhanh.',
   'Tài liệu kiểm thử chịu tải cần bổ sung thêm số liệu k6.',
   'Khả năng quét đồng thời bao nhiêu repositories cùng lúc?',
   'Đạt yêu cầu phản biện.',
   NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY),

  -- Defense: Chair User 2 (principal)
  (1, 2, 5, 'DEFENSE', 'SUBMITTED', 8.50, 8.50, 8.50,
   'Trả lời lưu loát các câu hỏi phản biện, nắm rất chắc kỹ thuật.', NULL, NULL,
   'Phong thái tự tin, bảo vệ xuất sắc.',
   NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY),

  (1, 2, 6, 'DEFENSE', 'SUBMITTED', 8.50, 8.50, 8.50,
   'Phần trình bày rõ ràng, demo mượt mà không xảy ra lỗi.', NULL, NULL,
   'Hoàn thành tốt nhiệm vụ.',
   NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY),

  (1, 2, 7, 'DEFENSE', 'SUBMITTED', 8.50, 8.50, 8.50,
   'Nắm vững quy trình đóng gói container và triển khai Kubernetes.', NULL, NULL,
   'Đạt kết quả tốt.',
   NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY),

  -- Defense: Secretary User 13 (teacher2)
  (1, 13, 5, 'DEFENSE', 'SUBMITTED', 8.00, 8.00, 8.00,
   'Tài liệu viết chỉn chu, đúng thể thức báo cáo khoa học.', NULL, NULL,
   'Đạt chuẩn chất lượng.',
   NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY),

  (1, 13, 6, 'DEFENSE', 'SUBMITTED', 8.00, 8.00, 8.00,
   'Thiết kế UI/UX hiện đại, màu sắc hài hòa.', NULL, NULL,
   'Đạt chuẩn chất lượng.',
   NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY),

  (1, 13, 7, 'DEFENSE', 'SUBMITTED', 8.00, 8.00, 8.00,
   'Nội dung kiểm thử đầy đủ ca thành công và biên.', NULL, NULL,
   'Đạt chuẩn chất lượng.',
   NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY),

  -- Defense: Reviewer User 4 (council)
  (1, 4, 5, 'DEFENSE', 'SUBMITTED', 8.50, 8.50, 8.50,
   'Đã tiếp thu và giải trình đầy đủ các nhận xét của phản biện.', NULL, NULL,
   'Bảo vệ thành công.',
   NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY),

  (1, 4, 6, 'DEFENSE', 'SUBMITTED', 8.50, 8.50, 8.50,
   'Demo trực quan, giải thích rõ cơ chế hiển thị CVE.', NULL, NULL,
   'Bảo vệ thành công.',
   NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY),

  (1, 4, 7, 'DEFENSE', 'SUBMITTED', 8.50, 8.50, 8.50,
   'Giải thích mạch lạc cách tối ưu hóa pipeline CI/CD.', NULL, NULL,
   'Bảo vệ thành công.',
   NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY),

  -- Assignment 2 (Team 3: students 22, 23, 24 - Vision AI)
  -- Primary Advisor: User 15 (Nguyen Thanh Son)
  (2, 15, 22, 'ADVISOR', 'SUBMITTED', 9.50, 9.50, 9.50,
   'Năng lực nghiên cứu lý thuyết AI chuyên sâu xuất sắc.', NULL, NULL,
   'Sinh viên có năng lực nghiên cứu khoa học xuất sắc, làm chủ các mô hình LLM chuyên sâu cho y tế, công bố kết quả rất thuyết phục.',
   NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY),

  (2, 15, 23, 'ADVISOR', 'SUBMITTED', 9.20, 9.20, 9.20,
   'Lập trình backend vững vàng, cấu hình vector DB tối ưu.', NULL, NULL,
   'Triển khai xuất sắc module Hybrid Vector Search và tích hợp hệ thống bệnh án điện tử an toàn, tốc độ phản hồi nhanh.',
   NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY),

  (2, 15, 24, 'ADVISOR', 'SUBMITTED', 9.00, 9.00, 9.00,
   'Giao diện bác sĩ chỉn chu, tài liệu báo cáo đầy đủ.', NULL, NULL,
   'Giao diện lâm sàng đạt chuẩn trải nghiệm bác sĩ, báo cáo khóa luận trình bày chỉn chu, đúng quy chuẩn học thuật.',
   NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY),

  -- Reviewer: User 18 (council2)
  (2, 18, 22, 'REVIEW', 'SUBMITTED', 9.50, 9.50, 9.00,
   'Ý tưởng đột phá, kết hợp y khoa và AI chuyên sâu.',
   'Cần xin giấy phép hội đồng đạo đức trước khi ứng dụng thực tế.',
   'Độ nhạy (Sensitivity) trong chẩn đoán ung thư đạt bao nhiêu %?',
   'Đề tài xuất sắc, có tiềm năng công bố bài báo khoa học quốc tế.',
   NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY),

  (2, 18, 23, 'REVIEW', 'SUBMITTED', 9.00, 9.00, 9.00,
   'Cơ chế Hybrid Vector Search phản hồi cực nhanh, độ chính xác cao.',
   'Cần bổ sung tài liệu so sánh giữa Qdrant và Milvus.',
   'Xử lý từ đồng nghĩa trong thuật ngữ y khoa bằng phương pháp nào?',
   'Xuất sắc.',
   NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY),

  (2, 18, 24, 'REVIEW', 'SUBMITTED', 8.50, 9.00, 9.00,
   'Giao diện bác sĩ thiết kế thuận tiện, hiển thị nguồn trích dẫn rõ ràng.',
   'Cần thêm tính năng in tóm tắt bệnh án ra PDF.',
   'Hệ thống hỗ trợ những định dạng bệnh án điện tử nào?',
   'Rất tốt.',
   NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY),

  -- Defense Council 2 for Student 22, 23, 24
  (2, 11, 22, 'DEFENSE', 'SUBMITTED', 9.50, 9.50, 9.50, 'Thuyết trình cuốn hút, làm chủ hoàn toàn công nghệ.', NULL, NULL, 'Thủ khoa đợt bảo vệ.', NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY),
  (2, 11, 23, 'DEFENSE', 'SUBMITTED', 9.00, 9.50, 9.00, 'Nắm vững toán học đằng sau mô hình Embedding.', NULL, NULL, 'Xuất sắc.', NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY),
  (2, 11, 24, 'DEFENSE', 'SUBMITTED', 9.00, 9.00, 9.00, 'Demo mượt mà, trả lời gãy gọn câu hỏi của hội đồng.', NULL, NULL, 'Xuất sắc.', NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY),

  -- Assignment 3 (Team 4: students 25, 26, 27 - Smart Campus IoT)
  -- Primary Advisor: User 14 (Assoc. Prof. Do Thi Thu Ha)
  (3, 14, 25, 'ADVISOR', 'SUBMITTED', 7.80, 7.80, 7.80,
   'Tích cực trong thực nghiệm phần cứng IoT.', NULL, NULL,
   'Sinh viên tích cực trong quá trình thực nghiệm phần cứng, hoàn thành việc thu thập và truyền dữ liệu cảm biến ổn định.',
   NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY),

  (3, 14, 26, 'ADVISOR', 'SUBMITTED', 7.20, 7.20, 7.20,
   'Hoàn thành mạch cảm biến theo thiết kế.', NULL, NULL,
   'Hoàn thành thiết kế mạch cảm biến và nguồn pin dự phòng, có ý thức kỷ luật tốt.',
   NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY),

  (3, 14, 27, 'ADVISOR', 'SUBMITTED', 6.80, 6.80, 6.80,
   'Nỗ lực hoàn thành kết nối dữ liệu time-series.', NULL, NULL,
   'Nỗ lực hoàn thành hệ thống backend lưu trữ time-series và bản đồ quan trắc chất lượng không khí trường học.',
   NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY),

  -- Reviewer: User 21
  (3, 21, 25, 'REVIEW', 'SUBMITTED', 7.50, 7.50, 7.50, 'Mô hình hoạt động ổn định.', 'Cần hoàn thiện thêm vỏ hộp cảm biến.', 'Tần suất gửi dữ liệu có thể điều chỉnh từ xa không?', 'Đạt yêu cầu.', NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY),
  (3, 21, 26, 'REVIEW', 'SUBMITTED', 7.00, 7.00, 7.00, 'Mạch nhúng gọn gàng.', 'Tiêu thụ pin còn cao.', 'Pin dự phòng duy trì được bao lâu?', 'Đạt yêu cầu.', NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY),
  (3, 21, 27, 'REVIEW', 'SUBMITTED', 6.50, 6.50, 6.50, 'Cơ sở dữ liệu time-series lưu trữ tốt.', 'Giao diện còn đơn giản.', 'Xử lý mất mạng offline như thế nào?', 'Đạt yêu cầu.', NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY),

  (3, 10, 25, 'DEFENSE', 'SUBMITTED', 8.00, 7.50, 8.00, 'Trình bày rõ ràng.', NULL, NULL, 'Đạt loại khá.', NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY),
  (3, 10, 26, 'DEFENSE', 'SUBMITTED', 7.50, 7.00, 7.50, 'Hoàn thành khối lượng đề tài.', NULL, NULL, 'Đạt loại khá.', NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY),
  (3, 10, 27, 'DEFENSE', 'SUBMITTED', 7.00, 6.50, 7.00, 'Nỗ lực trong quá trình thực hiện.', NULL, NULL, 'Đạt yêu cầu.', NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY),

  -- Assignment 4 (Team 6: students 31, 32, 33 - Zero-Trust eBPF)
  -- Primary Advisor: User 14 (Assoc. Prof. Do Thi Thu Ha)
  (4, 14, 31, 'ADVISOR', 'SUBMITTED', 4.50, 4.50, 4.50,
   'Chưa hoàn thành khối lượng yêu cầu.', 'Tiến độ rất chậm, vắng nhiều buổi họp hướng dẫn.', NULL,
   'Chưa bám sát kế hoạch hướng dẫn định kỳ, khối lượng thực hiện chưa đáp ứng yêu cầu tối thiểu của một khóa luận tốt nghiệp.',
   NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY),

  -- Reviewer submitted, but Council Defense is still in DRAFT mode for testing interaction!
  (4, 21, 31, 'REVIEW', 'SUBMITTED', 4.00, 4.00, 4.00,
   'Ý tưởng eBPF tốt nhưng chưa hoàn thành được module phát hiện anomaly.',
   'Thiếu phần lớn thực nghiệm và chưa viết xong chương 4.',
   'Tại sao chưa tiến hành kiểm thử trên cụm Kubernetes thật?',
   'Chưa đạt khối lượng tối thiểu để bảo vệ chính thức.',
   NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY),

  (4, 21, 32, 'REVIEW', 'DRAFT', 7.00, 7.50, 7.00,
   'Module trực quan hóa làm tốt.', 'Cần ghép nối với backend kernel.', NULL,
   'Đang chấm điểm dự thảo.',
   NULL, NOW(6) - INTERVAL 2 DAY, NOW(6) - INTERVAL 2 DAY),

  (4, 21, 33, 'REVIEW', 'DRAFT', 7.00, 7.00, 7.00,
   'Tài liệu viết rõ ràng.', 'Cần bổ sung kết quả scan.', NULL,
   'Đang chấm điểm dự thảo.',
   NULL, NOW(6) - INTERVAL 2 DAY, NOW(6) - INTERVAL 2 DAY);

-- 6. Official Published Results (Immutable Snapshots for Completed Defenses)
DELETE FROM published_results WHERE assignment_id BETWEEN 1 AND 6;

INSERT INTO published_results (assignment_id, student_id, review_score, defense_score, final_score, passed, published_by, published_at, created_at, updated_at) VALUES
  -- Assignment 1 (Team 2: Nexus Alpha)
  (1, 5, 8.67, 8.33, 8.43, 1, 2, NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY),
  (1, 6, 8.17, 8.33, 8.28, 1, 2, NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY),
  (1, 7, 8.17, 8.33, 8.28, 1, 2, NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY),

  -- Assignment 2 (Team 3: Vision AI Labs)
  (2, 22, 9.30, 9.50, 9.44, 1, 2, NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY),
  (2, 23, 9.00, 9.20, 9.14, 1, 2, NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY),
  (2, 24, 8.80, 9.00, 8.94, 1, 2, NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY),

  -- Assignment 3 (Team 4: CloudOps Pioneers)
  (3, 25, 7.50, 7.80, 7.71, 1, 2, NOW(6) - INTERVAL 2 DAY, NOW(6) - INTERVAL 2 DAY, NOW(6) - INTERVAL 2 DAY),
  (3, 26, 7.00, 7.20, 7.14, 1, 2, NOW(6) - INTERVAL 2 DAY, NOW(6) - INTERVAL 2 DAY, NOW(6) - INTERVAL 2 DAY),
  (3, 27, 6.50, 6.80, 6.71, 1, 2, NOW(6) - INTERVAL 2 DAY, NOW(6) - INTERVAL 2 DAY, NOW(6) - INTERVAL 2 DAY),

  -- Failed Example for Real Histogram / Distribution Testing
  (4, 31, 4.00, 4.50, 4.35, 0, 2, NOW(6) - INTERVAL 1 DAY, NOW(6) - INTERVAL 1 DAY, NOW(6) - INTERVAL 1 DAY);

-- 7. Snapshot Details for Published Results
INSERT INTO published_result_details (
  result_id, advisor_name,
  advisor_content_score, advisor_implementation_score, advisor_presentation_score,
  review_content_score, review_implementation_score, review_presentation_score,
  defense_content_score, defense_implementation_score, defense_presentation_score,
  advisor_comment, review_comment, defense_comments
)
SELECT
  pr.id,
  CASE
    WHEN pr.student_id IN (5, 6, 7) THEN 'MSc. Tran Hoang Nam'
    WHEN pr.student_id IN (22, 23, 24) THEN 'Nguyen Thanh Son'
    ELSE 'Assoc. Prof. Do Thi Thu Ha'
  END,
  CASE pr.student_id
    WHEN 5 THEN 8.50 WHEN 6 THEN 8.50 WHEN 7 THEN 8.50
    WHEN 22 THEN 9.50 WHEN 23 THEN 9.20 WHEN 24 THEN 9.00
    WHEN 25 THEN 7.80 WHEN 26 THEN 7.20 WHEN 27 THEN 6.80
    ELSE 4.50
  END,
  CASE pr.student_id
    WHEN 5 THEN 8.50 WHEN 6 THEN 8.50 WHEN 7 THEN 8.50
    WHEN 22 THEN 9.50 WHEN 23 THEN 9.20 WHEN 24 THEN 9.00
    WHEN 25 THEN 7.80 WHEN 26 THEN 7.20 WHEN 27 THEN 6.80
    ELSE 4.50
  END,
  CASE pr.student_id
    WHEN 5 THEN 8.00 WHEN 6 THEN 8.00 WHEN 7 THEN 8.00
    WHEN 22 THEN 9.50 WHEN 23 THEN 9.20 WHEN 24 THEN 9.00
    WHEN 25 THEN 7.80 WHEN 26 THEN 7.20 WHEN 27 THEN 6.80
    ELSE 4.50
  END,
  -- Review criteria
  CASE pr.student_id
    WHEN 5 THEN 8.50 WHEN 6 THEN 8.00 WHEN 7 THEN 8.00
    WHEN 22 THEN 9.50 WHEN 23 THEN 9.00 WHEN 24 THEN 8.50
    WHEN 25 THEN 7.50 WHEN 26 THEN 7.00 WHEN 27 THEN 6.50
    ELSE 4.00
  END,
  CASE pr.student_id
    WHEN 5 THEN 9.00 WHEN 6 THEN 8.50 WHEN 7 THEN 8.50
    WHEN 22 THEN 9.50 WHEN 23 THEN 9.00 WHEN 24 THEN 9.00
    WHEN 25 THEN 7.50 WHEN 26 THEN 7.00 WHEN 27 THEN 6.50
    ELSE 4.00
  END,
  CASE pr.student_id
    WHEN 5 THEN 8.50 WHEN 6 THEN 8.00 WHEN 7 THEN 8.00
    WHEN 22 THEN 9.00 WHEN 23 THEN 9.00 WHEN 24 THEN 9.00
    WHEN 25 THEN 7.50 WHEN 26 THEN 7.00 WHEN 27 THEN 6.50
    ELSE 4.00
  END,
  -- Defense criteria
  CASE pr.student_id
    WHEN 5 THEN 8.33 WHEN 6 THEN 8.33 WHEN 7 THEN 8.33
    WHEN 22 THEN 9.50 WHEN 23 THEN 9.00 WHEN 24 THEN 9.00
    WHEN 25 THEN 8.00 WHEN 26 THEN 7.50 WHEN 27 THEN 7.00
    ELSE 4.50
  END,
  CASE pr.student_id
    WHEN 5 THEN 8.33 WHEN 6 THEN 8.33 WHEN 7 THEN 8.33
    WHEN 22 THEN 9.50 WHEN 23 THEN 9.50 WHEN 24 THEN 9.00
    WHEN 25 THEN 7.50 WHEN 26 THEN 7.00 WHEN 27 THEN 6.50
    ELSE 4.50
  END,
  CASE pr.student_id
    WHEN 5 THEN 8.33 WHEN 6 THEN 8.33 WHEN 7 THEN 8.33
    WHEN 22 THEN 9.50 WHEN 23 THEN 9.00 WHEN 24 THEN 9.00
    WHEN 25 THEN 8.00 WHEN 26 THEN 7.50 WHEN 27 THEN 7.00
    ELSE 4.50
  END,
  -- Comments
  CASE pr.student_id
    WHEN 5 THEN 'Sinh viên có thái độ học tập rất nghiêm túc, làm chủ công nghệ phát hiện lỗ hổng phần mềm bằng AI, hoàn thành xuất sắc các mục tiêu đề ra.'
    WHEN 6 THEN 'Thực hiện tốt phần giao diện người dùng và trực quan hóa cảnh báo an toàn, tinh thần làm việc nhóm cao và có trách nhiệm.'
    WHEN 7 THEN 'Nắm vững kiến trúc triển khai CI/CD và hạ tầng đám mây, hoàn thành đầy đủ các nhiệm vụ kỹ thuật được phân công.'
    WHEN 22 THEN 'Sinh viên có năng lực nghiên cứu khoa học xuất sắc, làm chủ các mô hình LLM chuyên sâu cho y tế, công bố kết quả rất thuyết phục.'
    WHEN 23 THEN 'Triển khai xuất sắc module Hybrid Vector Search và tích hợp hệ thống bệnh án điện tử an toàn, tốc độ phản hồi nhanh.'
    WHEN 24 THEN 'Giao diện lâm sàng đạt chuẩn trải nghiệm bác sĩ, báo cáo khóa luận trình bày chỉn chu, đúng quy chuẩn học thuật.'
    WHEN 25 THEN 'Sinh viên tích cực trong quá trình thực nghiệm phần cứng, hoàn thành việc thu thập và truyền dữ liệu cảm biến ổn định.'
    WHEN 26 THEN 'Hoàn thành thiết kế mạch cảm biến và nguồn pin dự phòng, có ý thức kỷ luật tốt.'
    WHEN 27 THEN 'Nỗ lực hoàn thành hệ thống backend lưu trữ time-series và bản đồ quan trắc chất lượng không khí trường học.'
    ELSE 'Chưa bám sát kế hoạch hướng dẫn định kỳ, khối lượng thực hiện chưa đáp ứng yêu cầu tối thiểu của một khóa luận tốt nghiệp.'
  END,
  CASE pr.student_id
    WHEN 5 THEN 'Khóa luận đạt chất lượng tốt, đủ điều kiện bảo vệ trước hội đồng.'
    WHEN 6 THEN 'Đạt yêu cầu phản biện.'
    WHEN 7 THEN 'Đạt yêu cầu phản biện.'
    WHEN 22 THEN 'Đề tài xuất sắc, có tiềm năng công bố bài báo khoa học quốc tế.'
    WHEN 23 THEN 'Xuất sắc.'
    WHEN 24 THEN 'Rất tốt.'
    WHEN 25 THEN 'Đạt yêu cầu.'
    WHEN 26 THEN 'Đạt yêu cầu.'
    WHEN 27 THEN 'Đạt yêu cầu.'
    ELSE 'Chưa đạt khối lượng tối thiểu để bảo vệ chính thức.'
  END,
  CASE pr.student_id
    WHEN 5 THEN 'Nguyen Van Quan: Phong thái tự tin, bảo vệ xuất sắc.\nHoang Minh Tri: Đạt chuẩn chất lượng.\nAssoc. Prof. Le Hoang Council: Bảo vệ thành công.'
    WHEN 6 THEN 'Nguyen Van Quan: Hoàn thành tốt nhiệm vụ.\nHoang Minh Tri: Đạt chuẩn chất lượng.\nAssoc. Prof. Le Hoang Council: Bảo vệ thành công.'
    WHEN 7 THEN 'Nguyen Van Quan: Đạt kết quả tốt.\nHoang Minh Tri: Đạt chuẩn chất lượng.\nAssoc. Prof. Le Hoang Council: Bảo vệ thành công.'
    WHEN 22 THEN 'Le Quang Dung: Thủ khoa đợt bảo vệ.'
    WHEN 23 THEN 'Le Quang Dung: Xuất sắc.'
    WHEN 24 THEN 'Le Quang Dung: Xuất sắc.'
    WHEN 25 THEN 'Assoc. Prof. Tran Dinh Thong: Đạt loại khá.'
    WHEN 26 THEN 'Assoc. Prof. Tran Dinh Thong: Đạt loại khá.'
    WHEN 27 THEN 'Assoc. Prof. Tran Dinh Thong: Đạt yêu cầu.'
    ELSE 'Assoc. Prof. Tran Dinh Thong: Bảo vệ chưa đạt yêu cầu, cần hoàn thiện lại để bảo vệ đợt sau.'
  END
FROM published_results pr
WHERE pr.assignment_id BETWEEN 1 AND 4
ON DUPLICATE KEY UPDATE
  advisor_name = VALUES(advisor_name),
  advisor_content_score = VALUES(advisor_content_score),
  advisor_implementation_score = VALUES(advisor_implementation_score),
  advisor_presentation_score = VALUES(advisor_presentation_score),
  review_content_score = VALUES(review_content_score),
  review_implementation_score = VALUES(review_implementation_score),
  review_presentation_score = VALUES(review_presentation_score),
  defense_content_score = VALUES(defense_content_score),
  defense_implementation_score = VALUES(defense_implementation_score),
  defense_presentation_score = VALUES(defense_presentation_score),
  advisor_comment = VALUES(advisor_comment),
  review_comment = VALUES(review_comment),
  defense_comments = VALUES(defense_comments);


