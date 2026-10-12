import { describe, expect, it } from 'vitest';
import { InMemoryRoomRepository } from '../testing/in-memory-room-repository.js';
import { ManualClock } from '../testing/manual-clock.js';
import { theOpenRound } from '../testing/snapshot-rounds.js';
import { CastEstimate } from './cast-estimate.js';
import { CreateRoom } from './create-room.js';
import { GetRoomSnapshot } from './get-room-snapshot.js';
import { JoinRoom } from './join-room.js';
import { OpenRound } from './open-round.js';
import { ReVote } from './re-vote.js';
import { RevealRound } from './reveal-round.js';
import {
  RoomNotFoundError,
  RoundAlreadyOpenError,
  RoundAlreadyRevealedError,
  RoundNotFoundError,
  RoundStillOpenError,
  UnknownParticipantError,
} from './room-errors.js';
import { SetFinalEstimate } from './set-final-estimate.js';

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

async function aRoundThreeApart(
  rooms: InMemoryRoomRepository,
  clock: ManualClock,
  title: string | null = 'The checkout flow',
) {
  const { roomId, alice, bob } = await aRoomWithTwoPeopleInIt(rooms, clock);
  const { id: roundId } = await new OpenRound(rooms, clock).execute({
    roomId,
    token: alice,
    title,
  });
  const castEstimate = new CastEstimate(rooms, clock);
  await castEstimate.execute({ roomId, roundId, token: alice, value: '3' });
  await castEstimate.execute({ roomId, roundId, token: bob, value: '8' });
  await new RevealRound(rooms, clock).execute({ roomId, roundId, token: alice });
  clock.advance(ONE_SECOND);

  return { roomId, roundId, alice, bob };
}

