import type { RoomSnapshot } from '@fibopoker/shared';

type Round = NonNullable<RoomSnapshot['round']>;

export function theOpenRound(snapshot: RoomSnapshot): Extract<Round, { state: 'open' }> {
  if (snapshot.round?.state !== 'open') {
    throw new Error('No Round is open in this snapshot');
  }

  return snapshot.round;
}

export function theRevealedRound(snapshot: RoomSnapshot): Extract<Round, { state: 'revealed' }> {
  if (snapshot.round?.state !== 'revealed') {
    throw new Error('No Round is revealed in this snapshot');
  }

  return snapshot.round;
}
