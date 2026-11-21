import type { CategoryId } from '../types';
import { decouverte } from './decouverte';
import { souvenirs } from './souvenirs';
import { relation } from './relation';
import { profondeur } from './profondeur';
import { avenir } from './avenir';
import { intimite } from './intimite';
import { leger } from './leger';
import { hypothetiques } from './hypothetiques';
import { reflexion } from './reflexion';

/**
 * Question text is kept in plain arrays — no JSX, no UI concerns.
 * Identifiers are derived from the text, so appended questions keep
 * everyone's existing progress intact.
 */
export const questionTexts: Record<CategoryId, string[]> = {
  decouverte,
  souvenirs,
  relation,
  profondeur,
  avenir,
  intimite,
  leger,
  hypothetiques,
  reflexion,
};
