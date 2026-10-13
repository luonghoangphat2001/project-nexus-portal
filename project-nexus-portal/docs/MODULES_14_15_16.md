# Mô-đun 14–16 — Tính điểm, Công bố điểm, Báo cáo và Thống kê

Các mô-đun này sử dụng phiếu đánh giá đã gửi từ Mô-đun 13 và chỉ xử lý phân công thuộc hội đồng đã hoàn thành. Quy ước tích hợp, phân quyền và trách nhiệm từng lớp được giữ theo `ARCHITECTURE.md`; tài liệu này chỉ mô tả quy tắc nghiệp vụ và API riêng.

## Quy tắc nghiệp vụ

- Điểm mỗi phiếu là trung bình của ba tiêu chí hiện có: nội dung, triển khai và trình bày/tài liệu, theo thang điểm 0–10.
- Điểm phản biện lấy từ phiếu `REVIEW` do phản biện được phân công gửi. Điểm bảo vệ là trung bình của tất cả phiếu `DEFENSE` đã gửi bởi thành viên hội đồng.
- Điểm cuối = `30% × điểm phản biện + 70% × điểm bảo vệ`, làm tròn đến hai chữ số thập phân theo quy tắc half-up. Sinh viên đạt nếu điểm từ `5.00` trở lên.
- Chỉ tính và công bố điểm sau khi hội đồng hoàn thành, nhóm có thành viên, và mỗi sinh viên có chính xác một phiếu `REVIEW` cùng một phiếu `DEFENSE` từ mỗi thành viên hội đồng.
- Điểm đã công bố được lưu thành bản ghi bất biến, duy nhất theo cặp phân công/sinh viên; không cho phép công bố lại. Transaction khóa hội đồng để tránh công bố đồng thời và ghi audit log khi thành công.
- Quản trị viên xem được mọi khoa; trưởng khoa chỉ xem dữ liệu của khoa được phân công quản lý. Sinh viên chỉ xem kết quả đã công bố của mình. Nhận xét trong phiếu đánh giá không được trả về cho sinh viên.
- Thống kê chỉ tính điểm đã công bố, nhóm theo đợt đăng ký, khoa và đề tài. Báo cáo gồm số sinh viên, điểm trung bình, số đạt/không đạt và các khoảng điểm: dưới `5.00`, `5.00–5.99`, `6.00–6.99`, `7.00–7.99`, `8.00–8.99` và `9.00–10.00`.
- Báo cáo kết quả học tập tách biệt với báo cáo tài liệu ở Mô-đun 11 và số liệu hệ thống trên Dashboard. CSV dùng UTF-8, escape dấu ngoặc kép và vô hiệu hóa tiền tố công thức bảng tính trong trường văn bản.

## API

Các endpoint dưới đây yêu cầu JWT và sử dụng tiền tố API được cấu hình (mặc định: `/api`).

| Phương thức | Endpoint | Quyền truy cập | Mô tả |
| --- | --- | --- | --- |
| GET | `/results/assignments/{assignmentId}` | Quản trị viên/trưởng khoa, giới hạn theo khoa được phân công | Xem điểm đang tính hoặc điểm đã công bố |
| POST | `/results/assignments/{assignmentId}/publish` | Quản trị viên/trưởng khoa, giới hạn theo khoa được phân công | Công bố điểm cho một phân công đã hoàn thành |
| GET | `/results/me` | Sinh viên | Xem kết quả đã công bố của sinh viên hiện tại |
| GET | `/results/reports/options` | Quản trị viên/trưởng khoa, giới hạn theo khoa được phân công | Lấy danh sách đợt đăng ký, khoa và đề tài để lọc |
| GET | `/results/reports` | Quản trị viên/trưởng khoa, giới hạn theo khoa được phân công | Xem thống kê; hỗ trợ `periodId`, `departmentId` và `topicId` |
| GET | `/results/reports.csv` | Quản trị viên/trưởng khoa, giới hạn theo khoa được phân công | Tải báo cáo CSV theo cùng bộ lọc |

## Lưu trữ

Bảng `published_results` lưu bản chụp điểm đã công bố và có ràng buộc duy nhất trên cặp phân công/sinh viên. Bảng được khai báo trong `be/src/main/resources/schema.sql` và ánh xạ bởi entity `PublishedResult`.
