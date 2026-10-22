-- Migration: Create email_logs table for tracking automated email deliveries
CREATE TABLE IF NOT EXISTS email_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient VARCHAR(150) NOT NULL,
    recipient_name VARCHAR(150),
    sender VARCHAR(150),
    subject VARCHAR(500) NOT NULL,
    template_name VARCHAR(100),
    status VARCHAR(30) NOT NULL,
    error_message TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_logs_recipient (recipient),
    INDEX idx_email_logs_status (status),
    INDEX idx_email_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

