import { collectFiles } from "@/lib/vault";
import type { FileNode, LlmAccess } from "@/types/file-tree";

export function getLlmAccess(node: FileNode): LlmAccess {
  if (node.type === "folder") return "default";
  if (node.locked) return "no_write";
  return node.llmAccess ?? "default";
}

export function canLlmRead(node: FileNode): boolean {
  return getLlmAccess(node) !== "hidden";
}

export function canLlmWrite(node: FileNode): boolean {
  return getLlmAccess(node) === "default";
}

export function collectLlmReadableFiles(nodes: FileNode[]): FileNode[] {
  return collectFiles(nodes).filter(canLlmRead);
}

export function collectLlmWritableFiles(nodes: FileNode[]): FileNode[] {
  return collectFiles(nodes).filter(canLlmWrite);
}

export function getLlmAccessLabel(access: LlmAccess): string {
  switch (access) {
    case "no_write":
      return "AI read-only";
    case "hidden":
      return "Hidden from AI";
    default:
      return "AI can edit";
  }
}

export function toggleLlmNoWrite(access: LlmAccess): LlmAccess {
  if (access === "no_write") return "default";
  if (access === "hidden") return "no_write";
  return "no_write";
}

export function toggleLlmHidden(access: LlmAccess): LlmAccess {
  if (access === "hidden") return "default";
  return "hidden";
}

export function isLlmNoWrite(access: LlmAccess): boolean {
  return access === "no_write";
}

export function isLlmHidden(access: LlmAccess): boolean {
  return access === "hidden";
}
