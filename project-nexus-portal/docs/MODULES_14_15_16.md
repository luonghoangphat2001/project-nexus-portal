# Modules 14–16: Score Calculation, Publication, Reports, and Statistics

These modules consume submitted assessments from Module 13 and process only assignments belonging to completed councils. Integration, authorization, and layer responsibilities follow `ARCHITECTURE.md`; this document describes the module-specific business rules and API.

## Business Rules

- Each assessment score is the average of its three existing criteria: content, implementation, and presentation/documentation, on a 0–10 scale.
- The advisor score comes from exactly one submitted `ADVISOR` assessment per student, entered by the primary thesis advisor (GVHD). The reviewer score comes from the submitted `REVIEW` assessment by the assigned reviewer. The defense score is the average of submitted `DEFENSE` assessments from council members who are not advisors of that team.
- Final score = `20% × advisor score + 30% × reviewer score + 50% × defense score`, rounded to two decimal places using half-up rounding. A student passes with a score of `5.00` or higher.
- Scores can only be calculated and published after the council is completed, the team has members, and each student has exactly one `ADVISOR`, one `REVIEW` assessment and one `DEFENSE` assessment from every eligible council member. Missing `ADVISOR` assessments do not block council completion, but do block score calculation and publication.
- Results can be published per assignment or for a whole registration period (every completed, not yet published council of the period within the manager scope). Published scores are stored as immutable snapshots, unique by assignment/student, together with the component scores and comments of the advisor, reviewer and council; republishing is rejected. The publication transaction locks the council to prevent concurrent publication and writes an audit log on success.
- Administrators can view all departments; department heads can only view departments they manage. Students can only view their own published results, which include component scores, final score, comments and pass/fail. A thesis advisor cannot grade the same project as a council member.
- Statistics include published scores only and are grouped by registration period, department, and topic. Reports include student count, average score, pass/fail counts, and these score bands: below `5.00`, `5.00–5.99`, `6.00–6.99`, `7.00–7.99`, `8.00–8.99`, and `9.00–10.00`.
- Academic results are separate from the document reports in Module 11 and system metrics on the Dashboard. The detailed report is exported as an Excel (`.xlsx`) workbook, in Vietnamese or English according to the `Accept-Language` header sent by the web UI, with one row per student: topic, advisor, component scores, final score, pass/fail and comments.

## API

The following endpoints require JWT authentication and use the configured API prefix (default: `/api`).

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/results/assignments/{assignmentId}` | Administrator/department head, scoped to managed departments | View calculated or published scores |
| POST | `/results/assignments/{assignmentId}/publish` | Administrator/department head, scoped to managed departments | Publish scores for a completed assignment |
| POST | `/results/periods/{periodId}/publish` | Administrator/department head, scoped to managed departments | Publish scores for every completed, unpublished council of the period |
| GET | `/results/me` | Student | View the current student's published results |
| GET | `/results/reports/options` | Administrator/department head, scoped to managed departments | Get registration periods, departments, and topics for filters |
| GET | `/results/reports` | Administrator/department head, scoped to managed departments | View statistics; supports `periodId`, `departmentId`, and `topicId` |
| GET | `/results/reports.xlsx` | Administrator/department head, scoped to managed departments | Download the detailed student report as Excel using the same filters |

## Persistence

The `published_results` table stores published score snapshots and enforces uniqueness for each assignment/student pair; `published_result_details` stores the component scores and comments of the same snapshot. Both are declared in `be/src/main/resources/schema.sql` and mapped by the `Result` and `PublishedResultDetails` entities.

## Phân biệt vai trò: GVHD và giảng viên hội đồng

- **GVHD (giảng viên hướng dẫn)**: quan hệ theo đề tài (TopicLecturer: PRIMARY hoặc CO_ADVISOR). Chỉ GVHD chính nhập phiếu `ADVISOR` (20%).
- **Giảng viên hội đồng**: vai trò theo hội đồng (CHAIR/SECRETARY/REVIEWER), nhập phiếu `DEFENSE` (50%) và `REVIEW` (30%, chỉ REVIEWER).
- Một giảng viên có thể giữ cả hai vai trò, nhưng được xét theo từng nhóm: GVHD của nhóm nào thì **không** chấm REVIEW/DEFENSE cho nhóm đó.
- Phiếu `ADVISOR` không chặn việc kết thúc hội đồng; GVHD chính vẫn nộp được sau khi hội đồng hoàn tất, cho tới khi điểm được công bố hoặc hội đồng bị huỷ. Bắt buộc có đúng một phiếu `ADVISOR` mỗi sinh viên khi tính và công bố điểm (Module 14).
- Phiếu `DEFENSE` chỉ yêu cầu từ các thành viên hội đồng không phải GVHD của nhóm; điểm bảo vệ là trung bình các phiếu hợp lệ đó.
