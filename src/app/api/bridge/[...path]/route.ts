import { NextResponse } from "next/server";

import { createMockBackendResponse } from "@/lib/backend-mock";

const BACKEND_BASE_URL =
  process.env.BACKEND_API_BASE_URL?.trim() ??
  (process.env.NODE_ENV === "production" ? "https://mcp.brain-dev.dev" : "");

function normalizePath(pathname: string): string {
  return pathname.replace(/^\/api\/bridge/, "") || "/";
}

async function proxyToBackend(request: Request, backendPath: string) {
  const upstreamBase = BACKEND_BASE_URL.replace(/\/+$/, "");
  const upstreamUrl = new URL(backendPath, upstreamBase);
  upstreamUrl.search = new URL(request.url).search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const upstreamResponse = await fetch(upstreamUrl, init);
  const responseHeaders = new Headers(upstreamResponse.headers);
  const response = new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });

  return response;
}

async function handle(request: Request) {
  const backendPath = normalizePath(new URL(request.url).pathname);

  if (BACKEND_BASE_URL) {
    try {
      return await proxyToBackend(request, backendPath);
    } catch {
      // Fall through to the local mock response if the remote backend is unavailable.
    }
  }

  const mock = await createMockBackendResponse(request.method, backendPath, request);
  return NextResponse.json(mock.body, { status: mock.status ?? 200 });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

export async function PUT(request: Request) {
  return handle(request);
}

export async function DELETE(request: Request) {
  return handle(request);
}
