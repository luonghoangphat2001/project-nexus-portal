-- ==========================================================
-- 20261022_clean_user_full_names.sql
-- Remove role/position/team designations from user full_name
-- e.g. 'Huynh Tan Dat (Council Reviewer - Networks)' -> 'Huynh Tan Dat'
-- ==========================================================

UPDATE users SET full_name = TRIM(REGEXP_REPLACE(full_name, ' *\\([^)]*\\)', '')) WHERE full_name LIKE '%(%';

