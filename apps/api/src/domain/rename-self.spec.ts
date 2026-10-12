import { describe, expect, it } from 'vitest';
import { InMemoryRoomRepository } from '../testing/in-memory-room-repository.js';
import { ManualClock } from '../testing/manual-clock.js';
import { theOpenRound } from '../testing/snapshot-rounds.js';
import { CastEstimate } from './cast-estimate.js';
import { CreateRoom } from './create-room.js';
import { GetRoomSnapshot } from './get-room-snapshot.js';
import { JoinRoom } from './join-room.js';
import { OpenRound } from './open-round.js';
import { RenameSelf } from './rename-self.js';
import { RoomNotFoundError, UnknownParticipantError } from './room-errors.js';

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

describe('Renaming oneself', () => {
  it('puts the new nickname in front of everybody reading the Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomWithTwoPeopleInIt(rooms, clock);

    await new RenameSelf(rooms).execute({ roomId, token: alice, nickname: 'Alice from Design' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.participants.map(({ nickname }) => nickname)).toEqual([
      'Alice from Design',
      'Bob',
    ]);
  });

  it('keeps the same person, so nobody has to be told who they are talking to', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomWithTwoPeopleInIt(rooms, clock);
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    const before = await getRoomSnapshot.execute({ roomId, token: alice });

    await new RenameSelf(rooms).execute({ roomId, token: alice, nickname: 'Zoe' });

    const after = await getRoomSnapshot.execute({ roomId, token: alice });

    expect(after.selfId).toBe(before.selfId);
    expect(after.participants).toHaveLength(2);
  });

  it('keeps their place in the list, which is when they arrived and not what they are called', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomWithTwoPeopleInIt(rooms, clock);

    await new RenameSelf(rooms).execute({ roomId, token: alice, nickname: 'Zoe' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.participants.map(({ nickname }) => nickname)).toEqual(['Zoe', 'Bob']);
  });

  it('costs them nothing in an open Round, the Estimate being the Participant and not the name', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomWithTwoPeopleInIt(rooms, clock);
    const { id: roundId } = await new OpenRound(rooms, clock).execute({
      roomId,
      token: alice,
      title: 'The checkout flow',
    });
    await new CastEstimate(rooms, clock).execute({ roomId, roundId, token: alice, value: '5' });

    await new RenameSelf(rooms).execute({ roomId, token: alice, nickname: 'Alice from Design' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: alice });

    expect(theOpenRound(snapshot).selfEstimate).toBe('5');
    expect(snapshot.participants.filter(({ hasVoted }) => hasVoted)).toHaveLength(1);
  });

  it('renames one Participant and leaves everybody else answering to what they chose', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice, bob } = await aRoomWithTwoPeopleInIt(rooms, clock);

    await new RenameSelf(rooms).execute({ roomId, token: alice, nickname: 'Zoe' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: bob });

    expect(snapshot.participants.find(({ id }) => id === snapshot.selfId)?.nickname).toBe('Bob');
  });

  it('takes a nickname somebody else already answers to, the same way joining does', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomWithTwoPeopleInIt(rooms, clock);

    await new RenameSelf(rooms).execute({ roomId, token: alice, nickname: 'Bob' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.participants.map(({ nickname }) => nickname)).toEqual(['Bob', 'Bob']);
  });

  it('advances the Room revision, because nothing writes without bumping it', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomWithTwoPeopleInIt(rooms, clock);
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    const before = await getRoomSnapshot.execute({ roomId, token: null });

    await new RenameSelf(rooms).execute({ roomId, token: alice, nickname: 'Zoe' });

    const after = await getRoomSnapshot.execute({ roomId, token: null });

    expect(after.revision).toBeGreaterThan(before.revision);
  });

  it('refuses somebody who has not joined the Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId } = await aRoomWithTwoPeopleInIt(rooms, clock);

    const renaming = new RenameSelf(rooms).execute({ roomId, token: null, nickname: 'Zoe' });

    await expect(renaming).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses a token issued for another Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId } = await aRoomWithTwoPeopleInIt(rooms, clock);
    const { alice: elsewhere } = await aRoomWithTwoPeopleInIt(rooms, clock);

    const renaming = new RenameSelf(rooms).execute({ roomId, token: elsewhere, nickname: 'Zoe' });

    await expect(renaming).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses an identifier no Room was ever issued', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { alice } = await aRoomWithTwoPeopleInIt(rooms, clock);

    const renaming = new RenameSelf(rooms).execute({
      roomId: 'nTq7bXz1Rk9P',
      token: alice,
      nickname: 'Zoe',
    });

    await expect(renaming).rejects.toThrow(RoomNotFoundError);
  });
});
