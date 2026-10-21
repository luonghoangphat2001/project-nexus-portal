# 20 KỊCH BẢN KIỂM THỬ NGHIỆP VỤ THỰC TẾ (20 END-TO-END BUSINESS TEST CASES)
## HỆ THỐNG QUẢN LÝ ĐĂNG KÝ VÀ CHẤM KHÓA LUẬN TỐT NGHIỆP (PROJECT NEXUS PORTAL)

---

### THÔNG TIN MÔI TRƯỜNG & TÀI KHOẢN DỮ LIỆU THẬT
- **Frontend URL**: `http://localhost:5173` (hoặc `http://localhost:3000`)
- **Backend API**: `http://localhost:8080/api`
- **Swagger Documentation**: `http://localhost:8080/swagger` (Redirect sang `http://localhost:8080/swagger-ui.html`)
- **Bộ tài khoản thực nghiệm (Seed Data - Mật khẩu chung: `password123`):**
  - **Admin**: `superadmin` (Quản trị viên toàn hệ thống)
  - **Trưởng khoa / Trưởng bộ môn**: `principal` (TS. Nguyễn Văn Quản - KTPM)
  - **Giảng viên hướng dẫn**: `teacher` (ThS. Trần Hoàng Nam - KTPM)
  - **Thành viên hội đồng / Phản biện**: `council` (Prof. Hội Đồng Đánh Giá)
  - **Sinh viên 1 (Trưởng nhóm)**: `student` (Lê Anh Tuấn - MSSV: 21110001)
  - **Sinh viên 2 (Thành viên)**: `student2` (Phạm Minh Quân - MSSV: 21110002)
  - **Sinh viên 3 (Thành viên)**: `student3` (Võ Hoàng Yến - MSSV: 21110003)
  - **Sinh viên tự do (Chưa có nhóm)**: `individual_user` (Nguyễn Văn Cá Nhân - MSSV: 21110004)

---

## MA TRẬN 20 TEST CASE THEO TIẾN TRÌNH VÒNG ĐỜI KHÓA LUẬN

| Mã TC | Giai đoạn nghiệp vụ | Tên Test Case | Vai trò (Actor) | Module |
|:---:|:---|:---|:---:|:---:|
| **TC-01** | Giai đoạn 1: Khởi động | Thiết lập đợt đăng ký khóa luận & các mốc thời gian | Trưởng khoa (`principal`) | 2 |
| **TC-02** | Giai đoạn 1: Khởi động | Phát thông báo Realtime toàn khoa về đợt khóa luận mới | Trưởng khoa (`principal`) | 9 |
| **TC-03** | Giai đoạn 2: Đề tài | Giảng viên đăng ký đề tài mới thuộc Bộ môn KTPM | Giảng viên (`teacher`) | 4 |
| **TC-04** | Giai đoạn 3: Ghép đội | Sinh viên chưa có nhóm đăng tin tìm nhóm (Matchmaking) | SV tự do (`individual_user`) | 8 |
| **TC-05** | Giai đoạn 3: Ghép đội | Nhóm trưởng duyệt yêu cầu & Khóa chặn giới hạn quá 3 SV | Trưởng nhóm (`student`) | 6, 8 |
| **TC-06** | Giai đoạn 4: Đăng ký | Lướt chợ đề tài, tìm kiếm và lọc theo bộ môn KTPM | Trưởng nhóm (`student`) | 5 |
| **TC-07** | Giai đoạn 4: Đăng ký | Nhóm trưởng nộp đơn đăng ký đề tài cho nhóm | Trưởng nhóm (`student`) | 7 |
| **TC-08** | Giai đoạn 4: Đăng ký | Ngăn chặn nhóm đăng ký nhiều đề tài cùng lúc | Trưởng nhóm (`student`) | 7 |
| **TC-09** | Giai đoạn 5: Duyệt đề tài | Giảng viên duyệt đơn đăng ký & Khóa đề tài vào nhóm | Giảng viên (`teacher`) | 4, 7 |
| **TC-10** | Giai đoạn 6: Thực hiện | Phân công nhiệm vụ tiến độ khóa luận (Kanban board) | Trưởng nhóm (`student`) | 10 |
| **TC-11** | Giai đoạn 6: Thực hiện | Cập nhật tiến độ hoàn thành & Giảng viên nhận xét | Sinh viên (`student2`), GV (`teacher`) | 10 |
| **TC-12** | Giai đoạn 7: Nộp bài | Nhóm trưởng nộp báo cáo PDF & Kiểm tra chữ ký file | Trưởng nhóm (`student`) | 11, 18 |
| **TC-13** | Giai đoạn 7: Nộp bài | Nộp phiên bản 2 trước hạn & Lưu lịch sử Version độc lập | Trưởng nhóm (`student`) | 11 |
| **TC-14** | Giai đoạn 7: Nộp bài | Khóa không cho phép sinh viên nộp bài sau hạn chót | Trưởng nhóm (`student`) | 11, 18 |
| **TC-15** | Giai đoạn 8: Hội đồng | Thành lập Hội đồng đánh giá & Phân công lịch phản biện | Trưởng khoa (`principal`) | 12 |
| **TC-16** | Giai đoạn 8: Hội đồng | **Kiểm tra xung đột: Chặn GVHD tự chấm hoặc phản biện đề tài mình** | Trưởng khoa (`principal`) | 12, 18 |
| **TC-17** | Giai đoạn 9: Chấm điểm | Giảng viên phản biện chấm điểm 3 tiêu chí & Submit khóa điểm | Giảng viên phản biện (`council`) | 13, 18 |
| **TC-18** | Giai đoạn 10: Tổng kết | Tự động tính điểm trung bình (20% GVHD + 30% PB + 50% HĐ) & Xét Đậu/Rớt | Hệ thống / Trưởng khoa | 14 |
| **TC-19** | Giai đoạn 10: Tổng kết | Trưởng khoa duyệt công bố điểm (Publish) & Lưu snapshot bất biến | Trưởng khoa (`principal`) | 15, 18 |
| **TC-20** | Giai đoạn 11: Kết thúc | Sinh viên tra cứu bảng điểm & Trưởng khoa xuất báo cáo Excel | Sinh viên (`student`), Trưởng khoa | 15, 16 |

