import { useState } from 'react';
import { Download } from 'lucide-react';
import { useProgress } from '../store/progress';
import { Mark } from '../components/Mark';
import { Dialog } from '../components/Dialog';

export function IncompatibleScreen() {
  const { rawStored, actions } = useProgress();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function downloadRaw() {
    if (!rawStored) return;
    const blob = new Blob([rawStored], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'a-deux-sauvegarde-brute.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="narrow gate">
      <span className="gate__mark">
        <Mark size={36} />
      </span>

      <p className="eyebrow">Progression plus récente</p>
      <h1 className="page-title">Cette version ne touchera à rien.</h1>
      <p className="lede">
        Ce navigateur contient une progression enregistrée par une version plus récente de à deux.
        Pour éviter de l’écraser, cette version ne la modifiera pas.
      </p>

      <div className="panel__actions">
        <button type="button" className="btn btn--quiet" onClick={downloadRaw}>
          <Download size={15} strokeWidth={1.7} aria-hidden="true" />
          Télécharger la sauvegarde
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setConfirmOpen(true)}>
          Démarrer avec une progression vide
        </button>
      </div>

      <Dialog
        open={confirmOpen}
        title="Repartir de zéro ?"
        description="La progression enregistrée par la version plus récente sera conservée dans une copie de sauvegarde du navigateur, puis une progression vide sera utilisée."
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn--quiet" onClick={() => setConfirmOpen(false)}>
              Annuler
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                actions.discardIncompatible();
                setConfirmOpen(false);
              }}
            >
              Continuer
            </button>
          </>
        }
      />
    </div>
  );
}
