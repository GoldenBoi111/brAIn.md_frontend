"use client";

import clsx from "clsx";
import { Check, EyeOff, Lock, Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

type TokenProviderId = "openai" | "anthropic" | "google" | "mistral" | "cohere" | "perplexity";

type TokenRecord = {
  id: string;
  name: string;
  provider: TokenProviderId;
  providerName: string;
  providerUrl: string;
  token: string;
  createdAt: string;
  refreshedAt: string;
  lockedPaths: string[];
  readOnlyPaths: string[];
};

const STORAGE_KEY = "brain-md-backend-tokens";

function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.filter((value): value is string => typeof value === "string"))).sort();
}

function normalizeTokenRecord(record: Partial<TokenRecord>): TokenRecord {
  return {
    id: record.id ?? "token-unknown",
    name: record.name ?? "Untitled token",
    provider: (record.provider ?? "openai") as TokenProviderId,
    providerName: record.providerName ?? "OpenAI",
    providerUrl: record.providerUrl ?? "https://openai.com",
    token: record.token ?? "tk_unknown",
    createdAt: record.createdAt ?? new Date().toISOString(),
    refreshedAt: record.refreshedAt ?? new Date().toISOString(),
    lockedPaths: normalizeStringArray(record.lockedPaths),
    readOnlyPaths: normalizeStringArray(record.readOnlyPaths),
  };
}

function loadTokens(): TokenRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Partial<TokenRecord>[];
    return parsed.map(normalizeTokenRecord);
  } catch {
    return [];
  }
}

function saveTokens(tokens: TokenRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

function updateTokenPermissions(
  token: TokenRecord,
  filePath: string,
  mode: "locked" | "readOnly",
): TokenRecord {
  const lockedPaths = new Set(token.lockedPaths);
  const readOnlyPaths = new Set(token.readOnlyPaths);

  if (mode === "locked") {
    if (lockedPaths.has(filePath)) {
      lockedPaths.delete(filePath);
    } else {
      lockedPaths.add(filePath);
      readOnlyPaths.delete(filePath);
    }
  } else if (readOnlyPaths.has(filePath)) {
    readOnlyPaths.delete(filePath);
  } else {
    readOnlyPaths.add(filePath);
    lockedPaths.delete(filePath);
  }

  return {
    ...token,
    lockedPaths: Array.from(lockedPaths).sort(),
    readOnlyPaths: Array.from(readOnlyPaths).sort(),
  };
}

interface TokenAccessPaletteProps {
  open: boolean;
  mode: "locked" | "readOnly";
  fileName: string | null;
  filePath: string | null;
  onOpenChange: (open: boolean) => void;
}

export function TokenAccessPalette({
  open,
  mode,
  fileName,
  filePath,
  onOpenChange,
}: TokenAccessPaletteProps) {
  const [hydrated, setHydrated] = useState(false);
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    setTokens(loadTokens());
    setSearch("");
  }, [open]);

  useEffect(() => {
    if (!hydrated) return;
    saveTokens(tokens);
  }, [hydrated, tokens]);

  const filteredTokens = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return tokens;

    return tokens.filter((token) => {
      const haystack = [
        token.name,
        token.providerName,
        token.providerUrl,
        token.lockedPaths.join(" "),
        token.readOnlyPaths.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [search, tokens]);

  const handleToggle = (tokenId: string) => {
    if (!filePath) return;

    setTokens((current) =>
      current.map((token) =>
        token.id === tokenId ? updateTokenPermissions(token, filePath, mode) : token,
      ),
    );
  };

  const dialogTitle = mode === "locked" ? "Lock tokens for this file" : "Restrict token writes for this file";
  const pillLabel = mode === "locked" ? "Locked from writing" : "Write restricted";
  const actionLabel = mode === "locked" ? "Lock" : "Read only";
  const ActionIcon = mode === "locked" ? Lock : EyeOff;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="backend-token-admin__palette">
        <div className="backend-token-admin__palette-head">
          <div>
            <p className="backend-page__eyebrow">Vault token palette</p>
            <h3 className="backend-token-admin__title">{fileName ?? "Select a file"}</h3>
            <p className="backend-token-admin__lede">
              {dialogTitle}. The palette shows which tokens are currently blocked from writing to this file.
            </p>
          </div>

          <div className="backend-token-admin__palette-file">
            <Shield className="size-4" />
            <div>
              <span>File</span>
              <strong>{filePath ?? "No file selected"}</strong>
            </div>
          </div>
        </div>

        <CommandInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search tokens..."
        />

        <CommandList className="backend-token-admin__palette-list">
          <CommandEmpty>No tokens found.</CommandEmpty>
          <CommandGroup heading="Token access">
            {filteredTokens.map((token) => {
              const locked = filePath ? token.lockedPaths.includes(filePath) : false;
              const readOnly = filePath ? token.readOnlyPaths.includes(filePath) : false;

              return (
                <CommandItem key={token.id} value={`${token.name} ${token.providerName}`} className="backend-token-admin__palette-item backend-token-admin__palette-item--token">
                  <span
                    className={clsx(
                      "backend-token-admin__palette-check",
                      (locked || readOnly) && "backend-token-admin__palette-check--selected",
                    )}
                  >
                    {locked || readOnly ? <Check className="size-3.5" /> : null}
                  </span>

                  <div className="backend-token-admin__palette-copy">
                    <span>{token.name}</span>
                    <span>{token.providerName}</span>
                  </div>

                  <div className="backend-token-admin__token-status">
                    <span className={clsx("backend-token-admin__token-status-pill", (mode === "locked" ? locked : readOnly) && "backend-token-admin__token-status-pill--active")}>
                      {mode === "locked" ? <Lock className="size-3" /> : <EyeOff className="size-3" />}
                      <span>{pillLabel}</span>
                    </span>
                    <strong>{mode === "locked" ? (locked && filePath ? filePath : "None") : readOnly && filePath ? filePath : "None"}</strong>
                  </div>

                  <div className="backend-token-admin__token-mode-actions">
                    <button
                      type="button"
                      className={clsx(
                        "backend-token-admin__mode-button",
                        (mode === "locked" ? locked : readOnly) &&
                          "backend-token-admin__mode-button--active",
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleToggle(token.id);
                      }}
                      disabled={!filePath}
                    >
                      <ActionIcon className="size-4" />
                      <span>{actionLabel}</span>
                    </button>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </div>
    </CommandDialog>
  );
}
