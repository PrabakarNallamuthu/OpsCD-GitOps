import 'reflect-metadata';

export const KAFKA_SUBSCRIBE_METADATA = Symbol('kafka:subscribe');

export interface KafkaSubscribeMetadata {
  topic: string;
  eventType?: string;
  fromBeginning?: boolean;
}

export function KafkaSubscribe(
  topic: string,
  options?: { eventType?: string; fromBeginning?: boolean },
): MethodDecorator {
  return (target, propertyKey) => {
    const existing: KafkaSubscribeMetadata[] =
      Reflect.getMetadata(KAFKA_SUBSCRIBE_METADATA, target) ?? [];

    existing.push({ topic, ...options });
    Reflect.defineMetadata(KAFKA_SUBSCRIBE_METADATA, existing, target);
    Reflect.defineMetadata(
      `${KAFKA_SUBSCRIBE_METADATA.toString()}:${String(propertyKey)}`,
      { topic, ...options },
      target,
      propertyKey,
    );
  };
}
