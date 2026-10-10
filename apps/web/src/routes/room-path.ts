export const ROOM_ROUTE = '/r/:roomId';

export function roomPath(roomId: string): string {
  return `/r/${roomId}`;
}
