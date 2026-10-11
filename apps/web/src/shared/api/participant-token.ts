const KEY_PREFIX = 'fibopoker.participant.';

function keyFor(roomId: string): string {
  return `${KEY_PREFIX}${roomId}`;
}

function attempt<T>(access: () => T): T | null {
  try {
    return access();
  } catch {
    return null;
  }
}

export function storedToken(roomId: string): string | null {
  return attempt(() => window.localStorage.getItem(keyFor(roomId))) ?? null;
}

export function rememberToken(roomId: string, token: string): void {
  attempt(() => window.localStorage.setItem(keyFor(roomId), token));
}

export function forgetToken(roomId: string): void {
  attempt(() => window.localStorage.removeItem(keyFor(roomId)));
}
