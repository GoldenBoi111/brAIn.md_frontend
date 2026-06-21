export function VaultSkeleton() {
  return (
    <div className="vault-shell vault-shell--skeleton">
      <header className="vault-shell__topbar">
        <span className="vault-shell__title">brAIn.md</span>
      </header>

      <div className="vault-shell__workspace">
        <aside className="vault-shell__skeleton-panel vault-shell__skeleton-panel--sidebar" />
        <div className="vault-shell__skeleton-panel vault-shell__skeleton-panel--editor" />
        <div className="vault-shell__skeleton-panel vault-shell__skeleton-panel--preview" />
      </div>
    </div>
  );
}
