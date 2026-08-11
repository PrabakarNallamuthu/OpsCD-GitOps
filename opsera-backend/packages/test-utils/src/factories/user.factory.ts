import { randomUUID } from 'crypto';

export type Role = 'Developer' | 'ReleaseManager' | 'SRE' | 'Leadership' | 'Admin';

export interface UserFactory {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  org_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

let userSeq = 1;

export function buildUser(overrides: Partial<UserFactory> = {}): UserFactory {
  const seq = userSeq++;
  return {
    id: randomUUID(),
    email: `user${seq}@opsera.test`,
    name: `Test User ${seq}`,
    roles: ['Developer'],
    org_id: '00000000-0000-0000-0000-000000000000',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

export function buildUserList(count: number, overrides: Partial<UserFactory> = {}): UserFactory[] {
  return Array.from({ length: count }, () => buildUser(overrides));
}
