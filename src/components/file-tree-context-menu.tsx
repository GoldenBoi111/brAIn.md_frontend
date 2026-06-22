"use client";

import { useEffect, useRef } from "react";
import { FilePlus, FolderPlus, Pencil, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface FileTreeContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  label: string;
  fileName: string | null;
  folderName: string | null;
  onClose: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onRenameFile: () => void;
  onDeleteFile: () => void;
  onRenameFolder: () => void;
  onDeleteFolder: () => void;
}

export function FileTreeContextMenu({
  open,
  x,
  y,
  label,
  fileName,
  folderName,
  onClose,
  onCreateFile,
  onCreateFolder,
  onRenameFile,
  onDeleteFile,
  onRenameFolder,
  onDeleteFolder,
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
