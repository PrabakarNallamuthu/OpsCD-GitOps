export interface KafkaModuleConfig {
  clientId: string;
  brokers: string[];
  ssl?: boolean;
  sasl?: {
    mechanism: 'scram-sha-512' | 'scram-sha-256' | 'plain';
    username: string;
    password: string;
  };
  schemaRegistryUrl?: string;
  connectionTimeout?: number;
  requestTimeout?: number;
}

export interface ConsumerConfig {
  groupId: string;
  sessionTimeout?: number;
  heartbeatInterval?: number;
  maxBytesPerPartition?: number;
  retry?: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
}

export function kafkaConfigFromEnv(clientId: string): KafkaModuleConfig {
  const brokers = (process.env['KAFKA_BROKERS'] ?? 'localhost:9092').split(',');

  const config: KafkaModuleConfig = {
    clientId,
    brokers,
    connectionTimeout: 10_000,
    requestTimeout: 30_000,
  };

  if (process.env['KAFKA_SSL'] === 'true') {
    config.ssl = true;
  }

  if (process.env['KAFKA_SASL_USERNAME']) {
    config.sasl = {
      mechanism: 'scram-sha-512',
      username: process.env['KAFKA_SASL_USERNAME']!,
      password: process.env['KAFKA_SASL_PASSWORD'] ?? '',
    };
  }

  if (process.env['SCHEMA_REGISTRY_URL']) {
    config.schemaRegistryUrl = process.env['SCHEMA_REGISTRY_URL'];
  }

  return config;
}
