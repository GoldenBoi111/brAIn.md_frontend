import Link from "next/link";
import { ArrowUpRight, Brain, BookOpenText, Lock, Search, Shield } from "lucide-react";

import { ThemeToggleButton } from "@/components/theme-toggle-button";

const NAV_LINKS = [
  { href: "/mind", label: "Mind map" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/connect", label: "Connect guide" },
  { href: "/privacy", label: "Privacy" },
];

const HIGHLIGHTS = [
  {
    label: "Graph first",
    value: "Move through memories as a living map, not a list.",
  },
  {
    label: "One vault",
    value: "Everything stays in one brain vault with nested branches.",
  },
  {
    label: "Token controls",
    value: "Lock or restrict file access per token when you need it.",
  },
  {
    label: "Claude + ChatGPT",
    value: "Connect remote assistants to your public MCP endpoint.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Capture",
    copy: "Drop notes, files, and references into one vault and let structure emerge.",
  },
  {
    number: "02",
    title: "Navigate",
    copy: "Use the brain map, vault sidebar, and command palette to move fast.",
  },
  {
    number: "03",
    title: "Control",
    copy: "Apply token-specific file locks and write restrictions from inside the vault.",
  },
];

const QUICK_LINKS = [
  {
    href: "/connect",
    label: "Read the connection guide",
    copy: "Set up Claude or ChatGPT with the correct MCP and OAuth endpoints.",
  },
  {
    href: "/privacy",
    label: "Review privacy policy",
    copy: "See how brAIn.md handles data, sessions, and token metadata.",
  },
  {
    href: "/dashboard",
    label: "Open the dashboard",
    copy: "Check recent files, vault activity, and the brain vault overview.",
  },
];

export function LandingPage() {
  return (
    <main className="landing-page">
      <div className="landing-page__backdrop" aria-hidden="true" />

      <header className="landing-page__topbar">
        <Link href="/" className="landing-page__brand" aria-label="brAIn.md home">
          <Brain className="size-5" />
          <span className="landing-page__brand-wordmark">brAIn.md</span>
        </Link>

        <div className="landing-page__topbar-actions">
          <nav className="landing-page__nav" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="landing-page__nav-link">
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeToggleButton />
          <Link href="/login" className="paper-button paper-button--outline landing-page__button">
            Sign in
          </Link>
        </div>
      </header>

      <section className="landing-page__hero">
        <div className="landing-page__hero-copy">
          <p className="landing-page__eyebrow">Living memory graph</p>
          <h1 className="landing-page__title">
            One brain vault for thoughts, files, and the connections that make them useful.
          </h1>
          <p className="landing-page__lede">
            brAIn.md keeps the workspace quiet and legible: a single vault, a spatial mind map,
            token-level permissions, and a clean path from capture to Claude or ChatGPT.
          </p>

          <div className="landing-page__cta-row">
            <Link href="/mind" className="paper-button landing-page__button">
              Open mind map
              <ArrowUpRight className="size-4" />
            </Link>
            <Link href="/signup" className="paper-button paper-button--outline landing-page__button">
              Create account
            </Link>
            <Link href="/connect" className="paper-button paper-button--ghost landing-page__button">
              Connect Claude / ChatGPT
            </Link>
          </div>

          <div className="landing-page__chips">
            <span className="landing-page__chip">
              <Search className="size-3.5" />
              Cmd/Ctrl K search
            </span>
            <span className="landing-page__chip">
              <Lock className="size-3.5" />
              Token file locks
            </span>
            <span className="landing-page__chip">
              <Shield className="size-3.5" />
              Privacy-first structure
            </span>
          </div>

          <div className="landing-page__quick-links" aria-label="Helpful links">
            {QUICK_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="landing-page__quick-link">
                <span className="landing-page__quick-link-title">{item.label}</span>
                <span className="landing-page__quick-link-copy">{item.copy}</span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="landing-page__hero-panel" aria-label="Highlights">
          <div className="landing-page__hero-panel-intro">
            <BookOpenText className="size-4" />
            <p>Designed like a notebook, organized like a graph.</p>
          </div>
          {HIGHLIGHTS.map((item) => (
            <article key={item.label} className="landing-page__highlight">
              <p className="landing-page__highlight-label">{item.label}</p>
              <p className="landing-page__highlight-copy">{item.value}</p>
            </article>
          ))}
        </aside>
      </section>

      <section className="landing-page__section">
        <div className="landing-page__section-head">
          <p className="landing-page__eyebrow">How it works</p>
          <h2 className="landing-page__section-title">Three gestures: capture, navigate, control.</h2>
          <p className="landing-page__lede landing-page__lede--tight">
            The landing page points you to the real jobs: open the graph, inspect the vault, and
            connect the server to Claude or ChatGPT when you are ready.
          </p>
        </div>

        <div className="landing-page__step-grid">
          {STEPS.map((step) => (
            <article key={step.number} className="landing-page__step">
              <p className="landing-page__step-number">{step.number}</p>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-page__section landing-page__section--split">
        <div className="landing-page__section-copy">
          <p className="landing-page__eyebrow">Designed for the way you think</p>
          <h2 className="landing-page__section-title">
            The graph is the product. Everything else supports it.
          </h2>
          <p className="landing-page__lede landing-page__lede--tight">
            Use the vault for file work, the mind page for spatial exploration, the dashboard for
            recent activity, and the connection guide for Claude or ChatGPT setup. The site stays
            focused on the workflow, not a generic marketing pitch.
          </p>
        </div>

        <div className="landing-page__proof">
          <p>Built around a single brain vault.</p>
          <p>Connected tokens and permissions without cluttering the experience.</p>
          <p>Quick entry points to login, signup, mind map, connect guide, and privacy policy.</p>
        </div>
      </section>

      <footer className="landing-page__footer">
        <span>brAIn.md</span>
        <span>Graph-first memory workspace</span>
        <Link href="/privacy">Privacy policy</Link>
      </footer>
    </main>
  );
}
