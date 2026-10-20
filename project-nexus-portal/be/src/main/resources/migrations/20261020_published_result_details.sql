-- Apply explicitly to the production database. This file is not auto-executed.
CREATE TABLE IF NOT EXISTS published_result_details (
  result_id BIGINT NOT NULL PRIMARY KEY,
  advisor_name VARCHAR(255) NOT NULL,
  advisor_content_score DECIMAL(4,2) NOT NULL,
  advisor_implementation_score DECIMAL(4,2) NOT NULL,
  advisor_presentation_score DECIMAL(4,2) NOT NULL,
  review_content_score DECIMAL(4,2) NOT NULL,
  review_implementation_score DECIMAL(4,2) NOT NULL,
  review_presentation_score DECIMAL(4,2) NOT NULL,
  defense_content_score DECIMAL(4,2) NOT NULL,
  defense_implementation_score DECIMAL(4,2) NOT NULL,
  defense_presentation_score DECIMAL(4,2) NOT NULL,
  advisor_comment TEXT,
  review_comment TEXT,
  defense_comments TEXT,
  CONSTRAINT fk_published_result_details_result FOREIGN KEY (result_id)
    REFERENCES published_results(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
