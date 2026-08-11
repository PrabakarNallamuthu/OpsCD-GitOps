export { KafkaProducerService, type OpseraEvent } from './producer/kafka-producer.service.js';
export { KafkaSubscribe, type KafkaSubscribeMetadata } from './consumer/kafka-subscribe.decorator.js';
export { DlqService } from './consumer/dlq.service.js';
export { kafkaConfigFromEnv, type KafkaModuleConfig, type ConsumerConfig } from './config/kafka.config.js';
