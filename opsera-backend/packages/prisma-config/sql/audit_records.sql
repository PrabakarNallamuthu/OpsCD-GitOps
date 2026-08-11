-- Append-only audit records table with monthly partitioning and hash chain
-- IMPORTANT: The application role (svc_audit) must NOT have UPDATE or DELETE grants.
-- Enforced at PostgreSQL level via REVOKE statements below.

CREATE TABLE IF NOT EXISTS audit.records (
  id                UUID          NOT NULL DEFAULT uuid_generate_v4(),
  event_type        VARCHAR(100)  NOT NULL,
  actor_id          UUID          NOT NULL,
  resource_type     VARCHAR(100)  NOT NULL,
  resource_id       UUID          NOT NULL,
  action            VARCHAR(50)   NOT NULL,  -- CREATE | READ | UPDATE | DELETE | APPROVE | REJECT
  payload           JSONB         NOT NULL DEFAULT '{}',
  checksum          VARCHAR(64)   NOT NULL,  -- SHA-256 hex of (content + prev_checksum)
  previous_checksum VARCHAR(64)   NOT NULL,  -- previous record's checksum; '000...0' for first
  correlation_id    VARCHAR(64)   NOT NULL,
  event_timestamp   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, event_timestamp)
) PARTITION BY RANGE (event_timestamp);

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_records_actor ON audit.records (actor_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_records_resource ON audit.records (resource_type, resource_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_records_correlation ON audit.records (correlation_id);

-- Row-Level Security: only allow INSERT and SELECT
ALTER TABLE audit.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.records FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_insert_only_policy ON audit.records
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY audit_select_policy ON audit.records
  FOR SELECT
  USING (true);

-- Revoke all mutating privileges from the service role
REVOKE UPDATE, DELETE, TRUNCATE ON audit.records FROM svc_audit;

-- Install pg_partman for auto-creation of future partitions
SELECT partman.create_parent(
  p_parent_table => 'audit.records',
  p_control      => 'event_timestamp',
  p_interval     => 'monthly'
);

UPDATE partman.part_config
SET
  retention                = '12 months',
  retention_keep_table     = false,
  infinite_time_partitions = true
WHERE parent_table = 'audit.records';
