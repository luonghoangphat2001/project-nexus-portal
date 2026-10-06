# Module 11, 12, 13 — Báo cáo, Hội đồng, Phản biện & Chấm điểm

Triển khai theo `ARCHITECTURE.md`: Controller → Service interface → Service implementation → JPA Repository → Model. Controller chỉ inject interface bằng constructor; request được Jakarta Validation kiểm tra; response luôn bọc `ApiResponse<T>`. Frontend dùng Axios client hiện có, JWT, protected routes và layout chung; lỗi API được hiển thị bằng banner.

## Quy tắc nghiệp vụ đang áp dụng

Tài liệu ban đầu chỉ nêu tên module, chưa mô tả chi tiết tiêu chí chấm hoặc quy chế hội đồng. Triển khai dùng các quy tắc sau để có luồng hoàn chỉnh, nhất quán:

- Đầu vào là `TopicRegistration` có trạng thái `APPROVED`. Mỗi phân công gắn với một đăng ký của một nhóm, không chỉ với đề tài vì nhiều nhóm có thể đăng ký cùng đề tài.
- Mọi lịch và hạn nộp của ba module dùng giờ Việt Nam (`Asia/Ho_Chi_Minh`). JSON datetime không có offset được hiểu là giờ Việt Nam.
- Chỉ trưởng nhóm có role sinh viên và thuộc nhóm được nộp tài liệu, tới đúng thời điểm `RegistrationPeriod.submissionDeadline` (bao gồm thời điểm hạn nộp). Thành viên được đọc/tải tài liệu của nhóm.
- Giảng viên hướng dẫn, thành viên hội đồng được phân công, trưởng bộ môn đúng phạm vi và admin được đọc tài liệu. Giảng viên không có quan hệ với nhóm không được đọc.
- Một hội đồng có 3–15 giảng viên đang hoạt động thuộc bộ môn, mỗi người một vai trò; có đúng một chủ tịch, một thư ký và một phản biện. Role hợp lệ: `ROLE_TEACHER`, `ROLE_COUNCIL`, `ROLE_PRINCIPAL`.
- Chỉ admin hoặc trưởng bộ môn phụ trách được tạo/sửa/phân công/hủy/hoàn tất hội đồng. Hội đồng thuộc một bộ môn và một đợt; các nhóm phân công phải có đăng ký đã duyệt cùng bộ môn/đợt. Mỗi đăng ký chỉ có một phân công.
- Các khoảng lịch giao nhau không được dùng cùng phòng hoặc cùng giảng viên. Hai lịch tiếp giáp được phép. Giảng viên hướng dẫn không được phản biện đề tài mình hướng dẫn.
- Phiếu đánh giá tách theo phân công, giảng viên, sinh viên và loại `REVIEW`/`DEFENSE`. Chỉ giảng viên có vai trò phản biện được lập `REVIEW`; mọi thành viên hội đồng được lập `DEFENSE`.
- Ba điểm thành phần 0–10, tối đa hai chữ số thập phân: nội dung/cơ sở lý thuyết, kết quả/triển khai, tài liệu/trình bày. Module 13 lưu từng điểm thành phần; module 14 quyết định trọng số, tính điểm cuối và xét kết quả.
- Lưu nháp có thể sửa hoặc xóa bởi người lập. Gửi phiếu cần nhận xét không rỗng và nhóm đã nộp loại tài liệu `REPORT`. Phiếu bảo vệ chỉ được gửi từ giờ bắt đầu bảo vệ.
- Phiếu đã gửi bị khóa sửa/xóa và khóa nộp thêm tài liệu của nhóm. Không sửa lịch/thành viên hoặc gỡ phân công đã có phiếu đánh giá; các phiếu nháp phải được xóa trước khi điều chỉnh. Không hủy hội đồng có phiếu đã gửi.
- Hoàn tất hội đồng chỉ sau giờ kết thúc, với ít nhất một nhóm, và đủ phiếu bảo vệ của từng thành viên hội đồng cùng phiếu phản biện cho từng sinh viên. Trạng thái hoàn tất/hủy không được mở lại.
- Mỗi người chỉ đọc nháp của mình; thành viên hội đồng và người quản lý được xem phiếu đã gửi. Sinh viên chưa được đọc điểm trong module 13; công bố điểm thuộc module 15.

