"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Brain, PlugZap, Shield, X } from "lucide-react";

import { BackendTokenAdmin } from "@/components/backend-token-admin";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { clearAuthenticatedSession } from "@/lib/auth";
import { BACKEND_NOTES, BACKEND_SECTIONS } from "@/lib/backend-spec";

export function BackendBridge() {
  return (
    <main className="backend-page">
      <header className="backend-page__topbar">
        <div className="backend-page__brand">
          <Brain className="size-4" />
          <div>
            <p className="backend-page__eyebrow">Visual backend bridge</p>
            <h1 className="backend-page__title">Backend API surfaces</h1>
          </div>
        </div>

        <div className="backend-page__actions">
          <Link href="/dashboard" className="memory-app__search backend-page__back">
            <ArrowLeft className="size-4" />
            <span>Dashboard</span>
          </Link>
          <ThemeToggleButton />
          <button
            type="button"
            className="memory-app__icon-button"
            onClick={() => {
              clearAuthenticatedSession();
              window.location.assign("/login");
            }}
            aria-label="Sign out"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <section className="backend-page__hero">
        <div className="backend-page__hero-copy">
          <p className="backend-page__eyebrow">No live host attached yet</p>
          <h2 className="backend-page__hero-title">The UI is wired for a backend later, but stays local now.</h2>
          <p className="backend-page__hero-lede">
            The browser talks to a same-origin bridge, so we avoid cross-origin issues now and can
            swap in a real backend connection later without changing the UI paths.
          </p>
        </div>

        <div className="backend-page__hero-panel">
          <div className="backend-page__hero-stat">
            <span>Bridge mode</span>
            <strong>Mock first</strong>
          </div>
          <div className="backend-page__hero-stat">
            <span>Backend URL</span>
            <strong>Not set</strong>
          </div>
          <div className="backend-page__hero-stat">
            <span>Transport</span>
            <strong>Same origin</strong>
          </div>
        </div>
      </section>

      <section className="backend-page__notes">
        {BACKEND_NOTES.map((note) => (
          <article key={note} className="backend-page__note">
            <Shield className="size-4" />
            <p>{note}</p>
          </article>
        ))}
      </section>

      <BackendTokenAdmin />

      <section className="backend-page__sections">
        {BACKEND_SECTIONS.map((section) => (
          <article key={section.id} className="backend-page__section">
            <div className="backend-page__section-head">
              <div>
                <p className="backend-page__section-kicker">{section.title}</p>
                <h3>{section.summary}</h3>
              </div>
              <span className="backend-page__section-count">{section.endpoints.length} endpoints</span>
            </div>

            <div className="backend-page__grid">
              {section.endpoints.map((endpoint) => (
                <div key={`${endpoint.method}-${endpoint.path}`} className="backend-page__card">
                  <div className="backend-page__card-top">
                    <span className={`backend-page__method backend-page__method--${endpoint.method.toLowerCase()}`}>
                      {endpoint.method}
                    </span>
                    <span className="backend-page__status">Bridge ready</span>
                  </div>
                  <h4>{endpoint.title}</h4>
                  <p className="backend-page__path">{endpoint.path}</p>
                  <p className="backend-page__purpose">{endpoint.purpose}</p>

                  <dl className="backend-page__meta">
                    <div>
                      <dt>Auth</dt>
                      <dd>{endpoint.auth}</dd>
                    </div>
                    {endpoint.payload ? (
                      <div>
                        <dt>Payload</dt>
                        <dd>{endpoint.payload}</dd>
                      </div>
                    ) : null}
                    {endpoint.response ? (
                      <div>
                        <dt>Response</dt>
                        <dd>{endpoint.response}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <footer className="backend-page__footer">
        <PlugZap className="size-4" />
        <span>
          Keep the route names stable now. When the backend is live, set the bridge URL on the server
          and the existing UI can start talking to it.
        </span>
        <ArrowUpRight className="size-4" />
      </footer>
    </main>
  );
}
