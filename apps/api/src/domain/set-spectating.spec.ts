import { describe, expect, it } from 'vitest';
import { InMemoryRoomRepository } from '../testing/in-memory-room-repository.js';
import { ManualClock } from '../testing/manual-clock.js';
import { theOpenRound, theRevealedRound } from '../testing/snapshot-rounds.js';
import { CastEstimate } from './cast-estimate.js';
import { CreateRoom } from './create-room.js';
import { GetRoomSnapshot } from './get-room-snapshot.js';
import { JoinRoom } from './join-room.js';
import { OpenRound } from './open-round.js';
import { RevealRound } from './reveal-round.js';
import {
  EstimateAlreadyCastError,
  RoomNotFoundError,
  UnknownParticipantError,
} from './room-errors.js';
import { SetFinalEstimate } from './set-final-estimate.js';
import { SetSpectating } from './set-spectating.js';

const A_MONDAY_MORNING = new Date('2026-10-12T09:00:00.000Z');
const ONE_SECOND = 1_000;

async function aRoomWithTwoPeopleInIt(rooms: InMemoryRoomRepository, clock: ManualClock) {
  const { id: roomId } = await new CreateRoom(rooms).execute();
  const joinRoom = new JoinRoom(rooms, clock);
  const alice = await joinRoom.execute({ roomId, nickname: 'Alice' });
  clock.advance(ONE_SECOND);
  const bob = await joinRoom.execute({ roomId, nickname: 'Bob' });

  return { roomId, alice: alice.token, bob: bob.token };
}

async function anOpenRound(rooms: InMemoryRoomRepository, clock: ManualClock) {
  const { roomId, alice, bob } = await aRoomWithTwoPeopleInIt(rooms, clock);
  const { id: roundId } = await new OpenRound(rooms, clock).execute({
    roomId,
    token: alice,
    title: 'The checkout flow',
  });

  return { roomId, roundId, alice, bob };
}

function spectatingOf(
  participants: { id: string; spectating: boolean }[],
  selfId: string | null,
): boolean | undefined {
  return participants.find(({ id }) => id === selfId)?.spectating;
}

