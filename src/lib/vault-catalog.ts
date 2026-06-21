import { MOCK_FILE_TREE, MOCK_VAULTS, type MockVault } from "@/lib/mock-data";
import { collectFiles, createFolderInTree, findFileNode } from "@/lib/vault";
import type { FileNode } from "@/types/file-tree";

const USER_FOLDERS_KEY = "brain-md-user-folders";
const ROOT_VAULT_ID = MOCK_VAULTS[0]?.id ?? "folder-brain-vault";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getUserFolders(): FileNode[] {
  return readJson<FileNode[]>(USER_FOLDERS_KEY, []);
}

/** Full mock tree including user-created subfolders inside the brain vault. */
export function getFileTree(): FileNode[] {
  const [rootVault] = MOCK_FILE_TREE;
  if (!rootVault) return [];

  return [
    {
      ...rootVault,
      children: [...(rootVault.children ?? []), ...getUserFolders()],
    },
  ];
}

export function getHubVaults(): MockVault[] {
  const tree = getFileTree();
  const rootVault = findFileNode(tree, ROOT_VAULT_ID);
  const fileCount = rootVault ? collectFiles([rootVault]).length : MOCK_VAULTS[0]?.fileCount ?? 0;

  return [
    {
      ...MOCK_VAULTS[0],
      fileCount,
    },
  ].filter((vault): vault is MockVault => Boolean(vault));
}

export function getVaultFolderId(folderId: string): string | null {
  return findFileNode(getFileTree(), folderId)?.type === "folder" ? folderId : null;
}

export function createHubVault(rawName: string): FileNode {
  const tree = getFileTree();
  const { folder } = createFolderInTree(tree, ROOT_VAULT_ID, rawName);

  writeJson(USER_FOLDERS_KEY, [...getUserFolders(), folder]);

  return folder;
}
