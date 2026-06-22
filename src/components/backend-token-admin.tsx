"use client";

import clsx from "clsx";
import {
  Copy,
  EyeOff,
  Lock,
  PenLine,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { backendApi, type ApiTokenRecord } from "@/lib/backend-api";

type TokenProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "mistral"
  | "cohere"
  | "perplexity"
  | "custom";

type ProviderOption = {
  id: TokenProviderId;
  name: string;
  accent: string;
  background: string;
  initials: string;
  imageUrl: string;
  sourceUrl: string;
};

type TokenRecord = {
  tokenId: string;
  tokenName: string;
  subject: string;
  source: string;
  providerName: string;
  createdBy: string;
  oauthClientId: string;
  oauthClientName: string;
  description: string;
  avatarUrl: string;
  avatarAlt: string;
  avatarBackground: string;
  scopes: string[];
  readRoots: string[];
  writeRoots: string[];
  lockedPaths: string[];
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  lastUsedAt: number | null;
  revokedAt: number | null;
};

type TokenDraft = {
  tokenName: string;
  subject: string;
  providerName: string;
  description: string;
  avatarUrl: string;
  avatarAlt: string;
  avatarBackground: string;
  scopesText: string;
  readRootsText: string;
  writeRootsText: string;
};

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

const DEFAULT_PROVIDER = PROVIDERS[0];
const DEFAULT_CREATE_DRAFT = defaultCreateDraft();

function getProviderByName(providerName: string): ProviderOption {
  const lower = providerName.trim().toLowerCase();
  return (
    PROVIDERS.find((provider) => provider.name.toLowerCase() === lower) ??
    PROVIDERS.find((provider) => provider.id === "custom") ??
    DEFAULT_PROVIDER
  );
}

function parseList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/g)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).sort();
}

function joinList(values: string[]): string {
  return values.join(", ");
}

