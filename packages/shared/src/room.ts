import { z } from 'zod';
import { nanoIdSchema } from './nano-id.js';
import { participantIdSchema, participantSchema } from './participant.js';
import { roundSchema } from './round.js';

export const ROOM_ID_LENGTH = 12;

export const roomIdSchema = nanoIdSchema(ROOM_ID_LENGTH);

export const roomSnapshotSchema = z.object({
  id: roomIdSchema,
  revision: z.number().int().positive(),
  participants: z.array(participantSchema),
  selfId: participantIdSchema.nullable(),
  round: roundSchema.nullable(),
});

export type RoomSnapshot = z.infer<typeof roomSnapshotSchema>;