---

## CHI TIẾT 20 TEST CASE

---

### TC-01: Thiết lập đợt đăng ký khóa luận và các mốc thời gian
- **Module**: 2 (Quản lý đợt đăng ký khóa luận)
- **Mục tiêu**: Đảm bảo Trưởng khoa thiết lập được đợt đăng ký với đầy đủ các mốc: ngày mở, ngày đóng, hạn nộp báo cáo.
- **Actor**: `principal` / `password123`
- **Tiền điều kiện**: Khoa CNTT (Faculty ID: 1) và Khóa K21 (Cohort ID: 1) đã tồn tại trong CSDL.
- **Các bước thực hiện**:
  1. Đăng nhập vào hệ thống với tài khoản `principal`.
  2. Truy cập màn hình Đợt đăng ký tại URL `/periods`.
  3. Bấm **"Tạo đợt mới"**, nhập thông tin:
     - Tên đợt: `Đợt Khóa luận Tốt nghiệp Kỳ 1 Năm học 2026-2027`
     - Năm học: `2026-2027`, Học kỳ: `1`
     - Thời gian mở ĐK: `2026-09-01 00:00:00`
     - Thời gian đóng ĐK: `2026-11-30 23:59:59`
     - Hạn nộp báo cáo: `2027-01-15 17:00:00`
     - Khoa áp dụng: Chọn `Công nghệ thông tin (FIT)`
     - Khóa áp dụng: Chọn `Khóa 2021 (K21)`
  4. Bấm **"Lưu đợt đăng ký"**.
- **Kết quả mong đợi**:
  - API trả về HTTP `200 OK` (hoặc `201 Created`).
  - Đợt đăng ký mới hiển thị trạng thái `OPEN` trong danh sách.
  - CSDL lưu bản ghi mới trong bảng `registration_periods`, `registration_period_faculties`, `registration_period_cohorts`.

---

### TC-02: Phát thông báo Realtime toàn khoa về đợt khóa luận mới
- **Module**: 9 (Module thông báo) & 18 (Bảo mật & Kiểm soát dữ liệu)
- **Mục tiêu**: Kiểm tra tính năng gửi thông báo tức thời qua SSE tới toàn bộ giảng viên và sinh viên khi có đợt khóa luận mới.
- **Actor**: `principal` / `password123`
- **Tiền điều kiện**: Đợt đăng ký ở TC-01 đã được tạo thành công.
- **Các bước thực hiện**:
  1. Giữ tài khoản `student` đang đăng nhập ở tab trình duyệt khác (kết nối SSE tới `/api/notifications/stream`).
  2. Dùng tài khoản `principal`, truy cập màn hình Thông báo `/notifications`.
  3. Bấm **"Tạo thông báo mới"**:
     - Tiêu đề: `Thông báo mở đợt đăng ký Khóa luận tốt nghiệp HK1 2026-2027`
     - Nội dung: `Trưởng khoa thông báo sinh viên K21 tiến hành lập nhóm và đăng ký đề tài trước ngày 30/11/2026.`
     - Phạm vi: `Toàn khoa CNTT` (Faculty ID: 1)
  4. Bấm **"Gửi thông báo"**.
- **Kết quả mong đợi**:
  - Phía `principal`: Thông báo được tạo thành công (HTTP 200).
  - Phía `student`: Chuông thông báo `NotificationBell` lập tức tăng số lượng chưa đọc mà không cần F5 tải lại trang.
  - Khi `student` click vào chuông: Xem được nội dung thông báo và hệ thống ghi nhận `notification_reads`.

