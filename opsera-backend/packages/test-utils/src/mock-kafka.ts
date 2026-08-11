import type { OpseraEvent } from '@opsera/kafka';

interface CapturedEvent {
  topic: string;
  event: OpseraEvent;
}

export function createMockKafkaProducer() {
  const captured: CapturedEvent[] = [];

  const producer = {
    publish: jest.fn(async (topic: string, event: OpseraEvent) => {
      captured.push({ topic, event });
    }),
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
  };

  const helpers = {
    getEmittedEvents: (topic?: string): CapturedEvent[] =>
      topic ? captured.filter((e) => e.topic === topic) : [...captured],

    expectEventEmitted: (
      topic: string,
      matcher: Partial<OpseraEvent>,
    ): void => {
      const events = captured.filter((e) => e.topic === topic);
      const match = events.some((e) =>
        Object.entries(matcher).every(
          ([k, v]) => JSON.stringify(e.event[k as keyof OpseraEvent]) === JSON.stringify(v),
        ),
      );
      if (!match) {
        throw new Error(
          `Expected event on topic "${topic}" matching ${JSON.stringify(matcher)}, ` +
          `but got: ${JSON.stringify(events)}`,
        );
      }
    },

    clearCaptured: (): void => {
      captured.length = 0;
    },
  };

  return { producer, ...helpers };
}

export type MockKafkaProducer = ReturnType<typeof createMockKafkaProducer>['producer'];
