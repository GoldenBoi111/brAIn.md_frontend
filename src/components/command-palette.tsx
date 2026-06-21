"use client";

import { useEffect } from "react";
import {
  Bot,
  FilePlus,
  FileText,
  Folder,
  Lock,
  Search,
  Sparkles,
  Wand2,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { collectFiles, collectFolders, getFilePath } from "@/lib/vault";
import type { FileNode } from "@/types/file-tree";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileTree: FileNode[];
  onSelectFile: (id: string) => void;
  onCreateFile: (parentFolderId: string | null) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  fileTree,
  onSelectFile,
  onCreateFile,
}: CommandPaletteProps) {
  const vaultFiles = collectFiles(fileTree);
  const vaultFolders = collectFolders(fileTree);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "n") {
        event.preventDefault();
        onCreateFile(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange, onCreateFile]);

  const handleFileSelect = (id: string) => {
    onSelectFile(id);
    onOpenChange(false);
  };

  const handleCreate = (parentFolderId: string | null) => {
    onCreateFile(parentFolderId);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Search Files">
          <CommandItem>
            <Search />
            <span>Search in vault...</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          {vaultFiles.map((file) => {
            const path = getFilePath(fileTree, file.id);
            return (
              <CommandItem
                key={file.id}
                value={path ?? file.name}
                onSelect={() => handleFileSelect(file.id)}
              >
                {file.restricted ? <Lock /> : <FileText />}
                <span>{path ?? file.name}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Create File">
          <CommandItem onSelect={() => handleCreate(null)}>
            <FilePlus />
            <span>New note</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          {vaultFolders.map((folder) => {
            const path = getFilePath(fileTree, folder.id);
            return (
              <CommandItem
                key={folder.id}
                value={`new-note-${path ?? folder.name}`}
                onSelect={() => handleCreate(folder.id)}
              >
                <Folder />
                <span>New note in {path ?? folder.name}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="AI Actions">
          <CommandItem>
            <Sparkles />
            <span>Summarize current note</span>
          </CommandItem>
          <CommandItem>
            <Wand2 />
            <span>Improve writing</span>
          </CommandItem>
          <CommandItem>
            <Bot />
            <span>Ask about vault</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
