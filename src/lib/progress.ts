import type { Category, CategoryId, Question } from '../data/types';

/** Bump when the persisted shape changes, and add a branch in storage.migrate. */
export const SCHEMA_VERSION = 2;

/** ISO date string. An empty string means the date is unknown (legacy import). */
export type Stamp = string;

export interface LastSession {
  categoryId: CategoryId;
  questionId: string;
  updatedAt: string;
}

export interface Preferences {
  /** Draw questions in a random order. */
  shuffle: boolean;
  /** Explicitly allow already-completed questions to come back. */
  replayCompleted: boolean;
}

export interface ProgressState {
  version: number;
  completed: Record<string, Stamp>;
  skipped: Record<string, Stamp>;
  lastSession: LastSession | null;
  lastCategory: CategoryId | null;
  /**
   * Category the home hero opens. Remembered until that category is finished,
   * so the call to action stays put instead of bouncing between themes.
   * Additive field: saves without it stay readable (treated as null).
   */
  heroCategory: CategoryId | null;
  preferences: Preferences;
}

export const DEFAULT_PREFERENCES: Preferences = {
  shuffle: false,
  replayCompleted: false,
};

export function createEmptyState(): ProgressState {
  return {
    version: SCHEMA_VERSION,
    completed: {},
    skipped: {},
    lastSession: null,
    lastCategory: null,
    heroCategory: null,
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

export function isCompleted(state: ProgressState, questionId: string): boolean {
  return Object.prototype.hasOwnProperty.call(state.completed, questionId);
}

export function isSkipped(state: ProgressState, questionId: string): boolean {
  return Object.prototype.hasOwnProperty.call(state.skipped, questionId);
}

export function completeQuestion(state: ProgressState, questionId: string, at: string): ProgressState {
  const skipped = { ...state.skipped };
  delete skipped[questionId];

  return {
    ...state,
    completed: { ...state.completed, [questionId]: at },
    skipped,
  };
}

export function skipQuestion(state: ProgressState, questionId: string, at: string): ProgressState {
  // Passing a card never cancels a completion.
  if (isCompleted(state, questionId)) return state;
  return { ...state, skipped: { ...state.skipped, [questionId]: at } };
}

export function uncompleteQuestion(state: ProgressState, questionId: string): ProgressState {
  if (!isCompleted(state, questionId)) return state;
  const completed = { ...state.completed };
  delete completed[questionId];
  return { ...state, completed };
}

export function setPreference<K extends keyof Preferences>(
  state: ProgressState,
  key: K,
  value: Preferences[K],
): ProgressState {
  if (state.preferences[key] === value) return state;
  return { ...state, preferences: { ...state.preferences, [key]: value } };
}

export function touchSession(
  state: ProgressState,
  categoryId: CategoryId,
  questionId: string,
  at: string,
): ProgressState {
  const current = state.lastSession;
  if (current && current.categoryId === categoryId && current.questionId === questionId) {
    return state;
  }
  return {
    ...state,
    lastCategory: categoryId,
    lastSession: { categoryId, questionId, updatedAt: at },
  };
}

export function visitCategory(state: ProgressState, categoryId: CategoryId): ProgressState {
  if (state.lastCategory === categoryId) return state;
  return { ...state, lastCategory: categoryId };
}

/** Pins the category the hero opens, so it does not move with every session. */
export function setHeroCategory(
  state: ProgressState,
  categoryId: CategoryId | null,
): ProgressState {
  if (state.heroCategory === categoryId) return state;
  return { ...state, heroCategory: categoryId };
}

export function resetProgress(state: ProgressState): ProgressState {
  return {
    ...createEmptyState(),
    // Preferences are a comfort setting, not progress: they survive a reset.
    preferences: { ...state.preferences },
    lastCategory: state.lastCategory,
  };
}

export function countCompletedIn(state: ProgressState, questions: Question[]): number {
  return questions.reduce((count, question) => (isCompleted(state, question.id) ? count + 1 : count), 0);
}

export interface CategoryProgress {
  completed: number;
  total: number;
  ratio: number;
  remaining: number;
}

export function progressForCategory(state: ProgressState, category: Category): CategoryProgress {
  const completed = countCompletedIn(state, category.questions);
  const total = category.questions.length;
  return {
    completed,
    total,
    ratio: total === 0 ? 0 : completed / total,
    remaining: total - completed,
  };
}

export function totalSkipped(state: ProgressState): number {
  return Object.keys(state.skipped).length;
}

export function totalCompleted(state: ProgressState): number {
  return Object.keys(state.completed).length;
}
