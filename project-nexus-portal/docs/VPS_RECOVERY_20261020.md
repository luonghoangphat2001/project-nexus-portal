# VPS recovery ? 2026-10-20

The frontend and backend had been started from different Compose projects. Nginx returned 502 while the backend itself could authenticate requests. The inactive legacy MySQL volume contained RECOVER_YOUR_DATA instead of nexus_db; preserve it as incident evidence.

Production now uses Compose project `nexus-portal`, an explicit external volume selected by `NEXUS_MYSQL_VOLUME`, no published MySQL port, a dedicated application DB user, `SQL_INIT_MODE=never`, and `HIBERNATE_DDL_AUTO=none`. Credentials are stored only in the VPS `be/.env` (mode 600). The existing active volume `be_nexus_mysql_data` is retained; the old volume must not be used or deleted.

Before a first deployment elsewhere, create/select the intended volume explicitly and set `MYSQL_ROOT_PASSWORD`, `DB_USER`, `DB_PASSWORD`, and `NEXUS_MYSQL_VOLUME` in `be/.env`. Compose refuses to run without the required root password and volume name.

Deploy from the project directory with `bash scripts/deploy.sh all`. The script always reconciles all services using the same project and environment file, even when only one image is rebuilt. Git synchronization is handled by CI, outside this script.

With Hibernate schema mutation disabled in production, apply reviewed SQL migrations explicitly before deploying schema-dependent code. `be/src/main/resources/migrations/20261020_published_result_details.sql` creates the missing table with TEXT comments without changing existing results.

Recovery backups and checksums are stored under `/root/nexus-recovery-20261020T105322Z` on the VPS. They include the SQL dump, both stopped MySQL volumes, and previous configuration. This directory contains sensitive configuration and must remain private.

SSH root password rotation also requires updating GitHub Actions VPS_PASSWORD; coordinate both to avoid breaking deployment. No SSH password change was made during this recovery.
