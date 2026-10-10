import type { ApiError, ApiErrorCode } from '@fibopoker/shared';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../domain/domain-error.js';

const STATUS_BY_CODE: Record<ApiErrorCode, HttpStatus> = {
  room_not_found: HttpStatus.NOT_FOUND,
};

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter<DomainError> {
  catch(error: DomainError, host: ArgumentsHost): void {
    const body: ApiError = { code: error.code, message: error.message };

    host.switchToHttp().getResponse<Response>().status(STATUS_BY_CODE[error.code]).json(body);
  }
}
