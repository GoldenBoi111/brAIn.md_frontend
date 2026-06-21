export function VaultSkeleton() {
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-10 shrink-0 items-center border-b border-border/60 bg-sidebar px-3">
        <span className="text-sm font-semibold tracking-tight">brAIn.md</span>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-60 shrink-0 border-r border-border/60 bg-sidebar" />
        <div className="flex min-w-0 flex-1">
          <div className="min-w-0 flex-1 border-r border-border/60 bg-background" />
          <div className="min-w-0 flex-1 bg-background" />
        </div>
      </div>
    </div>
  );
}
