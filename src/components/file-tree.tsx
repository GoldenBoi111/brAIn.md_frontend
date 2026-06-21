"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Lock,
} from "lucide-react";

import { FileTreeContextMenu } from "@/components/file-tree-context-menu";
import {
  findFileNode,
  folderContainsRestricted,
  getParentFolderId,
} from "@/lib/vault";
import { cn } from "@/lib/utils";
import type { FileNode } from "@/types/file-tree";

interface FileTreeProps {
  nodes: FileNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateFileInFolder: (parentFolderId: string | null) => void;
  onCreateFolderInFolder: (parentFolderId: string | null) => void;
  onRenameFile: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  defaultExpandedIds?: string[];
  expandFolderId?: string | null;
}

interface ContextMenuState {
  x: number;
  y: number;
  parentFolderId: string | null;
  label: string;
  targetFileId: string | null;
  targetFileName: string | null;
  canModifyFile: boolean;
  targetFolderId: string | null;
  targetFolderName: string | null;
  canRenameFolder: boolean;
  canDeleteFolder: boolean;
}

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onNodeContextMenu: (event: React.MouseEvent, node: FileNode) => void;
}

function findFolderName(nodes: FileNode[], folderId: string | null): string {
  if (!folderId) return "";
  const folder = findFileNode(nodes, folderId);
  return folder?.name ?? "";
}

function FileTreeNode({
  node,
  depth,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
  onNodeContextMenu,
}: FileTreeNodeProps) {
  const isFolder = node.type === "folder";
  const isExpanded = isFolder && expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  const handleClick = () => {
    if (isFolder) {
      onToggle(node.id);
      return;
    }
    onSelect(node.id);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        onContextMenu={(event) => onNodeContextMenu(event, node)}
        className={cn(
          "flex w-full items-center gap-1 rounded-sm px-2 py-1 text-left text-[13px] leading-tight transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isSelected &&
            "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder ? (
          <>
            <ChevronRight
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform",
                isExpanded && "rotate-90",
              )}
            />
            {isExpanded ? (
              <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <Folder className="size-3.5 shrink-0 text-muted-foreground" />
            )}
          </>
        ) : (
          <>
            <span className="size-3.5 shrink-0" />
            <FileText className="size-3.5 shrink-0 text-muted-foreground" />
          </>
        )}
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
        {node.restricted && (
          <Lock className="size-3 shrink-0 text-muted-foreground/70" />
        )}
      </button>

      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
              onNodeContextMenu={onNodeContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({
  nodes,
  selectedId,
  onSelect,
  onCreateFileInFolder,
  onCreateFolderInFolder,
  onRenameFile,
  onDeleteFile,
  onRenameFolder,
  onDeleteFolder,
  defaultExpandedIds = [],
  expandFolderId = null,
}: FileTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpandedIds),
  );
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    if (!expandFolderId) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(expandFolderId);
      return next;
    });
  }, [expandFolderId]);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: FileNode) => {
      event.preventDefault();
      event.stopPropagation();

      const parentFolderId =
        node.type === "folder" ? node.id : getParentFolderId(nodes, node.id);
      const label =
        node.type === "folder"
          ? node.name
          : findFolderName(nodes, parentFolderId);

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        parentFolderId,
        label,
        targetFileId: node.type === "file" ? node.id : null,
        targetFileName: node.type === "file" ? node.name : null,
        canModifyFile: node.type === "file" && !node.restricted,
        targetFolderId: node.type === "folder" ? node.id : null,
        targetFolderName: node.type === "folder" ? node.name : null,
        canRenameFolder: node.type === "folder" && !node.restricted,
        canDeleteFolder:
          node.type === "folder" &&
          !node.restricted &&
          !folderContainsRestricted(node),
      });
    },
    [nodes],
  );

  const handleBackgroundContextMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) return;

      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        parentFolderId: null,
        label: "",
        targetFileId: null,
        targetFileName: null,
        canModifyFile: false,
        targetFolderId: null,
        targetFolderName: null,
        canRenameFolder: false,
        canDeleteFolder: false,
      });
    },
    [],
  );

  return (
    <>
      <nav
        className="scrollbar-thin flex-1 overflow-y-auto py-1"
        aria-label="File explorer"
        onContextMenu={handleBackgroundContextMenu}
      >
        {nodes.map((node) => (
          <FileTreeNode
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onSelect={onSelect}
            onToggle={handleToggle}
            onNodeContextMenu={handleNodeContextMenu}
          />
        ))}
      </nav>

      <FileTreeContextMenu
        open={contextMenu !== null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        label={contextMenu?.label ?? ""}
        fileName={contextMenu?.targetFileName ?? null}
        folderName={contextMenu?.targetFolderName ?? null}
        canModifyFile={contextMenu?.canModifyFile ?? false}
        canRenameFolder={contextMenu?.canRenameFolder ?? false}
        canDeleteFolder={contextMenu?.canDeleteFolder ?? false}
        onClose={() => setContextMenu(null)}
        onCreateFile={() => {
          if (!contextMenu) return;
          onCreateFileInFolder(contextMenu.parentFolderId);
        }}
        onCreateFolder={() => {
          if (!contextMenu) return;
          onCreateFolderInFolder(contextMenu.parentFolderId);
        }}
        onRenameFile={() => {
          if (!contextMenu?.targetFileId) return;
          onRenameFile(contextMenu.targetFileId);
        }}
        onDeleteFile={() => {
          if (!contextMenu?.targetFileId) return;
          onDeleteFile(contextMenu.targetFileId);
        }}
        onRenameFolder={() => {
          if (!contextMenu?.targetFolderId) return;
          onRenameFolder(contextMenu.targetFolderId);
        }}
        onDeleteFolder={() => {
          if (!contextMenu?.targetFolderId) return;
          onDeleteFolder(contextMenu.targetFolderId);
        }}
      />
    </>
  );
}
