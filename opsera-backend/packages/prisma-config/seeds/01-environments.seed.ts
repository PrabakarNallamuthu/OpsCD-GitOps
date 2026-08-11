import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function run(): Promise<void> {
  await prisma.environment.upsert({
    where: { slug: 'development' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Development',
      slug: 'development',
      tier: 'dev',
      org_id: '00000000-0000-0000-0000-000000000000',
      config: { auto_approve: true, require_tests: false },
    },
  });

  await prisma.environment.upsert({
    where: { slug: 'staging' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Staging',
      slug: 'staging',
      tier: 'staging',
      org_id: '00000000-0000-0000-0000-000000000000',
      config: { auto_approve: false, require_tests: true },
    },
  });

  await prisma.environment.upsert({
    where: { slug: 'production' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Production',
      slug: 'production',
      tier: 'production',
      org_id: '00000000-0000-0000-0000-000000000000',
      config: { auto_approve: false, require_tests: true, require_approval: true },
    },
  });

  console.log('Seeded environments');
  await prisma.$disconnect();
}
