import type { FileNode } from "@/types/file-tree";
import { getFilePath } from "@/lib/vault";

export type FileGraphKind = "cluster" | "memory";

export interface FileGraphRecord {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  type: FileGraphKind;
  cluster: string;
  tags: string[];
  references: string[];
  sources: string[];
  icon?: string;
  path: string;
  parentFolderId: string | null;
  fileType: FileNode["type"];
}

export interface FileGraphLink {
  id: string;
  source: string;
  target: string;
  relation: string;
}

export interface FileTreeGraph {
  nodes: FileGraphRecord[];
  links: FileGraphLink[];
}

function humanizeName(name: string): string {
  return name.replace(/\.md$/i, "");
}

function formatCount(count: number): string {
  return `${count} item${count === 1 ? "" : "s"}`;
}

function pickClusterLabel(pathParts: string[]): string {
  if (pathParts.length <= 1) return "Brain Vault";
  return pathParts[1] ?? "Brain Vault";
}

function collectStats(node: FileNode): { folders: number; files: number } {
  if (node.type === "file") {
    return { folders: 0, files: 1 };
  }

  let folders = 1;
  let files = 0;

  for (const child of node.children ?? []) {
    const stats = collectStats(child);
    folders += stats.folders;
    files += stats.files;
  }

  return { folders, files };
}

function deriveTags(node: FileNode, pathParts: string[], depth: number): string[] {
  const tags = new Set<string>([node.type, `depth:${depth}`]);

  if (pathParts.length > 1) {
    tags.add(pathParts[1].toLowerCase());
  }

  if (node.type === "file") {
    const extension = node.name.includes(".")
      ? node.name.split(".").pop()?.toLowerCase()
      : null;
    if (extension) tags.add(extension);
  }

  return [...tags];
}

export function buildFileTreeGraph(fileTree: FileNode[]): FileTreeGraph {
  const nodes: FileGraphRecord[] = [];
  const links: FileGraphLink[] = [];

  function walk(node: FileNode, depth: number, parentId: string | null, pathParts: string[]) {
    const nextPathParts = [...pathParts, node.name];
    const path = getFilePath(fileTree, node.id) ?? nextPathParts.join(" / ");
    const cluster = pickClusterLabel(nextPathParts);
    const isFolder = node.type === "folder";
    const stats = collectStats(node);
    const childCount = node.children?.length ?? 0;

    nodes.push({
      id: node.id,
      title: isFolder ? node.name : humanizeName(node.name),
      summary: isFolder
        ? `Contains ${formatCount(childCount)}: ${stats.folders} folder${stats.folders === 1 ? "" : "s"} and ${stats.files} file${stats.files === 1 ? "" : "s"}.`
        : `File in ${path}.`,
      createdAt: node.createdAt ?? "Unknown",
      type: isFolder ? "cluster" : "memory",
      cluster,
      tags: deriveTags(node, nextPathParts, depth),
      references: [
        ...(parentId ? [parentId] : []),
        ...(isFolder ? (node.children ?? []).slice(0, 3).map((child) => child.id) : []),
      ],
      sources: [path],
      icon: isFolder ? "F" : humanizeName(node.name).slice(0, 1).toUpperCase() || "M",
      path,
      parentFolderId: parentId,
      fileType: node.type,
    });

    if (parentId) {
      links.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        relation: "contains",
      });
    }

    if (isFolder) {
      for (const child of node.children ?? []) {
        walk(child, depth + 1, node.id, nextPathParts);
      }
    }
  }

  for (const root of fileTree) {
    walk(root, 0, null, []);
  }

  return { nodes, links };
}

export function getFileGraphSearchIndex(node: FileGraphRecord): string {
  return [
    node.title,
    node.summary,
    node.tags.join(" "),
    node.references.join(" "),
    node.sources.join(" "),
    node.cluster,
    node.path,
    node.fileType,
  ]
    .join(" ")
    .toLowerCase();
}
