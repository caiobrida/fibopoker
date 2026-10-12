import { describe, expect, it } from 'vitest';
import { InMemoryRoomRepository } from '../testing/in-memory-room-repository.js';
import { ManualClock } from '../testing/manual-clock.js';
import { theRevealedRound } from '../testing/snapshot-rounds.js';
import { CastEstimate } from './cast-estimate.js';
import { CreateRoom } from './create-room.js';
import { GetRoomSnapshot } from './get-room-snapshot.js';
import { JoinRoom } from './join-room.js';
import { OpenRound } from './open-round.js';
import { RevealRound } from './reveal-round.js';
import {
  EstimateOutsideTheDeckError,
  RoomNotFoundError,
  RoundNotFoundError,
  RoundStillOpenError,
  UnknownParticipantError,
} from './room-errors.js';
import { SetFinalEstimate } from './set-final-estimate.js';

const A_MONDAY_MORNING = new Date('2026-10-12T09:00:00.000Z');
const ONE_SECOND = 1_000;

async function aRoomBeingEstimated(rooms: InMemoryRoomRepository, clock: ManualClock) {
  const { id: roomId } = await new CreateRoom(rooms).execute();
  const joinRoom = new JoinRoom(rooms, clock);
  const alice = await joinRoom.execute({ roomId, nickname: 'Alice' });
  clock.advance(ONE_SECOND);
  const bob = await joinRoom.execute({ roomId, nickname: 'Bob' });
  const { id: roundId } = await new OpenRound(rooms, clock).execute({
    roomId,
    token: alice.token,
    title: 'The checkout flow',
  });

  return { roomId, roundId, alice: alice.token, bob: bob.token };
}

async function aRoundThreeApart(rooms: InMemoryRoomRepository, clock: ManualClock) {
  const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
  const castEstimate = new CastEstimate(rooms, clock);
  await castEstimate.execute({ roomId, roundId, token: alice, value: '3' });
  await castEstimate.execute({ roomId, roundId, token: bob, value: '8' });
  await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });

  return { roomId, roundId, alice, bob };
}

