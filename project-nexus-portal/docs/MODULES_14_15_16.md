# Modules 14–16 — Grade Calculation, Result Publication, and Academic Statistics

These modules use submitted assessments from Module 13 and process only assignments belonging to completed councils. Integration conventions, access control, and layer responsibilities are documented in [ARCHITECTURE.md](../ARCHITECTURE.md); this document covers only the business rules and APIs specific to these modules.

## Business Rules

- Each assessment score is the average of its three existing criteria (content, implementation, and presentation/documentation), on a 0–10 scale.
- The review score is calculated from the `REVIEW` assessment submitted by the assigned reviewer. The defense score is the average of all submitted `DEFENSE` assessments from council members.
- Final score = `30% × review score + 70% × defense score`, rounded to two decimal places using half-up rounding. A score of `5.00` or higher is passing.
- Grades can be calculated and published only after the council is completed, the team has members, and each student has exactly one `REVIEW` assessment from the assigned reviewer and one `DEFENSE` assessment from every council member.
- Published grades are stored as immutable snapshots by assignment/student; republishing is not allowed. The transaction locks the council to prevent concurrent publication requests and writes an audit log on success.
- Administrators can view all departments; department heads can view only data for departments they are assigned to manage. Students can view only their own published results. Assessment comments are never returned to students.
- Statistics include published results only, grouped by registration period, department, and topic. Reports include student count, average score, pass/fail counts, and score bands: below `5.00`, `5.00–5.99`, `6.00–6.99`, `7.00–7.99`, `8.00–8.99`, and `9.00–10.00`.
- Academic result reports are separate from Module 11 document reports and account/system metrics on the Dashboard. CSV exports use UTF-8, escape quotation marks, and neutralize spreadsheet formula prefixes in text fields.

## API

The following endpoints require a JWT and use the configured API prefix (default: `/api`).

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/results/assignments/{assignmentId}` | Administrators/department heads, scoped to assigned departments | View calculated or published grades |
| POST | `/results/assignments/{assignmentId}/publish` | Administrators/department heads, scoped to assigned departments | Publish results for a completed assignment |
| GET | `/results/me` | Students | View the current student's published results |
| GET | `/results/reports/options` | Administrators/department heads, scoped to assigned departments | Load registration period, department, and topic filter options |
| GET | `/results/reports` | Administrators/department heads, scoped to assigned departments | View statistics; supports `periodId`, `departmentId`, and `topicId` |
| GET | `/results/reports.csv` | Administrators/department heads, scoped to assigned departments | Download a CSV report with the same filters |

## Storage

The `final_results` table stores published grade snapshots and enforces uniqueness on the assignment/student pair. It is mapped by the `FinalResult` entity and created or updated by Hibernate according to `HIBERNATE_DDL_AUTO`; the test environment also uses Hibernate schema generation.
