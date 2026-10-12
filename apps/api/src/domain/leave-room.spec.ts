import { describe, expect, it } from 'vitest';
import { InMemoryRoomRepository } from '../testing/in-memory-room-repository.js';
import { ManualClock } from '../testing/manual-clock.js';
import { theOpenRound, theRevealedRound } from '../testing/snapshot-rounds.js';
import { CastEstimate } from './cast-estimate.js';
import { CreateRoom } from './create-room.js';
import { GetRoomSnapshot } from './get-room-snapshot.js';
import { JoinRoom } from './join-room.js';
import { LeaveRoom } from './leave-room.js';
import { OpenRound } from './open-round.js';
import { RevealRound } from './reveal-round.js';
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

async function aRoundThreeApart(rooms: InMemoryRoomRepository, clock: ManualClock) {
  const { roomId, alice, bob } = await aRoomWithTwoPeopleInIt(rooms, clock);
  const { id: roundId } = await new OpenRound(rooms, clock).execute({
    roomId,
    token: alice,
    title: 'The checkout flow',
  });
  const castEstimate = new CastEstimate(rooms, clock);
  await castEstimate.execute({ roomId, roundId, token: alice, value: '3' });
  await castEstimate.execute({ roomId, roundId, token: bob, value: '8' });

  return { roomId, roundId, alice, bob };
}

describe('Leaving a Room', () => {
  it('takes the Participant out of the Room everybody else is reading', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomWithTwoPeopleInIt(rooms, clock);

    await new LeaveRoom(rooms, clock).execute({ roomId, token: alice });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.participants.map(({ nickname }) => nickname)).toEqual(['Bob']);
  });

  it('spends the token, so the next visit to the link asks for a nickname again', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomWithTwoPeopleInIt(rooms, clock);

    await new LeaveRoom(rooms, clock).execute({ roomId, token: alice });

    const reading = new GetRoomSnapshot(rooms, clock).execute({ roomId, token: alice });

    await expect(reading).rejects.toThrow(UnknownParticipantError);
  });

  it('withdraws their Estimate from the open Round, the tally having nobody left to count it for', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice, bob } = await aRoundThreeApart(rooms, clock);

    await new LeaveRoom(rooms, clock).execute({ roomId, token: alice });
    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: bob });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(theRevealedRound(snapshot).estimates.map(({ value }) => value)).toEqual(['8']);
  });

  it('leaves the Estimates of whoever is still at the table alone', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice, bob } = await aRoundThreeApart(rooms, clock);

    await new LeaveRoom(rooms, clock).execute({ roomId, token: alice });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: bob });

    expect(theOpenRound(snapshot).selfEstimate).toBe('8');
    expect(snapshot.participants.map(({ hasVoted }) => hasVoted)).toEqual([true]);
  });

  it('keeps the Estimates they gave to Rounds the team already revealed', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);
    await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });

    await new LeaveRoom(rooms, clock).execute({ roomId, token: alice });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(
      theRevealedRound(snapshot)
        .estimates.map(({ value }) => value)
        .sort(),
    ).toEqual(['3', '8']);
  });

  it('keeps the Estimate of a revealed Round while withdrawing the one on the table', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId: discussed, alice, bob } = await aRoundThreeApart(rooms, clock);
    await new RevealRound(rooms, clock).execute({ roomId, roundId: discussed, token: alice });
    const { id: again } = await new OpenRound(rooms, clock).execute({
      roomId,
      token: alice,
      title: 'The checkout flow',
    });
    await new CastEstimate(rooms, clock).execute({
      roomId,
      roundId: again,
      token: alice,
      value: '5',
    });

    await new LeaveRoom(rooms, clock).execute({ roomId, token: alice });
    await new RevealRound(rooms, clock).execute({ roomId, roundId: again, token: bob });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(theRevealedRound(snapshot).estimates).toEqual([]);
    expect(snapshot.history).toEqual([
      { id: discussed, title: 'The checkout flow', finalEstimate: null },
    ]);
  });

  it('leaves a Room where no Round is open at all', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice, bob } = await aRoomWithTwoPeopleInIt(rooms, clock);

    await new LeaveRoom(rooms, clock).execute({ roomId, token: alice });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: bob });

    expect(snapshot.round).toBeNull();
    expect(snapshot.participants.map(({ nickname }) => nickname)).toEqual(['Bob']);
  });

  it('hands the browser to the next person, who is somebody else entirely', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { id: roomId } = await new CreateRoom(rooms).execute();
    const joinRoom = new JoinRoom(rooms, clock);
    const { token: alice } = await joinRoom.execute({ roomId, nickname: 'Alice' });
    await new LeaveRoom(rooms, clock).execute({ roomId, token: alice });

    clock.advance(ONE_SECOND);
    const { token: bob } = await joinRoom.execute({ roomId, nickname: 'Bob' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: bob });

    expect(snapshot.participants.map(({ nickname }) => nickname)).toEqual(['Bob']);
    expect(snapshot.selfId).not.toBeNull();
  });

  it('advances the Room revision, because nothing writes without bumping it', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomWithTwoPeopleInIt(rooms, clock);
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    const before = await getRoomSnapshot.execute({ roomId, token: null });

    await new LeaveRoom(rooms, clock).execute({ roomId, token: alice });

    const after = await getRoomSnapshot.execute({ roomId, token: null });

    expect(after.revision).toBeGreaterThan(before.revision);
  });

  it('refuses somebody who has not joined the Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId } = await aRoomWithTwoPeopleInIt(rooms, clock);

    const leaving = new LeaveRoom(rooms, clock).execute({ roomId, token: null });

    await expect(leaving).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses a token issued for another Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId } = await aRoomWithTwoPeopleInIt(rooms, clock);
    const { alice: elsewhere } = await aRoomWithTwoPeopleInIt(rooms, clock);

    const leaving = new LeaveRoom(rooms, clock).execute({ roomId, token: elsewhere });

    await expect(leaving).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses an identifier no Room was ever issued', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { alice } = await aRoomWithTwoPeopleInIt(rooms, clock);

    const leaving = new LeaveRoom(rooms, clock).execute({ roomId: 'nTq7bXz1Rk9P', token: alice });

    await expect(leaving).rejects.toThrow(RoomNotFoundError);
  });
});
