"use client";

import { useEffect, useRef } from "react";
import {
  Bot,
  Check,
  EyeOff,
  FilePlus,
  FolderPlus,
  Lock,
  Pencil,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { LlmAccess } from "@/types/file-tree";

interface FileTreeContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  label: string;
  fileName: string | null;
  folderName: string | null;
  fileLlmAccess: LlmAccess | null;
  onClose: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onRenameFile: () => void;
  onDeleteFile: () => void;
  onRenameFolder: () => void;
  onDeleteFolder: () => void;
  onSetLlmAccess: (access: LlmAccess) => void;
}

const LLM_ACCESS_OPTIONS: {
  access: LlmAccess;
  label: string;
  icon: typeof Bot;
}[] = [
  { access: "default", label: "Default", icon: Bot },
  { access: "no_write", label: "Read-only for AI", icon: Lock },
  { access: "hidden", label: "Hidden from AI", icon: EyeOff },
];

export function FileTreeContextMenu({
  open,
  x,
  y,
  label,
  fileName,
  folderName,
  fileLlmAccess,
  onClose,
  onCreateFile,
  onCreateFolder,
  onRenameFile,
  onDeleteFile,
  onRenameFolder,
  onDeleteFolder,
  onSetLlmAccess,
}: FileTreeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const handleScroll = () => onClose();

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, onClose]);

  if (!open) return null;

  const locationSuffix = label ? ` in ${label}` : "";

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-50 min-w-44 overflow-hidden rounded-md border border-border/70",
        "bg-popover p-1 text-popover-foreground shadow-lg",
      )}
      style={{ left: x, top: y }}
      role="menu"
    >
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={() => {
          onCreateFile();
          onClose();
        }}
      >
        <FilePlus className="size-3.5 shrink-0" />
        <span className="min-w-0 truncate">New note{locationSuffix}</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={() => {
          onCreateFolder();
          onClose();
        }}
      >
        <FolderPlus className="size-3.5 shrink-0" />
        <span className="min-w-0 truncate">New folder{locationSuffix}</span>
      </button>

      {fileName && (
        <>
          <div className="my-1 h-px bg-border/70" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              onRenameFile();
              onClose();
            }}
          >
            <Pencil className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate">Rename {fileName}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] text-destructive transition-colors hover:bg-destructive/10"
            onClick={() => {
              onDeleteFile();
              onClose();
            }}
          >
            <Trash2 className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate">Delete {fileName}</span>
          </button>

          <div className="my-1 h-px bg-border/70" />
          <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            AI access
          </p>
          {LLM_ACCESS_OPTIONS.map(({ access, label: optionLabel, icon: Icon }) => {
            const isActive = (fileLlmAccess ?? "default") === access;
            return (
              <button
                key={access}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onSetLlmAccess(access);
                  onClose();
                }}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{optionLabel}</span>
                {isActive && <Check className="size-3.5 shrink-0 opacity-70" />}
              </button>
            );
          })}
        </>
      )}

      {folderName && (
        <>
          <div className="my-1 h-px bg-border/70" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              onRenameFolder();
              onClose();
            }}
          >
            <Pencil className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate">Rename {folderName}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] text-destructive transition-colors hover:bg-destructive/10"
            onClick={() => {
              onDeleteFolder();
              onClose();
            }}
          >
            <Trash2 className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate">Delete {folderName}</span>
          </button>
        </>
      )}
    </div>
  );
}
