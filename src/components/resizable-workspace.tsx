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
    <ResizablePanelGroup direction="horizontal" className="h-full">
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
          "bg-sidebar",
          sidebarCollapsed && "min-w-0 overflow-hidden",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-8 shrink-0 items-center justify-between px-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Explorer
            </span>
            <button
              type="button"
              onClick={onCreateFile}
              className="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
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
            className={cn(previewCollapsed && "min-w-0 overflow-hidden")}
          >
            <PreviewPane fileName={fileName} content={markdown} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
