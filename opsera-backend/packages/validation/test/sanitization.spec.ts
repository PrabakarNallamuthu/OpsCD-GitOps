import { SanitizationPipe } from '../src/sanitization.pipe.js';

describe('SanitizationPipe', () => {
  let pipe: SanitizationPipe;

  beforeEach(() => {
    pipe = new SanitizationPipe();
  });

  it('strips script tags from body strings', () => {
    const result = pipe.transform(
      { name: '<script>alert("xss")</script>foo' },
      { type: 'body', metatype: Object, data: '' },
    ) as Record<string, string>;
    expect(result['name']).not.toContain('<script>');
    expect(result['name']).toBe('foo');
  });

  it('strips HTML tags from string values', () => {
    const result = pipe.transform(
      { title: '<b>Hello</b> <em>world</em>' },
      { type: 'body', metatype: Object, data: '' },
    ) as Record<string, string>;
    expect(result['title']).toBe('Hello world');
  });

  it('preserves condition field contents (allowlisted)', () => {
    const condition = 'risk_score > 80 && env === "production"';
    const result = pipe.transform(
      { condition },
      { type: 'body', metatype: Object, data: '' },
    ) as Record<string, string>;
    expect(result['condition']).toBe(condition);
  });

  it('sanitizes arrays of strings', () => {
    const result = pipe.transform(
      { tags: ['<b>tag1</b>', 'safe-tag'] },
      { type: 'body', metatype: Object, data: '' },
    ) as Record<string, string[]>;
    expect(result['tags']).toEqual(['tag1', 'safe-tag']);
  });

  it('sanitizes nested objects', () => {
    const result = pipe.transform(
      { meta: { description: '<img src=x onerror=alert(1)>safe' } },
      { type: 'body', metatype: Object, data: '' },
    ) as Record<string, Record<string, string>>;
    expect(result['meta']?.['description']).toBe('safe');
  });

  it('passes through non-string values unchanged', () => {
    const result = pipe.transform(
      { count: 42, active: true },
      { type: 'body', metatype: Object, data: '' },
    ) as Record<string, unknown>;
    expect(result['count']).toBe(42);
    expect(result['active']).toBe(true);
  });

  it('sanitizes query params', () => {
    const result = pipe.transform('<script>bad</script>', {
      type: 'query',
      metatype: String,
      data: 'q',
    });
    expect(result).not.toContain('<script>');
  });

  it('handles null body gracefully', () => {
    expect(() =>
      pipe.transform(null, { type: 'body', metatype: Object, data: '' }),
    ).not.toThrow();
  });
});
