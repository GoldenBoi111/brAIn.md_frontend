"use client";

import clsx from "clsx";
import {
  Copy,
  EyeOff,
  Lock,
  PenLine,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TokenProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "mistral"
  | "cohere"
  | "perplexity"
  | "custom";

type TokenRecord = {
  id: string;
  name: string;
  provider: TokenProviderId;
  providerName: string;
  providerUrl: string;
  providerImageUrl: string;
  token: string;
  createdAt: string;
  refreshedAt: string;
  lockedPaths: string[];
  readOnlyPaths: string[];
};

type ProviderOption = {
  id: TokenProviderId;
  name: string;
  accent: string;
  background: string;
  initials: string;
  imageUrl: string;
  sourceUrl: string;
};

const STORAGE_KEY = "brain-md-backend-tokens";

const PROVIDERS: ProviderOption[] = [
  {
    id: "openai",
    name: "OpenAI",
    accent: "#44af69",
    background: "#f0fbf4",
    initials: "OA",
    imageUrl: "https://openai.com/favicon.ico",
    sourceUrl: "https://openai.com",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    accent: "#bc3908",
    background: "#fff3ef",
    initials: "AN",
    imageUrl: "https://www.anthropic.com/favicon.ico",
    sourceUrl: "https://www.anthropic.com",
  },
  {
    id: "google",
    name: "Google",
    accent: "#2b9eb3",
    background: "#eefaff",
    initials: "G",
    imageUrl: "https://www.google.com/favicon.ico",
    sourceUrl: "https://www.google.com",
  },
  {
    id: "mistral",
    name: "Mistral",
    accent: "#fcab10",
    background: "#fff9ea",
    initials: "M",
    imageUrl: "https://mistral.ai/favicon.ico",
    sourceUrl: "https://mistral.ai",
  },
  {
    id: "cohere",
    name: "Cohere",
    accent: "#748e54",
    background: "#f7faef",
    initials: "C",
    imageUrl: "https://cohere.com/favicon.ico",
    sourceUrl: "https://cohere.com",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    accent: "#621708",
    background: "#fcf4ef",
    initials: "P",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ753TVIYg-ypZWC8TCPgmPlvpaZDQ3SYNCYZ-r3b256A&s=10",
    sourceUrl: "https://www.perplexity.ai",
  },
  {
    id: "custom",
    name: "Custom",
    accent: "#f6aa1c",
    background: "#fff6df",
    initials: "CU",
    imageUrl: "",
    sourceUrl: "https://example.com",
  },
];

function getProviderDefaults(provider: TokenProviderId): ProviderOption {
  return PROVIDERS.find((option) => option.id === provider) ?? PROVIDERS[0];
}

const DEFAULT_TOKENS: TokenRecord[] = [
  {
    id: "token-docs-bot",
    name: "Docs bot",
    provider: "openai",
    providerName: "OpenAI",
    providerUrl: "https://openai.com",
    providerImageUrl: "https://openai.com/favicon.ico",
    token: "tk_openai_docs_bot_seed",
    createdAt: "2026-06-21T12:00:00.000Z",
    refreshedAt: "2026-06-21T12:00:00.000Z",
    lockedPaths: [],
    readOnlyPaths: [],
  },
  {
    id: "token-research-relay",
    name: "Research relay",
    provider: "anthropic",
    providerName: "Anthropic",
    providerUrl: "https://www.anthropic.com",
    providerImageUrl: "https://www.anthropic.com/favicon.ico",
    token: "tk_anthropic_relay_seed",
    createdAt: "2026-06-21T12:00:00.000Z",
    refreshedAt: "2026-06-21T12:00:00.000Z",
    lockedPaths: ["Brain Vault / Personal / Goals.md"],
    readOnlyPaths: [],
  },
  {
    id: "token-vault-sync",
    name: "Vault sync",
    provider: "google",
    providerName: "Google",
    providerUrl: "https://www.google.com",
    providerImageUrl: "https://www.google.com/favicon.ico",
    token: "tk_google_sync_seed",
    createdAt: "2026-06-21T12:00:00.000Z",
    refreshedAt: "2026-06-21T12:00:00.000Z",
    lockedPaths: [],
    readOnlyPaths: ["Brain Vault / Projects", "Brain Vault / Personal"],
  },
];

function getRandomHex(size: number): string {
  const bytes = new Uint8Array(size);

  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.filter((value): value is string => typeof value === "string"))).sort();
}

