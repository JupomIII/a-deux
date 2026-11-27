import { CATEGORIES, CATEGORY_BY_ID } from '../data/categories';
import type { Category, CategoryId } from '../data/types';
import { progressForCategory, type ProgressState } from './progress';

export function overallCompleted(state: ProgressState): number {
  return CATEGORIES.reduce((sum, category) => sum + progressForCategory(state, category).completed, 0);
}

export function attemptedCategories(state: ProgressState): number {
  return CATEGORIES.filter((category) => progressForCategory(state, category).completed > 0).length;
}

/**
 * The category the hero opens: the next one with cards left, never the one the
 * resume card already reopens, so the two entry points stay distinct.
 */
export function nextOpenCategory(
  state: ProgressState,
  excludeId?: CategoryId | null,
): Category | null {
  const open = CATEGORIES.filter(
    (category) =>
      category.id !== excludeId && progressForCategory(state, category).remaining > 0,
  );
  return open[0] ?? null;
}

/** The category to open when nothing else is left to discover. */
export function suggestedCategory(state: ProgressState): Category {
  const preferred = state.lastCategory ? CATEGORY_BY_ID.get(state.lastCategory) : undefined;
  if (preferred && progressForCategory(state, preferred).remaining > 0) return preferred;

  const next = CATEGORIES.find((category) => progressForCategory(state, category).remaining > 0);
  return next ?? (CATEGORIES[0] as Category);
}
