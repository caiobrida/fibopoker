import type { ApiError } from '@fibopoker/shared';
import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

function readable(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  return error.issues
    .map(({ path, message }) => (path.length === 0 ? message : `${path.join('.')}: ${message}`))
    .join(' ');
}

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);

    if (!parsed.success) {
      const body: ApiError = { code: 'invalid_request', message: readable(parsed.error) };

      throw new BadRequestException(body);
    }

    return parsed.data;
  }
}
