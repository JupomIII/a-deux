import type { CSSProperties } from 'react';
import { ArrowRight, Shuffle } from 'lucide-react';
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
   * Five categories is still a choice when you just want to talk, so one tap
   * can skip it. The resumable category stays out of the draw: that is the card's job.
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
        <div className="section__head">
          <h2 className="section__label" id="categories-heading">
            Catégories
          </h2>
          <span className="section__meta">
            <span className="tabular">{completed}</span> sur {TOTAL_QUESTIONS} questions
          </span>
        </div>

        <ul className="category-grid">
          {CATEGORIES.map((category) => {
            const progress = progressForCategory(state, category);

            return (
              <li key={category.id}>
                <a
                  className={`category-tile${
                    category.id === suggestion.id ? ' category-tile--suggested' : ''
                  }`}
                  href={categoryPath(category.id)}
                  style={{ '--cat': category.accent } as CSSProperties}
                >
                  <span className="category-tile__head">
                    <span className="category-tile__glyph">
                      <CategoryGlyph icon={category.icon} size={15} />
                    </span>
                    <span className="category-tile__count">
                      <span className="tabular">{progress.completed}</span>
                      <span className="category-tile__total">/{progress.total}</span>
                    </span>
                  </span>

                  <span className="category-tile__name">{category.name}</span>

                  <span className="category-tile__track" aria-hidden="true">
                    <span
                      className="category-tile__fill"
                      style={{ width: `${progress.ratio * 100}%` }}
                    />
                  </span>
                </a>
              </li>
            );
          })}

          <li>
            <button type="button" className="category-tile category-tile--draw" onClick={startRandom}>
              <span className="category-tile__head">
                <span className="category-tile__glyph">
                  <Shuffle size={15} strokeWidth={1.7} aria-hidden="true" />
                </span>
              </span>

              <span className="category-tile__name">Une carte au hasard</span>
            </button>
          </li>
        </ul>
      </section>

      <section className="overview" aria-labelledby="progress-heading">
        <p className="overview__line">
          <span className="eyebrow" id="progress-heading">
            Progression
          </span>
          <span className="overview__count">
            <strong className="tabular">{completed}</strong>
            <span className="overview__of"> sur {TOTAL_QUESTIONS} questions terminées</span>
          </span>
        </p>

        <ProgressBar value={completed} max={TOTAL_QUESTIONS} label="Progression globale" />
      </section>
    </div>
  );
}
