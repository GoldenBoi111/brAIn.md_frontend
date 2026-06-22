"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchVaultTree } from "@/lib/vault-api";
import type { FileNode } from "@/types/file-tree";

const TREE_CACHE_KEY = "brain-md:vault-tree-cache";
const TREE_CACHE_TTL_MS = 2 * 60 * 1000;

type VaultTreeCache = {
  savedAt: number;
  tree: FileNode[];
};

function readTreeCache(): VaultTreeCache | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(TREE_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<VaultTreeCache>;
    if (!Array.isArray(parsed.tree) || typeof parsed.savedAt !== "number") {
      return null;
    }

    return {
      savedAt: parsed.savedAt,
      tree: parsed.tree as FileNode[],
    };
  } catch {
    return null;
  }
}

function writeTreeCache(tree: FileNode[]): void {
  if (typeof window === "undefined") return;

  try {
    const payload: VaultTreeCache = { savedAt: Date.now(), tree };
    window.localStorage.setItem(TREE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures and keep using the in-memory state.
  }
}

export function useVaultTree() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refresh = useCallback(() => {
    setRefreshIndex((current) => current + 1);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadTree() {
      const cached = readTreeCache();
      const isFresh = Boolean(cached) && Date.now() - (cached?.savedAt ?? 0) < TREE_CACHE_TTL_MS;

      if (cached?.tree && refreshIndex === 0) {
        setTree(cached.tree);
        setLoading(false);
        setError(null);
        if (isFresh) return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextTree = await fetchVaultTree();
        if (!mounted) return;
        setTree(nextTree);
        writeTreeCache(nextTree);
      } catch (cause) {
        if (!mounted) return;
        if (cached?.tree && refreshIndex === 0) {
          setError(null);
          setTree(cached.tree);
        } else {
          setError(cause instanceof Error ? cause.message : "Unable to load the vault.");
          setTree([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTree();

    return () => {
      mounted = false;
    };
  }, [refreshIndex]);

  return {
    tree,
    loading,
    error,
    refresh,
    setTree,
  };
}
