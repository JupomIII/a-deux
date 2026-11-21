export function NotFoundPage() {
  return (
    <div className="narrow empty-page">
      <p className="eyebrow">Introuvable</p>
      <h1 className="page-title">Cette page n’existe pas.</h1>
      <p className="lede">Le lien est peut-être incomplet, ou la catégorie a été renommée.</p>
      <p>
        <a className="btn btn--primary" href="#/">
          Retour à l’accueil
        </a>
      </p>
    </div>
  );
}
