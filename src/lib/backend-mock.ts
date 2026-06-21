import { getFileTree } from "@/lib/vault-catalog";
import { collectFiles, collectFolders, findFileNode, getFilePath } from "@/lib/vault";
import type { FileNode } from "@/types/file-tree";

type MockResponse = {
  status?: number;
  body: unknown;
};

function makeUser(email = "user@example.com", name = "Sam", role = "member") {
  return { user: { email, name, role } };
}

function getRootNode(): FileNode | null {
  const tree = getFileTree();
  return tree[0] ?? null;
}

function getUsageSnapshot() {
  const tree = getFileTree();
  const files = collectFiles(tree);
  const folders = collectFolders(tree);
  const usageBytes = files.length * 18_432 + folders.length * 6_144;
  const maxBytes = 10 * 1024 * 1024;

  return { tree, files, folders, usageBytes, maxBytes };
}

function listLockedPaths(scopePath = ".") {
  return scopePath === "." ? ["notes/private.md", "projects/wip.md"] : [`${scopePath}/private.md`];
}

function getMockFileResponse(pathname: string, method: string): MockResponse {
  const tree = getFileTree();
  const parts = pathname.split("/").filter(Boolean);
  const fileId = parts[2];
  const target = fileId ? findFileNode(tree, fileId) : null;

  if (method === "GET" && parts.length === 2) {
    return {
      body: {
        tenant_id: "brain-vault",
        path: ".",
        view: "tree",
        locked_paths: [],
        usage_bytes: getUsageSnapshot().usageBytes,
        max_bytes: getUsageSnapshot().maxBytes,
        data: getRootNode(),
      },
    };
  }

  if (method === "POST" && parts.length === 2) {
    return { status: 201, body: { created: true, kind: "file", path: "notes/untitled.md", file_id: "file-mock", content: "# New note" } };
  }

  if (parts.length >= 3 && target) {
    const filePath = getFilePath(tree, target.id) ?? target.name;

    if (method === "GET") {
      return {
        body: {
          id: target.id,
          name: target.name,
          path: filePath,
          kind: target.type,
          content: target.type === "file" ? `# ${target.name}\n\nMock content.` : null,
          metadata: target,
        },
      };
    }

    if (method === "PUT") {
      return {
        body: {
          updated: true,
          file_id: target.id,
          path: filePath,
          metadata: target,
          content: target.type === "file" ? `# ${target.name}\n\nUpdated mock content.` : null,
        },
      };
    }

    if (method === "DELETE") {
      return { body: { deleted: true, file_id: target.id, path: filePath } };
    }
  }

  return { status: 404, body: { error: "Mock backend route not found." } };
}

