-- Migration to add recipient_id column to notifications table for targeted notifications
ALTER TABLE notifications ADD COLUMN recipient_id BIGINT NULL;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_id, created_at);
