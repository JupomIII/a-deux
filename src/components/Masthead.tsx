import { History, Settings } from 'lucide-react';
import { Mark } from './Mark';

export function Masthead() {
  return (
    <header className="masthead">
      <a className="wordmark" href="#/" aria-label="à deux, retour à l’accueil">
        <Mark size={25} />
        <span className="wordmark__text">à deux</span>
      </a>

      <nav className="masthead__nav" aria-label="Navigation principale">
        <a className="nav-link" href="#/history">
          <History size={16} strokeWidth={1.6} aria-hidden="true" />
          <span className="nav-link__label">Historique</span>
        </a>
        <a className="icon-btn" href="#/settings" aria-label="Réglages">
          <Settings size={16} strokeWidth={1.6} aria-hidden="true" />
        </a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>Vos réponses restent sur cet appareil.</p>
      <a href="#/settings">Progression et données</a>
    </footer>
  );
}
