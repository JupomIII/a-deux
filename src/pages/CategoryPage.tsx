import { useEffect, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { getCategory } from '../data/categories';
import type { CategoryId } from '../data/types';
import { plural } from '../lib/format';
import { progressForCategory } from '../lib/progress';
import { navigate, sessionPath } from '../lib/router';
import { useProgress } from '../store/progress';
import { CategoryGlyph } from '../components/CategoryGlyph';
import { ProgressBar } from '../components/ProgressBar';
import { Switch } from '../components/Switch';
import { NotFoundPage } from './NotFoundPage';

export function CategoryPage({ categoryId }: { categoryId: CategoryId }) {
  const category = getCategory(categoryId);
  const { state, actions } = useProgress();
  const { visitCategory, setReplay } = actions;

  useEffect(() => {
    if (category) visitCategory(category.id);
  }, [category, visitCategory]);

  if (!category) return <NotFoundPage />;

  const progress = progressForCategory(state, category);
  const isComplete = progress.total > 0 && progress.completed === progress.total;
  const lastSessionHere = state.lastSession?.categoryId === category.id;
  const startLabel = progress.completed === 0 ? 'Commencer' : lastSessionHere ? 'Reprendre' : 'Continuer';
  const canEnter = progress.remaining > 0 || state.preferences.replayCompleted;

  return (
    <div className="narrow category-page" style={{ '--cat': category.accent } as CSSProperties}>
      <a className="back-link" href="#/">
        <ArrowLeft size={15} strokeWidth={1.7} aria-hidden="true" />
        Toutes les catégories
      </a>

      <header className="category-header">
        <span className="category-header__glyph" aria-hidden="true">
          <CategoryGlyph icon={category.icon} size={21} />
        </span>
        <p className="eyebrow">
          {plural(progress.total, 'question')} · {progress.completed} terminées
        </p>
        <h1 className="page-title">{category.name}</h1>
        <p className="lede">{category.description}</p>
      </header>

      <div className="category-progress">
        <div className="category-progress__row">
          <span>
            {progress.completed} sur {progress.total} questions terminées
          </span>
          <span className="tabular">{Math.round(progress.ratio * 100)} %</span>
        </div>
        <ProgressBar
          value={progress.completed}
          max={progress.total}
          tone={category.accent}
          label={`Progression dans ${category.name}`}
        />
      </div>

      <div className="category-actions">
        {canEnter ? (
          <a className="btn btn--primary" href={sessionPath(category.id)}>
            {isComplete ? 'Rejouer' : startLabel}
            <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </a>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setReplay(true);
              navigate(sessionPath(category.id));
            }}
          >
            Rejouer les questions
            <RotateCcw size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
        )}

        <a className="btn btn--quiet" href={`#/history?cat=${category.id}`}>
          Voir les réponses
        </a>
      </div>

      {isComplete ? (
        <p className="category-note">
          Toutes les questions de cette catégorie sont terminées. Vous pouvez les revoir quand vous
          voulez.
        </p>
      ) : null}

      <div className="panel">
        <Switch
          checked={state.preferences.replayCompleted}
          onChange={setReplay}
          label="Rejouer les questions terminées"
          description="Les cartes déjà terminées reviennent dans les sessions, pour reprendre une conversation. Ce réglage s’applique à toutes les catégories."
        />
      </div>

      <p className="back-to-list">
        <a className="link-quiet" href="#/">
          Retour aux catégories
        </a>
      </p>
    </div>
  );
}