---

### TC-03: Giảng viên đăng ký đề tài mới thuộc Bộ môn KTPM
- **Module**: 4 (Quản lý đề tài)
- **Mục tiêu**: Giảng viên tạo đề tài mới với đầy đủ thông tin: mục tiêu, yêu cầu, số SV tối đa, loại đề tài.
- **Actor**: `teacher` / `password123`
- **Tiền điều kiện**: Giảng viên trực thuộc bộ môn Kỹ thuật phần mềm (Department ID: 1).
- **Các bước thực hiện**:
  1. Đăng nhập tài khoản `teacher`.
  2. Vào trang Quản lý đề tài tại `/topics`.
  3. Bấm **"Tạo đề tài mới"**, nhập dữ liệu:
     - Tên đề tài: `Nền tảng Quản trị DevOps & CI/CD Cloud-Native cho Microservices`
     - Bộ môn: `Kỹ thuật phần mềm`
     - Đợt khóa luận: `Đợt Khóa luận Tốt nghiệp Kỳ 1 Năm học 2026-2027`
     - Loại đề tài: `GRADUATION_THESIS`
     - Số sinh viên tối đa: `3`
     - Thời gian thực hiện: `15 tuần`
     - Mục tiêu: `Xây dựng giải pháp tự động hóa triển khai Kubernetes và monitoring`
     - Yêu cầu: `Nắm vững Docker, Kubernetes, CI/CD GitHub Actions, Java Spring Boot`
  4. Bấm **"Lưu và Mở đăng ký"**.
- **Kết quả mong đợi**:
  - HTTP `201 Created`.
  - Bảng `topics` lưu đề tài với `status = 'OPEN'`, `is_registration_open = 1`.
  - Bảng `topic_lecturers` ghi nhận `teacher` (User ID: 3) là `PRIMARY` advisor.

---

### TC-04: Sinh viên chưa có nhóm đăng tin tìm nhóm (Matchmaking)
- **Module**: 8 (Tìm nhóm và tìm thành viên)
- **Mục tiêu**: Sinh viên tự do đăng tin tìm đội phù hợp với kỹ năng và định hướng bộ môn của mình.
- **Actor**: `individual_user` / `password123` (MSSV: 21110004)
- **Tiền điều kiện**: Sinh viên chưa thuộc nhóm nào trong đợt đăng ký hiện tại.
- **Các bước thực hiện**:
  1. Đăng nhập với tài khoản `individual_user`.
  2. Vào trang Ghép đội & Tìm nhóm `/matchmaking`.
  3. Bấm **"Đăng tin tìm nhóm"**:
     - Loại tin: `STUDENT_LOOKING_FOR_TEAM`
     - Tiêu đề: `Sinh viên K21 chuyên ngành KTPM tìm nhóm làm khóa luận hướng Cloud/DevOps`
     - Mục tiêu: `Muốn tham gia nhóm có mục tiêu đạt điểm Giỏi, làm về Microservices hoặc AI`
     - Kỹ năng: `Docker, Java Spring Boot, ReactJS`
     - Thông tin liên hệ: `individual_user@nexus.edu.vn - SĐT: 0901000008`
  4. Bấm **"Đăng bài"**.
- **Kết quả mong đợi**:
  - HTTP `201 Created`.
  - Bài đăng xuất hiện trên bảng Matchmaking với huy hiệu "Tìm nhóm", trạng thái `OPEN`.
  - Bản ghi được lưu vào `matchmaking_posts` và kỹ năng lưu vào `matchmaking_post_skills`.

---

### TC-05: Nhóm trưởng duyệt gia nhập & Chặn nhóm vượt quá 3 sinh viên
- **Module**: 6 (Quản lý nhóm sinh viên) & 8 (Tìm nhóm và thành viên)
- **Mục tiêu**: Đảm bảo quy tắc kinh doanh: Một nhóm tối đa 3 sinh viên; khi đã đủ 3 người, hệ thống chặn không cho nhận thêm thành viên.
- **Actor**: `student` (Trưởng nhóm), `student2`, `student3`, `individual_user`
- **Tiền điều kiện**: `student` đã tạo nhóm `Team Nexus Alpha` hiện có 2 người (`student` và `student2`).
- **Các bước thực hiện**:
  1. `student3` vào `/matchmaking`, thấy bài đăng của nhóm `Team Nexus Alpha`, bấm **"Gửi yêu cầu gia nhập"**.
  2. `student` (Nhóm trưởng) vào `/teams`, xem danh sách yêu cầu chờ duyệt $\rightarrow$ Bấm **"Chấp nhận"** `student3`.
     - $\rightarrow$ Kiểm tra: Nhóm lúc này có đúng 3 thành viên (`student`, `student2`, `student3`). Trạng thái chuyển thành `READY`.
  3. `individual_user` cũng gửi yêu cầu xin gia nhập nhóm `Team Nexus Alpha`.
  4. `student` cố gắng bấm chấp nhận yêu cầu của `individual_user`.
