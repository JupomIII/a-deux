import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, RefreshCw, Shuffle } from 'lucide-react';
import { getCategory } from '../data/categories';
import type { CategoryId, Question } from '../data/types';
import { buildDeck, reorderDeck } from '../lib/deck';
import { padNumber } from '../lib/format';
import { isCompleted, progressForCategory } from '../lib/progress';
import { categoryPath } from '../lib/router';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useProgress } from '../store/progress';
import { CategoryGlyph } from '../components/CategoryGlyph';
import { NotFoundPage } from './NotFoundPage';

type Direction = 'forward' | 'back';
const TRANSITION_MS = 165;

export function SessionPage({ categoryId }: { categoryId: CategoryId }) {
  const category = getCategory(categoryId);
  const { state, actions } = useProgress();
  const reduceMotion = usePrefersReducedMotion();

  const [deck, setDeck] = useState<Question[]>(() =>
    category
      ? buildDeck(category, state, {
          shuffle: state.preferences.shuffle,
          replayCompleted: state.preferences.replayCompleted,
          startId:
            state.lastSession?.categoryId === category.id ? state.lastSession.questionId : null,
        })
      : [],
  );
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [leaving, setLeaving] = useState<Direction | null>(null);
  const [entering, setEntering] = useState<Direction | 'none'>(
    reduceMotion ? 'none' : 'forward',
  );

  const busyRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const current = deck[index] ?? null;
  const total = category?.questions.length ?? 0;
  const progress = category ? progressForCategory(state, category) : null;
  const completed = progress?.completed ?? 0;
  const remaining = progress?.remaining ?? 0;

  useEffect(() => {
    if (!category || !current) return;
    actions.touchSession(category.id, current.id);
  }, [category, current, actions]);

  function moveTo(next: number, direction: Direction) {
    if (busyRef.current) return;
    if (next < 0 || next >= deck.length || next === index) return;

    setEntering(direction);

    if (reduceMotion) {
      setIndex(next);
      return;
    }

    busyRef.current = true;
    setLeaving(direction);
    timerRef.current = window.setTimeout(() => {
      busyRef.current = false;
      setIndex(next);
      setLeaving(null);
      timerRef.current = null;
    }, TRANSITION_MS);
  }

  function advance() {
    if (index >= deck.length - 1) {
      setFinished(true);
      return;
    }
    moveTo(index + 1, 'forward');
  }

  function completeCurrent() {
    if (!current || finished || busyRef.current) return;

    const wasCompleted = isCompleted(state, current.id);
    actions.complete(current.id);
    if (!wasCompleted && completed + 1 === total) {
      // Last unanswered card: show the end panel without waiting for a transition.
      setFinished(true);
      return;
    }
    advance();
  }

  function skipCurrent() {
    if (!current || finished || busyRef.current) return;
    actions.skip(current.id);
    advance();
  }

  function drawAnother() {
    if (deck.length < 2) return;
    let next = index;
    while (next === index) next = Math.floor(Math.random() * deck.length);
    moveTo(next, 'forward');
  }

  function toggleShuffle() {
    if (!category || busyRef.current) return;
    const next = !state.preferences.shuffle;
    actions.setShuffle(next);
    setDeck(reorderDeck(deck, category, current?.id ?? null, next));
    setIndex(0);
    setLeaving(null);
    setEntering('none');
  }

  function replayQuestions() {
    if (!category || busyRef.current) return;
    actions.setReplay(true);
    setDeck(
      buildDeck(
        category,
        { ...state, preferences: { ...state.preferences, replayCompleted: true } },
        { shuffle: state.preferences.shuffle, replayCompleted: true },
      ),
    );
    setIndex(0);
    setFinished(false);
    setLeaving(null);
    setEntering('forward');
  }

  function resumeRemaining() {
    if (!category) return;
    setDeck(
      buildDeck(category, state, {
        shuffle: state.preferences.shuffle,
        replayCompleted: state.preferences.replayCompleted,
      }),
    );
    setIndex(0);
    setFinished(false);
    setLeaving(null);
    setEntering('forward');
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Enter') return;

      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, select, [contenteditable="true"], dialog')) {
        return;
      }

      if (finished || !current) return;

      event.preventDefault();
      if (event.key === 'ArrowLeft') moveTo(index - 1, 'back');
      else if (event.key === 'ArrowRight') skipCurrent();
      else completeCurrent();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!category) return <NotFoundPage />;

  const cardClass = [
    'question-card',
    leaving ? `is-leaving-${leaving}` : '',
    entering !== 'none' && !leaving ? `is-entering-${entering}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="session" style={{ '--cat': category.accent } as CSSProperties}>
      <header className="session-bar">
        <a className="icon-btn" href={categoryPath(category.id)} aria-label="Quitter la session">
          <ArrowLeft size={18} strokeWidth={1.7} aria-hidden="true" />
        </a>

        <p className="session-bar__category">
          <span className="session-bar__glyph" aria-hidden="true">
            <CategoryGlyph icon={category.icon} size={14} />
          </span>
          {category.name}
        </p>

        <button
          type="button"
          className="icon-btn"
          onClick={toggleShuffle}
          aria-pressed={state.preferences.shuffle}
          aria-label="Mélanger les questions"
          title="Mélanger les questions"
          disabled={deck.length < 2}
        >
          <Shuffle size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </header>

      <div className="session-track" aria-hidden="true">
        <span className="session-track__fill" style={{ width: `${(completed / Math.max(1, total)) * 100}%` }} />
      </div>

      {current && !finished ? (
        <>
          <div className="session-stage">
            <article className={cardClass} key={current.id}>
              <div className="card-meta">
                <span className="card-meta__cat">{category.name}</span>
                <span className="card-meta__num tabular">
                  {padNumber(current.number)}
                  <span className="card-meta__sep">/</span>
                  {padNumber(total)}
                </span>
              </div>

              <p className="card-question">{current.text}</p>

              <p className="card-note">Prenez le temps qu’il faut.</p>
            </article>

            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {current.text}
            </p>
          </div>

          <div className="session-controls">
            <div className="session-nav">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => moveTo(index - 1, 'back')}
                disabled={index === 0 || Boolean(leaving)}
              >
                <ChevronLeft size={15} strokeWidth={1.8} aria-hidden="true" />
                Précédente
              </button>

              <button
                type="button"
                className="btn btn--ghost"
                onClick={drawAnother}
                disabled={deck.length < 2 || Boolean(leaving)}
              >
                <RefreshCw size={14} strokeWidth={1.8} aria-hidden="true" />
                Autre question
              </button>
            </div>

            <div className="session-decide">
              <button
                type="button"
                className="btn btn--quiet"
                onClick={skipCurrent}
                disabled={Boolean(leaving)}
              >
                Passer
                <ChevronRight size={15} strokeWidth={1.8} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="btn btn--primary btn--grow"
                onClick={completeCurrent}
                disabled={Boolean(leaving)}
              >
                <Check size={16} strokeWidth={2} aria-hidden="true" />
                Terminée
              </button>
            </div>
          </div>

          <p className="session-hint" aria-hidden="true">
            ← Précédente · → Passer · Entrée Terminée
          </p>
        </>
      ) : (
        <div className="session-panel">
          <p className="eyebrow">{finished ? 'Session terminée' : 'Catégorie terminée'}</p>
          <h1 className="panel-title">
            {finished && remaining > 0
              ? 'Vous avez fait le tour.'
              : 'Toutes les cartes ont été posées.'}
          </h1>
          <p className="lede">
            {remaining > 0
              ? `${completed} sur ${total} questions terminées. Certaines cartes ont été passées : vous pouvez y revenir quand vous voulez.`
              : `${completed} sur ${total} questions terminées dans ${category.name}. Rien ne presse pour la suite.`}
          </p>

          <div className="panel__actions">
            {remaining > 0 ? (
              <button type="button" className="btn btn--primary" onClick={resumeRemaining}>
                Revenir aux cartes passées
              </button>
            ) : (
              <a className="btn btn--primary" href="#/">
                Choisir une autre catégorie
              </a>
            )}

            {remaining > 0 && deck.length === 0 ? (
              <button type="button" className="btn btn--quiet" onClick={replayQuestions}>
                Rejouer les questions
              </button>
            ) : null}

            <a className="btn btn--quiet" href={categoryPath(category.id)}>
              Retour à la catégorie
            </a>
          </div>

          {remaining === 0 ? (
            <button type="button" className="link-quiet panel__link" onClick={replayQuestions}>
              Rejouer les questions
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
