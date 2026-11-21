/**
 * Stable identifier derived from the question text (FNV-1a, 32 bits).
 *
 * Progress is stored against these ids, so adding, removing or reordering
 * questions in a category never invalidates someone's saved history.
 */
export function stableId(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `q${(hash >>> 0).toString(36)}`;
}
