"use client";

import { useCallback, useMemo, useState } from "react";
import { PanelLeft, PanelRight, Search } from "lucide-react";

import { CommandPalette } from "@/components/command-palette";
import { CreateFileDialog } from "@/components/create-file-dialog";
import { CreateFolderDialog } from "@/components/create-folder-dialog";
import { RenameFileDialog } from "@/components/rename-file-dialog";
import { RenameFolderDialog } from "@/components/rename-folder-dialog";
import { ResizableWorkspace } from "@/components/resizable-workspace";
import {
  usePreviewControls,
  useSidebarControls,
} from "@/hooks/use-panel-controls";
import {
  DEFAULT_FILE_ID,
  MOCK_FILE_CONTENTS,
  MOCK_FILE_TREE,
} from "@/lib/mock-data";
import {
  collectFileIdsInSubtree,
  createFileInTree,
  createFolderInTree,
  findFileNode,
  folderContainsRestricted,
  getFirstSelectableFileId,
  removeFileFromTree,
  removeFolderFromTree,
  renameFileInTree,
  renameFolderInTree,
  resolveCreateParentId,
} from "@/lib/vault";

const NEW_FILE_TEMPLATE = "# New note\n\nStart writing...";

export function AppShell() {
  const { sidebarRef, sidebarCollapsed, setSidebarCollapsed, toggleSidebar } =
    useSidebarControls();
  const { previewRef, previewCollapsed, setPreviewCollapsed, togglePreview } =
    usePreviewControls();
  const [commandOpen, setCommandOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = useState(false);
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [createParentFolderId, setCreateParentFolderId] = useState<string | null>(
    null,
  );
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(
    null,
  );
  const [expandFolderId, setExpandFolderId] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState(() => MOCK_FILE_TREE);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(
    DEFAULT_FILE_ID,
  );
  const [fileContents, setFileContents] = useState<Record<string, string>>(
    () => ({ ...MOCK_FILE_CONTENTS }),
  );

  const selectedFile = useMemo(
    () => (selectedFileId ? findFileNode(fileTree, selectedFileId) : null),
    [fileTree, selectedFileId],
  );

  const markdown = selectedFileId ? (fileContents[selectedFileId] ?? "") : "";
  const fileName = selectedFile?.type === "file" ? selectedFile.name : null;
  const readOnly = selectedFile?.restricted ?? false;

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
      if (!selectedFileId || readOnly) return;
      setFileContents((prev) => ({ ...prev, [selectedFileId]: value }));
    },
    [selectedFileId, readOnly],
  );

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
      if (!file || file.type !== "file" || file.restricted) return;

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
      if (!file || file.type !== "file" || file.restricted) return;

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
      if (!folder || folder.type !== "folder" || folder.restricted) return;

      setFileTree(renameFolderInTree(fileTree, renameFolderId, rawName));
    },
    [fileTree, renameFolderId],
  );

  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      const folder = findFileNode(fileTree, folderId);
      if (
        !folder ||
        folder.type !== "folder" ||
        folder.restricted ||
        folderContainsRestricted(folder)
      ) {
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

  const renameFolderName =
    renameFolderId ? (findFileNode(fileTree, renameFolderId)?.name ?? "") : "";

  const renameFileName =
    renameFileId ? (findFileNode(fileTree, renameFileId)?.name ?? "") : "";

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-border/60 bg-sidebar px-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleSidebar}
            className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className="size-4" />
          </button>
          <span className="ml-1 text-sm font-semibold tracking-tight">
            brAIn.md
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="inline-flex h-7 items-center gap-2 rounded-md border border-border/60 bg-background/50 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
            className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            aria-label={previewCollapsed ? "Show preview" : "Hide preview"}
          >
            <PanelRight className="size-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <ResizableWorkspace
          fileTree={fileTree}
          fileName={fileName}
          markdown={markdown}
          readOnly={readOnly}
          onMarkdownChange={handleMarkdownChange}
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
          sidebarCollapsed={sidebarCollapsed}
          onSidebarCollapsedChange={setSidebarCollapsed}
          sidebarRef={sidebarRef}
          previewCollapsed={previewCollapsed}
          onPreviewCollapsedChange={setPreviewCollapsed}
          previewRef={previewRef}
        />
      </div>

      {commandOpen ? (
        <CommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          fileTree={fileTree}
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
