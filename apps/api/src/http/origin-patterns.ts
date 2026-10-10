const LOCAL_DEVELOPMENT_ORIGIN = 'http://localhost:5173';
const ONE_HOSTNAME_LABEL = '[^.:/]+';
const REGEXP_METACHARACTERS = /[.*+?^${}()|[\]\\]/g;
const ESCAPED_ASTERISK = '\\*';

function anchoredPattern(origin: string): RegExp {
  const literal = origin.replace(REGEXP_METACHARACTERS, '\\$&');

  return new RegExp(`^${literal.replaceAll(ESCAPED_ASTERISK, ONE_HOSTNAME_LABEL)}$`);
}

export function originPatterns(configuredOrigins: string | undefined): RegExp[] {
  const entries = (configuredOrigins ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return (entries.length === 0 ? [LOCAL_DEVELOPMENT_ORIGIN] : entries).map(anchoredPattern);
}
