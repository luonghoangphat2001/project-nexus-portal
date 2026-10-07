# Modules 14–16 — Tính điểm, công bố kết quả và thống kê học tập

Các module này sử dụng phiếu đánh giá đã gửi của module 13 và chỉ xử lý phân công thuộc hội đồng đã hoàn tất. Quy ước tích hợp, phân quyền và cấu trúc tầng được mô tả trong [ARCHITECTURE.md](../ARCHITECTURE.md); tài liệu này chỉ ghi quy tắc nghiệp vụ và API riêng để tránh lặp lại hướng dẫn kiến trúc.

## Quy tắc nghiệp vụ

- Điểm một phiếu đánh giá là trung bình cộng của ba tiêu chí hiện có (nội dung, triển khai, trình bày/tài liệu), thang điểm 0–10.
- Điểm phản biện là điểm của phiếu `REVIEW` do thành viên giữ vai trò phản biện chấm. Điểm bảo vệ là trung bình các phiếu `DEFENSE` đã gửi của các thành viên hội đồng.
- Điểm tổng kết = `30% × điểm phản biện + 70% × điểm bảo vệ`, làm tròn hai chữ số thập phân theo quy tắc half-up. Điểm đạt là từ `5.00`.
- Chỉ tính/công bố khi hội đồng hoàn tất, nhóm có thành viên và mỗi sinh viên có đúng một phiếu `REVIEW` từ phản biện được chỉ định cùng một phiếu `DEFENSE` từ từng thành viên hội đồng.
- Điểm công bố được lưu thành bản chụp bất biến theo phân công/sinh viên; không cho phép công bố lại. Giao dịch khóa hội đồng để tránh hai yêu cầu công bố đồng thời và ghi nhật ký kiểm toán khi thành công.
- Quản trị viên được xem toàn bộ khoa; trưởng khoa chỉ được xem dữ liệu thuộc khoa mình được phân công. Sinh viên chỉ xem kết quả của chính mình sau khi công bố. Nội dung nhận xét trong phiếu đánh giá không được trả về cho sinh viên.
- Thống kê chỉ tính kết quả đã công bố, nhóm theo đợt đăng ký, khoa và đề tài. Báo cáo có số sinh viên, điểm trung bình, số đạt/chưa đạt và các khoảng điểm: dưới `5.00`, `5.00–5.99`, `6.00–6.99`, `7.00–7.99`, `8.00–8.99`, `9.00–10.00`.
- Báo cáo điểm là chức năng riêng, không thay thế tài liệu báo cáo của module 11 hoặc các chỉ số tài khoản/hệ thống trên Dashboard. CSV dùng UTF-8, escape dấu nháy và trung hòa tiền tố công thức bảng tính trong dữ liệu văn bản.

## API

Các endpoint dưới đây cần JWT và được nối với tiền tố API cấu hình (mặc định `/api`).

| Phương thức | Endpoint | Quyền | Chức năng |
| --- | --- | --- | --- |
| GET | `/results/assignments/{assignmentId}` | Quản trị viên/trưởng khoa, giới hạn theo khoa | Xem điểm tính trước hoặc bản điểm đã công bố |
| POST | `/results/assignments/{assignmentId}/publish` | Quản trị viên/trưởng khoa, giới hạn theo khoa | Công bố kết quả của phân công đã hoàn tất |
| GET | `/results/me` | Sinh viên | Xem kết quả đã công bố của chính mình |
| GET | `/results/reports/options` | Quản trị viên/trưởng khoa, giới hạn theo khoa | Tải lựa chọn bộ lọc đợt, khoa và đề tài |
| GET | `/results/reports` | Quản trị viên/trưởng khoa, giới hạn theo khoa | Xem thống kê; hỗ trợ `periodId`, `departmentId`, `topicId` |
| GET | `/results/reports.csv` | Quản trị viên/trưởng khoa, giới hạn theo khoa | Tải báo cáo CSV theo cùng bộ lọc |

## Lưu trữ

Bảng `final_results` chỉ lưu bản điểm đã công bố, có ràng buộc duy nhất trên cặp phân công/sinh viên. Cấu trúc MySQL được khai báo trong `be/src/main/resources/schema.sql`; môi trường kiểm thử dùng Hibernate tạo bảng.
