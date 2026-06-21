"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { createHubVault, getFileTree, getHubVaults } from "@/lib/vault-catalog";
import { collectFiles, getFilePath, getParentFolderId } from "@/lib/vault";
import type { FileNode } from "@/types/file-tree";
import type { MockVault } from "@/lib/mock-data";

function formatDate(value: string | undefined): string {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function getRelativeAge(value: string | undefined): string {
  if (!value) return "recently";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "recently";

  const diffDays = Math.floor(
    (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return `${Math.floor(diffDays / 30)} months ago`;
}

function getRootFolder(tree: FileNode[]): FileNode | null {
  return tree[0]?.type === "folder" ? tree[0] : null;
}

function getMainFolders(root: FileNode | null): FileNode[] {
  return (root?.children ?? []).filter((node) => node.type === "folder");
}

function getTopLevelFolderId(tree: FileNode[], fileId: string): string | null {
  const root = getRootFolder(tree);
  if (!root) return null;

  const path = getFilePath(tree, fileId);
  if (!path) return null;

  const firstSegment = path.split(" / ")[1];
  if (!firstSegment) return null;

  const child = root.children?.find((node) => node.name === firstSegment);
  return child?.type === "folder" ? child.id : null;
}

export function DashboardHub() {
  const [vaults, setVaults] = useState<MockVault[]>(() => getHubVaults());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setIsDarkMode(root.classList.contains("dark"));
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const fileTree = useMemo(() => getFileTree(), [vaults]);
  const rootVault = useMemo(() => getRootFolder(fileTree), [fileTree]);
  const mainFolders = useMemo(() => getMainFolders(rootVault), [rootVault]);
  const files = useMemo(
    () =>
      collectFiles(fileTree)
        .filter((file) => Boolean(file.createdAt))
        .sort((a, b) => {
          const aTime = new Date(a.createdAt ?? 0).getTime();
          const bTime = new Date(b.createdAt ?? 0).getTime();
          return bTime - aTime;
        }),
    [fileTree],
  );

  const recentFiles = files.slice(0, 5);
  const recentWindowCount = files.filter((file) => {
    if (!file.createdAt) return false;
    const parsed = new Date(file.createdAt);
    if (Number.isNaN(parsed.getTime())) return false;
    return (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  }).length;
  const newestFile = files[0] ?? null;
  const brandGradient = useMemo(
    () =>
      isDarkMode
        ? ["#dbd5b5", "#fcab10", "#f8333c"]
        : ["#220901", "#621708", "#941b0c", "#bc3908", "#f6aa1c"],
    [isDarkMode],
  );
  const hubAuroraStops = useMemo(
    () =>
      isDarkMode
        ? ["#44af69", "#f8333c", "#2b9eb3"]
        : ["#220901", "#941b0c", "#f6aa1c"],
    [isDarkMode],
  );

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

  const brainVault = vaults[0] ?? null;
  const sidebarLinks = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard", description: "Overview and recent memories." },
      { href: "/backend", label: "Backend bridge", description: "Visual API surface and future connector." },
      brainVault ? { href: `/vault/${brainVault.id}`, label: "Vault", description: "Open the Brain Vault." } : null,
      { href: "/mind", label: "Mind map", description: "Explore the brain graph." },
    ].filter(Boolean) as Array<{ href: string; label: string; description: string }>,
    [brainVault],
  );

  return (
    <main className="hub-page">
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <Aurora
          colorStops={hubAuroraStops}
          amplitude={0.55}
          blend={0.38}
          speed={0.65}
        />
      </div>
      <div className="hub-page__inner">
        <div className="hub-page__shell">
          <FadeContent blur duration={800} delay={0}>
            <aside className="hub-page__sidebar">
              <div className="hub-page__sidebar-panel">
                <div className="hub-page__brand">
                  <Brain className="size-5 text-muted-foreground" />
                  <GradientText
                    colors={brandGradient}
                    animationSpeed={8}
                    className="hub-page__brand-name inline-flex"
                  >
                    brAIn.md
                  </GradientText>
                </div>
                <div className="hub-page__sidebar-copy">
                  <p className="hub-page__sidebar-eyebrow">Navigate</p>
                  <p className="hub-page__sidebar-title">One brain vault</p>
                  <p className="hub-page__sidebar-lede">
                    Everything lives inside the Brain Vault. Use the links below
                    to move between the overview, vault root, and mind map.
                  </p>
                </div>
                <nav className="hub-page__sidebar-nav" aria-label="Dashboard pages">
                  {sidebarLinks.map((item) => (
                    <Link key={item.href} href={item.href} className="hub-page__sidebar-link">
                      <span>{item.label}</span>
                      <span>{item.description}</span>
                    </Link>
                  ))}
                </nav>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="hub-page__sign-out hub-page__sign-out--sidebar"
                  aria-label="Sign out"
                >
                  <LogOut className="size-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </aside>
          </FadeContent>

          <section className="hub-page__content">
            <FadeContent blur duration={900} delay={80}>
              <section className="hub-page__intro">
                <p className="hub-page__eyebrow">
                  <ShinyText
                    text="Index"
                    speed={3}
                    color="var(--heading)"
                    shineColor="var(--highlight)"
                    className="inline-block"
                  />
                </p>
                <GradientText
                  colors={brandGradient}
                  animationSpeed={7}
                  className="hub-page__title inline-flex"
                >
                  Brain vault
                </GradientText>
                <p className="hub-page__lede">
                  One vault holds everything. The folders below are the main
                  branches inside your brain vault, and the notes are the memories
                  nested within them.
                </p>
              </section>
            </FadeContent>

            <FadeContent blur duration={900} delay={120}>
              <section className="hub-page__stats" aria-label="Vault insights">
                <div className="hub-page__stat">
                  <span className="hub-page__stat-label">Vault</span>
                  <strong>{brainVault ? 1 : 0}</strong>
                </div>
                <div className="hub-page__stat">
                  <span className="hub-page__stat-label">Main folders</span>
                  <strong>{mainFolders.length}</strong>
                </div>
                <div className="hub-page__stat">
                  <span className="hub-page__stat-label">Memories</span>
                  <strong>{files.length}</strong>
                </div>
                <div className="hub-page__stat">
                  <span className="hub-page__stat-label">Last 7 days</span>
                  <strong>{recentWindowCount}</strong>
                </div>
              </section>
            </FadeContent>

            <FadeContent blur duration={900} delay={160}>
              <section className="hub-page__section">
                <div className="hub-page__section-head">
                  <p className="hub-page__section-label">Brain vault</p>
                  <span className="hub-page__section-meta">
                    {brainVault ? `${brainVault.fileCount} memories` : "Unavailable"}
                  </span>
                </div>

                {brainVault ? (
                  <GlareHover
                    width="100%"
                    height="auto"
                    background="transparent"
                    borderColor="transparent"
                    borderRadius="0"
                    glareColor="var(--link)"
                    glareOpacity={0.3}
                    className="hub-page__link-wrap !flex !w-full !items-stretch !justify-start border-0"
                    style={{ width: "100%", display: "flex" }}
                  >
                    <Link href={`/vault/${brainVault.id}`} className="hub-page__link w-full">
                      <div className="hub-page__link-main">
                        <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <span className="hub-page__link-title">{brainVault.name}</span>
                          <span className="hub-page__link-desc">
                            {brainVault.description}
                          </span>
                        </div>
                      </div>
                      <div className="hub-page__link-meta">
                        <span>{brainVault.fileCount} notes</span>
                        <ArrowUpRight className="size-3.5 opacity-60" />
                      </div>
                    </Link>
                  </GlareHover>
                ) : null}
              </section>
            </FadeContent>

            <FadeContent blur duration={900} delay={200}>
              <section className="hub-page__section">
                <div className="hub-page__section-head">
                  <p className="hub-page__section-label">Main folders</p>
                  <span className="hub-page__section-meta">
                    Inside the brain vault
                  </span>
                </div>

                <ul className="hub-page__list">
                  {mainFolders.map((folder) => (
                    <li key={folder.id}>
                      <GlareHover
                        width="100%"
                        height="auto"
                        background="transparent"
                        borderColor="transparent"
                        borderRadius="0"
                        glareColor="var(--link)"
                        glareOpacity={0.3}
                        className="hub-page__link-wrap !flex !w-full !items-stretch !justify-start border-0"
                        style={{ width: "100%", display: "flex" }}
                      >
                        <Link href={`/vault/${folder.id}`} className="hub-page__link w-full">
                          <div className="hub-page__link-main">
                            <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <span className="hub-page__link-title">{folder.name}</span>
                              <span className="hub-page__link-desc">
                                {folder.children?.length ?? 0} contained memories and folders
                              </span>
                            </div>
                          </div>
                          <div className="hub-page__link-meta">
                            <span>{formatDate(folder.createdAt)}</span>
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
                  <p className="hub-page__section-label">Recent memories</p>
                  <span className="hub-page__section-meta">
                    {newestFile ? `Latest: ${formatDate(newestFile.createdAt)}` : "No files yet"}
                  </span>
                </div>

                <ul className="hub-page__recent-list">
                  {recentFiles.map((file) => {
                    const path = getFilePath(fileTree, file.id) ?? file.name;
                    const parentFolderId =
                      getParentFolderId(fileTree, file.id) ?? getTopLevelFolderId(fileTree, file.id);

                    return (
                      <li key={file.id} className="hub-page__recent-item">
                        {parentFolderId ? (
                          <Link
                            href={`/vault/${parentFolderId}`}
                            className="hub-page__recent-main hub-page__recent-main--link"
                          >
                            <span className="hub-page__recent-name">{file.name}</span>
                            <span className="hub-page__recent-path">{path}</span>
                          </Link>
                        ) : (
                          <div className="hub-page__recent-main">
                            <span className="hub-page__recent-name">{file.name}</span>
                            <span className="hub-page__recent-path">{path}</span>
                          </div>
                        )}
                        <div className="hub-page__recent-meta">
                          <span>{getRelativeAge(file.createdAt)}</span>
                          <span>{formatDate(file.createdAt)}</span>
                          {parentFolderId ? (
                            <Link
                              href={`/vault/${parentFolderId}`}
                              className="hub-page__recent-link"
                            >
                              Open folder
                            </Link>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </FadeContent>

            <FadeContent blur duration={900} delay={280}>
              <section className="hub-page__section">
                <div className="hub-page__section-head">
                  <p className="hub-page__section-label">Mind map</p>
                </div>

                <GlareHover
                  width="100%"
                  height="auto"
                  background="var(--card)"
                  borderColor="var(--border)"
                  borderRadius="0.5rem"
                  glareColor="var(--highlight)"
                  glareOpacity={0.35}
                  className="!block w-full"
                  style={{ width: "100%", display: "block" }}
                >
                  <Link href="/mind" className="hub-page__cta">
                    <GitBranch className="size-4 shrink-0" />
                    <span>Open brain graph</span>
                    <ArrowUpRight className="ml-auto size-4 opacity-70" />
                  </Link>
                </GlareHover>
              </section>
            </FadeContent>

            <FadeContent blur duration={800} delay={320}>
              <footer className="hub-page__footer">
                <p>Markdown vault - write, connect, organize</p>
              </footer>
            </FadeContent>
          </section>
        </div>
      </div>

      {createDialogOpen ? (
        <CreateFolderDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          parentFolderId={null}
          fileTree={fileTree}
          onCreate={handleCreateFolder}
        />
      ) : null}
    </main>
  );
}
