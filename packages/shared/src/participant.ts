import { z } from 'zod';
import { nanoIdSchema } from './nano-id.js';

export const PARTICIPANT_ID_LENGTH = 12;

export const PARTICIPANT_TOKEN_LENGTH = 32;

export const NICKNAME_MAX_LENGTH = 24;

export const participantIdSchema = nanoIdSchema(PARTICIPANT_ID_LENGTH);

export const participantTokenSchema = nanoIdSchema(PARTICIPANT_TOKEN_LENGTH);

export const nicknameSchema = z
  .string({ error: 'A nickname is required.' })
  .trim()
  .min(1, 'A nickname cannot be empty.')
  .max(NICKNAME_MAX_LENGTH, `A nickname is at most ${NICKNAME_MAX_LENGTH} characters.`);

export const participantSchema = z.object({
  id: participantIdSchema,
  nickname: nicknameSchema,
  spectating: z.boolean(),
  hasVoted: z.boolean(),
});

export const joinRoomRequestSchema = z.object({
  nickname: nicknameSchema,
});

export const joinRoomResponseSchema = z.object({
  token: participantTokenSchema,
});

export const renameRequestSchema = z.object({
  nickname: nicknameSchema,
});

export const setSpectatingRequestSchema = z.object({
  spectating: z.boolean({ error: 'Spectating is either on or off.' }),
});

export type Participant = z.infer<typeof participantSchema>;

export type JoinRoomRequest = z.infer<typeof joinRoomRequestSchema>;

export type JoinRoomResponse = z.infer<typeof joinRoomResponseSchema>;

export type RenameRequest = z.infer<typeof renameRequestSchema>;

export type SetSpectatingRequest = z.infer<typeof setSpectatingRequestSchema>;
