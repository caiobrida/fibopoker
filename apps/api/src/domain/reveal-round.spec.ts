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
  RoomNotFoundError,
  RoundAlreadyRevealedError,
  RoundNotFoundError,
  UnknownParticipantError,
} from './room-errors.js';

const A_MONDAY_MORNING = new Date('2026-10-12T09:00:00.000Z');
const LONGER_THAN_THE_ACTIVITY_WINDOW = 180_000;
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

describe('Revealing a Round', () => {
  it('makes every Estimate in the Round visible to everybody', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    const castEstimate = new CastEstimate(rooms, clock);
    await castEstimate.execute({ roomId, roundId, token: alice, value: '3' });
    await castEstimate.execute({ roomId, roundId, token: bob, value: '8' });

    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.round?.state).toBe('revealed');
    expect(theRevealedRound(snapshot).estimates).toEqual([
      expect.objectContaining({ value: expect.any(String) }),
      expect.objectContaining({ value: expect.any(String) }),
    ]);
    expect(JSON.stringify(snapshot)).toContain('3');
    expect(JSON.stringify(snapshot)).toContain('8');
  });

  it('keeps every Estimate attached to whoever cast it', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    const castEstimate = new CastEstimate(rooms, clock);
    await castEstimate.execute({ roomId, roundId, token: alice, value: '3' });
    await castEstimate.execute({ roomId, roundId, token: bob, value: '8' });
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    const bobsId = (await getRoomSnapshot.execute({ roomId, token: bob })).selfId;

    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });

    const snapshot = await getRoomSnapshot.execute({ roomId, token: null });

    expect(theRevealedRound(snapshot).estimates).toContainEqual({
      participantId: bobsId,
      value: '8',
    });
  });

  it('lets anybody in the Room do it, because nobody has a special right to', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, bob } = await aRoomBeingEstimated(rooms, clock);

    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: bob });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.round?.state).toBe('revealed');
  });

  it('reveals before everybody has voted, so one absent teammate cannot block the team', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: bob, value: '8' });

    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(theRevealedRound(snapshot).estimates).toEqual([expect.objectContaining({ value: '8' })]);
    expect(snapshot.participants).toEqual([
      expect.objectContaining({ nickname: 'Alice', hasVoted: false }),
      expect.objectContaining({ nickname: 'Bob', hasVoted: true }),
    ]);
  });

  it('never happens on its own, not even once everybody has voted', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    const castEstimate = new CastEstimate(rooms, clock);

    await castEstimate.execute({ roomId, roundId, token: alice, value: '3' });
    await castEstimate.execute({ roomId, roundId, token: bob, value: '3' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: alice });

    expect(snapshot.round?.state).toBe('open');
  });

  it('shows the same Estimates to somebody holding no token at all', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    const castEstimate = new CastEstimate(rooms, clock);
    await castEstimate.execute({ roomId, roundId, token: alice, value: '3' });
    await castEstimate.execute({ roomId, roundId, token: bob, value: '8' });
    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);

    const toAlice = await getRoomSnapshot.execute({ roomId, token: alice });
    const toAnybody = await getRoomSnapshot.execute({ roomId, token: null });

    expect(theRevealedRound(toAnybody).estimates).toEqual(theRevealedRound(toAlice).estimates);
  });

  it('keeps the Estimate of somebody who has dropped out of the activity window', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: bob, value: '8' });
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);

    clock.advance(LONGER_THAN_THE_ACTIVITY_WINDOW);
    await getRoomSnapshot.execute({ roomId, token: alice });
    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });

    const snapshot = await getRoomSnapshot.execute({ roomId, token: alice });

    expect(snapshot.participants.map(({ nickname }) => nickname)).toEqual(['Alice']);
    expect(theRevealedRound(snapshot).estimates).toEqual([expect.objectContaining({ value: '8' })]);
  });

  it('orders the Estimates without saying who voted first', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    const castEstimate = new CastEstimate(rooms, clock);
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    const open = await getRoomSnapshot.execute({ roomId, token: null });
    const whoVotesFirst = [...open.participants].sort((one, other) =>
      other.id.localeCompare(one.id),
    );

    for (const { nickname } of whoVotesFirst) {
      await castEstimate.execute({
        roomId,
        roundId,
        token: nickname === 'Alice' ? alice : bob,
        value: '5',
      });
      clock.advance(ONE_SECOND);
    }

    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });

    const snapshot = await getRoomSnapshot.execute({ roomId, token: null });

    expect(theRevealedRound(snapshot).estimates).not.toEqual(
      whoVotesFirst.map(({ id }) => ({ participantId: id, value: '5' })),
    );
  });

  it('answers a revealed Room with an unchanged snapshot, poll after poll', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    const castEstimate = new CastEstimate(rooms, clock);
    await castEstimate.execute({ roomId, roundId, token: alice, value: '3' });
    await castEstimate.execute({ roomId, roundId, token: bob, value: '8' });
    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);

    const first = await getRoomSnapshot.execute({ roomId, token: alice });
    const second = await getRoomSnapshot.execute({ roomId, token: alice });

    expect(second).toEqual(first);
  });

  it('advances the Room revision, because nothing writes without bumping it', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoomBeingEstimated(rooms, clock);
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    const before = await getRoomSnapshot.execute({ roomId, token: null });

    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });

    const after = await getRoomSnapshot.execute({ roomId, token: null });

    expect(after.revision).toBeGreaterThan(before.revision);
  });

  it('does not stand in for being there, because reading the Room is what says that', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoomBeingEstimated(rooms, clock);

    clock.advance(LONGER_THAN_THE_ACTIVITY_WINDOW);
    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.participants).toEqual([]);
    expect(snapshot.round?.state).toBe('revealed');
  });

  it('refuses a Round it has already revealed', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    const revealRound = new RevealRound(rooms, clock);
    await revealRound.execute({ roomId, roundId, token: alice });

    const again = revealRound.execute({ roomId, roundId, token: bob });

    await expect(again).rejects.toThrow(RoundAlreadyRevealedError);
  });

  it('refuses a Round the Room does not hold', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomBeingEstimated(rooms, clock);

    const reveal = new RevealRound(rooms, clock).execute({
      roomId,
      roundId: 'nTq7bXz1Rk9P',
      token: alice,
    });

    await expect(reveal).rejects.toThrow(RoundNotFoundError);
  });

  it('refuses a Round opened in another Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const here = await aRoomBeingEstimated(rooms, clock);
    const elsewhere = await aRoomBeingEstimated(rooms, clock);

    const reveal = new RevealRound(rooms, clock).execute({
      roomId: here.roomId,
      roundId: elsewhere.roundId,
      token: here.alice,
    });

    await expect(reveal).rejects.toThrow(RoundNotFoundError);
  });

  it('refuses somebody who has not joined the Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId } = await aRoomBeingEstimated(rooms, clock);

    const reveal = new RevealRound(rooms, clock).execute({ roomId, roundId, token: null });

    await expect(reveal).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses a token issued for another Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const here = await aRoomBeingEstimated(rooms, clock);
    const elsewhere = await aRoomBeingEstimated(rooms, clock);

    const reveal = new RevealRound(rooms, clock).execute({
      roomId: here.roomId,
      roundId: here.roundId,
      token: elsewhere.alice,
    });

    await expect(reveal).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses an identifier no Room was ever issued', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roundId, alice } = await aRoomBeingEstimated(rooms, clock);

    const reveal = new RevealRound(rooms, clock).execute({
      roomId: 'nTq7bXz1Rk9P',
      roundId,
      token: alice,
    });

    await expect(reveal).rejects.toThrow(RoomNotFoundError);
  });
});