function normalizeTokenRecord(record: Partial<TokenRecord>): TokenRecord {
  const provider = getProviderDefaults((record.provider ?? "openai") as TokenProviderId);

  return {
    id: record.id ?? `token-${getRandomHex(6)}`,
    name: record.name ?? "Untitled token",
    provider: provider.id,
    providerName: record.providerName ?? provider.name,
    providerUrl: record.providerUrl ?? provider.sourceUrl,
    providerImageUrl: record.providerImageUrl ?? provider.imageUrl,
    token: record.token ?? `tk_${getRandomHex(18)}`,
    createdAt: record.createdAt ?? new Date().toISOString(),
    refreshedAt: record.refreshedAt ?? new Date().toISOString(),
    lockedPaths: normalizeStringArray(record.lockedPaths),
    readOnlyPaths: normalizeStringArray(record.readOnlyPaths),
  };
}

function createTokenRecord(
  name: string,
  providerId: TokenProviderId,
  providerName: string,
  providerUrl: string,
  providerImageUrl: string,
): TokenRecord {
  const provider = getProviderDefaults(providerId);
  const now = new Date().toISOString();

  return {
    id: `token-${getRandomHex(6)}`,
    name,
    provider: provider.id,
    providerName,
    providerUrl,
    providerImageUrl: providerImageUrl || provider.imageUrl,
    token: `tk_${getRandomHex(18)}`,
    createdAt: now,
    refreshedAt: now,
    lockedPaths: [],
    readOnlyPaths: [],
  };
}

function loadTokens(): TokenRecord[] {
  if (typeof window === "undefined") return DEFAULT_TOKENS.map(normalizeTokenRecord);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TOKENS.map(normalizeTokenRecord);

    const parsed = JSON.parse(raw) as Partial<TokenRecord>[];
    return parsed.length ? parsed.map(normalizeTokenRecord) : DEFAULT_TOKENS.map(normalizeTokenRecord);
  } catch {
    return DEFAULT_TOKENS.map(normalizeTokenRecord);
  }
}

function formatTokenPreview(token: string): string {
  if (token.length <= 12) return token;
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Just now";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function providerAvatar(provider: ProviderOption): string {
  return provider.imageUrl;
}

function PermissionModeBadge({
  mode,
  count,
}: {
  mode: "locked" | "readOnly";
  count: number;
}) {
  return (
    <span className={clsx("backend-token-admin__permission-pill", mode === "locked" && "backend-token-admin__permission-pill--locked")}>
      {mode === "locked" ? <Lock className="size-3" /> : <EyeOff className="size-3" />}
      <span>{mode === "locked" ? "Locked" : "Read only"}</span>
      <strong>{count}</strong>
    </span>
  );
}

