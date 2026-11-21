import { useRef, useState, type ChangeEvent } from 'react';
import { ArrowLeft, Download, RotateCcw, Upload } from 'lucide-react';
import { ALL_QUESTIONS } from '../data/categories';
import type { ProgressState } from '../lib/progress';
import { parseImport, serializeExport } from '../lib/storage';
import { overallCompleted, attemptedCategories } from '../lib/overview';
import { plural } from '../lib/format';
import { useProgress } from '../store/progress';
import { Dialog } from '../components/Dialog';
import { Switch } from '../components/Switch';

interface PendingImport {
  state: ProgressState;
  count: number;
}

export function SettingsPage() {
  const { state, actions } = useProgress();
  const [resetOpen, setResetOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const completed = overallCompleted(state);
  const knownIds = new Set(ALL_QUESTIONS.map((question) => question.id));
  const skipped = Object.keys(state.skipped).filter((id) => knownIds.has(id)).length;
  const started = attemptedCategories(state);

  function downloadExport() {
    const blob = new Blob([serializeExport(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `a-deux-progression-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Sauvegarde téléchargée.');
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setMessage(null);
    try {
      const text = await file.text();
      const result = parseImport(text);

      if (!result.ok) {
        setImportError(result.error);
        return;
      }

      setImportError(null);
      setPending({ state: result.state, count: Object.keys(result.state.completed).length });
      setImportOpen(true);
    } catch {
      setImportError('Le fichier n’a pas pu être lu.');
    }
  }

  function confirmImport() {
    if (!pending) return;
    actions.replaceState(pending.state);
    setImportOpen(false);
    setPending(null);
    setMessage('Progression importée.');
  }

  function confirmReset() {
    actions.reset();
    setResetOpen(false);
    setMessage('Progression réinitialisée. Vos préférences sont conservées.');
  }

  return (
    <div className="narrow settings">
      <a className="back-link" href="#/">
        <ArrowLeft size={15} strokeWidth={1.7} aria-hidden="true" />
        Accueil
      </a>

      <header>
        <p className="eyebrow">Réglages</p>
        <h1 className="page-title">Votre progression</h1>
        <p className="lede">
          Tout est enregistré dans ce navigateur, sur cet appareil. Aucun compte, aucune
          synchronisation, aucune donnée envoyée.
        </p>
      </header>

      <section className="settings-group" aria-labelledby="settings-progress">
        <h2 className="settings-group__title" id="settings-progress">
          Progression
        </h2>

        <dl className="stats">
          <div className="stat">
            <dt className="stat__label">terminées</dt>
            <dd className="stat__value tabular">{completed}</dd>
          </div>
          <div className="stat">
            <dt className="stat__label">passées</dt>
            <dd className="stat__value tabular">{skipped}</dd>
          </div>
          <div className="stat">
            <dt className="stat__label">catégories entamées</dt>
            <dd className="stat__value tabular">{started}</dd>
          </div>
        </dl>

        <div className="settings-actions">
          <button type="button" className="btn btn--quiet" onClick={() => setResetOpen(true)}>
            <RotateCcw size={15} strokeWidth={1.7} aria-hidden="true" />
            Réinitialiser la progression
          </button>
        </div>

        {message ? (
          <p className="form-message" role="status">
            {message}
          </p>
        ) : null}
      </section>

      <section className="settings-group" aria-labelledby="settings-preferences">
        <h2 className="settings-group__title" id="settings-preferences">
          Préférences
        </h2>

        <div className="settings-list">
          <Switch
            checked={state.preferences.replayCompleted}
            onChange={actions.setReplay}
            label="Rejouer les questions terminées"
            description="Une carte déjà terminée ne revient pas en session, sauf si vous activez cette option."
          />
          <Switch
            checked={state.preferences.shuffle}
            onChange={actions.setShuffle}
            label="Mélanger les questions"
            description="Les cartes sont tirées dans un ordre aléatoire au début de chaque session."
          />
        </div>
      </section>

      <section className="settings-group" aria-labelledby="settings-data">
        <h2 className="settings-group__title" id="settings-data">
          Données
        </h2>

        <p className="form-note">
          Exportez votre progression pour la garder de côté ou la transférer vers un autre
          navigateur. L’importation remplace la progression actuelle de cet appareil.
        </p>

        <div className="settings-actions">
          <button type="button" className="btn btn--quiet" onClick={downloadExport}>
            <Download size={15} strokeWidth={1.7} aria-hidden="true" />
            Exporter en JSON
          </button>
          <button type="button" className="btn btn--quiet" onClick={() => fileRef.current?.click()}>
            <Upload size={15} strokeWidth={1.7} aria-hidden="true" />
            Importer une sauvegarde
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleFile}
          />
        </div>

        {importError ? (
          <p className="form-error" role="alert">
            {importError}
          </p>
        ) : null}
      </section>

      <section className="settings-group" aria-labelledby="settings-app">
        <h2 className="settings-group__title" id="settings-app">
          Application
        </h2>
        <p className="form-note">
          à deux peut s’installer comme une application. Sur iPhone ou iPad : bouton Partager, puis
          « Sur l’écran d’accueil ». Sur ordinateur : menu du navigateur, puis « Installer ».
        </p>
        <p className="settings-version">Version 1.0 · {plural(ALL_QUESTIONS.length, 'question')}</p>
      </section>

      <Dialog
        open={resetOpen}
        title="Réinitialiser la progression ?"
        description={`Les ${plural(completed, 'question terminée', 'questions terminées')} et les cartes passées seront retirées de cet appareil. Vos préférences sont conservées.`}
        onClose={() => setResetOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn--quiet" onClick={() => setResetOpen(false)}>
              Annuler
            </button>
            <button type="button" className="btn btn--danger" onClick={confirmReset}>
              Réinitialiser
            </button>
          </>
        }
      />

      <Dialog
        open={importOpen}
        title="Remplacer la progression ?"
        description={
          pending
            ? `Cette sauvegarde contient ${plural(pending.count, 'question terminée', 'questions terminées')}. Elle remplacera la progression actuelle de cet appareil.`
            : undefined
        }
        onClose={() => {
          setImportOpen(false);
          setPending(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => {
                setImportOpen(false);
                setPending(null);
              }}
            >
              Annuler
            </button>
            <button type="button" className="btn btn--primary" onClick={confirmImport}>
              Importer
            </button>
          </>
        }
      />
    </div>
  );
}