- **Kết quả mong đợi**:
  - Bước 2: Chấp nhận `student3` thành công (HTTP 200), bảng `team_members` có 3 dòng.
  - Bước 4: Hệ thống ném ngoại lệ `BadRequestException: Team has reached the maximum capacity of 3 members.` (HTTP 400).
  - Không cho phép thêm thành viên thứ 4 vào nhóm dưới bất kỳ hình thức nào.

---

### TC-06: Lướt chợ đề tài, tìm kiếm và lọc theo bộ môn
- **Module**: 5 (Tìm kiếm và xem danh sách đề tài)
- **Mục tiêu**: Sinh viên duyệt danh sách đề tài mở, tìm kiếm từ khóa và lọc đúng đề tài của bộ môn mong muốn.
- **Actor**: `student` / `password123`
- **Tiền điều kiện**: Có ít nhất 3 đề tài thuộc các bộ môn KTPM, MMT, HTTT đang mở (`OPEN`).
- **Các bước thực hiện**:
  1. Đăng nhập tài khoản `student`.
  2. Vào trang Đề tài `/topics`.
  3. Nhập từ khóa ô tìm kiếm: `DevOps`.
  4. Chọn bộ lọc Bộ môn: `Kỹ thuật phần mềm`.
  5. Chọn bộ lọc Trạng thái: `Đang mở đăng ký`.
  6. Bấm xem chi tiết đề tài `Nền tảng Quản trị DevOps & CI/CD Cloud-Native`.
- **Kết quả mong đợi**:
  - Danh sách hiển thị đúng đề tài thỏa mãn từ khóa và bộ môn.
  - Modal chi tiết hiển thị đầy đủ: Tên GVHD, mô tả, mục tiêu, yêu cầu kiến thức và hạn cuối đăng ký.
  - Nút **"Đăng ký đề tài"** hiển thị sẵn sàng cho Trưởng nhóm.

---

### TC-07: Nhóm trưởng gửi đơn đăng ký đề tài
- **Module**: 7 (Đăng ký đề tài)
- **Mục tiêu**: Nhóm trưởng gửi đăng ký kèm lời nhắn cho giảng viên hướng dẫn.
- **Actor**: `student` / `password123`
- **Tiền điều kiện**: `student` là LEADER của nhóm đủ điều kiện; đề tài đang mở đăng ký (`is_registration_open = 1`).
- **Các bước thực hiện**:
  1. Đăng nhập tài khoản `student`.
  2. Tại trang chi tiết đề tài vừa tìm ở TC-06, bấm nút **"Đăng ký đề tài"**.
  3. Nhập lời nhắn cho giảng viên: `Nhóm em gồm 3 sinh viên K21 KTPM đã có chứng chỉ Docker & AWS, kính mong thầy hướng dẫn.`
  4. Bấm **"Xác nhận đăng ký"**.
- **Kết quả mong đợi**:
  - HTTP `201 Created`.
  - Đăng ký được ghi vào bảng `topic_registrations` với `status = 'PENDING'`, `team_id = 2`, `topic_id = ...`.
  - Sinh viên chuyển sang màn hình `/registrations` thấy đơn đăng ký ở trạng thái "Chờ duyệt".

---

### TC-08: Ngăn chặn nhóm đăng ký nhiều đề tài cùng lúc
- **Module**: 7 (Đăng ký đề tài) & 18 (Kiểm soát dữ liệu)
- **Mục tiêu**: Đảm bảo quy tắc nghiệp vụ: Một nhóm chỉ được có tối đa 1 đơn đăng ký đề tài đang chờ duyệt hoặc đã duyệt.
- **Actor**: `student` / `password123`
- **Tiền điều kiện**: Nhóm đã có 1 đơn đăng ký ở TC-07 đang ở trạng thái `PENDING`.
- **Các bước thực hiện**:
  1. Đăng nhập `student`, quay lại danh sách đề tài `/topics`.
  2. Chọn một đề tài khác (ví dụ: `AI-Powered Automated Code Review...`).
  3. Bấm **"Đăng ký đề tài"** và bấm xác nhận gửi.
- **Kết quả mong đợi**:
  - Hệ thống từ chối với HTTP `400 Bad Request`.
  - Thông báo lỗi hiển thị rõ ràng: `Your team already has an active or pending topic registration.`
  - CSDL không sinh ra bản ghi thứ hai trong `topic_registrations`.

---

