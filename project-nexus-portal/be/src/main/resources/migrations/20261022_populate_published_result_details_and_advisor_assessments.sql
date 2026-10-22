-- Populate missing ADVISOR assessments and published_result_details snapshots
-- Compatible with both local Docker MySQL and production VPS MySQL
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 1. Ensure ADVISOR assessments exist for assignment students with clean UTF-8
DELETE FROM assessments WHERE assessment_type = 'ADVISOR' AND assignment_id BETWEEN 1 AND 4;

INSERT INTO assessments (assignment_id, evaluator_id, student_id, assessment_type, status, content_score, implementation_score, presentation_score, strengths, weaknesses, questions, comment, submitted_at, created_at, updated_at)
SELECT 1, 3, 5, 'ADVISOR', 'SUBMITTED', 8.50, 8.50, 8.00,
       'Sinh viên nắm vững kiến trúc Cloud-Native, chủ động nghiên cứu các mô hình AI phát hiện lỗ hổng phần mềm.',
       'Cần trau dồi thêm kỹ năng trình bày bằng tiếng Anh.',
       'Khả năng mở rộng của mô hình khi phân tích các repo mã nguồn lớn?',
       'Sinh viên có thái độ học tập rất nghiêm túc, làm chủ công nghệ phát hiện lỗ hổng phần mềm bằng AI, hoàn thành xuất sắc các mục tiêu đề ra.',
       NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY
WHERE NOT EXISTS (SELECT 1 FROM assessments WHERE assignment_id = 1 AND student_id = 5 AND assessment_type = 'ADVISOR');

INSERT INTO assessments (assignment_id, evaluator_id, student_id, assessment_type, status, content_score, implementation_score, presentation_score, strengths, weaknesses, questions, comment, submitted_at, created_at, updated_at)
SELECT 1, 3, 6, 'ADVISOR', 'SUBMITTED', 8.50, 8.50, 8.00,
       'Thiết kế giao diện người dùng trực quan, phối hợp nhóm hiệu quả.',
       'Cần tối ưu thời gian phản hồi biểu đồ thống kê.',
       'Các tiêu chí nào được ưu tiên khi xếp hạng độ nghiêm trọng của lỗ hổng?',
       'Thực hiện tốt phần giao diện người dùng và trực quan hóa cảnh báo an toàn, tinh thần làm việc nhóm cao và có trách nhiệm.',
       NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY
WHERE NOT EXISTS (SELECT 1 FROM assessments WHERE assignment_id = 1 AND student_id = 6 AND assessment_type = 'ADVISOR');

INSERT INTO assessments (assignment_id, evaluator_id, student_id, assessment_type, status, content_score, implementation_score, presentation_score, strengths, weaknesses, questions, comment, submitted_at, created_at, updated_at)
SELECT 1, 3, 7, 'ADVISOR', 'SUBMITTED', 8.50, 8.50, 8.00,
       'Kỹ năng thiết lập hạ tầng Kubernetes và pipeline CI/CD tốt.',
       'Cần bổ sung thêm tài liệu hướng dẫn vận hành khi gặp lỗi node.',
       'Cơ chế rollback tự động hoạt động như thế nào khi bản build quét mã thất bại?',
       'Nắm vững kiến trúc triển khai CI/CD và hạ tầng đám mây, hoàn thành đầy đủ các nhiệm vụ kỹ thuật được phân công.',
       NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY
WHERE NOT EXISTS (SELECT 1 FROM assessments WHERE assignment_id = 1 AND student_id = 7 AND assessment_type = 'ADVISOR');

-- Assignment 2: Primary Advisor User 15 (Nguyen Thanh Son)
INSERT INTO assessments (assignment_id, evaluator_id, student_id, assessment_type, status, content_score, implementation_score, presentation_score, strengths, weaknesses, questions, comment, submitted_at, created_at, updated_at)
SELECT 2, 15, 22, 'ADVISOR', 'SUBMITTED', 9.50, 9.50, 9.50,
       'Năng lực nghiên cứu lý thuyết AI chuyên sâu xuất sắc.', NULL, NULL,
       'Sinh viên có năng lực nghiên cứu khoa học xuất sắc, làm chủ các mô hình LLM chuyên sâu cho y tế, công bố kết quả rất thuyết phục.',
       NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY
WHERE NOT EXISTS (SELECT 1 FROM assessments WHERE assignment_id = 2 AND student_id = 22 AND assessment_type = 'ADVISOR');

INSERT INTO assessments (assignment_id, evaluator_id, student_id, assessment_type, status, content_score, implementation_score, presentation_score, strengths, weaknesses, questions, comment, submitted_at, created_at, updated_at)
SELECT 2, 15, 23, 'ADVISOR', 'SUBMITTED', 9.20, 9.20, 9.20,
       'Lập trình backend vững vàng, cấu hình vector DB tối ưu.', NULL, NULL,
       'Triển khai xuất sắc module Hybrid Vector Search và tích hợp hệ thống bệnh án điện tử an toàn, tốc độ phản hồi nhanh.',
       NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY
WHERE NOT EXISTS (SELECT 1 FROM assessments WHERE assignment_id = 2 AND student_id = 23 AND assessment_type = 'ADVISOR');

INSERT INTO assessments (assignment_id, evaluator_id, student_id, assessment_type, status, content_score, implementation_score, presentation_score, strengths, weaknesses, questions, comment, submitted_at, created_at, updated_at)
SELECT 2, 15, 24, 'ADVISOR', 'SUBMITTED', 9.00, 9.00, 9.00,
       'Giao diện bác sĩ chỉn chu, tài liệu báo cáo đầy đủ.', NULL, NULL,
       'Giao diện lâm sàng đạt chuẩn trải nghiệm bác sĩ, báo cáo khóa luận trình bày chỉn chu, đúng quy chuẩn học thuật.',
       NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY, NOW(6) - INTERVAL 7 DAY
WHERE NOT EXISTS (SELECT 1 FROM assessments WHERE assignment_id = 2 AND student_id = 24 AND assessment_type = 'ADVISOR');

-- Assignment 3: Primary Advisor User 14 (Assoc. Prof. Do Thi Thu Ha)
INSERT INTO assessments (assignment_id, evaluator_id, student_id, assessment_type, status, content_score, implementation_score, presentation_score, strengths, weaknesses, questions, comment, submitted_at, created_at, updated_at)
SELECT 3, 14, 25, 'ADVISOR', 'SUBMITTED', 7.80, 7.80, 7.80,
       'Tích cực trong thực nghiệm phần cứng IoT.', NULL, NULL,
       'Sinh viên tích cực trong quá trình thực nghiệm phần cứng, hoàn thành việc thu thập và truyền dữ liệu cảm biến ổn định.',
       NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY
WHERE NOT EXISTS (SELECT 1 FROM assessments WHERE assignment_id = 3 AND student_id = 25 AND assessment_type = 'ADVISOR');

INSERT INTO assessments (assignment_id, evaluator_id, student_id, assessment_type, status, content_score, implementation_score, presentation_score, strengths, weaknesses, questions, comment, submitted_at, created_at, updated_at)
SELECT 3, 14, 26, 'ADVISOR', 'SUBMITTED', 7.20, 7.20, 7.20,
       'Hoàn thành mạch cảm biến theo thiết kế.', NULL, NULL,
       'Hoàn thành thiết kế mạch cảm biến và nguồn pin dự phòng, có ý thức kỷ luật tốt.',
       NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY
WHERE NOT EXISTS (SELECT 1 FROM assessments WHERE assignment_id = 3 AND student_id = 26 AND assessment_type = 'ADVISOR');

INSERT INTO assessments (assignment_id, evaluator_id, student_id, assessment_type, status, content_score, implementation_score, presentation_score, strengths, weaknesses, questions, comment, submitted_at, created_at, updated_at)
SELECT 3, 14, 27, 'ADVISOR', 'SUBMITTED', 6.80, 6.80, 6.80,
       'Nỗ lực hoàn thành kết nối dữ liệu time-series.', NULL, NULL,
       'Nỗ lực hoàn thành hệ thống backend lưu trữ time-series và bản đồ quan trắc chất lượng không khí trường học.',
       NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY, NOW(6) - INTERVAL 6 DAY
WHERE NOT EXISTS (SELECT 1 FROM assessments WHERE assignment_id = 3 AND student_id = 27 AND assessment_type = 'ADVISOR');