## Module 11 — `/reports`

- Chọn đăng ký/nhóm trong phạm vi được truy cập.
- Nộp multipart: `type`, `title`, `note`, `file`.
- Các loại: `REPORT`, `SLIDES`, `SOURCE_CODE`, `OTHER`.
- Nhận PDF, DOCX, PPTX, ZIP và TXT UTF-8; kiểm tra chữ ký PDF/ZIP, từ chối nội dung rỗng, tên tệp chứa ký tự điều khiển, định dạng không được hỗ trợ và tệp vượt giới hạn. Kiểm tra chữ ký không thay thế kiểm tra toàn bộ cấu trúc hay quét malware.
- Mỗi lần nộp tăng phiên bản riêng theo đăng ký và loại tài liệu. Lịch sử không bị ghi đè hoặc xóa qua API.
- File lưu trong MySQL `LONGBLOB`, cùng transaction với metadata; không cần thư mục upload hoặc volume mới. Metadata truy vấn riêng, không tải BLOB khi liệt kê.
- Download trả `DocumentContentResponse` có Base64 trong `ApiResponse`; FE chuyển thành Blob và tải xuống. Base64 tăng dung lượng truyền khoảng 33%, phù hợp giới hạn tệp nhỏ của triển khai hiện tại.

Biến môi trường bổ sung (giá trị mặc định được khai báo rõ trong cấu hình, giữ tương thích `.env` cũ):

```dotenv
REPORT_MAX_FILE_BYTES=10485760
REPORT_MAX_REQUEST_BYTES=12582912
```

Khi tăng giới hạn, điều chỉnh cả kích thước multipart request, reverse proxy và `max_allowed_packet` MySQL. Giá trị mặc định là 10 MiB/tệp, 12 MiB/request. Giới hạn 10 MiB được cấu hình ở FE như thông tin mặc định; BE là nơi kiểm tra giới hạn thực tế.

## Module 12 — `/councils`

- Admin/trưởng bộ môn tạo hội đồng, chọn phòng, khoảng giờ, bộ môn, đợt và thành viên.
- Phân công nhóm chưa có hội đồng; gỡ rồi phân công lại khi chuyển hội đồng và chưa có phiếu đánh giá.
- Có thể hủy hội đồng trước khi có phiếu đã gửi. Phân công của hội đồng hủy phải được gỡ trước khi chuyển nhóm.
- Sinh viên chỉ thấy lịch và nhóm của mình; giảng viên hướng dẫn thấy nhóm họ hướng dẫn; thành viên hội đồng thấy các nhóm họ được phân công.
- Nhấn liên kết Tài liệu/Phiếu đánh giá để mở đúng nhóm/phân công ở module tiếp theo.

## Module 13 — `/assessments`

- Chọn hội đồng/nhóm, sinh viên và loại phiếu.
- Nhập điểm thành phần, ưu điểm, hạn chế, câu hỏi và nhận xét.
- Lưu nháp rồi gửi chính thức; giao diện yêu cầu xác nhận khi gửi và hiển thị trạng thái khóa.
- Gửi phiếu ghi audit `SUBMIT_ASSESSMENT`, dùng dịch vụ audit hiện có.

## API

Đường dẫn dưới đây ghép sau `API_PREFIX` (mặc định `/api` trong `.env.example`). Mọi endpoint yêu cầu JWT.