describe('Recording the Final Estimate', () => {
  it('puts the number the team agreed on against the Round they agreed it for', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);

    await new SetFinalEstimate(rooms).execute({ roomId, roundId, token: alice, value: '5' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(theRevealedRound(snapshot).finalEstimate).toBe('5');
  });

  it('leaves a revealed Round without one until a person records it', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId } = await aRoundThreeApart(rooms, clock);

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(theRevealedRound(snapshot).finalEstimate).toBeNull();
  });

  it('is never derived from the Estimates, not even when the whole Room agreed', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    const castEstimate = new CastEstimate(rooms, clock);
    await castEstimate.execute({ roomId, roundId, token: alice, value: '5' });
    await castEstimate.execute({ roomId, roundId, token: bob, value: '5' });

    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(theRevealedRound(snapshot).estimates).toEqual([
      expect.objectContaining({ value: '5' }),
      expect.objectContaining({ value: '5' }),
    ]);
    expect(theRevealedRound(snapshot).finalEstimate).toBeNull();
  });

  it('replaces a number typed in by mistake, because the record has to be the right one', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);
    const setFinalEstimate = new SetFinalEstimate(rooms);
    await setFinalEstimate.execute({ roomId, roundId, token: alice, value: '1' });

    await setFinalEstimate.execute({ roomId, roundId, token: alice, value: '13' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(theRevealedRound(snapshot).finalEstimate).toBe('13');
  });

  it('takes the value that says the task is not understood well enough to estimate', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);

    await new SetFinalEstimate(rooms).execute({ roomId, roundId, token: alice, value: '?' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(theRevealedRound(snapshot).finalEstimate).toBe('?');
  });

  it('refuses a value the Deck does not hold', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);

    const recorded = new SetFinalEstimate(rooms).execute({
      roomId,
      roundId,
      token: alice,
      value: '7',
    });

    await expect(recorded).rejects.toThrow(EstimateOutsideTheDeckError);
  });

  it('leaves the Round without one when the value is refused', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);

    await new SetFinalEstimate(rooms)
      .execute({ roomId, roundId, token: alice, value: '7' })
      .catch(() => null);

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(theRevealedRound(snapshot).finalEstimate).toBeNull();
  });

  it('refuses a Round still open, because the number comes out of the discussion', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoomBeingEstimated(rooms, clock);

    const recorded = new SetFinalEstimate(rooms).execute({
      roomId,
      roundId,
      token: alice,
      value: '5',
    });

    await expect(recorded).rejects.toThrow(RoundStillOpenError);
  });

  it('is the only thing a Reveal leaves writable, and touches no Estimate', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    const revealed = await getRoomSnapshot.execute({ roomId, token: null });

    await new SetFinalEstimate(rooms).execute({ roomId, roundId, token: alice, value: '5' });

    const recorded = await getRoomSnapshot.execute({ roomId, token: null });

    expect(theRevealedRound(recorded).estimates).toEqual(theRevealedRound(revealed).estimates);
  });

  it('lets anybody in the Room do it, because nobody has a special right to', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, bob } = await aRoundThreeApart(rooms, clock);

    await new SetFinalEstimate(rooms).execute({ roomId, roundId, token: bob, value: '5' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(theRevealedRound(snapshot).finalEstimate).toBe('5');
  });

  it('reaches a Round the team has already moved on from', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);
    clock.advance(ONE_SECOND);
    await new OpenRound(rooms, clock).execute({ roomId, token: alice, title: 'The search page' });

    await new SetFinalEstimate(rooms).execute({ roomId, roundId, token: alice, value: '5' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.history).toEqual([
      { id: roundId, title: 'The checkout flow', finalEstimate: '5' },
    ]);
  });

  it('advances the Room revision, because nothing writes without bumping it', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    const before = await getRoomSnapshot.execute({ roomId, token: null });

    await new SetFinalEstimate(rooms).execute({ roomId, roundId, token: alice, value: '5' });

    const after = await getRoomSnapshot.execute({ roomId, token: null });

    expect(after.revision).toBeGreaterThan(before.revision);
  });

  it('leaves the revision where it was when the value is refused', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    const before = await getRoomSnapshot.execute({ roomId, token: null });

    await new SetFinalEstimate(rooms)
      .execute({ roomId, roundId, token: alice, value: '7' })
      .catch(() => null);

    const after = await getRoomSnapshot.execute({ roomId, token: null });

    expect(after.revision).toBe(before.revision);
  });

  it('refuses somebody who has not joined the Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId } = await aRoundThreeApart(rooms, clock);

    const recorded = new SetFinalEstimate(rooms).execute({
      roomId,
      roundId,
      token: null,
      value: '5',
    });

    await expect(recorded).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses a token issued for another Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const here = await aRoundThreeApart(rooms, clock);
    const elsewhere = await aRoundThreeApart(rooms, clock);

    const recorded = new SetFinalEstimate(rooms).execute({
      roomId: here.roomId,
      roundId: here.roundId,
      token: elsewhere.alice,
      value: '5',
    });

    await expect(recorded).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses a Round the Room does not hold', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoundThreeApart(rooms, clock);

    const recorded = new SetFinalEstimate(rooms).execute({
      roomId,
      roundId: 'nTq7bXz1Rk9P',
      token: alice,
      value: '5',
    });

    await expect(recorded).rejects.toThrow(RoundNotFoundError);
  });

  it('refuses a Round revealed in another Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const here = await aRoundThreeApart(rooms, clock);
    const elsewhere = await aRoundThreeApart(rooms, clock);

    const recorded = new SetFinalEstimate(rooms).execute({
      roomId: here.roomId,
      roundId: elsewhere.roundId,
      token: here.alice,
      value: '5',
    });

    await expect(recorded).rejects.toThrow(RoundNotFoundError);
  });

  it('refuses an identifier no Room was ever issued', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roundId, alice } = await aRoundThreeApart(rooms, clock);

    const recorded = new SetFinalEstimate(rooms).execute({
      roomId: 'nTq7bXz1Rk9P',
      roundId,
      token: alice,
      value: '5',
    });

    await expect(recorded).rejects.toThrow(RoomNotFoundError);
  });
});
