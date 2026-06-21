import type { FileNode, LlmAccess } from "@/types/file-tree";

export function findFileNode(
  nodes: FileNode[],
  id: string,
): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findFileNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function getFilePath(nodes: FileNode[], id: string): string | null {
  const path: string[] = [];

  function walk(current: FileNode[], targetId: string): boolean {
    for (const node of current) {
      path.push(node.name);
      if (node.id === targetId) return true;
      if (node.children && walk(node.children, targetId)) return true;
      path.pop();
    }
    return false;
  }

  return walk(nodes, id) ? path.join(" / ") : null;
}

export function collectFileIds(nodes: FileNode[]): string[] {
  const ids: string[] = [];

  function walk(current: FileNode[]) {
    for (const node of current) {
      if (node.type === "file") ids.push(node.id);
      if (node.children) walk(node.children);
    }
  }

  walk(nodes);
  return ids;
}

export function collectFiles(nodes: FileNode[]): FileNode[] {
  const files: FileNode[] = [];

  function walk(current: FileNode[]) {
    for (const node of current) {
      if (node.type === "file") files.push(node);
      if (node.children) walk(node.children);
    }
  }

  walk(nodes);
  return files;
}

export function collectFolders(nodes: FileNode[]): FileNode[] {
  const folders: FileNode[] = [];

  function walk(current: FileNode[]) {
    for (const node of current) {
      if (node.type === "folder") {
        folders.push(node);
        if (node.children) walk(node.children);
      }
    }
  }

  walk(nodes);
  return folders;
}

export function getParentFolderId(
  nodes: FileNode[],
  nodeId: string,
): string | null {
  function walk(current: FileNode[], parentId: string | null): string | null {
    for (const node of current) {
      if (node.id === nodeId) return parentId;
      if (node.children) {
        const found = walk(node.children, node.type === "folder" ? node.id : parentId);
        if (found !== null) return found;
      }
    }
    return null;
  }

  return walk(nodes, null);
}

export function resolveCreateParentId(
  nodes: FileNode[],
  selectedId: string | null,
): string | null {
  if (!selectedId) return null;

  const selected = findFileNode(nodes, selectedId);
  if (!selected) return null;
  if (selected.type === "folder") return selected.id;

  return getParentFolderId(nodes, selectedId);
}

function getSiblingFileNames(
  nodes: FileNode[],
  parentId: string | null,
): string[] {
  if (parentId === null) {
    return nodes.filter((node) => node.type === "file").map((node) => node.name);
  }

  const parent = findFileNode(nodes, parentId);
  if (!parent?.children) return [];

  return parent.children
    .filter((node) => node.type === "file")
    .map((node) => node.name);
}

