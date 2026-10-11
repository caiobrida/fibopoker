import { describe, expect, it } from 'vitest';
import { InMemoryRoomRepository } from '../testing/in-memory-room-repository.js';
import { ManualClock } from '../testing/manual-clock.js';
import { CreateRoom } from './create-room.js';
import { GetRoomSnapshot } from './get-room-snapshot.js';
import { JoinRoom } from './join-room.js';
import { RoomNotFoundError } from './room-errors.js';

const A_MONDAY_MORNING = new Date('2026-10-12T09:00:00.000Z');
const ONE_MINUTE = 60_000;

describe('Joining a Room', () => {
  it('puts the Participant into the Room anyone reading it sees', async () => {
    const rooms = new InMemoryRoomRepository();
    const created = await new CreateRoom(rooms).execute();

    await new JoinRoom(rooms, new ManualClock(A_MONDAY_MORNING)).execute({
      roomId: created.id,
      nickname: 'Alice',
    });

    const snapshot = await new GetRoomSnapshot(rooms).execute({ roomId: created.id, token: null });

    expect(snapshot.participants.map(({ nickname }) => nickname)).toEqual(['Alice']);
  });

  it('keeps the joiner identified across reads, without a second entry in the list', async () => {
    const rooms = new InMemoryRoomRepository();
    const created = await new CreateRoom(rooms).execute();
    const getRoomSnapshot = new GetRoomSnapshot(rooms);
    const { token } = await new JoinRoom(rooms, new ManualClock(A_MONDAY_MORNING)).execute({
      roomId: created.id,
      nickname: 'Alice',
    });

    const first = await getRoomSnapshot.execute({ roomId: created.id, token });
    const second = await getRoomSnapshot.execute({ roomId: created.id, token });

    expect(second.selfId).toBe(first.selfId);
    expect(second.participants).toEqual([{ id: first.selfId, nickname: 'Alice' }]);
  });

  it('takes in a Participant whose nickname is already spoken for', async () => {
    const rooms = new InMemoryRoomRepository();
    const created = await new CreateRoom(rooms).execute();
    const joinRoom = new JoinRoom(rooms, new ManualClock(A_MONDAY_MORNING));
    await joinRoom.execute({ roomId: created.id, nickname: 'Alice' });

    const second = await joinRoom.execute({ roomId: created.id, nickname: 'alice' });

    const snapshot = await new GetRoomSnapshot(rooms).execute({
      roomId: created.id,
      token: second.token,
    });

    expect(snapshot.participants.map(({ nickname }) => nickname)).toContain('alice');
    expect(snapshot.participants).toHaveLength(2);
    expect(snapshot.selfId).not.toBeNull();
  });

  it('advances the Room revision, because nothing writes without bumping it', async () => {
    const rooms = new InMemoryRoomRepository();
    const created = await new CreateRoom(rooms).execute();

    await new JoinRoom(rooms, new ManualClock(A_MONDAY_MORNING)).execute({
      roomId: created.id,
      nickname: 'Alice',
    });

    const snapshot = await new GetRoomSnapshot(rooms).execute({ roomId: created.id, token: null });

    expect(snapshot.revision).toBeGreaterThan(created.revision);
  });

  it('refuses an identifier no Room was ever issued', async () => {
    const joinRoom = new JoinRoom(new InMemoryRoomRepository(), new ManualClock(A_MONDAY_MORNING));

    await expect(joinRoom.execute({ roomId: 'nTq7bXz1Rk9P', nickname: 'Alice' })).rejects.toThrow(
      RoomNotFoundError,
    );
  });

  it('lists Participants in the order they arrived, read after read', async () => {
    const rooms = new InMemoryRoomRepository();
    const clock = new ManualClock(A_MONDAY_MORNING);
    const created = await new CreateRoom(rooms).execute();
    const joinRoom = new JoinRoom(rooms, clock);

    for (const nickname of ['Alice', 'Bob', 'Carol']) {
      await joinRoom.execute({ roomId: created.id, nickname });
      clock.advance(ONE_MINUTE);
    }

    const getRoomSnapshot = new GetRoomSnapshot(rooms);
    const first = await getRoomSnapshot.execute({ roomId: created.id, token: null });
    const second = await getRoomSnapshot.execute({ roomId: created.id, token: null });

    expect(first.participants.map(({ nickname }) => nickname)).toEqual(['Alice', 'Bob', 'Carol']);
    expect(second.participants).toEqual(first.participants);
  });
});
