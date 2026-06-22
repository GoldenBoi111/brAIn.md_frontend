"use client";

import Link from "next/link";
import { ArrowLeft, Brain, Shield, X } from "lucide-react";

import { BackendTokenAdmin } from "@/components/backend-token-admin";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { clearAuthenticatedSession } from "@/lib/auth";
import { backendApi } from "@/lib/backend-api";

export default function TokensPage() {
  return (
    <main className="backend-page">
      <header className="backend-page__topbar">
        <div className="backend-page__brand">
          <Brain className="size-4" />
          <div>
            <p className="backend-page__eyebrow">Token administration</p>
            <h1 className="backend-page__title">Tokens and visual identities</h1>
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
            onClick={async () => {
              try {
                await backendApi.logout();
              } finally {
                clearAuthenticatedSession();
                window.location.assign("/login");
              }
            }}
            aria-label="Sign out"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <section className="backend-page__hero">
        <div className="backend-page__hero-copy">
          <p className="backend-page__eyebrow">Production-ready</p>
          <h2 className="backend-page__hero-title">Create, rename, refresh, and retire tokens.</h2>
          <p className="backend-page__hero-lede">
            The controls are designed to work through the secure website API, so token workflows,
            names, avatars, and provider identities stay consistent in production.
          </p>
        </div>

        <div className="backend-page__hero-panel">
          <div className="backend-page__hero-stat">
            <span>Storage</span>
            <strong>Secure</strong>
          </div>
          <div className="backend-page__hero-stat">
            <span>Tokens</span>
            <strong>Editable</strong>
          </div>
          <div className="backend-page__hero-stat">
            <span>Visual identities</span>
            <strong>Selectable</strong>
          </div>
        </div>
      </section>

      <section className="backend-page__notes">
        <article className="backend-page__note">
          <Shield className="size-4" />
          <p>Names, image choices, refresh actions, and deletes all persist securely.</p>
        </article>
        <article className="backend-page__note">
          <Shield className="size-4" />
          <p>The provider tiles are visual stand-ins for popular AI services.</p>
        </article>
        <article className="backend-page__note">
          <Shield className="size-4" />
          <p>You can wire these controls to the live backend without changing the page layout.</p>
        </article>
      </section>

      <BackendTokenAdmin />
    </main>
  );
}
