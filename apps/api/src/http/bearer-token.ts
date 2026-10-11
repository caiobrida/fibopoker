const BEARER = /^Bearer (?<token>\S+)$/i;

export function bearerToken(authorization: string | undefined): string | null {
  return BEARER.exec(authorization ?? '')?.groups?.['token'] ?? null;
}
