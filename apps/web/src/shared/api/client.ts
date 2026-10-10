import { apiErrorSchema, roomSnapshotSchema, type RoomSnapshot } from '@fibopoker/shared';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function failureOf(response: Response): Promise<Error> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = apiErrorSchema.safeParse(body);

  return new Error(parsed.success ? parsed.data.message : `The API answered ${response.status}`);
}

export async function createRoom(): Promise<RoomSnapshot> {
  const response = await fetch(`${BASE_URL}/rooms`, { method: 'POST' });

  if (!response.ok) {
    throw await failureOf(response);
  }

  return roomSnapshotSchema.parse(await response.json());
}

export async function fetchRoomSnapshot(roomId: string): Promise<RoomSnapshot | null> {
  const response = await fetch(`${BASE_URL}/rooms/${roomId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw await failureOf(response);
  }

  return roomSnapshotSchema.parse(await response.json());
}
