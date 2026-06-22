"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Brain, ChevronRight, EyeOff, Search, X } from "lucide-react";

import BrainAnimation from "@/components/brain-animation";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { backendApi } from "@/lib/backend-api";
import { clearAuthenticatedSession } from "@/lib/auth";
import { useVaultTree } from "@/hooks/use-vault-tree";
import {
  buildFileTreeGraph,
  getFileGraphSearchIndex,
  type FileGraphRecord,
} from "@/lib/file-tree-graph";
import type { FileNode } from "@/types/file-tree";

const LIGHT_CLUSTER_ACCENTS = ["#220901", "#621708", "#941b0c", "#bc3908", "#f6aa1c"];
const DARK_CLUSTER_ACCENTS = ["#44af69", "#f8333c", "#fcab10", "#2b9eb3", "#dbd5b5"];

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function pickAccent(cluster: string, isDark: boolean) {
  const palette = isDark ? DARK_CLUSTER_ACCENTS : LIGHT_CLUSTER_ACCENTS;
  return palette[hashString(cluster) % palette.length];
}

interface StaticBrainGraphProps {
  fileTree?: FileNode[];
}

export function StaticBrainGraph({ fileTree: fileTreeProp }: StaticBrainGraphProps = {}) {
  const { tree: apiTree } = useVaultTree();
  const [isDark, setIsDark] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideUnconnectedDots, setHideUnconnectedDots] = useState(false);

  const fileTree = fileTreeProp ?? apiTree;
  const graph = useMemo(() => buildFileTreeGraph(fileTree), [fileTree]);
  const graphNodes = useMemo(
    () =>
      graph.nodes.map((node) => ({
        id: node.id,
        title: node.title,
        accent: pickAccent(node.cluster, isDark),
      })),
    [graph.nodes, isDark],
  );

  const rootNode = graph.nodes.find((node) => node.parentFolderId === null) ?? graph.nodes[0] ?? null;
  const nodeLookup = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);
  const previewId = hoveredId ?? pinnedId ?? rootNode?.id ?? null;
  const previewNode = previewId ? nodeLookup.get(previewId) ?? null : null;

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setIsDark(root.classList.contains("dark"));
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const activeConnections = useMemo(() => {
    if (!previewId) return [];

    return graph.links
      .filter((link) => link.source === previewId || link.target === previewId)
      .map((link) => {
        const otherId = link.source === previewId ? link.target : link.source;
        return {
          id: link.id,
          other: nodeLookup.get(otherId),
        };
      })
      .filter((item): item is { id: string; other: FileGraphRecord } => Boolean(item.other));
  }, [graph.links, nodeLookup, previewId]);

  const searchMatches = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return graph.nodes.slice(0, 24);

    return graph.nodes
      .filter((node) => getFileGraphSearchIndex(node).includes(normalized))
      .slice(0, 24);
  }, [graph.nodes, searchQuery]);

  const fileCount = graph.nodes.filter((node) => node.fileType === "file").length;
  const folderCount = graph.nodes.filter((node) => node.fileType === "folder").length;

  const siteLinks = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard", description: "Vault hub and recent-file insights." },
      { href: "/tokens", label: "Tokens", description: "Token names, images, and vault permissions." },
      { href: "/mind", label: "Mind map", description: "Open the brain-centered atlas." },
    ],
    [],
  );

  const handleSelectNode = (nodeId: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    setHoveredId(null);
    setPinnedId(nodeId);
  };

  const handleUnselect = () => {
    setHoveredId(null);
    setPinnedId(null);
  };

  const handleOpenInVault = () => {
    const targetNode = previewNode ?? rootNode;
    if (!targetNode) return;

    const targetFolderId =
      targetNode.fileType === "folder"
        ? targetNode.id
        : targetNode.parentFolderId ?? rootNode?.id;

    if (!targetFolderId) return;
    window.location.assign(`/vault/${targetFolderId}`);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="static-brain-graph">
      <header className="static-brain-graph__topbar">
        <div className="static-brain-graph__brand">
          <Brain className="size-4" />
          <div>
            <p className="static-brain-graph__eyebrow">Scene-first graph</p>
            <h1 className="static-brain-graph__title">brAIn.md atlas</h1>
          </div>
        </div>

        <div className="static-brain-graph__actions">
          <button
            type="button"
            className="memory-app__search"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-4" />
            <span>Search files</span>
            <kbd>Cmd / Ctrl K</kbd>
          </button>
          <ThemeToggleButton />
          <button
            type="button"
            className="memory-app__search static-brain-graph__toggle"
            onClick={() => setHideUnconnectedDots((current) => !current)}
            aria-pressed={hideUnconnectedDots}
          >
            <EyeOff className="size-4" />
            <span>{hideUnconnectedDots ? "Show all dots" : "Hide unconnected dots"}</span>
          </button>
          <button
            type="button"
            className="memory-app__icon-button"
            onClick={handleUnselect}
            aria-label="Unselect node"
          >
            <X className="size-4" />
          </button>
          <button
            type="button"
            className="memory-app__icon-button"
            onClick={async () => {
              try {
                await backendApi.logout();
              } finally {
                clearAuthenticatedSession();
                window.location.assign("/login");
              }
            }}
            aria-label="Sign out"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <main className="static-brain-graph__stage">
        <aside className="static-brain-graph__sidebar">
          <div className="static-brain-graph__sidebar-panel">
            <section className="static-brain-graph__sidebar-section">
              <p className="static-brain-graph__sidebar-eyebrow">Vaults</p>
              <h2 className="static-brain-graph__sidebar-title">Brain vault</h2>
              <nav className="static-brain-graph__sidebar-nav" aria-label="Vaults">
                {rootNode ? (
                  <Link href={`/vault/${rootNode.id}`} className="static-brain-graph__sidebar-link">
                    <span>{rootNode.title}</span>
                    <span>{fileCount} files, {folderCount} folders</span>
                  </Link>
                ) : null}
              </nav>
            </section>

            <section className="static-brain-graph__sidebar-section">
              <p className="static-brain-graph__sidebar-eyebrow">Website</p>
              <h2 className="static-brain-graph__sidebar-title">Site pages</h2>
              <nav className="static-brain-graph__sidebar-nav" aria-label="Site pages">
                {siteLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="static-brain-graph__sidebar-link">
                    <span>{item.label}</span>
                    <span>{item.description}</span>
                  </Link>
                ))}
              </nav>
            </section>
          </div>
        </aside>

        <div className="static-brain-graph__halo" />
        <div className="static-brain-graph__grain" />

        <section className="static-brain-graph__scene">
          <BrainAnimation
            interactive
            autoAnimate={false}
            className="static-brain-graph__brain-canvas"
            graphNodes={graphNodes}
            graphLinks={graph.links}
            activeNodeId={previewId}
            hideUnconnectedNodes={hideUnconnectedDots}
            onNodeHover={setHoveredId}
            onNodeSelect={setPinnedId}
          />
          <div className="static-brain-graph__scene-caption">
            <span>Dots are derived from the FileNode tree.</span>
            <span>Drag to rotate, hover to expand, click to pin.</span>
          </div>
        </section>

        <aside className="static-brain-graph__panel vault-pane">
          <div className="vault-pane__header static-brain-graph__panel-head">
            <p className="static-brain-graph__panel-eyebrow">Selected node</p>
            <div className="static-brain-graph__panel-title-row">
              <h2 className="static-brain-graph__panel-title">
                {previewNode ? previewNode.title : "No node selected"}
              </h2>
              <span className="static-brain-graph__panel-chip">
                {previewNode ? previewNode.fileType : "idle"}
              </span>
            </div>
          </div>

          <div className="static-brain-graph__panel-body">
            {previewNode ? (
              <>
                <p className="static-brain-graph__panel-summary">{previewNode.summary}</p>

                <div className="memory-panel__actions static-brain-graph__panel-actions">
                  <button type="button" onClick={handleUnselect}>
                    Clear selection
                  </button>
                  <button type="button" onClick={handleOpenInVault} disabled={!rootNode}>
                    Open in editor
                  </button>
                </div>

                <dl className="static-brain-graph__facts">
                  <div>
                    <dt>Created</dt>
                    <dd>{previewNode.createdAt}</dd>
                  </div>
                  <div>
                    <dt>Cluster</dt>
                    <dd>{previewNode.cluster}</dd>
                  </div>
                  <div>
                    <dt>Path</dt>
                    <dd>{previewNode.path}</dd>
                  </div>
                </dl>

                <section className="static-brain-graph__section">
                  <h3>Tags</h3>
                  <div className="static-brain-graph__chips">
                    {previewNode.tags.map((tag) => (
                      <span key={tag} className="static-brain-graph__chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="static-brain-graph__section">
                  <h3>Connected links</h3>
                  <ul className="static-brain-graph__connections">
                    {activeConnections.map((connection) => (
                      <li key={`${previewId}-${connection.other.id}`}>
                        <button
                          type="button"
                          className="static-brain-graph__connection-button"
                          onClick={() => setPinnedId(connection.other.id)}
                          aria-label={`Open ${connection.other.title}`}
                        >
                          <span className="static-brain-graph__connections-target">
                            {connection.other.title}
                          </span>
                          <ChevronRight className="size-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="static-brain-graph__section">
                  <h3>Sources</h3>
                  <ul className="static-brain-graph__refs">
                    {previewNode.sources.map((source) => (
                      <li key={source}>{source}</li>
                    ))}
                  </ul>
                </section>

                <section className="static-brain-graph__section">
                  <h3>References</h3>
                  <ul className="static-brain-graph__refs">
                    {previewNode.references.map((reference) => (
                      <li key={reference}>{reference}</li>
                    ))}
                  </ul>
                </section>
              </>
            ) : (
              <div className="static-brain-graph__empty">
                <p>Nothing is selected.</p>
                <p>Pick a node, or turn on hide unconnected dots to isolate a branch.</p>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="static-brain-graph__footer">
        <p>These dots are derived from the FileNode tree, so placement follows your vault structure.</p>
        <p>
          {hoveredId ? "Hovering" : "Pinned"}: {previewNode ? previewNode.title : "nothing selected"}
        </p>
      </footer>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput
          placeholder="Search files, folders, and paths..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No matching nodes.</CommandEmpty>
          <CommandGroup heading="Vault tree">
            {searchMatches.map((node) => (
              <CommandItem
                key={node.id}
                value={`${node.title} ${node.summary} ${node.tags.join(" ")}`}
                onSelect={() => handleSelectNode(node.id)}
              >
                <Search className="size-4" />
                <span>{node.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

export default StaticBrainGraph;
