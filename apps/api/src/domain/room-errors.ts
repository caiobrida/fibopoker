import { DomainError } from './domain-error.js';

export class RoomNotFoundError extends DomainError {
  readonly code = 'room_not_found';

  constructor(roomId: string) {
    super(`No Room answers to the identifier ${roomId}`);
  }
}

export class UnknownParticipantError extends DomainError {
  readonly code = 'unknown_participant';

  constructor() {
    super('The token presented is held by no Participant of this Room');
  }
}

export class RoundNotFoundError extends DomainError {
  readonly code = 'round_not_found';

  constructor(roundId: string) {
    super(`This Room holds no Round answering to the identifier ${roundId}`);
  }
}

export class RoundAlreadyOpenError extends DomainError {
  readonly code = 'round_already_open';

  constructor() {
    super('A Round is already open in this Room');
  }
}

export class EstimateOutsideTheDeckError extends DomainError {
  readonly code = 'invalid_estimate';

  constructor(value: string) {
    super(`The Deck does not hold the value ${value}`);
  }
}