function formatDate(seconds: number | null): string {
  if (!seconds) return "Never";
  const parsed = new Date(seconds * 1000);
  if (Number.isNaN(parsed.getTime())) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatTokenPreview(tokenId: string): string {
  if (tokenId.length <= 12) return tokenId;
  return `${tokenId.slice(0, 6)}...${tokenId.slice(-4)}`;
}

function normalizeTokenRecord(record: ApiTokenRecord): TokenRecord {
  return {
    tokenId: record.token_id,
    tokenName: record.token_name,
    subject: record.subject,
    source: record.source,
    providerName: record.provider_name,
    createdBy: record.created_by,
    oauthClientId: record.oauth_client_id,
    oauthClientName: record.oauth_client_name,
    description: record.description,
    avatarUrl: record.avatar_url,
    avatarAlt: record.avatar_alt,
    avatarBackground: record.avatar_background,
    scopes: Array.from(new Set(record.scopes.map((value) => String(value)))).sort(),
    readRoots: Array.from(new Set(record.read_roots.map((value) => String(value)))).sort(),
    writeRoots: Array.from(new Set(record.write_roots.map((value) => String(value)))).sort(),
    lockedPaths: Array.from(new Set(record.locked_paths.map((value) => String(value)))).sort(),
    createdAt: Number(record.created_at ?? 0),
    updatedAt: Number(record.updated_at ?? 0),
    expiresAt: Number(record.expires_at ?? 0),
    lastUsedAt: record.last_used_at === null ? null : Number(record.last_used_at ?? 0),
    revokedAt: record.revoked_at === null ? null : Number(record.revoked_at ?? 0),
  };
}

function draftFromToken(token: TokenRecord): TokenDraft {
  return {
    tokenName: token.tokenName,
    subject: token.subject,
    providerName: token.providerName,
    description: token.description,
    avatarUrl: token.avatarUrl,
    avatarAlt: token.avatarAlt,
    avatarBackground: token.avatarBackground,
    scopesText: joinList(token.scopes),
    readRootsText: joinList(token.readRoots),
    writeRootsText: joinList(token.writeRoots),
  };
}

function defaultCreateDraft(): TokenDraft {
  const provider = DEFAULT_PROVIDER;
  return {
    tokenName: "Design relay",
    subject: "ui",
    providerName: provider.name,
    description: "",
    avatarUrl: provider.imageUrl,
    avatarAlt: `${provider.name} logo`,
    avatarBackground: provider.background,
    scopesText: "mcp",
    readRootsText: "docs",
    writeRootsText: "docs",
  };
}

function ProviderBadge({
  provider,
  imageUrl,
  background,
  alt,
}: {
  provider: ProviderOption;
  imageUrl?: string;
  background?: string;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolvedImageUrl = imageUrl?.trim() || provider.imageUrl;
  const resolvedBackground = background?.trim() || provider.background;

  useEffect(() => {
    setFailed(false);
  }, [resolvedImageUrl]);

  if (provider.id === "custom" && !resolvedImageUrl && !failed) {
    return (
      <span
        className="backend-token-admin__provider-fallback backend-token-admin__provider-fallback--custom"
        style={{ background: resolvedBackground, color: provider.accent }}
      >
        {provider.name}
      </span>
    );
  }

  if (!resolvedImageUrl || failed) {
    return (
      <span
        className="backend-token-admin__provider-fallback"
        style={{ background: resolvedBackground, color: provider.accent }}
      >
        {provider.initials}
      </span>
    );
  }

  return (
    <img
      src={resolvedImageUrl}
      alt={alt || `${provider.name} logo`}
      onError={() => setFailed(true)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

function PermissionModeBadge({
  mode,
  count,
}: {
  mode: "locked" | "write";
  count: number;
}) {
  return (
    <span
      className={clsx(
        "backend-token-admin__permission-pill",
        mode === "locked" && "backend-token-admin__permission-pill--locked",
      )}
    >
      {mode === "locked" ? <Lock className="size-3" /> : <EyeOff className="size-3" />}
      <span>{mode === "locked" ? "Locked roots" : "Write roots"}</span>
      <strong>{count}</strong>
    </span>
  );
}

function TokenStatus({
  revokedAt,
  expiresAt,
}: {
  revokedAt: number | null;
  expiresAt: number;
}) {
  if (revokedAt) {
    return (
      <span className="backend-token-admin__token-status-pill backend-token-admin__token-status-pill--active">
        <ShieldAlert className="size-3" />
        Revoked
      </span>
    );
  }

  if (expiresAt * 1000 < Date.now()) {
    return <span className="backend-token-admin__token-status-pill">Expired</span>;
  }

  return (
    <span className="backend-token-admin__token-status-pill backend-token-admin__token-status-pill--active">
      Active
    </span>
  );
}

export function BackendTokenAdmin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, TokenDraft>>({});
  const [savingTokenIds, setSavingTokenIds] = useState<string[]>([]);
  const [deletingTokenIds, setDeletingTokenIds] = useState<string[]>([]);
  const [freshToken, setFreshToken] = useState<{ tokenId: string; tokenName: string; token: string } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const [draftName, setDraftName] = useState(DEFAULT_CREATE_DRAFT.tokenName);
  const [draftSubject, setDraftSubject] = useState(DEFAULT_CREATE_DRAFT.subject);
  const [draftProvider, setDraftProvider] = useState<TokenProviderId>("mistral");
  const [draftProviderName, setDraftProviderName] = useState(DEFAULT_CREATE_DRAFT.providerName);
  const [draftDescription, setDraftDescription] = useState(DEFAULT_CREATE_DRAFT.description);
  const [draftAvatarUrl, setDraftAvatarUrl] = useState(DEFAULT_CREATE_DRAFT.avatarUrl);
  const [draftAvatarAlt, setDraftAvatarAlt] = useState(DEFAULT_CREATE_DRAFT.avatarAlt);
  const [draftAvatarBackground, setDraftAvatarBackground] = useState(DEFAULT_CREATE_DRAFT.avatarBackground);
  const [draftScopesText, setDraftScopesText] = useState(DEFAULT_CREATE_DRAFT.scopesText);
  const [draftReadRootsText, setDraftReadRootsText] = useState(DEFAULT_CREATE_DRAFT.readRootsText);
  const [draftWriteRootsText, setDraftWriteRootsText] = useState(DEFAULT_CREATE_DRAFT.writeRootsText);

  const providerLookup = useMemo(
    () => Object.fromEntries(PROVIDERS.map((provider) => [provider.id, provider])) as Record<TokenProviderId, ProviderOption>,
    [],
  );

  const loadTokens = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await backendApi.listTokens();
      const nextTokens = response.tokens.map(normalizeTokenRecord);
      setTokens(nextTokens);
      setDrafts(Object.fromEntries(nextTokens.map((token) => [token.tokenId, draftFromToken(token)])));
    } catch (loadError) {
      setTokens([]);
      setDrafts({});
      setError(loadError instanceof Error ? loadError.message : "Unable to load tokens.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTokens();
  }, []);

  const updateDraft = (tokenId: string, field: keyof TokenDraft, value: string) => {
    setDrafts((current) => ({
      ...current,
      [tokenId]: {
        ...(current[tokenId] ?? drafts[tokenId] ?? {
          tokenName: "",
          subject: "",
          providerName: "",
          description: "",
          avatarUrl: "",
          avatarAlt: "",
          avatarBackground: "",
          scopesText: "",
          readRootsText: "",
          writeRootsText: "",
        }),
        [field]: value,
      },
    }));
  };

  const handleSelectProvider = (
    provider: ProviderOption,
    mode: "create" | "edit",
    tokenId?: string,
  ) => {
    if (mode === "create") {
      setDraftProvider(provider.id);
      setDraftProviderName(provider.name);
      setDraftAvatarUrl(provider.imageUrl);
      setDraftAvatarAlt(`${provider.name} logo`);
      setDraftAvatarBackground(provider.background);
      return;
    }

    if (!tokenId) return;
    updateDraft(tokenId, "providerName", provider.name);
    updateDraft(tokenId, "avatarUrl", provider.imageUrl);
    updateDraft(tokenId, "avatarAlt", `${provider.name} logo`);
    updateDraft(tokenId, "avatarBackground", provider.background);
  };

  const handleCreateToken = async () => {
    setError(null);
    const provider = providerLookup[draftProvider] ?? DEFAULT_PROVIDER;
    const body = {
      tokenName: draftName.trim() || "Untitled token",
      subject: draftSubject.trim() || "ui",
      providerName: draftProviderName.trim() || provider.name,
      description: draftDescription.trim(),
      avatarUrl: draftAvatarUrl.trim() || provider.imageUrl,
      avatarAlt: draftAvatarAlt.trim() || `${provider.name} logo`,
      avatarBackground: draftAvatarBackground.trim() || provider.background,
      scopes: parseList(draftScopesText).length ? parseList(draftScopesText) : ["mcp"],
      readRoots: parseList(draftReadRootsText),
      writeRoots: parseList(draftWriteRootsText),
    };

    try {
      const response = await backendApi.createToken(body);
      setFreshToken({
        tokenId: response.token_id,
        tokenName: response.token_name,
        token: response.token,
      });
      await loadTokens();
      setDraftName("Design relay");
      setDraftSubject("ui");
      setDraftProvider("mistral");
      setDraftProviderName(providerLookup.mistral.name);
      setDraftDescription("");
      setDraftAvatarUrl(providerLookup.mistral.imageUrl);
      setDraftAvatarAlt(`${providerLookup.mistral.name} logo`);
      setDraftAvatarBackground(providerLookup.mistral.background);
      setDraftScopesText("mcp");
      setDraftReadRootsText("docs");
      setDraftWriteRootsText("docs");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create token.");
    }
  };

  const handleSaveToken = async (tokenId: string) => {
    const draft = drafts[tokenId];
    if (!draft) return;

    setSavingTokenIds((current) => [...current, tokenId]);
    setError(null);

    try {
      const response = await backendApi.updateToken(tokenId, {
        tokenName: draft.tokenName.trim() || "Untitled token",
        subject: draft.subject.trim() || "ui",
        providerName: draft.providerName.trim() || DEFAULT_PROVIDER.name,
        description: draft.description.trim(),
        avatarUrl: draft.avatarUrl.trim(),
        avatarAlt: draft.avatarAlt.trim(),
        avatarBackground: draft.avatarBackground.trim(),
        scopes: parseList(draft.scopesText),
        readRoots: parseList(draft.readRootsText),
        writeRoots: parseList(draft.writeRootsText),
      });

      const updated = normalizeTokenRecord(response.token);
      setTokens((current) => current.map((token) => (token.tokenId === tokenId ? updated : token)));
      setDrafts((current) => ({
        ...current,
        [tokenId]: draftFromToken(updated),
      }));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save token.");
    } finally {
      setSavingTokenIds((current) => current.filter((currentId) => currentId !== tokenId));
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    setSavingTokenIds((current) => [...current, tokenId]);
    setError(null);

    try {
      const response = await backendApi.updateToken(tokenId, { revoked: true });
      const updated = normalizeTokenRecord(response.token);
      setTokens((current) => current.map((token) => (token.tokenId === tokenId ? updated : token)));
      setDrafts((current) => ({
        ...current,
        [tokenId]: draftFromToken(updated),
      }));
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Unable to revoke token.");
    } finally {
      setSavingTokenIds((current) => current.filter((currentId) => currentId !== tokenId));
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    setDeletingTokenIds((current) => [...current, tokenId]);
    setError(null);

    try {
      await backendApi.deleteToken(tokenId);
      setTokens((current) => current.filter((token) => token.tokenId !== tokenId));
      setDrafts((current) => {
        const next = { ...current };
        delete next[tokenId];
        return next;
      });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete token.");
    } finally {
      setDeletingTokenIds((current) => current.filter((currentId) => currentId !== tokenId));
    }
  };

  const handleCopySecret = async () => {
    if (!freshToken?.token) return;
    try {
      await navigator.clipboard.writeText(freshToken.token);
      setCopiedSecret(true);
      window.setTimeout(() => setCopiedSecret(false), 1200);
    } catch {
      // Ignore clipboard failures in the local prototype.
    }
  };

  return (
    <section className="backend-token-admin">
      <div className="backend-token-admin__head">
        <div>
          <p className="backend-page__eyebrow">Token administration</p>
          <h3 className="backend-token-admin__title">Generate, rename, refresh, and retire tokens.</h3>
          <p className="backend-token-admin__lede">
            This page now pulls directly from the website API. Token metadata, provider labels,
            avatar choices, and vault access roots are read from and written back to the server.
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

        <div className="backend-token-admin__field-grid">
          <label className="backend-token-admin__field backend-token-admin__field--compact">
            <span>Subject</span>
            <input
              value={draftSubject}
              onChange={(event) => setDraftSubject(event.target.value)}
              placeholder="ui"
            />
          </label>
          <label className="backend-token-admin__field backend-token-admin__field--compact">
            <span>Provider name</span>
            <input
              value={draftProviderName}
              onChange={(event) => setDraftProviderName(event.target.value)}
              placeholder="Perplexity"
            />
          </label>
        </div>

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
                  onClick={() => handleSelectProvider(provider, "create")}
                >
                  <ProviderBadge provider={provider} />
                  <span>{provider.name}</span>
                </button>
              );
            })}
          </div>
          <div className="backend-token-admin__field-grid">
            <label className="backend-token-admin__field backend-token-admin__field--compact">
              <span>Avatar URL</span>
              <input
                value={draftAvatarUrl}
                onChange={(event) => setDraftAvatarUrl(event.target.value)}
                placeholder="https://openai.com/favicon.ico"
              />
            </label>
            <label className="backend-token-admin__field backend-token-admin__field--compact">
              <span>Avatar alt text</span>
              <input
                value={draftAvatarAlt}
                onChange={(event) => setDraftAvatarAlt(event.target.value)}
                placeholder="OpenAI logo"
              />
            </label>
            <label className="backend-token-admin__field backend-token-admin__field--compact">
              <span>Avatar background</span>
              <input
                value={draftAvatarBackground}
                onChange={(event) => setDraftAvatarBackground(event.target.value)}
                placeholder="#f0fbf4"
              />
            </label>
          </div>
        </div>

        <label className="backend-token-admin__field">
          <span>Description</span>
          <input
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            placeholder="Used for Claude web connections"
          />
        </label>

        <div className="backend-token-admin__field-grid">
          <label className="backend-token-admin__field backend-token-admin__field--compact">
            <span>Scopes</span>
            <input
              value={draftScopesText}
              onChange={(event) => setDraftScopesText(event.target.value)}
              placeholder="mcp"
            />
          </label>
          <label className="backend-token-admin__field backend-token-admin__field--compact">
            <span>Read roots</span>
            <input
              value={draftReadRootsText}
              onChange={(event) => setDraftReadRootsText(event.target.value)}
              placeholder="docs, notes"
            />
          </label>
          <label className="backend-token-admin__field backend-token-admin__field--compact">
            <span>Write roots</span>
            <input
              value={draftWriteRootsText}
              onChange={(event) => setDraftWriteRootsText(event.target.value)}
              placeholder="docs, notes"
            />
          </label>
        </div>

        <button type="button" className="backend-token-admin__create" onClick={handleCreateToken}>
          <Plus className="size-4" />
          <span>Generate token</span>
        </button>
      </div>

      {freshToken ? (
        <div className="backend-token-admin__notice">
          <div>
            <p className="backend-token-admin__notice-label">New token created</p>
            <p className="backend-token-admin__notice-copy">
              {freshToken.tokenName} was created on the API. The secret is only shown once.
            </p>
          </div>
          <div className="backend-token-admin__token-row">
            <div>
              <span>Token secret</span>
              <strong>{formatTokenPreview(freshToken.token)}</strong>
            </div>
            <button type="button" className="backend-token-admin__copy" onClick={handleCopySecret}>
              <Copy className="size-3.5" />
              <span>{copiedSecret ? "Copied" : "Copy secret"}</span>
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="backend-token-admin__notice backend-token-admin__notice--error">
          <ShieldAlert className="size-4" />
          <p>{error}</p>
          <button type="button" className="backend-token-admin__copy" onClick={() => void loadTokens()}>
            <RefreshCw className="size-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : null}

      <div className="backend-token-admin__toolbar">
        <p className="backend-token-admin__toolbar-copy">
          Token data is loaded from <code>/api/tokens</code> and saved back to <code>/api/tokens/{`{tokenId}`}</code>.
        </p>
        <button type="button" className="backend-token-admin__copy" onClick={() => void loadTokens()}>
          <RefreshCw className={clsx("size-3.5", loading && "animate-spin")} />
          <span>{loading ? "Loading" : "Reload from API"}</span>
        </button>
      </div>

      <div className="backend-token-admin__list">
        {loading ? (
          <article className="backend-token-admin__card">
            <p className="backend-token-admin__lede">Loading tokens from the API…</p>
          </article>
        ) : null}

        {!loading && tokens.length === 0 ? (
          <article className="backend-token-admin__card">
            <p className="backend-token-admin__lede">
              No token records were returned by the API yet. Create one above to seed the tenant.
            </p>
          </article>
        ) : null}

        {tokens.map((token) => {
          const draft = drafts[token.tokenId] ?? draftFromToken(token);
          const provider = getProviderByName(draft.providerName || token.providerName);
          const pendingSave = savingTokenIds.includes(token.tokenId);
          const pendingDelete = deletingTokenIds.includes(token.tokenId);

          return (
            <article key={token.tokenId} className="backend-token-admin__card">
              <div className="backend-token-admin__card-head">
                <div className="backend-token-admin__identity">
                  <ProviderBadge
                    provider={provider}
                    imageUrl={draft.avatarUrl || token.avatarUrl}
                    background={draft.avatarBackground || token.avatarBackground}
                    alt={draft.avatarAlt || token.avatarAlt}
                  />
                  <div>
                    <p>{draft.providerName || token.providerName}</p>
                    <span>{token.description || "No description yet"}</span>
                  </div>
                </div>
              </div>

              <div className="backend-token-admin__field-grid">
                <label className="backend-token-admin__field backend-token-admin__field--compact">
                  <span>Name</span>
                  <input
                    value={draft.tokenName}
                    onChange={(event) => updateDraft(token.tokenId, "tokenName", event.target.value)}
                  />
                </label>
                <label className="backend-token-admin__field backend-token-admin__field--compact">
                  <span>Provider name</span>
                  <input
                    value={draft.providerName}
                    onChange={(event) => updateDraft(token.tokenId, "providerName", event.target.value)}
                  />
                </label>
                <label className="backend-token-admin__field backend-token-admin__field--compact">
                  <span>Description</span>
                  <input
                    value={draft.description}
                    onChange={(event) => updateDraft(token.tokenId, "description", event.target.value)}
                  />
                </label>
                <label className="backend-token-admin__field backend-token-admin__field--compact">
                  <span>Subject</span>
                  <input
                    value={draft.subject}
                    onChange={(event) => updateDraft(token.tokenId, "subject", event.target.value)}
                  />
                </label>
                <label className="backend-token-admin__field backend-token-admin__field--compact">
                  <span>Avatar URL</span>
                  <input
                    value={draft.avatarUrl}
                    onChange={(event) => updateDraft(token.tokenId, "avatarUrl", event.target.value)}
                  />
                </label>
                <label className="backend-token-admin__field backend-token-admin__field--compact">
                  <span>Avatar alt text</span>
                  <input
                    value={draft.avatarAlt}
                    onChange={(event) => updateDraft(token.tokenId, "avatarAlt", event.target.value)}
                  />
                </label>
                <label className="backend-token-admin__field backend-token-admin__field--compact">
                  <span>Avatar background</span>
                  <input
                    value={draft.avatarBackground}
                    onChange={(event) => updateDraft(token.tokenId, "avatarBackground", event.target.value)}
                  />
                </label>
                <label className="backend-token-admin__field backend-token-admin__field--compact">
                  <span>Scopes</span>
                  <input
                    value={draft.scopesText}
                    onChange={(event) => updateDraft(token.tokenId, "scopesText", event.target.value)}
                  />
                </label>
                <label className="backend-token-admin__field backend-token-admin__field--compact">
                  <span>Read roots</span>
                  <input
                    value={draft.readRootsText}
                    onChange={(event) => updateDraft(token.tokenId, "readRootsText", event.target.value)}
                  />
                </label>
                <label className="backend-token-admin__field backend-token-admin__field--compact">
                  <span>Write roots</span>
                  <input
                    value={draft.writeRootsText}
                    onChange={(event) => updateDraft(token.tokenId, "writeRootsText", event.target.value)}
                  />
                </label>
              </div>

              <div className="backend-token-admin__provider-grid backend-token-admin__provider-grid--compact">
                {PROVIDERS.map((providerOption) => {
                  const selected = providerOption.name.toLowerCase() === draft.providerName.trim().toLowerCase();
                  return (
                    <button
                      key={`${token.tokenId}-${providerOption.id}`}
                      type="button"
                      className={clsx(
                        "backend-token-admin__provider-card backend-token-admin__provider-card--compact",
                        selected && "backend-token-admin__provider-card--selected",
                      )}
                      onClick={() => handleSelectProvider(providerOption, "edit", token.tokenId)}
                    >
                      <ProviderBadge provider={providerOption} />
                      <span>{providerOption.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="backend-token-admin__token-row">
                <div>
                  <span>Token ID</span>
                  <strong>{formatTokenPreview(token.tokenId)}</strong>
                </div>
                <button
                  type="button"
                  className="backend-token-admin__copy"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(token.tokenId);
                    } catch {
                      // Ignore clipboard failures in the local prototype.
                    }
                  }}
                >
                  <Copy className="size-3.5" />
                  <span>Copy ID</span>
                </button>
              </div>

              <div className="backend-token-admin__meta">
                <div>
                  <span>Created</span>
                  <strong>{formatDate(token.createdAt)}</strong>
                </div>
                <div>
                  <span>Updated</span>
                  <strong>{formatDate(token.updatedAt)}</strong>
                </div>
                <div>
                  <span>Expires</span>
                  <strong>{formatDate(token.expiresAt)}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong><TokenStatus revokedAt={token.revokedAt} expiresAt={token.expiresAt} /></strong>
                </div>
              </div>

              <div className="backend-token-admin__permission-summary">
                <PermissionModeBadge mode="locked" count={token.lockedPaths.length} />
                <PermissionModeBadge mode="write" count={token.writeRoots.length} />
              </div>

              <div className="backend-token-admin__permission-chips">
                {token.lockedPaths.slice(0, 2).map((path) => (
                  <span key={`${token.tokenId}-lock-${path}`} className="backend-token-admin__permission-chip">
                    <Lock className="size-3" />
                    {path}
                  </span>
                ))}
                {token.readRoots.slice(0, 2).map((path) => (
                  <span key={`${token.tokenId}-read-${path}`} className="backend-token-admin__permission-chip">
                    <EyeOff className="size-3" />
                    {path}
                  </span>
                ))}
              </div>

              <div className="backend-token-admin__actions">
                <button
                  type="button"
                  className="backend-token-admin__action"
                  onClick={() => void handleSaveToken(token.tokenId)}
                  disabled={pendingSave}
                >
                  <PenLine className="size-4" />
                  <span>{pendingSave ? "Saving" : "Save"}</span>
                </button>
                <button
                  type="button"
                  className="backend-token-admin__action"
                  onClick={() => void handleRevokeToken(token.tokenId)}
                  disabled={pendingSave || token.revokedAt !== null}
                >
                  <ShieldAlert className="size-4" />
                  <span>{token.revokedAt ? "Revoked" : "Revoke"}</span>
                </button>
                <button
                  type="button"
                  className="backend-token-admin__action"
                  onClick={() => void handleDeleteToken(token.tokenId)}
                  disabled={pendingDelete}
                >
                  <Trash2 className="size-4" />
                  <span>{pendingDelete ? "Deleting" : "Delete"}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
