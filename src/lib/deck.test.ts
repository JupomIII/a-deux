import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../data/categories';
import type { Category } from '../data/types';
import { buildDeck, reorderDeck, shuffle, startWith } from './deck';
import { completeQuestion, createEmptyState, touchSession } from './progress';

const category = CATEGORIES[0] as Category;

describe('deck', () => {
  it('leaves the source array untouched when shuffling', () => {
    const source = [1, 2, 3, 4, 5];
    const result = shuffle(source, () => 0.5);
    expect(source).toEqual([1, 2, 3, 4, 5]);
    expect(result).toHaveLength(5);
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('starts with the requested question', () => {
    const start = category.questions[4]!;
    const ordered = startWith(category.questions, start.id);
    expect(ordered[0]?.id).toBe(start.id);
    expect(ordered).toHaveLength(category.questions.length);
  });

  it('excludes completed questions unless replay is enabled', () => {
    const done = category.questions[2]!;
    const state = completeQuestion(createEmptyState(), done.id, '2026-01-02T10:00:00.000Z');

    const deck = buildDeck(category, state, { shuffle: false, replayCompleted: false, startId: done.id });
    expect(deck.some((question) => question.id === done.id)).toBe(false);

    const replay = buildDeck(category, state, { shuffle: false, replayCompleted: true, startId: done.id });
    expect(replay[0]?.id).toBe(done.id);
  });

  it('resumes on the last session question', () => {
    const current = category.questions[3]!;
    const state = touchSession(createEmptyState(), category.id, current.id, '2026-01-02T10:00:00.000Z');
    const deck = buildDeck(category, state, {
      shuffle: false,
      replayCompleted: false,
      startId: state.lastSession?.questionId,
    });
    expect(deck[0]?.id).toBe(current.id);
  });

  it('returns an empty deck when everything is done', () => {
    let state = createEmptyState();
    for (const question of category.questions) {
      state = completeQuestion(state, question.id, '2026-01-02T10:00:00.000Z');
    }
    expect(buildDeck(category, state, { shuffle: false, replayCompleted: false })).toEqual([]);
  });

  it('reorders without dropping cards and keeps the current question first', () => {
    const deck = buildDeck(category, createEmptyState(), { shuffle: false, replayCompleted: false });
    const current = deck[5]!;
    const reordered = reorderDeck(deck, category, current.id, true, () => 0.3);

    expect(reordered).toHaveLength(deck.length);
    expect(reordered[0]?.id).toBe(current.id);
    expect(new Set(reordered.map((question) => question.id))).toEqual(
      new Set(deck.map((question) => question.id)),
    );
  });
});
