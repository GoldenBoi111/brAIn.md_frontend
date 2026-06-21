"use client";

import { FilePlus } from "lucide-react";
import type { ImperativePanelHandle } from "react-resizable-panels";

import { EditorPane } from "@/components/editor-pane";
import { FileTree } from "@/components/file-tree";
import { PreviewPane } from "@/components/preview-pane";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import type { FileNode, LlmAccess } from "@/types/file-tree";

const SIDEBAR_DEFAULT_SIZE = 18;
const SIDEBAR_MIN_SIZE = 10;
const SIDEBAR_COLLAPSED_SIZE = 0;
const PREVIEW_DEFAULT_SIZE = 50;
const PREVIEW_MIN_SIZE = 25;
const PREVIEW_COLLAPSED_SIZE = 0;

interface ResizableWorkspaceProps {
  vaultName: string;
  fileTree: FileNode[];
  fileName: string | null;
  markdown: string;
  llmAccessLabel?: string | null;
  onMarkdownChange: (value: string) => void;
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onCreateFile: () => void;
  onCreateFileInFolder: (parentFolderId: string | null) => void;
  onCreateFolderInFolder: (parentFolderId: string | null) => void;
  onRenameFile: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onSetLlmAccess: (fileId: string, access: LlmAccess) => void;
  expandFolderId: string | null;
  defaultExpandedIds?: string[];
  sidebarCollapsed: boolean;
  onSidebarCollapsedChange: (collapsed: boolean) => void;
  sidebarRef: React.RefObject<ImperativePanelHandle | null>;
  previewCollapsed: boolean;
  onPreviewCollapsedChange: (collapsed: boolean) => void;
  previewRef: React.RefObject<ImperativePanelHandle | null>;
}

export function ResizableWorkspace({
  vaultName,
  fileTree,
  fileName,
  markdown,
  llmAccessLabel,
  onMarkdownChange,
  selectedFileId,
  onSelectFile,
  onCreateFile,
  onCreateFileInFolder,
  onCreateFolderInFolder,
  onRenameFile,
  onDeleteFile,
  onRenameFolder,
  onDeleteFolder,
  onSetLlmAccess,
  expandFolderId,
  defaultExpandedIds = [],
  sidebarCollapsed,
  onSidebarCollapsedChange,
  sidebarRef,
  previewCollapsed,
  onPreviewCollapsedChange,
  previewRef,
}: ResizableWorkspaceProps) {
  return (
    <ResizablePanelGroup direction="horizontal" className="vault-split h-full">
      <ResizablePanel
        ref={sidebarRef}
        id="sidebar"
        order={1}
        defaultSize={SIDEBAR_DEFAULT_SIZE}
        minSize={sidebarCollapsed ? SIDEBAR_COLLAPSED_SIZE : SIDEBAR_MIN_SIZE}
        collapsedSize={SIDEBAR_COLLAPSED_SIZE}
        collapsible
        onCollapse={() => onSidebarCollapsedChange(true)}
        onExpand={() => onSidebarCollapsedChange(false)}
        className={cn(
          "vault-split__sidebar bg-sidebar",
          sidebarCollapsed && "min-w-0 overflow-hidden",
        )}
      >
        <div className="vault-split__panel">
          <div className="vault-split__panel-head">
            <div className="vault-split__panel-copy">
              <span className="vault-split__panel-kicker">Vault</span>
              <span className="vault-split__panel-title">{vaultName}</span>
            </div>
            <button
              type="button"
              onClick={onCreateFile}
              className="vault-shell__icon-button vault-shell__icon-button--small"
              aria-label="Create new note"
              title="Create new note"
            >
              <FilePlus className="size-3.5" />
            </button>
          </div>
          <FileTree
            nodes={fileTree}
            selectedId={selectedFileId}
            onSelect={onSelectFile}
            onCreateFileInFolder={onCreateFileInFolder}
            onCreateFolderInFolder={onCreateFolderInFolder}
            onRenameFile={onRenameFile}
            onDeleteFile={onDeleteFile}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onSetLlmAccess={onSetLlmAccess}
            defaultExpandedIds={defaultExpandedIds}
            expandFolderId={expandFolderId}
          />
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel id="workspace" order={2} defaultSize={85} minSize={50}>
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            id="editor"
            order={1}
            defaultSize={previewCollapsed ? 100 : PREVIEW_DEFAULT_SIZE}
            minSize={25}
            className="vault-split__editor"
          >
            <EditorPane
              fileName={fileName}
              value={markdown}
              llmAccessLabel={llmAccessLabel}
              onChange={onMarkdownChange}
            />
          </ResizablePanel>

          {!previewCollapsed && <ResizableHandle />}

          <ResizablePanel
            ref={previewRef}
            id="preview"
            order={2}
            defaultSize={previewCollapsed ? 0 : PREVIEW_DEFAULT_SIZE}
            minSize={previewCollapsed ? PREVIEW_COLLAPSED_SIZE : PREVIEW_MIN_SIZE}
            collapsedSize={PREVIEW_COLLAPSED_SIZE}
            collapsible
            onCollapse={() => onPreviewCollapsedChange(true)}
            onExpand={() => onPreviewCollapsedChange(false)}
            className={cn("vault-split__preview", previewCollapsed && "min-w-0 overflow-hidden")}
          >
            <PreviewPane fileName={fileName} content={markdown} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
