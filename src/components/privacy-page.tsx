import Link from "next/link";
import { ArrowLeft, Brain, Shield } from "lucide-react";

import { ThemeToggleButton } from "@/components/theme-toggle-button";

const SECTIONS = [
  {
    title: "Information we store",
    copy:
      "During this prototype, notes, files, tokens, and preferences may be stored locally in your browser or within the current app session. If backend features are enabled later, the same data may also be synchronized with the service you connect.",
  },
  {
    title: "How we use it",
    copy:
      "We use the information to render the vault, remember your theme, preserve token settings, and make the graph, search, and file controls work as expected.",
  },
  {
    title: "Sharing",
    copy:
      "We do not sell personal information. If you connect third-party services or AI providers, only the data required for that connection should be shared with the service you choose.",
  },
  {
    title: "Retention",
    copy:
      "Local data remains until you clear your browser storage or remove it from the app. If a hosted backend is introduced, retention and deletion controls should be documented there as well.",
  },
  {
    title: "Your choices",
    copy:
      "You can sign out, clear local session data, rename or delete tokens, and adjust file-level access rules from inside the app.",
  },
  {
    title: "Contact",
    copy:
      "If this site is deployed for a team or customer, replace this section with the correct privacy contact and any jurisdiction-specific disclosures before launch.",
  },
];

export function PrivacyPage() {
  return (
    <main className="privacy-page">
      <header className="privacy-page__topbar">
        <Link href="/" className="privacy-page__back">
          <ArrowLeft className="size-4" />
          <span>Home</span>
        </Link>

        <div className="privacy-page__brand">
          <Brain className="size-5" />
          <span>brAIn.md</span>
        </div>

        <ThemeToggleButton />
      </header>

      <section className="privacy-page__hero">
        <p className="privacy-page__eyebrow">Privacy policy draft</p>
        <h1 className="privacy-page__title">How brAIn.md handles data.</h1>
        <p className="privacy-page__lede">
          Last updated June 21, 2026. This page is a working draft for the current prototype and
          should be reviewed before production use.
        </p>
      </section>

      <article className="privacy-page__article">
        <div className="privacy-page__callout">
          <Shield className="size-4" />
          <p>
            brAIn.md is designed to feel local and graph-first. The policy below matches the current
            app behavior and can be expanded once a real backend is attached.
          </p>
        </div>

        <div className="privacy-page__grid">
          {SECTIONS.map((section) => (
            <section key={section.title} className="privacy-page__section">
              <h2>{section.title}</h2>
              <p>{section.copy}</p>
            </section>
          ))}
        </div>

        <section className="privacy-page__section privacy-page__section--full">
          <h2>Questions</h2>
          <p>
            For questions about this draft, replace this text with the organization’s legal or
            privacy contact before publishing the site publicly.
          </p>
        </section>
      </article>

      <footer className="privacy-page__footer">
        <Link href="/login">Login</Link>
        <Link href="/signup">Sign up</Link>
        <Link href="/dashboard">Dashboard</Link>
      </footer>
    </main>
  );
}
