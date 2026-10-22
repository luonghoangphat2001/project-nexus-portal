from pathlib import Path
from datetime import date
from xml.sax.saxutils import escape
import os

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, KeepTogether, Preformatted, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


REPO = Path(__file__).resolve().parents[2]
APP = REPO / "project-nexus-portal"
DOWNLOADS = Path.home() / "Downloads"
OUTPUT = DOWNLOADS / "NexusPortal_Modules_11-13_Technical_Guide.pdf"
DOWNLOADS.mkdir(parents=True, exist_ok=True)

FONT_REG = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")
FONT_ITALIC = Path(r"C:\Windows\Fonts\ariali.ttf")
FONT_BOLD_ITALIC = Path(r"C:\Windows\Fonts\arialbi.ttf")
for p in (FONT_REG, FONT_BOLD, FONT_ITALIC, FONT_BOLD_ITALIC):
    if not p.exists():
        raise FileNotFoundError(f"Required Vietnamese font not found: {p}")
pdfmetrics.registerFont(TTFont("ArialVN", str(FONT_REG)))
pdfmetrics.registerFont(TTFont("ArialVN-Bold", str(FONT_BOLD)))
pdfmetrics.registerFont(TTFont("ArialVN-Italic", str(FONT_ITALIC)))
pdfmetrics.registerFont(TTFont("ArialVN-BoldItalic", str(FONT_BOLD_ITALIC)))
pdfmetrics.registerFontFamily("ArialVN", normal="ArialVN", bold="ArialVN-Bold",
                              italic="ArialVN-Italic", boldItalic="ArialVN-BoldItalic")

NAVY = colors.HexColor("#14294B")
BLUE = colors.HexColor("#2457D6")
PALE = colors.HexColor("#EEF4FF")
INK = colors.HexColor("#243247")
MUTED = colors.HexColor("#617187")
LINE = colors.HexColor("#D8E1EC")
GREEN = colors.HexColor("#0E7857")
AMBER = colors.HexColor("#9A5B00")
RED = colors.HexColor("#A83232")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitleVN", fontName="ArialVN-Bold", fontSize=27,
                          leading=33, textColor=NAVY, alignment=TA_LEFT, spaceAfter=8))
styles.add(ParagraphStyle(name="CoverSubVN", fontName="ArialVN", fontSize=13,
                          leading=20, textColor=MUTED, spaceAfter=8))
styles.add(ParagraphStyle(name="H1VN", fontName="ArialVN-Bold", fontSize=20,
                          leading=26, textColor=NAVY, spaceBefore=4, spaceAfter=9,
                          keepWithNext=True))
styles.add(ParagraphStyle(name="H2VN", fontName="ArialVN-Bold", fontSize=13.5,
                          leading=18, textColor=BLUE, spaceBefore=10, spaceAfter=5,
                          keepWithNext=True))
styles.add(ParagraphStyle(name="H3VN", fontName="ArialVN-Bold", fontSize=10.5,
                          leading=14, textColor=INK, spaceBefore=7, spaceAfter=3,
                          keepWithNext=True))
styles.add(ParagraphStyle(name="BodyVN", fontName="ArialVN", fontSize=9.2,
                          leading=14.1, textColor=INK, spaceAfter=6, alignment=TA_LEFT))
styles.add(ParagraphStyle(name="BodySmallVN", fontName="ArialVN", fontSize=8.1,
                          leading=11.2, textColor=INK, spaceAfter=3))
styles.add(ParagraphStyle(name="TableVN", fontName="ArialVN", fontSize=7.8,
                          leading=10.4, textColor=INK))
styles.add(ParagraphStyle(name="TableHeadVN", fontName="ArialVN-Bold", fontSize=7.8,
                          leading=10.4, textColor=colors.white))
styles.add(ParagraphStyle(name="NoteVN", fontName="ArialVN", fontSize=8.5,
                          leading=12.4, textColor=NAVY, leftIndent=7, rightIndent=7,
                          spaceBefore=3, spaceAfter=3))
styles.add(ParagraphStyle(name="CodeVN", fontName="Courier", fontSize=7.3,
                          leading=10, textColor=INK))
styles.add(ParagraphStyle(name="SmallCenterVN", fontName="ArialVN", fontSize=8.3,
                          leading=11, textColor=MUTED, alignment=TA_CENTER))


def P(text, style="BodyVN"):
    return Paragraph(text, styles[style])


def plain(text, style="BodyVN"):
    return P(escape(text), style)


def bullet(text, level=0):
    indent = 12 + level * 13
    return Paragraph(escape(text), ParagraphStyle(
        name=f"bullet_{indent}_{len(text)}", parent=styles["BodyVN"],
        leftIndent=indent, firstLineIndent=-9, bulletIndent=0, bulletFontName="ArialVN",
        bulletFontSize=8, bulletColor=BLUE, spaceAfter=3), bulletText="•")


def bullets(items):
    return [bullet(x) for x in items]


