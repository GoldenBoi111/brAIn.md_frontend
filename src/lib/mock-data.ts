import type { FileNode } from "@/types/file-tree";

export const MOCK_FILE_TREE: FileNode[] = [
  {
    id: "folder-brain-vault",
    name: "Brain Vault",
    type: "folder",
    createdAt: "2026-05-28",
    children: [
      {
        id: "folder-personal",
        name: "Personal",
        type: "folder",
        createdAt: "2026-05-30",
        children: [
          {
            id: "file-journal",
            name: "Journal.md",
            type: "file",
            createdAt: "2026-06-20",
          },
          {
            id: "file-goals",
            name: "Goals.md",
            type: "file",
            createdAt: "2026-06-14",
            llmAccess: "no_write",
          },
        ],
      },
      {
        id: "folder-projects",
        name: "Projects",
        type: "folder",
        createdAt: "2026-06-01",
        children: [
          {
            id: "folder-brain-md",
            name: "brAIn.md",
            type: "folder",
            createdAt: "2026-06-01",
            children: [
              {
                id: "file-architecture",
                name: "Architecture.md",
                type: "file",
                createdAt: "2026-06-11",
              },
              {
                id: "file-roadmap",
                name: "Roadmap.md",
                type: "file",
                createdAt: "2026-06-18",
              },
            ],
          },
        ],
      },
      {
        id: "file-ideas",
        name: "Ideas.md",
        type: "file",
        createdAt: "2026-06-21",
      },
      {
        id: "file-inbox",
        name: "Inbox.md",
        type: "file",
        createdAt: "2026-06-19",
        llmAccess: "hidden",
      },
    ],
  },
];

export const MOCK_FILE_CONTENTS: Record<string, string> = {
  "file-ideas": `# Welcome to brAIn.md

A local markdown vault to store your memories.

## Features

- **File explorer** — browse your vault in the sidebar
- **Split editor** — write raw markdown alongside a live preview
- **Command palette** — press \`Cmd+K\` to search and act

> Start writing. Your notes stay on your machine.
`,
  "file-journal": `# Journal

## 2026-06-18

Started building the brAIn.md frontend today. The Obsidian-style layout feels right — dense, fast, and focused.

### Tomorrow
- Wire up the local backend API
- Add proper markdown rendering
`,
  "file-goals": `# Goals

> AI can read this note but cannot edit it.

## Q2 2026
- [ ] Ship MVP vault sync
- [ ] Vector search integration
- [ ] End-to-end encryption for sensitive notes
`,
  "file-architecture": `# Architecture

## Overview

brAIn.md separates the UI shell from a local backend that owns the filesystem, catalog, and vector database.

\`\`\`
┌─────────────┐     REST/WS     ┌──────────────────┐
│  Next.js UI │ ◄──────────────► │  Local Backend   │
│  (reactive) │                  │  FS + Catalog    │
└─────────────┘                  │  + Vector DB     │
                                 └──────────────────┘
\`\`\`

## Principles
1. UI is a reactive shell — no direct filesystem access
2. Backend maintains a stable catalog
3. All mutations flow through the API
`,
  "file-roadmap": `# Roadmap

## Phase 1 — Shell ✓
- [x] Resizable three-pane layout
- [x] File tree with mock data
- [x] Command palette

## Phase 2 — Backend Integration
- [ ] Connect to local API
- [ ] Real file read/write
- [ ] Global state store

## Phase 3 — Intelligence
- [ ] Semantic search
- [ ] AI actions via command palette
`,
  "file-inbox": `# Inbox

> Hidden from AI — your unsorted thoughts stay private from the assistant.

- Research local-first sync patterns
- Look into CRDTs for conflict resolution
`,
};

export const DEFAULT_FILE_ID = "file-ideas";

export interface MockVault {
  id: string;
  name: string;
  description: string;
  fileCount: number;
}

export const MOCK_VAULTS: MockVault[] = [
  {
    id: "folder-brain-vault",
    name: "Brain Vault",
    description: "One place for every memory, folder, and project.",
    fileCount: 6,
  },
];
