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
import { usePreviewControls, useSidebarControls } from "@/hooks/use-panel-controls";
import { useVaultTree } from "@/hooks/use-vault-tree";
import { getLlmAccess, getLlmAccessLabel } from "@/lib/llm-access";
import { cn } from "@/lib/utils";
import { findFileNode, getFirstSelectableFileId, resolveCreateParentId } from "@/lib/vault";
import {
  ROOT_VAULT_ID,
  buildChildNamePath,
  createVaultItem,
  deleteVaultItem,
  fetchVaultFile,
  resolveNodePath,
  updateVaultItem,
} from "@/lib/vault-api";
import type { FileNode } from "@/types/file-tree";

const NEW_FILE_TEMPLATE = "# New note\n\nStart writing...";

function getVisibleVaultTree(fileTree: FileNode[], folderId: string): FileNode[] {
  const vaultFolder = findFileNode(fileTree, folderId);
  if (!vaultFolder || vaultFolder.type !== "folder") {
    return [];
  }

  return [vaultFolder];
}

function getInitialSelection(nodes: FileNode[]): string | null {
  return getFirstSelectableFileId(nodes);
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
  const { tree: fileTree, loading, error, refresh } = useVaultTree();

  const [commandOpen, setCommandOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = useState(false);
  const [tokenAccessOpen, setTokenAccessOpen] = useState(false);
  const [tokenAccessMode, setTokenAccessMode] = useState<"locked" | "readOnly">("locked");
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [createParentFolderId, setCreateParentFolderId] = useState<string | null>(null);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [expandFolderId, setExpandFolderId] = useState<string | null>(folderId);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});

  const visibleTree = useMemo(
    () => getVisibleVaultTree(fileTree, folderId),
    [fileTree, folderId],
  );
  const visibleFolder = visibleTree[0] ?? null;

  useEffect(() => {
    if (!visibleTree.length) return;

    setSelectedFileId((current) => {
      if (current && findFileNode(visibleTree, current)?.type === "file") {
        return current;
      }
      return getInitialSelection(visibleTree);
    });
  }, [visibleTree]);

  const selectedFile = useMemo(
    () => (selectedFileId ? findFileNode(visibleTree, selectedFileId) : null),
    [selectedFileId, visibleTree],
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
    selectedFile?.type === "file" && selectedFileId
      ? resolveNodePath(fileTree, selectedFileId)
      : null;

  useEffect(() => {
    const loadSelectedContent = async () => {
      if (!selectedFileId || !selectedFile || selectedFile.type !== "file") return;

      if (fileContents[selectedFileId] !== undefined) return;

      try {
        const response = await fetchVaultFile(selectedFileId);
        const content =
          typeof response === "object" && response !== null && "content" in response
            ? String((response as { content?: unknown }).content ?? "")
            : "";
        setFileContents((current) => ({ ...current, [selectedFileId]: content }));
      } catch {
        setFileContents((current) => ({ ...current, [selectedFileId]: "" }));
      }
    };

    void loadSelectedContent();
  }, [fileContents, selectedFile, selectedFileId]);

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  const handleSelectFile = useCallback(
    (id: string) => {
      const file = findFileNode(visibleTree, id);
      if (!file || file.type !== "file") return;
      setSelectedFileId(id);
    },
    [visibleTree],
  );

  const handleMarkdownChange = useCallback(
    (value: string) => {
      if (!selectedFileId) return;
      setFileContents((prev) => ({ ...prev, [selectedFileId]: value }));
    },
    [selectedFileId],
  );

  const handleSaveMarkdown = useCallback(async () => {
    if (!selectedFileId || !selectedFile || selectedFile.type !== "file") return;

    await updateVaultItem(selectedFileId, {
      content: fileContents[selectedFileId] ?? "",
    });
    refresh();
  }, [fileContents, refresh, selectedFile, selectedFileId]);

  const openCreateDialog = useCallback((parentFolderId: string | null) => {
    setCreateParentFolderId(parentFolderId);
    setCreateDialogOpen(true);
  }, []);

  const openCreateFolderDialog = useCallback((parentFolderId: string | null) => {
    setCreateFolderParentId(parentFolderId);
    setCreateFolderDialogOpen(true);
  }, []);

  const handleExplorerCreate = useCallback(() => {
    openCreateDialog(resolveCreateParentId(visibleTree, selectedFileId));
  }, [openCreateDialog, selectedFileId, visibleTree]);

  const handleCreateFile = useCallback(
    async (rawName: string, parentFolderId: string | null) => {
      const path = buildChildNamePath(fileTree, parentFolderId ?? ROOT_VAULT_ID, rawName, "file");
      const response = await createVaultItem({
        kind: "file",
        path,
        content: NEW_FILE_TEMPLATE,
      });

      const nextId =
        typeof response === "object" && response !== null && "file_id" in response
          ? String((response as { file_id?: unknown }).file_id ?? "")
          : "";

      if (nextId) {
        setSelectedFileId(nextId);
        setFileContents((current) => ({ ...current, [nextId]: NEW_FILE_TEMPLATE }));
      }

      if (parentFolderId) {
        setExpandFolderId(parentFolderId);
      }

      refresh();
    },
    [fileTree, refresh],
  );

  const handleCreateFolder = useCallback(
    async (rawName: string, parentFolderId: string | null) => {
      const path = buildChildNamePath(
        fileTree,
        parentFolderId ?? ROOT_VAULT_ID,
        rawName,
        "folder",
      );

      const response = await createVaultItem({ kind: "folder", path });
      const nextId =
        typeof response === "object" && response !== null && "folder_id" in response
          ? String((response as { folder_id?: unknown }).folder_id ?? "")
          : "";

      if (parentFolderId) {
        setExpandFolderId(parentFolderId);
      } else if (nextId) {
        setExpandFolderId(nextId);
      }

      refresh();
    },
    [fileTree, refresh],
  );

  const handleDeleteFile = useCallback(
    async (fileId: string) => {
      const file = findFileNode(fileTree, fileId);
      if (!file || file.type !== "file") return;

      await deleteVaultItem(fileId);
      setFileContents((prev) => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });

      if (selectedFileId === fileId) {
        setSelectedFileId(getInitialSelection(visibleTree));
      }

      refresh();
    },
    [fileTree, refresh, selectedFileId, visibleTree],
  );

  const openRenameDialog = useCallback((fileId: string) => {
    setRenameFileId(fileId);
    setRenameDialogOpen(true);
  }, []);

  const handleRenameFile = useCallback(
    async (rawName: string) => {
      if (!renameFileId) return;

      const file = findFileNode(fileTree, renameFileId);
      if (!file || file.type !== "file") return;

      const newPath = buildChildNamePath(fileTree, resolveCreateParentId(fileTree, renameFileId), rawName, "file");
      await updateVaultItem(renameFileId, { path: newPath });
      refresh();
    },
    [fileTree, renameFileId, refresh],
  );

  const openRenameFolderDialog = useCallback((folderId: string) => {
    setRenameFolderId(folderId);
    setRenameFolderDialogOpen(true);
  }, []);

  const handleRenameFolder = useCallback(
    async (rawName: string) => {
      if (!renameFolderId || renameFolderId === ROOT_VAULT_ID) return;

      const folder = findFileNode(fileTree, renameFolderId);
      if (!folder || folder.type !== "folder") return;

      const parentFolderId = resolveCreateParentId(fileTree, renameFolderId);
      const newPath = buildChildNamePath(fileTree, parentFolderId ?? ROOT_VAULT_ID, rawName, "folder");
      await updateVaultItem(renameFolderId, { path: newPath });
      refresh();
    },
    [fileTree, refresh, renameFolderId],
  );

  const handleDeleteFolder = useCallback(
    async (folderIdValue: string) => {
      if (folderIdValue === ROOT_VAULT_ID) return;

      const folder = findFileNode(fileTree, folderIdValue);
      if (!folder || folder.type !== "folder") {
        return;
      }

      await deleteVaultItem(folderIdValue);
      if (selectedFileId && findFileNode([folder], selectedFileId)) {
        setSelectedFileId(getInitialSelection(visibleTree));
      }

      refresh();

      if (folderIdValue === folderId) {
        router.replace("/dashboard");
      }
    },
    [fileTree, folderId, refresh, router, selectedFileId, visibleTree],
  );

  const renameFolderName =
    renameFolderId ? (findFileNode(fileTree, renameFolderId)?.name ?? "") : "";

  const renameFileName = renameFileId ? (findFileNode(fileTree, renameFileId)?.name ?? "") : "";

  const vaultName = visibleFolder?.name ?? "Vault";

  const isReady = !loading && Boolean(visibleFolder);

  if (loading) {
    return (
      <div className="vault-shell vault-shell--empty">
        <div className="vault-shell__empty-card">
          <p className="text-sm text-muted-foreground">Loading vault from API...</p>
        </div>
      </div>
    );
  }

  if (error || !isReady) {
    return (
      <div className="vault-shell vault-shell--empty">
        <div className="vault-shell__empty-card">
          <p className="text-sm text-muted-foreground">
            {error ?? "This vault could not be found."}
          </p>
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
          <span className="vault-shell__title">{vaultName}</span>
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
            title="AI read-only - LLM can read but not edit this note"
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
            title="Hidden from AI - LLM cannot read or edit this note"
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
              Cmd K
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
          fileTree={visibleTree}
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
          fileTree={visibleTree}
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
          fileTree={visibleTree}
          onCreate={handleCreateFile}
        />
      ) : null}

      {createFolderDialogOpen ? (
        <CreateFolderDialog
          open={createFolderDialogOpen}
          onOpenChange={setCreateFolderDialogOpen}
          parentFolderId={createFolderParentId}
          fileTree={visibleTree}
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
