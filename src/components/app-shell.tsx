"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, EyeOff, Lock, PanelLeft, PanelRight, Search } from "lucide-react";

import { CommandPalette } from "@/components/command-palette";
import { CreateFileDialog } from "@/components/create-file-dialog";
import { CreateFolderDialog } from "@/components/create-folder-dialog";
import { RenameFileDialog } from "@/components/rename-file-dialog";
import { RenameFolderDialog } from "@/components/rename-folder-dialog";
import { ResizableWorkspace } from "@/components/resizable-workspace";
import { TokenAccessPalette } from "@/components/token-access-palette";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import {
  usePreviewControls,
  useSidebarControls,
} from "@/hooks/use-panel-controls";
import {
  DEFAULT_FILE_ID,
  MOCK_FILE_CONTENTS,
} from "@/lib/mock-data";
import { getLlmAccess, getLlmAccessLabel } from "@/lib/llm-access";
import { getFileTree } from "@/lib/vault-catalog";
import { loadVaultFileContents, saveVaultFileContents } from "@/lib/vault-contents";
import { cn } from "@/lib/utils";
import {
  collectFileIdsInSubtree,
  createFileInTree,
  createFolderInTree,
  findFileNode,
  getFirstSelectableFileId,
  getFilePath,
  removeFileFromTree,
  removeFolderFromTree,
  renameFileInTree,
  renameFolderInTree,
  resolveCreateParentId,
  setFileLlmAccessInTree,
} from "@/lib/vault";
import type { LlmAccess } from "@/types/file-tree";

const NEW_FILE_TEMPLATE = "# New note\n\nStart writing...";

function getVaultInitialState(folderId: string) {
  const fileTree = getFileTree();
  const vaultFolder = findFileNode(fileTree, folderId);

  if (!vaultFolder || vaultFolder.type !== "folder") {
    return {
      tree: fileTree,
      selectedId: DEFAULT_FILE_ID,
      valid: false,
    };
  }

  const tree = [vaultFolder];

  return {
    tree,
    selectedId: getFirstSelectableFileId(tree),
    valid: true,
  };
}

interface AppShellProps {
  folderId: string;
}

