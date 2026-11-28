import { useState, type CSSProperties } from 'react';
import { ArrowRight, ArrowUpRight, ChevronDown, ChevronRight, Shuffle } from 'lucide-react';
import { CATEGORIES, CATEGORY_BY_ID, QUESTION_BY_ID, TOTAL_QUESTIONS } from '../data/categories';
import { progressForCategory } from '../lib/progress';
import { overallCompleted, suggestedCategory } from '../lib/overview';
import { categoryPath, navigate, sessionPath } from '../lib/router';
import { useProgress } from '../store/progress';
import { CategoryGlyph } from '../components/CategoryGlyph';
import { ProgressBar } from '../components/ProgressBar';

/** Two shapes only: a session with cards left, or a category that is done. */
type ResumeState = 'resume' | 'finished';

const RESUME_COPY: Record<ResumeState, { label: string; cta: string }> = {
  resume: { label: 'Dernière session', cta: 'Reprendre' },
  finished: { label: 'Session terminée', cta: 'Revoir' },
};

export function HomePage() {
  const { state } = useProgress();
  const completed = overallCompleted(state);
  const suggestion = suggestedCategory(state);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const lastSession = state.lastSession;
  const resumeCategory = lastSession ? CATEGORY_BY_ID.get(lastSession.categoryId) : undefined;
  const resumeQuestion = lastSession ? QUESTION_BY_ID.get(lastSession.questionId) : undefined;
  const resumeProgress = resumeCategory ? progressForCategory(state, resumeCategory) : null;

  const resumeState: ResumeState | null =
    lastSession && resumeCategory && resumeQuestion && resumeProgress
      ? resumeProgress.remaining === 0
        ? 'finished'
        : 'resume'
      : null;

  const resumeCategoryId = lastSession?.categoryId ?? null;

  /**
   * Nine categories is a lot to choose from when you just want to talk.
   * One tap picks a category with unanswered cards, so the choice can be skipped.
   * The resumable category stays out of the draw: that is the card's job.
   */
  function startRandom() {
    const open = CATEGORIES.filter(
      (category) => progressForCategory(state, category).remaining > 0,
    );
    const others = open.filter((category) => category.id !== resumeCategoryId);
    const choices = others.length > 0 ? others : open;

    if (choices.length === 0) {
      navigate(categoryPath(suggestion.id));
      return;
    }

    const pick = choices[Math.floor(Math.random() * choices.length)] ?? choices[0];
    navigate(sessionPath(pick.id));
  }

  return (
    <div className="home">
      {resumeState && lastSession && resumeCategory && resumeQuestion && resumeProgress ? (
        <a
          className="resume-card"
          href={
            resumeState === 'finished'
              ? categoryPath(resumeCategory.id)
              : sessionPath(resumeCategory.id)
          }
          style={{ '--cat': resumeCategory.accent } as CSSProperties}
        >
          <span className="resume-card__top">
            <span className="eyebrow">{RESUME_COPY[resumeState].label}</span>
            <span className="category-chip">
              <span className="dot" aria-hidden="true" />
              {resumeCategory.name}
            </span>
          </span>

          <span className="resume-card__question">{resumeQuestion.text}</span>

          <span className="resume-card__foot">
            <span className="resume-card__progress">
              <span className="resume-card__count">
                <span className="tabular">{resumeProgress.completed}</span> sur{' '}
                {resumeProgress.total} cartes
              </span>
              <span className="resume-card__track" aria-hidden="true">
                <span
                  className="resume-card__fill"
                  style={{ width: `${resumeProgress.ratio * 100}%` }}
                />
              </span>
            </span>

            <span className="btn btn--soft resume-card__cta">
              {RESUME_COPY[resumeState].cta}
              <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </span>
          </span>
        </a>
      ) : null}

      <section className="section" aria-labelledby="categories-heading">
        <h2 className="section__title" id="categories-heading">
          <button
            type="button"
            className="section__toggle"
            aria-expanded={categoriesOpen}
            aria-controls="categories-panel"
            onClick={() => setCategoriesOpen((open) => !open)}
          >
            <span>Catégories</span>
            <span className="section__toggle-end">
              <span className="section__toggle-meta">
                {categoriesOpen ? 'Refermer' : `${CATEGORIES.length} thèmes`}
              </span>
              <ChevronDown
                size={16}
                strokeWidth={1.7}
                className="section__chevron"
                aria-hidden="true"
              />
            </span>
          </button>
        </h2>

        {categoriesOpen ? (
          <div className="section__panel" id="categories-panel">
            <div className="section__head">
              <p className="section__hint">
                Choisissez un thème, ou laissez le hasard tirer une carte.
              </p>
              <button type="button" className="section__action" onClick={startRandom}>
                <Shuffle size={14} strokeWidth={1.7} aria-hidden="true" />
                Une carte au hasard
              </button>
            </div>

            <ul className="category-list">
              {CATEGORIES.map((category) => {
                const progress = progressForCategory(state, category);
                const done = progress.total > 0 && progress.completed === progress.total;

                return (
                  <li key={category.id}>
                    <a
                      className="category-row"
                      href={categoryPath(category.id)}
                      style={{ '--cat': category.accent } as CSSProperties}
                    >
                      <span className="category-row__glyph" aria-hidden="true">
                        <CategoryGlyph icon={category.icon} size={16} />
                      </span>

                      <span className="category-row__body">
                        <span className="category-row__name">
                          {category.name}
                          {done ? <span className="tiny-label">Terminée</span> : null}
                          {!done && category.id === suggestion.id ? (
                            <span className="tiny-label">Par ici</span>
                          ) : null}
                        </span>
                        <span className="category-row__desc">{category.description}</span>
                      </span>

                      <span className="category-row__meta">
                        <span className="category-row__count">
                          <span className="tabular">{progress.completed}</span>
                          <span className="category-row__total">/{progress.total}</span>
                        </span>
                        <ChevronRight
                          size={15}
                          strokeWidth={1.6}
                          className="category-row__chevron"
                          aria-hidden="true"
                        />
                      </span>

                      <span className="category-row__track" aria-hidden="true">
                        <span
                          className="category-row__fill"
                          style={{ width: `${progress.ratio * 100}%` }}
                        />
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="overview" aria-labelledby="progress-heading">
        <div className="overview__head">
          <div>
            <p className="eyebrow" id="progress-heading">
              Progression
            </p>
            <p className="overview__count">
              <strong className="tabular">{completed}</strong>
              <span className="overview__of"> sur {TOTAL_QUESTIONS} questions terminées</span>
            </p>
          </div>

          <a className="link-quiet" href="#/history">
            Revoir mes réponses
            <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" />
          </a>
        </div>

        <ProgressBar value={completed} max={TOTAL_QUESTIONS} label="Progression globale" />
      </section>
    </div>
  );
}
