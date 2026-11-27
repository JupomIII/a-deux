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
 * The category the hero opens. The target is sticky: it stays the same until
 * that category is finished, so the button does not bounce between two themes
 * every time a session is opened elsewhere. The resume category is the only
 * one skipped — the resume card already reopens that session.
 *
 * When the target has to move on, it advances in category order instead of
 * restarting from the top, for the same reason.
 */
export function heroTarget(state: ProgressState, resumeId: CategoryId | null): Category | null {
  const isOpen = (category: Category) => progressForCategory(state, category).remaining > 0;

  const remembered = state.heroCategory ? CATEGORY_BY_ID.get(state.heroCategory) : undefined;
  if (remembered && remembered.id !== resumeId && isOpen(remembered)) return remembered;

  const from = CATEGORIES.findIndex(
    (category) => category.id === (remembered ? remembered.id : resumeId),
  );

  for (let step = 1; step <= CATEGORIES.length; step += 1) {
    const category = CATEGORIES[(from + step) % CATEGORIES.length] as Category;
    if (category.id !== resumeId && isOpen(category)) return category;
  }

  return null;
}

/** The category to open when nothing else is left to discover. */
export function suggestedCategory(state: ProgressState): Category {
  const preferred = state.lastCategory ? CATEGORY_BY_ID.get(state.lastCategory) : undefined;
  if (preferred && progressForCategory(state, preferred).remaining > 0) return preferred;

  const next = CATEGORIES.find((category) => progressForCategory(state, category).remaining > 0);
  return next ?? (CATEGORIES[0] as Category);
}
