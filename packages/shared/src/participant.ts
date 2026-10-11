import { z } from 'zod';

export const PARTICIPANT_ID_LENGTH = 12;

export const PARTICIPANT_TOKEN_LENGTH = 32;

export const NICKNAME_MAX_LENGTH = 24;

export const participantIdSchema = z
  .string()
  .length(PARTICIPANT_ID_LENGTH)
  .regex(/^[A-Za-z0-9_-]+$/);

export const participantTokenSchema = z
  .string()
  .length(PARTICIPANT_TOKEN_LENGTH)
  .regex(/^[A-Za-z0-9_-]+$/);

export const nicknameSchema = z
  .string()
  .trim()
  .min(1, 'A nickname cannot be empty.')
  .max(NICKNAME_MAX_LENGTH, `A nickname is at most ${NICKNAME_MAX_LENGTH} characters.`);

export const participantSchema = z.object({
  id: participantIdSchema,
  nickname: nicknameSchema,
});

export const joinRoomRequestSchema = z.object({
  nickname: nicknameSchema,
});

export const joinRoomResponseSchema = z.object({
  token: participantTokenSchema,
  nicknameAlreadyInUse: z.boolean(),
});

export type Participant = z.infer<typeof participantSchema>;

export type JoinRoomRequest = z.infer<typeof joinRoomRequestSchema>;

export type JoinRoomResponse = z.infer<typeof joinRoomResponseSchema>;
