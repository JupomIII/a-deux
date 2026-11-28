export const CATEGORY_IDS = ['commencer', 'famille', 'vous', 'relation', 'intimite'] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as readonly string[]).includes(value);
}

export type CategoryIcon = 'compass' | 'sun' | 'waves' | 'heart' | 'flame';

export interface CategoryMeta {
  id: CategoryId;
  name: string;
  description: string;
  /** Discreet warm hue used for the category's dot, line and glyph. */
  accent: string;
  icon: CategoryIcon;
}

export interface Question {
  id: string;
  categoryId: CategoryId;
  /** Position within the category, used for the « 04 / 32 » counter. */
  number: number;
  text: string;
}

export interface Category extends CategoryMeta {
  questions: Question[];
}