describe('Re-voting a revealed Round', () => {
  it('opens a fresh Round carrying the title of the one the team just discussed', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);

    await new ReVote(rooms, clock).execute({ roomId, roundId, token: alice });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.round?.title).toBe('The checkout flow');
    expect(snapshot.round?.state).toBe('open');
  });

  it('answers with the identifier of the Round it opened, which is never the one re-voted', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);

    const again = await new ReVote(rooms, clock).execute({ roomId, roundId, token: alice });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(again.id).not.toBe(roundId);
    expect(snapshot.round?.id).toBe(again.id);
  });

  it('re-votes a Round nobody ever titled, for an unplanned task estimated twice', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock, null);

    await new ReVote(rooms, clock).execute({ roomId, roundId, token: alice });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.round).not.toBeNull();
    expect(snapshot.round?.title).toBeNull();
  });

  it('starts everybody over, because the Estimates do not follow the title across', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);

    await new ReVote(rooms, clock).execute({ roomId, roundId, token: alice });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: alice });

    expect(snapshot.participants.map(({ hasVoted }) => hasVoted)).toEqual([false, false]);
    expect(theOpenRound(snapshot).selfEstimate).toBeNull();
  });

  it('leaves the Round it re-voted revealed, so its Estimates are still refused', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);

    await new ReVote(rooms, clock).execute({ roomId, roundId, token: alice });

    const rewriting = new CastEstimate(rooms, clock).execute({
      roomId,
      roundId,
      token: alice,
      value: '5',
    });

    await expect(rewriting).rejects.toThrow(RoundAlreadyRevealedError);
  });

  it('leaves the Final Estimate the team had already recorded against it', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);
    await new SetFinalEstimate(rooms).execute({ roomId, roundId, token: alice, value: '?' });

    await new ReVote(rooms, clock).execute({ roomId, roundId, token: alice });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.history).toEqual([
      { id: roundId, title: 'The checkout flow', finalEstimate: '?' },
    ]);
  });

  it('advances the Room revision, because nothing writes without bumping it', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    const before = await getRoomSnapshot.execute({ roomId, token: null });

    await new ReVote(rooms, clock).execute({ roomId, roundId, token: alice });

    const after = await getRoomSnapshot.execute({ roomId, token: null });

    expect(after.revision).toBeGreaterThan(before.revision);
  });

  it('brings back a task from earlier in the session, not only the one on the table', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId: checkout, alice } = await aRoundThreeApart(rooms, clock);
    const { id: search } = await new OpenRound(rooms, clock).execute({
      roomId,
      token: alice,
      title: 'The search page',
    });
    await new RevealRound(rooms, clock).execute({ roomId, roundId: search, token: alice });

    await new ReVote(rooms, clock).execute({ roomId, roundId: checkout, token: alice });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.round?.title).toBe('The checkout flow');
  });

  it('refuses a Round the team is still voting on, discussion being what triggers it', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoomWithTwoPeopleInIt(rooms, clock);
    const { id: roundId } = await new OpenRound(rooms, clock).execute({
      roomId,
      token: alice,
      title: 'The checkout flow',
    });

    const again = new ReVote(rooms, clock).execute({ roomId, roundId, token: alice });

    await expect(again).rejects.toThrow(RoundStillOpenError);
  });

  it('refuses while a later Round is open, so the Room never holds two at once', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);
    await new OpenRound(rooms, clock).execute({ roomId, token: alice, title: 'The search page' });

    const again = new ReVote(rooms, clock).execute({ roomId, roundId, token: alice });

    await expect(again).rejects.toThrow(RoundAlreadyOpenError);
  });

  it('leaves the open Round alone when a re-vote is refused', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId, alice } = await aRoundThreeApart(rooms, clock);
    const { id: search } = await new OpenRound(rooms, clock).execute({
      roomId,
      token: alice,
      title: 'The search page',
    });

    await new ReVote(rooms, clock).execute({ roomId, roundId, token: alice }).catch(() => null);

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.round?.id).toBe(search);
    expect(snapshot.round?.title).toBe('The search page');
  });

  it('refuses a Round this Room never held', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, alice } = await aRoundThreeApart(rooms, clock);

    const again = new ReVote(rooms, clock).execute({
      roomId,
      roundId: 'kQ4mVr8sYw2L',
      token: alice,
    });

    await expect(again).rejects.toThrow(RoundNotFoundError);
  });

  it('refuses somebody who has not joined the Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId } = await aRoundThreeApart(rooms, clock);

    const again = new ReVote(rooms, clock).execute({ roomId, roundId, token: null });

    await expect(again).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses a token issued for another Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId } = await aRoundThreeApart(rooms, clock);
    const { alice: elsewhere } = await aRoomWithTwoPeopleInIt(rooms, clock);

    const again = new ReVote(rooms, clock).execute({ roomId, roundId, token: elsewhere });

    await expect(again).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses an identifier no Room was ever issued', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roundId, alice } = await aRoundThreeApart(rooms, clock);

    const again = new ReVote(rooms, clock).execute({
      roomId: 'nTq7bXz1Rk9P',
      roundId,
      token: alice,
    });

    await expect(again).rejects.toThrow(RoomNotFoundError);
  });
});

describe('The record a converging team leaves', () => {
  it('shows the task as many times as it was estimated, with each outcome', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, roundId: apart, alice, bob } = await aRoundThreeApart(rooms, clock);

    const { id: converged } = await new ReVote(rooms, clock).execute({
      roomId,
      roundId: apart,
      token: alice,
    });
    const castEstimate = new CastEstimate(rooms, clock);
    await castEstimate.execute({ roomId, roundId: converged, token: alice, value: '5' });
    await castEstimate.execute({ roomId, roundId: converged, token: bob, value: '5' });
    await new RevealRound(rooms, clock).execute({ roomId, roundId: converged, token: alice });
    await new SetFinalEstimate(rooms).execute({
      roomId,
      roundId: converged,
      token: alice,
      value: '5',
    });
    await new OpenRound(rooms, clock).execute({ roomId, token: alice, title: 'The search page' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.history).toEqual([
      { id: apart, title: 'The checkout flow', finalEstimate: null },
      { id: converged, title: 'The checkout flow', finalEstimate: '5' },
    ]);
  });
});
