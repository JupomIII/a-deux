import { Compass, Flame, Heart, Sun, Waves, type LucideIcon } from 'lucide-react';
import type { CategoryIcon } from '../data/types';

const GLYPHS: Record<CategoryIcon, LucideIcon> = {
  compass: Compass,
  sun: Sun,
  waves: Waves,
  heart: Heart,
  flame: Flame,
};

export function CategoryGlyph({
  icon,
  size = 17,
  className,
}: {
  icon: CategoryIcon;
  size?: number;
  className?: string;
}) {
  const Glyph = GLYPHS[icon];
  return <Glyph size={size} strokeWidth={1.6} className={className} aria-hidden="true" />;
}
