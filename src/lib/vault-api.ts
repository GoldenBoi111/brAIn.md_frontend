import { backendApi } from "@/lib/backend-api";
import type { FileNode } from "@/types/file-tree";

export const ROOT_VAULT_ID = "folder-brain-vault";
export const ROOT_VAULT_NAME = "Brain Vault";
const FILE_CONTENT_CACHE_KEY = "brain-md:vault-file-content-cache";
const FILE_CONTENT_CACHE_TTL_MS = 10 * 60 * 1000;

type ApiTreeNode = {
  name?: string;
  relativePath?: string;
  relative_path?: string;
  kind?: "file" | "folder";
  type?: "file" | "folder";
  locked?: boolean;
  fileId?: string | null;
  file_id?: string | null;
  folderId?: string | null;
  folder_id?: string | null;
  sizeBytes?: number | null;
  size_bytes?: number | null;
  createdAt?: number | string | null;
  created_at?: number | string | null;
  modifiedAt?: number | string | null;
  modified_at?: number | string | null;
  children?: ApiTreeNode[];
};

function toIsoTimestamp(value: number | string | null | undefined): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return toIsoTimestamp(numeric);
    }

    return undefined;
  }

  const milliseconds = value > 1_000_000_000_000 ? value : value * 1000;
  const parsed = new Date(milliseconds);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function normalizeNode(node: ApiTreeNode, isRoot = false): FileNode | null {
  const kind = node.kind ?? node.type ?? (node.children ? "folder" : "file");
  const id =
    isRoot
      ? ROOT_VAULT_ID
      : kind === "folder"
        ? node.folderId ?? node.folder_id ?? node.relativePath ?? node.relative_path ?? null
        : node.fileId ?? node.file_id ?? node.relativePath ?? node.relative_path ?? null;

  if (!id) return null;

  const next: FileNode = {
    id,
    name: node.name ?? (isRoot ? ROOT_VAULT_NAME : "Untitled"),
    type: kind,
    path: node.relativePath ?? node.relative_path ?? (isRoot ? "." : undefined),
    createdAt: toIsoTimestamp(node.createdAt ?? node.created_at),
    modifiedAt: toIsoTimestamp(node.modifiedAt ?? node.modified_at),
    fileId: node.fileId ?? node.file_id ?? null,
    folderId: node.folderId ?? node.folder_id ?? null,
    locked: Boolean(node.locked),
  };

  if (kind === "folder" && Array.isArray(node.children)) {
    next.children = node.children
      .map((child) => normalizeNode(child))
      .filter((child): child is FileNode => Boolean(child));
  }

  if (kind === "file" && node.locked) {
    next.llmAccess = "no_write";
  }

  return next;
}

export function normalizeVaultTree(payload: unknown): FileNode[] {
  const rawRoot =
    typeof payload === "object" && payload !== null && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload;

  if (!rawRoot || typeof rawRoot !== "object") return [];

  const rootNode = normalizeNode(rawRoot as ApiTreeNode, true);
  return rootNode ? [rootNode] : [];
}

export async function fetchVaultTree(): Promise<FileNode[]> {
  const response = await backendApi.listFiles({ path: ".", view: "tree" });
  return normalizeVaultTree(response);
}

export async function fetchVaultFile(fileId: string) {
  return backendApi.getFile(fileId);
}

type FileContentCache = Record<
  string,
  {
    savedAt: number;
    content: string;
  }
>;

function readFileContentCache(): FileContentCache {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(FILE_CONTENT_CACHE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as FileContentCache;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeFileContentCache(cache: FileContentCache): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(FILE_CONTENT_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage failures.
  }
}

export function readCachedFileContent(fileId: string): string | null {
  const cache = readFileContentCache();
  const entry = cache[fileId];
  if (!entry) return null;
  if (Date.now() - entry.savedAt > FILE_CONTENT_CACHE_TTL_MS) return null;
  return entry.content;
}

export function writeCachedFileContent(fileId: string, content: string): void {
  const cache = readFileContentCache();
  cache[fileId] = {
    savedAt: Date.now(),
    content,
  };
  writeFileContentCache(cache);
}

export function clearCachedFileContent(fileId: string): void {
  const cache = readFileContentCache();
  if (!(fileId in cache)) return;
  delete cache[fileId];
  writeFileContentCache(cache);
}

export function getNodePath(node: FileNode | null | undefined): string {
  if (!node) return ".";
  return node.path ?? (node.id === ROOT_VAULT_ID ? "." : node.name);
}

export function buildChildPath(parentPath: string, name: string): string {
  const trimmedParent = parentPath.trim();
  if (!trimmedParent || trimmedParent === ".") return name;
  return `${trimmedParent.replace(/\/+$/, "")}/${name}`;
}

export function getNodeById(nodes: FileNode[], nodeId: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (node.children) {
      const found = getNodeById(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}

export function getParentNode(nodes: FileNode[], nodeId: string): FileNode | null {
  for (const node of nodes) {
    if (node.children?.some((child) => child.id === nodeId)) {
      return node;
    }
    if (node.children) {
      const found = getParentNode(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}

export function resolveNodePath(nodes: FileNode[], nodeId: string): string | null {
  return getNodeById(nodes, nodeId)?.path ?? null;
}

export function resolveParentPath(nodes: FileNode[], nodeId: string | null): string {
  if (!nodeId) return ".";
  const node = getNodeById(nodes, nodeId);
  if (!node) return ".";
  if (node.type === "folder") {
    return getNodePath(node);
  }
  const parent = getParentNode(nodes, nodeId);
  return parent ? getNodePath(parent) : ".";
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

export function normalizeFolderName(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "New folder";
  const safeName = trimmed.replace(/[\\/:*?"<>|]/g, "").trim();
  return safeName || "New folder";
}

export function buildChildNamePath(nodes: FileNode[], parentId: string | null, rawName: string, kind: "file" | "folder"): string {
  const parentPath = resolveParentPath(nodes, parentId);
  const name = kind === "file" ? normalizeFileName(rawName) : normalizeFolderName(rawName);
  return buildChildPath(parentPath, name);
}

export async function createVaultItem(body: {
  kind?: "file" | "folder";
  path: string;
  content?: string;
  embedding_model?: string;
}) {
  return backendApi.createFile(body);
}

export async function updateVaultItem(
  id: string,
  body: { path?: string; content?: string; append?: boolean; embedding_model?: string },
) {
  return backendApi.updateFile(id, body);
}

export async function deleteVaultItem(id: string) {
  return backendApi.deleteFile(id);
}