describe('Spectating a Room', () => {
  it('keeps the Spectator present, since they brought the work and answer the questions', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomWithTwoPeopleInIt(rooms, clock);

    await new SetSpectating(rooms).execute({ roomId, token: alice, spectating: true });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: alice });

    expect(snapshot.participants.map(({ nickname }) => nickname)).toEqual(['Alice', 'Bob']);
    expect(spectatingOf(snapshot.participants, snapshot.selfId)).toBe(true);
  });

  it('marks nobody else as spectating, the switch being about whoever asked', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice, bob } = await aRoomWithTwoPeopleInIt(rooms, clock);

    await new SetSpectating(rooms).execute({ roomId, token: alice, spectating: true });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: bob });

    expect(spectatingOf(snapshot.participants, snapshot.selfId)).toBe(false);
  });

  it('never shows a Spectator as having voted, which is what keeps them out of the tally', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await anOpenRound(rooms, clock);
    await new SetSpectating(rooms).execute({ roomId, token: alice, spectating: true });

    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: bob, value: '8' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: alice });

    expect(snapshot.participants).toEqual([
      { id: snapshot.selfId, nickname: 'Alice', spectating: true, hasVoted: false },
      expect.objectContaining({ nickname: 'Bob', spectating: false, hasVoted: true }),
    ]);
  });

  it('switches back to voting, a role not being fixed by what somebody clicked on the way in', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await anOpenRound(rooms, clock);
    const setSpectating = new SetSpectating(rooms);
    await setSpectating.execute({ roomId, token: alice, spectating: true });

    await setSpectating.execute({ roomId, token: alice, spectating: false });
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: alice, value: '3' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: alice });

    expect(spectatingOf(snapshot.participants, snapshot.selfId)).toBe(false);
    expect(theOpenRound(snapshot).selfEstimate).toBe('3');
  });

  it('stays spectating when told to spectate again', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomWithTwoPeopleInIt(rooms, clock);
    const setSpectating = new SetSpectating(rooms);
    await setSpectating.execute({ roomId, token: alice, spectating: true });

    await setSpectating.execute({ roomId, token: alice, spectating: true });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: alice });

    expect(spectatingOf(snapshot.participants, snapshot.selfId)).toBe(true);
  });

  it('refuses to start spectating on an Estimate already counted in the open Round', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await anOpenRound(rooms, clock);
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: alice, value: '3' });

    const watching = new SetSpectating(rooms).execute({ roomId, token: alice, spectating: true });

    await expect(watching).rejects.toThrow(EstimateAlreadyCastError);
  });

  it('leaves that Estimate exactly where it was when the switch is refused', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await anOpenRound(rooms, clock);
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: alice, value: '3' });

    await new SetSpectating(rooms)
      .execute({ roomId, token: alice, spectating: true })
      .catch(() => null);

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: alice });

    expect(theOpenRound(snapshot).selfEstimate).toBe('3');
    expect(spectatingOf(snapshot.participants, snapshot.selfId)).toBe(false);
  });

  it('lets them spectate once the Round they voted in is revealed, the record standing', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await anOpenRound(rooms, clock);
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: alice, value: '3' });
    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });

    await new SetSpectating(rooms).execute({ roomId, token: alice, spectating: true });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: alice });

    expect(spectatingOf(snapshot.participants, snapshot.selfId)).toBe(true);
    expect(theRevealedRound(snapshot).estimates.map(({ value }) => value)).toEqual(['3']);
  });

  it('spectates a Room where no Round is open at all', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomWithTwoPeopleInIt(rooms, clock);

    await new SetSpectating(rooms).execute({ roomId, token: alice, spectating: true });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: alice });

    expect(snapshot.round).toBeNull();
    expect(spectatingOf(snapshot.participants, snapshot.selfId)).toBe(true);
  });

  it('leaves opening, revealing and settling a Round to a Spectator, who usually brought the work', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice, bob } = await aRoomWithTwoPeopleInIt(rooms, clock);
    await new SetSpectating(rooms).execute({ roomId, token: alice, spectating: true });

    const { id: roundId } = await new OpenRound(rooms, clock).execute({
      roomId,
      token: alice,
      title: 'The checkout flow',
    });
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: bob, value: '8' });
    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });
    await new SetFinalEstimate(rooms).execute({ roomId, roundId, token: alice, value: '8' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(theRevealedRound(snapshot).finalEstimate).toBe('8');
  });

  it('advances the Room revision, because nothing writes without bumping it', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomWithTwoPeopleInIt(rooms, clock);
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    const before = await getRoomSnapshot.execute({ roomId, token: null });

    await new SetSpectating(rooms).execute({ roomId, token: alice, spectating: true });

    const after = await getRoomSnapshot.execute({ roomId, token: null });

    expect(after.revision).toBeGreaterThan(before.revision);
  });

  it('refuses somebody who has not joined the Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId } = await aRoomWithTwoPeopleInIt(rooms, clock);

    const watching = new SetSpectating(rooms).execute({ roomId, token: null, spectating: true });

    await expect(watching).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses a token issued for another Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId } = await aRoomWithTwoPeopleInIt(rooms, clock);
    const { alice: elsewhere } = await aRoomWithTwoPeopleInIt(rooms, clock);

    const watching = new SetSpectating(rooms).execute({
      roomId,
      token: elsewhere,
      spectating: true,
    });

    await expect(watching).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses an identifier no Room was ever issued', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { alice } = await aRoomWithTwoPeopleInIt(rooms, clock);

    const watching = new SetSpectating(rooms).execute({
      roomId: 'nTq7bXz1Rk9P',
      token: alice,
      spectating: true,
    });

    await expect(watching).rejects.toThrow(RoomNotFoundError);
  });
});
