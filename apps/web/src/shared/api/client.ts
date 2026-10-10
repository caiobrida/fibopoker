import { apiErrorSchema, roomSnapshotSchema, type RoomSnapshot } from '@fibopoker/shared';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const UNREACHABLE = 'The API could not be reached.';
const UNINTELLIGIBLE = 'The API answered with something this app does not understand.';

async function send(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new Error(UNREACHABLE);
  }
}

async function failureFrom(response: Response): Promise<Error> {
  const parsed = apiErrorSchema.safeParse(await response.json().catch(() => null));

  return new Error(parsed.success ? parsed.data.message : `The API answered ${response.status}.`);
}

async function snapshotFrom(response: Response): Promise<RoomSnapshot> {
  const parsed = roomSnapshotSchema.safeParse(await response.json().catch(() => null));

  if (!parsed.success) {
    throw new Error(UNINTELLIGIBLE);
  }

  return parsed.data;
}

export async function createRoom(): Promise<RoomSnapshot> {
  const response = await send('/rooms', { method: 'POST' });

  if (!response.ok) {
    throw await failureFrom(response);
  }

  return snapshotFrom(response);
}

export async function fetchRoomSnapshot(roomId: string): Promise<RoomSnapshot | null> {
  const response = await send(`/rooms/${roomId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw await failureFrom(response);
  }

  return snapshotFrom(response);
}