def table(rows, widths, header=True, repeatRows=1, font="TableVN", padd=5):
    cooked = []
    for ri, row in enumerate(rows):
        cooked.append([cell if isinstance(cell, (Paragraph, Table, Preformatted))
                       else P(str(cell), "TableHeadVN" if header and ri == 0 else font)
                       for cell in row])
    t = Table(cooked, colWidths=widths, repeatRows=repeatRows if header else 0,
              hAlign="LEFT", splitByRow=1)
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), padd),
        ("RIGHTPADDING", (0, 0), (-1, -1), padd),
        ("TOPPADDING", (0, 0), (-1, -1), padd),
        ("BOTTOMPADDING", (0, 0), (-1, -1), padd),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
    ]
    if header:
        cmds.extend([("BACKGROUND", (0, 0), (-1, 0), NAVY),
                     ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F6F9FC")])])
    else:
        cmds.append(("BACKGROUND", (0, 0), (-1, -1), PALE))
    t.setStyle(TableStyle(cmds))
    return t


def note(text, color=PALE):
    t = Table([[P(text, "NoteVN")]], colWidths=[170*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("BOX", (0, 0), (-1, -1), 0.7, BLUE if color == PALE else LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def code(text):
    t = Table([[Preformatted(text, styles["CodeVN"])]], colWidths=[170*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F2F5F9")),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return t


def header_footer(canvas, doc):
    canvas.saveState()
    width, height = A4
    if doc.page > 1:
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.5)
        canvas.line(20*mm, height-15*mm, width-20*mm, height-15*mm)
        canvas.setFont("ArialVN-Bold", 7.5)
        canvas.setFillColor(NAVY)
        canvas.drawString(20*mm, height-11.5*mm, "NEXUS PORTAL  |  MODULES 11-13")
        canvas.setFont("ArialVN", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(width-20*mm, height-11.5*mm, "Tài liệu học và thuyết trình")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(20*mm, 14*mm, width-20*mm, 14*mm)
    canvas.setFont("ArialVN", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(20*mm, 9*mm, "Nexus Portal | Bản hướng dẫn kỹ thuật | 22/10/2026")
    canvas.drawRightString(width-20*mm, 9*mm, f"Trang {doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(str(OUTPUT), pagesize=A4,
                      leftMargin=20*mm, rightMargin=20*mm,
                      topMargin=21*mm, bottomMargin=20*mm,
                      title="Nexus Portal - Technical Guide Modules 11-13",
                      author="Nexus Portal engineering guide",
                      subject="Giải thích kiến trúc, bảo mật và nghiệp vụ Modules 11-13")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height,
              leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="normal")
doc.addPageTemplates([PageTemplate(id="guide", frames=[frame], onPage=header_footer)])

story = []

# Cover
story += [Spacer(1, 29*mm), P("NEXUS PORTAL", "H2VN"),
          HRFlowable(width="100%", thickness=2, color=BLUE, spaceBefore=2, spaceAfter=14),
          P("Technical Guide<br/>Modules 11-13", "CoverTitleVN"),
          P("Reports &amp; Documents | Defense Councils | Reviews &amp; Assessments", "CoverSubVN"),
          Spacer(1, 8*mm),
          note("Tài liệu này giải thích cách ba module được tổ chức, cách dữ liệu đi qua frontend, API và cơ sở dữ liệu, và vì sao các quy tắc phân quyền/chấm điểm được đặt ở backend. Mục tiêu là giúp bạn tự đọc, trình bày và biết chỗ cần sửa khi đổi nghiệp vụ."),
          Spacer(1, 20*mm),
          P("Dùng cho học tập, kiểm thử và thuyết trình kỹ thuật", "CoverSubVN"),
          P("Ngày rà soát: 22/10/2026 | Repository: Nexus Portal", "BodySmallVN"),
          PageBreak()]

# How to study
story += [P("Cách dùng tài liệu", "H1VN"),
          plain("Đọc theo thứ tự 11 -> 12 -> 13. Module 11 tạo tài liệu đầu vào cho đánh giá; Module 12 xác định hội đồng, lịch và nhóm được giao; Module 13 ghi nhận phiếu và tạo điểm kết quả. Mỗi phần có đường dẫn file và số dòng để bạn mở IDE theo dõi mã thật."),
          P("Mục tiêu sau khi đọc", "H2VN"),
          *bullets([
              "Vẽ lại được luồng từ thao tác trên web tới service, repository và bảng dữ liệu.",
              "Giải thích được vì sao kiểm tra quyền phải chạy ở backend, kể cả khi giao diện đã ẩn nút.",
              "Trình bày được lịch hội đồng, phạm vi khoa, phòng, thời gian và điều kiện gán nhóm.",
              "Tính được điểm 20% + 30% + 50%, biết lúc nào kết quả chưa đủ điều kiện để công bố.",
              "Biết file nào cần đổi khi thêm loại file, loại phiếu, tiêu chí điểm hoặc quy tắc role."
          ]),
          P("Từ vựng nhanh", "H2VN"),
          table([
              ["Từ trong code", "Nghĩa nghiệp vụ"],
              ["Registration", "Lượt đăng ký đề tài của một nhóm trong một đợt."],
              ["Assignment", "Việc gán registration đó vào một hội đồng."],
              ["Evaluator", "Tài khoản đang lập phiếu đánh giá."],
              ["Draft / Submitted", "Bản nháp còn sửa được / phiếu đã nộp và khóa."],
              ["Published result", "Điểm chính thức đã được người có quyền công bố cho sinh viên."],
              ["Primary advisor", "GVHD chính; là nguồn của thành phần điểm 20%."],
          ], [48*mm, 122*mm]),
          Spacer(1, 7),
          note("Quy ước trong tài liệu: tên module, tính năng và symbol giữ tiếng Anh để khớp Swagger/code; phần giải thích dùng tiếng Việt. Đường dẫn được tính từ thư mục gốc repository.")]

# Architecture overview
story += [PageBreak(), P("Bức tranh kiến trúc chung", "H1VN"),
          plain("Ba module dùng cùng mô hình phân lớp. React gọi các API REST; Controller nhận request và danh tính đăng nhập; DTO kiểm tra dữ liệu đầu vào; Service thực thi quy tắc nghiệp vụ và phân quyền theo đối tượng; Repository truy vấn/lưu entity qua JPA; MySQL giữ hồ sơ, phiếu và kết quả."),
          code("Browser (React page)\n    | JSON / multipart HTTP + JWT\n    v\nController (@Valid, @PreAuthorize)\n    | request DTO + authenticated username\n    v\nService (role + object policy + business rules + transaction)\n    | repository methods / pessimistic locks\n    v\nJPA entities -> MySQL\n    | response DTO (metadata, status flags, published snapshot)\n    v\nBrowser renders role-aware actions and status"),
          P("Một nguyên tắc quan trọng", "H2VN"),
          plain("Frontend chỉ giúp người dùng thấy đúng nút và trạng thái. Nó không phải ranh giới bảo mật. Ví dụ, giao diện có thể disable DEFENSE cho GVHD, nhưng AssessmentServiceImpl.requireEvaluator vẫn phải từ chối cùng request ở server. Nếu gọi API trực tiếp bằng Postman, quy tắc backend vẫn áp dụng."),
          P("Các lớp và trách nhiệm", "H2VN"),
          table([
              ["Lớp", "Vai trò", "Ví dụ trong repository"],
              ["Page / component", "Form, danh sách, trạng thái; gọi API service.", "fe/src/pages/ReportsPage.jsx; CouncilsPage.jsx; AssessmentsPage.jsx"],
              ["Controller", "HTTP route, xác thực role tổng quát, gọi service.", "be/src/main/java/com/nexus/portal/controller/ReportController.java; CouncilController.java; AssessmentController.java"],
              ["Request / response DTO", "Giới hạn dữ liệu nhận/trả; không nhận entity trực tiếp.", "dto/request/AssessmentRequest.java; dto/response/CouncilResponse.java"],
              ["Service + access policy", "Quy tắc nghiệp vụ, quyền theo khoa/nhóm/đề tài, transaction.", "service/impl/DefenseAccessPolicy.java và các service *Impl.java"],
              ["Repository + entity", "Đọc/ghi dữ liệu và ràng buộc quan hệ/duy nhất.", "repository/*.java; model/*.java"],
          ], [31*mm, 61*mm, 78*mm]),
          P("Cách đọc một tính năng trong IDE", "H2VN"),
          *bullets([
              "Tìm URL trong Controller và xem role annotation.",
              "Mở DTO request để hiểu field nào bắt buộc và giới hạn ra sao.",
              "Theo lời gọi xuống service; ghi lại thứ tự check quyền, trạng thái, dữ liệu rồi mới save.",
              "Mở repository/entity để hiểu uniqueness, khóa và quan hệ dữ liệu.",
              "Tìm test integration cùng tên quy tắc để xem hành vi được bảo vệ thế nào."
          ])]

# Module 11
story += [PageBreak(), P("Module 11 - Reports &amp; Documents", "H1VN"),
          plain("Module này nhận báo cáo và tài liệu từ nhóm, giữ phiên bản, cho đúng đối tượng xem/tải, và báo cho GVHD. Nội dung nhị phân lưu trong cột LONGBLOB của report_documents; danh sách thường chỉ trả metadata để tránh truyền file lớn khi tải trang."),
          P("Luồng upload", "H2VN"),
          code("ReportsPage.jsx -> POST /api/reports/registrations/{id}/documents\n  -> ReportController.uploadDocument(@Valid multipart request, auth)\n  -> ReportServiceImpl.uploadDocument(...)\n     1. load active user + lock approved registration\n     2. check read access + ROLE_USER + team membership + team leader\n     3. check deadline, council/assessment locks, file size and name\n     4. read bytes -> validate signature/encoding -> assign next version\n     5. save ReportDocument -> return metadata DTO"),
          P("File nào nên mở", "H2VN"),
          table([
              ["File / điểm vào", "Bạn sẽ học gì"],
              ["be/src/main/java/com/nexus/portal/controller/ReportController.java:31", "Multipart route và cách lấy danh tính từ Authentication."],
              ["be/src/main/java/com/nexus/portal/dto/request/ReportUploadRequest.java:7", "Kiểm tra type, title, note và MultipartFile bằng Bean Validation."],
              ["be/src/main/java/com/nexus/portal/service/impl/ReportServiceImpl.java:66", "Quy trình upload, khóa nghiệp vụ, xác thực nội dung và lưu phiên bản."],
              ["be/src/main/java/com/nexus/portal/service/impl/ReportServiceImpl.java:129", "Kiểm tra signature: PDF mở đầu %PDF-, DOCX/PPTX/ZIP là PK, TXT phải là UTF-8."],
              ["be/src/main/java/com/nexus/portal/model/ReportDocument.java:11", "Entity, quan hệ registration/submittedBy, metadata và byte[] content."],
              ["be/src/main/java/com/nexus/portal/repository/ReportDocumentRepository.java:8", "Projection metadata và truy vấn phiên bản lớn nhất."],
          ], [85*mm, 85*mm]),
          P("Giải thích các bước kiểm tra", "H2VN"),
          *bullets([
              "Đăng nhập: getUser tìm tài khoản theo username/email và từ chối tài khoản inactive.",
              "Đúng nhóm: registration phải APPROVED; người nộp có ROLE_USER, là thành viên và đồng thời là leader.",
              "Đúng hạn: thời điểm hiện tại phải <= submissionDeadline. Mốc đúng bằng deadline còn được nộp.",
              "Không bị khóa: nếu có phiếu SUBMITTED hoặc hội đồng đã COMPLETED, báo cáo mới không được thay đổi.",
              "Không tin MIME do browser gửi: service đọc bytes rồi đối chiếu chữ ký định dạng/UTF-8.",
              "Lưu file và metadata cùng một entity; unique key (registration, type, version) ngăn trùng số phiên bản."
          ]),
          note("Lưu ý: MIME/signature check ngăn file giả mạo phổ biến nhưng không thay thế antivirus hoặc sandbox. Nếu hệ thống triển khai cho file không tin cậy, nên thêm quét mã độc ở tầng lưu trữ.", colors.HexColor("#FFF6E5"))]

story += [P("Module 11 - quyền đọc, phiên bản và khóa hồ sơ", "H1VN"),
          P("Access matrix", "H2VN"),
          table([
              ["Người dùng", "Xem metadata/file", "Upload"],
              ["Leader thuộc registration", "Có", "Có, nếu còn hạn và chưa bị khóa"],
              ["Thành viên cùng nhóm", "Có", "Không"],
              ["GVHD của đề tài", "Có", "Không"],
              ["Thành viên hội đồng được giao", "Có", "Không"],
              ["Admin / principal đúng khoa", "Có", "Không qua luồng leader"],
              ["Sinh viên/giảng viên ngoài phạm vi", "403 hoặc không có registration trong danh sách", "Không"],
          ], [50*mm, 55*mm, 65*mm]),
          P("Metadata và nội dung được tách", "H2VN"),
          plain("ReportDocumentRepository.findMetadataByRegistrationId tạo ReportDocumentResponse chỉ gồm id, title, note, filename, contentType, size, version, người nộp và thời gian. Endpoint download mới đọc byte[] và yêu cầu DefenseAccessPolicy.requireRead. Cách tách này giảm tải trang và hạn chế trả file khi người dùng chỉ đang xem danh sách."),
          P("Versioning và cạnh tranh đồng thời", "H2VN"),
          plain("Service lấy số version lớn nhất rồi cộng 1. Hai upload đồng thời có thể cùng đọc một version nếu không được tuần tự hóa. Luồng upload khóa registration trong cơ sở dữ liệu; unique key vẫn là hàng rào cuối cùng nếu một race vượt qua tầng ứng dụng. Trong integration test, hai upload đồng thời nhận hai version khác nhau."),
          P("Lock nghiệp vụ sau đánh giá", "H2VN"),
          code("canSubmit = student role\n         AND current user is team member\n         AND current user is team leader\n         AND now <= submission deadline\n         AND no submitted assessment exists\n         AND assigned council is not COMPLETED"),
          plain("Điểm quan trọng: khóa upload sau khi có phiếu nộp giúp hội đồng và GVHD cùng đánh giá đúng một bộ tài liệu, tránh sinh viên thay file sau khi đã có điểm."),
          P("Nếu muốn đổi quy tắc file", "H2VN"),
          *bullets([
              "Đổi dung lượng: cấu hình app.reports.max-file-bytes và thông báo lỗi tương ứng.",
              "Thêm định dạng: sửa ReportServiceImpl.validateContent, kiểm tra signature, MIME tải xuống và test file giả.",
              "Đổi ai được upload: sửa DefenseAccessPolicy.canSubmit và kiểm tra lại phần role + team leader trong ReportServiceImpl.",
              "Đổi nơi lưu: hiện tại content nằm trong MySQL; nếu chuyển object storage, cần lưu storage key, giao dịch bù lỗi và quyền download vẫn phải đi qua requireRead."
          ])]

# Module 12
story += [PageBreak(), P("Module 12 - Defense Councils", "H1VN"),
          plain("Module này quản lý lịch hội đồng, phòng, thành viên có vai trò và danh sách nhóm. Chỉ Admin hoặc Principal có phạm vi phù hợp mới tạo/sửa/gán nhóm. Mọi quy tắc quan trọng đều được kiểm tra ở service, không dựa vào danh sách option mà giao diện gửi."),
          P("Quy tắc khi tạo/sửa lịch", "H2VN"),
          table([
              ["Kiểm tra", "Quy tắc trong code"],
              ["Quyền quản lý", "Admin toàn quyền; Principal phải thuộc department hoặc faculty của department."],
              ["Đợt đăng ký", "Không nhận đợt DRAFT hoặc COMPLETED; faculty mục tiêu phải bao gồm khoa hội đồng."],
              ["Thời gian", "startsAt phải ở tương lai; endsAt phải sau startsAt."],
              ["Thành viên", "3-15 người; mỗi người một role; tất cả là lecturer active thuộc khoa."],
              ["Vai trò bắt buộc", "Đúng một CHAIR, một SECRETARY, một REVIEWER."],
              ["Phòng và người", "Không đè lên lịch hội đồng khác; so phòng bỏ khoảng trắng đầu/cuối và không phân biệt hoa thường."],
              ["Sửa sau khi có phiếu", "Không đổi lịch/thành viên khi assessment tồn tại."],
          ], [43*mm, 127*mm]),
          P("Khoảng thời gian và xung đột", "H2VN"),
          code("overlap = newStart < oldEnd AND newEnd > oldStart\nroomConflict = overlap AND normalizedRoom matches\nmemberConflict = overlap AND lecturerId appears in both councils\n\nAdjacent intervals are allowed: [09:00, 11:00) and [11:00, 12:00)"),
          plain("Dùng khoảng nửa mở [start, end) giúp lịch kết thúc 11:00 có thể nối lịch kế tiếp lúc 11:00. Trước khi dò xung đột, create/update khóa các Department theo thứ tự id. Vì thao tác luôn khóa cả danh sách, hai request đồng thời ở hai khoa khác nhau cũng không thể cùng vượt qua check phòng/giảng viên."),
          P("File cần đọc", "H2VN"),
          table([
              ["File / điểm vào", "Ý nghĩa"],
              ["be/src/main/java/com/nexus/portal/controller/CouncilController.java:30", "Route tạo/sửa/status/assignment và role tổng quát ADMIN/PRINCIPAL."],
              ["be/src/main/java/com/nexus/portal/dto/request/CouncilRequest.java:9", "Ràng buộc tên, khoa, đợt, phòng, ngày giờ và 3-15 thành viên."],
              ["be/src/main/java/com/nexus/portal/service/impl/CouncilServiceImpl.java:115", "validateRequest: quy tắc lịch, role, department, room và member."],
              ["be/src/main/java/com/nexus/portal/service/impl/CouncilServiceImpl.java:180", "assignRegistration: chỉ giao nhóm vào lịch tương lai còn mở."],
              ["be/src/main/java/com/nexus/portal/repository/DepartmentRepository.java:15", "Pessimistic lock dùng để tuần tự hóa thay đổi lịch."],
              ["be/src/main/java/com/nexus/portal/repository/DefenseCouncilRepository.java:9", "Pessimistic lock trên hội đồng để đồng bộ sửa trạng thái và nộp phiếu."],
          ], [88*mm, 82*mm]),
          note("Tên phòng là chuỗi do Admin/Principal nhập; kiểm tra hiện tại xử lý trim + case-insensitive. Nếu trường nhập có mã phòng chuẩn, có thể đổi sang entity Room để kiểm soát danh mục và tránh hai tên khác nhau chỉ cùng một phòng.")]

story += [P("Module 12 - phân công nhóm và trạng thái", "H1VN"),
          P("Một nhóm chỉ nằm ở một hội đồng tại một thời điểm", "H2VN"),
          plain("DefenseAssignment có unique constraint trên registration_id. Service còn kiểm tra registration APPROVED, cùng department và period của council, council chưa bắt đầu, và nhóm chưa có assignment. Nhờ đó frontend không thể tự gán một nhóm đã duyệt sang khoa hoặc đợt khác bằng cách sửa request."),
          P("Kiểm tra quan hệ GVHD - phản biện", "H2VN"),
          plain("Trước khi gán, reviewer được so với danh sách TopicLecturer của đề tài. Nếu reviewer đang là bất kỳ advisor nào của đề tài đó, request bị từ chối. Advisor vẫn có thể là một thành viên hội đồng cho nhóm khác; với chính nhóm mình, Module 13 sẽ loại khỏi REVIEW/DEFENSE và cho phép phiếu ADVISOR nếu là GVHD chính."),
          P("State machine", "H2VN"),
          table([
              ["Trạng thái hiện tại", "Sự kiện", "Điều kiện / kết quả"],
              ["SCHEDULED", "Thêm nhóm", "Được trước giờ bắt đầu; đúng đợt/khoa và nhóm APPROVED."],
              ["SCHEDULED", "Nộp DEFENSE", "Chỉ sau giờ bắt đầu; nhóm phải nộp report."],
              ["SCHEDULED", "Hoàn tất", "Chỉ sau endsAt; mọi sinh viên đủ phiếu reviewer, hội đồng hợp lệ và GVHD chính."],
              ["SCHEDULED", "Hủy", "Không cho hủy khi tồn tại assessment đã SUBMITTED."],
              ["COMPLETED", "Công bố điểm", "Chỉ manager đúng phạm vi; tính đủ điểm rồi lưu snapshot."],
              ["CANCELLED", "Sửa/đánh giá", "Không nhận phiếu council; cần giải phóng assignment theo quy trình."],
          ], [34*mm, 34*mm, 102*mm]),
          P("Ai nhìn thấy gì", "H2VN"),
          plain("CouncilServiceImpl.canReadCouncil giới hạn council cho manager của khoa, thành viên hội đồng, hoặc người có quyền đọc registration được gán. toResponse lọc assignment trước khi trả về và gửi các flag canReview/canDefense/canAdvisor để UI chọn hành động. Đây là UX; backend vẫn gọi requireEvaluator ở mỗi thao tác."),
          P("Vai trò manager", "H2VN"),
          code("canManage(user, department) =\n  user has ROLE_ADMIN\n  OR (user has ROLE_PRINCIPAL AND\n      user is assigned to department OR department's faculty)"),
          plain("`@PreAuthorize` chặn role không có quyền vào route. `DefenseAccessPolicy.canManage` tiếp tục chặn Principal đúng role nhưng sai khoa. Đây là hai tầng: role-level authorization và object-level authorization.")]

# Module 13
story += [PageBreak(), P("Module 13 - Reviews &amp; Assessments", "H1VN"),
          plain("Module này tạo phiếu điểm theo từng sinh viên và evaluator. Phiếu lưu ba tiêu chí 0-10, nhận xét, câu hỏi, điểm mạnh/yếu, trạng thái và thời gian. Mỗi phiếu là một bản ghi độc lập, nên một thành viên hội đồng không thể ghi đè phiếu của người khác."),
          P("Ba loại phiếu", "H2VN"),
          table([
              ["AssessmentType", "Ai được lập", "Dùng trong điểm cuối"],
              ["ADVISOR", "Chỉ GVHD chính hiện tại của đề tài", "20%"],
              ["REVIEW", "Chỉ người được gán role REVIEWER; reviewer không được là advisor đề tài", "30%"],
              ["DEFENSE", "Tất cả thành viên council không phải advisor của nhóm", "Trung bình điểm panel, trọng số 50%"],
          ], [39*mm, 83*mm, 48*mm]),
          P("Quyền và trách nhiệm", "H2VN"),
          table([
              ["Thao tác", "Điều kiện bắt buộc"],
              ["Xem danh sách phiếu", "Manager theo khoa hoặc council member; GVHD chính xem phiếu của chính mình."],
              ["Xem bản nháp", "Chỉ evaluator sở hữu bản nháp."],
              ["Lưu nháp", "Evaluator đúng loại phiếu, sinh viên đang thuộc team được gán, điểm từ 0.00 đến 10.00."],
              ["Nộp phiếu", "Owner của draft; comment không rỗng; report đã nộp; DEFENSE không trước giờ bắt đầu."],
              ["Sửa/xóa", "Chỉ chủ sở hữu và chỉ khi còn DRAFT; submitted phiếu bị khóa."],
              ["GVHD của nhóm", "Bị 403 khi tạo REVIEW hoặc DEFENSE; thông báo rõ 'GVHD không được tham gia chấm hội đồng'."],
          ], [47*mm, 123*mm]),
          P("Hai trạng thái và tính bất biến", "H2VN"),
          code("DRAFT --evaluator submits--> SUBMITTED\n\nDRAFT: owner may update or delete\nSUBMITTED: immutable; cannot update/delete\n\nUnique key: assignment + evaluator + student + assessment_type"),
          plain("`saveDraft` là upsert theo assignment/evaluator/student/type. Khi nộp, service đổi status, ghi submittedAt và audit. Council row bị pessimistic lock khi ghi/nộp/xóa phiếu để ngăn race giữa hai request hoặc giữa nộp phiếu và đổi trạng thái hội đồng."),
          P("Điều kiện theo thời gian", "H2VN"),
          table([
              ["Mốc", "Quy tắc"],
              ["Giờ hiện tại", "Clock chung được cấu hình Asia/Ho_Chi_Minh."],
              ["Tạo council", "startsAt phải lớn hơn now; endsAt phải lớn hơn startsAt."],
              ["Gán nhóm", "Chỉ nếu startsAt còn ở tương lai."],
              ["Nộp REVIEW", "Có thể nộp trước buổi bảo vệ nếu đã có report và nhận xét."],
              ["Nộp DEFENSE", "Chỉ nộp từ startsAt trở đi; trước đó có thể lưu nháp."],
              ["Hoàn tất council", "Không trước endsAt."],
          ], [43*mm, 127*mm]),
          P("Các file cần đọc", "H2VN"),
          table([
              ["File / điểm vào", "Ý nghĩa"],
              ["be/src/main/java/com/nexus/portal/dto/request/AssessmentRequest.java:7", "Validation 3 điểm và độ dài nhận xét."],
              ["be/src/main/java/com/nexus/portal/service/impl/AssessmentServiceImpl.java:55", "Lọc phiếu theo quyền người xem."],
              ["be/src/main/java/com/nexus/portal/service/impl/AssessmentServiceImpl.java:72", "Lưu nháp; tìm đúng student membership và upsert phiếu."],
              ["be/src/main/java/com/nexus/portal/service/impl/AssessmentServiceImpl.java:98", "Submit, lock, kiểm tra report, comment, giờ bảo vệ và audit."],
              ["be/src/main/java/com/nexus/portal/service/impl/AssessmentServiceImpl.java:184", "Quyết định role nào được lập từng type."],
              ["be/src/main/java/com/nexus/portal/service/impl/DefenseAccessPolicy.java:50", "Manager theo department; advisor/team/council object permissions."],
              ["fe/src/pages/AssessmentsPage.jsx:76", "Đọc canAdvisor/canReview/canDefense và phiếu của evaluator hiện tại."],
          ], [91*mm, 79*mm])]

story += [P("Module 13 - công thức và công bố điểm", "H1VN"),
          P("Bước 1: tính điểm của một phiếu", "H2VN"),
          plain("Một phiếu có Content / Theoretical Foundation, Results / Implementation, Documentation / Presentation. Điểm phiếu = trung bình cộng ba tiêu chí. Các giá trị dùng BigDecimal để tránh sai số nhị phân của float/double."),
          code("sheetScore = (content + implementation + presentation) / 3\n\nreviewerScore = score from the assigned REVIEWER's submitted REVIEW\nadvisorScore  = score from the current PRIMARY advisor's submitted ADVISOR\ndefenseScore  = average(sheetScore from every eligible council member)"),
          P("Bước 2: tính điểm tổng kết", "H2VN"),
          code("final = advisorScore * 0.20\n      + reviewerScore * 0.30\n      + defenseScore * 0.50\n\nround final to 2 decimals using HALF_UP\nPassed when final >= 5.00"),
          P("Ví dụ có thể trình bày", "H2VN"),
          table([
              ["Nguồn", "Tiêu chí 1", "Tiêu chí 2", "Tiêu chí 3", "Điểm phần"],
              ["GVHD chính (ADVISOR)", "8", "9", "7", "8.00"],
              ["Phản biện (REVIEW)", "7", "8", "9", "8.00"],
              ["Hội đồng (DEFENSE)", "Trung bình panel", "Trung bình panel", "Trung bình panel", "7.89"],
          ], [52*mm, 28*mm, 28*mm, 28*mm, 34*mm]),
          code("8.00 * 0.20 + 8.00 * 0.30 + 7.89 * 0.50\n= 1.60 + 2.40 + 3.945\n= 7.945 -> 7.95 (HALF_UP) -> Passed"),
          P("Không tính thiếu thành phần 20%", "H2VN"),
          plain("Trước khi công bố, ScoreCalculationServiceImpl yêu cầu đúng một phiếu ADVISOR đã nộp từ GVHD chính hiện tại, đúng một phiếu REVIEW của reviewer được giao, và tập DEFENSE evaluator phải bằng chính xác tập thành viên hội đồng hợp lệ. Thiếu, thừa hoặc sai người chấm thì không có điểm dự thảo/công bố. CouncilServiceImpl cũng không cho chuyển council sang COMPLETED nếu thiếu bất kỳ phiếu cần thiết nào."),
          P("Loại GVHD khỏi điểm hội đồng", "H2VN"),
          plain("DefenseAccessPolicy.isAdvisor kiểm tra tất cả người hướng dẫn đề tài. Mọi advisor bị loại khỏi REVIEW và DEFENSE cho chính nhóm đó, bất kể role trong hội đồng; nếu là PRIMARY thì có thể lập ADVISOR. ScoreCalculationServiceImpl dùng tập evaluator hợp lệ đã lọc advisor, vì thế evaluator bị loại không làm sai trung bình và không được âm thầm tính vào 50%."),
          P("Công bố và snapshot", "H2VN"),
          plain("ResultServiceImpl khóa council, kiểm tra manager theo khoa và trạng thái COMPLETED, gọi scoreCalculation, rồi lưu Result và PublishedResultDetails trong cùng transaction. Result giữ điểm tổng hợp; PublishedResultDetails chụp các tiêu chí, tên GVHD và nhận xét tại thời điểm công bố. Sinh viên đọc getMyPublishedResults chỉ lấy result có publishedAt; sau khi công bố, dữ liệu là ảnh chụp để bảng điểm chính thức không đổi theo phiếu nguồn."),
          note("Khi sửa công thức, cập nhật constants ADVISOR_WEIGHT / REVIEW_WEIGHT / DEFENSE_WEIGHT, hàm calculateFinalScore, test ScoreCalculationServiceImplTest và nội dung giao diện/ tài liệu. Không đổi mỗi một nơi.", colors.HexColor("#FFF6E5"))]

# Frontend and role map
story += [PageBreak(), P("Role map và cách UI theo kịp backend", "H1VN"),
          table([
              ["Actor", "Reports", "Councils", "Assessments / results"],
              ["Student team leader", "Upload nếu registration đã duyệt, còn hạn, chưa khóa; xem/tải theo nhóm.", "Không tạo/sửa council.", "Không xem điểm nội bộ; xem kết quả chính thức của mình sau công bố."],
              ["Student member", "Xem/tải tài liệu nhóm.", "Không quản trị lịch.", "Không đọc phiếu chưa công bố."],
              ["Primary advisor", "Xem tài liệu đề tài.", "Có thể là thành viên panel; role của council áp dụng cho nhóm khác.", "Lập ADVISOR cho nhóm mình; không REVIEW/DEFENSE cho nhóm mình; không xem phiếu của người chấm khác cho nhóm mình."],
              ["Reviewer", "Đọc tài liệu được giao.", "Không quản lý lịch.", "Lập REVIEW và DEFENSE nếu không phải advisor của nhóm."],
              ["Council member", "Đọc file các nhóm được giao.", "Xem council mình tham gia.", "Lập DEFENSE; nếu role REVIEWER thì thêm REVIEW."],
              ["Admin", "Đọc tài liệu theo quyền quản lý.", "Tạo/sửa/gán/hủy/hoàn tất mọi khoa.", "Tính/công bố điểm; xem dữ liệu theo quyền manager."],
              ["Principal", "Đọc dữ liệu trong khoa/faculty phụ trách.", "Quản trị trong phạm vi khoa/faculty.", "Tính/công bố điểm trong phạm vi được giao."],
          ], [32*mm, 48*mm, 42*mm, 48*mm]),
          P("Frontend không quyết định sự thật nghiệp vụ", "H2VN"),
          plain("AssessmentsPage.jsx dùng các cờ từ CouncilResponse.Assignment để bật lựa chọn ADVISOR/REVIEW/DEFENSE; xác định phiếu của evaluator hiện tại bằng evaluatorId; và ẩn form khi phiếu của người đó đã SUBMITTED. Backend cũng giới hạn dữ liệu xem: GVHD đang có xung đột với chính nhóm đó chỉ thấy phiếu của mình, trừ trường hợp họ đồng thời là manager đúng khoa. `canEdit` từ response giúp disable control khi draft không còn hợp lệ. Nếu state cache cũ, API vẫn có thể trả 403/400 và errorHandler.js chuyển thông báo thành câu dễ hiểu."),
          P("Luồng mỗi click", "H2VN"),
          *bullets([
              "UI gọi API service; không gửi role do client tự quyết định.",
              "JWT xác định account; controller lấy Authentication.getName().",
              "Service tự nạp User, Council, Assignment, Registration và student membership từ database.",
              "Service chạy authorization + workflow checks rồi mới ghi thay đổi.",
              "Response DTO trả status/flags; UI render lại form, trạng thái hoặc lỗi thân thiện."
          ])]

# Tests
story += [PageBreak(), P("Kiểm thử đã chạy và bằng chứng", "H1VN"),
          plain("Sau khi fast-forward nhánh main lên hai commit mới từ origin/main và áp dụng thay đổi chấm điểm đang làm, bộ backend đã chạy đầy đủ; frontend build production cũng thành công."),
          table([
              ["Kiểm tra", "Kết quả", "Phạm vi"],
              ["Backend Maven test", "94 tests; 0 failures; 0 errors; 0 skipped.", "18 test suites; gồm integration test module 11-13 và unit test công thức."],
              ["DefenseWorkflowIntegrationTest", "27 tests; 0 failures.", "JWT/role, scope khoa, upload/download, deadline, room/member overlap, advisor conflict, draft/submit, complete."],
              ["ScoreCalculationServiceImplTest", "Tất cả pass trong suite.", "Đủ ADVISOR + reviewer + defense; advisor cũ không thay điểm GVHD chính; không tính trước COMPLETED."],
              ["Frontend production build", "Vite build thành công.", "1680 modules transformed; có cảnh báo bundle JS > 500 kB, không làm build thất bại."],
              ["Git diff --check", "Không còn whitespace error sau rà soát cuối.", "Kiểm tra định dạng diff trước khi kết thúc."],
          ], [44*mm, 55*mm, 71*mm]),
          P("Các test có ý nghĩa nghiệp vụ", "H2VN"),
          *bullets([
              "overlappingMemberSchedulesAreRejectedEvenInDifferentRooms: cấm một giảng viên bị xếp hai council cùng giờ.",
              "overlappingRoomsAreRejectedEvenWithDifferentMembers: cấm trùng phòng, so tên không phân biệt hoa thường.",
              "adjacentSchedulesAreAllowed: chứng minh lịch nối tiếp đúng biên giờ vẫn hợp lệ.",
              "advisorCannotBeReviewerForTheirTopic và primaryAdvisorCanScoreAdvisorComponentButCannotScoreTheirTeamAsCouncilMember: tách xung đột lợi ích, chặn REVIEW/DEFENSE và ngăn GVHD xem phiếu council khác của chính nhóm đó.",
              "defenseCannotBeSubmittedBeforeScheduledStart: lưu nháp trước được, submit trước giờ thì bị từ chối.",
              "completingCouncilRequiresEveryStudentAndEvaluatorToSubmitAllRequiredSheets: khóa hoàn tất khi thiếu council/advisor sheet.",
              "concurrentUploadsAllocateDifferentVersionsAndSubmittedReviewCannotBeOverwritten: kiểm thử race upload và tính bất biến phiếu đã nộp."
          ]),
          note("Đây là test tự động trên test profile, không sửa dữ liệu hosting thật. Warning bundle size là tối ưu hiệu năng frontend riêng, không phải lỗi build.")]

# Change guide
story += [P("Bản đồ sửa code theo yêu cầu", "H1VN"),
          table([
              ["Muốn thay đổi", "Bắt đầu ở", "Đừng quên"],
              ["Giới hạn loại/size file", "ReportServiceImpl.validateContent và cấu hình app.reports.max-file-bytes.", "Test PDF/ZIP/TXT giả, file rỗng, quá cỡ; cập nhật UI accept nếu cần."],
              ["Người được upload", "DefenseAccessPolicy.canSubmit + ReportServiceImpl.uploadDocument.", "Test leader/member/outsider, deadline đúng biên, assessment đã submit."],
              ["Số thành viên/role council", "CouncilRequest và CouncilServiceImpl.validateRequest.", "Test thiếu role, trùng lecturer, inactive lecturer, khác khoa."],
              ["Cách kiểm tra trùng phòng", "CouncilServiceImpl.validateRequest + repository lockScheduleDepartments.", "Giữ kiểm tra transaction/concurrency và test interval giao nhau/tiếp giáp."],
              ["Định nghĩa GVHD", "DefenseAccessPolicy.isAdvisor/isPrimaryAdvisor; TopicLecturer advisorRole.", "Thử PRIMARY, CO_ADVISOR và đổi GVHD hiện tại."],
              ["Trọng số hoặc ngưỡng đạt", "ScoreCalculationServiceImpl constants, calculateFinalScore, isPassingScore.", "Sửa unit test, màn hình kết quả, xuất Excel/API snapshot và tài liệu."],
              ["Thêm tiêu chí điểm", "AssessmentRequest, Assessment entity, AssessmentForm, FE page, calculation + PublishedResultDetails.", "Migration/schema, validation, response, test rounding và bảng kết quả."],
              ["Thông báo/lỗi hiển thị", "GlobalExceptionHandler và fe/src/utils/errorHandler.js.", "Không đưa SQL/raw stack trace ra người dùng; thêm test HTTP status/message."],
          ], [43*mm, 76*mm, 51*mm]),
          P("Quy trình an toàn khi sửa", "H2VN"),
          *bullets([
              "Đọc test đang bảo vệ quy tắc trước khi chỉnh service.",
              "Sửa backend trước để invariant được bảo vệ cho mọi client.",
              "Cập nhật response DTO/UI để người dùng thấy cùng quy tắc.",
              "Thêm hoặc sửa test theo ranh giới: quyền, trạng thái, thời gian, dữ liệu nhóm.",
              "Chạy `mvn -DforkCount=0 test`, `npm run build`, rồi kiểm tra `git diff --check`."
          ])]

# Presentation outline
story += [PageBreak(), P("Dàn ý thuyết trình 6-8 phút", "H1VN"),
          table([
              ["Thời gian", "Ý cần nói", "Câu giải thích gợi ý"],
              ["0:00-0:45", "Bức tranh kiến trúc", "Ba module đi theo React -> REST Controller -> Service -> Repository/Entity."],
              ["0:45-2:00", "Module 11", "Chỉ leader nhóm đã duyệt được upload; service xác minh quyền, hạn, loại file và version trước khi lưu."],
              ["2:00-3:15", "Module 12", "Council có khoa, đợt, phòng, giờ, role. Backend chặn lịch chồng và dùng pessimistic lock chống hai request tạo lịch cùng lúc."],
              ["3:15-5:15", "Module 13", "Phiếu tách ADVISOR/REVIEW/DEFENSE, draft sửa được, submitted bất biến. GVHD không chấm hội đồng cho nhóm mình."],
              ["5:15-6:30", "Công thức", "Tính trung bình tiêu chí, áp 20/30/50, làm tròn HALF_UP, chỉ công bố khi đủ phiếu hợp lệ."],
              ["6:30-7:30", "Kiểm thử", "Nêu test phòng/giờ, sai khoa, advisor conflict, thiếu phiếu, upload đồng thời và 94 test xanh."],
          ], [24*mm, 40*mm, 106*mm]),
          P("Câu hỏi người nghe có thể hỏi", "H2VN"),
          table([
              ["Câu hỏi", "Trả lời ngắn"],
              ["Tại sao UI ẩn nút vẫn cần kiểm tra backend?", "Client có thể bị sửa hoặc gọi API trực tiếp; service là nguồn quyết định quyền cuối cùng."],
              ["Vì sao không dùng float cho điểm?", "BigDecimal kiểm soát chính xác phép tính thập phân và quy tắc làm tròn."],
              ["GVHD vừa là chair thì sao?", "GVHD được ADVISOR cho nhóm mình, nhưng bị loại khỏi REVIEW/DEFENSE; với nhóm khác, quyền council vẫn áp dụng."],
              ["Sao phải lưu PublishedResultDetails?", "Để lưu snapshot nhận xét/tiêu chí/tên GVHD tại lúc công bố, không phụ thuộc phiếu nguồn sau này."],
              ["Vì sao vừa khóa DB vừa kiểm tra trong service?", "Service đưa ra thông báo đúng nghiệp vụ; unique constraint/lock bảo vệ khi nhiều request chạy cùng lúc."],
          ], [70*mm, 100*mm]),
          P("Một câu kết", "H2VN"),
          note("Thiết kế trọng tâm là giữ cùng một chuỗi dữ liệu có thể kiểm chứng: nhóm nộp đúng báo cáo; hội đồng được phân công hợp lệ; đúng evaluator lập phiếu; backend khóa đúng thời điểm; điểm được tính đủ ba thành phần rồi chụp thành kết quả chính thức."),
          Spacer(1, 12), P("Tài liệu kết thúc", "SmallCenterVN")]

doc.build(story)
print(OUTPUT)
