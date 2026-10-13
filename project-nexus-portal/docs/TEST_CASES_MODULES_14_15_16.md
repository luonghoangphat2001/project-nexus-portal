# Modules 14–16 Test Cases

This document lists the automated JUnit tests for Modules 14–16 under `be/src/test`.

## Execution Summary

- Backend: `mvn test` from `be` (66 tests passed).
- Frontend: `npm run build` from `fe` (passed).
- Localhost/MySQL integration scenarios are not covered by these unit tests.

## Score Calculation (Module 14): `ScoreCalculatorTest`, `ScoreCalculationServiceImplTest`

| ID | Scenario | Expected result |
| --- | --- | --- |
| G-01 | Assessment score averages three criteria; defense score averages every `DEFENSE` assessment | Correct values |
| G-02 | Final score uses 30% reviewer and 70% defense weights with half-up rounding to two decimals | Correct rounding |
| G-03 | Passing threshold is 5.00 | `5.00` passes |
| G-04 | Preview scores for a completed assignment | Returns the score list |
| G-05 | Scores have already been published | Returns stored snapshots without recalculation |
| G-06 | A `REVIEW` or `DEFENSE` assessment is missing | Rejects the request without partial results |
| G-07 | Council is not completed | Rejects the request |
| G-08 | Manager is outside the assigned department | Denies access |

## Result Publication (Module 15): `ResultPublicationServiceImplTest`

| ID | Scenario | Expected result |
| --- | --- | --- |
| P-01 | Publish after council completion | Stores weighted score snapshots and writes an audit record |
| P-02 | Assessment set is incomplete | Rejects publication without partial snapshots |
| P-03 | Council is not completed | Rejects publication |
| P-04 | Manager is outside the assigned department | Denies access |
| P-05 | Publish the same assignment again | Rejects the duplicate publication |
| P-06 | Student requests `/results/me` | Returns only that student's published scores, without comments |

## Reports and Statistics (Module 16): `ScoreRangeClassifierTest`, `ResultStatisticsServiceImplTest`

| ID | Scenario | Expected result |
| --- | --- | --- |
| R-01 | Classify scores at band boundaries | Assigns the correct band |
| R-02 | Request statistics with allowed filters | Includes published scores only |
| R-03 | Request a department outside the manager's scope | Denies access before querying reports |
| R-04 | Download CSV | UTF-8, escaped double quotes, and neutralized formula prefixes |
