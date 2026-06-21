"use client";

import { useEffect, useMemo } from "react";
import {
  Bot,
  EyeOff,
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
import {
  canLlmRead,
  canLlmWrite,
  collectLlmReadableFiles,
  getLlmAccess,
} from "@/lib/llm-access";
import { collectFiles, collectFolders, findFileNode, getFilePath } from "@/lib/vault";
import type { FileNode } from "@/types/file-tree";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileTree: FileNode[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onCreateFile: (parentFolderId: string | null) => void;
}

function FilePolicyIcon({ file }: { file: FileNode }) {
  const access = getLlmAccess(file);
  if (access === "hidden") return <EyeOff />;
  if (access === "no_write") return <Lock />;
  return <FileText />;
}

export function CommandPalette({
  open,
  onOpenChange,
  fileTree,
  selectedFileId,
  onSelectFile,
  onCreateFile,
}: CommandPaletteProps) {
  const vaultFolders = collectFolders(fileTree);
  const llmReadableCount = collectLlmReadableFiles(fileTree).length;

  const selectedFile = useMemo(
    () => (selectedFileId ? findFileNode(fileTree, selectedFileId) : null),
    [fileTree, selectedFileId],
  );

  const canSummarize =
    selectedFile?.type === "file" && canLlmRead(selectedFile);
  const canImproveWriting =
    selectedFile?.type === "file" && canLlmWrite(selectedFile);
  const canAskAboutVault = llmReadableCount > 0;

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
          {collectFiles(fileTree).map((file) => {
            const path = getFilePath(fileTree, file.id);
            return (
              <CommandItem
                key={file.id}
                value={path ?? file.name}
                onSelect={() => handleFileSelect(file.id)}
              >
                <FilePolicyIcon file={file} />
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
          <CommandItem disabled={!canSummarize}>
            <Sparkles />
            <span>Summarize current note</span>
          </CommandItem>
          <CommandItem disabled={!canImproveWriting}>
            <Wand2 />
            <span>Improve writing</span>
          </CommandItem>
          <CommandItem disabled={!canAskAboutVault}>
            <Bot />
            <span>Ask about vault</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
