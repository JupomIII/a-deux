import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../data/categories';
import type { Category } from '../data/types';
import {
  completeQuestion,
  createEmptyState,
  isCompleted,
  isSkipped,
  progressForCategory,
  resetProgress,
  setPreference,
  skipQuestion,
  totalCompleted,
  touchSession,
  uncompleteQuestion,
  visitCategory,
} from './progress';

const category = CATEGORIES[0] as Category;
const first = category.questions[0]!;
const second = category.questions[1]!;

describe('progress reducers', () => {
  it('starts empty', () => {
    const state = createEmptyState();
    expect(totalCompleted(state)).toBe(0);
    expect(state.lastSession).toBeNull();
    expect(state.version).toBe(2);
  });

  it('records a completed question with its date', () => {
    const state = completeQuestion(createEmptyState(), first.id, '2026-01-02T10:00:00.000Z');
    expect(isCompleted(state, first.id)).toBe(true);
    expect(state.completed[first.id]).toBe('2026-01-02T10:00:00.000Z');
  });

  it('completing a skipped question clears the skip', () => {
    const skipped = skipQuestion(createEmptyState(), first.id, '2026-01-01T10:00:00.000Z');
    expect(isSkipped(skipped, first.id)).toBe(true);

    const completed = completeQuestion(skipped, first.id, '2026-01-02T10:00:00.000Z');
    expect(isSkipped(completed, first.id)).toBe(false);
    expect(isCompleted(completed, first.id)).toBe(true);
  });

  it('skipping never cancels a completion', () => {
    const completed = completeQuestion(createEmptyState(), first.id, '2026-01-02T10:00:00.000Z');
    const skipped = skipQuestion(completed, first.id, '2026-01-03T10:00:00.000Z');
    expect(skipped).toBe(completed);
    expect(isSkipped(skipped, first.id)).toBe(false);
  });

  it('removes a completion', () => {
    const completed = completeQuestion(createEmptyState(), first.id, '2026-01-02T10:00:00.000Z');
    const undone = uncompleteQuestion(completed, first.id);
    expect(isCompleted(undone, first.id)).toBe(false);
  });

  it('computes category progress', () => {
    let state = createEmptyState();
    state = completeQuestion(state, first.id, '2026-01-02T10:00:00.000Z');
    state = completeQuestion(state, second.id, '2026-01-02T10:01:00.000Z');

    const progress = progressForCategory(state, category);
    expect(progress.completed).toBe(2);
    expect(progress.total).toBe(category.questions.length);
    expect(progress.remaining).toBe(category.questions.length - 2);
    expect(progress.ratio).toBeCloseTo(2 / category.questions.length);
  });

  it('tracks the last session without duplicating updates', () => {
    const state = touchSession(createEmptyState(), category.id, first.id, '2026-01-02T10:00:00.000Z');
    expect(state.lastSession).toEqual({
      categoryId: category.id,
      questionId: first.id,
      updatedAt: '2026-01-02T10:00:00.000Z',
    });
    expect(touchSession(state, category.id, first.id, '2027-01-01T00:00:00.000Z')).toBe(state);
  });

  it('keeps preferences and the last category when resetting', () => {
    let state = setPreference(createEmptyState(), 'shuffle', true);
    state = completeQuestion(state, first.id, '2026-01-02T10:00:00.000Z');
    state = touchSession(state, category.id, first.id, '2026-01-02T10:00:00.000Z');
    state = visitCategory(state, 'famille');

    const reset = resetProgress(state);
    expect(reset.completed).toEqual({});
    expect(reset.skipped).toEqual({});
    expect(reset.lastSession).toBeNull();
    expect(reset.lastCategory).toBe('famille');
    expect(reset.preferences.shuffle).toBe(true);
  });

  it('does not mutate the previous state', () => {
    const state = createEmptyState();
    completeQuestion(state, first.id, '2026-01-02T10:00:00.000Z');
    expect(state.completed).toEqual({});
  });
});
