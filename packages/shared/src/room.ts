import { z } from 'zod';

export const ROOM_ID_LENGTH = 12;

export const roomIdSchema = z
  .string()
  .length(ROOM_ID_LENGTH)
  .regex(/^[A-Za-z0-9_-]+$/);

export const roomSnapshotSchema = z.object({
  id: roomIdSchema,
  revision: z.number().int().positive(),
});

export type RoomSnapshot = z.infer<typeof roomSnapshotSchema>;