-- Assignment 4: Primary Advisor User 14 (Assoc. Prof. Do Thi Thu Ha)
INSERT INTO assessments (assignment_id, evaluator_id, student_id, assessment_type, status, content_score, implementation_score, presentation_score, strengths, weaknesses, questions, comment, submitted_at, created_at, updated_at)
SELECT 4, 14, 31, 'ADVISOR', 'SUBMITTED', 4.50, 4.50, 4.50,
       'Chưa hoàn thành khối lượng yêu cầu.', 'Tiến độ rất chậm, vắng nhiều buổi họp hướng dẫn.', NULL,
       'Chưa bám sát kế hoạch hướng dẫn định kỳ, khối lượng thực hiện chưa đáp ứng yêu cầu tối thiểu của một khóa luận tốt nghiệp.',
       NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY
WHERE NOT EXISTS (SELECT 1 FROM assessments WHERE assignment_id = 4 AND student_id = 31 AND assessment_type = 'ADVISOR');


-- 2. Populate published_result_details for existing published results
-- Student 5 (Assignment 1)
INSERT INTO published_result_details (
  result_id, advisor_name,
  advisor_content_score, advisor_implementation_score, advisor_presentation_score,
  review_content_score, review_implementation_score, review_presentation_score,
  defense_content_score, defense_implementation_score, defense_presentation_score,
  advisor_comment, review_comment, defense_comments
)
SELECT
  pr.id, 'MSc. Tran Hoang Nam',
  8.50, 8.50, 8.00,
  8.50, 9.00, 8.50,
  8.33, 8.33, 8.33,
  'Sinh viên có thái độ học tập rất nghiêm túc, làm chủ công nghệ phát hiện lỗ hổng phần mềm bằng AI, hoàn thành xuất sắc các mục tiêu đề ra.',
  'Khóa luận đạt chất lượng tốt, đủ điều kiện bảo vệ trước hội đồng.',
  'Nguyen Van Quan: Phong thái tự tin, bảo vệ xuất sắc.\nHoang Minh Tri: Đạt chuẩn chất lượng.\nAssoc. Prof. Le Hoang Council: Bảo vệ thành công.'
FROM published_results pr
WHERE pr.assignment_id = 1 AND pr.student_id = 5
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

-- Student 6 (Assignment 1)
INSERT INTO published_result_details (
  result_id, advisor_name,
  advisor_content_score, advisor_implementation_score, advisor_presentation_score,
  review_content_score, review_implementation_score, review_presentation_score,
  defense_content_score, defense_implementation_score, defense_presentation_score,
  advisor_comment, review_comment, defense_comments
)
SELECT
  pr.id, 'MSc. Tran Hoang Nam',
  8.50, 8.50, 8.00,
  8.00, 8.50, 8.00,
  8.33, 8.33, 8.33,
  'Thực hiện tốt phần giao diện người dùng và trực quan hóa cảnh báo an toàn, tinh thần làm việc nhóm cao và có trách nhiệm.',
  'Đạt yêu cầu phản biện.',
  'Nguyen Van Quan: Hoàn thành tốt nhiệm vụ.\nHoang Minh Tri: Đạt chuẩn chất lượng.\nAssoc. Prof. Le Hoang Council: Bảo vệ thành công.'
FROM published_results pr
WHERE pr.assignment_id = 1 AND pr.student_id = 6
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

-- Student 7 (Assignment 1)
INSERT INTO published_result_details (
  result_id, advisor_name,
  advisor_content_score, advisor_implementation_score, advisor_presentation_score,
  review_content_score, review_implementation_score, review_presentation_score,
  defense_content_score, defense_implementation_score, defense_presentation_score,
  advisor_comment, review_comment, defense_comments
)
SELECT
  pr.id, 'MSc. Tran Hoang Nam',
  8.50, 8.50, 8.00,
  8.00, 8.50, 8.00,
  8.33, 8.33, 8.33,
  'Nắm vững kiến trúc triển khai CI/CD và hạ tầng đám mây, hoàn thành đầy đủ các nhiệm vụ kỹ thuật được phân công.',
  'Đạt yêu cầu phản biện.',
  'Nguyen Van Quan: Đạt kết quả tốt.\nHoang Minh Tri: Đạt chuẩn chất lượng.\nAssoc. Prof. Le Hoang Council: Bảo vệ thành công.'
