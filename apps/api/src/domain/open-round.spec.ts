import { describe, expect, it } from 'vitest';
import { InMemoryRoomRepository } from '../testing/in-memory-room-repository.js';
import { ManualClock } from '../testing/manual-clock.js';
import { theOpenRound } from '../testing/snapshot-rounds.js';
import { CastEstimate } from './cast-estimate.js';
import { CreateRoom } from './create-room.js';
import { GetRoomSnapshot } from './get-room-snapshot.js';
import { JoinRoom } from './join-room.js';
import { OpenRound } from './open-round.js';
import { RevealRound } from './reveal-round.js';
import {
  RoomNotFoundError,
  RoundAlreadyOpenError,
  UnknownParticipantError,
} from './room-errors.js';
import { SetFinalEstimate } from './set-final-estimate.js';

const A_MONDAY_MORNING = new Date('2026-10-12T09:00:00.000Z');
const LONGER_THAN_THE_ACTIVITY_WINDOW = 180_000;
const ONE_SECOND = 1_000;
const HOW_MANY_TASKS_A_LONG_SESSION_GETS_THROUGH = 12;

async function aRoomWithSomebodyInIt(rooms: InMemoryRoomRepository, clock: ManualClock) {
  const { id: roomId } = await new CreateRoom(rooms).execute();
  const { token } = await new JoinRoom(rooms, clock).execute({ roomId, nickname: 'Alice' });

  return { roomId, token };
}

async function aRoundEstimatedAndRevealed(
  rooms: InMemoryRoomRepository,
  clock: ManualClock,
  { roomId, token, title }: { roomId: string; token: string; title: string },
): Promise<string> {
  const { id: roundId } = await new OpenRound(rooms, clock).execute({ roomId, token, title });
  await new CastEstimate(rooms, clock).execute({ roomId, roundId, token, value: '5' });
  await new RevealRound(rooms, clock).execute({ roomId, roundId, token });
  clock.advance(ONE_SECOND);

  return roundId;
}

describe('Opening a Round', () => {
  it('puts the task being estimated in front of everybody in the Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, token } = await aRoomWithSomebodyInIt(rooms, clock);

    await new OpenRound(rooms, clock).execute({ roomId, token, title: 'The checkout flow' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.round?.title).toBe('The checkout flow');
  });

  it('opens a Round with no title at all, for a vote nobody planned', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, token } = await aRoomWithSomebodyInIt(rooms, clock);

    await new OpenRound(rooms, clock).execute({ roomId, token, title: null });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.round).not.toBeNull();
    expect(snapshot.round?.title).toBeNull();
  });

  it('answers with the identifier of the Round it opened', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, token } = await aRoomWithSomebodyInIt(rooms, clock);

    const opened = await new OpenRound(rooms, clock).execute({ roomId, token, title: null });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.round?.id).toBe(opened.id);
  });

  it('starts the Round with nobody having voted and nothing chosen', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, token } = await aRoomWithSomebodyInIt(rooms, clock);

    await new OpenRound(rooms, clock).execute({ roomId, token, title: null });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token });

    expect(snapshot.participants.map(({ hasVoted }) => hasVoted)).toEqual([false]);
    expect(theOpenRound(snapshot).selfEstimate).toBeNull();
  });

  it('leaves a Room nobody has opened a Round in with no Round at all', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId } = await aRoomWithSomebodyInIt(rooms, clock);

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.round).toBeNull();
  });

  it('advances the Room revision, because nothing writes without bumping it', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, token } = await aRoomWithSomebodyInIt(rooms, clock);
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);
    const before = await getRoomSnapshot.execute({ roomId, token: null });

    await new OpenRound(rooms, clock).execute({ roomId, token, title: null });

    const after = await getRoomSnapshot.execute({ roomId, token: null });

    expect(after.revision).toBeGreaterThan(before.revision);
  });

  it('refuses to open a second Round while one is still open', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, token } = await aRoomWithSomebodyInIt(rooms, clock);
    const openRound = new OpenRound(rooms, clock);
    await openRound.execute({ roomId, token, title: 'The checkout flow' });

    const second = openRound.execute({ roomId, token, title: 'The search page' });

    await expect(second).rejects.toThrow(RoundAlreadyOpenError);
  });

  it('leaves the open Round alone when a second one is refused', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, token } = await aRoomWithSomebodyInIt(rooms, clock);
    const openRound = new OpenRound(rooms, clock);
    await openRound.execute({ roomId, token, title: 'The checkout flow' });

    await openRound.execute({ roomId, token, title: 'The search page' }).catch(() => null);

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.round?.title).toBe('The checkout flow');
  });

  it('refuses somebody who has not joined the Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId } = await aRoomWithSomebodyInIt(rooms, clock);

    const opened = new OpenRound(rooms, clock).execute({ roomId, token: null, title: null });

    await expect(opened).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses a token issued for another Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { token } = await aRoomWithSomebodyInIt(rooms, clock);
    const { roomId: elsewhere } = await aRoomWithSomebodyInIt(rooms, clock);

    const opened = new OpenRound(rooms, clock).execute({ roomId: elsewhere, token, title: null });

    await expect(opened).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses an identifier no Room was ever issued', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { token } = await aRoomWithSomebodyInIt(rooms, clock);

    const opened = new OpenRound(rooms, clock).execute({
      roomId: 'nTq7bXz1Rk9P',
      token,
      title: null,
    });

    await expect(opened).rejects.toThrow(RoomNotFoundError);
  });

  it('does not stand in for being there, because reading the Room is what says that', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, token } = await aRoomWithSomebodyInIt(rooms, clock);

    clock.advance(LONGER_THAN_THE_ACTIVITY_WINDOW);
    await new OpenRound(rooms, clock).execute({ roomId, token, title: null });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.participants).toEqual([]);
    expect(snapshot.round).not.toBeNull();
  });
});

