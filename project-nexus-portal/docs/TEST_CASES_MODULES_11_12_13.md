# Module 11–13 Functional Test Cases

## Test Environment

- Frontend: `http://localhost:3000` — Vite production preview.
- Backend: `http://localhost:8080/api` — Spring Boot, Java 17.
- Database: MySQL 8 thật trên localhost; bộ integration test dùng H2 riêng.
- Ngày kiểm thử: 05/10/2026, múi giờ `Asia/Ho_Chi_Minh`.
- Dữ liệu: tài khoản, nhóm, đề tài, hội đồng có tiền tố `QA`, tách khỏi dữ liệu mẫu. Điểm thử chỉ là dữ liệu giả.
- Điều kiện đầu vào: đợt 1 đang mở, hạn nộp chưa kết thúc; nhóm QA đã có đăng ký `APPROVED`; ba giảng viên đang hoạt động thuộc cùng bộ môn, reviewer không hướng dẫn đề tài.
- Script tạo fixture qua API thật, không sửa đồng hồ và không ghi SQL để vượt quy tắc nghiệp vụ. Hội đồng QA có một sinh viên, cần một phiếu Review và ba phiếu Defense Assessment để hoàn tất.

## Execution Summary

- **API trên localhost/MySQL: 52/52 PASS**, run `20261005_150751`, kết thúc lúc 15:11 ngày 05/10/2026. [Kết quả từng case và trạng thái cuối](./test-results/MODULES_11_12_13_20261005.json).
- **Integration regression: 24/24 PASS**, 0 failures/errors/skipped; Java 17, H2 MySQL mode. Bao gồm test hồi quy lỗi tạo đề tài có hai giảng viên hướng dẫn.
- **Browser: 12/12 PASS.** Sau khi người dùng bật `Allow access to file URLs`, đã chạy lại UI-02 và UI-03 bằng fixture mới: nộp hai file qua UI, hiển thị version 1–2, tải cả hai qua UI và đối chiếu SHA-256 trùng file gốc. Lịch sử giữ nguyên sau reload. [Kết quả UI từng case](./test-results/MODULES_11_12_13_UI_20261005.json), [bằng chứng upload/download](./test-results/MODULE_11_UI_UPLOAD_20261005.json).
- Frontend vẫn phục vụ HTTP 200 tại `/reports`, `/councils`, `/assessments`; backend đang chạy bản đã sửa BUG-01 trên cổng 8080.
- Xác minh sau vòng API: registration **2**, council **1**, assignment **2**; bảy tài liệu, các version Report **1–4** đều còn; bốn phiếu **Submitted**, council **Completed**.

Kết quả API mỗi lượt tiếp theo được lưu tại `be/target/localhost-qa/<runId>.json`, không chứa JWT hay mật khẩu. Fixture được giữ lại để đối chiếu trên localhost.

## Reports & Documents

Đăng nhập trưởng nhóm QA, mở `/reports`; API tương ứng `/reports/registrations/{registrationId}/documents`. Các case từ chối phải không tạo thêm bản ghi tài liệu.

| ID | Test Case | Steps | Expected Result | Status |
| --- | --- | --- | --- | --- |
| AUTH-01 | Authentication Required | Gọi danh sách đăng ký khi không có JWT. | HTTP 401. | PASS |
| M11-01 | Approved Registration Visibility | Trưởng nhóm lấy danh sách đăng ký. | Nhóm QA xuất hiện, `canSubmit=true`. | PASS |
| M11-02 | Report Submission | Nộp TXT UTF-8 với loại Report, tiêu đề hợp lệ. | HTTP 201, lưu nội dung và metadata. | PASS |
| M11-03 | Submission History | Nộp Report lần hai. | Version 2; version 1 vẫn còn. | PASS |
| M11-04 | Document Download | Tải nội dung của version 1, giải mã Base64. | Byte trùng khớp file gốc. | PASS |
| M11-05 | Independent Document Versions | Nộp Presentation Slides, Source Code, Other Documents. | Version 1 cho từng loại. | PASS |
| M11-06 | Unsupported Extension | Nộp `qa.exe`. | HTTP 400. | PASS |
| M11-07 | Invalid PDF Signature | Đổi đuôi TXT thành PDF rồi nộp. | HTTP 400. | PASS |
| M11-08 | Empty File | Nộp file 0 byte. | HTTP 400. | PASS |
| M11-09 | File Size Limit | Nộp TXT lớn hơn 10 MiB một byte. | HTTP 413 tại multipart parser. | PASS |
| M11-10 | Required Title | Nộp file hợp lệ, tiêu đề rỗng. | HTTP 422. | PASS |
| M11-11 | Student Data Isolation | Sinh viên thuộc nhóm khác đọc tài liệu QA. | HTTP 403. | PASS |
| M11-12 | Department Data Isolation | Principal bộ môn khác tải tài liệu QA. | HTTP 403. | PASS |
| M11-13 | Submission Lock | Sau khi reviewer gửi phiếu, trưởng nhóm nộp tiếp. | HTTP 400, không thêm version. | PASS |
| M11-14 | Submission Permission Refresh | Sau khi gửi phiếu, tải lại danh sách đăng ký. | `canSubmit=false`. | PASS |
| M11-15 | Concurrent Upload Versions | Gửi đồng thời hai Report trên MySQL. | Hai version khác nhau: 3 và 4. | PASS |