### TC-09: Giảng viên duyệt đơn đăng ký & Khóa đề tài vào nhóm
- **Module**: 4 (Quản lý đề tài) & 7 (Đăng ký đề tài)
- **Mục tiêu**: Giảng viên xem danh sách nhóm đăng ký và duyệt nhóm; đề tài được chuyển trạng thái sang đã có nhóm thực hiện.
- **Actor**: `teacher` / `password123`
- **Tiền điều kiện**: Đơn đăng ký của nhóm `student` đang `PENDING`.
- **Các bước thực hiện**:
  1. Đăng nhập `teacher`, vào trang Đăng ký `/registrations` (hoặc tab Duyệt nhóm tại `/topics`).
  2. Xem thông tin nhóm đăng ký: thành viên (3 SV), chuyên ngành, lời nhắn.
  3. Nhập phản hồi: `Đồng ý tiếp nhận nhóm thực hiện đề tài này.`
  4. Bấm nút **"Duyệt đơn" (Approve)**.
- **Kết quả mong đợi**:
  - HTTP `200 OK`.
  - Bảng `topic_registrations` cập nhật `status = 'APPROVED'`, `reviewed_by = 3`, `reviewed_at = NOW()`.
  - Bảng `topics` cập nhật `status = 'ASSIGNED'` và đóng đăng ký `is_registration_open = 0`.
  - Bảng `teams` cập nhật trạng thái `LOCKED` (khóa không cho thay đổi thành viên sau khi đã có đề tài).

---

### TC-10: Thiết lập các mốc nhiệm vụ tiến độ khóa luận (Kanban board)
- **Module**: 10 (Quản lý tiến độ khóa luận)
- **Mục tiêu**: Trưởng nhóm tạo các mốc tiến độ công việc, phân công cho từng thành viên trong nhóm.
- **Actor**: `student` / `password123`
- **Tiền điều kiện**: Đăng ký đề tài đã được duyệt `APPROVED`.
- **Các bước thực hiện**:
  1. Đăng nhập `student`, vào trang Tiến độ `/progress`.
  2. Bấm **"Thêm công việc mới"**:
     - Tiêu đề: `Thiết kế kiến trúc hệ thống và luồng CI/CD Pipeline`
     - Mô tả: `Viết sơ đồ Docker Compose, Kubernetes manifests và GitHub Actions workflow`
     - Người thực hiện: Chọn `Phạm Minh Quân (student2)`
     - Hạn nộp (Due date): `2026-10-25 23:59:59` (trước hạn nộp báo cáo cuối kỳ)
  3. Bấm **"Tạo công việc"**.
- **Kết quả mong đợi**:
  - HTTP `201 Created`.
  - Thẻ công việc xuất hiện trong cột `TODO` trên bảng Kanban.
  - Bảng `progress_tasks` lưu bản ghi liên kết `team_id`, `assignee_id = 6`, `status = 'TODO'`.

---

### TC-11: Cập nhật trạng thái tiến độ & Giảng viên nhận xét
- **Module**: 10 (Quản lý tiến độ khóa luận)
- **Mục tiêu**: Thành viên cập nhật trạng thái task cá nhân; Giảng viên hướng dẫn ghi nhận đánh giá.
- **Actor**: `student2` (Thực hiện), `teacher` (Nhận xét)
- **Tiền điều kiện**: Nhiệm vụ tạo ở TC-10 đang ở trạng thái `TODO`.
- **Các bước thực hiện**:
  1. Đăng nhập `student2`, vào trang `/progress`.
  2. Kéo thả hoặc click đổi trạng thái task từ `TODO` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `DONE`.
  3. Đăng nhập `teacher`, vào trang `/progress` $\rightarrow$ Chọn nhóm hướng dẫn `Team Nexus Alpha`.
  4. Bấm vào task vừa hoàn thành, nhập nhận xét: `Kiến trúc thiết kế tốt, đảm bảo tính bảo mật và khả năng mở rộng container.`
  5. Bấm **"Lưu nhận xét"**.
- **Kết quả mong đợi**:
  - Bước 2: API cập nhật `status = 'DONE'`, thanh tỷ lệ tiến độ nhóm tăng %.
  - Bước 5: Bảng `progress_tasks` lưu `feedback`, `feedback_by = 3`, `feedback_at = NOW()`.

---

