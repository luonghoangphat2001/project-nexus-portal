# Modules 14–16 Test Cases

This document lists the automated tests for Modules 14–16 (JUnit, `be/src/test`).

## Execution Summary

- `mvn -B -f be/pom.xml test`: 66 tests passed.
- `npm run build --prefix fe`: passed.
- Not run against a localhost/MySQL environment.

## Score Calculation (Module 14): `ScoreCalculatorTest`, `ScoreCalculationServiceImplTest`

| ID | Scenario | Expected |
| --- | --- | --- |
| G-01 | Assessment score averages three criteria; defense score averages all DEFENSE assessments | Correct values |
| G-02 | Final score is 30% reviewer + 70% defense, half-up rounded to two decimals | Correct rounding |
| G-03 | Passing threshold is 5.00 | `5.00` passes |
| G-04 | Preview scores for a completed assignment | Returns score rows |
| G-05 | Scores are already published | Returns saved snapshot without recalculation |
| G-06 | REVIEW/DEFENSE assessment is missing | Rejects without returning partial scores |
| G-07 | Council is not completed | Rejects |
| G-08 | Manager is outside the assigned department | Denies access |

## Result Publication (Module 15): `ResultPublicationServiceImplTest`

| ID | Scenario | Expected |
| --- | --- | --- |
| P-01 | Publish after the council is completed | Saves weighted score snapshots and writes an audit record |
| P-02 | Assessment set is incomplete | Rejects without saving partial scores |
| P-03 | Council is not completed | Rejects |
| P-04 | Manager is outside the assigned department | Denies access |
| P-05 | Publish the same assignment a second time | Rejects |
| P-06 | Student views `/results/me` | Sees only their published scores; no comments are returned |

## Reporting and Statistics (Module 16): `ScoreRangeClassifierTest`, `ResultStatisticsServiceImplTest`

| ID | Scenario | Expected |
| --- | --- | --- |
| R-01 | Classify scores at band boundaries | Correct band |
| R-02 | Request statistics with allowed filters | Includes published scores only |
| R-03 | Request a department outside the manager's scope | Denies access before querying results |
| R-04 | Export CSV | UTF-8, escaped quotes, and neutralized formula prefixes |
