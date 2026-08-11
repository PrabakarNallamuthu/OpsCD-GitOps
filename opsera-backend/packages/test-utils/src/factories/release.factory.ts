import { randomUUID } from 'crypto';

export type ReleaseStatus =
  | 'Draft'
  | 'Analyzing'
  | 'Analyzed'
  | 'Approved'
  | 'Planned'
  | 'Deploying'
  | 'Deployed'
  | 'Failed'
  | 'Rejected';

export interface ChangeFactory {
  id: string;
  release_id: string;
  commit_sha: string;
  pr_reference: string;
  author: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface ReleaseFactory {
  id: string;
  name: string;
  version: string;
  status: ReleaseStatus;
  environment_id: string;
  created_by: string;
  org_id: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

let releaseSeq = 1;
let changeSeq = 1;

function randomSha(): string {
  return Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function buildRelease(overrides: Partial<ReleaseFactory> = {}): ReleaseFactory {
  const seq = releaseSeq++;
  return {
    id: randomUUID(),
    name: `Release ${seq}`,
    version: `1.${seq}.0`,
    status: 'Draft',
    environment_id: '00000000-0000-0000-0000-000000000001',
    created_by: randomUUID(),
    org_id: '00000000-0000-0000-0000-000000000000',
    description: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

export function buildChange(
  releaseId: string,
  overrides: Partial<ChangeFactory> = {},
): ChangeFactory {
  const seq = changeSeq++;
  return {
    id: randomUUID(),
    release_id: releaseId,
    commit_sha: randomSha(),
    pr_reference: `#${seq + 100}`,
    author: `dev${seq}@opsera.test`,
    message: `feat: implement feature ${seq}`,
    metadata: { files_changed: seq * 3, additions: seq * 10, deletions: seq * 2 },
    created_at: new Date(),
    ...overrides,
  };
}

export function buildReleaseList(count: number): ReleaseFactory[] {
  return Array.from({ length: count }, () => buildRelease());
}