### TC-12: Nhóm trưởng nộp báo cáo PDF & Kiểm tra chữ ký an toàn tập tin
- **Module**: 11 (Nộp báo cáo và tài liệu) & 18 (Bảo mật & Kiểm soát dữ liệu)
- **Mục tiêu**: Kiểm tra tính năng nộp báo cáo PDF hợp lệ và cơ chế ngăn chặn tập tin giả mạo/đổi đuôi độc hại.
- **Actor**: `student` / `password123`
- **Tiền điều kiện**: Nhóm đã có đề tài được duyệt; trước hạn `submission_deadline`.
- **Các bước thực hiện**:
  1. Đăng nhập `student`, vào trang Báo cáo `/reports`.
  2. **Thử nghiệm sai (Attack test)**: Tạo 1 file text nội dung rác và đổi đuôi thành `fake_report.pdf`, bấm Nộp.
     - $\rightarrow$ Kiểm tra: Hệ thống kiểm tra magic bytes `%PDF-`, từ chối file với lỗi `400 Bad Request: Invalid PDF signature`.
  3. **Thực hiện đúng**: Chọn file PDF chuẩn `Bao_Cao_Khoa_Luan_Nhom_Nexus.pdf` (dung lượng 2.5MB < 10MB).
     - Loại tài liệu: `REPORT`
     - Tiêu đề: `Báo cáo toàn văn Khóa luận tốt nghiệp - Đợt 1`
     - Ghi chú: `Bản nộp đợt 1 hoàn thiện đầy đủ các chương 1 đến 5.`
  4. Bấm **"Nộp tài liệu"**.
- **Kết quả mong đợi**:
  - Bước 2: Bị chặn thành công, bảo vệ an toàn CSDL.
  - Bước 4: HTTP `201 Created`. Bảng `report_documents` lưu `document_version = 1`, `document_type = 'REPORT'`, `content` lưu dạng LONGBLOB.

---

### TC-13: Nộp phiên bản 2 trước hạn & Lưu lịch sử Version độc lập
- **Module**: 11 (Nộp báo cáo và tài liệu)
- **Mục tiêu**: Cho phép sinh viên nộp lại trước hạn; hệ thống tự động tăng số version và giữ nguyên bản cũ.
- **Actor**: `student` / `password123`
- **Tiền điều kiện**: Đã có Version 1 nộp ở TC-12.
- **Các bước thực hiện**:
  1. Đăng nhập `student`, vào trang `/reports`.
  2. Bấm nộp tài liệu mới với cùng loại `REPORT`:
     - File: `Bao_Cao_Khoa_Luan_Nhom_Nexus_v2_ChinhSua.pdf`
     - Tiêu đề: `Báo cáo khóa luận (Bản cập nhật bổ sung)`
     - Ghi chú: `Đã chỉnh sửa theo góp ý của thầy hướng dẫn.`
  3. Bấm **"Nộp tài liệu"**.
- **Kết quả mong đợi**:
  - HTTP `201 Created`.
  - Danh sách tài liệu của nhóm hiển thị cả 2 phiên bản: `Version 1` và `Version 2`.
  - Bấm nút "Tải xuống" ở cả 2 phiên bản: Tải về đúng nội dung từng file Base64 không bị ghi đè.

---

### TC-14: Khóa không cho phép sinh viên nộp bài sau hạn chót (Deadline)
- **Module**: 11 (Nộp báo cáo và tài liệu) & 18 (Bảo mật & Kiểm soát dữ liệu)
- **Mục tiêu**: Đảm bảo sau thời điểm `submission_deadline`, sinh viên không thể upload thêm tài liệu.
- **Actor**: `student` / `password123`
- **Tiền điều kiện**: Đợt đăng ký có `submission_deadline` nhỏ hơn thời gian hiện tại (hoặc mô phỏng gọi API nộp bài cho đợt đã hết hạn).
- **Các bước thực hiện**:
  1. Đăng nhập `student`, vào trang `/reports`.
  2. Gửi request POST upload file lên endpoint `/api/reports/registrations/{id}/documents`.
- **Kết quả mong đợi**:
  - Hệ thống kiểm tra thời gian thực tế `LocalDateTime.now()` với `submission_deadline`.
  - Trả về HTTP `400 Bad Request`.
  - Thông báo lỗi: `The report submission deadline has passed. Submissions are now locked.`
  - Giao diện vô hiệu hóa (disabled) nút nộp bài.

---

### TC-15: Thành lập Hội đồng đánh giá & Phân công lịch phản biện
- **Module**: 12 (Phân công hội đồng chấm)
- **Mục tiêu**: Trưởng khoa/Bộ môn tạo Hội đồng gồm Chủ tịch, Thư ký, Phản biện và gán nhóm sinh viên vào hội đồng.
- **Actor**: `principal` / `password123`
- **Tiền điều kiện**: Bộ môn KTPM có đủ giảng viên không bị trùng lịch.
- **Các bước thực hiện**:
  1. Đăng nhập `principal`, vào trang Hội đồng `/councils`.
  2. Bấm **"Tạo hội đồng mới"**:
     - Tên hội đồng: `Hội đồng Chấm Khóa luận KTPM - Hội trường A3`
     - Bộ môn: `Kỹ thuật phần mềm`
     - Phòng: `Phòng A3-201`
     - Thời gian: Bắt đầu `2027-01-20 08:00:00`, Kết thúc `2027-01-20 12:00:00`
     - Thành viên:
       - Chủ tịch (PRESIDENT): `principal` (TS. Nguyễn Văn Quản)
       - Thư ký (SECRETARY): Một giảng viên khác trong bộ môn
       - Phản biện (REVIEWER): `council` (Prof. Hội Đồng Đánh Giá)
  3. Bấm **"Lưu hội đồng"**.
  4. Tại mục Phân công (Assignments), chọn nhóm `Team Nexus Alpha` $\rightarrow$ Bấm **"Phân công vào hội đồng"**.
