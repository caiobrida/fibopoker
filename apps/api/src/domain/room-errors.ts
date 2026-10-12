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
    super(`No Round in this Room answers to the identifier ${roundId}`);
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

  constructor() {
    super('The Estimate offered is not a value the Deck holds');
  }
}

export class RoundAlreadyRevealedError extends DomainError {
  readonly code = 'round_already_revealed';

  constructor() {
    super('This Round is revealed, and a revealed Round never changes');
  }
}

export class RoundStillOpenError extends DomainError {
  readonly code = 'round_still_open';

  constructor() {
    super(
      'This Round is still open, and a Final Estimate and a Re-vote both come out of the discussion a Reveal starts',
    );
  }
}

export class SpectatorNeverEstimatesError extends DomainError {
  readonly code = 'spectator_never_estimates';

  constructor() {
    super('A Spectator is present in this Room without estimating in it');
  }
}

export class EstimateAlreadyCastError extends DomainError {
  readonly code = 'estimate_already_cast';

  constructor() {
    super(
      'This Participant holds an Estimate the tally has counted in the open Round, and spectating would silently drop it',
    );
  }
}
