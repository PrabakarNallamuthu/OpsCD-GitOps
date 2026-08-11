import { getPartitionName, generatePartitionDDL } from '../src/partition.util.js';

describe('getPartitionName', () => {
  it('generates correct name for January 2026', () => {
    expect(getPartitionName('audit_records', new Date('2026-01-15'))).toBe(
      'audit_records_y2026m01',
    );
  });

  it('generates correct name for December 2025', () => {
    expect(getPartitionName('audit_records', new Date('2025-12-01'))).toBe(
      'audit_records_y2025m12',
    );
  });

  it('handles year boundary (Dec → Jan)', () => {
    expect(getPartitionName('analytics_events', new Date('2026-12-01'))).toBe(
      'analytics_events_y2026m12',
    );
    expect(getPartitionName('analytics_events', new Date('2027-01-01'))).toBe(
      'analytics_events_y2027m01',
    );
  });
});

describe('generatePartitionDDL', () => {
  it('generates correct DDL for 3 months', () => {
    const ddl = generatePartitionDDL('audit_records', new Date('2026-01-01'), 3);
    expect(ddl).toHaveLength(3);
    expect(ddl[0]).toContain('audit_records_y2026m01');
    expect(ddl[0]).toContain("FROM ('2026-01-01') TO ('2026-02-01')");
    expect(ddl[1]).toContain('audit_records_y2026m02');
    expect(ddl[2]).toContain('audit_records_y2026m03');
  });

  it('generates 12 months for a full year', () => {
    const ddl = generatePartitionDDL('audit_records', new Date('2026-01-01'), 12);
    expect(ddl).toHaveLength(12);
    expect(ddl[11]).toContain('audit_records_y2026m12');
  });

  it('handles year boundary across December to January', () => {
    const ddl = generatePartitionDDL('audit_records', new Date('2026-11-01'), 3);
    expect(ddl[0]).toContain('y2026m11');
    expect(ddl[1]).toContain('y2026m12');
    expect(ddl[2]).toContain('y2027m01');
  });
});
