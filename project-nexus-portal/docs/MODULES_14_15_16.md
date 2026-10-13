# Modules 14–16: Score Calculation, Publication, Reports, and Statistics

These modules consume submitted assessments from Module 13 and process only assignments belonging to completed councils. Integration, authorization, and layer responsibilities follow `ARCHITECTURE.md`; this document describes the module-specific business rules and API.

## Business Rules

- Each assessment score is the average of its three existing criteria: content, implementation, and presentation/documentation, on a 0–10 scale.
- The reviewer score comes from the submitted `REVIEW` assessment by the assigned reviewer. The defense score is the average of all submitted `DEFENSE` assessments from council members.
- Final score = `30% × reviewer score + 70% × defense score`, rounded to two decimal places using half-up rounding. A student passes with a score of `5.00` or higher.
- Scores can only be calculated and published after the council is completed, the team has members, and each student has exactly one `REVIEW` assessment and one `DEFENSE` assessment from every council member.
- Published scores are stored as immutable snapshots, unique by assignment/student; republishing is rejected. The publication transaction locks the council to prevent concurrent publication and writes an audit log on success.
- Administrators can view all departments; department heads can only view departments they manage. Students can only view their own published results. Assessment comments are never returned to students.
- Statistics include published scores only and are grouped by registration period, department, and topic. Reports include student count, average score, pass/fail counts, and these score bands: below `5.00`, `5.00–5.99`, `6.00–6.99`, `7.00–7.99`, `8.00–8.99`, and `9.00–10.00`.
- Academic results are separate from the document reports in Module 11 and system metrics on the Dashboard. CSV uses UTF-8, escapes double quotes, and neutralizes spreadsheet formula prefixes in text fields.

## API

The following endpoints require JWT authentication and use the configured API prefix (default: `/api`).

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/results/assignments/{assignmentId}` | Administrator/department head, scoped to managed departments | View calculated or published scores |
| POST | `/results/assignments/{assignmentId}/publish` | Administrator/department head, scoped to managed departments | Publish scores for a completed assignment |
| GET | `/results/me` | Student | View the current student's published results |
| GET | `/results/reports/options` | Administrator/department head, scoped to managed departments | Get registration periods, departments, and topics for filters |
| GET | `/results/reports` | Administrator/department head, scoped to managed departments | View statistics; supports `periodId`, `departmentId`, and `topicId` |
| GET | `/results/reports.csv` | Administrator/department head, scoped to managed departments | Download the report as CSV using the same filters |

## Persistence

The `published_results` table stores published score snapshots and enforces uniqueness for each assignment/student pair. It is declared in `be/src/main/resources/schema.sql` and mapped by the `PublishedResult` entity.
