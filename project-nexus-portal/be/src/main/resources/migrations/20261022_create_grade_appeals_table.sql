CREATE TABLE IF NOT EXISTS grade_appeals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    reason VARCHAR(2000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    response_note VARCHAR(2000) NULL,
    reviewed_by BIGINT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_grade_appeal_assignment FOREIGN KEY (assignment_id) REFERENCES defense_assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_grade_appeal_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_grade_appeal_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_grade_appeal_assignment_student (assignment_id, student_id),
    INDEX idx_grade_appeal_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

