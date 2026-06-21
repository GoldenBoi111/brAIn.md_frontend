export type FileNodeType = "file" | "folder";

export type LlmAccess = "default" | "no_write" | "hidden";

export interface FileNode {
  id: string;
  name: string;
  type: FileNodeType;
  /** AI access policy — files only; omit = "default" */
  llmAccess?: LlmAccess;
  children?: FileNode[];
}

export interface FileTreeState {
  nodes: FileNode[];
  expandedIds: Set<string>;
  selectedId: string | null;
}