describe('The next Round', () => {
  it('has no limit, so a long refinement session never hits a wall', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, token } = await aRoomWithSomebodyInIt(rooms, clock);
    const titles = Array.from(
      { length: HOW_MANY_TASKS_A_LONG_SESSION_GETS_THROUGH },
      (_, estimated) => `Task ${estimated + 1}`,
    );

    for (const title of titles) {
      await aRoundEstimatedAndRevealed(rooms, clock, { roomId, token, title });
    }

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.history.map(({ title }) => title)).toEqual(titles.slice(0, -1));
    expect(snapshot.round?.title).toBe(titles.at(-1));
  });

  it('moves the Round it succeeds into the history, with its title and its Final Estimate', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, token } = await aRoomWithSomebodyInIt(rooms, clock);
    const finished = await aRoundEstimatedAndRevealed(rooms, clock, {
      roomId,
      token,
      title: 'The checkout flow',
    });
    await new SetFinalEstimate(rooms).execute({ roomId, roundId: finished, token, value: '8' });

    await new OpenRound(rooms, clock).execute({ roomId, token, title: 'The search page' });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.history).toEqual([
      { id: finished, title: 'The checkout flow', finalEstimate: '8' },
    ]);
  });

  it('opens over a Round the team never agreed a number for', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, token } = await aRoomWithSomebodyInIt(rooms, clock);
    const finished = await aRoundEstimatedAndRevealed(rooms, clock, {
      roomId,
      token,
      title: 'The checkout flow',
    });

    const next = await new OpenRound(rooms, clock).execute({
      roomId,
      token,
      title: 'The search page',
    });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.history).toEqual([
      { id: finished, title: 'The checkout flow', finalEstimate: null },
    ]);
    expect(snapshot.round?.id).toBe(next.id);
  });

  it('leaves the Round on the table out of the history, revealed or not', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId, token } = await aRoomWithSomebodyInIt(rooms, clock);

    const revealed = await aRoundEstimatedAndRevealed(rooms, clock, {
      roomId,
      token,
      title: 'The checkout flow',
    });

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.round?.id).toBe(revealed);
    expect(snapshot.history).toEqual([]);
  });

  it('leaves a Room nobody has estimated anything in with an empty history', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const { roomId } = await aRoomWithSomebodyInIt(rooms, clock);

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({ roomId, token: null });

    expect(snapshot.round).toBeNull();
    expect(snapshot.history).toEqual([]);
  });
});
