# Capstone management modules

These modules use the existing Java 17 / Spring Boot backend and React frontend. All added source code, validation messages and UI labels are in English. Academic years, semesters, faculties and cohorts follow the project's existing capstone data model. Demo data is for coursework and does not represent official university rules.

## Pages

| Module | Page | Features |
| --- | --- | --- |
| 2 | `/periods` | Create, edit, filter and delete registration periods; select faculties and cohorts; set registration dates and submission deadline |
| 3 | `/academic` | Search and manage faculties, departments, majors and cohorts |
| 9 | `/notifications` | Publish university or faculty announcements; filter unread announcements; persist read status per user |
| 10 | `/progress` | Assign tasks to team members; track TODO, IN_PROGRESS and DONE; show completion percentage and overdue tasks; save advisor feedback |

## Permissions

- All signed-in users can browse academic records and registration periods.
- Admins and principals can create or edit academic records and periods. Only admins can delete them.
- Admins and principals can publish or delete notifications. Faculty announcements are visible to affiliated users and administrators; university announcements are visible to all signed-in users.
- Team members can see their own team's progress. An assignee can update the status of their own task.
- Team leaders, approved-topic advisors, admins and principals can manage tasks. Advisors, admins and principals can add feedback.
- Teacher access is based on the advisor assigned to an approved topic registration, rather than teacher role alone.

## Validation

- Registration start must precede registration end. Submission deadline must be on or after registration end.
- Academic years must be consecutive, for example `2026-2027`; semester must be 1, 2 or 3.
- At least one existing faculty and cohort must be selected. Existing teams must remain within a period's selected scope.
- Periods with teams or topics cannot be deleted.
- Academic codes must be unique. Graduation year must be on or after admission year.
- Task assignees must belong to the selected team. Task due dates cannot exceed the period's submission deadline.
- Local date/time inputs represent Vietnam local time. Overdue checks use `Asia/Ho_Chi_Minh`.

## API routes

All routes below are relative to the existing API base URL and use its JWT authentication and `ApiResponse` envelope.

| Method | Route | Purpose |
| --- | --- | --- |
| GET, POST | `/periods` | List or create periods |
| PUT, DELETE | `/periods/{id}` | Update or delete a period |
| GET, POST | `/notifications` | List visible announcements or publish one |
| PUT | `/notifications/{id}/read` | Mark an announcement as read |
| DELETE | `/notifications/{id}` | Delete an announcement and its read receipts |
| GET | `/progress/teams` | List accessible teams and their members |
| GET, POST | `/progress/teams/{teamId}/tasks` | List or create tasks |
| PUT | `/progress/teams/{teamId}/tasks/{id}` | Edit task details |
| PUT | `/progress/tasks/{id}/status` | Update task status |
| PUT | `/progress/tasks/{id}/feedback` | Save advisor feedback |
| DELETE | `/progress/tasks/{id}` | Delete a task |

Module 3 reuses the existing `/academic` endpoints.

## Run and verify

Start backend and frontend using the existing README instructions. With `HIBERNATE_DDL_AUTO=update`, restarting the backend creates `notifications`, `notification_reads` and `progress_tasks`. The new tables are also included in `schema.sql` for manual database setup.

```sh
cd be
mvn test
```

```sh
cd fe
npm install
npm run build
```

Use a student account with an existing team to try the progress board. Use an admin account to configure periods, manage academic records and publish notifications. Create tasks before the period's submission deadline, then sign in as the assignee to update their status.

The notification module provides in-app announcements; it does not send email or push notifications. Progress is measured by completed task count, with equal weight per task.
