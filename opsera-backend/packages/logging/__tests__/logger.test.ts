import { createLogger, ConsoleLogger } from '../src/index.js';

describe('@opsera/logging — module resolution', () => {
  it('createLogger returns a Logger instance', () => {
    const logger = createLogger({ service: 'test-service' });
    expect(logger).toBeInstanceOf(ConsoleLogger);
  });

  it('child() returns a Logger with merged context', () => {
    const logger = createLogger({ service: 'test-service' });
    const child = logger.child({ traceId: 'trace-123' });
    expect(child).toBeInstanceOf(ConsoleLogger);
  });

  it('all log methods exist on the Logger interface', () => {
    const logger = createLogger({ service: 'test-service' });
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.fatal).toBe('function');
    expect(typeof logger.child).toBe('function');
  });
});