export async function createMockBackendResponse(
  method: string,
  pathname: string,
  request: Request,
): Promise<MockResponse> {
  if (pathname === "/api") {
    return {
      body: {
        name: "brAIn.md MCP Server API",
        api_version: "v1",
        versioned_root: "/api/v1",
        routes: ["/health", "/vault/locks", "/vault/usage", "/vault/reindex", "/tokens", "/users", "/openapi"],
      },
    };
  }

  if (pathname === "/api/health") {
    return {
      body: {
        status: "healthy",
        api_version: "v1",
        services: {
          api: "mock",
          auth: "mock",
          vault: "mock",
          qdrant: "mock",
          embedder: "mock",
        },
      },
    };
  }

  if (pathname === "/api/openapi") {
    return {
      body: {
        openapi: "3.1.0",
        info: {
          title: "brAIn.md MCP Server API",
          version: "v1-mock",
        },
        paths: {},
      },
    };
  }

  if (pathname === "/api/auth/register" || pathname === "/api/auth/login") {
    const body = (await request.json().catch(() => ({}))) as { email?: string; name?: string; role?: string };
    return {
      status: 201,
      body: makeUser(body.email ?? "user@example.com", body.name ?? "Sam", body.role ?? "member"),
    };
  }

  if (pathname === "/api/auth/logout") {
    return { body: { logged_out: true } };
  }

  if (pathname === "/api/auth/me") {
    return { body: makeUser() };
  }

  if (pathname === "/api/embed" && method === "GET") {
    return {
      body: {
        route: "/api/embed",
        method: "POST",
        auth: "session",
        body: { text: "string | texts[]", include_metadata: "boolean" },
      },
    };
  }

  if (pathname === "/api/embed" && method === "POST") {
    return {
      body: {
        vectors: [[0.12, 0.84, 0.33]],
        model_name: "mock-embedder",
        dimension: 3,
        metadata: [{ index: 0, length: 18 }],
      },
    };
  }

  if (pathname === "/api/search" && method === "GET") {
    return {
      body: {
        route: "/api/search",
        method: "POST",
        auth: "session",
        body: { query: "string", top_k: "number" },
      },
    };
  }

  if (pathname === "/api/search" && method === "POST") {
    const body = (await request.json().catch(() => ({}))) as { query?: string; top_k?: number; topK?: number };
    const query = body.query ?? "architecture";
    return {
      body: {
        tenant_id: "brain-vault",
        query,
        top_k: body.top_k ?? body.topK ?? 5,
        matches: [
          {
            id: "memory-atlas",
            title: "Memory atlas",
            score: 0.97,
            path: "Brain Vault / Research / Memory atlas.md",
          },
        ],
      },
    };
  }

  if (pathname === "/api/files" || pathname === "/api/files/") {
    return getMockFileResponse("/api/files", method);
  }

  if (pathname.startsWith("/api/files/")) {
    return getMockFileResponse(pathname, method);
  }

  if (pathname === "/api/vault/locks") {
    return {
      body: {
        tenant_id: "brain-vault",
        action: method === "GET" ? "list" : method === "POST" ? "lock" : "unlock",
        count: 2,
        changed: method !== "GET",
        results: [],
        locked_paths: listLockedPaths(),
      },
    };
  }

  if (pathname === "/api/vault/usage") {
    const { usageBytes, maxBytes } = getUsageSnapshot();
    return {
      body: {
        api_version: "v1",
        tenant_id: "brain-vault",
        path: ".",
        view: "tree",
        usage_bytes: usageBytes,
        max_bytes: maxBytes,
      },
    };
  }

  if (pathname === "/api/vault/reindex") {
    const tree = getFileTree();
    return {
      body: {
        api_version: "v1",
        tenant_id: "brain-vault",
        path: ".",
        count: collectFiles(tree).length,
        skipped: 0,
        results: collectFiles(tree).slice(0, 3).map((file) => ({
          file_id: file.id,
          path: getFilePath(tree, file.id) ?? file.name,
          status: "queued",
        })),
      },
    };
  }

  if (pathname === "/api/tokens" && method === "GET") {
    return {
      body: {
        api_version: "v1",
        tenant_id: "brain-vault",
        count: 1,
        tokens: [
          {
            token_id: "token-visual-1",
            token_name: "docs-bot",
            scopes: ["mcp"],
            read_roots: ["docs"],
            write_roots: ["docs"],
          },
        ],
      },
    };
  }

  if (pathname === "/api/tokens" && method === "POST") {
    const body = (await request.json().catch(() => ({}))) as { tokenName?: string; token_name?: string };
    return {
      status: 201,
      body: {
        api_version: "v1",
        tenant_id: "brain-vault",
        token_id: "token-visual-1",
        token_name: body.tokenName ?? body.token_name ?? "docs-bot",
        token: "mcp_mock_token",
      },
    };
  }

  if (pathname === "/api/mcp/token" && method === "POST") {
    return {
      status: 201,
      body: {
        api_version: "v1",
        tenant_id: "brain-vault",
        token_id: "token-visual-1",
        token_name: "docs-bot",
        token: "mcp_mock_token",
      },
    };
  }

  if (pathname.includes("/api/mcp/token/") && pathname.endsWith("/locks")) {
    const tokenId = pathname.split("/")[4] ?? "token-visual-1";
    return {
      body: {
        token_id: tokenId,
        tenant_id: "brain-vault",
        token_name: "docs-bot",
        subject: "ui",
        scopes: ["mcp"],
        scope_path: ".",
        count: 1,
        locked_paths: ["notes/private.md"],
        action: method === "GET" ? "list" : method === "POST" ? "lock" : "unlock",
        changed: method !== "GET",
        results: [],
      },
    };
  }

  if (pathname === "/api/users" && method === "GET") {
    return {
      body: {
        api_version: "v1",
        users: [
          { email: "admin@brain.md", name: "Admin", role: "admin" },
          { email: "user@brain.md", name: "User", role: "member" },
        ],
      },
    };
  }

  if (pathname === "/api/users" && method === "POST") {
    const body = (await request.json().catch(() => ({}))) as { email?: string; name?: string; role?: string };
    return {
      status: 201,
      body: {
        api_version: "v1",
        user: {
          email: body.email ?? "user@example.com",
          name: body.name ?? "Sam",
          role: body.role ?? "member",
        },
      },
    };
  }

  return { status: 404, body: { error: `Mock backend route not found: ${method} ${pathname}` } };
}
