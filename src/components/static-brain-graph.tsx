"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Brain, ChevronRight, Search, X } from "lucide-react";

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
import { clearAuthenticatedSession } from "@/lib/auth";
import { getHubVaults } from "@/lib/vault-catalog";
import {
  getMemoryById,
  getMemorySearchIndex,
  MEMORY_LINKS,
  MEMORY_NODES,
  type MemoryCluster,
  type MemoryRecord,
} from "@/lib/memory-graph";

const CORE_NODE_ID = "atlas";

const LIGHT_CLUSTER_ACCENTS: Record<MemoryCluster, string> = {
  research: "#44af69",
  projects: "#f8333c",
  people: "#2b9eb3",
  concepts: "#fcab10",
  experiences: "#dbd5b5",
};

const DARK_CLUSTER_ACCENTS: Record<MemoryCluster, string> = {
  research: "#dbd5b5",
  projects: "#fcab10",
  people: "#44af69",
  concepts: "#2b9eb3",
  experiences: "#f8333c",
};

export function StaticBrainGraph() {
  const [isDark, setIsDark] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string>(CORE_NODE_ID);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const vaults = useMemo(() => getHubVaults(), []);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setIsDark(root.classList.contains("dark"));
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const graphNodes = useMemo(() => {
    const clusterAccents = isDark ? DARK_CLUSTER_ACCENTS : LIGHT_CLUSTER_ACCENTS;
    return MEMORY_NODES.map((memory) => ({
      id: memory.id,
      title: memory.title,
      accent: clusterAccents[memory.cluster],
    }));
  }, [isDark]);

  const previewId = hoveredId ?? pinnedId;
  const previewNode = getMemoryById(previewId) ?? MEMORY_NODES[0];
  const brainVault = vaults[0] ?? null;
  const activeConnections = useMemo(() => {
    return MEMORY_LINKS.filter(
      (link) => link.source === previewId || link.target === previewId,
    ).map((link) => {
      const otherId = link.source === previewId ? link.target : link.source;
      return {
        id: link.id,
        other: getMemoryById(otherId),
      };
    }).filter((item): item is { id: string; other: MemoryRecord } => Boolean(item.other));
  }, [previewId]);

  const siteLinks = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard", description: "Vault hub and recent-file insights." },
      { href: "/mind", label: "Mind map", description: "Open the brain-centered atlas." },
    ],
    [],
  );

  const searchMatches = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return MEMORY_NODES.slice(0, 24);

    return MEMORY_NODES.filter((memory) => getMemorySearchIndex(memory).includes(normalized)).slice(0, 24);
  }, [searchQuery]);

  const handleSelectMemory = (memoryId: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    setHoveredId(null);
    setPinnedId(memoryId);
  };

  const handleUnselect = () => {
    setHoveredId(null);
    setPinnedId(CORE_NODE_ID);
  };

  const handleOpenInVault = () => {
    if (!brainVault) return;
    window.location.assign(`/vault/${brainVault.id}`);
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
            <span>Search memories</span>
            <kbd>Cmd / Ctrl K</kbd>
          </button>
          <ThemeToggleButton />
          <button
            type="button"
            className="memory-app__icon-button"
            onClick={handleUnselect}
            aria-label="Unselect memory"
          >
            <X className="size-4" />
          </button>
          <button
            type="button"
            className="memory-app__icon-button"
            onClick={() => {
              clearAuthenticatedSession();
              window.location.assign("/login");
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
                {vaults.map((vault) => (
                  <Link
                    key={vault.id}
                    href={`/vault/${vault.id}`}
                    className="static-brain-graph__sidebar-link"
                  >
                    <span>{vault.name}</span>
                    <span>{vault.description}</span>
                  </Link>
                ))}
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
            graphLinks={MEMORY_LINKS}
            activeNodeId={pinnedId}
            onNodeHover={setHoveredId}
            onNodeSelect={setPinnedId}
          />
          <div className="static-brain-graph__scene-caption">
            <span>Dots are real render vertices.</span>
            <span>Drag to rotate, hover to expand, click to pin.</span>
          </div>
        </section>

        <aside className="static-brain-graph__panel vault-pane">
          <div className="vault-pane__header static-brain-graph__panel-head">
            <p className="static-brain-graph__panel-eyebrow">Selected memory</p>
            <div className="static-brain-graph__panel-title-row">
              <h2 className="static-brain-graph__panel-title">{previewNode.title}</h2>
              <span className="static-brain-graph__panel-chip">
                {previewNode.type === "cluster" ? "cluster" : "memory"}
              </span>
            </div>
          </div>

          <div className="static-brain-graph__panel-body">
            <p className="static-brain-graph__panel-summary">{previewNode.summary}</p>

            <div className="memory-panel__actions static-brain-graph__panel-actions">
              <button type="button" onClick={handleUnselect}>
                Clear selection
              </button>
              <button type="button" onClick={handleOpenInVault} disabled={!brainVault}>
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
          </div>
        </aside>
      </main>

      <footer className="static-brain-graph__footer">
        <p>These dots are embedded in the Three.js scene, so placement follows the brain itself.</p>
        <p>{hoveredId ? "Hovering" : "Pinned"}: {previewNode.title}</p>
      </footer>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput
          placeholder="Search memories, tags, sources..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No matching memories.</CommandEmpty>
          <CommandGroup heading="Memories">
            {searchMatches.map((memory) => (
              <CommandItem
                key={memory.id}
                value={`${memory.title} ${memory.summary} ${memory.tags.join(" ")}`}
                onSelect={() => handleSelectMemory(memory.id)}
              >
                <Search className="size-4" />
                <span>{memory.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

export default StaticBrainGraph;
