-- ==========================================================
-- 06_notifications_kanban.sql: Real-Time Notifications & Kanban Board Tasks
-- ==========================================================

-- 1. System & Faculty Notifications
DELETE FROM notification_reads WHERE notification_id BETWEEN 1 AND 20;
DELETE FROM notifications WHERE id BETWEEN 1 AND 20;

INSERT INTO notifications (id, title, content, faculty_id, author_id, created_at, updated_at) VALUES
  (1, 'Thông báo: Khởi động Đợt đăng ký Khóa luận Tốt nghiệp Kỳ 1 (2026 - 2027)',
   'Khoa Công nghệ Thông tin thông báo mở cổng đăng ký đề tài KLTN cho sinh viên K21. Đề nghị các nhóm sinh viên hoàn tất đăng ký đúng hạn.',
   1, 2, NOW(6) - INTERVAL 15 DAY, NOW(6) - INTERVAL 15 DAY),

  (2, 'Hướng dẫn quy chuẩn trình bày báo cáo toàn văn và slide bảo vệ',
   'Sinh viên tải mẫu template Word/LaTeX chính thức tại cổng thông tin. Báo cáo yêu cầu tối thiểu 60 trang và có xác nhận của GVHD.',
   1, 2, NOW(6) - INTERVAL 12 DAY, NOW(6) - INTERVAL 12 DAY),

  (3, 'Nhắc nhở: Hạn chót nộp Báo cáo tiến độ Giữa kỳ (Midterm Progress Review)',
   'Tất cả các nhóm KLTN phải cập nhật bảng Kanban và nộp file PDF báo cáo tiến độ giữa kỳ trước 17:00 ngày 25/10/2026.',
   1, 3, NOW(6) - INTERVAL 8 DAY, NOW(6) - INTERVAL 8 DAY),

  (4, 'Phê duyệt 20 đề tài Khóa luận Tốt nghiệp đợt 1 Khoa CNTT',
   'Hội đồng khoa học khoa CNTT đã thẩm định và phê duyệt danh sách đề tài mới. Sinh viên có thể vào Chợ đề tài để tìm kiếm và nộp đơn.',
   1, 2, NOW(6) - INTERVAL 5 DAY, NOW(6) - INTERVAL 5 DAY),

  (5, 'Lịch thành lập Hội đồng Đánh giá & Bảo vệ Khóa luận Tốt nghiệp Kỳ 1',
   'Phòng Đào tạo và Ban Chủ nhiệm Khoa đã ban hành quyết định thành lập các Hội đồng đánh giá chuyên môn tại phòng A3-201, B2-105.',
   1, 2, NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY),

  (6, 'Cảnh báo bảo mật: Tuyệt đối không chia sẻ mật khẩu tài khoản Nexus Portal',
   'Trung tâm CNTT khuyến cáo người dùng đổi mật khẩu định kỳ và không cung cấp mã OTP/Token cho bất kỳ đối tượng nào.',
   NULL, 1, NOW(6) - INTERVAL 2 DAY, NOW(6) - INTERVAL 2 DAY),

  (7, 'Công bố kết quả chính thức và bảng điểm Khóa luận đợt 1',
   'Điểm tổng kết khóa luận (30% phản biện + 70% hội đồng) đã được phê duyệt và công bố. Sinh viên có thể tra cứu tại mục Kết quả học tập.',
   1, 2, NOW(6) - INTERVAL 1 DAY, NOW(6) - INTERVAL 1 DAY),

  (8, 'Khảo sát ý kiến phản hồi về chất lượng tổ chức Khóa luận Tốt nghiệp',
   'Kính mời các bạn sinh viên và quý thầy cô đóng góp ý kiến để cải tiến quy trình quản lý đề tài trên Nexus Portal.',
   1, 2, NOW(6), NOW(6));

