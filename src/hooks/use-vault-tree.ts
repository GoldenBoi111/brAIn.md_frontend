"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchVaultTree } from "@/lib/vault-api";
import type { FileNode } from "@/types/file-tree";

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
      setLoading(true);
      setError(null);

      try {
        const nextTree = await fetchVaultTree();
        if (!mounted) return;
        setTree(nextTree);
      } catch (cause) {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : "Unable to load the vault.");
        setTree([]);
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
