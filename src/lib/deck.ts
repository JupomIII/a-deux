import type { Category, Question } from '../data/types';
import { isCompleted, type ProgressState } from './progress';

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const current = result[index] as T;
    result[index] = result[swap] as T;
    result[swap] = current;
  }
  return result;
}

/** Rotate the list so the given question comes first. */
export function startWith(questions: Question[], startId: string | null | undefined): Question[] {
  if (!startId) return questions;
  const index = questions.findIndex((question) => question.id === startId);
  if (index <= 0) return questions;
  return [...questions.slice(index), ...questions.slice(0, index)];
}

export interface DeckOptions {
  shuffle: boolean;
  /** Include questions that are already completed. */
  replayCompleted: boolean;
  startId?: string | null;
  random?: () => number;
}

/**
 * A session deck is a snapshot: completing a card does not reshuffle the
 * remaining questions under the reader's feet.
 */
export function buildDeck(category: Category, state: ProgressState, options: DeckOptions): Question[] {
  const pool = category.questions.filter(
    (question) => options.replayCompleted || !isCompleted(state, question.id),
  );

  if (pool.length === 0) return [];

  const startId = options.startId ?? null;
  if (options.shuffle) {
    const first = pool.find((question) => question.id === startId);
    const rest = pool.filter((question) => question.id !== startId);
    const shuffled = shuffle(rest, options.random);
    return first ? [first, ...shuffled] : shuffled;
  }

  return startWith(pool, startId);
}

/** Reorder an existing deck when the shuffle preference is toggled mid-session. */
export function reorderDeck(
  deck: Question[],
  category: Category,
  currentId: string | null,
  shuffleOrder: boolean,
  random: () => number = Math.random,
): Question[] {
  if (deck.length === 0) return deck;

  const ids = new Set(deck.map((question) => question.id));
  const order = category.questions.filter((question) => ids.has(question.id));

  if (!shuffleOrder) {
    return startWith(order, currentId);
  }

  const current = currentId ? deck.find((question) => question.id === currentId) : undefined;
  const rest = order.filter((question) => question.id !== current?.id);
  const shuffled = shuffle(rest, random);
  return current ? [current, ...shuffled] : shuffled;
}