- **Kết quả mong đợi**:
  - Tạo hội đồng thành công với trạng thái `SCHEDULED` (HTTP 201).
  - Bảng `defense_assignments` liên kết `council_id` với `registration_id` của nhóm.

---

### TC-16: Kiểm tra xung đột: Chặn GVHD tự chấm hoặc phản biện đề tài mình
- **Module**: 12 (Phân công hội đồng chấm) & 18 (Bảo mật & Kiểm soát dữ liệu)
- **Mục tiêu**: Kiểm tra tính toàn vẹn và công bằng: Giảng viên hướng dẫn tuyệt đối không được phân công làm người phản biện (REVIEWER) cho đề tài do chính mình hướng dẫn.
- **Actor**: `principal` / `password123`
- **Tiền điều kiện**: `teacher` là PRIMARY advisor của nhóm `Team Nexus Alpha`.
- **Các bước thực hiện**:
  1. Đăng nhập `principal`, vào trang `/councils`.
  2. Tạo hoặc sửa hội đồng, trong đó gán `teacher` giữ vai trò `REVIEWER`.
  3. Phân công nhóm `Team Nexus Alpha` vào hội đồng này.
- **Kết quả mong đợi**:
  - Hệ thống kiểm tra trong `CouncilServiceImpl.java`:
  - Từ chối với HTTP `400 Bad Request`.
  - Thông báo lỗi vi phạm quy chế: `Advisors cannot serve as reviewers for their own supervised topics.`

---

### TC-17: Giảng viên phản biện nhập điểm 3 tiêu chí & Submit khóa điểm
- **Module**: 13 (Phản biện và chấm điểm) & 18 (Bảo mật)
- **Mục tiêu**: Giảng viên phản biện xem báo cáo, chấm điểm theo 3 tiêu chí độc lập, nộp chính thức và xác nhận điểm bị khóa.
- **Actor**: `council` / `password123` (Người phản biện)
- **Tiền điều kiện**: Hội đồng đã được thành lập và nhóm đã nộp báo cáo ở TC-12.
- **Các bước thực hiện**:
  1. Đăng nhập `council`, vào trang Đánh giá `/assessments`.
  2. Chọn nhóm `Team Nexus Alpha`, chọn sinh viên `Lê Anh Tuấn (student)`.
  3. Bấm xem báo cáo PDF trực tiếp trên web.
  4. Nhập điểm phiếu phản biện (`REVIEW`):
     - Điểm Nội dung & Cơ sở lý thuyết: `8.50`
     - Điểm Triển khai & Kết quả thực nghiệm: `9.00`
     - Điểm Trình bày & Định dạng tài liệu: `8.50`
     - Ưu điểm: `Hệ thống triển khai Microservices hoàn chỉnh, tài liệu chi tiết.`
     - Nhược điểm: `Cần tối ưu hóa chi phí tài nguyên Cloud.`
     - Nhận xét chung: `Đạt yêu cầu xuất sắc để bảo vệ trước hội đồng.`
  5. Bấm **"Lưu nháp" (Draft)** $\rightarrow$ Kiểm tra điểm vẫn sửa được.
  6. Bấm **"Nộp chính thức" (Submit assessment)** $\rightarrow$ Xác nhận hộp thoại cảnh báo khóa điểm.
- **Kết quả mong đợi**:
  - Bước 5: Phiếu ở trạng thái `DRAFT`, HTTP 200.
  - Bước 6: Phiếu chuyển trạng thái `SUBMITTED`, trường `submitted_at` được ghi nhận.
  - Giao diện và API khóa cứng: Giảng viên không thể sửa hoặc xóa điểm đã submit. Ghi Audit Log `SUBMIT_ASSESSMENT`.

---

### TC-18: Tự động tính điểm trung bình (20% GVHD + 30% PB + 50% HĐ) & Xét Đậu/Rớt
- **Module**: 14 (Tính điểm và xét kết quả)
- **Mục tiêu**: Kiểm tra hệ thống tự động tổng hợp tất cả phiếu chấm, áp dụng công thức trọng số chính xác, làm tròn 2 chữ số thập phân và xét Đậu/Rớt.
- **Actor**: `principal` / `password123`
- **Tiền điều kiện**:
  - Hội đồng đã kết thúc lịch bảo vệ; các phiếu REVIEW và DEFENSE từ giảng viên hội đồng đủ điều kiện đã được nộp.
  - GVHD chính chưa nộp phiếu ADVISOR; GVHD không được dùng vai trò thành viên hội đồng để chấm REVIEW/DEFENSE cho chính nhóm mình.
