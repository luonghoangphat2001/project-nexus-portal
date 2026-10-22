-- Migration to expand notification title to 500 characters to support full bilingual [VI] | [EN] titles
ALTER TABLE notifications MODIFY COLUMN title VARCHAR(500) NOT NULL;
