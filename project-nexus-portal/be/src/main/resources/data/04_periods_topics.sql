-- ==========================================================
-- 04_periods_topics.sql: Registration Periods and Topics Seed Data
-- ==========================================================

-- 1. Registration Periods
INSERT INTO registration_periods (id, name, academic_year, semester, start_date, end_date, submission_deadline, status, created_at, updated_at) VALUES
  (1, 'Học kỳ 1 (2026 - 2027)', '2026-2027', 1, '2026-09-01 00:00:00', '2026-11-30 23:59:59', '2027-01-15 17:00:00', 'OPEN', NOW(6), NOW(6)),
  (2, 'Học kỳ 2 (2026 - 2027)', '2026-2027', 2, '2027-02-01 00:00:00', '2027-04-30 23:59:59', '2027-06-15 17:00:00', 'DRAFT', NOW(6), NOW(6)),
  (3, 'Học kỳ 2 (2024 - 2025)', '2024-2025', 2, '2025-02-15 00:00:00', '2025-05-15 23:59:59', '2025-06-10 17:00:00', 'COMPLETED', NOW(6), NOW(6)),
  (4, 'Học kỳ 2 (2025 - 2026)', '2025-2026', 2, '2026-02-01 00:00:00', '2026-04-30 23:59:59', '2026-06-15 17:00:00', 'COMPLETED', NOW(6), NOW(6)),
  (5, 'Học kỳ 1 (2025 - 2026)', '2025-2026', 1, '2025-09-01 00:00:00', '2025-11-30 23:59:59', '2026-01-15 17:00:00', 'CLOSED', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  status = VALUES(status),
  academic_year = VALUES(academic_year),
  semester = VALUES(semester),
  start_date = VALUES(start_date),
  end_date = VALUES(end_date),
  submission_deadline = VALUES(submission_deadline);

-- 2. Registration Period Targeted Faculties
DELETE FROM registration_period_faculties WHERE period_id BETWEEN 1 AND 5;
INSERT INTO registration_period_faculties (period_id, faculty_id) VALUES
  (1, 1), (1, 2), (1, 3),
  (2, 1), (2, 2), (2, 3),
  (3, 1), (3, 2),
  (4, 1), (4, 2), (4, 3),
  (5, 1), (5, 2), (5, 3);

-- 3. Registration Period Targeted Cohorts
DELETE FROM registration_period_cohorts WHERE period_id BETWEEN 1 AND 5;
INSERT INTO registration_period_cohorts (period_id, cohort_id) VALUES
  (1, 1), -- Period 1 for K21
  (2, 1), -- Period 2 for K21
  (3, 2), -- Period 3 for K22
  (4, 1),
  (5, 4);

-- 4. Diverse Topic Marketplace Seed Data (20 Topics)
INSERT INTO topics (id, title, description, objectives, requirements, department_id, period_id, type, max_students, duration, status, is_registration_open, created_at, updated_at) VALUES
  (1, 'Hệ thống Quét lỗ hổng mã nguồn bằng AI', 
   'Nền tảng tự động quét mã nguồn và phát hiện lỗ hổng bảo mật sử dụng LLM.',
   'Xây dựng dashboard quản trị, webhook CI/CD và chấm điểm lỗ hổng.',
   'Spring Boot, Python FastAPI, ReactJS, AST parsing.',
   1, 1, 'GRADUATION_THESIS', 3, '15 tuần', 'ASSIGNED', 0, NOW(6), NOW(6)),

  (2, 'Hệ thống IoT Giám sát Môi trường Smart Campus',
   'Thu thập dữ liệu cảm biến và theo dõi năng lượng giảng đường theo thời gian thực.',
   'Cổng kết nối MQTT, bảng điều khiển trực quan và cảnh báo tức thời.',
   'Giao thức MQTT, Spring Boot WebSocket, ReactJS, TimeSeries DB.',
   2, 1, 'CAPSTONE_PROJECT', 3, '15 tuần', 'ASSIGNED', 0, NOW(6), NOW(6)),

  (3, 'Nền tảng Xác thực Văn bằng bằng Blockchain',
   'Xác thực bằng tốt nghiệp và bảng điểm chống giả mạo trên mạng Ethereum.',
   'Tích hợp ví điện tử, cổng cấp bằng cho trường và quét mã QR xác thực.',
   'Solidity, Web3.js, Spring Boot, ReactJS.',
   3, 1, 'GRADUATION_THESIS', 3, '15 tuần', 'ASSIGNED', 0, NOW(6), NOW(6)),

  (4, 'Trợ lý Hỗ trợ Chẩn đoán Lâm sàng bằng LLM',
   'Trợ lý hỏi đáp RAG hỗ trợ bác sĩ tra cứu bệnh án và hướng dẫn điều trị.',
   'Tìm kiếm ngữ nghĩa Vector DB, giao diện bác sĩ và trích xuất thuật ngữ y khoa.',
   'Python, LangChain, Qdrant/Milvus, React, Spring Boot.',
   4, 1, 'GRADUATION_THESIS', 3, '15 tuần', 'ASSIGNED', 0, NOW(6), NOW(6)),

  (5, 'Hệ thống Giao dịch Tần suất cao & Quản trị Rủi ro',
   'Động cơ khớp lệnh chứng khoán mô phỏng và tính toán rủi ro thời gian thực.',
   'Mô phỏng khớp lệnh độ trễ thấp, backtest dữ liệu lịch sử và biểu đồ.',
   'Java, Kafka, Redis, WebSocket, React.',
   3, 1, 'GRADUATION_THESIS', 3, '15 tuần', 'ASSIGNED', 0, NOW(6), NOW(6)),

  (6, 'Điều hướng Robot Tự hành AMR trong Nhà kho',
   'Nghiên cứu thuật toán LiDAR SLAM và lập quỹ đạo di chuyển cho xe AGV/AMR.',
   'Mô phỏng trên Gazebo, thử nghiệm tránh vật cản và điều khiển từ xa.',
   'ROS2, C++, Python, Computer Vision, MQTT, React.',
   6, 1, 'GRADUATION_THESIS', 2, '15 tuần', 'OPEN', 1, NOW(6), NOW(6)),

  (7, 'Nền tảng Vi phân đoạn Zero-Trust Cloud Native',
   'Giám sát lưu lượng mạng bằng eBPF và phát hiện bất thường trên cụm Kubernetes.',
   'Cảm biến thăm dò eBPF, cảnh báo theo khung MITRE ATT&CK và bản đồ mạng.',
   'Go/Rust, Linux eBPF, Kubernetes, Python ML, React.',
   2, 1, 'GRADUATION_THESIS', 3, '15 tuần', 'ASSIGNED', 0, NOW(6), NOW(6)),

  (8, 'Điều tiết Giao thông Thông minh theo Thời gian thực',
   'Hệ thống điều khiển đèn giao thông thích ứng sử dụng camera AI YOLOv10.',
   'Đếm mật độ phương tiện theo làn và tự động điều chỉnh chu kỳ đèn.',
   'PyTorch, YOLO, OpenCV, Python, React.',
   4, 1, 'CAPSTONE_PROJECT', 3, '15 tuần', 'OPEN', 1, NOW(6), NOW(6)),

  (9, 'Kiến trúc Microservices E-Commerce chuẩn Saga',
   'Hệ thống thương mại điện tử phân tán áp dụng Event Sourcing, CQRS và Saga.',
   'Rollback giao dịch phân tán, OpenTelemetry tracing và tích hợp thanh toán.',
   'Spring Cloud, Kafka, Docker, Kubernetes, Next.js.',
   1, 1, 'GRADUATION_THESIS', 3, '15 tuần', 'OPEN', 1, NOW(6), NOW(6)),

  (10, 'Hệ thống ERP SaaS Đa người thuê cho Doanh nghiệp',
   'Phần mềm quản trị nguồn lực doanh nghiệp tích hợp kho, bán hàng và sản xuất.',
   'Bảo mật phân quyền dữ liệu hàng, tự động hóa quy trình và xuất báo cáo.',
   'Spring Boot, MySQL, Tailwind CSS, React, Redis.',
   1, 1, 'GRADUATION_THESIS', 3, '15 tuần', 'OPEN', 1, NOW(6), NOW(6)),

  (11, 'Phát hiện Gian lận Giao dịch FinTech bằng Graph AI',
   'Phát hiện rửa tiền và chiếm đoạt tài khoản ngân hàng dựa trên mạng đồ thị.',
   'Mô hình hóa đồ thị giao dịch trên Neo4j và giao diện điều tra rủi ro.',
   'Python, PyTorch Geometric, Neo4j, FastAPI, React.',
   4, 1, 'GRADUATION_THESIS', 3, '15 tuần', 'OPEN', 1, NOW(6), NOW(6)),

  (12, 'Giám sát Sâu bệnh Cây trồng bằng Drone Nông nghiệp',
   'Xử lý ảnh bay chụp đa phổ phát hiện sớm sâu bệnh và tối ưu phân bón.',
   'Ghép ảnh drone orthomosaic, tính toán chỉ số NDVI và xuất bản đồ nhiệt.',
   'OpenCV, PyTorch, GeoJSON, Mapbox, Spring Boot.',
   2, 1, 'CAPSTONE_PROJECT', 2, '15 tuần', 'OPEN', 1, NOW(6), NOW(6)),

  (13, 'Hệ thống Danh tính Phi tập trung (DID) Y tế',
   'Chia sẻ hồ sơ bệnh án xuyên viện tuân thủ chuẩn W3C DID và bảo mật dữ liệu.',
   'Xác minh bằng chứng không tiết lộ tri thức (ZKP) và ví điện tử bệnh nhân.',
   'TypeScript, Hyperledger, WebAssembly, React Native.',
   3, 1, 'RESEARCH', 2, '15 tuần', 'OPEN', 1, NOW(6), NOW(6)),

  (14, 'Quy trình Tự động Đánh giá An ninh & Quét Lỗ hổng',
   'Tự động hóa kiểm thử xâm nhập kết hợp phân tích tĩnh và động cho web app.',
   'Tích hợp Nuclei, OWASP ZAP, Trivy và xuất báo cáo kiểm định bảo mật.',
   'Python, Docker API, Go, React, Spring Boot.',
   2, 1, 'GRADUATION_THESIS', 3, '15 tuần', 'OPEN', 1, NOW(6), NOW(6)),

  (15, 'Ứng dụng Khám bệnh Từ xa Telemedicine Đa nền tảng',
   'Ứng dụng tư vấn bác sĩ qua video mã hóa WebRTC và đo chỉ số sinh tồn Bluetooth.',
   'Kết nối thiết bị đo nhịp tim BLE, kê đơn thuốc điện tử và đặt lịch hẹn.',
   'Flutter, WebRTC, Firebase, Spring Boot, React.',
   1, 1, 'CAPSTONE_PROJECT', 2, '15 tuần', 'OPEN', 1, NOW(6), NOW(6)),

  (16, 'Hệ thống Cảnh báo Tài xế Ngủ gật bằng Edge AI',
   'Camera hành trình thông minh cảnh báo mắt nhắm, ngáp ngủ và dùng điện thoại.',
   'Triển khai mô hình nhẹ trên Raspberry Pi / Jetson Nano kèm còi báo động.',
   'TensorFlow Lite, MediaPipe, OpenCV, Python, React.',
   4, 1, 'GRADUATION_THESIS', 3, '15 tuần', 'OPEN', 1, NOW(6), NOW(6)),

  (17, 'Hệ thống Đo lường & Dự báo Năng lượng Thông minh',
   'Đồng hồ đo điện thông minh LoRaWAN dự báo tiêu thụ năng lượng bằng LSTM.',
   'Cổng thu phát LoRa, giao thức MQTT và bảng phân tích phụ tải đỉnh.',
   'Embedded C, LoRaWAN, Python, TimeScaleDB, React.',
   2, 1, 'CAPSTONE_PROJECT', 2, '15 tuần', 'OPEN', 1, NOW(6), NOW(6)),

  (18, 'Học liên kết (Federated Learning) Phân tích Ảnh Y tế',
   'Huấn luyện mô hình phân loại khối u trên nhiều bệnh viện mà không chia sẻ dữ liệu gốc.',
   'Đảm bảo quyền riêng tư dữ liệu bệnh án với Differential Privacy.',
   'PyTorch, Flower FL, Opacus Differential Privacy.',
   4, 1, 'RESEARCH', 2, '15 tuần', 'OPEN', 1, NOW(6), NOW(6)),

  (19, 'Trợ lý Hỏi đáp Doanh nghiệp trên Đồ thị Tri thức',
   'Trích xuất thực thể tài liệu xây dựng Knowledge Graph nâng cao độ chính xác LLM.',
   'Quy trình Graph RAG và giao diện trực quan hóa đồ thị tri thức.',
   'Python, Neo4j, LlamaIndex, React Cytoscape.',
   3, 1, 'GRADUATION_THESIS', 3, '15 tuần', 'PENDING_APPROVAL', 1, NOW(6), NOW(6)),

  (20, 'Cổng Edge Gateway Bảo trì Dự đoán Thiết bị Công nghiệp',
   'Phân tích tín hiệu rung động FFT và phát hiện sớm hư hỏng bạc đạn motor.',
   'Cảnh báo sự cố máy móc và tự động tạo phiếu bảo trì.',
   'Edge Impulse, Python, C++, InfluxDB, React.',
   6, 1, 'CAPSTONE_PROJECT', 2, '15 tuần', 'PENDING_APPROVAL', 1, NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  description = VALUES(description),
  objectives = VALUES(objectives),
  requirements = VALUES(requirements),
  department_id = VALUES(department_id),
  period_id = VALUES(period_id),
  type = VALUES(type),
  max_students = VALUES(max_students),
  duration = VALUES(duration),
  status = VALUES(status),
  is_registration_open = VALUES(is_registration_open),
  updated_at = NOW(6);

-- 5. Topic Lecturers (Advisors)
DELETE FROM topic_lecturers WHERE topic_id BETWEEN 1 AND 20;
INSERT INTO topic_lecturers (topic_id, lecturer_id, advisor_role, created_at, updated_at) VALUES
  (1, 3, 'PRIMARY', NOW(6), NOW(6)),
  (1, 13, 'CO_ADVISOR', NOW(6), NOW(6)),
  (2, 14, 'PRIMARY', NOW(6), NOW(6)),
  (2, 3, 'CO_ADVISOR', NOW(6), NOW(6)),
  (3, 16, 'PRIMARY', NOW(6), NOW(6)),
  (3, 4, 'CO_ADVISOR', NOW(6), NOW(6)),
  (4, 15, 'PRIMARY', NOW(6), NOW(6)),
  (4, 18, 'CO_ADVISOR', NOW(6), NOW(6)),
  (5, 16, 'PRIMARY', NOW(6), NOW(6)),
  (6, 13, 'PRIMARY', NOW(6), NOW(6)),
  (7, 14, 'PRIMARY', NOW(6), NOW(6)),
  (7, 21, 'CO_ADVISOR', NOW(6), NOW(6)),
  (8, 15, 'PRIMARY', NOW(6), NOW(6)),
  (9, 3, 'PRIMARY', NOW(6), NOW(6)),
  (9, 17, 'CO_ADVISOR', NOW(6), NOW(6)),
  (10, 17, 'PRIMARY', NOW(6), NOW(6)),
  (11, 15, 'PRIMARY', NOW(6), NOW(6)),
  (12, 14, 'PRIMARY', NOW(6), NOW(6)),
  (13, 16, 'PRIMARY', NOW(6), NOW(6)),
  (14, 14, 'PRIMARY', NOW(6), NOW(6)),
  (15, 3, 'PRIMARY', NOW(6), NOW(6)),
  (16, 15, 'PRIMARY', NOW(6), NOW(6)),
  (17, 14, 'PRIMARY', NOW(6), NOW(6)),
  (18, 15, 'PRIMARY', NOW(6), NOW(6)),
  (19, 16, 'PRIMARY', NOW(6), NOW(6)),
  (20, 13, 'PRIMARY', NOW(6), NOW(6));

-- 6. Allowed Majors for Topics
DELETE FROM topic_majors WHERE topic_id BETWEEN 1 AND 20;
INSERT INTO topic_majors (topic_id, major_id) VALUES
  (1, 1), (1, 5),
  (2, 4), (2, 5), (2, 1),
  (3, 2), (3, 1), (3, 5),
  (4, 3), (4, 1),
  (5, 2), (5, 3),
  (6, 6), (6, 7), (6, 1),
  (7, 4), (7, 1), (7, 3),
  (8, 3), (8, 1),
  (9, 1), (9, 2), (9, 5),
  (10, 1), (10, 2),
  (11, 3), (11, 2),
  (12, 4), (12, 6),
  (13, 2), (13, 1),
  (14, 4), (14, 1),
  (15, 1), (15, 5),
  (16, 3), (16, 1),
  (17, 4), (17, 6),
  (18, 3), (18, 1),
  (19, 2), (19, 3),
  (20, 6), (20, 7);
