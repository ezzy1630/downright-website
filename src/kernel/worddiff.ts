/**
 * Word-level diff for the agent visit: an LCS over whitespace-split tokens,
 * the same granularity the app's change marks use. Returns tokens tagged
 * equal / removed (mine-only) / added (theirs-only) so both the streaming
 * rewrite and the Review side-by-side render from one pass.
 */

export interface DiffToken {
  text: string;
  kind: "equal" | "removed" | "added";
}

export function diffWords(mine: string, theirs: string): DiffToken[] {
  const a = mine.split(/(\s+)/).filter((token) => token.length > 0);
  const b = theirs.split(/(\s+)/).filter((token) => token.length > 0);
  const n = a.length;
  const m = b.length;

  // LCS table (Uint32 keeps a 350-word document well under 200KB).
  const table = new Uint32Array((n + 1) * (m + 1));
  const at = (i: number, j: number): number => i * (m + 1) + j;
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[at(i, j)] = a[i] === b[j]
        ? table[at(i + 1, j + 1)] + 1
        : Math.max(table[at(i + 1, j)], table[at(i, j + 1)]);
    }
  }

  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push(tokens, a[i], "equal");
      i += 1;
      j += 1;
    } else if (table[at(i + 1, j)] >= table[at(i, j + 1)]) {
      push(tokens, a[i], "removed");
      i += 1;
    } else {
      push(tokens, b[j], "added");
      j += 1;
    }
  }
  while (i < n) push(tokens, a[i++], "removed");
  while (j < m) push(tokens, b[j++], "added");
  return tokens;
}

function push(tokens: DiffToken[], text: string, kind: DiffToken["kind"]): void {
  const last = tokens[tokens.length - 1];
  if (last && last.kind === kind) last.text += text;
  else tokens.push({ text, kind });
}

/** Human summary in the app's voice: "2 rewritten · 1 added". */
export function summarizeDiff(tokens: DiffToken[]): { rewritten: number; added: number } {
  let rewritten = 0;
  let added = 0;
  let previousKind: DiffToken["kind"] | null = null;
  for (const token of tokens) {
    // A removed-run is one rewrite; an added-run with no removed-run before
    // it is one addition.
    if (token.kind === "removed" && previousKind !== "removed") rewritten += 1;
    if (token.kind === "added" && previousKind !== "removed" && previousKind !== "added") added += 1;
    previousKind = token.kind;
  }
  return { rewritten, added };
}
