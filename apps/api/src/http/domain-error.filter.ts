import type { ApiError, ApiErrorCode } from '@fibopoker/shared';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../domain/domain-error.js';

const STATUS_BY_CODE: Record<ApiErrorCode, HttpStatus> = {
  room_not_found: HttpStatus.NOT_FOUND,
  unknown_participant: HttpStatus.UNAUTHORIZED,
  round_not_found: HttpStatus.NOT_FOUND,
  round_already_open: HttpStatus.CONFLICT,
  round_already_revealed: HttpStatus.CONFLICT,
  invalid_estimate: HttpStatus.BAD_REQUEST,
  invalid_request: HttpStatus.BAD_REQUEST,
};

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter<DomainError> {
  catch(error: DomainError, host: ArgumentsHost): void {
    const body: ApiError = { code: error.code, message: error.message };
    const response = host.switchToHttp().getResponse<Response>();

    response.status(STATUS_BY_CODE[error.code]).json(body);
  }
}
