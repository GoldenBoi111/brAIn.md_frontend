export type FileNodeType = "file" | "folder";

export interface FileNode {
  id: string;
  name: string;
  type: FileNodeType;
  restricted?: boolean;
  children?: FileNode[];
}

export interface FileTreeState {
  nodes: FileNode[];
  expandedIds: Set<string>;
  selectedId: string | null;
}
