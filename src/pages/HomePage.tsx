import type { CSSProperties } from 'react';
import { ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react';
import { CATEGORIES, CATEGORY_BY_ID, QUESTION_BY_ID, TOTAL_QUESTIONS } from '../data/categories';
import { isCompleted, progressForCategory } from '../lib/progress';
import { overallCompleted, suggestedCategory } from '../lib/overview';
import { sessionPath, categoryPath } from '../lib/router';
import { plural } from '../lib/format';
import { useProgress } from '../store/progress';
import { CategoryGlyph } from '../components/CategoryGlyph';
import { ProgressBar } from '../components/ProgressBar';

export function HomePage() {
  const { state } = useProgress();
  const completed = overallCompleted(state);
  const suggestion = suggestedCategory(state);

  const lastSession = state.lastSession;
  const resumeCategory = lastSession ? CATEGORY_BY_ID.get(lastSession.categoryId) : undefined;
  const resumeQuestion = lastSession ? QUESTION_BY_ID.get(lastSession.questionId) : undefined;
  const resumeProgress = resumeCategory ? progressForCategory(state, resumeCategory) : null;

  const canResume = Boolean(
    lastSession &&
      resumeCategory &&
      resumeQuestion &&
      resumeProgress &&
      (state.preferences.replayCompleted || !isCompleted(state, lastSession.questionId)),
  );

  return (
    <div className="home">
      <section className="hero">
        <p className="eyebrow">Cartes à deux</p>
        <h1 className="display">
          <span>Des questions</span>
          <span>pour se retrouver.</span>
        </h1>
        <p className="lede">
          Un moment sans écran. Une carte, une conversation, et parfois ce qu’on n’avait pas encore
          dit.
        </p>

        <div className="hero__actions">
          <a
            className="btn btn--primary"
            href={sessionPath(canResume && lastSession ? lastSession.categoryId : suggestion.id)}
          >
            {canResume ? 'Reprendre' : completed > 0 ? 'Continuer' : 'Commencer'}
            <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </a>
          <a className="link-quiet" href="#/history">
            Voir l’historique
          </a>
        </div>

        <p className="hero__meta">
          {CATEGORIES.length} catégories · {plural(TOTAL_QUESTIONS, 'question')}
        </p>
      </section>

      {canResume && lastSession && resumeCategory && resumeQuestion && resumeProgress ? (
        <section className="resume-card" aria-labelledby="resume-heading">
          <div className="resume-card__top">
            <p className="eyebrow" id="resume-heading">
              Reprendre
            </p>
            <span className="category-chip" style={{ '--cat': resumeCategory.accent } as CSSProperties}>
              <span className="dot" aria-hidden="true" />
              {resumeCategory.name}
            </span>
          </div>

          <p className="resume-card__question">{resumeQuestion.text}</p>

          <div className="resume-card__foot">
            <span className="meta-text">
              {resumeProgress.completed} sur {resumeProgress.total} terminées
            </span>
            <a className="btn btn--soft" href={sessionPath(resumeCategory.id)}>
              Continuer
              <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </a>
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="categories-heading">
        <div className="section__head">
          <h2 className="section__title" id="categories-heading">
            Catégories
          </h2>
          <p className="section__note">Neuf façons de commencer la conversation.</p>
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
                    <CategoryGlyph icon={category.icon} />
                  </span>

                  <span className="category-row__body">
                    <span className="category-row__name">
                      {category.name}
                      {done ? <span className="tiny-label">Terminée</span> : null}
                    </span>
                    <span className="category-row__desc">{category.description}</span>
                  </span>

                  <span className="category-row__meta">
                    <span className="category-row__count">
                      <span className="tabular">{progress.completed}</span>
                      <span className="category-row__total">/{progress.total}</span>
                    </span>
                    <ChevronRight
                      size={16}
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
