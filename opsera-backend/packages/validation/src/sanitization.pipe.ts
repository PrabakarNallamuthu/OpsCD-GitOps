import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

const ALLOWED_SPECIAL_CHAR_FIELDS = new Set([
  'condition',
  'expression',
  'query',
  'template',
  'markdown',
]);

@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type === 'param' || metadata.type === 'query') {
      return this.sanitizeValue('', value);
    }

    if (metadata.type === 'body' && value !== null && typeof value === 'object') {
      return this.sanitizeObject(value as Record<string, unknown>);
    }

    return value;
  }

  private sanitizeObject(
    obj: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      result[key] = ALLOWED_SPECIAL_CHAR_FIELDS.has(key.toLowerCase())
        ? value
        : this.sanitizeValue(key, value);
    }

    return result;
  }

  private sanitizeValue(key: string, value: unknown): unknown {
    if (typeof value === 'string') {
      return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(key, item));
    }

    if (value !== null && typeof value === 'object') {
      return this.sanitizeObject(value as Record<string, unknown>);
    }

    return value;
  }
}
