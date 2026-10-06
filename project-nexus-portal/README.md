# Project Nexus Portal

Enterprise Monorepo Portal System:
- **Backend (`be`)**: Java 17, Spring Boot 3.3.x, Spring Security 6 (Stateless JWT), Spring Data JPA, MySQL 8, Jakarta EE, Clean Architecture & SOLID. Có sẵn `.env` và `docker-compose.yml` riêng.
- **Frontend (`fe`)**: ReactJS (Vite), Tailwind CSS, Lucide Icons, Admin Dashboard Layout (Sidebar, Header, Outlet), Axios Client (Interceptor). Có sẵn `.env` và `docker-compose.yml` riêng.
- **Tài liệu kiến trúc & Hướng dẫn Java Models**: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

Before starting, create both environment files from their templates (skip any file that already exists):

`powershell
Copy-Item be/.env.example be/.env
Copy-Item fe/.env.example fe/.env
`

Run these commands from the directory containing e and e. The frontend requires VITE_API_BASE_URL=http://localhost:8080/api. Local Maven must be installed and available on PATH; Docker includes Maven and Java in the backend build image.

## 1. Khởi chạy bằng Docker Compose (Độc lập trong từng thư mục)

### 1.1 Khởi chạy Backend & MySQL
```bash
cd project-nexus-portal/be
docker-compose up -d --build
```
- **Backend API**: [http://localhost:8080/api](http://localhost:8080/api)
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
Truy cập: [http://localhost:3000](http://localhost:3000).

---

## 3. Quản lý Models và Cơ sở dữ liệu trong Java
Xem hướng dẫn thêm cột, sửa kiểu dữ liệu trong Java Models tại:
👉 [ARCHITECTURE.md](./ARCHITECTURE.md#2-hướng-dẫn-thêm-cột-hoặc-đổi-kiểu-dữ-liệu-trong-java-models)