function ProviderBadge({
  provider,
  imageUrl,
}: {
  provider: ProviderOption;
  imageUrl?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolvedImageUrl = provider.id === "custom" ? imageUrl?.trim() ?? "" : providerAvatar(provider);

  useEffect(() => {
    setFailed(false);
  }, [resolvedImageUrl]);

  if (provider.id === "custom") {
    if (resolvedImageUrl && !failed) {
      return (
        <img
          src={resolvedImageUrl}
          alt={`${provider.name} logo`}
          onError={() => setFailed(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      );
    }

    return (
      <span
        className="backend-token-admin__provider-fallback backend-token-admin__provider-fallback--custom"
        style={{ background: provider.background, color: provider.accent }}
      >
        {provider.name}
      </span>
    );
  }

  if (failed) {
    return (
      <span
        className="backend-token-admin__provider-fallback"
        style={{ background: provider.background, color: provider.accent }}
      >
        {provider.initials}
      </span>
    );
  }

  return (
    <img
      src={resolvedImageUrl}
      alt={`${provider.name} logo`}
      onError={() => setFailed(true)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

export function BackendTokenAdmin() {
  const [hydrated, setHydrated] = useState(false);
  const [tokens, setTokens] = useState<TokenRecord[]>(DEFAULT_TOKENS.map(normalizeTokenRecord));
  const [draftName, setDraftName] = useState("Design relay");
  const [draftProvider, setDraftProvider] = useState<TokenProviderId>("mistral");
  const [draftProviderName, setDraftProviderName] = useState(getProviderDefaults("mistral").name);
  const [draftProviderUrl, setDraftProviderUrl] = useState(getProviderDefaults("mistral").sourceUrl);
  const [draftProviderImageUrl, setDraftProviderImageUrl] = useState(getProviderDefaults("mistral").imageUrl);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  useEffect(() => {
    setTokens(loadTokens());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  }, [hydrated, tokens]);

  const providerLookup = useMemo(
    () =>
      Object.fromEntries(PROVIDERS.map((provider) => [provider.id, provider])) as Record<
        TokenProviderId,
        ProviderOption
      >,
    [],
  );

  const handleCreateToken = () => {
    const trimmedName = draftName.trim() || "Untitled token";
    const provider = providerLookup[draftProvider] ?? PROVIDERS[0];
    const nextToken = createTokenRecord(
      trimmedName,
      draftProvider,
      draftProviderName.trim() || provider.name,
      draftProviderUrl.trim() || provider.sourceUrl,
      draftProviderImageUrl.trim() || provider.imageUrl,
    );
    setTokens((current) => [nextToken, ...current]);
    setDraftName("");
    setDraftProvider("openai");
    setDraftProviderName(providerLookup.openai.name);
    setDraftProviderUrl(providerLookup.openai.sourceUrl);
    setDraftProviderImageUrl(providerLookup.openai.imageUrl);
  };

  const handleUpdateTokenField = (
    tokenId: string,
    field: "name" | "providerName" | "providerUrl" | "providerImageUrl",
    value: string,
  ) => {
    setTokens((current) =>
      current.map((token) => (token.id === tokenId ? { ...token, [field]: value } : token)),
    );
  };

  const handleRefreshToken = (tokenId: string) => {
    setTokens((current) =>
      current.map((token) =>
        token.id === tokenId
          ? { ...token, token: `tk_${getRandomHex(18)}`, refreshedAt: new Date().toISOString() }
          : token,
      ),
    );
  };

  const handleDeleteToken = (tokenId: string) => {
    setTokens((current) => current.filter((token) => token.id !== tokenId));
    if (copiedTokenId === tokenId) {
      setCopiedTokenId(null);
    }
  };

  const handleCopyToken = async (tokenId: string, tokenValue: string) => {
    try {
      await navigator.clipboard.writeText(tokenValue);
      setCopiedTokenId(tokenId);
      window.setTimeout(() => setCopiedTokenId(null), 1200);
    } catch {
      // Ignore clipboard failures in the local prototype.
    }
  };

  const handleSelectProvider = (provider: TokenProviderId) => {
    const selected = providerLookup[provider] ?? PROVIDERS[0];
    setDraftProvider(provider);
    setDraftProviderName(selected.name);
    setDraftProviderUrl(selected.sourceUrl);
    setDraftProviderImageUrl(selected.imageUrl);
  };

  return (
    <section className="backend-token-admin">
      <div className="backend-token-admin__head">
        <div>
          <p className="backend-page__eyebrow">Token administration</p>
            <h3 className="backend-token-admin__title">Generate, rename, refresh, and retire tokens.</h3>
            <p className="backend-token-admin__lede">
            Keep the controls local for now. The tokens can be named, refreshed, deleted, tagged with a visual identity,
            and assigned token-scoped vault rules without turning on a backend.
          </p>
        </div>

        <div className="backend-token-admin__stats">
          <div>
            <span>Tokens</span>
            <strong>{tokens.length}</strong>
          </div>
          <div>
            <span>Provider images</span>
            <strong>{PROVIDERS.length}</strong>
          </div>
        </div>
      </div>

      <div className="backend-token-admin__composer">
        <label className="backend-token-admin__field">
          <span>Token name</span>
          <input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Design relay"
          />
        </label>

        <div className="backend-token-admin__provider-picker">
          <div className="backend-token-admin__provider-label">
            <span>Visual identity</span>
            <span>Choose a provider or a custom identity for this token</span>
          </div>
          <div className="backend-token-admin__provider-grid">
            {PROVIDERS.map((provider) => {
              const selected = provider.id === draftProvider;

              return (
                <button
                  key={provider.id}
                  type="button"
                  className={clsx(
                    "backend-token-admin__provider-card",
                    selected && "backend-token-admin__provider-card--selected",
                  )}
                  onClick={() => handleSelectProvider(provider.id)}
                >
                  <ProviderBadge provider={provider} />
                  <span>{provider.name}</span>
                </button>
              );
            })}
          </div>
          <div className="backend-token-admin__field-grid">
            <label className="backend-token-admin__field backend-token-admin__field--compact">
              <span>Provider name</span>
              <input
                value={draftProviderName}
                onChange={(event) => setDraftProviderName(event.target.value)}
                placeholder="Perplexity"
              />
            </label>
            <label className="backend-token-admin__field backend-token-admin__field--compact">
              <span>Provider URL</span>
              <input
                value={draftProviderUrl}
                onChange={(event) => setDraftProviderUrl(event.target.value)}
                placeholder="https://www.perplexity.ai"
              />
            </label>
            {draftProvider === "custom" ? (
              <label className="backend-token-admin__field backend-token-admin__field--compact">
                <span>Identity image URL</span>
                <input
                  value={draftProviderImageUrl}
                  onChange={(event) => setDraftProviderImageUrl(event.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </label>
            ) : null}
          </div>
        </div>

        <button type="button" className="backend-token-admin__create" onClick={handleCreateToken}>
          <Plus className="size-4" />
          <span>Generate token</span>
        </button>
      </div>

      <div className="backend-token-admin__list">
        {tokens.map((token) => {
          const provider = providerLookup[token.provider] ?? PROVIDERS[0];

          return (
            <article key={token.id} className="backend-token-admin__card">
              <div className="backend-token-admin__card-head">
                <div className="backend-token-admin__identity">
                  <ProviderBadge provider={provider} imageUrl={token.providerImageUrl} />
                  <div>
                    <p>{token.providerName}</p>
                    <a href={token.providerUrl} target="_blank" rel="noreferrer">
                      {token.providerUrl}
                    </a>
                  </div>
                </div>
              </div>

              <label className="backend-token-admin__field backend-token-admin__field--compact">
                <span>Name</span>
                <input
                  value={token.name}
                  onChange={(event) => handleUpdateTokenField(token.id, "name", event.target.value)}
                />
              </label>

              <div className="backend-token-admin__field-grid">
                <label className="backend-token-admin__field backend-token-admin__field--compact">
                  <span>Provider name</span>
                  <input
                    value={token.providerName}
                    onChange={(event) =>
                      handleUpdateTokenField(token.id, "providerName", event.target.value)
                    }
                  />
                </label>
                <label className="backend-token-admin__field backend-token-admin__field--compact">
                  <span>Provider URL</span>
                  <input
                    value={token.providerUrl}
                    onChange={(event) =>
                      handleUpdateTokenField(token.id, "providerUrl", event.target.value)
                    }
                  />
                </label>
                {token.provider === "custom" ? (
                  <label className="backend-token-admin__field backend-token-admin__field--compact">
                    <span>Identity image URL</span>
                    <input
                      value={token.providerImageUrl}
                      onChange={(event) =>
                        handleUpdateTokenField(token.id, "providerImageUrl", event.target.value)
                      }
                    />
                  </label>
                ) : null}
              </div>

              <div className="backend-token-admin__token-row">
                <div>
                  <span>Token preview</span>
                  <strong>{formatTokenPreview(token.token)}</strong>
                </div>
                <button
                  type="button"
                  className="backend-token-admin__copy"
                  onClick={() => handleCopyToken(token.id, token.token)}
                >
                  <Copy className="size-3.5" />
                  <span>{copiedTokenId === token.id ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <div className="backend-token-admin__meta">
                <div>
                  <span>Created</span>
                  <strong>{formatDate(token.createdAt)}</strong>
                </div>
                <div>
                  <span>Refreshed</span>
                  <strong>{formatDate(token.refreshedAt)}</strong>
                </div>
              </div>

              <div className="backend-token-admin__permission-summary">
                <PermissionModeBadge mode="locked" count={token.lockedPaths.length} />
                <PermissionModeBadge mode="readOnly" count={token.readOnlyPaths.length} />
              </div>

              <div className="backend-token-admin__permission-chips">
                {token.lockedPaths.slice(0, 2).map((path) => (
                  <span key={`${token.id}-lock-${path}`} className="backend-token-admin__permission-chip">
                    <Lock className="size-3" />
                    {path}
                  </span>
                ))}
                {token.readOnlyPaths.slice(0, 2).map((path) => (
                  <span key={`${token.id}-read-${path}`} className="backend-token-admin__permission-chip">
                    <EyeOff className="size-3" />
                    {path}
                  </span>
                ))}
              </div>

              <div className="backend-token-admin__provider-grid backend-token-admin__provider-grid--compact">
                {PROVIDERS.map((providerOption) => (
                  <button
                    key={`${token.id}-${providerOption.id}`}
                    type="button"
                    className={clsx(
                      "backend-token-admin__provider-card backend-token-admin__provider-card--compact",
                      token.provider === providerOption.id && "backend-token-admin__provider-card--selected",
                    )}
                    onClick={() =>
                      setTokens((current) =>
                        current.map((currentToken) =>
                          currentToken.id === token.id
                            ? {
                                ...currentToken,
                                provider: providerOption.id,
                                providerName: providerOption.name,
                                providerUrl: providerOption.sourceUrl,
                              }
                            : currentToken,
                        ),
                      )
                    }
                    >
                    <ProviderBadge provider={providerOption} />
                    <span>{providerOption.name}</span>
                  </button>
                ))}
              </div>

              <div className="backend-token-admin__actions">
                <button
                  type="button"
                  className="backend-token-admin__action"
                  onClick={() => handleRefreshToken(token.id)}
                >
                  <RefreshCw className="size-4" />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  className="backend-token-admin__action"
                  onClick={() => handleDeleteToken(token.id)}
                >
                  <Trash2 className="size-4" />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  className="backend-token-admin__action backend-token-admin__action--ghost"
                  onClick={() => {
                    setDraftProvider(token.provider);
                    setDraftProviderName(token.providerName);
                    setDraftProviderUrl(token.providerUrl);
                  }}
                >
                  <PenLine className="size-4" />
                  <span>Reuse identity</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

    </section>
  );
}
