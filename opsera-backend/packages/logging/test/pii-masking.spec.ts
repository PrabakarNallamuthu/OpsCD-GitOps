import { LEVEL, MESSAGE, SPLAT } from 'triple-beam';
import { piiMaskingFormat } from '../src/formats/pii-masking.format.js';
import { piiTestCases } from './fixtures/pii-payloads.fixture.js';

describe('piiMaskingFormat', () => {
  const maskFn = piiMaskingFormat().transform.bind(piiMaskingFormat());

  piiTestCases.forEach(({ description, input, expectedMasked }) => {
    it(`should mask: ${description}`, () => {
      const info = {
        level: 'info',
        message: '',
        [LEVEL]: 'info',
        [MESSAGE]: '',
        [SPLAT]: [],
        ...input,
      };

      const result = maskFn(info, {}) as Record<string, unknown>;

      for (const [key, expected] of Object.entries(expectedMasked)) {
        expect(result[key]).toEqual(expected);
      }
    });
  });

  it('handles null values gracefully', () => {
    const info = {
      level: 'info',
      message: 'test',
      [LEVEL]: 'info',
      [MESSAGE]: '',
      [SPLAT]: [],
      nullField: null,
      undefinedField: undefined,
    };
    expect(() => maskFn(info, {})).not.toThrow();
  });
});
