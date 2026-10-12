import { describe, expect, it } from 'vitest';
import { InMemoryRoomRepository } from '../testing/in-memory-room-repository.js';
import { ManualClock } from '../testing/manual-clock.js';
import { CastEstimate } from './cast-estimate.js';
import { CreateRoom } from './create-room.js';
import { GetRoomSnapshot } from './get-room-snapshot.js';
import { JoinRoom } from './join-room.js';
import { OpenRound } from './open-round.js';
import {
  EstimateOutsideTheDeckError,
  RoomNotFoundError,
  RoundNotFoundError,
  UnknownParticipantError,
} from './room-errors.js';

const A_MONDAY_MORNING = new Date('2026-10-12T09:00:00.000Z');
const LONGER_THAN_THE_ACTIVITY_WINDOW = 180_000;
const A_BREAK = '☕';

async function aRoomBeingEstimated(rooms: InMemoryRoomRepository, clock: ManualClock) {
  const { id: roomId } = await new CreateRoom(rooms).execute();
  const joinRoom = new JoinRoom(rooms, clock);
  const alice = await joinRoom.execute({ roomId, nickname: 'Alice' });
  const bob = await joinRoom.execute({ roomId, nickname: 'Bob' });
  const { id: roundId } = await new OpenRound(rooms, clock).execute({
    roomId,
    token: alice.token,
    title: 'The checkout flow',
  });

  return { roomId, roundId, alice: alice.token, bob: bob.token };
}

describe('Casting an Estimate', () => {
  it('lets everybody in the Room see that somebody has voted', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, bob } = await aRoomBeingEstimated(rooms, clock);

    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: bob, value: '5' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.participants).toEqual([
      expect.objectContaining({ nickname: 'Alice', hasVoted: false }),
      expect.objectContaining({ nickname: 'Bob', hasVoted: true }),
    ]);
  });

  it('tells a Participant what they themselves picked', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, bob } = await aRoomBeingEstimated(rooms, clock);

    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: bob, value: '5' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: bob });

    expect(snapshot.round?.selfEstimate).toBe('5');
  });

  it('never tells anybody else what was picked', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    const castEstimate = new CastEstimate(rooms, clock);
    await castEstimate.execute({ roomId, roundId, token: bob, value: A_BREAK });
    await castEstimate.execute({ roomId, roundId, token: alice, value: '3' });

    const alicesView = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: alice });

    expect(alicesView.round?.selfEstimate).toBe('3');
    expect(JSON.stringify(alicesView)).not.toContain(A_BREAK);
  });

  it('replaces a previous choice while the Round is open', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, bob } = await aRoomBeingEstimated(rooms, clock);
    const castEstimate = new CastEstimate(rooms, clock);

    await castEstimate.execute({ roomId, roundId, token: bob, value: '5' });
    await castEstimate.execute({ roomId, roundId, token: bob, value: '8' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: bob });

    expect(snapshot.round?.selfEstimate).toBe('8');
    expect(snapshot.participants.filter(({ hasVoted }) => hasVoted)).toHaveLength(1);
  });

  it('refuses a value the Deck does not hold', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, bob } = await aRoomBeingEstimated(rooms, clock);

    const cast = new CastEstimate(rooms, clock).execute({
      roomId,
      roundId,
      token: bob,
      value: '7',
    });

    await expect(cast).rejects.toThrow(EstimateOutsideTheDeckError);
  });

  it('leaves a Participant unvoted when their Estimate is refused', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, bob } = await aRoomBeingEstimated(rooms, clock);

    await new CastEstimate(rooms, clock)
      .execute({ roomId, roundId, token: bob, value: '7' })
      .catch(() => null);

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: bob });

    expect(snapshot.round?.selfEstimate).toBeNull();
    expect(snapshot.participants.some(({ hasVoted }) => hasVoted)).toBe(false);
  });

  it('refuses a Round the Room does not hold', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, bob } = await aRoomBeingEstimated(rooms, clock);

    const cast = new CastEstimate(rooms, clock).execute({
      roomId,
      roundId: 'nTq7bXz1Rk9P',
      token: bob,
      value: '5',
    });

    await expect(cast).rejects.toThrow(RoundNotFoundError);
  });

  it('refuses a Round opened in another Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const here = await aRoomBeingEstimated(rooms, clock);
    const elsewhere = await aRoomBeingEstimated(rooms, clock);

    const cast = new CastEstimate(rooms, clock).execute({
      roomId: here.roomId,
      roundId: elsewhere.roundId,
      token: here.bob,
      value: '5',
    });

    await expect(cast).rejects.toThrow(RoundNotFoundError);
  });

  it('advances the Room revision, because nothing writes without bumping it', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, bob } = await aRoomBeingEstimated(rooms, clock);
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    const before = await getRoomSnapshot.execute({ roomId, token: null });

    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: bob, value: '5' });

    const after = await getRoomSnapshot.execute({ roomId, token: null });

    expect(after.revision).toBeGreaterThan(before.revision);
  });

  it('advances the revision again when a choice is replaced', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, bob } = await aRoomBeingEstimated(rooms, clock);
    const castEstimate = new CastEstimate(rooms, clock);
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    await castEstimate.execute({ roomId, roundId, token: bob, value: '5' });
    const afterFirst = await getRoomSnapshot.execute({ roomId, token: null });

    await castEstimate.execute({ roomId, roundId, token: bob, value: '8' });

    const afterSecond = await getRoomSnapshot.execute({ roomId, token: null });

    expect(afterSecond.revision).toBeGreaterThan(afterFirst.revision);
  });

  it('refuses somebody who has not joined the Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId } = await aRoomBeingEstimated(rooms, clock);

    const cast = new CastEstimate(rooms, clock).execute({
      roomId,
      roundId,
      token: null,
      value: '5',
    });

    await expect(cast).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses a token issued for another Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const here = await aRoomBeingEstimated(rooms, clock);
    const elsewhere = await aRoomBeingEstimated(rooms, clock);

    const cast = new CastEstimate(rooms, clock).execute({
      roomId: here.roomId,
      roundId: here.roundId,
      token: elsewhere.bob,
      value: '5',
    });

    await expect(cast).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses an identifier no Room was ever issued', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roundId, bob } = await aRoomBeingEstimated(rooms, clock);

    const cast = new CastEstimate(rooms, clock).execute({
      roomId: 'nTq7bXz1Rk9P',
      roundId,
      token: bob,
      value: '5',
    });

    await expect(cast).rejects.toThrow(RoomNotFoundError);
  });

  it('keeps the voter present, because voting is being there', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, bob } = await aRoomBeingEstimated(rooms, clock);

    clock.advance(LONGER_THAN_THE_ACTIVITY_WINDOW);
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: bob, value: '5' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.participants.map(({ nickname }) => nickname)).toEqual(['Bob']);
  });
});