- **Các bước thực hiện**:
  1. Đăng nhập `principal`, hoàn tất hội đồng sau khi các phiếu REVIEW/DEFENSE hợp lệ đã được nộp.
  2. Xác nhận hội đồng có thể chuyển sang `COMPLETED` dù GVHD chưa nộp ADVISOR.
  3. Gọi API `/api/results/assignments/{id}` trước khi GVHD nộp ADVISOR.
  4. Đăng nhập bằng GVHD chính, nộp phiếu ADVISOR cho từng sinh viên sau khi hội đồng đã COMPLETED.
  5. Đăng nhập lại `principal` và xem bảng tính điểm preview tại `/results`.
- **Kết quả mong đợi**:
  - Bước 3: HTTP `400 Bad Request` vì thiếu ADVISOR; không trả về điểm một phần.
  - Bước 4: ADVISOR được chấp nhận khi kết quả chưa công bố; chỉ GVHD chính được nộp phiếu này.
  - Điểm tổng kết tính đúng công thức:
    $$\text{Final Score} = (0.20 \times 8.00) + (0.30 \times 8.50) + (0.50 \times 9.00) = 1.60 + 2.55 + 4.50 = 8.65$$
  - Điểm $\ge 5.00 \rightarrow$ Trạng thái tự động phân loại: `PASSED = true` (ĐẬU).
  - Trả về mã HTTP `200 OK` kèm chi tiết điểm thành phần từng tiêu chí.

---

### TC-19: Trưởng khoa duyệt công bố điểm & Tạo bản ghi bất biến
- **Module**: 15 (Công bố điểm) & 18 (Bảo mật & Kiểm soát dữ liệu)
- **Mục tiêu**: Trưởng khoa duyệt và bấm công bố điểm; hệ thống lưu snapshot bất biến vào CSDL và không cho phép tái công bố.
- **Actor**: `principal` / `password123`
- **Tiền điều kiện**: Điểm đã được tính toán đầy đủ và hợp lệ ở TC-18.
- **Các bước thực hiện**:
  1. Tại trang `/results`, Trưởng khoa bấm **"Công bố điểm cả đợt"** (hoặc **"Công bố điểm nhóm"** cho một nhóm).
  2. Xác nhận popup cảnh báo: *"Kết quả sau khi công bố sẽ được khóa vĩnh viễn và gửi đến sinh viên."*
  3. Thử bấm công bố lại lần thứ hai.
- **Kết quả mong đợi**:
  - Bước 1-2: HTTP `200 OK`. Bảng `published_results` ghi nhận dòng dữ liệu với `published_by = 2`, `published_at = NOW()`.
  - Ghi Audit Log: `PUBLISH_RESULTS`.
  - Bước 3: Hệ thống chặn không cho ghi đè với lỗi `400 Bad Request: Results have already been published for this assignment.`

---

### TC-20: Sinh viên tra cứu bảng điểm cá nhân & Trưởng khoa xuất báo cáo Excel
- **Module**: 15 (Công bố điểm) & 16 (Báo cáo và thống kê)
- **Mục tiêu**:
  - Sinh viên xem đúng điểm của mình, không lộ điểm người khác; thấy điểm thành phần, nhận xét và Đạt/Không đạt sau khi công bố.
  - Trưởng khoa lọc thống kê và xuất báo cáo Excel.
- **Actor**: `student` (Tra cứu điểm), `principal` (Xuất thống kê)
- **Tiền điều kiện**: Điểm đã được công bố ở TC-19.
- **Các bước thực hiện**:
  1. **Sinh viên**: Đăng nhập `student`, truy cập trang Kết quả `/results`.
     - $\rightarrow$ Kiểm tra: Hiển thị bảng điểm cá nhân gồm Điểm GVHD (`8.00`), Điểm phản biện (`8.50`), Điểm hội đồng (`9.00`), nhận xét, Điểm tổng kết (`8.65`) và Huy hiệu **"ĐẬU" (PASSED)**.
  2. **Trưởng khoa**: Đăng nhập `principal`, vào trang `/results`.
     - Lọc theo Đợt: `Kỳ 1 2026-2027`, Bộ môn: `Kỹ thuật phần mềm`.
     - Xem bảng phân bố dải điểm (Score bands: `8.00–8.99`).
     - Bấm nút **"Xuất báo cáo Excel"**.
- **Kết quả mong đợi**:
  - Phía sinh viên: API `/api/results/me` chỉ trả về đúng dữ liệu của `student`, không trả về thông tin sinh viên khác.
  - Phía trưởng khoa: Trình duyệt tải về file `.xlsx` gồm: Đợt, Bộ môn, Đề tài, Nhóm, MSSV, Sinh viên, GVHD, điểm thành phần, điểm tổng kết, Đạt/Không đạt và nhận xét.
