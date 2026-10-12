import { z } from 'zod';
import { nanoIdSchema } from './nano-id.js';
import { participantIdSchema } from './participant.js';

export const ROUND_ID_LENGTH = 12;

export const ROUND_TITLE_MAX_LENGTH = 120;

export const roundIdSchema = nanoIdSchema(ROUND_ID_LENGTH);

const titleLength = `A Round title is at most ${ROUND_TITLE_MAX_LENGTH} characters.`;

export const roundTitleSchema = z
  .string()
  .trim()
  .max(ROUND_TITLE_MAX_LENGTH, titleLength)
  .transform((title) => (title.length === 0 ? null : title));

export const estimateValueSchema = z.string().min(1);

export const openRoundRequestSchema = z.object({
  title: roundTitleSchema.nullable().default(null),
});

export const castEstimateRequestSchema = z.object({
  value: estimateValueSchema,
});

export const setFinalEstimateRequestSchema = z.object({
  value: estimateValueSchema,
});

export const openRoundResponseSchema = z.object({
  id: roundIdSchema,
});

export const revealedEstimateSchema = z.object({
  participantId: participantIdSchema,
  value: estimateValueSchema,
});

const identity = {
  id: roundIdSchema,
  title: z.string().min(1).max(ROUND_TITLE_MAX_LENGTH).nullable(),
};

const finalEstimate = estimateValueSchema.nullable();

export const roundSchema = z.discriminatedUnion('state', [
  z.object({
    ...identity,
    state: z.literal('open'),
    selfEstimate: estimateValueSchema.nullable(),
  }),
  z.object({
    ...identity,
    state: z.literal('revealed'),
    estimates: z.array(revealedEstimateSchema),
    finalEstimate,
  }),
]);

export const finishedRoundSchema = z.object({ ...identity, finalEstimate });

export type Round = z.infer<typeof roundSchema>;

export type FinishedRound = z.infer<typeof finishedRoundSchema>;

export type RevealedEstimate = z.infer<typeof revealedEstimateSchema>;

export type OpenRoundRequest = z.infer<typeof openRoundRequestSchema>;

export type OpenRoundResponse = z.infer<typeof openRoundResponseSchema>;

export type CastEstimateRequest = z.infer<typeof castEstimateRequestSchema>;

export type SetFinalEstimateRequest = z.infer<typeof setFinalEstimateRequestSchema>;
