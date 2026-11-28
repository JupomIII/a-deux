import { stableId } from '../lib/id';
import { questionTexts } from './questions';
import type { Category, CategoryId, CategoryMeta, Question } from './types';
import { isCategoryId } from './types';

const CATEGORY_META: CategoryMeta[] = [
  {
    id: 'commencer',
    name: 'Pour commencer',
    description: 'Des questions légères pour entrer dans la conversation, sans enjeu.',
    accent: '#a4604b',
    icon: 'compass',
  },
  {
    id: 'famille',
    name: 'Famille & enfance',
    description: 'L’enfance, les traditions, ceux qui vous ont construits.',
    accent: '#9a7b3c',
    icon: 'sun',
  },
  {
    id: 'vous',
    name: 'Vous',
    description: 'Vos goûts, votre parcours, ce que vous êtes devenu.',
    accent: '#5a6486',
    icon: 'waves',
  },
  {
    id: 'relation',
    name: 'Notre relation',
    description: 'Ce que vous êtes ensemble, et ce qui vous relie.',
    accent: '#a6606d',
    icon: 'heart',
  },
  {
    id: 'intimite',
    name: 'Intimité',
    description: 'La proximité, la tendresse, ce qui se dit à voix basse.',
    accent: '#8a6278',
    icon: 'flame',
  },
];

function buildQuestions(meta: CategoryMeta): Question[] {
  const seen = new Set<string>();

  return questionTexts[meta.id].map((text, index) => {
    let id = stableId(`${meta.id}:${text}`);
    if (seen.has(id)) id = `${id}-${index + 1}`;
    seen.add(id);

    return { id, categoryId: meta.id, number: index + 1, text };
  });
}

export const CATEGORIES: Category[] = CATEGORY_META.map((meta) => ({
  ...meta,
  questions: buildQuestions(meta),
}));

export const CATEGORY_BY_ID: ReadonlyMap<CategoryId, Category> = new Map(
  CATEGORIES.map((category) => [category.id, category]),
);

export const ALL_QUESTIONS: Question[] = CATEGORIES.flatMap((category) => category.questions);

export const QUESTION_BY_ID: ReadonlyMap<string, Question> = new Map(
  ALL_QUESTIONS.map((question) => [question.id, question]),
);

export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

export function getCategory(id: string | null | undefined): Category | undefined {
  if (!isCategoryId(id)) return undefined;
  return CATEGORY_BY_ID.get(id);
}
