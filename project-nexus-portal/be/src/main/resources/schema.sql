-- ==========================================================
-- Spring Boot Native Schema Definition (schema.sql)
-- Auto-executed by Spring Boot SQL Init (DDL)
-- ==========================================================

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(60) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Academic Faculties Table
CREATE TABLE IF NOT EXISTS faculties (
  id BIGINT NOT NULL AUTO_INCREMENT,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(150) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_faculties_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Academic Departments Table (belongs to Faculty)
CREATE TABLE IF NOT EXISTS departments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  faculty_id BIGINT NOT NULL,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(150) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_departments_code (code),
  KEY fk_departments_faculty_id (faculty_id),
  CONSTRAINT fk_departments_faculty_id FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Academic Majors Table (belongs to Department)
CREATE TABLE IF NOT EXISTS majors (
  id BIGINT NOT NULL AUTO_INCREMENT,
  department_id BIGINT NOT NULL,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(150) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_majors_code (code),
  KEY fk_majors_department_id (department_id),
  CONSTRAINT fk_majors_department_id FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Student Cohorts Table
CREATE TABLE IF NOT EXISTS cohorts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(100) NOT NULL,
  admission_year INT NOT NULL,
  graduation_year INT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_cohorts_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Users Table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(60) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  student_code VARCHAR(30) DEFAULT NULL,
  cohort_id BIGINT DEFAULT NULL,
  major_id BIGINT DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  avatar_url VARCHAR(255) DEFAULT NULL,
  is_active BIT(1) NOT NULL DEFAULT b'1',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_email (email),
  KEY fk_users_cohort_id (cohort_id),
  KEY fk_users_major_id (major_id),
  CONSTRAINT fk_users_cohort_id FOREIGN KEY (cohort_id) REFERENCES cohorts (id) ON DELETE SET NULL,
  CONSTRAINT fk_users_major_id FOREIGN KEY (major_id) REFERENCES majors (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. User Roles Pivot Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  KEY fk_user_roles_role_id (role_id),
  CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. User Faculties Pivot Table (Multi-faculty affiliations for Lecturers/Students)
CREATE TABLE IF NOT EXISTS user_faculties (
  user_id BIGINT NOT NULL,
  faculty_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, faculty_id),
  KEY fk_user_faculties_faculty_id (faculty_id),
  CONSTRAINT fk_user_faculties_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_faculties_faculty_id FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. User Departments Pivot Table (Multi-department affiliations for Lecturers/Students)
CREATE TABLE IF NOT EXISTS user_departments (
  user_id BIGINT NOT NULL,
  department_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, department_id),
  KEY fk_user_departments_department_id (department_id),
  CONSTRAINT fk_user_departments_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_departments_department_id FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. User Majors Pivot Table (Advisory majors for Lecturers)
CREATE TABLE IF NOT EXISTS user_majors (
  user_id BIGINT NOT NULL,
  major_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, major_id),
  KEY fk_user_majors_major_id (major_id),
  CONSTRAINT fk_user_majors_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_majors_major_id FOREIGN KEY (major_id) REFERENCES majors (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. User Cohorts Pivot Table (Advisory cohorts for Lecturers)
CREATE TABLE IF NOT EXISTS user_cohorts (
  user_id BIGINT NOT NULL,
  cohort_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, cohort_id),
  KEY fk_user_cohorts_cohort_id (cohort_id),
  CONSTRAINT fk_user_cohorts_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_cohorts_cohort_id FOREIGN KEY (cohort_id) REFERENCES cohorts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Registration Periods Table
CREATE TABLE IF NOT EXISTS registration_periods (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  semester INT NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  submission_deadline DATETIME NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Registration Period Targeted Faculties (Multi-Faculty)
CREATE TABLE IF NOT EXISTS registration_period_faculties (
  period_id BIGINT NOT NULL,
  faculty_id BIGINT NOT NULL,
  PRIMARY KEY (period_id, faculty_id),
  KEY fk_period_faculties_faculty_id (faculty_id),
  CONSTRAINT fk_period_faculties_period_id FOREIGN KEY (period_id) REFERENCES registration_periods (id) ON DELETE CASCADE,
  CONSTRAINT fk_period_faculties_faculty_id FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Registration Period Targeted Cohorts (Multi-Cohort)
CREATE TABLE IF NOT EXISTS registration_period_cohorts (
  period_id BIGINT NOT NULL,
  cohort_id BIGINT NOT NULL,
  PRIMARY KEY (period_id, cohort_id),
  KEY fk_period_cohorts_cohort_id (cohort_id),
  CONSTRAINT fk_period_cohorts_period_id FOREIGN KEY (period_id) REFERENCES registration_periods (id) ON DELETE CASCADE,
  CONSTRAINT fk_period_cohorts_cohort_id FOREIGN KEY (cohort_id) REFERENCES cohorts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Topics Table (Graduation / Thesis Topics)
CREATE TABLE IF NOT EXISTS topics (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  objectives TEXT DEFAULT NULL,
  requirements TEXT DEFAULT NULL,
  department_id BIGINT NOT NULL,
  period_id BIGINT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'CAPSTONE_PROJECT',
  max_students INT NOT NULL DEFAULT 3,
  duration VARCHAR(50) DEFAULT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  is_registration_open BIT(1) NOT NULL DEFAULT b'1',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY fk_topics_department_id (department_id),
  KEY fk_topics_period_id (period_id),
  CONSTRAINT fk_topics_department_id FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE RESTRICT,
  CONSTRAINT fk_topics_period_id FOREIGN KEY (period_id) REFERENCES registration_periods (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Topic Lecturers Pivot Table (1-2 Advisors per Topic, Advisor can advise multiple topics)
CREATE TABLE IF NOT EXISTS topic_lecturers (
  topic_id BIGINT NOT NULL,
  lecturer_id BIGINT NOT NULL,
  advisor_role VARCHAR(20) NOT NULL DEFAULT 'PRIMARY',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (topic_id, lecturer_id),
  KEY fk_topic_lecturers_lecturer_id (lecturer_id),
  CONSTRAINT fk_topic_lecturers_topic_id FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE,
  CONSTRAINT fk_topic_lecturers_lecturer_id FOREIGN KEY (lecturer_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Topic Majors Pivot Table (Topics open to multiple majors)
CREATE TABLE IF NOT EXISTS topic_majors (
  topic_id BIGINT NOT NULL,
  major_id BIGINT NOT NULL,
  PRIMARY KEY (topic_id, major_id),
  KEY fk_topic_majors_major_id (major_id),
  CONSTRAINT fk_topic_majors_topic_id FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE,
  CONSTRAINT fk_topic_majors_major_id FOREIGN KEY (major_id) REFERENCES majors (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Teams Table (Student Project Teams)
CREATE TABLE IF NOT EXISTS teams (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  leader_id BIGINT NOT NULL,
  period_id BIGINT NOT NULL,
  faculty_id BIGINT NOT NULL,
  cohort_id BIGINT NOT NULL,
  major_id BIGINT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'FORMING',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY fk_teams_leader_id (leader_id),
  KEY fk_teams_period_id (period_id),
  KEY fk_teams_faculty_id (faculty_id),
  KEY fk_teams_cohort_id (cohort_id),
  KEY fk_teams_major_id (major_id),
  CONSTRAINT fk_teams_leader_id FOREIGN KEY (leader_id) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_teams_period_id FOREIGN KEY (period_id) REFERENCES registration_periods (id) ON DELETE RESTRICT,
  CONSTRAINT fk_teams_faculty_id FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE RESTRICT,
  CONSTRAINT fk_teams_cohort_id FOREIGN KEY (cohort_id) REFERENCES cohorts (id) ON DELETE RESTRICT,
  CONSTRAINT fk_teams_major_id FOREIGN KEY (major_id) REFERENCES majors (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Team Members Table (1-3 Students per Team)
CREATE TABLE IF NOT EXISTS team_members (
  id BIGINT NOT NULL AUTO_INCREMENT,
  team_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role_in_team VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_team_members_team_user (team_id, user_id),
  KEY fk_team_members_user_id (user_id),
  CONSTRAINT fk_team_members_team_id FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT fk_team_members_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Team Invitations Table (1 Student can receive multiple pending invitations)
CREATE TABLE IF NOT EXISTS team_invitations (
  id BIGINT NOT NULL AUTO_INCREMENT,
  team_id BIGINT NOT NULL,
  inviter_id BIGINT NOT NULL,
  invitee_id BIGINT NOT NULL,
  message VARCHAR(255) DEFAULT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'INVITE_BY_LEADER',
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY fk_team_invitations_team_id (team_id),
  KEY fk_team_invitations_inviter_id (inviter_id),
  KEY fk_team_invitations_invitee_id (invitee_id),
  CONSTRAINT fk_team_invitations_team_id FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT fk_team_invitations_inviter_id FOREIGN KEY (inviter_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_team_invitations_invitee_id FOREIGN KEY (invitee_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Topic Registrations Table (Team applies for Topic)
CREATE TABLE IF NOT EXISTS topic_registrations (
  id BIGINT NOT NULL AUTO_INCREMENT,
  topic_id BIGINT NOT NULL,
  team_id BIGINT NOT NULL,
  message TEXT DEFAULT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  feedback TEXT DEFAULT NULL,
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME DEFAULT NULL,
  reviewed_by BIGINT DEFAULT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY fk_topic_registrations_topic_id (topic_id),
  KEY fk_topic_registrations_team_id (team_id),
  KEY fk_topic_registrations_reviewed_by (reviewed_by),
  CONSTRAINT fk_topic_registrations_topic_id FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE,
  CONSTRAINT fk_topic_registrations_team_id FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT fk_topic_registrations_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Matchmaking Posts Table (Student Looking for Team or Team Looking for Member)
CREATE TABLE IF NOT EXISTS matchmaking_posts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  post_type VARCHAR(30) NOT NULL DEFAULT 'STUDENT_LOOKING_FOR_TEAM',
  author_id BIGINT NOT NULL,
  team_id BIGINT DEFAULT NULL,
  title VARCHAR(200) NOT NULL,
  goals TEXT DEFAULT NULL,
  department_id BIGINT DEFAULT NULL,
  faculty_id BIGINT NOT NULL,
  cohort_id BIGINT NOT NULL,
  slots_needed INT NOT NULL DEFAULT 1,
  contact_info VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY fk_matchmaking_posts_author_id (author_id),
  KEY fk_matchmaking_posts_team_id (team_id),
  KEY fk_matchmaking_posts_dept_id (department_id),
  KEY fk_matchmaking_posts_faculty_id (faculty_id),
  KEY fk_matchmaking_posts_cohort_id (cohort_id),
  CONSTRAINT fk_matchmaking_posts_author_id FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_matchmaking_posts_team_id FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL,
  CONSTRAINT fk_matchmaking_posts_dept_id FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL,
  CONSTRAINT fk_matchmaking_posts_faculty_id FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE RESTRICT,
  CONSTRAINT fk_matchmaking_posts_cohort_id FOREIGN KEY (cohort_id) REFERENCES cohorts (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Matchmaking Post Skills Table
CREATE TABLE IF NOT EXISTS matchmaking_post_skills (
  post_id BIGINT NOT NULL,
  skill VARCHAR(100) NOT NULL,
  PRIMARY KEY (post_id, skill),
  CONSTRAINT fk_matchmaking_post_skills_post_id FOREIGN KEY (post_id) REFERENCES matchmaking_posts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Team Join Requests Table (Students applying to Matchmaking Posts)
CREATE TABLE IF NOT EXISTS team_join_requests (
  id BIGINT NOT NULL AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  applicant_id BIGINT NOT NULL,
  faculty_id BIGINT NOT NULL,
  cohort_id BIGINT NOT NULL,
  message TEXT DEFAULT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY fk_team_join_requests_post_id (post_id),
  KEY fk_team_join_requests_applicant_id (applicant_id),
  KEY fk_team_join_requests_faculty_id (faculty_id),
  KEY fk_team_join_requests_cohort_id (cohort_id),
  CONSTRAINT fk_team_join_requests_post_id FOREIGN KEY (post_id) REFERENCES matchmaking_posts (id) ON DELETE CASCADE,
  CONSTRAINT fk_team_join_requests_applicant_id FOREIGN KEY (applicant_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_team_join_requests_faculty_id FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE RESTRICT,
  CONSTRAINT fk_team_join_requests_cohort_id FOREIGN KEY (cohort_id) REFERENCES cohorts (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modules 11–13: immutable document history, council assignments and individual assessments.
CREATE TABLE IF NOT EXISTS report_documents (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  registration_id BIGINT NOT NULL,
  submitted_by BIGINT NOT NULL,
  document_type VARCHAR(30) NOT NULL,
  title VARCHAR(200) NOT NULL,
  note VARCHAR(2000),
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  document_version INT NOT NULL,
  content LONGBLOB NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uk_report_version (registration_id, document_type, document_version),
  CONSTRAINT fk_report_registration FOREIGN KEY (registration_id) REFERENCES topic_registrations(id),
  CONSTRAINT fk_report_submitter FOREIGN KEY (submitted_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS defense_councils (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  department_id BIGINT NOT NULL,
  period_id BIGINT NOT NULL,
  room VARCHAR(150) NOT NULL,
  starts_at DATETIME(6) NOT NULL,
  ends_at DATETIME(6) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_council_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_council_period FOREIGN KEY (period_id) REFERENCES registration_periods(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS defense_council_members (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  council_id BIGINT NOT NULL,
  lecturer_id BIGINT NOT NULL,
  member_role VARCHAR(30) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uk_council_lecturer (council_id, lecturer_id),
  CONSTRAINT fk_council_member_council FOREIGN KEY (council_id) REFERENCES defense_councils(id),
  CONSTRAINT fk_council_member_lecturer FOREIGN KEY (lecturer_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS defense_assignments (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  council_id BIGINT NOT NULL,
  registration_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uk_defense_registration (registration_id),
  CONSTRAINT fk_assignment_council FOREIGN KEY (council_id) REFERENCES defense_councils(id),
  CONSTRAINT fk_assignment_registration FOREIGN KEY (registration_id) REFERENCES topic_registrations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessments (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  assignment_id BIGINT NOT NULL,
  evaluator_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  assessment_type VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  content_score DECIMAL(4,2) NOT NULL,
  implementation_score DECIMAL(4,2) NOT NULL,
  presentation_score DECIMAL(4,2) NOT NULL,
  strengths VARCHAR(4000),
  weaknesses VARCHAR(4000),
  questions VARCHAR(4000),
  comment VARCHAR(4000),
  submitted_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uk_individual_assessment (assignment_id, evaluator_id, student_id, assessment_type),
  CONSTRAINT fk_assessment_assignment FOREIGN KEY (assignment_id) REFERENCES defense_assignments(id),
  CONSTRAINT fk_assessment_evaluator FOREIGN KEY (evaluator_id) REFERENCES users(id),
  CONSTRAINT fk_assessment_student FOREIGN KEY (student_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
