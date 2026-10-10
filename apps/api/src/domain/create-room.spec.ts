import { ROOM_ID_LENGTH } from '@fibopoker/shared';
import { describe, expect, it } from 'vitest';
import { InMemoryRoomRepository } from '../testing/in-memory-room-repository.js';
import { CreateRoom } from './create-room.js';

describe('Creating a Room', () => {
  it('gives every Room an identifier that tells nothing about any other', async () => {
    const createRoom = new CreateRoom(new InMemoryRoomRepository());
    const identifiers = new Set<string>();

    for (let created = 0; created < 50; created += 1) {
      const { id } = await createRoom.execute();

      expect(id).toHaveLength(ROOM_ID_LENGTH);
      expect(id).toMatch(/^[\w-]+$/);
      expect(id).not.toMatch(/^[0-9]+$/);
      identifiers.add(id);
    }

    expect(identifiers.size).toBe(50);
  });

  it('carries a revision from the very first write', async () => {
    const createRoom = new CreateRoom(new InMemoryRoomRepository());

    const snapshot = await createRoom.execute();

    expect(snapshot.revision).toBeGreaterThan(0);
  });
});
