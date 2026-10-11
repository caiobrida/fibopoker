import { PARTICIPANT_TOKEN_LENGTH } from '@fibopoker/shared';
import { nanoid } from 'nanoid';
import { createHash } from 'node:crypto';

export type Participant = {
  id: string;
  nickname: string;
  tokenHash: string;
  joinedAt: Date;
  lastSeenAt: Date;
};

export function issueToken(): string {
  return nanoid(PARTICIPANT_TOKEN_LENGTH);
}

export function hashedToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
