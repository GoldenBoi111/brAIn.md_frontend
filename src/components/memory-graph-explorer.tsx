"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
  type CSSProperties,
} from "react";
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  getBezierPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  Copy,
  Focus,
  FolderOpen,
  Hash,
  LayoutGrid,
  Link2,
  Search,
  SquareDashedMousePointer,
  X,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import BrainAnimation from "@/components/brain-animation";
import { clearAuthenticatedSession } from "@/lib/auth";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import {
  getMemoryById,
  getMemoryNeighbors,
  getMemorySearchIndex,
  MEMORY_CLUSTERS,
  MEMORY_LINKS,
  MEMORY_NODES,
  type MemoryCluster,
  type MemoryRecord,
} from "@/lib/memory-graph";
import { cn } from "@/lib/utils";

import "@xyflow/react/dist/style.css";

type ExplorerNodeType = "brain" | "cluster" | "memory";
type ExplorerNode = Node<ExplorerNodeData, ExplorerNodeType>;
type ExplorerEdge = Edge<ExplorerEdgeData>;
type ExplorerFlow = ReactFlowInstance<Node, Edge>;

interface ExplorerNodeData extends Record<string, unknown> {
  memory: MemoryRecord;
  selected: boolean;
  dimmed: boolean;
  highlighted: boolean;
}

interface ExplorerEdgeData extends Record<string, unknown> {
  relation: string;
  dimmed: boolean;
  highlighted: boolean;
}

const clusterPositions: Record<MemoryCluster, { x: number; y: number }> = {
  research: { x: -330, y: -180 },
  projects: { x: 320, y: -180 },
  people: { x: -290, y: 180 },
  concepts: { x: 0, y: 240 },
  experiences: { x: 300, y: 180 },
};

const clusterPalette: Record<MemoryCluster, string> = {
  research: "#4F46E5",
  projects: "#111111",
  people: "#6366F1",
  concepts: "#52525B",
  experiences: "#0F172A",
};

const CORE_NODE_ID = "atlas";

const NODE_RADIUS = {
  brain: 118,
  cluster: 70,
  memory: 58,
};

const NODE_GAP = 18;
const COLLISION_PASSES = 18;

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getMotionStyle(id: string, type: ExplorerNodeType): CSSProperties {
  const hash = hashString(id);
  const duration =
    type === "brain" ? 7.2 : type === "cluster" ? 8.6 + (hash % 3) * 0.35 : 6.5 + (hash % 4) * 0.25;
  const delay = -((hash % 4200) / 1000);
  const drift = type === "brain" ? 4.5 : type === "cluster" ? 2.8 : 1.7;
  const rotate = type === "brain" ? 1 : type === "cluster" ? 0.55 : 0.35;

  return {
    ["--node-float-duration" as string]: `${duration}s`,
    ["--node-float-delay" as string]: `${delay}s`,
    ["--node-float-distance" as string]: `${drift}px`,
    ["--node-float-rotate" as string]: `${rotate}deg`,
  };
}

function getNodeRadius(node: ExplorerNode) {
  if (node.type === "brain") return NODE_RADIUS.brain;
  return node.type === "cluster" ? NODE_RADIUS.cluster : NODE_RADIUS.memory;
}