FROM published_results pr
WHERE pr.assignment_id = 1 AND pr.student_id = 7
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

-- Student 22 (Assignment 2)
INSERT INTO published_result_details (
  result_id, advisor_name,
  advisor_content_score, advisor_implementation_score, advisor_presentation_score,
  review_content_score, review_implementation_score, review_presentation_score,
  defense_content_score, defense_implementation_score, defense_presentation_score,
  advisor_comment, review_comment, defense_comments
)
SELECT
  pr.id, 'Nguyen Thanh Son',
  9.50, 9.50, 9.50,
  9.50, 9.50, 9.00,
  9.50, 9.50, 9.50,
  'Sinh viên có năng lực nghiên cứu khoa học xuất sắc, làm chủ các mô hình LLM chuyên sâu cho y tế, công bố kết quả rất thuyết phục.',
  'Đề tài xuất sắc, có tiềm năng công bố bài báo khoa học quốc tế.',
  'Le Quang Dung: Thủ khoa đợt bảo vệ.'
FROM published_results pr
WHERE pr.assignment_id = 2 AND pr.student_id = 22
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

-- Student 23 (Assignment 2)
INSERT INTO published_result_details (
  result_id, advisor_name,
  advisor_content_score, advisor_implementation_score, advisor_presentation_score,
  review_content_score, review_implementation_score, review_presentation_score,
  defense_content_score, defense_implementation_score, defense_presentation_score,
  advisor_comment, review_comment, defense_comments
)
SELECT
  pr.id, 'Nguyen Thanh Son',
  9.20, 9.20, 9.20,
  9.00, 9.00, 9.00,
  9.00, 9.50, 9.00,
  'Triển khai xuất sắc module Hybrid Vector Search và tích hợp hệ thống bệnh án điện tử an toàn, tốc độ phản hồi nhanh.',
  'Xuất sắc.',
  'Le Quang Dung: Xuất sắc.'
FROM published_results pr
WHERE pr.assignment_id = 2 AND pr.student_id = 23
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

-- Student 24 (Assignment 2)
INSERT INTO published_result_details (
  result_id, advisor_name,
  advisor_content_score, advisor_implementation_score, advisor_presentation_score,
  review_content_score, review_implementation_score, review_presentation_score,
  defense_content_score, defense_implementation_score, defense_presentation_score,
  advisor_comment, review_comment, defense_comments
)
SELECT
  pr.id, 'Nguyen Thanh Son',
  9.00, 9.00, 9.00,
  8.50, 9.00, 9.00,
  9.00, 9.00, 9.00,
  'Giao diện lâm sàng đạt chuẩn trải nghiệm bác sĩ, báo cáo khóa luận trình bày chỉn chu, đúng quy chuẩn học thuật.',
  'Rất tốt.',
  'Le Quang Dung: Xuất sắc.'
FROM published_results pr
WHERE pr.assignment_id = 2 AND pr.student_id = 24
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

-- Student 25 (Assignment 3)
INSERT INTO published_result_details (
  result_id, advisor_name,
  advisor_content_score, advisor_implementation_score, advisor_presentation_score,
  review_content_score, review_implementation_score, review_presentation_score,
  defense_content_score, defense_implementation_score, defense_presentation_score,
  advisor_comment, review_comment, defense_comments
)
SELECT
  pr.id, 'Assoc. Prof. Do Thi Thu Ha',
  7.80, 7.80, 7.80,
  7.50, 7.50, 7.50,
  8.00, 7.50, 8.00,
  'Sinh viên tích cực trong quá trình thực nghiệm phần cứng, hoàn thành việc thu thập và truyền dữ liệu cảm biến ổn định.',
  'Đạt yêu cầu.',
  'Assoc. Prof. Tran Dinh Thong: Đạt loại khá.'
FROM published_results pr
WHERE pr.assignment_id = 3 AND pr.student_id = 25
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

-- Student 26 (Assignment 3)
INSERT INTO published_result_details (
  result_id, advisor_name,
  advisor_content_score, advisor_implementation_score, advisor_presentation_score,
  review_content_score, review_implementation_score, review_presentation_score,
  defense_content_score, defense_implementation_score, defense_presentation_score,
  advisor_comment, review_comment, defense_comments
)
SELECT
  pr.id, 'Assoc. Prof. Do Thi Thu Ha',
  7.20, 7.20, 7.20,
  7.00, 7.00, 7.00,
  7.50, 7.00, 7.50,
  'Hoàn thành thiết kế mạch cảm biến và nguồn pin dự phòng, có ý thức kỷ luật tốt.',
  'Đạt yêu cầu.',
  'Assoc. Prof. Tran Dinh Thong: Đạt loại khá.'
