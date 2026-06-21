export type MemoryKind = "cluster" | "memory";

export type MemoryCluster =
  | "research"
  | "projects"
  | "people"
  | "concepts"
  | "experiences";

export interface MemoryRecord {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  type: MemoryKind;
  cluster: MemoryCluster;
  tags: string[];
  references: string[];
  sources: string[];
  icon?: string;
  position?: { x: number; y: number };
}

export interface MemoryLink {
  id: string;
  source: string;
  target: string;
  relation: string;
}

export const MEMORY_CLUSTERS: Array<{
  id: MemoryCluster;
  title: string;
  label: string;
  summary: string;
  accent: string;
}> = [
  {
    id: "research",
    title: "Research Areas",
    label: "Research",
    summary: "Notes, reading trails, and experiments.",
    accent: "#4F46E5",
  },
  {
    id: "projects",
    title: "Projects",
    label: "Projects",
    summary: "Active work and systems in flight.",
    accent: "#3F3F46",
  },
  {
    id: "people",
    title: "People",
    label: "People",
    summary: "Conversations, collaborators, and citations.",
    accent: "#6366F1",
  },
  {
    id: "concepts",
    title: "Concepts",
    label: "Concepts",
    summary: "Ideas, methods, and definitions.",
    accent: "#52525B",
  },
  {
    id: "experiences",
    title: "Experiences",
    label: "Experience",
    summary: "Field notes, memories, and moments.",
    accent: "#111111",
  },
];

