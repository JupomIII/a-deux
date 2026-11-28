import { useEffect } from 'react';
import { getCategory } from './data/categories';
import { useRoute, type Route } from './lib/router';
import { ProgressProvider, useProgress } from './store/progress';
import { Masthead, SiteFooter } from './components/Masthead';
import { StorageBanner } from './components/StorageBanner';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { SessionPage } from './pages/SessionPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { IncompatibleScreen } from './pages/IncompatibleScreen';

function titleFor(route: Route): string {
  switch (route.name) {
    case 'home':
      return 'à deux — Cartes de questions';
    case 'category':
    case 'session': {
      const category = getCategory(route.categoryId);
      return category ? `${category.name} — à deux` : 'à deux';
    }
    case 'history':
      return 'Historique — à deux';
    case 'settings':
      return 'Réglages — à deux';
    default:
      return 'Page introuvable — à deux';
  }
}

function routeKey(route: Route): string {
  return route.name === 'category' || route.name === 'session'
    ? `${route.name}:${route.categoryId}`
    : route.name;
}

function renderPage(route: Route) {
  switch (route.name) {
    case 'home':
      return <HomePage />;
    case 'category':
      return <CategoryPage key={route.categoryId} categoryId={route.categoryId} />;
    case 'session':
      return <SessionPage key={route.categoryId} categoryId={route.categoryId} />;
    case 'history':
      return <HistoryPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <NotFoundPage />;
  }
}

function Shell() {
  const route = useRoute();
  const { status, notice, actions } = useProgress();
  const isSession = route.name === 'session';
  const key = routeKey(route);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [key]);

  useEffect(() => {
    document.title = titleFor(route);
  }, [key, route]);

  return (
    <div className={`app${isSession ? ' app--focus' : ''}`}>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Aller au contenu
      </a>

      {!isSession ? <Masthead /> : null}

      {notice ? (
        <div className="app__banner">
          <StorageBanner status={notice} onDismiss={actions.dismissNotice} />
        </div>
      ) : null}

      <main
        id="main"
        tabIndex={-1}
        className={isSession ? 'page page--focus' : route.name === 'home' ? 'page page--home' : 'page'}
      >
        {status === 'future' ? <IncompatibleScreen /> : renderPage(route)}
      </main>

      {!isSession && status !== 'future' ? <SiteFooter /> : null}
    </div>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <Shell />
    </ProgressProvider>
  );
}
