import { createLogger as winstonCreateLogger, transports, format, Logger } from 'winston';
import { getCorrelationId } from './correlation-id.storage.js';
import { piiMaskingFormat } from './formats/pii-masking.format.js';

export interface LoggerConfig {
  serviceName: string;
  level?: string;
  prettyPrint?: boolean;
}

const correlationIdFormat = format((info) => {
  info['correlation_id'] = getCorrelationId();
  return info;
});

export function createLogger(config: LoggerConfig): Logger {
  const level = config.level ?? process.env['LOG_LEVEL'] ?? 'info';
  const isDev = process.env['NODE_ENV'] !== 'production';

  const formatChain = [
    format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    correlationIdFormat(),
    piiMaskingFormat(),
    format.errors({ stack: true }),
  ];

  if (config.prettyPrint ?? isDev) {
    formatChain.push(format.colorize(), format.simple());
  } else {
    formatChain.push(
      format.json({
        replacer: (key, value) => {
          if (key === 'level') return undefined;
          return value;
        },
      }),
    );
  }

  return winstonCreateLogger({
    level,
    defaultMeta: {
      service: config.serviceName,
    },
    format: format.combine(...formatChain),
    transports: [new transports.Console()],
  });
}
