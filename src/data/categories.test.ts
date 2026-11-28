import { describe, expect, it } from 'vitest';
import { ALL_QUESTIONS, CATEGORIES, TOTAL_QUESTIONS } from './categories';
import { CATEGORY_IDS } from './types';

const EXPECTED_SIZES: Record<string, number> = {
  commencer: 28,
  famille: 18,
  vous: 71,
  relation: 35,
  intimite: 17,
};

describe('question library', () => {
  it('has every category, in order', () => {
    expect(CATEGORIES.map((category) => category.id)).toEqual([...CATEGORY_IDS]);
  });

  it('carries the whole imported list', () => {
    for (const category of CATEGORIES) {
      expect(category.questions.length, category.id).toBe(EXPECTED_SIZES[category.id]);
    }
    expect(TOTAL_QUESTIONS).toBe(169);
  });

  it('numbers questions from one, continuously', () => {
    for (const category of CATEGORIES) {
      category.questions.forEach((question, index) => {
        expect(question.number).toBe(index + 1);
        expect(question.categoryId).toBe(category.id);
      });
    }
  });

  it('uses unique, stable ids and no empty text', () => {
    const ids = new Set<string>();
    for (const question of ALL_QUESTIONS) {
      expect(question.text.trim().length).toBeGreaterThan(10);
      expect(ids.has(question.id), question.id).toBe(false);
      ids.add(question.id);
    }
  });

  it('has no duplicated question text inside a category', () => {
    for (const category of CATEGORIES) {
      const texts = category.questions.map((question) => question.text);
      expect(new Set(texts).size).toBe(texts.length);
    }
  });
});
