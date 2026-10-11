import { describe, expect, it } from 'vitest';
import { InMemoryRoomRepository } from '../testing/in-memory-room-repository.js';
import { ManualClock } from '../testing/manual-clock.js';
import { CreateRoom } from './create-room.js';
import { GetRoomSnapshot } from './get-room-snapshot.js';
import { JoinRoom } from './join-room.js';
import { RoomNotFoundError, UnknownParticipantError } from './room-errors.js';

const A_MONDAY_MORNING = new Date('2026-10-12T09:00:00.000Z');

describe('Resolving a Room identifier', () => {
  it('reaches the same Room the identifier was issued for', async () => {
    const rooms = new InMemoryRoomRepository();
    const created = await new CreateRoom(rooms).execute();

    const resolved = await new GetRoomSnapshot(rooms).execute({
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

    const resolved = await new GetRoomSnapshot(rooms).execute({ roomId: other.id, token: null });

    expect(resolved.id).toBe(other.id);
    expect(resolved.id).not.toBe(one.id);
  });

  it('refuses an identifier no Room was ever issued', async () => {
    const getRoomSnapshot = new GetRoomSnapshot(new InMemoryRoomRepository());

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

    const snapshot = await new GetRoomSnapshot(rooms).execute({ roomId: created.id, token: null });

    expect(snapshot.viewerId).toBeNull();
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

    const read = new GetRoomSnapshot(rooms).execute({ roomId: other.id, token });

    await expect(read).rejects.toThrow(UnknownParticipantError);
  });

  it('refuses a token no Participant in the Room holds', async () => {
    const rooms = new InMemoryRoomRepository();
    const created = await new CreateRoom(rooms).execute();

    const read = new GetRoomSnapshot(rooms).execute({
      roomId: created.id,
      token: 'EoGdEL8Jh3zTqA1mV7yXnB2cR4sW6uP0',
    });

    await expect(read).rejects.toThrow(UnknownParticipantError);
  });
});