FROM published_results pr
WHERE pr.assignment_id = 3 AND pr.student_id = 26
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

-- Student 27 (Assignment 3)
INSERT INTO published_result_details (
  result_id, advisor_name,
  advisor_content_score, advisor_implementation_score, advisor_presentation_score,
  review_content_score, review_implementation_score, review_presentation_score,
  defense_content_score, defense_implementation_score, defense_presentation_score,
  advisor_comment, review_comment, defense_comments
)
SELECT
  pr.id, 'Assoc. Prof. Do Thi Thu Ha',
  6.80, 6.80, 6.80,
  6.50, 6.50, 6.50,
  7.00, 6.50, 7.00,
  'Nỗ lực hoàn thành hệ thống backend lưu trữ time-series và bản đồ quan trắc chất lượng không khí trường học.',
  'Đạt yêu cầu.',
  'Assoc. Prof. Tran Dinh Thong: Đạt yêu cầu.'
FROM published_results pr
WHERE pr.assignment_id = 3 AND pr.student_id = 27
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

-- Student 31 (Assignment 4)
INSERT INTO published_result_details (
  result_id, advisor_name,
  advisor_content_score, advisor_implementation_score, advisor_presentation_score,
  review_content_score, review_implementation_score, review_presentation_score,
  defense_content_score, defense_implementation_score, defense_presentation_score,
  advisor_comment, review_comment, defense_comments
)
SELECT
  pr.id, 'Assoc. Prof. Do Thi Thu Ha',
  4.50, 4.50, 4.50,
  4.00, 4.00, 4.00,
  4.50, 4.50, 4.50,
  'Chưa bám sát kế hoạch hướng dẫn định kỳ, khối lượng thực hiện chưa đáp ứng yêu cầu tối thiểu của một khóa luận tốt nghiệp.',
  'Chưa đạt khối lượng tối thiểu để bảo vệ chính thức.',
  'Assoc. Prof. Tran Dinh Thong: Bảo vệ chưa đạt yêu cầu, cần hoàn thiện lại để bảo vệ đợt sau.'
FROM published_results pr
WHERE pr.assignment_id = 4 AND pr.student_id = 31
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

-- 3. Generic fallback for any other published results missing details
INSERT INTO published_result_details (
  result_id, advisor_name,
  advisor_content_score, advisor_implementation_score, advisor_presentation_score,
  review_content_score, review_implementation_score, review_presentation_score,
  defense_content_score, defense_implementation_score, defense_presentation_score,
  advisor_comment, review_comment, defense_comments
)
SELECT 
  pr.id,
  COALESCE(adv_u.full_name, 'GVHD'),
  ROUND(GREATEST(0, LEAST(10, (pr.final_score - 0.3 * pr.review_score - 0.5 * pr.defense_score) / 0.2)), 2),
  ROUND(GREATEST(0, LEAST(10, (pr.final_score - 0.3 * pr.review_score - 0.5 * pr.defense_score) / 0.2)), 2),
  ROUND(GREATEST(0, LEAST(10, (pr.final_score - 0.3 * pr.review_score - 0.5 * pr.defense_score) / 0.2)), 2),
  pr.review_score, pr.review_score, pr.review_score,
  pr.defense_score, pr.defense_score, pr.defense_score,
  'Hoàn thành tốt các mục tiêu đề tài theo hướng dẫn.',
  'Đạt yêu cầu phản biện.',
  'Bảo vệ thành công trước hội đồng.'
FROM published_results pr
LEFT JOIN defense_assignments da ON pr.assignment_id = da.id
LEFT JOIN topic_registrations tr ON da.registration_id = tr.id
LEFT JOIN topic_lecturers tl ON tr.topic_id = tl.topic_id AND tl.advisor_role = 'PRIMARY'
LEFT JOIN users adv_u ON tl.lecturer_id = adv_u.id
WHERE pr.id NOT IN (SELECT result_id FROM published_result_details);

