-- ------------------------------------------------------------
-- DB VM bootstrap (PostgreSQL)
-- Run as postgres user:
--   sudo -u postgres psql -f postgres-bootstrap.sql
-- ------------------------------------------------------------

DO
$$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'conectcrm_admin') THEN
    CREATE ROLE conectcrm_admin LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
  END IF;
END
$$;

DO
$$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'conectcrm_production') THEN
    CREATE DATABASE conectcrm_production OWNER conectcrm_admin;
  END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE conectcrm_production TO conectcrm_admin;