## Council Assignments

Đăng nhập admin, mở `/councils`; hội đồng dùng bộ môn/đợt của nhóm QA. Start và End được đặt trong tương lai gần để có thể kiểm tra mốc giờ thật.

| ID | Test Case | Steps | Expected Result | Status |
| --- | --- | --- | --- | --- |
| M12-01 | Student Management Restriction | Sinh viên gọi tạo hội đồng. | HTTP 403. | PASS |
| M12-02 | Department Management Restriction | Principal bộ môn khác tạo hội đồng bộ môn 1. | HTTP 403. | PASS |
| M12-03 | Duplicate Members | Tạo hội đồng với cùng giảng viên ở ba vị trí. | HTTP 400. | PASS |
| M12-04 | Council Creation | Tạo đủ Chair, Secretary, Reviewer, lịch hợp lệ. | HTTP 201, trạng thái Scheduled. | PASS |
| M12-05 | Schedule Conflict | Tạo hội đồng trùng khoảng giờ, phòng, thành viên. | HTTP 400. | PASS |
| M12-06 | Council Editing | Đổi tên khi chưa có phiếu đánh giá. | HTTP 200, tên mới được lưu. | PASS |
| M12-07 | Team Assignment | Phân công đăng ký đã duyệt vào hội đồng. | Nhóm xuất hiện trong assignments. | PASS |
| M12-08 | Unique Assignment | Phân công lại cùng đăng ký. | HTTP 400. | PASS |
| M12-09 | Assignment Removal | Gỡ phân công chưa có phiếu. | HTTP 200, nhóm được giải phóng. | PASS |
| M12-10 | Team Reassignment | Phân công lại sau khi gỡ. | HTTP 200, có assignment mới. | PASS |
| M12-11 | Student Schedule Visibility | Trưởng nhóm xem hội đồng của mình. | Thấy lịch và nhóm, `canManage=false`. | PASS |
| M12-12 | Council Structure Lock | Sửa hội đồng sau khi lưu một draft. | HTTP 400. | PASS |
| M12-13 | Assignment Lock | Gỡ nhóm đã có draft. | HTTP 400. | PASS |
| M12-14 | Cancellation Restriction | Hủy hội đồng đã có phiếu Submitted. | HTTP 400. | PASS |
| M12-15 | Completion Time Gate | Hoàn tất trước End. | HTTP 400. | PASS |
| M12-16 | Council Completion | Sau End, đã đủ một Review và ba Defense Assessment. | HTTP 200, Completed. | PASS |
| M12-17 | Terminal Status | Chuyển Completed về Scheduled. | HTTP 400. | PASS |
| M12-18 | Required Assessment Coverage | Sau End nhưng thiếu phiếu Defense của reviewer. | HTTP 400, vẫn Scheduled. | PASS |

## Reviews & Grading

Đăng nhập đúng evaluator; mở `/assessments`, chọn hội đồng, nhóm, sinh viên, loại phiếu. Mỗi phiếu gắn với assignment/evaluator/student/type.

