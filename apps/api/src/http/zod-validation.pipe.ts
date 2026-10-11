import type { ApiError } from '@fibopoker/shared';
import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodError, ZodType } from 'zod';

const MALFORMED_BODY = 'The request body is not the shape this endpoint accepts.';

function readable(error: ZodError): string {
  return error.issues
    .map(({ path, message }) =>
      path.length === 0 ? MALFORMED_BODY : `${path.join('.')}: ${message}`,
    )
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
