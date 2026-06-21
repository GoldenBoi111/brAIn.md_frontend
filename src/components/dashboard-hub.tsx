"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  ArrowUpRight,
  Brain,
  FolderOpen,
  FolderPlus,
  GitBranch,
  LogOut,
} from "lucide-react";

import { CreateFolderDialog } from "@/components/create-folder-dialog";
import { clearAuthenticatedSession } from "@/lib/auth";
import { backendApi } from "@/lib/backend-api";
import {
  createHubVault,
  getFileTree,
  getHubVaults,
} from "@/lib/vault-catalog";
import type { MockVault } from "@/lib/mock-data";

export function DashboardHub() {
  const [vaults, setVaults] = useState<MockVault[]>(() => getHubVaults());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const refreshVaults = useCallback(() => {
    setVaults(getHubVaults());
  }, []);

  const handleSignOut = async () => {
    try {
      await backendApi.logout();
    } catch {
      // Still sign out locally if the API is unreachable.
    }

    clearAuthenticatedSession();
    window.location.assign("/login");
  };

  const handleCreateFolder = useCallback(
    (rawName: string, parentFolderId: string | null) => {
      if (parentFolderId !== null) return;
      createHubVault(rawName);
      refreshVaults();
    },
    [refreshVaults],
  );

  return (
    <main className="hub-page">
      <div className="hub-page__inner">
        <header className="hub-page__header">
          <div className="hub-page__brand">
            <Brain className="size-5 text-muted-foreground" />
            <span className="hub-page__brand-name">brAIn.md</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="hub-page__sign-out"
            aria-label="Sign out"
          >
            <LogOut className="size-3.5" />
            <span>Sign out</span>
          </button>
        </header>

        <section className="hub-page__intro">
          <p className="hub-page__eyebrow">Index</p>
          <h1 className="hub-page__title">Your vault hub</h1>
          <p className="hub-page__lede">
            Choose a folder to write, or open the global graph to explore how
            your notes connect.
          </p>
        </section>

        <section className="hub-page__section">
          <div className="hub-page__section-head">
            <p className="hub-page__section-label">Your Folders</p>
            <span className="hub-page__section-meta">{vaults.length} vaults</span>
          </div>

          <ul className="hub-page__list">
            {vaults.map((vault) => (
              <li key={vault.id}>
                <Link href={`/vault/${vault.id}`} className="hub-page__link">
                  <div className="hub-page__link-main">
                    <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <span className="hub-page__link-title">{vault.name}</span>
                      <span className="hub-page__link-desc">{vault.description}</span>
                    </div>
                  </div>
                  <div className="hub-page__link-meta">
                    <span>{vault.fileCount} notes</span>
                    <ArrowUpRight className="size-3.5 opacity-60" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="hub-page__secondary"
          >
            <FolderPlus className="size-4 shrink-0" />
            <span>New folder</span>
          </button>
        </section>

        <section className="hub-page__section">
          <div className="hub-page__section-head">
            <p className="hub-page__section-label">Visualization</p>
          </div>

          <Link href="/mind" className="hub-page__cta">
            <GitBranch className="size-4 shrink-0" />
            <span>Global Graph View</span>
            <ArrowUpRight className="ml-auto size-4 opacity-70" />
          </Link>
        </section>

        <footer className="hub-page__footer">
          <p>Local-first markdown vault · notes stay on your machine</p>
        </footer>
      </div>

      {createDialogOpen ? (
        <CreateFolderDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          parentFolderId={null}
          fileTree={getFileTree()}
          onCreate={handleCreateFolder}
        />
      ) : null}
    </main>
  );
}
