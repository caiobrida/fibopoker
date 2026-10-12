import { z } from 'zod';
import { nanoIdSchema } from './nano-id.js';

export const ROUND_ID_LENGTH = 12;

export const ROUND_TITLE_MAX_LENGTH = 120;

export const roundIdSchema = nanoIdSchema(ROUND_ID_LENGTH);

const titleLength = `A Round title is at most ${ROUND_TITLE_MAX_LENGTH} characters.`;

export const roundTitleSchema = z
  .string()
  .trim()
  .max(ROUND_TITLE_MAX_LENGTH, titleLength)
  .transform((title) => (title.length === 0 ? null : title));

export const ESTIMATE_VALUE_MAX_LENGTH = 16;

export const estimateValueSchema = z.string().min(1).max(ESTIMATE_VALUE_MAX_LENGTH);

export const openRoundRequestSchema = z.object({
  title: roundTitleSchema.nullable().default(null),
});

export const castEstimateRequestSchema = z.object({
  value: estimateValueSchema,
});

export const openRoundResponseSchema = z.object({
  id: roundIdSchema,
});

export const openRoundSchema = z.object({
  id: roundIdSchema,
  title: z.string().min(1).max(ROUND_TITLE_MAX_LENGTH).nullable(),
  selfEstimate: estimateValueSchema.nullable(),
});

export type OpenRound = z.infer<typeof openRoundSchema>;

export type OpenRoundRequest = z.infer<typeof openRoundRequestSchema>;

export type OpenRoundResponse = z.infer<typeof openRoundResponseSchema>;

export type CastEstimateRequest = z.infer<typeof castEstimateRequestSchema>;
