import { Compass, Feather, Flame, Heart, Route, Sprout, Sun, Waves, Wind, type LucideIcon } from 'lucide-react';
import type { CategoryIcon } from '../data/types';

const GLYPHS: Record<CategoryIcon, LucideIcon> = {
  compass: Compass,
  sun: Sun,
  heart: Heart,
  waves: Waves,
  sprout: Sprout,
  flame: Flame,
  wind: Wind,
  route: Route,
  feather: Feather,
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
