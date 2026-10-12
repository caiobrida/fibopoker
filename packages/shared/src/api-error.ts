import { z } from 'zod';

export const API_ERROR_CODES = [
  'room_not_found',
  'unknown_participant',
  'round_not_found',
  'round_already_open',
  'round_already_revealed',
  'round_still_open',
  'invalid_estimate',
  'invalid_request',
] as const;

export const apiErrorSchema = z.object({
  code: z.enum(API_ERROR_CODES),
  message: z.string(),
});

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export type ApiError = z.infer<typeof apiErrorSchema>;
