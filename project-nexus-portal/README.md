# Project Nexus Portal

Enterprise Monorepo Portal System:
- **Backend (`be`)**: Java 17, Spring Boot 3.3.x, Spring Security 6 (Stateless JWT), Spring Data JPA, MySQL 8, Jakarta EE, Clean Architecture & SOLID. Có sẵn `.env` và `docker-compose.yml` riêng.
- **Frontend (`fe`)**: ReactJS (Vite), Tailwind CSS, Lucide Icons, Admin Dashboard Layout (Sidebar, Header, Outlet), Axios Client (Interceptor). Có sẵn `.env` và `docker-compose.yml` riêng.
- **Tài liệu kiến trúc & Hướng dẫn Java Models**: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 1. Khởi chạy bằng Docker Compose (Độc lập trong từng thư mục)

### 1.1 Khởi chạy Backend & MySQL
```bash
cd project-nexus-portal/be
docker-compose up -d --build
```
- **Backend API**: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
- **MySQL Database**: `localhost:3306` (`nexus_db`)

### 1.2 Khởi chạy Frontend (React + Nginx)
```bash
cd project-nexus-portal/fe
docker-compose up -d --build
```
- **Frontend App**: [http://localhost:3000](http://localhost:3000)

---

## 2. Khởi chạy trực tiếp (Local Development)

### 2.1 Backend (`be`)
```bash
cd project-nexus-portal/be
mvn clean spring-boot:run
```

### 2.2 Frontend (`fe`)
```bash
cd project-nexus-portal/fe
npm install
npm run dev
```
Truy cập: [http://localhost:5173](http://localhost:5173).

---

## 3. Quản lý Models và Cơ sở dữ liệu trong Java
Xem hướng dẫn thêm cột, sửa kiểu dữ liệu trong Java Models tại:
👉 [ARCHITECTURE.md](./ARCHITECTURE.md#2-hướng-dẫn-thêm-cột-hoặc-đổi-kiểu-dữ-liệu-trong-java-models)

## 4. Module 11, 12, 13

Đã triển khai đầy đủ BE/FE cho Nộp báo cáo & Tài liệu (`/reports`), Phân công hội đồng (`/councils`), Phản biện & Chấm điểm (`/assessments`). Các module sử dụng đăng ký đề tài đã duyệt và quyền truy cập theo nhóm, bộ môn, hội đồng.

Xem [hướng dẫn nghiệp vụ, API, cấu hình và kiểm thử](./docs/MODULES_11_12_13.md). Backend mặc định nhận tệp tối đa 10 MiB; JPA/`schema.sql` bổ sung năm bảng. Chạy `mvn test` trong `be` và `npm run build` trong `fe` để kiểm tra.

Xem [Functional Test Cases cho module 11–13](./docs/TEST_CASES_MODULES_11_12_13.md) để kiểm tra từng chức năng, quyền truy cập và luồng thực tế trên localhost/MySQL. Script `python scripts/qa_defense_localhost.py` tạo dữ liệu QA riêng và lưu kết quả thực thi; `--setup-only` chuẩn bị dữ liệu cho vòng kiểm thử bằng trình duyệt.

Các endpoint ghép theo `API_PREFIX`; `.env.example` hiện dùng `/api`, tương ứng `VITE_API_BASE_URL=http://localhost:8080/api`. Dữ liệu mẫu cần được duyệt đăng ký trước khi thực hành module 11–13. Với DB đã sử dụng, đặt `SQL_INIT_MODE=never` để không chạy lại seed phát triển.
