"use client";

import { useRef, useState } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";

export function useSidebarControls() {
  const sidebarRef = useRef<ImperativePanelHandle>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    const panel = sidebarRef.current;
    if (!panel) return;

    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  };

  return {
    sidebarRef,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
  };
}

export function usePreviewControls() {
  const previewRef = useRef<ImperativePanelHandle>(null);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  const togglePreview = () => {
    const panel = previewRef.current;
    if (!panel) return;

    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  };

  return {
    previewRef,
    previewCollapsed,
    setPreviewCollapsed,
    togglePreview,
  };
}
