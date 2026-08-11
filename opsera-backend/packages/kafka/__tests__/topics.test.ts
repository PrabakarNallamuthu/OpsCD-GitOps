import { TOPICS, KAFKA_TOPIC_PREFIX } from '../src/index.js';

describe('@opsera/kafka — module resolution', () => {
  it('all topics are prefixed with the opsera. prefix', () => {
    for (const topic of Object.values(TOPICS)) {
      expect(topic).toMatch(new RegExp(`^${KAFKA_TOPIC_PREFIX}`));
    }
  });

  it('exports expected topic constants', () => {
    expect(TOPICS.RELEASE_CREATED).toBe('opsera.release.created');
    expect(TOPICS.ANALYSIS_REQUESTED).toBe('opsera.risk.analysis.requested');
    expect(TOPICS.AUDIT_EVENT).toBe('opsera.audit.event');
  });
});
