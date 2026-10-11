import { describe, expect, it } from 'vitest';
import { InMemoryRoomRepository } from '../testing/in-memory-room-repository.js';
import { ManualClock } from '../testing/manual-clock.js';
import { CreateRoom } from './create-room.js';
import { GetRoomSnapshot } from './get-room-snapshot.js';
import { JoinRoom } from './join-room.js';
import { RoomNotFoundError, UnknownParticipantError } from './room-errors.js';

const A_MONDAY_MORNING = new Date('2026-10-12T09:00:00.000Z');
const TEN_SECONDS = 10_000;
const THE_SLOWEST_A_BACKGROUNDED_TAB_POLLS = 60_000;
const LONGER_THAN_THE_ACTIVITY_WINDOW = 180_000;

describe('Resolving a Room identifier', () => {
  it('reaches the same Room the identifier was issued for', async () => {
    const rooms = new InMemoryRoomRepository();
    const created = await new CreateRoom(rooms).execute();

    const resolved = await new GetRoomSnapshot(rooms, new ManualClock(A_MONDAY_MORNING)).execute({
      roomId: created.id,
      token: null,
    });

    expect(resolved).toEqual(created);
  });

  it('keeps each Room reachable only by its own identifier', async () => {
    const rooms = new InMemoryRoomRepository();
    const createRoom = new CreateRoom(rooms);
    const one = await createRoom.execute();
    const other = await createRoom.execute();

    const resolved = await new GetRoomSnapshot(rooms, new ManualClock(A_MONDAY_MORNING)).execute({
      roomId: other.id,
      token: null,
    });

    expect(resolved.id).toBe(other.id);
    expect(resolved.id).not.toBe(one.id);
  });

  it('refuses an identifier no Room was ever issued', async () => {
    const getRoomSnapshot = new GetRoomSnapshot(
      new InMemoryRoomRepository(),
      new ManualClock(A_MONDAY_MORNING),
    );

    await expect(getRoomSnapshot.execute({ roomId: 'nTq7bXz1Rk9P', token: null })).rejects.toThrow(
      RoomNotFoundError,
    );
  });
});

describe('Presenting a Participant token', () => {
  it('draws the whole Room for someone who has not joined yet', async () => {
    const rooms = new InMemoryRoomRepository();
    const created = await new CreateRoom(rooms).execute();
    await new JoinRoom(rooms, new ManualClock(A_MONDAY_MORNING)).execute({
      roomId: created.id,
      nickname: 'Alice',
    });

    const snapshot = await new GetRoomSnapshot(rooms, new ManualClock(A_MONDAY_MORNING)).execute({
      roomId: created.id,
      token: null,
    });

    expect(snapshot.selfId).toBeNull();
    expect(snapshot.participants.map(({ nickname }) => nickname)).toEqual(['Alice']);
    expect(snapshot.revision).toBeGreaterThan(0);
  });

  it('refuses a token issued for another Room', async () => {
    const rooms = new InMemoryRoomRepository();
    const createRoom = new CreateRoom(rooms);
    const one = await createRoom.execute();
    const other = await createRoom.execute();
    const { token } = await new JoinRoom(rooms, new ManualClock(A_MONDAY_MORNING)).execute({
      roomId: one.id,
      nickname: 'Alice',
    });

    const read = new GetRoomSnapshot(rooms, new ManualClock(A_MONDAY_MORNING)).execute({
      roomId: other.id,
      token,
    });

    await expect(read).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses a token no Participant in the Room holds', async () => {
    const rooms = new InMemoryRoomRepository();
    const created = await new CreateRoom(rooms).execute();

    const read = new GetRoomSnapshot(rooms, new ManualClock(A_MONDAY_MORNING)).execute({
      roomId: created.id,
      token: 'EoGdEL8Jh3zTqA1mV7yXnB2cR4sW6uP0',
    });

    await expect(read).rejects.toThrow(UnknownParticipantError);
  });
});

describe('Staying present in a Room', () => {
  it('drops a Participant nobody has seen within the activity window', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const created = await new CreateRoom(rooms).execute();
    const joinRoom = new JoinRoom(rooms, clock);
    await joinRoom.execute({ roomId: created.id, nickname: 'Alice' });
    const { token } = await joinRoom.execute({ roomId: created.id, nickname: 'Bob' });

    clock.advance(LONGER_THAN_THE_ACTIVITY_WINDOW);

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({
      roomId: created.id,
      token,
    });

    expect(snapshot.participants.map(({ nickname }) => nickname)).toEqual(['Bob']);
  });

  it('keeps the reader present, because reading the Room is what says they are there', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const created = await new CreateRoom(rooms).execute();
    const { token } = await new JoinRoom(rooms, clock).execute({
      roomId: created.id,
      nickname: 'Alice',
    });
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);

    for (let poll = 0; poll < 5; poll += 1) {
      clock.advance(THE_SLOWEST_A_BACKGROUNDED_TAB_POLLS);
      await getRoomSnapshot.execute({ roomId: created.id, token });
    }

    const seenByEverybodyElse = await getRoomSnapshot.execute({
      roomId: created.id,
      token: null,
    });

    expect(seenByEverybodyElse.participants.map(({ nickname }) => nickname)).toEqual(['Alice']);
  });

  it('does not let a read by nobody stand in for a Participant being there', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const created = await new CreateRoom(rooms).execute();
    await new JoinRoom(rooms, clock).execute({ roomId: created.id, nickname: 'Alice' });
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);

    for (let poll = 0; poll < 5; poll += 1) {
      clock.advance(THE_SLOWEST_A_BACKGROUNDED_TAB_POLLS);
      await getRoomSnapshot.execute({ roomId: created.id, token: null });
    }

    const snapshot = await getRoomSnapshot.execute({ roomId: created.id, token: null });

    expect(snapshot.participants).toEqual([]);
  });

  it('leaves the Room revision alone when a read only records that somebody was seen', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const created = await new CreateRoom(rooms).execute();
    const { token } = await new JoinRoom(rooms, clock).execute({
      roomId: created.id,
      nickname: 'Alice',
    });
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);

    const first = await getRoomSnapshot.execute({ roomId: created.id, token });
    clock.advance(TEN_SECONDS);
    const second = await getRoomSnapshot.execute({ roomId: created.id, token });

    expect(second.revision).toBe(first.revision);
  });

  it('takes a Participant back in on the read that brings them back', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const created = await new CreateRoom(rooms).execute();
    const { token } = await new JoinRoom(rooms, clock).execute({
      roomId: created.id,
      nickname: 'Alice',
    });
    const getRoomSnapshot = new GetRoomSnapshot(rooms, clock);

    clock.advance(LONGER_THAN_THE_ACTIVITY_WINDOW);

    const whileAway = await getRoomSnapshot.execute({ roomId: created.id, token: null });
    await getRoomSnapshot.execute({ roomId: created.id, token });
    const afterReturning = await getRoomSnapshot.execute({ roomId: created.id, token: null });

    expect(whileAway.participants).toEqual([]);
    expect(afterReturning.participants.map(({ nickname }) => nickname)).toEqual(['Alice']);
  });

  it('never answers with a selfId the Participant list does not contain', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const created = await new CreateRoom(rooms).execute();
    const { token } = await new JoinRoom(rooms, clock).execute({
      roomId: created.id,
      nickname: 'Alice',
    });

    clock.advance(LONGER_THAN_THE_ACTIVITY_WINDOW);

    const snapshot = await new GetRoomSnapshot(rooms, clock).execute({
      roomId: created.id,
      token,
    });

    expect(snapshot.participants.map(({ id }) => id)).toContain(snapshot.selfId);
  });
});
