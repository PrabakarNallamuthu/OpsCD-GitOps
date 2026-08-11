/**
 * Creates a deep jest.fn() mock for Prisma Client delegates.
 * Each delegate method is a jest.fn() returning undefined by default.
 */
export function createMockPrismaClient(): MockPrismaClient {
  const makeDelegateMock = () => ({
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findFirst: jest.fn(),
    findFirstOrThrow: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  });

  return {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn().mockImplementation(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return arg(createMockPrismaClient());
      }
      return Promise.all(arg as Array<Promise<unknown>>);
    }),
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    $executeRaw: jest.fn().mockResolvedValue(0),

    release: makeDelegateMock(),
    riskAssessment: makeDelegateMock(),
    policyRule: makeDelegateMock(),
    auditRecord: makeDelegateMock(),
    verificationResult: makeDelegateMock(),
    analyticsMetric: makeDelegateMock(),
    user: makeDelegateMock(),
    session: makeDelegateMock(),
  };
}

export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>;
