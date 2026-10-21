# Modules 14–16 Test Cases

This document lists the automated JUnit tests for Modules 14–16 under `be/src/test`.

## Execution Summary

- Backend: `mvn test` from `be` (all tests passed).
- Frontend: `npm run build` from `fe` (passed).
- Localhost/MySQL integration scenarios are not covered by these unit tests.

## Score Calculation (Module 14): `ScoreCalculationFormulaTest`, `ScoreCalculationServiceImplTest`

| ID | Scenario | Expected result |
| --- | --- | --- |
| G-01 | Assessment score averages three criteria; defense score averages `DEFENSE` assessments from council members who do not supervise the team | Correct values |
| G-02 | Final score uses 20% advisor, 30% reviewer, 50% council weights (8.00/8.50/9.00 gives 8.65) | Correct rounding |
| G-03 | Passing threshold is 5.00 | `5.00` passes |
| G-04 | Preview scores for a completed assignment | Returns the score list |
| G-05 | Scores have already been published | Returns stored snapshots without recalculation |
| G-06 | An `ADVISOR`, `REVIEW` or `DEFENSE` assessment is missing | Rejects the request without partial results |
| G-07 | Council is not completed | Rejects the request |
| G-08 | Manager is outside the assigned department | Denies access |
| G-09 | The primary GVHD submits `ADVISOR` after council completion but before publication | Accepts the assessment |
| G-10 | A co-advisor submits `ADVISOR`, or a thesis supervisor submits `REVIEW`/`DEFENSE` for their team | Denies the assessment |
| G-11 | No council member is eligible to submit `DEFENSE` for the team | Rejects score calculation |

## Result Publication (Module 15): `ResultPublicationServiceImplTest`

| ID | Scenario | Expected result |
| --- | --- | --- |
| P-01 | Publish after council completion | Stores weighted score snapshots and writes an audit record |
| P-02 | Assessment set is incomplete | Rejects publication without partial snapshots |
| P-03 | Council is not completed | Rejects publication |
| P-04 | Manager is outside the assigned department | Denies access |
| P-05 | Publish the same assignment again | Rejects the duplicate publication |
| P-06 | Publish a whole period | Publishes every completed unpublished assignment; rejects when nothing is pending |
| P-07 | Student requests `/results/me` | Returns only that student's published scores with component scores and comments |

## Reports and Statistics (Module 16): `ScoreRangeClassifierTest`, `ResultStatisticsServiceImplTest`, `ResultControllerExcelTest`

| ID | Scenario | Expected result |
| --- | --- | --- |
| R-01 | Classify scores at band boundaries | Assigns the correct band |
| R-02 | Request statistics with allowed filters | Includes published scores only |
| R-03 | Request a department outside the manager's scope | Denies access before querying reports |
| R-04 | Download Excel report in Vietnamese (default) | Workbook with student, advisor, component scores, final score, pass/fail and comments |
| R-05 | Download Excel report with English selected | English column headers, `Passed`/`Failed`, file `thesis-results-report.xlsx` |
