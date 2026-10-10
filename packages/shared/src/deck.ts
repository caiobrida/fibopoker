export const DECK = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'] as const;

export type DeckValue = (typeof DECK)[number];
