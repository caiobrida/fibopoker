import { describe, expect, it } from 'vitest';
import { InMemoryRoomRepository } from '../testing/in-memory-room-repository.js';
import { CreateRoom } from './create-room.js';
import { GetRoomSnapshot } from './get-room-snapshot.js';
import { RoomNotFoundError } from './room-errors.js';

describe('Resolving a Room identifier', () => {
  it('reaches the same Room the identifier was issued for', async () => {
    const rooms = new InMemoryRoomRepository();
    const created = await new CreateRoom(rooms).execute();

    const resolved = await new GetRoomSnapshot(rooms).execute(created.id);

    expect(resolved).toEqual(created);
  });

  it('keeps each Room reachable only by its own identifier', async () => {
    const rooms = new InMemoryRoomRepository();
    const createRoom = new CreateRoom(rooms);
    const one = await createRoom.execute();
    const other = await createRoom.execute();

    const resolved = await new GetRoomSnapshot(rooms).execute(other.id);

    expect(resolved.id).toBe(other.id);
    expect(resolved.id).not.toBe(one.id);
  });

  it('refuses an identifier no Room was ever issued', async () => {
    const getRoomSnapshot = new GetRoomSnapshot(new InMemoryRoomRepository());

    await expect(getRoomSnapshot.execute('nTq7bXz1Rk9P')).rejects.toThrow(RoomNotFoundError);
  });
});
