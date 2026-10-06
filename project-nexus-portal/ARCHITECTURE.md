# SỔ TAY KIẾN TRÚC & QUY CHUẨN DỰ ÁN (PROJECT ARCHITECTURE & CONVENTIONS)

Chào mừng bạn đến với monorepo **`project-nexus-portal`**. Tài liệu này giải thích cấu trúc tổ chức, vai trò từng tầng, phong cách viết code, cách chỉnh sửa Models trong Java, và luồng dữ liệu của hệ thống.

---

## 1. Sơ đồ cây trực quan của Monorepo (Visual Monorepo Map)

```text
project-nexus-portal/
├── ARCHITECTURE.md              # Kim chỉ nam kiến trúc, phong cách code & hướng dẫn models
├── README.md                    # Hướng dẫn cài đặt, cấu hình môi trường & chạy hệ thống
│
├── be/                          # BACKEND: Java 17 + Spring Boot 3.3.x
│   ├── .env                     # File biến môi trường riêng cho Backend (DB, Port, JWT, CORS)
│   ├── .env.example             # File mẫu biến môi trường cho Backend
│   ├── Dockerfile               # Multi-stage build (Maven build -> Temurin JRE runtime)
│   ├── docker-compose.yml       # Docker Compose riêng cho Backend API + MySQL Database
│   ├── pom.xml                  # Quản lý thư viện: Spring Boot 3, Jakarta EE, Security 6, JJWT
│   └── src/
│       ├── main/
│       │   ├── java/com/nexus/portal/
│       │   │   ├── NexusPortalApplication.java # Entry point khởi động Spring Boot
│       │   │   ├── config/              # Cấu hình hệ thống (CorsConfig với 1 CORS_ALLOWED_ORIGIN)
│       │   │   ├── controller/          # Tầng Controller: Tiếp nhận HTTP request, trả JSON
│       │   │   ├── service/             # Tầng Service Interface (DIP - Dependency Inversion)
│       │   │   │   └── impl/            # Tầng Service Implementation (Business Logic - SRP)
│       │   │   ├── repository/          # Tầng Repository: Spring Data JPA (JpaRepository)
│       │   │   ├── model/               # Tầng Model dữ liệu / JPA Entity (User, Role, BaseEntity)
│       │   │   ├── dto/                 # Tầng DTO (Data Transfer Object)
│       │   │   │   ├── request/         # Request DTOs (LoginRequest, RegisterRequest, ...)
│       │   │   │   └── response/        # Response DTOs (ApiResponse<T>, AuthResponse, ...)
│       │   │   ├── exception/           # Xử lý ngoại lệ tập trung (@RestControllerAdvice)
│       │   │   └── security/            # Spring Security 6, JWT Filter, Stateless Session
│       │   └── resources/
│       │       └── application.yml      # Cấu hình ánh xạ 100% từ biến môi trường của be/.env
│       └── test/
│
└── fe/                          # FRONTEND: ReactJS (Vite) + Tailwind CSS + Lucide Icons
    ├── .env                     # File biến môi trường riêng cho Frontend (VITE_API_BASE_URL, PORT)
    ├── .env.example             # File mẫu biến môi trường cho Frontend
    ├── Dockerfile               # Multi-stage build (Node 20 build -> Nginx Alpine serve)
    ├── docker-compose.yml       # Docker Compose riêng cho Frontend Nginx
    ├── nginx.conf               # Nginx reverse proxy & fallback routing cho SPA
    ├── package.json             # Khai báo dependencies: react, react-router-dom, axios, lucide
    ├── vite.config.js           # Cấu hình Vite build & dev server
    ├── tailwind.config.js       # Cấu hình theme Tailwind CSS
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── components/
        │   ├── common/          # UI Reusable components (Card, Table, Badge, Button, Input)
        │   └── layout/          # Admin Dashboard layout: Sidebar, Header, MainLayout (Outlet)
        ├── routes/              # Cấu hình React Router DOM, Outlet & Protected Routes
        ├── pages/               # DashboardPage, UsersPage, RolesPage, LoginPage, NotFoundPage
        ├── services/            # Axios Client bắt buộc VITE_API_BASE_URL (báo lỗi rõ ràng nếu thiếu)
        ├── context/             # AuthContext quản lý state đăng nhập toàn cục
        ├── App.jsx
        └── main.jsx
```