| ID | Test Case | Steps | Expected Result | Status |
| --- | --- | --- | --- | --- |
| M13-01 | Student Score Restriction | Sinh viên đọc phiếu đánh giá. | HTTP 403. | PASS |
| M13-02 | Reviewer Role | Chair lưu phiếu Review. | HTTP 403. | PASS |
| M13-03 | Score Upper Bound | Lưu draft với điểm 10.01. | HTTP 422. | PASS |
| M13-04 | Score Decimal Precision | Lưu draft với điểm 8.123. | HTTP 422. | PASS |
| M13-05 | Draft Creation | Reviewer nhập điểm và nhận xét, lưu draft. | HTTP 200, Draft. | PASS |
| M13-06 | Draft Update | Sửa điểm, lưu lại cùng sinh viên/loại. | Giữ nguyên assessment ID, điểm được cập nhật. | PASS |
| M13-07 | Private Draft | Chair đọc danh sách khi reviewer mới lưu draft. | Không thấy draft của reviewer. | PASS |
| M13-08 | Draft Ownership | Chair xóa draft của reviewer. | HTTP 403. | PASS |
| M13-09 | Draft Deletion | Reviewer xóa draft của mình. | HTTP 200; có thể tạo lại. | PASS |
| M13-10 | Required Submission Comment | Gửi draft có comment rỗng. | HTTP 400, vẫn Draft. | PASS |
| M13-11 | Defense Start Gate | Chair gửi Defense Assessment trước Start. | HTTP 400, vẫn Draft. | PASS |
| M13-12 | Review Submission | Reviewer gửi Review có comment, nhóm đã nộp Report. | Submitted, `canEdit=false`. | PASS |
| M13-13 | Submitted Score Immutability | Reviewer sửa điểm của phiếu đã gửi. | HTTP 400. | PASS |
| M13-14 | Submitted Score Deletion | Reviewer xóa phiếu đã gửi. | HTTP 400. | PASS |
| M13-15 | Submitted Assessment Visibility | Secretary đọc danh sách sau khi gửi Review. | Thấy phiếu Review Submitted. | PASS |
| M13-16 | Chair Defense Submission | Chair gửi Defense sau Start. | HTTP 200, Submitted. | PASS |
| M13-17 | Secretary Defense Submission | Secretary lưu/gửi Defense sau Start. | HTTP 200, Submitted. | PASS |
| M13-18 | Reviewer Defense Submission | Reviewer lưu/gửi Defense cuối cùng. | HTTP 200, đủ bốn phiếu cho một sinh viên. | PASS |

## Browser Test Round

Các case UI chỉ được ghi PASS sau khi thao tác trực tiếp và xác minh trạng thái hiển thị; kết quả API không được tính thay cho UI. Vòng UI ngày 05/10/2026 dùng Edge và fixture `20261005_151214`. Hội đồng **2**, assignment **3**, registration **3** đã hoàn tất, có bốn phiếu Submitted. Tải Report version 1 từ UI tạo file `Downloads/ui-report.txt`, SHA-256 trùng file gốc: `0881B84B2094304472FFF0F6898CDD064A40863825F62E84EA639D4F39C9357A`.

| ID | Test Case | Steps | Expected Result | Status |
| --- | --- | --- | --- | --- |
| UI-01 | Module Navigation | Mở localhost; đăng nhập và mở ba module từ sidebar. | Tên English, đúng trang, không lỗi render. | PASS |
| UI-02 | Report Upload | Trưởng nhóm chọn nhóm, loại, tiêu đề, file, Submit. | Banner thành công, lịch sử có Version 1. | PASS |
| UI-03 | Report History & Download | Nộp lần hai, tải bản đầu. | Hai version; file tải mở được, đúng nội dung. | PASS |
| UI-04 | Council Form Validation | Admin thử form thiếu trường bắt buộc hoặc trùng vai trò. | Lỗi rõ ràng, không tạo hội đồng sai. | PASS |
| UI-05 | Council Creation & Editing | Admin tạo đủ ba giảng viên, lịch hợp lệ, sửa tên. | Hội đồng Scheduled hiển thị đúng lịch và vai trò. | PASS |
| UI-06 | Team Assignment | Admin phân công nhóm, mở Documents/Assessments qua liên kết. | Đúng nhóm và assignment được chọn. | PASS |
| UI-07 | Review Draft Editing | Reviewer nhập điểm, nhận xét; Save Draft, Edit Draft. | Draft hiển thị, điểm sửa được lưu. | PASS |
| UI-08 | Review Submit Confirmation | Chọn Submit & Lock, thử Cancel rồi xác nhận. | Cancel giữ Draft; xác nhận chuyển Submitted & Locked. | PASS |
| UI-09 | Student Access & Upload Lock | Trưởng nhóm mở reports và thử assessments. | Không còn form nộp; không đọc được phiếu/điểm. | PASS |
| UI-10 | Defense Time Gate | Trước Start gửi Defense, sau Start gửi lại. | Trước Start có lỗi; sau Start Submitted & Locked. | PASS |
| UI-11 | Council Completion | Sau End và đủ phiếu, admin chọn Complete. | Completed; các thao tác thay đổi bị khóa. | PASS |
| UI-12 | Browser Console & Layout | Quan sát ba trang và console trong vòng thao tác. | Không lỗi render của ứng dụng; form và bảng đọc được. | PASS |

