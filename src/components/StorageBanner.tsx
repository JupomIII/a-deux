import { AlertCircle, X } from 'lucide-react';
import type { StorageStatus } from '../lib/storage';

const MESSAGES: Partial<Record<StorageStatus, string>> = {
  corrupt:
    'La progression enregistrée était illisible. Une copie a été conservée et l’application repart d’une progression vide.',
  quota:
    'Le stockage de ce navigateur est plein. La progression ne peut plus être enregistrée : pensez à l’exporter.',
  unavailable:
    'Ce navigateur n’autorise pas l’enregistrement local. L’application fonctionne, mais la progression sera perdue à la fermeture.',
  future: 'Une progression enregistrée par une version plus récente est présente dans ce navigateur.',
};

export function StorageBanner({
  status,
  onDismiss,
}: {
  status: StorageStatus;
  onDismiss: () => void;
}) {
  const message = MESSAGES[status];
  if (!message) return null;

  return (
    <div className="banner" role="status">
      <AlertCircle size={17} strokeWidth={1.6} aria-hidden="true" />
      <p className="banner__text">
        {message}{' '}
        <a className="banner__link" href="#/settings">
          Voir les données
        </a>
      </p>
      <button type="button" className="banner__close" onClick={onDismiss} aria-label="Masquer ce message">
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