export const MEMORY_NODES: MemoryRecord[] = [
  {
    id: "atlas",
    title: "Brain Core",
    summary: "The animated center of the graph where every memory resolves.",
    createdAt: "2026-06-12",
    type: "cluster",
    cluster: "concepts",
    tags: ["core", "index"],
    references: ["research-notes", "concept-graph"],
    sources: ["Notebook"],
    icon: "B",
    position: { x: 0, y: 0 },
  },
  {
    id: "research",
    title: "Research",
    summary: "Reading trails, citations, and unresolved questions.",
    createdAt: "2026-06-03",
    type: "cluster",
    cluster: "research",
    tags: ["research", "reading"],
    references: ["paper-cluster", "method-notes"],
    sources: ["Library"],
  },
  {
    id: "projects",
    title: "Projects",
    summary: "Work systems, implementation notes, and delivery artifacts.",
    createdAt: "2026-05-29",
    type: "cluster",
    cluster: "projects",
    tags: ["work", "build"],
    references: ["roadmap", "implementation-notes"],
    sources: ["Workspace"],
  },
  {
    id: "people",
    title: "People",
    summary: "Names, conversations, and collaborators.",
    createdAt: "2026-06-15",
    type: "cluster",
    cluster: "people",
    tags: ["contacts", "relationships"],
    references: ["meeting-notes", "citations"],
    sources: ["Conversations"],
  },
  {
    id: "concepts",
    title: "Concepts",
    summary: "Language, definitions, and conceptual frames.",
    createdAt: "2026-06-08",
    type: "cluster",
    cluster: "concepts",
    tags: ["ideas", "method"],
    references: ["glossary", "frameworks"],
    sources: ["Theory"],
  },
  {
    id: "experiences",
    title: "Experiences",
    summary: "Experiments, field notes, and personal observations.",
    createdAt: "2026-06-18",
    type: "cluster",
    cluster: "experiences",
    tags: ["journal", "observation"],
    references: ["journal-entries"],
    sources: ["Field Notes"],
  },
  {
    id: "research-notes",
    title: "Reading on local-first systems",
    summary: "A synthesis of sync, conflict resolution, and offline-first patterns.",
    createdAt: "2026-06-18",
    type: "memory",
    cluster: "research",
    tags: ["local-first", "sync", "crdt"],
    references: ["method-notes", "journal-entries"],
    sources: ["Personal notes", "Arxiv"],
    icon: "R",
  },
  {
    id: "paper-cluster",
    title: "Paper cluster",
    summary: "A compact set of papers around graph layout and retrieval.",
    createdAt: "2026-06-13",
    type: "memory",
    cluster: "research",
    tags: ["papers", "layout"],
    references: ["research-notes", "graph-layout"],
    sources: ["PDF archive"],
    icon: "P",
  },
  {
    id: "method-notes",
    title: "Method notes",
    summary: "How to keep a notebook compact while still linking deeply.",
    createdAt: "2026-06-14",
    type: "memory",
    cluster: "research",
    tags: ["method", "note-taking"],
    references: ["research-notes", "glossary"],
    sources: ["Notebook"],
    icon: "M",
  },
  {
    id: "graph-layout",
    title: "Graph layout sketch",
    summary: "Early heuristics for cluster gravity and position freezing.",
    createdAt: "2026-06-16",
    type: "memory",
    cluster: "research",
    tags: ["cytoscape", "layout"],
    references: ["concept-graph", "project-shell"],
    sources: ["Prototype"],
    icon: "G",
  },
  {
    id: "project-shell",
    title: "Project shell",
    summary: "The visual frame that keeps the graph dominant and quiet.",
    createdAt: "2026-06-17",
    type: "memory",
    cluster: "projects",
    tags: ["ui", "shell"],
    references: ["graph-layout", "memory-atlas"],
    sources: ["Frontend"],
    icon: "S",
  },
  {
    id: "implementation-notes",
    title: "Implementation notes",
    summary: "Route structure, selection state, and keyboard handling.",
    createdAt: "2026-06-18",
    type: "memory",
    cluster: "projects",
    tags: ["typescript", "react"],
    references: ["project-shell", "search-index"],
    sources: ["Codebase"],
    icon: "I",
  },
  {
    id: "roadmap",
    title: "Roadmap excerpt",
    summary: "A narrow list of what matters next, without turning into a dashboard.",
    createdAt: "2026-06-11",
    type: "memory",
    cluster: "projects",
    tags: ["roadmap", "scope"],
    references: ["project-shell"],
    sources: ["Notes"],
    icon: "R",
  },
  {
    id: "meeting-notes",
    title: "Meeting with Maya",
    summary: "Conversation about notation, search, and keeping the interface calm.",
    createdAt: "2026-06-10",
    type: "memory",
    cluster: "people",
    tags: ["meeting", "design"],
    references: ["people-index", "research-notes"],
    sources: ["Meeting doc"],
    icon: "M",
  },
  {
    id: "people-index",
    title: "People index",
    summary: "Names linked by projects, citations, and recurring ideas.",
    createdAt: "2026-06-09",
    type: "memory",
    cluster: "people",
    tags: ["people", "index"],
    references: ["meeting-notes", "citations"],
    sources: ["Directory"],
    icon: "N",
  },
  {
    id: "citations",
    title: "Citation trail",
    summary: "Where ideas came from and who introduced them.",
    createdAt: "2026-06-05",
    type: "memory",
    cluster: "people",
    tags: ["citations", "references"],
    references: ["paper-cluster", "people-index"],
    sources: ["Zotero"],
    icon: "C",
  },
  {
    id: "glossary",
    title: "Glossary",
    summary: "Terms that keep the notebook legible across projects.",
    createdAt: "2026-06-04",
    type: "memory",
    cluster: "concepts",
    tags: ["terms", "definitions"],
    references: ["frameworks", "method-notes"],
    sources: ["Notes"],
    icon: "G",
  },
  {
    id: "frameworks",
    title: "Working frameworks",
    summary: "A few durable lenses for deciding what belongs in the graph.",
    createdAt: "2026-06-12",
    type: "memory",
    cluster: "concepts",
    tags: ["framework", "thinking"],
    references: ["glossary", "concept-graph"],
    sources: ["Essay"],
    icon: "F",
  },
  {
    id: "concept-graph",
    title: "Concept graph",
    summary: "A semantic map linking method, theory, and recurring metaphors.",
    createdAt: "2026-06-19",
    type: "memory",
    cluster: "concepts",
    tags: ["knowledge graph", "semantics"],
    references: ["frameworks", "search-index"],
    sources: ["Sketch"],
    icon: "K",
  },
  {
    id: "journal-entries",
    title: "Journal entries",
    summary: "A sequence of day notes capturing work, shifts, and small observations.",
    createdAt: "2026-06-20",
    type: "memory",
    cluster: "experiences",
    tags: ["journal", "daily"],
    references: ["field-study", "research-notes"],
    sources: ["Journal"],
    icon: "J",
  },
  {
    id: "field-study",
    title: "Field study",
    summary: "A practical note on how interfaces feel when the graph is the product.",
    createdAt: "2026-06-17",
    type: "memory",
    cluster: "experiences",
    tags: ["observation", "ux"],
    references: ["journal-entries", "project-shell"],
    sources: ["Field log"],
    icon: "F",
  },
  {
    id: "memory-atlas",
    title: "Memory atlas session",
    summary: "An initial session where the graph stabilized and positions were frozen.",
    createdAt: "2026-06-21",
    type: "memory",
    cluster: "experiences",
    tags: ["session", "graph"],
    references: ["project-shell", "graph-layout"],
    sources: ["Prototype"],
    icon: "A",
  },
  {
    id: "search-index",
    title: "Search index",
    summary: "Instant retrieval tuned for fuzzy queries and neighborhood emphasis.",
    createdAt: "2026-06-19",
    type: "memory",
    cluster: "concepts",
    tags: ["search", "fuzzy"],
    references: ["concept-graph", "implementation-notes"],
    sources: ["Index"],
    icon: "S",
  },
  {
    id: "design-study",
    title: "Design study",
    summary: "A quiet study of line weight, spacing, and scholarly interface rhythm.",
    createdAt: "2026-06-16",
    type: "memory",
    cluster: "experiences",
    tags: ["design", "typography"],
    references: ["field-study", "project-shell"],
    sources: ["Notebook"],
    icon: "D",
  },
];

