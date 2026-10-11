import { z } from 'zod';

const URL_SAFE_ALPHABET = /^[A-Za-z0-9_-]+$/;

export function nanoIdSchema(length: number) {
  return z.string().length(length).regex(URL_SAFE_ALPHABET);
}
