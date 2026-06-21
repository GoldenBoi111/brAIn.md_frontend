export type BackendMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface BackendEndpoint {
  method: BackendMethod;
  path: string;
  title: string;
  purpose: string;
  auth: string;
  payload?: string;
  response?: string;
}

export interface BackendSection {
  id: string;
  title: string;
  summary: string;
  endpoints: BackendEndpoint[];
}

export const BACKEND_NOTES = [
  "The browser only talks to the local bridge route, so there is no cross-origin host to trigger CORS errors.",
  "When a real backend is connected later, set BACKEND_API_BASE_URL on the server and keep the UI paths unchanged.",
  "Until then, the bridge returns mock payloads so the screens stay usable offline.",
];

export const BACKEND_SECTIONS: BackendSection[] = [
  {
    id: "core",
    title: "Core",
    summary: "Discovery and health checks for the backend bridge.",
    endpoints: [
      {
        method: "GET",
        path: "/api",
        title: "Index",
        auth: "None",
        purpose: "Return the top-level API index.",
        response: "{ name, api_version, versioned_root, routes[] }",
      },
      {
        method: "GET",
        path: "/api/health",
        title: "Health",
        auth: "None",
        purpose: "Report backend and dependency status.",
        response: "{ status, api_version, services }",
      },
      {
        method: "GET",
        path: "/api/openapi",
        title: "OpenAPI",
        auth: "None",
        purpose: "Return the machine-readable API document.",
        response: "OpenAPI 3.1 JSON",
      },
    ],
  },
  {
    id: "auth",
    title: "Auth",
    summary: "Session lifecycle for local or future backend sign-in.",
    endpoints: [
      {
        method: "POST",
        path: "/api/auth/register",
        title: "Register",
        auth: "None",
        purpose: "Create a user account and session.",
        payload: "{ email, password, name?, role? }",
        response: "{ user } + Set-Cookie",
      },
      {
        method: "POST",
        path: "/api/auth/login",
        title: "Login",
        auth: "None",
        purpose: "Authenticate a user and return a session.",
        payload: "{ email, password }",
        response: "{ user } + Set-Cookie",
      },
      {
        method: "POST",
        path: "/api/auth/logout",
        title: "Logout",
        auth: "None",
        purpose: "Clear the session cookie.",
        response: "{ logged_out: true }",
      },
      {
        method: "GET",
        path: "/api/auth/me",
        title: "Session",
        auth: "Session",
        purpose: "Return current session claims.",
        response: "{ user }",
      },
    ],
  },
  {
    id: "ai",
    title: "AI",
    summary: "Embedding and semantic search surfaces.",
    endpoints: [
      {
        method: "GET",
        path: "/api/embed",
        title: "Embed docs",
        auth: "None",
        purpose: "Describe the embed request shape.",
        response: "Docs payload",
      },
      {
        method: "POST",
        path: "/api/embed",
        title: "Embed",
        auth: "Session",
        purpose: "Create vector embeddings.",
        payload: "{ text | texts[], include_metadata? }",
        response: "{ vectors, model_name, dimension, metadata? }",
      },
      {
        method: "GET",
        path: "/api/search",
        title: "Search docs",
        auth: "None",
        purpose: "Describe the semantic search request shape.",
        response: "Docs payload",
      },
      {
        method: "POST",
        path: "/api/search",
        title: "Search",
        auth: "Session",
        purpose: "Run semantic search against the vault.",
        payload: "{ query, top_k? }",
        response: "{ tenant_id, query, top_k, matches[] }",
      },
    ],
  },
  {
    id: "vault",
    title: "Vault",
    summary: "Files, locks, usage, and reindexing.",
    endpoints: [
      {
        method: "GET",
        path: "/api/files",
        title: "Browse",
        auth: "Session",
        purpose: "Return a tree or flat listing for a vault path.",
        payload: "{ path?, view? }",
        response: "{ tenant_id, path, view, usage_bytes, max_bytes, data }",
      },
      {
        method: "POST",
        path: "/api/files",
        title: "Create",
        auth: "Session",
        purpose: "Create a file or folder.",
        payload: "{ path, kind?, content? }",
        response: "{ created, kind, path, file_id?, content? }",
      },
      {
        method: "GET",
        path: "/api/files/{id}",
        title: "Read",
        auth: "Session",
        purpose: "Read a file or folder by id.",
        response: "Metadata plus content for files",
      },
      {
        method: "PUT",
        path: "/api/files/{id}",
        title: "Update",
        auth: "Session",
        purpose: "Move or replace file contents.",
        payload: "{ path?, content?, append?, embedding_model? }",
        response: "{ updated, file_id, path, metadata, content }",
      },
      {
        method: "DELETE",
        path: "/api/files/{id}",
        title: "Delete",
        auth: "Session",
        purpose: "Remove a file or folder and its vectors.",
        response: "{ deleted, file_id, path }",
      },
      {
        method: "GET",
        path: "/api/vault/locks",
        title: "List locks",
        auth: "Session",
        purpose: "Show visible locks for a path or file id.",
        payload: "{ path? | file_id? }",
        response: "{ tenant_id, scope_path, count, locked_paths[] }",
      },
      {
        method: "POST",
        path: "/api/vault/locks",
        title: "Lock paths",
        auth: "Session",
        purpose: "Add vault-wide locks.",
        payload: "{ path? | paths[] | file_id? | file_ids[] }",
        response: "{ tenant_id, action, count, changed, results[], locked_paths[] }",
      },
      {
        method: "DELETE",
        path: "/api/vault/locks",
        title: "Unlock paths",
        auth: "Session",
        purpose: "Remove vault-wide locks.",
        payload: "{ path? | paths[] | file_id? | file_ids[] }",
        response: "{ tenant_id, action, count, changed, results[], locked_paths[] }",
      },
      {
        method: "GET",
        path: "/api/vault/usage",
        title: "Usage",
        auth: "Session",
        purpose: "Report storage use and quota.",
        payload: "{ path?, view? }",
        response: "{ api_version, tenant_id, path, view, usage_bytes, max_bytes }",
      },
      {
        method: "POST",
        path: "/api/vault/reindex",
        title: "Reindex",
        auth: "Session",
        purpose: "Rebuild embeddings for a subtree.",
        payload: "{ path?, embedding_model? }",
        response: "{ api_version, tenant_id, path, count, skipped, results[] }",
      },
    ],
  },
  {
    id: "tokens",
    title: "Tokens and users",
    summary: "Tenant credentials and admin user management.",
    endpoints: [
      {
        method: "GET",
        path: "/api/tokens",
        title: "List tokens",
        auth: "Session",
        purpose: "List tenant token records.",
        response: "{ api_version, tenant_id, count, tokens[] }",
      },
      {
        method: "POST",
        path: "/api/tokens",
        title: "Create token",
        auth: "Session",
        purpose: "Create a tenant token.",
        payload: "{ subject, tokenName?, scopes?, readRoots?, writeRoots?, avatarProvider?, avatarImage?, lockedPaths?, readOnlyPaths? }",
        response: "{ api_version, tenant_id, token_id, token_name, token, avatar_provider?, locked_paths?, read_only_paths? }",
      },
      {
        method: "POST",
        path: "/api/mcp/token",
        title: "Create MCP token",
        auth: "Session",
        purpose: "Issue an MCP token for downstream use.",
        payload: "Same as /api/tokens",
        response: "{ api_version, tenant_id, token_id, token_name, token, avatar_provider?, locked_paths?, read_only_paths? }",
      },
      {
        method: "GET",
        path: "/api/mcp/token/{tokenId}/locks",
        title: "Token locks",
        auth: "Session",
        purpose: "Read token-scoped mutable locks.",
        payload: "{ path? | file_id? }",
        response: "{ token_id, tenant_id, token_name, subject, scopes, scope_path, count, locked_paths[] }",
      },
      {
        method: "POST",
        path: "/api/mcp/token/{tokenId}/locks",
        title: "Add token locks",
        auth: "Session",
        purpose: "Add mutable locks to one token.",
        payload: "{ path? | paths[] | file_id? | file_ids[] }",
        response: "{ token_id, tenant_id, action, count, changed, results[], locked_paths[] }",
      },
      {
        method: "DELETE",
        path: "/api/mcp/token/{tokenId}/locks",
        title: "Remove token locks",
        auth: "Session",
        purpose: "Remove mutable locks from one token.",
        payload: "{ path? | paths[] | file_id? | file_ids[] }",
        response: "{ token_id, tenant_id, action, count, changed, results[], locked_paths[] }",
      },
      {
        method: "GET",
        path: "/api/users",
        title: "List users",
        auth: "Admin session",
        purpose: "List local users.",
        response: "{ api_version, users[] }",
      },
      {
        method: "POST",
        path: "/api/users",
        title: "Create user",
        auth: "Admin session",
        purpose: "Create a local auth user.",
        payload: "{ email, password, name?, role? }",
        response: "{ api_version, user }",
      },
    ],
  },
];
