import { useMemo, useState } from 'react';
import { Undo2 } from 'lucide-react';
import { CATEGORIES, QUESTION_BY_ID } from '../data/categories';
import { isCategoryId, type CategoryId, type Question } from '../data/types';
import { dayKey, formatDayLabel, formatTime, plural } from '../lib/format';
import { useProgress } from '../store/progress';

type Filter = CategoryId | 'all';

interface Entry {
  question: Question;
  stamp: string;
}

function readInitialFilter(): Filter {
  if (typeof window === 'undefined') return 'all';
  const query = window.location.hash.split('?')[1] ?? '';
  const value = new URLSearchParams(query).get('cat');
  return isCategoryId(value) ? value : 'all';
}

export function HistoryPage() {
  const { state, actions } = useProgress();
  const [filter, setFilter] = useState<Filter>(readInitialFilter);

  const entries = useMemo<Entry[]>(() => {
    return Object.entries(state.completed)
      .map(([id, stamp]) => {
        const question = QUESTION_BY_ID.get(id);
        return question ? { question, stamp } : null;
      })
      .filter((entry): entry is Entry => entry !== null)
      .filter((entry) => filter === 'all' || entry.question.categoryId === filter)
      .sort((a, b) => {
        if (!a.stamp && !b.stamp) return a.question.number - b.question.number;
        if (!a.stamp) return 1;
        if (!b.stamp) return -1;
        return b.stamp.localeCompare(a.stamp);
      });
  }, [state.completed, filter]);

  const groups = useMemo(() => {
    const buckets = new Map<string, { label: string; entries: Entry[] }>();

    for (const entry of entries) {
      const valid = entry.stamp !== '' && !Number.isNaN(new Date(entry.stamp).getTime());
      const key = valid ? dayKey(entry.stamp) : 'unknown';
      const label = valid ? formatDayLabel(entry.stamp) : 'Sans date';

      if (!buckets.has(key)) buckets.set(key, { label, entries: [] });
      buckets.get(key)?.entries.push(entry);
    }

    return [...buckets.values()];
  }, [entries]);

  const totalCompleted = entries.length;

  return (
    <div className="narrow history">
      <header className="history-head">
        <p className="eyebrow">Historique</p>
        <h1 className="page-title">Vos réponses</h1>
        <p className="lede">
          Les questions que vous avez terminées, de la plus récente à la plus ancienne. Retirer une
          carte la rend de nouveau disponible en session.
        </p>
      </header>

      <div className="chips" role="group" aria-label="Filtrer par catégorie">
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          Toutes
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className="chip"
            aria-pressed={filter === category.id}
            onClick={() => setFilter(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <p className="history-count meta-text">
        {plural(totalCompleted, 'question terminée', 'questions terminées')}
        {filter !== 'all' ? ` · ${CATEGORIES.find((category) => category.id === filter)?.name}` : ''}
      </p>

      {groups.length > 0 ? (
        <div className="history-groups">
          {groups.map((group) => (
            <section className="history-group" key={group.label} aria-label={group.label}>
              <h2 className="history-group__title">{group.label}</h2>
              <ul>
                {group.entries.map((entry) => {
                  const category = CATEGORIES.find(
                    (item) => item.id === entry.question.categoryId,
                  );
                  if (!category) return null;

                  return (
                    <li className="history-entry" key={entry.question.id}>
                      <span
                        className="history-entry__dot"
                        style={{ background: category.accent }}
                        aria-hidden="true"
                      />
                      <div className="history-entry__body">
                        <p className="history-entry__text">{entry.question.text}</p>
                        <p className="history-entry__meta">
                          {category.name}
                          {entry.stamp ? ` · ${formatTime(entry.stamp)}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="icon-btn icon-btn--tiny"
                        onClick={() => actions.uncomplete(entry.question.id)}
                        aria-label="Marquer cette question comme non terminée"
                        title="Marquer comme non terminée"
                      >
                        <Undo2 size={15} strokeWidth={1.7} aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-block">
          <p className="empty-block__title">
            {filter === 'all'
              ? 'Aucune question terminée pour l’instant.'
              : 'Rien dans cette catégorie pour l’instant.'}
          </p>
          <p className="empty-block__text">
            Les cartes que vous marquez comme terminées apparaîtront ici.
          </p>
          <a className="btn btn--quiet" href="#/">
            Parcourir les catégories
          </a>
        </div>
      )}
    </div>
  );
}
