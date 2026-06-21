"use client";

interface EditorPaneProps {
  fileName: string | null;
  value: string;
  llmAccessLabel?: string | null;
  onChange: (value: string) => void;
  onSave?: () => void;
  canSave?: boolean;
}

export function EditorPane({
  fileName,
  value,
  llmAccessLabel,
  onChange,
  onSave,
  canSave = true,
}: EditorPaneProps) {
  return (
    <div className="vault-pane vault-pane--editor flex h-full flex-col">
      <header className="vault-pane__header flex h-9 shrink-0 items-center gap-2 border-b border-border/60 px-3">
        <span className="text-xs font-medium text-muted-foreground">Editor</span>
        {fileName && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="truncate text-xs text-foreground">{fileName}</span>
          </>
        )}
        {llmAccessLabel && (
          <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {llmAccessLabel}
          </span>
        )}
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="ml-2 rounded border border-border/60 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save
          </button>
        )}
      </header>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        className="vault-pane__body scrollbar-thin flex-1 resize-none bg-transparent p-4 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
        placeholder="Select a file from the explorer..."
      />
    </div>
  );
}