| Method | Endpoint | Nội dung |
| --- | --- | --- |
| GET | `/reports/registrations` | Các đăng ký đã duyệt có quyền đọc, thành viên, hạn nộp, quyền thao tác |
| GET | `/reports/registrations/{id}/documents` | Lịch sử metadata tài liệu |
| POST | `/reports/registrations/{id}/documents` | Nộp multipart, tạo phiên bản mới |
| GET | `/reports/documents/{id}/content` | Nội dung Base64 sau kiểm tra quyền |
| GET | `/councils` | Danh sách hội đồng/phân công theo quyền |
| GET | `/councils/options` | Bộ môn được quản lý, đợt và giảng viên để tạo hội đồng |
| POST | `/councils` | Tạo hội đồng |
| PUT | `/councils/{id}` | Sửa hội đồng chưa có phiếu đánh giá |
| PATCH | `/councils/{id}/status` | Hủy hoặc hoàn tất |
| POST | `/councils/{id}/assignments` | Phân công `{ "registrationId": ... }` |
| DELETE | `/councils/{id}/assignments/{assignmentId}` | Gỡ phân công chưa có phiếu |
| GET | `/assessments?assignmentId=...` | Phiếu của phân công trong phạm vi hội đồng |
| POST | `/assessments` | Tạo/cập nhật nháp theo khóa duy nhất |
| POST | `/assessments/{id}/submit` | Gửi và khóa phiếu |
| DELETE | `/assessments/{id}` | Xóa nháp của người lập |

Validation lỗi trả 422; sai nghiệp vụ/enum/payload trả 400; thiếu JWT trả 401; không có quyền trả 403; thiếu bản ghi trả 404; multipart quá lớn trả 413. Giới hạn kích thước do service kiểm tra trả 400 nếu request multipart đã được chấp nhận.

## Dữ liệu và transaction

Bổ sung bảng `report_documents`, `defense_councils`, `defense_council_members`, `defense_assignments`, `assessments`; có JPA Model và DDL tương ứng trong `schema.sql`. Khóa ngoại giữ dữ liệu báo cáo/đánh giá, không tự xóa dây chuyền.

Mutation dùng `READ_COMMITTED` và khóa pessimistic: đăng ký khi cấp phiên bản/nộp tài liệu, hội đồng khi sửa/phân công/chấm, các bộ môn khi thay đổi lịch. Việc cấp phiên bản đồng thời và gửi/sửa phiếu được tuần tự hóa; đọc ID hội đồng trước khóa rồi mới tải phiếu để tránh trạng thái cache cũ. `READ_COMMITTED` giúp kiểm tra khóa tài liệu thấy phiếu đã gửi sau khi chờ lock, kể cả khi MySQL mặc định dùng `REPEATABLE_READ`.

Seed `05_teams_matchmaking.sql` đã bỏ thao tác xóa/tạo lại đăng ký và thành viên, không đặt lại trạng thái nhóm mỗi lần khởi động. Với DB đã vận hành nên đặt `SQL_INIT_MODE=never` vì các seed khác vẫn là dữ liệu phát triển.

## Chạy thử

1. Khởi chạy BE/FE theo README, dùng `HIBERNATE_DDL_AUTO=update` để bổ sung các bảng mới.
2. Dùng module 7 duyệt đăng ký cho nhóm, hoặc dùng dữ liệu thực đã có trạng thái `APPROVED`.
3. Trưởng nhóm vào `/reports`, nộp báo cáo. Nộp tiếp để kiểm tra phiên bản.
4. Admin/trưởng bộ môn vào `/councils`, tạo hội đồng có 3 giảng viên hợp lệ, rồi phân công nhóm. Nếu dữ liệu mẫu chỉ có hai người đang hướng dẫn, thêm giảng viên phản biện không hướng dẫn đề tài bằng module 1.
5. Giảng viên phản biện vào `/assessments`, lưu nháp cho từng sinh viên, xem tài liệu rồi gửi phiếu.
6. Các thành viên hội đồng lưu/gửi phiếu bảo vệ từ giờ bắt đầu; sau giờ kết thúc và đủ phiếu, người quản lý hoàn tất hội đồng.

Kiểm thử backend chạy trên H2 ở chế độ MySQL, không cần MySQL thật và không đọc `.env`:

```bash
cd be
mvn test
```

Build frontend:

```bash
cd fe
npm ci
npm run build
```

Bộ kiểm thử tích hợp kiểm tra upload/download, phiên bản, deadline, tệp lỗi/quá lớn, quyền theo nhóm/bộ môn, lịch giao nhau/tiếp giáp, phản biện trùng hướng dẫn, phân công duy nhất, nháp riêng tư, khóa phiếu/tài liệu, hoàn tất đủ phiếu, validation HTTP, JWT thật và thao tác đồng thời. H2 không thay thế kiểm thử vận hành trên MySQL 8.
