/**
 * Generates PostgreSQL monthly partition DDL for time-series tables.
 * Used by audit and analytics services.
 */
export function getPartitionName(tableName: string, date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${tableName}_y${year}m${month}`;
}

export function generatePartitionDDL(
  tableName: string,
  startDate: Date,
  months: number,
): string[] {
  const ddl: string[] = [];
  const current = new Date(
    Date.UTC(startDate.getFullYear(), startDate.getMonth(), 1),
  );

  for (let i = 0; i < months; i++) {
    const partitionName = getPartitionName(tableName, current);
    const start = formatPartitionDate(current);

    const nextMonth = new Date(current);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    const end = formatPartitionDate(nextMonth);

    ddl.push(
      `CREATE TABLE IF NOT EXISTS ${partitionName} ` +
        `PARTITION OF ${tableName} ` +
        `FOR VALUES FROM ('${start}') TO ('${end}');`,
    );

    current.setUTCMonth(current.getUTCMonth() + 1);
  }

  return ddl;
}

function formatPartitionDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