describe('Who the tally counts', () => {
  it('stops counting a Participant nobody has seen within the activity window', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: bob, value: '5' });
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);

    clock.advance(LONGER_THAN_THE_ACTIVITY_WINDOW);
    await getRoomSnapshot.execute({ roomId, token: alice });

    const snapshot = await getRoomSnapshot.execute({ roomId, token: null });

    expect(snapshot.participants.map(({ nickname }) => nickname)).toEqual(['Alice']);
  });

  it('keeps the Estimate of somebody who dropped off, and shows it again when they return', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, bob } = await aRoomBeingEstimated(rooms, clock);
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: bob, value: '5' });
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);

    clock.advance(LONGER_THAN_THE_ACTIVITY_WINDOW);

    const whileAway = await getRoomSnapshot.execute({ roomId, token: null });
    const onReturning = await getRoomSnapshot.execute({ roomId, token: bob });

    expect(whileAway.participants).toEqual([]);
    expect(onReturning.participants).toEqual([
      expect.objectContaining({ nickname: 'Bob', hasVoted: true }),
    ]);
    expect(onReturning.round?.selfEstimate).toBe('5');
  });

  it('answers an unchanged Room with an unchanged snapshot, poll after poll', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, bob } = await aRoomBeingEstimated(rooms, clock);
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: bob, value: '5' });
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);

    const first = await getRoomSnapshot.execute({ roomId, token: bob });
    const second = await getRoomSnapshot.execute({ roomId, token: bob });

    expect(second).toEqual(first);
  });
});