describe('A revealed Round', () => {
  it('refuses an Estimate from somebody who had not voted', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: bob, value: '8' });
    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });

    const late = new CastEstimate(rooms, clock).execute({
      roomId,
      roundId,
      token: alice,
      value: '3',
    });

    await expect(late).rejects.toThrow(RoundAlreadyRevealedError);
  });

  it('refuses to change an Estimate, and keeps the one it holds', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    const castEstimate = new CastEstimate(rooms, clock);
    await castEstimate.execute({ roomId, roundId, token: bob, value: '8' });
    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });

    const changed = castEstimate.execute({ roomId, roundId, token: bob, value: '3' });

    await expect(changed).rejects.toThrow(RoundAlreadyRevealedError);

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: bob });

    expect(theRevealedRound(snapshot).estimates).toEqual([expect.objectContaining({ value: '8' })]);
  });

  it('leaves the revision where it was when an Estimate is refused', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: bob, value: '8' });
    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    const before = await getRoomSnapshot.execute({ roomId, token: null });

    await new CastEstimate(rooms, clock)
      .execute({ roomId, roundId, token: bob, value: '3' })
      .catch(() => null);

    const after = await getRoomSnapshot.execute({ roomId, token: null });

    expect(after.revision).toBe(before.revision);
  });

  it('refuses the second of two Reveals that read the Room before either wrote', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    const revealRound = new RevealRound(rooms, clock);

    const raced = await Promise.allSettled([
      revealRound.execute({ roomId, roundId, token: alice }),
      revealRound.execute({ roomId, roundId, token: bob }),
    ]);

    expect(raced.map(({ status }) => status)).toEqual(['fulfilled', 'rejected']);
    expect((raced[1] as PromiseRejectedResult).reason).toBeInstanceOf(RoundAlreadyRevealedError);
  });

  it('refuses an Estimate cast by somebody who read the Room before the Reveal', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoomBeingEstimated(rooms, clock);
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: alice, value: '3' });

    const raced = await Promise.allSettled([
      new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice }),
      new CastEstimate(rooms, clock).execute({ roomId, roundId, token: bob, value: '8' }),
    ]);

    expect(raced.map(({ status }) => status)).toEqual(['fulfilled', 'rejected']);
    expect((raced[1] as PromiseRejectedResult).reason).toBeInstanceOf(RoundAlreadyRevealedError);

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(theRevealedRound(snapshot).estimates).toEqual([expect.objectContaining({ value: '3' })]);
  });

  it('steps aside once the next Round is opened', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoomBeingEstimated(rooms, clock);
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: alice, value: '3' });
    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });

    clock.advance(ONE_SECOND);
    const next = await new OpenRound(rooms, clock).execute({
      roomId,
      token: alice,
      title: 'The search page',
    });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: alice });

    expect(snapshot.round).toEqual({
      id: next.id,
      title: 'The search page',
      state: 'open',
      selfEstimate: null,
    });
  });
});