-- 2. Notification Reads
INSERT INTO notification_reads (notification_id, user_id, read_at) VALUES
  (1, 5, NOW() - INTERVAL 14 DAY),
  (1, 6, NOW() - INTERVAL 14 DAY),
  (1, 7, NOW() - INTERVAL 14 DAY),
  (2, 5, NOW() - INTERVAL 11 DAY),
  (3, 5, NOW() - INTERVAL 7 DAY),
  (3, 6, NOW() - INTERVAL 7 DAY),
  (4, 5, NOW() - INTERVAL 4 DAY),
  (5, 5, NOW() - INTERVAL 2 DAY),
  (6, 1, NOW() - INTERVAL 1 DAY),
  (7, 5, NOW());

-- 3. Kanban Progress Tasks for Multiple Teams
DELETE FROM progress_tasks WHERE id BETWEEN 1 AND 50;

INSERT INTO progress_tasks (id, team_id, assignee_id, title, description, due_date, status, feedback, version, created_at, updated_at) VALUES
  -- Team 2 (Nexus Alpha - Topic 1: AI Code Scanner)
  (1, 2, 5, 'Khảo sát hiện trạng và phân tích yêu cầu phi chức năng (NFR)',
   'Nghiên cứu các tiêu chuẩn bảo mật OWASP Top 10 và các công cụ Static Code Analysis phổ biến (SonarQube, Semgrep).',
   DATE_ADD(CURRENT_DATE(), INTERVAL -20 DAY), 'DONE',
   'Tài liệu phân tích yêu cầu rất chi tiết, nắm vững các vector tấn công phổ biến.', 0, NOW(6) - INTERVAL 25 DAY, NOW(6) - INTERVAL 18 DAY),

  (2, 2, 6, 'Thiết kế kiến trúc hệ thống Microservices và cơ sở dữ liệu',
   'Vẽ sơ đồ C4 Model, kiến trúc Microservices giao tiếp qua gRPC & Kafka, mô hình dữ liệu quan hệ 3NF.',
   DATE_ADD(CURRENT_DATE(), INTERVAL -10 DAY), 'DONE',
   'Kiến trúc phân rã dịch vụ hợp lý, có tính đến khả năng mở rộng pod linh hoạt.', 0, NOW(6) - INTERVAL 18 DAY, NOW(6) - INTERVAL 9 DAY),

  (3, 2, 7, 'Xây dựng module phân tích cú pháp AST (Abstract Syntax Tree)',
   'Hiện thực bộ parser AST bằng Java Parser để quét lỗ hổng SQL Injection và Hardcoded Secrets.',
   DATE_ADD(CURRENT_DATE(), INTERVAL -2 DAY), 'DONE',
   'Module xử lý tốt các pattern truy vấn phức tạp, tốc độ quét nhanh.', 0, NOW(6) - INTERVAL 10 DAY, NOW(6) - INTERVAL 1 DAY),

  (4, 2, 5, 'Tích hợp mô hình ngôn ngữ lớn LLM để sinh khuyến nghị sửa lỗi code',
   'Xây dựng pipeline RAG kết nối vector database lưu trữ CVEs và best security practices.',
   DATE_ADD(CURRENT_DATE(), INTERVAL 5 DAY), 'IN_PROGRESS',
   'Cần tối ưu hóa latency khi gửi prompt và thêm cơ chế rate limiting cho API.', 0, NOW(6) - INTERVAL 5 DAY, NOW(6)),

  (5, 2, 6, 'Xây dựng giao diện Dashboard React và biểu đồ bảo mật tổng quan',
   'Thiết kế giao diện hiển thị danh sách lỗ hổng, mức độ nghiêm trọng (CVSS), biểu đồ xu hướng.',
   DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY), 'IN_PROGRESS',
   NULL, 0, NOW(6) - INTERVAL 4 DAY, NOW(6)),

  (6, 2, 7, 'Kiểm thử tải hiệu năng (Load Testing) và đóng gói Docker/K8s',
   'Sử dụng k6 hoặc Apache JMeter mô phỏng 1000 requests đồng thời, kiểm tra giới hạn CPU/RAM.',
   DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY), 'TODO',
   NULL, 0, NOW(6) - INTERVAL 2 DAY, NOW(6)),

  (7, 2, 5, 'Soạn thảo Báo cáo toàn văn KLTN và chuẩn bị Slide bảo vệ',
   'Hoàn thiện toàn bộ các chương 1 đến 5 theo đúng định dạng quy chuẩn của trường ĐH Sư phạm Kỹ thuật.',
   DATE_ADD(CURRENT_DATE(), INTERVAL 20 DAY), 'TODO',
   NULL, 0, NOW(6) - INTERVAL 1 DAY, NOW(6)),

  -- Team 3 (Vision AI - Topic 4: LLM Clinical Support)
  (8, 3, 22, 'Thu thập và tiền xử lý bộ dữ liệu bệnh án y khoa ẩn danh',
   'Khử định danh dữ liệu y tế theo chuẩn HIPAA, phân đoạn văn bản và trích xuất thực thể y khoa.',
   DATE_ADD(CURRENT_DATE(), INTERVAL -15 DAY), 'DONE',
   'Dữ liệu làm sạch rất kỹ lưỡng, đảm bảo tính bảo mật danh tính bệnh nhân.', 0, NOW(6) - INTERVAL 20 DAY, NOW(6) - INTERVAL 14 DAY),

  (9, 3, 23, 'Xây dựng Vector Database Qdrant và cơ chế Hybrid Search',
   'Lập chỉ mục các hướng dẫn điều trị của Bộ Y tế và WHO bằng mô hình embedding BioBERT.',
   DATE_ADD(CURRENT_DATE(), INTERVAL -5 DAY), 'DONE',
   'Tốc độ truy xuất vector đạt dưới 50ms, độ chính xác Semantic Search cao.', 0, NOW(6) - INTERVAL 14 DAY, NOW(6) - INTERVAL 4 DAY),

  (10, 3, 24, 'Thiết kế giao diện hỗ trợ chẩn đoán cho bác sĩ chuyên khoa',
   'Giao diện cho phép bác sĩ nhập triệu chứng, xem phác đồ đề xuất kèm nguồn trích dẫn y văn.',
   DATE_ADD(CURRENT_DATE(), INTERVAL 6 DAY), 'IN_PROGRESS',
   NULL, 0, NOW(6) - INTERVAL 6 DAY, NOW(6)),

  (11, 3, 22, 'Đánh giá độ chính xác chẩn đoán cùng hội đồng bác sĩ cố vấn',
   'Kiểm thử mù đôi trên 200 ca bệnh thực tế để đo lường độ chính xác Top-1 và Top-3.',
   DATE_ADD(CURRENT_DATE(), INTERVAL 16 DAY), 'TODO',
   NULL, 0, NOW(6) - INTERVAL 3 DAY, NOW(6)),

  -- Team 4 (CloudOps Pioneers - Topic 2: Smart Campus IoT)
  (12, 4, 25, 'Cấu hình Broker MQTT EMQX và kiến trúc gom telemetry',
   'Thiết lập cluster MQTT bảo mật bằng TLS và JWT token xác thực thiết bị đầu cuối.',
   DATE_ADD(CURRENT_DATE(), INTERVAL -12 DAY), 'DONE',
   'Broker cấu hình đúng chuẩn, chịu tải tốt khi giả lập 500 cảm biến.', 0, NOW(6) - INTERVAL 18 DAY, NOW(6) - INTERVAL 11 DAY),

  (13, 4, 26, 'Lập trình firmware ESP32 đo nhiệt độ, độ ẩm và điện năng',
   'Viết code C++ FreeRTOS cho ESP32, thu thập dữ liệu từ cảm biến Modbus RTU.',
   DATE_ADD(CURRENT_DATE(), INTERVAL -3 DAY), 'DONE',
   'Mạch hoạt động ổn định, có chế độ tiết kiệm năng lượng Deep Sleep.', 0, NOW(6) - INTERVAL 12 DAY, NOW(6) - INTERVAL 2 DAY),

  (14, 4, 27, 'Tích hợp TimeScaleDB và Spring Boot WebSocket stream',
   'Lưu trữ dữ liệu chuỗi thời gian và đẩy dữ liệu realtime lên web client qua STOMP.',
   DATE_ADD(CURRENT_DATE(), INTERVAL 4 DAY), 'IN_PROGRESS',
   NULL, 0, NOW(6) - INTERVAL 5 DAY, NOW(6)),

  (15, 4, 25, 'Triển khai bản đồ nhiệt độ (Heatmap) tòa nhà học đường',
   'Vẽ sơ đồ mặt bằng các tầng và thể hiện mức tiêu thụ năng lượng theo mã màu trực quan.',
   DATE_ADD(CURRENT_DATE(), INTERVAL 15 DAY), 'TODO',
   NULL, 0, NOW(6) - INTERVAL 2 DAY, NOW(6)),

  -- Team 5 (FinTech Analytics - Topic 5: Algorithmic Trading)
  (16, 5, 28, 'Xây dựng engine mô phỏng khớp lệnh LOB (Limit Order Book)',
   'Thuật toán khớp lệnh theo nguyên tắc ưu tiên giá và thời gian (Price-Time Priority).',
   DATE_ADD(CURRENT_DATE(), INTERVAL -10 DAY), 'DONE',
   'Thuật toán khớp lệnh đạt tốc độ xử lý hơn 50.000 orders/giây.', 0, NOW(6) - INTERVAL 15 DAY, NOW(6) - INTERVAL 8 DAY),

  (17, 5, 29, 'Tích hợp mô hình tính toán rủi ro danh mục VaR (Value at Risk)',
   'Hiện thực phương pháp Monte Carlo Simulation và Historical Simulation để dự báo độ sụt giảm.',
   DATE_ADD(CURRENT_DATE(), INTERVAL 5 DAY), 'IN_PROGRESS',
   'Cần song song hóa tính toán Monte Carlo bằng ThreadPool để giảm thời gian chạy.', 0, NOW(6) - INTERVAL 6 DAY, NOW(6)),

  (18, 5, 30, 'Xây dựng giao diện đặt lệnh và biểu đồ nến Candlestick TradingView',
   'Tích hợp Lightweight Charts hiển thị diễn biến thị trường và trạng thái danh mục đầu tư.',
   DATE_ADD(CURRENT_DATE(), INTERVAL 12 DAY), 'TODO',
   NULL, 0, NOW(6) - INTERVAL 3 DAY, NOW(6)),

  -- Team 6 (CyberSec Hunters - Topic 7: Zero-Trust eBPF Platform)
  (19, 6, 31, 'Lập trình probe eBPF kprobe/tracepoint giám sát TCP socket',
   'Bắt các sự kiện kết nối mạng bất thường và ghi nhận địa chỉ IP/Port cấp độ nhân Linux.',
   DATE_ADD(CURRENT_DATE(), INTERVAL -8 DAY), 'DONE',
   'Probe hoạt động mượt mà trong kernel space mà không gây suy giảm hiệu năng CPU.', 0, NOW(6) - INTERVAL 14 DAY, NOW(6) - INTERVAL 7 DAY),

  (20, 6, 32, 'Xây dựng module phát hiện tấn công Lateral Movement',
   'Ánh xạ các hành vi truy cập trái phép vào khung ma trận MITRE ATT&CK Enterprise.',
   DATE_ADD(CURRENT_DATE(), INTERVAL 8 DAY), 'IN_PROGRESS',
   NULL, 0, NOW(6) - INTERVAL 5 DAY, NOW(6)),

  (21, 6, 33, 'Hiện thực đồ thị tương tác mạng lưới các Kubernetes Pod',
   'Trực quan hóa luồng dữ liệu giữa các microservices và cảnh báo trực tiếp pod bị nhiễm mã độc.',
   DATE_ADD(CURRENT_DATE(), INTERVAL 18 DAY), 'TODO',
   NULL, 0, NOW(6) - INTERVAL 1 DAY, NOW(6));

