import type { CategoryId } from '../types';
import { commencer } from './commencer';
import { famille } from './famille';
import { vous } from './vous';
import { relation } from './relation';
import { intimite } from './intimite';

/**
 * Question text is kept in plain arrays — no JSX, no UI concerns.
 * Identifiers are derived from the text, so reordering a category
 * never invalidates someone's saved history.
 */
export const questionTexts: Record<CategoryId, string[]> = {
  commencer,
  famille,
  vous,
  relation,
  intimite,
};
