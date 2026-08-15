/**
 * Editor statistics, kept separate from the CM6 mount so scenes can read
 * them without pulling editor code into their chunks.
 */

const parseTimes: number[] = [];

export function recordParse(ms: number): void {
  parseTimes.push(ms);
  if (parseTimes.length > 64) parseTimes.shift();
}

export function medianParseMs(): number {
  if (!parseTimes.length) return 0;
  const sorted = [...parseTimes].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
