"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "@xyflow/react";
import { ArrowLeft, Brain } from "lucide-react";

import "@xyflow/react/dist/style.css";

import { getFileTree } from "@/lib/vault-catalog";
import type { FileNode } from "@/types/file-tree";

const CENTER_ID = "hub-brain-md";
const ORBIT_RADIUS = 300;
const CHILD_RADIUS = 160;
const DEEPER_RADIUS = 130;

const CENTER_COLOR = "#fafafa";
const FOLDER_COLOR = "#3f3f46";
const FILE_COLOR = "#27272a";

function polarToXY(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function fileLabel(name: string): string {
  return name.replace(/\.md$/, "");
}

function edgeStyle(opacity = 0.22): Edge["style"] {
  return { stroke: `rgba(255,255,255,${opacity})`, strokeWidth: 1.5 };
}

function buildMindMapGraph(fileTree: FileNode[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: CENTER_ID,
    type: "default",
    position: { x: 0, y: 0 },
    data: { label: "brAIn.md" },
    style: {
      background: CENTER_COLOR,
      color: "#111113",
      border: "2px solid rgba(255,255,255,0.2)",
      borderRadius: 9999,
      padding: "18px 28px",
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      minWidth: 120,
      textAlign: "center",
      boxShadow: "0 0 32px rgba(250,250,250,0.08)",
    },
  });

  const topLevel = fileTree;
  const topLevelCount = topLevel.length;

  function addEdge(source: string, target: string, fromCenter = false) {
    edges.push({
      id: `${source}-${target}`,
      source,
      target,
      style: edgeStyle(fromCenter ? 0.35 : 0.2),
    });
  }

  function addFolderNode(folder: FileNode, x: number, y: number) {
    nodes.push({
      id: folder.id,
      type: "default",
      position: { x, y },
      data: { label: folder.name },
      style: {
        background: FOLDER_COLOR,
        color: "#fafafa",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 10,
        padding: "10px 16px",
        fontSize: 13,
        fontWeight: 600,
        minWidth: 110,
        textAlign: "center",
      },
    });
  }

  function addFileNode(file: FileNode, x: number, y: number) {
    nodes.push({
      id: file.id,
      type: "default",
      position: { x, y },
      data: { label: fileLabel(file.name) },
      style: {
        background: FILE_COLOR,
        color: "#e4e4e7",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: "8px 14px",
        fontSize: 12,
        minWidth: 90,
        textAlign: "center",
      },
    });
  }

  function branchChildren(
    parent: FileNode,
    parentX: number,
    parentY: number,
    outwardAngle: number,
    depth: number,
  ) {
    const children = parent.children ?? [];
    if (children.length === 0) return;

    const radius = depth === 1 ? CHILD_RADIUS : DEEPER_RADIUS;
    const spread = Math.min(Math.PI * 0.75, Math.max(0.45, children.length * 0.38));

    children.forEach((child, index) => {
      const childAngle =
        children.length === 1
          ? outwardAngle
          : outwardAngle - spread / 2 + (spread * index) / (children.length - 1);

      const { x, y } = polarToXY(parentX, parentY, radius, childAngle);

      if (child.type === "folder") {
        addFolderNode(child, x, y);
        addEdge(parent.id, child.id);
        branchChildren(child, x, y, childAngle, depth + 1);
      } else {
        addFileNode(child, x, y);
        addEdge(parent.id, child.id);
      }
    });
  }

  topLevel.forEach((node, index) => {
    const angle =
      topLevelCount === 1
        ? -Math.PI / 2
        : (2 * Math.PI * index) / topLevelCount - Math.PI / 2;

    const { x, y } = polarToXY(0, 0, ORBIT_RADIUS, angle);

    if (node.type === "folder") {
      addFolderNode(node, x, y);
      addEdge(CENTER_ID, node.id, true);
      branchChildren(node, x, y, angle, 1);
    } else {
      addFileNode(node, x, y);
      addEdge(CENTER_ID, node.id, true);
    }
  });

  return { nodes, edges };
}

export function MindGraph() {
  const fileTree = useMemo(() => getFileTree(), []);
  const { nodes, edges } = useMemo(() => buildMindMapGraph(fileTree), [fileTree]);

  const onInit = useCallback(() => {}, []);

  return (
    <div className="mind-graph">
      <header className="mind-graph__header">
        <Link href="/dashboard" className="mind-graph__back">
          <ArrowLeft className="size-4" />
          <span>Hub</span>
        </Link>
        <div className="mind-graph__title-wrap">
          <Brain className="size-4 text-muted-foreground" />
          <h1 className="mind-graph__title">Global Graph View</h1>
        </div>
        <p className="mind-graph__subtitle">Mind-map · radiating from brAIn.md</p>
      </header>

      <div className="mind-graph__canvas">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onInit={onInit}
            nodeOrigin={[0.5, 0.5]}
            fitView
            fitViewOptions={{ padding: 0.35 }}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#3f3f46" gap={24} size={1} />
            <Controls className="mind-graph__controls" />
            <MiniMap
              className="mind-graph__minimap"
              nodeColor={(node) =>
                node.id === CENTER_ID ? CENTER_COLOR : FOLDER_COLOR
              }
              maskColor="rgba(0,0,0,0.6)"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