export const MEMORY_LINKS: MemoryLink[] = [
  { id: "l-1", source: "atlas", target: "research", relation: "indexes" },
  { id: "l-2", source: "atlas", target: "projects", relation: "indexes" },
  { id: "l-3", source: "atlas", target: "people", relation: "indexes" },
  { id: "l-4", source: "atlas", target: "concepts", relation: "indexes" },
  { id: "l-5", source: "atlas", target: "experiences", relation: "indexes" },
  { id: "l-6", source: "research", target: "research-notes", relation: "contains" },
  { id: "l-7", source: "research", target: "paper-cluster", relation: "contains" },
  { id: "l-8", source: "research", target: "method-notes", relation: "contains" },
  { id: "l-9", source: "research", target: "graph-layout", relation: "contains" },
  { id: "l-10", source: "projects", target: "project-shell", relation: "contains" },
  { id: "l-11", source: "projects", target: "implementation-notes", relation: "contains" },
  { id: "l-12", source: "projects", target: "roadmap", relation: "contains" },
  { id: "l-13", source: "people", target: "meeting-notes", relation: "contains" },
  { id: "l-14", source: "people", target: "people-index", relation: "contains" },
  { id: "l-15", source: "people", target: "citations", relation: "contains" },
  { id: "l-16", source: "concepts", target: "glossary", relation: "contains" },
  { id: "l-17", source: "concepts", target: "frameworks", relation: "contains" },
  { id: "l-18", source: "concepts", target: "concept-graph", relation: "contains" },
  { id: "l-19", source: "experiences", target: "journal-entries", relation: "contains" },
  { id: "l-20", source: "experiences", target: "field-study", relation: "contains" },
  { id: "l-21", source: "experiences", target: "memory-atlas", relation: "contains" },
  { id: "l-22", source: "research-notes", target: "method-notes", relation: "references" },
  { id: "l-23", source: "research-notes", target: "search-index", relation: "informs" },
  { id: "l-24", source: "graph-layout", target: "project-shell", relation: "inspired by" },
  { id: "l-25", source: "project-shell", target: "memory-atlas", relation: "shapes" },
  { id: "l-26", source: "implementation-notes", target: "search-index", relation: "depends on" },
  { id: "l-27", source: "meeting-notes", target: "design-study", relation: "inspired by" },
  { id: "l-28", source: "frameworks", target: "concept-graph", relation: "frames" },
  { id: "l-29", source: "journal-entries", target: "field-study", relation: "extends" },
  { id: "l-30", source: "citations", target: "paper-cluster", relation: "references" },
];

export function getMemoryById(id: string): MemoryRecord | undefined {
  return MEMORY_NODES.find((memory) => memory.id === id);
}

export function getMemorySearchIndex(memory: MemoryRecord): string {
  return [
    memory.title,
    memory.summary,
    memory.tags.join(" "),
    memory.references.join(" "),
    memory.sources.join(" "),
    memory.cluster,
  ]
    .join(" ")
    .toLowerCase();
}

export function getMemoryNeighbors(memoryId: string): string[] {
  const neighbors = new Set<string>();

  for (const link of MEMORY_LINKS) {
    if (link.source === memoryId) {
      neighbors.add(link.target);
    }

    if (link.target === memoryId) {
      neighbors.add(link.source);
    }
  }

  return [...neighbors];
}
