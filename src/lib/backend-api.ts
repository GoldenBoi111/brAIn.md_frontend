export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.example.com";

export const FILLER_FILE_ID = "file-example-id";
export const FILLER_TOKEN_ID = "token-example-id";

export class BackendApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BackendApiError";
  }
}

export interface ApiUser {
  email: string;
  name?: string;
  role?: string;
}

export interface AuthResponse {
  user: ApiUser;
}

export interface LogoutResponse {
  logged_out: boolean;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(path, API_BASE_URL);

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new BackendApiError(0, "Unable to reach the API. Check your connection or base URL.");
  }

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Request failed with status ${response.status}`;
    throw new BackendApiError(response.status, message);
  }

  return data as T;
}

function withPathParams(
  path: string,
  params: Record<string, string>,
): string {
  return Object.entries(params).reduce(
    (current, [key, value]) => current.replace(`{${key}}`, encodeURIComponent(value)),
    path,
  );
}

export const backendApi = {
  getApiIndex: () => request<Record<string, unknown>>("GET", "/api"),

  getHealth: () => request<Record<string, unknown>>("GET", "/api/health"),

  getOpenapi: () => request<Record<string, unknown>>("GET", "/api/openapi"),

  register: (body: { email: string; password: string; name?: string; role?: string }) =>
    request<AuthResponse>("POST", "/api/auth/register", { body }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("POST", "/api/auth/login", { body }),

  logout: () => request<LogoutResponse>("POST", "/api/auth/logout"),

  getMe: () => request<AuthResponse>("GET", "/api/auth/me"),

  getEmbedDoc: () => request<Record<string, unknown>>("GET", "/api/embed"),

  embed: (body: {
    text?: string;
    texts?: string[];
    include_metadata?: boolean;
  } = {
    texts: ["first chunk", "second chunk"],
    include_metadata: true,
  }) => request<Record<string, unknown>>("POST", "/api/embed", { body }),

  getSearchDoc: () => request<Record<string, unknown>>("GET", "/api/search"),

  search: (body: { query: string; top_k?: number; topK?: number } = { query: "architecture" }) =>
    request<Record<string, unknown>>("POST", "/api/search", { body }),

  listFiles: (query: { path?: string; view?: "tree" | "list" } = {}) =>
    request<Record<string, unknown>>("GET", "/api/files", { query }),

  createFile: (body: {
    path: string;
    kind?: "file" | "folder";
    content?: string;
    embedding_model?: string;
  } = {
    kind: "file",
    path: "notes/intro.md",
    content: "# Hello",
  }) => request<Record<string, unknown>>("POST", "/api/files", { body }),

  getFile: (id: string = FILLER_FILE_ID) =>
    request<Record<string, unknown>>(
      "GET",
      withPathParams("/api/files/{id}", { id }),
    ),

  updateFile: (
    id: string = FILLER_FILE_ID,
    body: {
      path?: string;
      content?: string;
      append?: boolean;
      embedding_model?: string;
    } = {},
  ) =>
    request<Record<string, unknown>>(
      "PUT",
      withPathParams("/api/files/{id}", { id }),
      { body },
    ),

  deleteFile: (id: string = FILLER_FILE_ID) =>
    request<Record<string, unknown>>(
      "DELETE",
      withPathParams("/api/files/{id}", { id }),
    ),

  getVaultLocks: (query: { path?: string; file_id?: string } = {}) =>
    request<Record<string, unknown>>("GET", "/api/vault/locks", { query }),

  lockVault: (body: {
    path?: string;
    paths?: string[];
    file_id?: string;
    file_ids?: string[];
  } = { path: "notes/private.md" }) =>
    request<Record<string, unknown>>("POST", "/api/vault/locks", { body }),

  unlockVault: (body: {
    path?: string;
    paths?: string[];
    file_id?: string;
    file_ids?: string[];
  } = { path: "notes/private.md" }) =>
    request<Record<string, unknown>>("DELETE", "/api/vault/locks", { body }),

  getVaultUsage: (query: { path?: string; view?: "tree" | "list" } = {}) =>
    request<Record<string, unknown>>("GET", "/api/vault/usage", { query }),

  reindexVault: (body: {
    path?: string;
    embedding_model?: string;
    embeddingModel?: string;
  } = { path: "." }) =>
    request<Record<string, unknown>>("POST", "/api/vault/reindex", { body }),

  listTokens: () => request<Record<string, unknown>>("GET", "/api/tokens"),

  createToken: (body: {
    subject: string;
    tokenName?: string;
    token_name?: string;
    scopes?: string[];
    readRoots?: string[];
    read_roots?: string[];
    writeRoots?: string[];
    write_roots?: string[];
    ttlDays?: number;
    ttl_days?: number;
    issuer?: string;
    audience?: string;
  } = {
    tokenName: "docs-bot",
    subject: "ui",
    scopes: ["mcp"],
    readRoots: ["docs"],
    writeRoots: ["docs"],
  }) => request<Record<string, unknown>>("POST", "/api/tokens", { body }),

  createMcpToken: (body: {
    subject: string;
    tokenName?: string;
    token_name?: string;
    scopes?: string[];
    readRoots?: string[];
    read_roots?: string[];
    writeRoots?: string[];
    write_roots?: string[];
    ttlDays?: number;
    ttl_days?: number;
    issuer?: string;
    audience?: string;
  } = {
    tokenName: "docs-bot",
    subject: "ui",
    scopes: ["mcp"],
    readRoots: ["docs"],
    writeRoots: ["docs"],
  }) => request<Record<string, unknown>>("POST", "/api/mcp/token", { body }),

  getTokenLocks: (
    tokenId: string = FILLER_TOKEN_ID,
    query: { path?: string; file_id?: string } = {},
  ) =>
    request<Record<string, unknown>>(
      "GET",
      withPathParams("/api/mcp/token/{tokenId}/locks", { tokenId }),
      { query },
    ),

  addTokenLocks: (
    tokenId: string = FILLER_TOKEN_ID,
    body: {
      path?: string;
      paths?: string[];
      file_id?: string;
      file_ids?: string[];
    } = { path: "notes/private.md" },
  ) =>
    request<Record<string, unknown>>(
      "POST",
      withPathParams("/api/mcp/token/{tokenId}/locks", { tokenId }),
      { body },
    ),

  removeTokenLocks: (
    tokenId: string = FILLER_TOKEN_ID,
    body: {
      path?: string;
      paths?: string[];
      file_id?: string;
      file_ids?: string[];
    } = { path: "notes/private.md" },
  ) =>
    request<Record<string, unknown>>(
      "DELETE",
      withPathParams("/api/mcp/token/{tokenId}/locks", { tokenId }),
      { body },
    ),

  listUsers: () => request<Record<string, unknown>>("GET", "/api/users"),

  createUser: (body: {
    email: string;
    password: string;
    name?: string;
    role?: string;
  } = {
    email: "user@example.com",
    password: "secret",
    name: "Sam",
    role: "admin",
  }) => request<Record<string, unknown>>("POST", "/api/users", { body }),
};
