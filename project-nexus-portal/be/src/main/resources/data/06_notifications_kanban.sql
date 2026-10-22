-- ==========================================================
-- 06_notifications_kanban.sql: Real-Time Notifications & Kanban Board Tasks
-- ==========================================================

-- 1. System & Faculty Notifications (Left empty: created dynamically in application)
ALTER TABLE notifications MODIFY COLUMN title VARCHAR(500) NOT NULL;
DELETE FROM notification_reads WHERE notification_id BETWEEN 1 AND 50;
DELETE FROM notifications WHERE id BETWEEN 1 AND 50;

-- 2. Kanban Progress Tasks for Multiple Teams
DELETE FROM progress_tasks WHERE id BETWEEN 1 AND 50;

INSERT INTO progress_tasks (id, team_id, assignee_id, title, description, due_date, status, feedback, version, created_at, updated_at) VALUES
  -- Team 2 (Nexus Alpha - Topic 1: AI Code Scanner | Members: 5, 6, 7)
  (1, 2, 5, 'Khảo sát OWASP Top 10 và các công cụ SAST', 'Nghiên cứu tài liệu và lập danh mục lỗ hổng cần phát hiện.', DATE_ADD(CURRENT_DATE(), INTERVAL -20 DAY), 'DONE', 'Tài liệu đầy đủ, đạt yêu cầu.', 0, NOW(6) - INTERVAL 25 DAY, NOW(6) - INTERVAL 18 DAY),
  (2, 2, 6, 'Thiết kế kiến trúc Microservices và DB', 'Sơ đồ luồng xử lý và mô hình cơ sở dữ liệu quan hệ.', DATE_ADD(CURRENT_DATE(), INTERVAL -15 DAY), 'DONE', 'Cấu trúc dịch vụ rõ ràng.', 0, NOW(6) - INTERVAL 20 DAY, NOW(6) - INTERVAL 12 DAY),
  (3, 2, 7, 'Xây dựng bộ phân tích cú pháp AST', 'Hiện thực AST parser quét lỗ hổng SQLi và XSS.', DATE_ADD(CURRENT_DATE(), INTERVAL -8 DAY), 'DONE', 'Tốc độ phân tích tốt.', 0, NOW(6) - INTERVAL 12 DAY, NOW(6) - INTERVAL 5 DAY),
  (4, 2, 5, 'Tích hợp mô hình AI gợi ý sửa lỗi code', 'Kết nối LLM API sinh đoạn mã vá lỗ hổng tự động.', DATE_ADD(CURRENT_DATE(), INTERVAL 3 DAY), 'IN_PROGRESS', 'Cần tinh chỉnh lại prompt.', 0, NOW(6) - INTERVAL 5 DAY, NOW(6)),
  (5, 2, 6, 'Xây dựng giao diện Dashboard React', 'Hiển thị danh sách lỗ hổng và mức độ nghiêm trọng.', DATE_ADD(CURRENT_DATE(), INTERVAL 5 DAY), 'IN_PROGRESS', NULL, 0, NOW(6) - INTERVAL 4 DAY, NOW(6)),
  (6, 2, 7, 'Đóng gói Docker và kiểm thử tải hệ thống', 'Viết Dockerfile, k8s manifests và test tải với k6.', DATE_ADD(CURRENT_DATE(), INTERVAL 12 DAY), 'TODO', NULL, 0, NOW(6) - INTERVAL 2 DAY, NOW(6)),
  (7, 2, 5, 'Viết báo cáo KLTN chương 3 và 4', 'Tổng hợp kết quả thực nghiệm và đánh giá độ chính xác.', DATE_ADD(CURRENT_DATE(), INTERVAL 15 DAY), 'TODO', NULL, 0, NOW(6) - INTERVAL 1 DAY, NOW(6)),

  -- Team 3 (Vision AI - Topic 4: Clinical Support | Members: 22, 23, 24)
  (8, 3, 22, 'Thu thập và làm sạch dữ liệu bệnh án', 'Xử lý ẩn danh thông tin bệnh nhân theo quy chuẩn.', DATE_ADD(CURRENT_DATE(), INTERVAL -18 DAY), 'DONE', 'Dữ liệu chuẩn hóa tốt.', 0, NOW(6) - INTERVAL 22 DAY, NOW(6) - INTERVAL 15 DAY),
  (9, 3, 23, 'Cài đặt Vector DB Qdrant và Embedding', 'Lập chỉ mục tài liệu phác đồ điều trị y tế.', DATE_ADD(CURRENT_DATE(), INTERVAL -10 DAY), 'DONE', 'Tìm kiếm ngữ nghĩa chính xác.', 0, NOW(6) - INTERVAL 15 DAY, NOW(6) - INTERVAL 8 DAY),
  (10, 3, 24, 'Thiết kế UI hỗ trợ bác sĩ tra cứu', 'Giao diện nhập triệu chứng và hiển thị gợi ý.', DATE_ADD(CURRENT_DATE(), INTERVAL 4 DAY), 'IN_PROGRESS', NULL, 0, NOW(6) - INTERVAL 6 DAY, NOW(6)),
  (11, 3, 22, 'Đánh giá độ chính xác cùng bác sĩ cố vấn', 'Kiểm thử trên 100 ca bệnh thực tế.', DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY), 'TODO', NULL, 0, NOW(6) - INTERVAL 3 DAY, NOW(6)),
  (12, 3, 23, 'Tối ưu hóa thời gian phản hồi của pipeline RAG', 'Giảm độ trễ truy xuất vector và gọi LLM dưới 2 giây.', DATE_ADD(CURRENT_DATE(), INTERVAL 16 DAY), 'TODO', NULL, 0, NOW(6) - INTERVAL 2 DAY, NOW(6)),

  -- Team 4 (CloudOps Pioneers - Topic 2: Smart Campus IoT | Members: 25, 26, 27)
  (13, 4, 25, 'Cấu hình Broker MQTT và bảo mật TLS', 'Thiết lập cụm broker nhận dữ liệu cảm biến.', DATE_ADD(CURRENT_DATE(), INTERVAL -14 DAY), 'DONE', 'Hệ thống hoạt động ổn định.', 0, NOW(6) - INTERVAL 18 DAY, NOW(6) - INTERVAL 12 DAY),
  (14, 4, 26, 'Lập trình firmware ESP32 đo môi trường', 'Thu thập nhiệt độ, độ ẩm và điện năng tiêu thụ.', DATE_ADD(CURRENT_DATE(), INTERVAL -5 DAY), 'DONE', 'Mạch chạy tốt, ít tiêu hao pin.', 0, NOW(6) - INTERVAL 10 DAY, NOW(6) - INTERVAL 3 DAY),
  (15, 4, 27, 'Lưu trữ TimeScaleDB và đẩy WebSocket', 'Xử lý dữ liệu chuỗi thời gian hiển thị realtime.', DATE_ADD(CURRENT_DATE(), INTERVAL 5 DAY), 'IN_PROGRESS', NULL, 0, NOW(6) - INTERVAL 5 DAY, NOW(6)),
  (16, 4, 25, 'Vẽ bản đồ nhiệt năng lượng tòa nhà', 'Trực quan hóa mức tiêu thụ điện từng phòng học.', DATE_ADD(CURRENT_DATE(), INTERVAL 15 DAY), 'TODO', NULL, 0, NOW(6) - INTERVAL 2 DAY, NOW(6)),
  (17, 4, 26, 'Tích hợp cảnh báo ngưỡng qua Telegram Bot', 'Tự động gửi thông báo khi nhiệt độ phòng máy vượt quá mức.', DATE_ADD(CURRENT_DATE(), INTERVAL 18 DAY), 'TODO', NULL, 0, NOW(6) - INTERVAL 1 DAY, NOW(6)),

  -- Team 5 (FinTech Analytics - Topic 5: Algorithmic Trading | Members: 28, 29, 30)
  (18, 5, 28, 'Hiện thực động cơ khớp lệnh Order Book', 'Thuật toán khớp lệnh ưu tiên giá và thời gian.', DATE_ADD(CURRENT_DATE(), INTERVAL -12 DAY), 'DONE', 'Xử lý hơn 20.000 lệnh/giây.', 0, NOW(6) - INTERVAL 16 DAY, NOW(6) - INTERVAL 9 DAY),
  (19, 5, 29, 'Mô hình tính toán rủi ro danh mục VaR', 'Áp dụng mô phỏng Monte Carlo dự báo rủi ro.', DATE_ADD(CURRENT_DATE(), INTERVAL 4 DAY), 'IN_PROGRESS', 'Cần tối ưu tốc độ tính toán.', 0, NOW(6) - INTERVAL 6 DAY, NOW(6)),
  (20, 5, 30, 'Giao diện đặt lệnh và biểu đồ TradingView', 'Tích hợp đồ thị nến và sổ lệnh thời gian thực.', DATE_ADD(CURRENT_DATE(), INTERVAL 10 DAY), 'TODO', NULL, 0, NOW(6) - INTERVAL 3 DAY, NOW(6)),
  (21, 5, 28, 'Kiểm thử chiến lược trên dữ liệu lịch sử', 'Chạy backtest trên dữ liệu VN30 3 năm gần nhất.', DATE_ADD(CURRENT_DATE(), INTERVAL 16 DAY), 'TODO', NULL, 0, NOW(6) - INTERVAL 2 DAY, NOW(6)),

  -- Team 6 (CyberSec Hunters - Topic 7: Zero-Trust Platform | Members: 31, 32, 33)
  (22, 6, 31, 'Lập trình probe eBPF bắt sự kiện socket', 'Ghi nhận kết nối mạng ở tầng nhân Linux.', DATE_ADD(CURRENT_DATE(), INTERVAL -10 DAY), 'DONE', 'Hiệu năng tốt, không nghẽn CPU.', 0, NOW(6) - INTERVAL 15 DAY, NOW(6) - INTERVAL 7 DAY),
  (23, 6, 32, 'Phân tích hành vi theo khung MITRE ATT&CK', 'Nhận diện kỹ thuật tấn công dò quét mạng nội bộ.', DATE_ADD(CURRENT_DATE(), INTERVAL 6 DAY), 'IN_PROGRESS', NULL, 0, NOW(6) - INTERVAL 5 DAY, NOW(6)),
  (24, 6, 33, 'Vẽ sơ đồ tương tác pod trên Kubernetes', 'Trực quan hóa luồng dữ liệu giữa các dịch vụ.', DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY), 'TODO', NULL, 0, NOW(6) - INTERVAL 2 DAY, NOW(6)),
  (25, 6, 31, 'Viết tài liệu thử nghiệm tấn công giả lập', 'Thực hiện pentest kiểm thử độ nhạy của hệ thống.', DATE_ADD(CURRENT_DATE(), INTERVAL 18 DAY), 'TODO', NULL, 0, NOW(6) - INTERVAL 1 DAY, NOW(6)),

  -- Team 9 (Data Dynamics - Topic 3: Blockchain Credentials | Members: 38, 39, 40)
  (26, 9, 38, 'Viết Smart Contract cấp bằng ERC-721', 'Hiện thực hợp đồng thông minh trên mạng thử nghiệm.', DATE_ADD(CURRENT_DATE(), INTERVAL -10 DAY), 'DONE', 'Hợp đồng vượt qua bài test bảo mật.', 0, NOW(6) - INTERVAL 15 DAY, NOW(6) - INTERVAL 8 DAY),
  (27, 9, 39, 'Tích hợp Web3 và ví MetaMask', 'Kết nối giao diện người dùng với Smart Contract.', DATE_ADD(CURRENT_DATE(), INTERVAL 5 DAY), 'IN_PROGRESS', NULL, 0, NOW(6) - INTERVAL 6 DAY, NOW(6)),
  (28, 9, 40, 'Xây dựng trang tra cứu và xác thực QR', 'Cổng công khai cho nhà tuyển dụng kiểm tra bằng cấp.', DATE_ADD(CURRENT_DATE(), INTERVAL 12 DAY), 'TODO', NULL, 0, NOW(6) - INTERVAL 3 DAY, NOW(6)),
  (29, 9, 38, 'Soạn thảo báo cáo kỹ thuật và phân tích gas fee', 'Đo lường chi phí giao dịch trên blockchain.', DATE_ADD(CURRENT_DATE(), INTERVAL 16 DAY), 'TODO', NULL, 0, NOW(6) - INTERVAL 1 DAY, NOW(6));

