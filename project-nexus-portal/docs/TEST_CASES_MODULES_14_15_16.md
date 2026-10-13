# Module 14–16 Test Cases

Tài liệu liệt kê các test tự động của module 14–16 (JUnit, `be/src/test`). Chưa ghi kết quả thực thi: chạy `mvn test` trong `be` và cập nhật mục Execution Summary khi có kết quả.

## Execution Summary

- Chưa chạy trên môi trường localhost/MySQL.
- Chạy: `cd be && mvn test`; `cd fe && npm run build`.

## Tính điểm (Module 14) — `ScoreCalculatorTest`, `ScoreCalculationServiceImplTest`

| Mã | Kịch bản | Kỳ vọng |
| --- | --- | --- |
| G-01 | Điểm phiếu = trung bình ba tiêu chí; điểm bảo vệ = trung bình mọi phiếu DEFENSE | Đúng số liệu |
| G-02 | Điểm cuối = 30% phản biện + 70% bảo vệ, làm tròn half-up 2 chữ số | Đúng làm tròn |
| G-03 | Ngưỡng đạt 5.00 | `5.00` là đạt |
| G-04 | Xem trước điểm của phân công đã hoàn thành | Trả danh sách điểm |
| G-05 | Điểm đã công bố | Trả bản đã lưu, không tính lại |
| G-06 | Thiếu phiếu REVIEW/DEFENSE | Từ chối, không trả điểm một phần |
| G-07 | Hội đồng chưa hoàn thành | Từ chối |
| G-08 | Quản lý ngoài khoa được phân công | Từ chối quyền |

## Công bố điểm (Module 15) — `ResultPublicationServiceImplTest`

| Mã | Kịch bản | Kỳ vọng |
| --- | --- | --- |
| P-01 | Công bố sau khi hội đồng hoàn thành | Lưu bản chụp điểm có trọng số, ghi audit |
| P-02 | Bộ phiếu không đầy đủ | Từ chối, không lưu điểm một phần |
| P-03 | Hội đồng chưa hoàn thành | Từ chối |
| P-04 | Quản lý ngoài khoa được phân công | Từ chối quyền |
| P-05 | Công bố lần hai cho cùng phân công | Từ chối |
| P-06 | Sinh viên xem `/results/me` | Chỉ thấy điểm đã công bố của mình, không có nhận xét |

## Báo cáo & Thống kê (Module 16) — `ScoreRangeClassifierTest`, `ResultStatisticsServiceImplTest`

| Mã | Kịch bản | Kỳ vọng |
| --- | --- | --- |
| R-01 | Phân loại khoảng điểm tại các biên | Đúng khoảng |
| R-02 | Thống kê theo bộ lọc được phép | Chỉ tính điểm đã công bố |
| R-03 | Khoa ngoài phạm vi quản lý | Từ chối trước khi truy vấn |
| R-04 | Tải CSV | UTF-8, escape dấu ngoặc kép, vô hiệu hóa tiền tố công thức |
