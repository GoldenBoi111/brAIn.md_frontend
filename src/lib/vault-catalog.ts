import { MOCK_FILE_TREE, MOCK_VAULTS, type MockVault } from "@/lib/mock-data";
import {
  collectFiles,
  createFolderInTree,
  findFileNode,
} from "@/lib/vault";
import type { FileNode } from "@/types/file-tree";

const USER_VAULTS_KEY = "brain-md-user-vaults";
const USER_FOLDERS_KEY = "brain-md-user-folders";

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

export function getUserVaults(): MockVault[] {
  return readJson<MockVault[]>(USER_VAULTS_KEY, []);
}

/** Full mock tree including user-created top-level vault folders. */
export function getFileTree(): FileNode[] {
  return [...MOCK_FILE_TREE, ...getUserFolders()];
}

export function getHubVaults(): MockVault[] {
  const userVaults = getUserVaults().map((vault) => {
    const folder = findFileNode(getFileTree(), vault.id);
    const fileCount = folder ? collectFiles([folder]).length : vault.fileCount;
    return { ...vault, fileCount };
  });

  return [...MOCK_VAULTS, ...userVaults];
}

export function getVaultFolderId(folderId: string): string | null {
  return getHubVaults().some((vault) => vault.id === folderId) ? folderId : null;
}

export function createHubVault(rawName: string): MockVault {
  const tree = getFileTree();
  const { folder } = createFolderInTree(tree, null, rawName);
  const name = folder.name;

  const vault: MockVault = {
    id: folder.id,
    name,
    description: "Empty vault · add notes inside.",
    fileCount: 0,
  };

  writeJson(USER_FOLDERS_KEY, [...getUserFolders(), folder]);
  writeJson(USER_VAULTS_KEY, [...getUserVaults(), vault]);

  return vault;
}
