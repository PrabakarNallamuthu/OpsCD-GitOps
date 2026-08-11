/**
 * Builds a PostgreSQL connection URL with schema search path and SSL enforcement.
 * Services should call this with their specific schema name, never share connection URLs.
 */
export interface ConnectionOptions {
  host: string;
  port?: number;
  database: string;
  schema: string;
  user: string;
  password: string;
  sslMode?: 'require' | 'verify-ca' | 'verify-full' | 'disable';
  poolSize?: number;
  poolTimeout?: number;
}

export function buildConnectionUrl(opts: ConnectionOptions): string {
  const {
    host,
    port = 5432,
    database,
    schema,
    user,
    password,
    sslMode = 'require',
    poolSize = 10,
    poolTimeout = 30,
  } = opts;

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);

  const params = new URLSearchParams({
    schema,
    sslmode: sslMode,
    connection_limit: String(poolSize),
    pool_timeout: String(poolTimeout),
  });

  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}?${params.toString()}`;
}

/**
 * Builds the DATABASE_URL from Kubernetes Secret mount or environment variables.
 * Services mounted with ExternalSecret files use this over plain env vars.
 */
export function buildConnectionUrlFromEnv(schema: string): string {
  const url = process.env['DATABASE_URL'];
  if (url) {
    // Inject schema into existing URL (ESO-mounted creds already have host/port/db)
    const parsed = new URL(url);
    parsed.searchParams.set('schema', schema);
    if (!parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
    }
    return parsed.toString();
  }

  return buildConnectionUrl({
    host: process.env['DB_HOST'] ?? 'localhost',
    port: Number(process.env['DB_PORT'] ?? 5432),
    database: process.env['DB_NAME'] ?? 'opsera',
    schema,
    user: process.env['DB_USER'] ?? 'postgres',
    password: process.env['DB_PASSWORD'] ?? '',
    sslMode: (process.env['DB_SSLMODE'] as ConnectionOptions['sslMode']) ?? 'require',
    poolSize: Number(process.env['DB_POOL_SIZE'] ?? 10),
    poolTimeout: Number(process.env['DB_POOL_TIMEOUT'] ?? 30),
  });
}
