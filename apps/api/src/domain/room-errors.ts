import { DomainError } from './domain-error.js';

export class RoomNotFoundError extends DomainError {
  readonly code = 'room_not_found';

  constructor(roomId: string) {
    super(`No Room answers to the identifier ${roomId}`);
  }
}