export function AppShell({ folderId }: AppShellProps) {
  const router = useRouter();
  const { sidebarRef, sidebarCollapsed, setSidebarCollapsed, toggleSidebar } =
    useSidebarControls();
  const { previewRef, previewCollapsed, setPreviewCollapsed, togglePreview } =
    usePreviewControls();
  const [commandOpen, setCommandOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = useState(false);
  const [tokenAccessOpen, setTokenAccessOpen] = useState(false);
  const [tokenAccessMode, setTokenAccessMode] = useState<"locked" | "readOnly">("locked");
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [createParentFolderId, setCreateParentFolderId] = useState<string | null>(
    null,
  );
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(
    null,
  );
  const [expandFolderId, setExpandFolderId] = useState<string | null>(folderId);
  const initialVaultState = useMemo(
    () => getVaultInitialState(folderId),
    [folderId],
  );
  const [fileTree, setFileTree] = useState(() => initialVaultState.tree);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(
    () => initialVaultState.selectedId,
  );
  const [fileContents, setFileContents] = useState<Record<string, string>>(
    () => ({ ...MOCK_FILE_CONTENTS, ...loadVaultFileContents() }),
  );

  const selectedFile = useMemo(
    () => (selectedFileId ? findFileNode(fileTree, selectedFileId) : null),
    [fileTree, selectedFileId],
  );

  const markdown = selectedFileId ? (fileContents[selectedFileId] ?? "") : "";
  const fileName = selectedFile?.type === "file" ? selectedFile.name : null;
  const llmAccessLabel = useMemo(() => {
    if (selectedFile?.type !== "file") return null;
    const access = getLlmAccess(selectedFile);
    if (access === "default") return null;
    return getLlmAccessLabel(access);
  }, [selectedFile]);

  const selectedFilePath =
    selectedFile?.type === "file" && selectedFileId ? getFilePath(fileTree, selectedFileId) : null;

  const handleSelectFile = useCallback(
    (id: string) => {
      const file = findFileNode(fileTree, id);
      if (!file || file.type !== "file") return;
      setSelectedFileId(id);
    },
    [fileTree],
  );

  const handleMarkdownChange = useCallback(
    (value: string) => {
      if (!selectedFileId) return;
      setFileContents((prev) => ({ ...prev, [selectedFileId]: value }));
    },
    [selectedFileId],
  );

  const handleSaveMarkdown = useCallback(() => {
    saveVaultFileContents(fileContents);
  }, [fileContents]);

  const openCreateDialog = useCallback((parentFolderId: string | null) => {
    setCreateParentFolderId(parentFolderId);
    setCreateDialogOpen(true);
  }, []);

  const openCreateFolderDialog = useCallback((parentFolderId: string | null) => {
    setCreateFolderParentId(parentFolderId);
    setCreateFolderDialogOpen(true);
  }, []);

  const handleExplorerCreate = useCallback(() => {
    openCreateDialog(resolveCreateParentId(fileTree, selectedFileId));
  }, [fileTree, openCreateDialog, selectedFileId]);

  const handleCreateFile = useCallback(
    (rawName: string, parentFolderId: string | null) => {
      const { tree, file } = createFileInTree(fileTree, parentFolderId, rawName);

      setFileTree(tree);
      setFileContents((prev) => ({
        ...prev,
        [file.id]: NEW_FILE_TEMPLATE,
      }));
      setSelectedFileId(file.id);

      if (parentFolderId) {
        setExpandFolderId(parentFolderId);
      }
    },
    [fileTree],
  );

  const handleCreateFolder = useCallback(
    (rawName: string, parentFolderId: string | null) => {
      const { tree, folder } = createFolderInTree(
        fileTree,
        parentFolderId,
        rawName,
      );

      setFileTree(tree);

      if (parentFolderId) {
        setExpandFolderId(parentFolderId);
      } else {
        setExpandFolderId(folder.id);
      }
    },
    [fileTree],
  );

  const handleDeleteFile = useCallback(
    (fileId: string) => {
      const file = findFileNode(fileTree, fileId);
      if (!file || file.type !== "file") return;

      const nextTree = removeFileFromTree(fileTree, fileId);

      setFileTree(nextTree);
      setFileContents((prev) => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });

      if (selectedFileId === fileId) {
        setSelectedFileId(getFirstSelectableFileId(nextTree));
      }
    },
    [fileTree, selectedFileId],
  );

  const openRenameDialog = useCallback((fileId: string) => {
    setRenameFileId(fileId);
    setRenameDialogOpen(true);
  }, []);

  const handleRenameFile = useCallback(
    (rawName: string) => {
      if (!renameFileId) return;

      const file = findFileNode(fileTree, renameFileId);
      if (!file || file.type !== "file") return;

      setFileTree(renameFileInTree(fileTree, renameFileId, rawName));
    },
    [fileTree, renameFileId],
  );

  const openRenameFolderDialog = useCallback((folderId: string) => {
    setRenameFolderId(folderId);
    setRenameFolderDialogOpen(true);
  }, []);

  const handleRenameFolder = useCallback(
    (rawName: string) => {
      if (!renameFolderId) return;

      const folder = findFileNode(fileTree, renameFolderId);
      if (!folder || folder.type !== "folder") return;

      setFileTree(renameFolderInTree(fileTree, renameFolderId, rawName));
    },
    [fileTree, renameFolderId],
  );

  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      const folder = findFileNode(fileTree, folderId);
      if (!folder || folder.type !== "folder") {
        return;
      }

      const removedFileIds = collectFileIdsInSubtree(folder);
      const nextTree = removeFolderFromTree(fileTree, folderId);

      setFileTree(nextTree);
      setFileContents((prev) => {
        const next = { ...prev };
        for (const fileId of removedFileIds) {
          delete next[fileId];
        }
        return next;
      });

      if (selectedFileId && removedFileIds.includes(selectedFileId)) {
        setSelectedFileId(getFirstSelectableFileId(nextTree));
      }
    },
    [fileTree, selectedFileId],
  );

  const handleSetLlmAccess = useCallback(
    (fileId: string, access: LlmAccess) => {
      const file = findFileNode(fileTree, fileId);
      if (!file || file.type !== "file") return;

      setFileTree(setFileLlmAccessInTree(fileTree, fileId, access));
    },
    [fileTree],
  );

  const renameFolderName =
    renameFolderId ? (findFileNode(fileTree, renameFolderId)?.name ?? "") : "";

  const renameFileName =
    renameFileId ? (findFileNode(fileTree, renameFileId)?.name ?? "") : "";

  const vaultName = useMemo(() => {
    const folder = findFileNode(getFileTree(), folderId);
    return folder?.name ?? "Vault";
  }, [folderId]);

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  if (!initialVaultState.valid) {
    return (
      <div className="vault-shell vault-shell--empty">
        <div className="vault-shell__empty-card">
          <p className="text-sm text-muted-foreground">This vault could not be found.</p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to hub
        </Link>
      </div>
    );
  }

  return (
    <div className="vault-shell">
      <header className="vault-shell__topbar">
        <div className="vault-shell__topbar-group">
          <Link
            href="/dashboard"
            className="vault-shell__icon-button"
            aria-label="Back to hub"
            title="Back to hub"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            className="vault-shell__icon-button"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className="size-4" />
          </button>
          <span className="vault-shell__title">
            {vaultName}
          </span>
        </div>

        <div className="vault-shell__topbar-group vault-shell__topbar-group--actions">
          <ThemeToggleButton />
          <button
            type="button"
            onClick={() => {
              setTokenAccessMode("locked");
              setTokenAccessOpen(true);
            }}
            disabled={!selectedFilePath}
            className={cn(
              "vault-shell__icon-button",
              !selectedFilePath && "pointer-events-none opacity-40",
            )}
            aria-label="Open token lock palette"
            aria-pressed={false}
            title="AI read-only — LLM can read but not edit this note"
          >
            <Lock className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setTokenAccessMode("readOnly");
              setTokenAccessOpen(true);
            }}
            disabled={!selectedFilePath}
            className={cn(
              "vault-shell__icon-button",
              !selectedFilePath && "pointer-events-none opacity-40",
            )}
            aria-label="Open token write restriction palette"
            aria-pressed={false}
            title="Hidden from AI — LLM cannot read or edit this note"
          >
            <EyeOff className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="vault-shell__search-button"
          >
            <Search className="size-3.5" />
            <span>Search</span>
            <span className="pointer-events-none hidden rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
              ⌘K
            </span>
          </button>
          <button
            type="button"
            onClick={togglePreview}
            className="vault-shell__icon-button"
            aria-label={previewCollapsed ? "Show preview" : "Hide preview"}
          >
            <PanelRight className="size-4" />
          </button>
        </div>
      </header>

      <div className="vault-shell__workspace">
        <ResizableWorkspace
          fileTree={fileTree}
          fileName={fileName}
          markdown={markdown}
          llmAccessLabel={llmAccessLabel}
          onMarkdownChange={handleMarkdownChange}
          onSaveMarkdown={handleSaveMarkdown}
          canSaveMarkdown={Boolean(selectedFileId)}
          selectedFileId={selectedFileId}
          onSelectFile={handleSelectFile}
          onCreateFile={handleExplorerCreate}
          onCreateFileInFolder={openCreateDialog}
          onCreateFolderInFolder={openCreateFolderDialog}
          onRenameFile={openRenameDialog}
          onDeleteFile={handleDeleteFile}
          onRenameFolder={openRenameFolderDialog}
          onDeleteFolder={handleDeleteFolder}
          onSetLlmAccess={handleSetLlmAccess}
          expandFolderId={expandFolderId}
          defaultExpandedIds={[folderId]}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarCollapsedChange={setSidebarCollapsed}
          sidebarRef={sidebarRef}
          previewCollapsed={previewCollapsed}
          onPreviewCollapsedChange={setPreviewCollapsed}
          previewRef={previewRef}
          vaultName={vaultName}
        />
      </div>

      {tokenAccessOpen ? (
        <TokenAccessPalette
          open={tokenAccessOpen}
          onOpenChange={setTokenAccessOpen}
          mode={tokenAccessMode}
          fileName={fileName}
          filePath={selectedFilePath}
        />
      ) : null}

      {commandOpen ? (
        <CommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          fileTree={fileTree}
          selectedFileId={selectedFileId}
          onSelectFile={handleSelectFile}
          onCreateFile={openCreateDialog}
        />
      ) : null}

      {createDialogOpen ? (
        <CreateFileDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          parentFolderId={createParentFolderId}
          fileTree={fileTree}
          onCreate={handleCreateFile}
        />
      ) : null}

      {createFolderDialogOpen ? (
        <CreateFolderDialog
          open={createFolderDialogOpen}
          onOpenChange={setCreateFolderDialogOpen}
          parentFolderId={createFolderParentId}
          fileTree={fileTree}
          onCreate={handleCreateFolder}
        />
      ) : null}

      {renameDialogOpen && renameFileId ? (
        <RenameFileDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          currentName={renameFileName}
          onRename={handleRenameFile}
        />
      ) : null}

      {renameFolderDialogOpen && renameFolderId ? (
        <RenameFolderDialog
          open={renameFolderDialogOpen}
          onOpenChange={setRenameFolderDialogOpen}
          currentName={renameFolderName}
          onRename={handleRenameFolder}
        />
      ) : null}
    </div>
  );
}
