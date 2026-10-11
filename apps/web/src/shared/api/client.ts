import {
  apiErrorSchema,
  joinRoomResponseSchema,
  roomSnapshotSchema,
  type JoinRoomResponse,
  type RoomSnapshot,
} from '@fibopoker/shared';
import type { ZodType } from 'zod';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const UNREACHABLE = 'The API could not be reached.';
const UNINTELLIGIBLE = 'The API answered with something this app does not understand.';

export class StaleIdentityError extends Error {}

async function send(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new Error(UNREACHABLE);
  }
}

async function failureFrom(response: Response): Promise<Error> {
  const parsed = apiErrorSchema.safeParse(await response.json().catch(() => null));

  if (!parsed.success) {
    return new Error(`The API answered ${response.status}.`);
  }

  return parsed.data.code === 'unknown_participant'
    ? new StaleIdentityError(parsed.data.message)
    : new Error(parsed.data.message);
}

async function bodyOf<T>(response: Response, schema: ZodType<T>): Promise<T> {
  const parsed = schema.safeParse(await response.json().catch(() => null));

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

  return bodyOf(response, roomSnapshotSchema);
}

export async function joinRoom(roomId: string, nickname: string): Promise<JoinRoomResponse> {
  const response = await send(`/rooms/${roomId}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });

  if (!response.ok) {
    throw await failureFrom(response);
  }

  return bodyOf(response, joinRoomResponseSchema);
}

export async function fetchRoomSnapshot(
  roomId: string,
  token: string | null,
): Promise<RoomSnapshot | null> {
  const response = await send(`/rooms/${roomId}`, {
    headers: token === null ? undefined : { Authorization: `Bearer ${token}` },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw await failureFrom(response);
  }

  return bodyOf(response, roomSnapshotSchema);
}
