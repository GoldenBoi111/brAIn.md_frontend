import { notFound } from "next/navigation";

import { VaultRoot } from "@/components/vault-root";

interface VaultPageProps {
  params: Promise<{ folderId: string }>;
}

export default async function VaultPage({ params }: VaultPageProps) {
  const { folderId } = await params;

  if (!folderId.startsWith("folder-")) {
    notFound();
  }

  return <VaultRoot folderId={folderId} />;
}