function resolveNodeSpacing(nodes: ExplorerNode[]) {
  const resolved = nodes.map((node) => ({
    ...node,
    position: { ...node.position },
  })) as ExplorerNode[];

  for (let pass = 0; pass < COLLISION_PASSES; pass += 1) {
    for (let i = 0; i < resolved.length; i += 1) {
      for (let j = i + 1; j < resolved.length; j += 1) {
        const a = resolved[i];
        const b = resolved[j];

        if (a.id === b.id) continue;

        const ax = a.position.x;
        const ay = a.position.y;
        const bx = b.position.x;
        const by = b.position.y;
        const dx = bx - ax;
        const dy = by - ay;
        const distance = Math.hypot(dx, dy) || 0.0001;
        const minimumDistance = getNodeRadius(a) + getNodeRadius(b) + NODE_GAP;

        if (distance >= minimumDistance) continue;

        const overlap = minimumDistance - distance;
        const ux = dx / distance;
        const uy = dy / distance;

        const aIsCluster = a.type === "cluster";
        const bIsCluster = b.type === "cluster";

        if (aIsCluster && !bIsCluster) {
          b.position.x += ux * overlap;
          b.position.y += uy * overlap;
          continue;
        }

        if (!aIsCluster && bIsCluster) {
          a.position.x -= ux * overlap;
          a.position.y -= uy * overlap;
          continue;
        }

        if (aIsCluster && bIsCluster) {
          continue;
        }

        a.position.x -= (ux * overlap) / 2;
        a.position.y -= (uy * overlap) / 2;
        b.position.x += (ux * overlap) / 2;
        b.position.y += (uy * overlap) / 2;
      }
    }
  }

  return resolved;
}

function buildGraph() {
  const nodes: Array<ExplorerNode> = [];
  const edges: Array<ExplorerEdge> = [];

  const memoryLookup = new Map(MEMORY_NODES.map((memory) => [memory.id, memory]));
  const clusterMembers = new Map<MemoryCluster, MemoryRecord[]>();

  for (const cluster of MEMORY_CLUSTERS) {
    clusterMembers.set(cluster.id, []);
  }

  for (const memory of MEMORY_NODES) {
    if (memory.type === "memory") {
      clusterMembers.get(memory.cluster)?.push(memory);
    }
  }

  const coreNode = MEMORY_NODES.find((memory) => memory.id === CORE_NODE_ID);
  if (coreNode) {
    nodes.push({
      id: coreNode.id,
      type: "brain",
      position: { x: 0, y: 0 },
      style: getMotionStyle(coreNode.id, "brain"),
      data: {
        memory: coreNode,
        selected: false,
        dimmed: false,
        highlighted: false,
      },
      draggable: false,
    });
  }

  for (const cluster of MEMORY_CLUSTERS) {
    const members = clusterMembers.get(cluster.id) ?? [];
    const clusterNode = MEMORY_NODES.find((memory) => memory.id === cluster.id);
    if (!clusterNode) continue;

    const rootPosition = clusterPositions[cluster.id];
    nodes.push({
      id: clusterNode.id,
      type: "cluster",
      position: rootPosition,
      style: getMotionStyle(clusterNode.id, "cluster"),
      data: {
        memory: clusterNode,
        selected: false,
        dimmed: false,
        highlighted: false,
      },
      draggable: false,
    });

    const radius = 168 + members.length * 16;
    const spread = Math.min(Math.PI * 1.75, Math.max(Math.PI * 1.1, members.length * 0.62));

    members.forEach((memory, index) => {
      const angle =
        members.length === 1
          ? -Math.PI / 2
          : -spread / 2 + (spread * index) / Math.max(1, members.length - 1);

      nodes.push({
        id: memory.id,
        type: "memory",
        position: {
          x: rootPosition.x + Math.cos(angle) * radius,
          y: rootPosition.y + Math.sin(angle) * radius,
        },
        style: getMotionStyle(memory.id, "memory"),
        data: {
          memory,
          selected: false,
          dimmed: false,
          highlighted: false,
        },
        draggable: false,
      });

      edges.push({
        id: `${clusterNode.id}-${memory.id}`,
        source: clusterNode.id,
        target: memory.id,
        type: "memoryEdge",
        data: {
          relation: "contains",
          dimmed: false,
          highlighted: false,
        },
      });
    });
  }

  const spacedNodes = resolveNodeSpacing(nodes);

  for (const link of MEMORY_LINKS) {
    if (!memoryLookup.has(link.source) || !memoryLookup.has(link.target)) continue;

    edges.push({
      id: link.id,
      source: link.source,
      target: link.target,
      type: "memoryEdge",
      data: {
        relation: link.relation,
        dimmed: false,
        highlighted: false,
      },
    });
  }

  return { nodes: spacedNodes, edges };
}

function getNodeNeighbors(nodeId: string): string[] {
  return getMemoryNeighbors(nodeId);
}

