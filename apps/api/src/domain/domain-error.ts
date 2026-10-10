import type { ApiErrorCode } from '@fibopoker/shared';

export abstract class DomainError extends Error {
  abstract readonly code: ApiErrorCode;
}
