const KEY_PREFIX = 'fibopoker.participant.';

function keyFor(roomId: string): string {
  return `${KEY_PREFIX}${roomId}`;
}

export function storedToken(roomId: string): string | null {
  try {
    return window.localStorage.getItem(keyFor(roomId));
  } catch {
    return null;
  }
}

export function rememberToken(roomId: string, token: string): void {
  try {
    window.localStorage.setItem(keyFor(roomId), token);
  } catch {
    return;
  }
}

export function forgetToken(roomId: string): void {
  try {
    window.localStorage.removeItem(keyFor(roomId));
  } catch {
    return;
  }
}