function MemoryNode({ data, selected }: NodeProps<ExplorerNode>) {
  const { memory, dimmed, highlighted } = data;
  const isCluster = memory.type === "cluster";

  return (
    <div
      className={cn(
        "memory-node",
        isCluster && "memory-node--cluster",
        selected && "memory-node--selected",
        highlighted && "memory-node--highlighted",
        dimmed && "memory-node--dimmed",
      )}
      style={{
        borderColor: selected ? "#4F46E5" : highlighted ? "#B4B8FF" : "var(--memory-border)",
        boxShadow: selected
          ? "0 0 0 1px rgba(79,70,229,0.12), 0 12px 28px rgba(17,17,17,0.08)"
          : highlighted
            ? "0 8px 22px rgba(17,17,17,0.06)"
            : "0 4px 12px rgba(17,17,17,0.03)",
      }}
    >
      <Handle type="target" position={Position.Top} className="memory-node__handle" />
      <Handle type="source" position={Position.Bottom} className="memory-node__handle" />
      <Handle type="target" position={Position.Left} className="memory-node__handle" />
      <Handle type="source" position={Position.Right} className="memory-node__handle" />

      <div className="memory-node__eyebrow">
        <span className="memory-node__icon" aria-hidden="true">
          {memory.icon ?? "O"}
        </span>
        <span>{memory.cluster}</span>
      </div>
      <div className="memory-node__title">{memory.title}</div>
      <div className="memory-node__meta">
        <span>{memory.createdAt}</span>
        <span className="memory-node__dot">.</span>
        <span>{memory.tags.slice(0, 2).join(" | ")}</span>
      </div>
    </div>
  );
}

function ClusterNode({ data, selected }: NodeProps<ExplorerNode>) {
  const { memory, dimmed, highlighted } = data;

  return (
    <div
      className={cn(
        "memory-node",
        "memory-node--cluster",
        selected && "memory-node--selected",
        highlighted && "memory-node--highlighted",
        dimmed && "memory-node--dimmed",
      )}
      style={{
        borderColor: selected ? "#4F46E5" : highlighted ? "#9499ff" : clusterPalette[memory.cluster],
        boxShadow: selected
          ? "0 0 0 1px rgba(79,70,229,0.12), 0 16px 34px rgba(17,17,17,0.08)"
          : "0 8px 22px rgba(17,17,17,0.04)",
      }}
    >
      <Handle type="target" position={Position.Top} className="memory-node__handle" />
      <Handle type="source" position={Position.Bottom} className="memory-node__handle" />

      <div className="memory-node__eyebrow">
        <span className="memory-node__cluster-label">{memory.cluster}</span>
      </div>
      <div className="memory-node__title memory-node__title--cluster">{memory.title}</div>
      <div className="memory-node__meta">
        <span>{memory.summary}</span>
      </div>
    </div>
  );
}

function BrainCoreNode({ data, selected }: NodeProps<ExplorerNode>) {
  const { memory, dimmed, highlighted } = data;

  return (
    <div
      className={cn(
        "memory-brain",
        selected && "memory-node--selected",
        highlighted && "memory-node--highlighted",
        dimmed && "memory-node--dimmed",
      )}
      style={{
        borderColor: selected ? "#4F46E5" : highlighted ? "#B4B8FF" : "var(--memory-border)",
        boxShadow: selected
          ? "0 0 0 1px rgba(79,70,229,0.12), 0 16px 34px rgba(17,17,17,0.12)"
            : highlighted
              ? "0 12px 34px rgba(17,17,17,0.09)"
              : "0 12px 28px rgba(17,17,17,0.06)",
      }}
    >
      <Handle type="source" position={Position.Top} className="memory-node__handle" />
      <Handle type="source" position={Position.Bottom} className="memory-node__handle" />
      <Handle type="source" position={Position.Left} className="memory-node__handle" />
      <Handle type="source" position={Position.Right} className="memory-node__handle" />

      <div className="memory-brain__frame">
        <span className="memory-brain__ring memory-brain__ring--outer" />
        <span className="memory-brain__ring memory-brain__ring--middle" />
        <span className="memory-brain__ring memory-brain__ring--inner" />
        <BrainAnimation className="memory-brain__canvas" />
      </div>

      <div className="memory-brain__caption">
        <div className="memory-node__eyebrow">
          <span className="memory-node__icon" aria-hidden="true">
            {memory.icon ?? "B"}
          </span>
          <span>core</span>
        </div>
        <div className="memory-node__title memory-brain__title">{memory.title}</div>
        <div className="memory-node__meta">
          <span>{memory.summary}</span>
        </div>
      </div>
    </div>
  );
}

function MemoryEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
}: EdgeProps<ExplorerEdge>) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const dimmed = data?.dimmed ?? false;
  const highlighted = data?.highlighted ?? false;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: highlighted ? "#4F46E5" : "var(--memory-edge)",
          strokeWidth: highlighted ? 1.35 : 1,
          opacity: dimmed ? 0.08 : highlighted ? 0.75 : 0.35,
        }}
          />
      <EdgeLabelRenderer>
        <div
          className="memory-edge__label nodrag nopan"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            opacity: 0,
          }}
          aria-hidden="true"
        >
          {data?.relation}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

function MemoryExplorerCanvas({
  onReady,
  onNodeSelect,
  onNodeHover,
  selectedIds,
  hoveredId,
  activeIds,
  hoveredEdgeId,
  onEdgeHover,
  onNodeContextMenu,
}: {
  onReady: (instance: unknown) => void;
  onNodeSelect: (id: string, event: React.MouseEvent) => void;
  onNodeHover: (id: string | null) => void;
  selectedIds: string[];
  hoveredId: string | null;
  activeIds: Set<string>;
  hoveredEdgeId: string | null;
  onEdgeHover: (edgeId: string | null) => void;
  onNodeContextMenu: (id: string, x: number, y: number) => void;
}) {
  const nodeTypes = useMemo(
    () => ({ memory: MemoryNode, cluster: ClusterNode, brain: BrainCoreNode }),
    [],
  );
  const edgeTypes = useMemo(() => ({ memoryEdge: MemoryEdge }), []);
  const hasFittedRef = useRef(false);
  const baseGraph = useMemo(() => buildGraph(), []);

  const { nodes, edges } = useMemo(() => {
    const nextNodes = baseGraph.nodes.map((node) => {
      const selected = selectedIds.includes(node.id);
      const highlighted = activeIds.has(node.id) || (hoveredId ? getNodeNeighbors(hoveredId).includes(node.id) : false);
      const dimmed = activeIds.size > 0 && !activeIds.has(node.id);

      return {
        ...node,
        data: {
          ...node.data,
          selected,
          highlighted,
          dimmed,
        },
      };
    });

    const nextEdges = baseGraph.edges.map((edge) => {
      const sourceActive = activeIds.has(edge.source);
      const targetActive = activeIds.has(edge.target);
      const highlighted = sourceActive && targetActive;
      const dimmed = activeIds.size > 0 && !(sourceActive || targetActive);

      return {
        ...edge,
        data: {
          ...(edge.data ?? { relation: "" }),
          highlighted: highlighted || hoveredEdgeId === edge.id,
          dimmed,
        },
      };
    });

    return { nodes: nextNodes, edges: nextEdges };
  }, [activeIds, baseGraph, hoveredEdgeId, hoveredId, selectedIds]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={(event, node) => onNodeSelect(node.id, event as unknown as React.MouseEvent)}
      onNodeDoubleClick={(event, node) => onNodeSelect(node.id, event as unknown as React.MouseEvent)}
      onNodeMouseEnter={(_, node) => onNodeHover(node.id)}
      onNodeMouseLeave={() => onNodeHover(null)}
      onNodeContextMenu={(event, node) => {
        event.preventDefault();
        onNodeContextMenu(node.id, event.clientX, event.clientY);
      }}
      onEdgeMouseEnter={(_, edge) => onEdgeHover(edge.id)}
      onEdgeMouseLeave={() => onEdgeHover(null)}
      onPaneClick={() => {
        onNodeHover(null);
      }}
      onPaneContextMenu={(event) => {
        event.preventDefault();
      }}
      onInit={(instance) => {
        onReady(instance);
        if (hasFittedRef.current) return;
        hasFittedRef.current = true;
        requestAnimationFrame(() => {
          instance.fitView({ padding: 0.2, includeHiddenNodes: false, duration: 180 });
        });
      }}
      nodeOrigin={[0.5, 0.5]}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      selectNodesOnDrag={false}
      panOnDrag
      panOnScroll
      zoomOnScroll
      zoomOnPinch
      onlyRenderVisibleElements
      multiSelectionKeyCode="Shift"
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={28} size={1} color="#E5E7EB" />
      <Controls className="memory-controls" position="bottom-left" />
      <MiniMap
        pannable
        zoomable
        className="memory-minimap"
        maskColor="rgba(255,255,255,0.88)"
        nodeColor={(node) => (node.type === "cluster" ? "#4F46E5" : "#111111")}
      />
      <Panel position="top-right" className="memory-legend">
        <span>{MEMORY_NODES.length} memories</span>
        <span>{MEMORY_LINKS.length} links</span>
        <span>Cmd/Ctrl + K</span>
      </Panel>
    </ReactFlow>
  );
}

function ExplorerSearchDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  onSelectMemory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (value: string) => void;
  onSelectMemory: (id: string) => void;
}) {
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return MEMORY_NODES.filter((memory) =>
      !normalized ? true : getMemorySearchIndex(memory).includes(normalized),
    ).slice(0, 24);
  }, [query]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search memories, tags, sources..."
        value={query}
        onValueChange={onQueryChange}
      />
      <CommandList>
        <CommandEmpty>No matching memories.</CommandEmpty>
        <CommandGroup heading="Memories">
          {matches.map((memory) => (
            <CommandItem
              key={memory.id}
              value={`${memory.title} ${memory.summary} ${memory.tags.join(" ")}`}
              onSelect={() => onSelectMemory(memory.id)}
            >
              <Search className="size-4" />
              <span>{memory.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function MemoryGraphExplorer() {
  const [selectedIds, setSelectedIds] = useState<string[]>(["atlas"]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [flowInstance, setFlowInstance] = useState<ExplorerFlow | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selectedMemory = getMemoryById(selectedIds[selectedIds.length - 1] ?? "atlas") ?? MEMORY_NODES[0];

  const searchMatches = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return new Set<string>();

    return new Set(
      MEMORY_NODES.filter((memory) => getMemorySearchIndex(memory).includes(normalized)).map(
        (memory) => memory.id,
      ),
    );
  }, [searchQuery]);

  const activeIds = useMemo(() => {
    const active = new Set<string>();

    for (const id of selectedIds) {
      active.add(id);
      for (const neighbor of getNodeNeighbors(id)) {
        active.add(neighbor);
      }
    }

    if (hoveredId) {
      active.add(hoveredId);
      for (const neighbor of getNodeNeighbors(hoveredId)) {
        active.add(neighbor);
      }
    }

    for (const id of searchMatches) {
      active.add(id);
      for (const neighbor of getNodeNeighbors(id)) {
        active.add(neighbor);
      }
    }

    return active;
  }, [hoveredId, searchMatches, selectedIds]);

  const focusMemory = useCallback(
    (memoryId: string) => {
      const memory = getMemoryById(memoryId);
      if (!memory || !flowInstance) return;

      startTransition(() => {
        setSelectedIds([memoryId]);
      });

      const position = flowInstance.getNode(memoryId)?.position;
      if (position) {
        flowInstance.setCenter(position.x, position.y, {
          zoom: memory.type === "cluster" ? 1.05 : 1.2,
          duration: 220,
        });
      }
    },
    [flowInstance],
  );

  const handleNodeSelect = useCallback(
    (id: string, event: React.MouseEvent) => {
      if (event.shiftKey) {
        setSelectedIds((current) =>
          current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
        );
        return;
      }

      focusMemory(id);
    },
    [focusMemory],
  );

  const handleKeyboardNavigation = useCallback(
    (event: KeyboardEvent) => {
      if (searchOpen) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const directions: Record<string, { x: number; y: number }> = {
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
      };

      const direction = directions[event.key];
      if (!direction) return;

      event.preventDefault();

      const current = getMemoryById(selectedIds[selectedIds.length - 1] ?? "atlas") ?? MEMORY_NODES[0];
      const currentPosition = current.position ?? { x: 0, y: 0 };
      const candidates = MEMORY_NODES.filter((memory) => memory.id !== current.id);

      const next = candidates
        .map((memory) => {
          const position = memory.position ?? { x: 0, y: 0 };
          const dx = position.x - currentPosition.x;
          const dy = position.y - currentPosition.y;
          const score = direction.x * dx + direction.y * dy - Math.hypot(dx, dy) * 0.001;
          return { memory, score };
        })
        .filter(({ score }) => score > -120)
        .sort((a, b) => b.score - a.score)[0]?.memory;

      if (next) {
        focusMemory(next.id);
      }
    },
    [focusMemory, searchOpen, selectedIds],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardNavigation);
    return () => window.removeEventListener("keydown", handleKeyboardNavigation);
  }, [handleKeyboardNavigation]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as unknown as globalThis.Node)) {
        setContextMenu(null);
      }
    };

    window.addEventListener("mousedown", handleClickAway);
    return () => window.removeEventListener("mousedown", handleClickAway);
  }, []);

  const handleOpenMemory = useCallback(
    (memoryId: string) => {
      setSearchOpen(false);
      setSearchQuery("");
      focusMemory(memoryId);
    },
    [focusMemory],
  );

  const handleSelectMemory = useCallback(
    (memoryId: string) => {
      setSearchOpen(false);
      setSearchQuery("");
      handleOpenMemory(memoryId);
    },
    [handleOpenMemory],
  );

  const handleContextAction = useCallback(
    async (action: "open" | "copy" | "focus-cluster") => {
      if (!contextMenu) return;
      const memory = getMemoryById(contextMenu.id);
      if (!memory) return;

      if (action === "copy") {
        await navigator.clipboard.writeText(memory.title);
      } else if (action === "focus-cluster") {
        focusMemory(memory.cluster);
      } else {
        handleOpenMemory(memory.id);
      }

      setContextMenu(null);
    },
    [contextMenu, focusMemory, handleOpenMemory],
  );

  const panelRelated = useMemo(() => {
    if (!selectedMemory) return [];
    return selectedMemory.references
      .map((id) => getMemoryById(id))
      .filter((memory): memory is MemoryRecord => Boolean(memory));
  }, [selectedMemory]);

  const panelLinked = useMemo(() => {
    if (!selectedMemory) return [];
    return getNodeNeighbors(selectedMemory.id)
      .map((id) => getMemoryById(id))
      .filter((memory): memory is MemoryRecord => Boolean(memory));
  }, [selectedMemory]);

  return (
    <div className="memory-app">
      <header className="memory-app__topbar">
        <div className="memory-app__brand">
          <Brain className="size-4" />
          <div>
            <p className="memory-app__eyebrow">Personal memory graph</p>
            <h1 className="memory-app__title">brAIn.md atlas</h1>
          </div>
        </div>

        <div className="memory-app__toolbar">
          <button type="button" className="memory-app__search" onClick={() => setSearchOpen(true)}>
            <Search className="size-4" />
            <span>Search memories</span>
            <kbd>Ctrl K</kbd>
          </button>
          <ThemeToggleButton />
          <button
            type="button"
            className="memory-app__icon-button"
            onClick={() => focusMemory("atlas")}
            aria-label="Center graph"
          >
            <LayoutGrid className="size-4" />
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

      <main className="memory-app__workspace">
        <section className="memory-app__graph-shell">
          <div className="memory-app__graph-intro">
            <p className="memory-app__kicker">Knowledge map</p>
            <p className="memory-app__lede">
              The graph stays dominant. Click a memory to inspect its notes, tags,
              and references.
            </p>
          </div>

          <div className="memory-app__graph">
            <MemoryExplorerCanvas
              onReady={(instance) => setFlowInstance(instance as ExplorerFlow)}
              onNodeSelect={handleNodeSelect}
              onNodeHover={setHoveredId}
              selectedIds={selectedIds}
              hoveredId={hoveredId}
              activeIds={activeIds}
              hoveredEdgeId={hoveredEdgeId}
              onEdgeHover={setHoveredEdgeId}
              onNodeContextMenu={(id, x, y) => setContextMenu({ id, x, y })}
            />
          </div>
        </section>

        <aside className="memory-app__panel">
          <article className="memory-panel">
            <header className="memory-panel__header">
              <div className="memory-panel__eyebrow">
                <FolderOpen className="size-3.5" />
                <span>Selected memory</span>
              </div>
              <h2 className="memory-panel__title">{selectedMemory.title}</h2>
              <p className="memory-panel__summary">{selectedMemory.summary}</p>
            </header>

            <dl className="memory-panel__facts">
              <div>
                <dt>Created</dt>
                <dd>
                  <CalendarDays className="size-3.5" />
                  <span>{selectedMemory.createdAt}</span>
                </dd>
              </div>
              <div>
                <dt>Cluster</dt>
                <dd>
                  <Hash className="size-3.5" />
                  <span>{selectedMemory.cluster}</span>
                </dd>
              </div>
              <div>
                <dt>Sources</dt>
                <dd>
                  <Link2 className="size-3.5" />
                  <span>{selectedMemory.sources.join(" | ")}</span>
                </dd>
              </div>
            </dl>

            <section className="memory-panel__section">
              <h3>Tags</h3>
              <div className="memory-panel__chips">
                {selectedMemory.tags.map((tag) => (
                  <span key={tag} className="memory-panel__chip">
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            <section className="memory-panel__section">
              <h3>Linked memories</h3>
              <ul className="memory-panel__list">
                {panelLinked.map((memory) => (
                  <li key={memory.id}>
                    <button type="button" onClick={() => handleOpenMemory(memory.id)}>
                      <span>{memory.title}</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="memory-panel__section">
              <h3>Source references</h3>
              <ul className="memory-panel__refs">
                {panelRelated.map((memory) => (
                  <li key={memory.id}>
                    <span>{memory.title}</span>
                    <span>{memory.createdAt}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="memory-panel__section">
              <h3>Actions</h3>
              <div className="memory-panel__actions">
                <button type="button" onClick={() => handleOpenMemory(selectedMemory.id)}>
                  Open memory
                </button>
                <button type="button" onClick={() => navigator.clipboard.writeText(selectedMemory.title)}>
                  <Copy className="size-3.5" />
                  <span>Copy title</span>
                </button>
                <button type="button" onClick={() => focusMemory("atlas")}>
                  <Focus className="size-3.5" />
                  <span>Focus atlas</span>
                </button>
              </div>
            </section>
          </article>
        </aside>
      </main>

      <button type="button" className="memory-fab memory-fab--search" onClick={() => setSearchOpen(true)}>
        <Search className="size-4" />
        <span>Search</span>
      </button>
      <button
        type="button"
        className="memory-fab memory-fab--panel"
        onClick={() => focusMemory(selectedMemory.id)}
      >
        <SquareDashedMousePointer className="size-4" />
        <span>Focus</span>
      </button>

      {contextMenu ? (
        <div
          ref={menuRef}
          className="memory-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button type="button" onClick={() => handleContextAction("open")}>
            Open memory
          </button>
          <button type="button" onClick={() => handleContextAction("focus-cluster")}>
            Focus cluster
          </button>
          <button type="button" onClick={() => handleContextAction("copy")}>
            Copy title
          </button>
        </div>
      ) : null}

      <ExplorerSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onSelectMemory={handleSelectMemory}
      />
    </div>
  );
}
