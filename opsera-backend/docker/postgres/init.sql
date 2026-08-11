-- Create per-service databases for local dev
CREATE DATABASE opsera_auth;
CREATE DATABASE opsera_release;
CREATE DATABASE opsera_risk;
CREATE DATABASE opsera_policy;
CREATE DATABASE opsera_audit;
CREATE DATABASE opsera_verification;
CREATE DATABASE opsera_analytics;

-- Grant all to opsera user
GRANT ALL PRIVILEGES ON DATABASE opsera_auth TO opsera;
GRANT ALL PRIVILEGES ON DATABASE opsera_release TO opsera;
GRANT ALL PRIVILEGES ON DATABASE opsera_risk TO opsera;
GRANT ALL PRIVILEGES ON DATABASE opsera_policy TO opsera;
GRANT ALL PRIVILEGES ON DATABASE opsera_audit TO opsera;
GRANT ALL PRIVILEGES ON DATABASE opsera_verification TO opsera;
GRANT ALL PRIVILEGES ON DATABASE opsera_analytics TO opsera;