---

## 2. Hướng dẫn thêm cột hoặc đổi kiểu dữ liệu trong Java Models

Tất cả các bảng cơ sở dữ liệu được định nghĩa dưới dạng **Java Models** tại thư mục:
👉 `be/src/main/java/com/nexus/portal/model/` (ví dụ: `User.java`, `Role.java`, `BaseEntity.java`).

### 2.1 Cách thêm một cột mới vào Model (Ví dụ thêm `phone_number` vào `User`)
1. **Mở file model tương ứng**: [User.java](file:///Volumes/Outdoor/CNKT/LapTrinhWeb/laptrinhweb_ute/project-nexus-portal/be/src/main/java/com/nexus/portal/model/User.java).
2. **Khai báo thuộc tính với Jakarta persistence annotation**:
   ```java
   @Column(name = "phone_number", length = 20)
   private String phoneNumber;
   ```
3. **Thêm Getter & Setter**:
   ```java
   public String getPhoneNumber() {
       return phoneNumber;
   }

   public void setPhoneNumber(String phoneNumber) {
       this.phoneNumber = phoneNumber;
   }
   ```
4. **Cơ chế cập nhật Database tự động**:
   - Nhờ cấu hình `HIBERNATE_DDL_AUTO=update` trong `be/.env` và `application.yml`, khi Spring Boot khởi động lại, Hibernate sẽ tự sinh lệnh SQL:
     ```sql
     ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
     ```
     Dữ liệu cũ trong bảng `users` được giữ nguyên vẹn 100%.
5. **Cập nhật DTO tương ứng**:
   - Bổ sung trường `phoneNumber` vào `UserResponse.java` (để trả về FE) và `UserUpdateRequest.java` (để FE gửi lên cập nhật).

### 2.2 Cách đổi kiểu dữ liệu hoặc đổi tên cột
1. **Thay đổi kiểu dữ liệu trong Java Model**:
   - Ví dụ đổi `private String avatarUrl;` thành `private String profilePicture;` hoặc đổi `int` sang `Long`.
2. **Lưu ý với Hibernate update**:
   - Hibernate `ddl-auto: update` có thể tự động nới rộng kiểu dữ liệu (ví dụ `VARCHAR(50)` $\rightarrow$ `VARCHAR(255)`), nhưng không tự xóa hoặc thu hẹp kiểu dữ liệu để đảm bảo an toàn cho dữ liệu production.

---

## 3. Trách nhiệm các tầng & Nguyên tắc SOLID (Clean Architecture)

### 3.1 Backend (`be`)
1. **`controller/`**: Đón nhận HTTP Request, gọi tầng Validation, chuyển giao công việc cho Service Interface và trả về `ResponseEntity<ApiResponse<T>>`.
2. **`service/` (Interface) & `service/impl/` (Implementation)**: Chứa nghiệp vụ xử lý dữ liệu. Tuân thủ **DIP (Dependency Inversion)**: Controller chỉ tiêm (inject) Interface `XxxService`.
3. **`repository/`**: Kế thừa `JpaRepository<T, ID>`, chịu trách nhiệm đơn nhất (SRP) về đọc/ghi dữ liệu MySQL.
4. **`model/`**: Định nghĩa cấu trúc bảng quan hệ (Entity Models), sử dụng chuẩn **Jakarta Persistence (`jakarta.persistence.*`)**.
5. **`dto/`**: Phân tách rõ ràng giữa dữ liệu client gửi lên (`request/`) và dữ liệu trả về cho client (`response/`).
6. **`exception/`**: Tập trung xử lý lỗi toàn hệ thống qua `GlobalExceptionHandler` (`@RestControllerAdvice`).
7. **`security/`**: Cấu hình Spring Security 6 với JWT Filter, thiết lập cơ chế Stateless Session.
8. **`config/`**: `CorsConfig.java` đọc đúng **1 URL duy nhất** từ biến môi trường `CORS_ALLOWED_ORIGIN`.

### 3.2 Frontend (`fe`)
1. **`layout/` (`MainLayout`, `Sidebar`, `Header`)**: Khung Admin Dashboard cố định với `<Outlet />` render động các trang con.
2. **`services/api.js`**:
   - Kiểm tra nghiêm ngặt biến môi trường `VITE_API_BASE_URL` (báo lỗi rõ ràng nếu thiếu, không dùng fallback ngầm).
   - Tự động gắn JWT token `Authorization: Bearer <token>` và bắt lỗi 401.
3. **`context/AuthContext.jsx`**: Quản lý trạng thái xác thực (`user`, `token`, `login()`, `logout()`, `hasRole()`).
4. **Báo lỗi tường minh (No silent masking)**: Các màn hình hiển thị Banner lỗi rõ ràng khi không kết nối được Backend.

---

## 4. Quy chuẩn phong cách Code (Coding Style & Conventions)

### 4.1 Quy chuẩn Backend (Java 17 / Spring Boot 3)
- **Quy tắc đặt tên (Naming Conventions)**:
  - Package: `com.nexus.portal.<layer>` (viết thường toàn bộ).
  - Class / Interface: `PascalCase` (ví dụ: `UserController`, `AuthService`, `UserPrincipal`).
  - Method & Variable: `camelCase`, bắt đầu bằng động từ (ví dụ: `getUserById()`, `authenticateUser()`).
  - Constant: `UPPER_SNAKE_CASE` (ví dụ: `ROLE_ADMIN`, `JWT_EXPIRATION_MS`).
- **Dependency Injection**:
  - **TUYỆT ĐỐI KHÔNG DÙNG `@Autowired` TRÊN TRƯỜNG (Field Injection)**.
  - Sử dụng **Constructor Injection** với từ khóa `private final` để đảm bảo tính bất biến và dễ viết Unit Test.
- **Chuẩn hóa Request/Response**:
  - Mọi API endpoint trả về dữ liệu đều phải bọc trong `ResponseEntity<ApiResponse<T>>`.
  - Mọi Request DTO bắt buộc sử dụng `@Valid` kèm annotation Jakarta Validation.

### 4.2 Quy chuẩn Frontend (ReactJS / Vite / Tailwind)
- **Quy tắc đặt tên**:
  - Component & Page files: `PascalCase.jsx` (`DashboardPage.jsx`, `Sidebar.jsx`).
  - Custom Hooks: `camelCase.js` (`useAuth.js`).
  - Services: `camelCase.js` (`api.js`).
- **Không dùng Fallback ẩn lỗi**:
  - Kiểm tra biến môi trường nghiêm ngặt, hiển thị thông báo lỗi thân thiện thay vì fallback dữ liệu ảo làm sai lệch trạng thái hệ thống.
- **Thứ tự sắp xếp Tailwind CSS**:
  - Layout $\rightarrow$ Spacing $\rightarrow$ Sizing $\rightarrow$ Typography $\rightarrow$ Background & Color $\rightarrow$ State & Transition.

## 5. Tích hợp Module 11–13

- `ReportController` → `ReportService` → `ReportServiceImpl`: phiên bản tài liệu gắn với `TopicRegistration` đã duyệt; nội dung file lưu BLOB cùng transaction, DTO metadata tách khỏi DTO nội dung tải xuống.
- `CouncilController` → `CouncilService` → `CouncilServiceImpl`: hội đồng, vai trò giảng viên, lịch và phân công nhóm; `DefenseAssignment` gắn hội đồng với đăng ký của nhóm.
- `AssessmentController` → `AssessmentService` → `AssessmentServiceImpl`: phiếu nháp/đã gửi cho từng sinh viên và người chấm, lưu riêng các điểm thành phần để module 14 tính kết quả.
- `DefenseAccessPolicy` là component nghiệp vụ dùng chung để kiểm tra quyền theo bản ghi (nhóm, giảng viên hướng dẫn, bộ môn, hội đồng), bên cạnh Spring Security và route guards.
- `ReportsPage`, `CouncilsPage`, `AssessmentsPage` sử dụng service Axios riêng và component dùng chung trong `components/common/`; các route và sidebar được tích hợp với layout hiện có.
- Mutation có transaction `READ_COMMITTED` và khóa pessimistic để tránh trùng phiên bản, phân công trùng, lịch giao nhau hoặc ghi đè phiếu đã gửi khi có request đồng thời. Trạng thái và quyền trên FE do BE cung cấp; service luôn kiểm tra lại quyền khi xử lý request.
- Chi tiết quy tắc và hợp đồng API: [MODULES_11_12_13.md](./docs/MODULES_11_12_13.md).
