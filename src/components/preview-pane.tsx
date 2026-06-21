"use client";

import { renderMarkdownPreview } from "@/lib/markdown";

interface PreviewPaneProps {
  fileName: string | null;
  content: string;
}

export function PreviewPane({ fileName, content }: PreviewPaneProps) {
  const html = renderMarkdownPreview(content);

  return (
    <div className="vault-pane vault-pane--preview flex h-full flex-col">
      <header className="vault-pane__header flex h-9 shrink-0 items-center gap-2 border-b border-border/60 px-3">
        <span className="text-xs font-medium text-muted-foreground">Preview</span>
        {fileName && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="truncate text-xs text-foreground">{fileName}</span>
          </>
        )}
      </header>
      {content ? (
        <article
          className="vault-pane__body markdown-preview scrollbar-thin flex-1 overflow-y-auto p-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="vault-pane__empty flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
          Select a file to preview
        </div>
      )}
    </div>
  );
}
