import { z } from 'zod';

export const API_ERROR_CODES = ['room_not_found'] as const;

export const apiErrorSchema = z.object({
  code: z.enum(API_ERROR_CODES),
  message: z.string(),
});

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export type ApiError = z.infer<typeof apiErrorSchema>;
