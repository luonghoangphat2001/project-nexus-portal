# Dữ liệu demo Hội đồng và Chấm điểm

Tài liệu này hướng dẫn thực hành quy trình hội đồng trên dữ liệu mẫu Module 11–13. Bộ dữ liệu được thêm bởi `be/src/main/resources/data/09_demo_defense_data.sql` và gắn vào danh sách khởi tạo trong `be/src/main/resources/application.yml`.

## Tài khoản demo

Tất cả tài khoản dưới đây dùng mật khẩu `password123`.

| Tài khoản | Vai trò / mục đích |
|---|---|
| `principal` | Quản lý hội đồng và phân công nhóm |
| `council` | Phản biện của hội đồng demo |
| `council3` | Thư ký hội đồng demo |
| `teacher2` | Thành viên hội đồng demo |
| `teacher` | GVHD Team Alpha |
| `teacher6` | GVHD Team Beta |
| `phamnhathoang` | GVHD Team Gamma |
| `demo_student_01` … `demo_student_06` | Sinh viên trong ba nhóm demo |
| `demo_student_07` | Sinh viên tự do để thử nhận lời mời vào nhóm |

## Nhóm đủ điều kiện bảo vệ

Ba đăng ký demo đều thuộc đợt Kỳ 1 (2026–2027), hiện seed ở trạng thái `OPEN`, đã được duyệt và có báo cáo nộp. Mỗi nhóm có hai thành viên. Sau khi đề tài được duyệt, nhóm được khóa theo đúng quy tắc nghiệp vụ.

| Nhóm | Mã đăng ký | Trạng thái hội đồng |
|---|---:|---|
| Demo Defense Team Alpha | 10 | Đã phân vào Hội đồng Demo Module 11–13 |
| Demo Defense Team Beta | 11 | Chưa phân công, sẵn sàng để chọn |
| Demo Defense Team Gamma | 12 | Chưa phân công, sẵn sàng để chọn |

Hội đồng demo được lên lịch tự động sau ngày chạy seed 14 ngày, tại Phòng Demo A1-101. Hội đồng có chủ tịch `principal`, thư ký `council3`, phản biện `council` và ủy viên `teacher2`. Team Alpha có báo cáo PDF mẫu để mở ngay luồng xem hồ sơ, lưu nháp và nộp phiếu. Hai nhóm còn lại giúp thực hành phân công vào hội đồng.

## Kịch bản thực hành

1. Đăng nhập bằng `principal` và mở **Hội đồng chấm**. Chọn Beta hoặc Gamma trong danh sách nhóm đủ điều kiện để phân công.
2. Mở **Hồ sơ nộp** của một nhóm để xem báo cáo đã nộp. Có thể đăng nhập trưởng nhóm tương ứng (`demo_student_01`, `demo_student_03` hoặc `demo_student_05`) để gửi phiên bản tài liệu mới.
3. Đăng nhập `teacher`, `teacher6` hoặc `phamnhathoang` để nhập phiếu GVHD cho nhóm được hướng dẫn.
4. Đăng nhập `council` để nhập phiếu phản biện. Đăng nhập chủ tịch, thư ký hoặc ủy viên hội đồng để nhập điểm bảo vệ.
5. Khi một phiếu được nộp và khóa, quay lại **Hội đồng chấm** bằng tài khoản quản lý: nút **Hủy phân công** bị vô hiệu hóa; **Bảng chấm điểm** và **Hồ sơ nộp** vẫn mở được.
6. Đăng nhập `individual_user` (trưởng nhóm **Demo Team for Joining**), mời `demo_student_07`, rồi đăng nhập `demo_student_07` để chấp nhận lời mời.

## Khởi tạo dữ liệu

Script demo chạy cùng các script SQL seed khi `SQL_INIT_MODE=always`. Với cơ sở dữ liệu local đã có dữ liệu, không đổi chế độ khởi tạo tùy tiện: chạy script trên môi trường demo/local phù hợp. Các môi trường dùng dữ liệu thật nên để `SQL_INIT_MODE=never` theo hướng dẫn trong README.

Các phiếu chấm không được seed sẵn để người thực hành có thể tự nhập điểm và kiểm tra từng vai trò. Sau khi có phiếu chấm, API từ chối hủy phân công; trạng thái này cũng được trả về giao diện để vô hiệu hóa nút tương ứng.
