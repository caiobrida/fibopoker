import {
  apiErrorSchema,
  joinRoomResponseSchema,
  openRoundResponseSchema,
  roomSnapshotSchema,
  type JoinRoomResponse,
  type OpenRoundResponse,
  type RoomSnapshot,
} from '@fibopoker/shared';
import type { ZodType } from 'zod';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const UNREACHABLE = 'The API could not be reached.';
const UNINTELLIGIBLE = 'The API answered with something this app does not understand.';

export class StaleIdentityError extends Error {}

function authorization(token: string | null): HeadersInit {
  return token === null ? {} : { Authorization: `Bearer ${token}` };
}

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

async function successful(response: Response): Promise<Response> {
  if (!response.ok) {
    throw await failureFrom(response);
  }

  return response;
}

function sendJson(
  path: string,
  method: string,
  token: string | null,
  body: unknown,
): Promise<Response> {
  return send(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...authorization(token) },
    body: JSON.stringify(body),
  }).then(successful);
}

async function bodyOf<T>(response: Response, schema: ZodType<T>): Promise<T> {
  const parsed = schema.safeParse(await response.json().catch(() => null));

  if (!parsed.success) {
    throw new Error(UNINTELLIGIBLE);
  }

  return parsed.data;
}

export async function createRoom(): Promise<RoomSnapshot> {
  const response = await successful(await send('/rooms', { method: 'POST' }));

  return bodyOf(response, roomSnapshotSchema);
}

export async function joinRoom(roomId: string, nickname: string): Promise<JoinRoomResponse> {
  const response = await sendJson(`/rooms/${roomId}/participants`, 'POST', null, { nickname });

  return bodyOf(response, joinRoomResponseSchema);
}

export async function fetchRoomSnapshot(
  roomId: string,
  token: string | null,
): Promise<RoomSnapshot | null> {
  const response = await send(`/rooms/${roomId}`, { headers: authorization(token) });

  if (response.status === 404) {
    return null;
  }

  return bodyOf(await successful(response), roomSnapshotSchema);
}

export async function openRound(
  roomId: string,
  token: string | null,
  title: string | null,
): Promise<OpenRoundResponse> {
  const response = await sendJson(`/rooms/${roomId}/rounds`, 'POST', token, { title });

  return bodyOf(response, openRoundResponseSchema);
}

export async function castEstimate(
  roomId: string,
  roundId: string,
  token: string | null,
  value: string,
): Promise<void> {
  await sendJson(`/rooms/${roomId}/rounds/${roundId}/estimate`, 'PUT', token, { value });
}

export async function revealRound(
  roomId: string,
  roundId: string,
  token: string | null,
): Promise<void> {
  await successful(
    await send(`/rooms/${roomId}/rounds/${roundId}/reveal`, {
      method: 'POST',
      headers: authorization(token),
    }),
  );
}