Bằng chứng: [Council Completed](./test-results/screenshots/council-completed.jpg), [Submitted Assessments](./test-results/screenshots/assessments-submitted.jpg), [Report History](./test-results/screenshots/report-history.jpg). Snapshot DOM và console local được lưu cùng thư mục `docs/test-results`. Console có nhiều lỗi từ extension AdBlock360. Ngoài ra, `localhost-console.json` ghi nhận một `Failed to fetch` có stack trỏ vào URL trang; chưa xác định chắc chắn nguồn script. Không ghi nhận lỗi render hoặc stack trỏ vào bundle ứng dụng, nhưng chưa thể kết luận console hoàn toàn sạch.

## Regression & Known Issues

- **BUG-01 — Topic Creation HTTP 500:** phát hiện khi tạo đề tài QA. `TopicLecturerRepository.save()` dùng merge vì composite ID đã được gán; service trước đây đưa entity gốc vào collection có cascade, tạo hai instance cùng ID trong persistence context. Đã sửa để collection giữ entity managed do `save()` trả về. Thêm test tạo đề tài có cả primary/co-advisor, flush/clear rồi xác minh hai quan hệ được lưu.
- **BUG-02 — Seed Name Encoding:** danh sách giảng viên hiển thị tên tiếng Việt bị mojibake trên localhost. Bổ sung `spring.sql.init.encoding: UTF-8`; khôi phục năm tên seed khớp chính xác với biến thể mã hóa sai của tên trong `03_users.sql`, qua API cập nhật tên. Không đổi role/mật khẩu hay reset DB. Đã xác minh tên Nguyễn Văn Quản và Trần Hoàng Nam hiển thị đúng trong Council options; 24 integration test tiếp tục PASS, backend đã build/restart.
- **BLOCK-01 — Browser Connection (resolved):** kết nối Edge hoạt động lại sau khi người dùng đóng popup. Một số thao tác dialog/download khiến công cụ bị gián đoạn; đã khôi phục tab và kiểm tra trạng thái thực tế, không gửi lặp mutation đã có hiệu lực.
- **BLOCK-02 — Local File Upload (resolved):** người dùng đã bật `Allow access to file URLs` trong extension ChatGPT. UI-02 và UI-03 chạy lại thành công lúc 16:06–16:07 bằng registration **4**, fixture `20261005_160516`. Cả hai Report được chọn bằng file chooser và nộp qua UI; download version 1 và 2 trùng SHA-256 file gốc. [Ảnh lịch sử hai phiên bản](./test-results/screenshots/report-upload-versions.jpg). Hai Report nạp qua API trong vòng chấm điểm trước vẫn được ghi nhận riêng, không tính thay cho upload UI.

## Browser Fixture

Fixture `20261005_151214` đã dùng cho vòng UI: registration **3**, team **5**, topic **6**, council **2**, assignment **3**, bộ môn **1**, đợt **1**. Hiện hội đồng Completed và tài liệu bị khóa nộp thêm. Vòng upload bổ sung dùng fixture `20261005_160516`: registration **4**, team **6**, topic **7**, leader **23** (`qa_leader_20261005_160516`); hai Report version 1–2 đã nộp qua UI, document ID **10–11**. Các tài khoản QA local dùng mật khẩu phát triển `password123`.

| Role | Username | User ID | Council Role |
| --- | --- | --- | --- |
| Team Leader | `qa_leader_20261005_151214` | 18 | — |
| Lecturer | `qa_chair_20261005_151214` | 19 | Chair |
| Lecturer / Advisor | `qa_secretary_20261005_151214` | 20 | Secretary |
| Lecturer | `qa_reviewer_20261005_151214` | 21 | Reviewer |
| Principal, other department | `qa_outsider_20261005_151214` | 22 | — |

Admin dùng `superadmin` để tạo hội đồng và phân công. File TXT thử chỉ cần nội dung giả, ví dụ `QA report`, không sử dụng báo cáo hoặc điểm thật. Các fixture của lượt setup thất bại trước khi sửa BUG-01 cũng có tiền tố QA và được giữ nguyên, không xóa dữ liệu.

## Reproduction

```powershell
# BE, FE, MySQL đang chạy; seed superadmin/password123 chỉ dùng ở môi trường local.
python scripts/qa_defense_localhost.py

# Tạo fixture mới cho vòng test bằng trình duyệt, chưa nộp báo cáo/chấm điểm.
python scripts/qa_defense_localhost.py --setup-only

cd be
mvn test
```

Script dùng Python `requests`, chạy khoảng ba phút do chờ Start/End thật. Mỗi lượt tạo fixture mới; không xóa dữ liệu hiện có. Fixture được giữ lại để mở và kiểm tra trạng thái trên localhost. Không dùng script này trên môi trường production.
