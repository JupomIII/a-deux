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
import { extraQuestions } from './extras';

/**
 * Question text is kept in plain arrays — no JSX, no UI concerns.
 * Identifiers are derived from the text, so appended questions keep
 * everyone's existing progress intact.
 */
const BASE_QUESTIONS: Record<CategoryId, string[]> = {
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

/** Original questions first, then the extra wave, so numbering stays stable. */
export const questionTexts: Record<CategoryId, string[]> = {
  decouverte: [...BASE_QUESTIONS.decouverte, ...extraQuestions.decouverte],
  souvenirs: [...BASE_QUESTIONS.souvenirs, ...extraQuestions.souvenirs],
  relation: [...BASE_QUESTIONS.relation, ...extraQuestions.relation],
  profondeur: [...BASE_QUESTIONS.profondeur, ...extraQuestions.profondeur],
  avenir: [...BASE_QUESTIONS.avenir, ...extraQuestions.avenir],
  intimite: [...BASE_QUESTIONS.intimite, ...extraQuestions.intimite],
  leger: [...BASE_QUESTIONS.leger, ...extraQuestions.leger],
  hypothetiques: [...BASE_QUESTIONS.hypothetiques, ...extraQuestions.hypothetiques],
  reflexion: [...BASE_QUESTIONS.reflexion, ...extraQuestions.reflexion],
};
