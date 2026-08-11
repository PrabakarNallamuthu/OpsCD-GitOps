-- Migration: Enable RLS on audit.records for SOX immutability (WO-055)
-- Run as superuser BEFORE application starts

-- Enable RLS
ALTER TABLE audit.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.records FORCE ROW LEVEL SECURITY;

-- Allow audit_app_role to INSERT only (no UPDATE/DELETE)
CREATE POLICY audit_insert_only ON audit.records
  FOR INSERT
  TO audit_app_role
  WITH CHECK (true);

-- Allow audit_app_role to SELECT all rows
CREATE POLICY audit_select_all ON audit.records
  FOR SELECT
  TO audit_app_role
  USING (true);

-- Explicitly deny UPDATE (no policy = default deny when RLS enabled)
-- No UPDATE or DELETE policies are created intentionally

-- Create restricted application role (password set via env at deploy time)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'audit_app_role') THEN
    CREATE ROLE audit_app_role WITH LOGIN PASSWORD 'CHANGE_ME_AT_DEPLOY';
  END IF;
END $$;

GRANT USAGE ON SCHEMA audit TO audit_app_role;
GRANT INSERT, SELECT ON audit.records TO audit_app_role;
GRANT ALL ON audit.partition_metadata TO audit_app_role;

-- Emergency admin role with BYPASSRLS (access audited separately)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'audit_admin_role') THEN
    CREATE ROLE audit_admin_role WITH LOGIN PASSWORD 'CHANGE_ME_AT_DEPLOY' BYPASSRLS;
  END IF;
END $$;

GRANT ALL ON SCHEMA audit TO audit_admin_role;
GRANT ALL ON ALL TABLES IN SCHEMA audit TO audit_admin_role;

-- Install pg_partman for automated partition management
CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA partman;

-- Configure automated monthly partitions (creates 3 months ahead)
SELECT partman.create_parent(
  p_parent_table => 'audit.records',
  p_control => 'event_timestamp',
  p_type => 'range',
  p_interval => 'monthly',
  p_premake => 3
);
