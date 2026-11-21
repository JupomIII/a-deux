import { stableId } from '../lib/id';
import { questionTexts } from './questions';
import type { Category, CategoryId, CategoryMeta, Question } from './types';
import { isCategoryId } from './types';

const CATEGORY_META: CategoryMeta[] = [
  {
    id: 'decouverte',
    name: 'Découverte',
    description: 'Les détails qui dessinent une personne : goûts, habitudes, petits riens.',
    accent: '#a4604b',
    icon: 'compass',
  },
  {
    id: 'souvenirs',
    name: 'Souvenirs',
    description: 'L’enfance, les lieux et les moments qui ont laissé une trace.',
    accent: '#9a7b3c',
    icon: 'sun',
  },
  {
    id: 'relation',
    name: 'Notre relation',
    description: 'Ce que vous êtes devenus ensemble, et comment vous avancez à deux.',
    accent: '#a6606d',
    icon: 'heart',
  },
  {
    id: 'profondeur',
    name: 'Profondeur',
    description: 'Valeurs, émotions, peurs. Ce qu’on dit rarement à voix haute.',
    accent: '#5a6486',
    icon: 'waves',
  },
  {
    id: 'avenir',
    name: 'Avenir',
    description: 'Projets, envies et rêves un peu plus grands que la semaine.',
    accent: '#6c8367',
    icon: 'sprout',
  },
  {
    id: 'intimite',
    name: 'Intimité',
    description: 'La tendresse, la confiance et la proximité qui se construisent.',
    accent: '#8a6278',
    icon: 'flame',
  },
  {
    id: 'leger',
    name: 'Léger',
    description: 'Des questions sans enjeu, pour rire et partir dans tous les sens.',
    accent: '#4e7c74',
    icon: 'wind',
  },
  {
    id: 'hypothetiques',
    name: 'Hypothétiques',
    description: 'Des situations imaginaires pour voir comment l’autre raisonne.',
    accent: '#5a7a90',
    icon: 'route',
  },
  {
    id: 'reflexion',
    name: 'Réflexion',
    description: 'Des questions qui méritent une hésitation avant la réponse.',
    accent: '#7a6b5d',
    icon: 'feather',
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
