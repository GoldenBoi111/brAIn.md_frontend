"use client";

import dynamic from "next/dynamic";

import { VaultSkeleton } from "@/components/vault-skeleton";

const AppShell = dynamic(
  () => import("@/components/app-shell").then((mod) => mod.AppShell),
  {
    ssr: false,
    loading: () => <VaultSkeleton />,
  },
);

interface VaultRootProps {
  folderId: string;
}

export function VaultRoot({ folderId }: VaultRootProps) {
  return <AppShell folderId={folderId} />;
}