export function normalizeFileName(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "Untitled.md";

  const withoutExtension = trimmed.toLowerCase().endsWith(".md")
    ? trimmed.slice(0, -3)
    : trimmed;

  const safeName = withoutExtension.replace(/[\\/:*?"<>|]/g, "").trim();
  return `${safeName || "Untitled"}.md`;
}

export function generateUniqueFileName(
  nodes: FileNode[],
  parentId: string | null,
  baseName = "Untitled",
): string {
  const siblings = getSiblingFileNames(nodes, parentId);
  const normalizedBase = normalizeFileName(baseName).replace(/\.md$/, "");

  let candidate = `${normalizedBase}.md`;
  let counter = 2;

  while (siblings.includes(candidate)) {
    candidate = `${normalizedBase} ${counter}.md`;
    counter += 1;
  }

  return candidate;
}

export function createFileId(): string {
  return `file-${crypto.randomUUID()}`;
}

export function insertFileNode(
  nodes: FileNode[],
  parentId: string | null,
  file: FileNode,
): FileNode[] {
  if (parentId === null) {
    return [...nodes, file];
  }

  return nodes.map((node) => {
    if (node.id === parentId && node.type === "folder") {
      return {
        ...node,
        children: [...(node.children ?? []), file],
      };
    }

    if (node.children) {
      return {
        ...node,
        children: insertFileNode(node.children, parentId, file),
      };
    }

    return node;
  });
}

export function createFileInTree(
  nodes: FileNode[],
  parentId: string | null,
  rawName: string,
): { tree: FileNode[]; file: FileNode } {
  const name = generateUniqueFileName(nodes, parentId, rawName);
  const file: FileNode = {
    id: createFileId(),
    name,
    type: "file",
  };

  return {
    tree: insertFileNode(nodes, parentId, file),
    file,
  };
}

export function removeFileFromTree(
  nodes: FileNode[],
  fileId: string,
): FileNode[] {
  return nodes
    .filter((node) => node.id !== fileId)
    .map((node) => {
      if (!node.children) return node;

      return {
        ...node,
        children: removeFileFromTree(node.children, fileId),
      };
    });
}

export function getFirstSelectableFileId(nodes: FileNode[]): string | null {
  const files = collectFiles(nodes);
  return files[0]?.id ?? null;
}

export function setFileLlmAccessInTree(
  nodes: FileNode[],
  fileId: string,
  access: LlmAccess,
): FileNode[] {
  return nodes.map((node) => {
    if (node.id === fileId && node.type === "file") {
      if (access === "default") {
        const next = { ...node };
        delete next.llmAccess;
        return next;
      }
      return { ...node, llmAccess: access };
    }

    if (node.children) {
      return {
        ...node,
        children: setFileLlmAccessInTree(node.children, fileId, access),
      };
    }

    return node;
  });
}

export function generateRenamedFileName(
  nodes: FileNode[],
  fileId: string,
  rawName: string,
): string {
  const file = findFileNode(nodes, fileId);
  if (!file || file.type !== "file") return normalizeFileName(rawName);

  const parentId = getParentFolderId(nodes, fileId);
  const siblings = getSiblingFileNames(nodes, parentId).filter(
    (name) => name !== file.name,
  );
  const normalizedBase = normalizeFileName(rawName).replace(/\.md$/, "");

  let candidate = `${normalizedBase}.md`;
  let counter = 2;

  while (siblings.includes(candidate)) {
    candidate = `${normalizedBase} ${counter}.md`;
    counter += 1;
  }

  return candidate;
}

export function renameFileInTree(
  nodes: FileNode[],
  fileId: string,
  rawName: string,
): FileNode[] {
  const newName = generateRenamedFileName(nodes, fileId, rawName);

  return nodes.map((node) => {
    if (node.id === fileId && node.type === "file") {
      return { ...node, name: newName };
    }

    if (node.children) {
      return {
        ...node,
        children: renameFileInTree(node.children, fileId, rawName),
      };
    }

    return node;
  });
}

function getSiblingFolderNames(
  nodes: FileNode[],
  parentId: string | null,
): string[] {
  if (parentId === null) {
    return nodes
      .filter((node) => node.type === "folder")
      .map((node) => node.name);
  }

  const parent = findFileNode(nodes, parentId);
  if (!parent?.children) return [];

  return parent.children
    .filter((node) => node.type === "folder")
    .map((node) => node.name);
}

export function normalizeFolderName(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "New folder";

  const safeName = trimmed.replace(/[\\/:*?"<>|]/g, "").trim();
  return safeName || "New folder";
}

export function generateUniqueFolderName(
  nodes: FileNode[],
  parentId: string | null,
  baseName = "New folder",
): string {
  const siblings = getSiblingFolderNames(nodes, parentId);
  const normalizedBase = normalizeFolderName(baseName);

  let candidate = normalizedBase;
  let counter = 2;

  while (siblings.includes(candidate)) {
    candidate = `${normalizedBase} ${counter}`;
    counter += 1;
  }

  return candidate;
}

export function createFolderId(): string {
  return `folder-${crypto.randomUUID()}`;
}

export function insertFolderNode(
  nodes: FileNode[],
  parentId: string | null,
  folder: FileNode,
): FileNode[] {
  if (parentId === null) {
    return [...nodes, folder];
  }

  return nodes.map((node) => {
    if (node.id === parentId && node.type === "folder") {
      return {
        ...node,
        children: [...(node.children ?? []), folder],
      };
    }

    if (node.children) {
      return {
        ...node,
        children: insertFolderNode(node.children, parentId, folder),
      };
    }

    return node;
  });
}

export function createFolderInTree(
  nodes: FileNode[],
  parentId: string | null,
  rawName: string,
): { tree: FileNode[]; folder: FileNode } {
  const name = generateUniqueFolderName(nodes, parentId, rawName);
  const folder: FileNode = {
    id: createFolderId(),
    name,
    type: "folder",
    children: [],
  };

  return {
    tree: insertFolderNode(nodes, parentId, folder),
    folder,
  };
}

export function collectFileIdsInSubtree(node: FileNode): string[] {
  const ids: string[] = [];

  function walk(current: FileNode) {
    if (current.type === "file") {
      ids.push(current.id);
      return;
    }

    for (const child of current.children ?? []) {
      walk(child);
    }
  }

  walk(node);
  return ids;
}

export function removeFolderFromTree(
  nodes: FileNode[],
  folderId: string,
): FileNode[] {
  return nodes
    .filter((node) => node.id !== folderId)
    .map((node) => {
      if (!node.children) return node;

      return {
        ...node,
        children: removeFolderFromTree(node.children, folderId),
      };
    });
}

export function generateRenamedFolderName(
  nodes: FileNode[],
  folderId: string,
  rawName: string,
): string {
  const folder = findFileNode(nodes, folderId);
  if (!folder || folder.type !== "folder") {
    return normalizeFolderName(rawName);
  }

  const parentId = getParentFolderId(nodes, folderId);
  const siblings = getSiblingFolderNames(nodes, parentId).filter(
    (name) => name !== folder.name,
  );
  const normalizedBase = normalizeFolderName(rawName);

  let candidate = normalizedBase;
  let counter = 2;

  while (siblings.includes(candidate)) {
    candidate = `${normalizedBase} ${counter}`;
    counter += 1;
  }

  return candidate;
}

export function renameFolderInTree(
  nodes: FileNode[],
  folderId: string,
  rawName: string,
): FileNode[] {
  const newName = generateRenamedFolderName(nodes, folderId, rawName);

  return nodes.map((node) => {
    if (node.id === folderId && node.type === "folder") {
      return { ...node, name: newName };
    }

    if (node.children) {
      return {
        ...node,
        children: renameFolderInTree(node.children, folderId, rawName),
      };
    }

    return node;
  });
}
