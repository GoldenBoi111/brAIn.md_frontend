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

import Aurora from "@/components/Aurora";
import { CreateFolderDialog } from "@/components/create-folder-dialog";
import FadeContent from "@/components/FadeContent";
import GlareHover from "@/components/GlareHover";
import GradientText from "@/components/GradientText";
import ShinyText from "@/components/ShinyText";
import { clearAuthenticatedSession } from "@/lib/auth";
import { backendApi } from "@/lib/backend-api";
import {
  createHubVault,
  getFileTree,
  getHubVaults,
} from "@/lib/vault-catalog";
import type { MockVault } from "@/lib/mock-data";

const BRAND_GRADIENT = ["#a78bfa", "#fafafa", "#818cf8"];
const HUB_AURORA_STOPS = ["#18181b", "#4338ca", "#111113"];

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
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <Aurora
          colorStops={HUB_AURORA_STOPS}
          amplitude={0.55}
          blend={0.38}
          speed={0.65}
        />
      </div>

      <div className="hub-page__inner">
        <FadeContent blur duration={800} delay={0}>
          <header className="hub-page__header">
            <div className="hub-page__brand">
              <Brain className="size-5 text-muted-foreground" />
              <GradientText
                colors={BRAND_GRADIENT}
                animationSpeed={8}
                className="hub-page__brand-name inline-flex"
              >
                brAIn.md
              </GradientText>
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
        </FadeContent>

        <FadeContent blur duration={900} delay={80}>
          <section className="hub-page__intro">
            <p className="hub-page__eyebrow">
              <ShinyText
                text="Index"
                speed={3}
                color="#71717a"
                shineColor="#e4e4e7"
                className="inline-block"
              />
            </p>
            <GradientText
              colors={BRAND_GRADIENT}
              animationSpeed={7}
              className="hub-page__title inline-flex"
            >
              Your vault hub
            </GradientText>
            <p className="hub-page__lede">
              Choose a folder to write, or open the global graph to explore how
              your notes connect.
            </p>
          </section>
        </FadeContent>

        <FadeContent blur duration={900} delay={160}>
          <section className="hub-page__section">
            <div className="hub-page__section-head">
              <p className="hub-page__section-label">Your Folders</p>
              <span className="hub-page__section-meta">
                {vaults.length} vaults
              </span>
            </div>

            <ul className="hub-page__list">
              {vaults.map((vault) => (
                <li key={vault.id}>
                  <GlareHover
                    width="100%"
                    height="auto"
                    background="transparent"
                    borderColor="transparent"
                    borderRadius="0"
                    glareColor="#818cf8"
                    glareOpacity={0.3}
                    className="hub-page__link-wrap !flex !w-full !items-stretch !justify-start border-0"
                    style={{ width: "100%", display: "flex" }}
                  >
                    <Link
                      href={`/vault/${vault.id}`}
                      className="hub-page__link w-full"
                    >
                      <div className="hub-page__link-main">
                        <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <span className="hub-page__link-title">
                            {vault.name}
                          </span>
                          <span className="hub-page__link-desc">
                            {vault.description}
                          </span>
                        </div>
                      </div>
                      <div className="hub-page__link-meta">
                        <span>{vault.fileCount} notes</span>
                        <ArrowUpRight className="size-3.5 opacity-60" />
                      </div>
                    </Link>
                  </GlareHover>
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
        </FadeContent>

        <FadeContent blur duration={900} delay={240}>
          <section className="hub-page__section">
            <div className="hub-page__section-head">
              <p className="hub-page__section-label">Visualization</p>
            </div>

            <GlareHover
              width="100%"
              height="auto"
              background="#1c1c1f"
              borderColor="rgba(255, 255, 255, 0.12)"
              borderRadius="0.5rem"
              glareColor="#a78bfa"
              glareOpacity={0.35}
              className="!block w-full"
              style={{ width: "100%", display: "block" }}
            >
              <Link href="/mind" className="hub-page__cta">
                <GitBranch className="size-4 shrink-0" />
                <span>Global Graph View</span>
                <ArrowUpRight className="ml-auto size-4 opacity-70" />
              </Link>
            </GlareHover>
          </section>
        </FadeContent>

        <FadeContent blur duration={800} delay={320}>
          <footer className="hub-page__footer">
            <p>Markdown vault · write, connect, organize</p>
          </footer>
        </FadeContent>
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
