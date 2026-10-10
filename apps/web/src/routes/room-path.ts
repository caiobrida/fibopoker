export const ROOM_ROUTE = '/r/:roomId';

export function roomPath(roomId: string): string {
  return `/r/${roomId}`;
}

export function roomUrl(roomId: string): string {
  return new URL(roomPath(roomId), window.location.origin).href;
}
