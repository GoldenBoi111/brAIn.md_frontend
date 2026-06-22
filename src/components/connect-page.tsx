import Link from "next/link";
import { ArrowLeft, Brain, ExternalLink, ShieldCheck } from "lucide-react";

import { ThemeToggleButton } from "@/components/theme-toggle-button";

const REQUIREMENTS = [
  "A brAIn.md account",
  "The server running at your public URL, for example https://mcp.brain-md.dev",
  "Access to Claude or ChatGPT with custom connector support",
];

const IMPORTANT_URLS = [
  { label: "MCP server", value: "https://mcp.brain-md.dev/mcp" },
  { label: "OAuth authorize", value: "https://mcp.brain-md.dev/oauth/authorize" },
  { label: "OAuth token", value: "https://mcp.brain-md.dev/oauth/token" },
  { label: "OAuth registration", value: "https://mcp.brain-md.dev/oauth/register" },
];

const CLAUDE_STEPS = [
  "Open Claude and add a new custom connector.",
  "Set the remote MCP server URL to https://mcp.brain-md.dev/mcp.",
  "Leave OAuth credentials blank unless your admin gave you a client ID and secret.",
  "Save the connector and wait for the brAIn.md sign-in page.",
  "Sign in, choose a token name and provider name if prompted, then continue.",
];

const CHATGPT_STEPS = [
  "Open ChatGPT and create a new custom connector.",
  "Use the server's discovered OAuth endpoints when the UI offers them.",
  "If the UI asks for the remote MCP server URL, use https://mcp.brain-md.dev/mcp.",
  "Let dynamic client registration handle the OAuth setup when available.",
  "Sign in, review the token name and provider name, then finish the flow.",
];

const COMMON_MISTAKES = [
  "Using the site root instead of /mcp.",
  "Typing the wrong brAIn.md password.",
  "Trying to reuse a token from another account.",
  "Creating the connector against localhost when the app expects the public host.",
  "Refreshing or closing the browser before approval finishes.",
];

const SHARED_RULES_PROMPT = `# brAIn.md Context Prompts

Use these as strict system or developer prompts for ChatGPT and Claude.

The goal is to make the model habitually consult brAIn.md for:

- prior project context
- past decisions
- unresolved work
- newly discovered facts
- user-specific preferences
- anything that needs durable memory
- any situation where the model would otherwise guess

## Shared Rules

These rules should apply to both models:

1. Before answering, check whether the question depends on prior project context, past work, prior decisions, or anything learned earlier.
2. If it does, use brAIn.md first.
3. If you learn something durable, write it back to brAIn.md as soon as possible.
4. If the user is asking for a decision, decision history, tradeoff, or prior choice, look in brAIn.md before answering.
5. If the user says "as before", "we decided", "last time", "earlier", "that thing", or anything similar, search brAIn.md first.
6. If there is any uncertainty about context, do not guess. Check brAIn.md.
7. Prefer the latest durable source in brAIn.md over short-term chat memory.
8. If brAIn.md and the current conversation conflict, call out the conflict and ask the user which source to trust.`;

const CHATGPT_PROMPT = `You are a brAIn.md-aware assistant.

Hard rule: whenever the user asks for context, history, prior decisions, past work, unresolved tasks, or anything that could depend on durable memory, you must consult brAIn.md first.

Hard rule: whenever you discover something new that should be remembered later, you must store it back into brAIn.md before finishing if the connector supports writes.

Hard rule: whenever the user needs to make a decision, you must check brAIn.md for the decision history, options already considered, constraints, and known tradeoffs before recommending anything.

Hard rule: whenever the user refers to the past, earlier work, previous messages, old decisions, "the latest state", or anything similar, you must search brAIn.md first.

Hard rule: whenever your answer would benefit from context, background, or project memory, use brAIn.md instead of guessing.

Hard rule: if the answer depends on something not in the current prompt and not yet confirmed in brAIn.md, you must fetch or search brAIn.md before answering.

Hard rule: if brAIn.md contains relevant information, treat it as the source of truth unless the user explicitly overrides it.

Hard rule: if you cannot find the needed context in brAIn.md, say so clearly and ask a focused follow-up instead of inventing details.

When you retrieve context from brAIn.md, briefly state what you found and then answer.
When you learn a durable fact, preference, decision, or constraint, update brAIn.md immediately if the connector supports it.`;

const CLAUDE_PROMPT = `You are a brAIn.md-aware assistant connected to a remote MCP server.

Hard rule: before answering, you must use the brAIn.md MCP tools whenever the user asks for context, history, prior decisions, unresolved tasks, or anything that could depend on durable memory.

Hard rule: before making a recommendation, you must search brAIn.md for earlier decisions, constraints, past work, and related context.

Hard rule: if the user refers to something from the past, previous work, "what we decided", "the latest state", or similar, you must consult brAIn.md first.

Hard rule: if you discover new durable information during the conversation, record it back into brAIn.md before you finish if the MCP tools allow writes.

Hard rule: do not guess when context may exist in brAIn.md. Search first.

Hard rule: prefer brAIn.md over short-term chat memory for durable facts, project decisions, and user preferences.

Hard rule: if brAIn.md and the current conversation disagree, surface the conflict and ask the user which source should win.

Required trigger cases for brAIn.md:
- the user needs context from earlier work
- the user asks for a decision or a recommendation
- the user asks what was done before
- the user asks about unresolved items or past choices
- you find a new fact that should be remembered later
- you need constraints, preferences, or state before proceeding

When you use brAIn.md, summarize the relevant context in one or two sentences, then answer.
When you learn something durable, write it back immediately if possible.`;

export function ConnectPage() {
  return (
    <main className="connect-page">
      <div className="connect-page__backdrop" aria-hidden="true" />

      <header className="connect-page__topbar">
        <Link href="/" className="connect-page__back">
          <ArrowLeft className="size-4" />
          <span>Home</span>
        </Link>

        <div className="connect-page__brand">
          <Brain className="size-5" />
          <span>brAIn.md</span>
        </div>

        <ThemeToggleButton />
      </header>

      <section className="connect-page__hero">
        <p className="connect-page__eyebrow">Connection guide</p>
        <h1 className="connect-page__title">Connect brAIn.md to Claude and ChatGPT.</h1>
        <p className="connect-page__lede">
          This guide is for normal users who want to connect their brAIn.md account to Claude or
          ChatGPT and start using the server without guessing at the OAuth settings.
        </p>
      </section>

      <section className="connect-page__article">
        <div className="connect-page__grid">
          <article className="connect-page__panel">
            <p className="connect-page__panel-label">What you need</p>
            <ul className="connect-page__list">
              {REQUIREMENTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="connect-page__panel">
            <p className="connect-page__panel-label">Important URLs</p>
            <p className="connect-page__panel-copy">
              Use these exact endpoints. Do not use the site root as the MCP server URL.
            </p>
            <div className="connect-page__urls">
              {IMPORTANT_URLS.map((item) => (
                <div key={item.label} className="connect-page__url-row">
                  <span>{item.label}</span>
                  <a href={item.value} target="_blank" rel="noreferrer">
                    {item.value}
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="connect-page__two-col">
          <article className="connect-page__panel">
            <p className="connect-page__panel-label">Connecting Claude</p>
            <ol className="connect-page__steps">
              {CLAUDE_STEPS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <div className="connect-page__note">
              <ShieldCheck className="size-4" />
              <p>
                When the login page appears, you may see optional token name and provider name
                fields. They help identify tokens later in the token admin page.
              </p>
            </div>
          </article>

          <article className="connect-page__panel">
            <p className="connect-page__panel-label">Connecting ChatGPT</p>
            <ol className="connect-page__steps">
              {CHATGPT_STEPS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <div className="connect-page__note">
              <ShieldCheck className="size-4" />
              <p>
                If ChatGPT asks for OAuth fields, use the discovered endpoints above and keep the
                scope set to <code>mcp</code>.
              </p>
            </div>
          </article>
        </div>

        <div className="connect-page__grid">
          <article className="connect-page__panel">
            <p className="connect-page__panel-label">What happens after you connect</p>
            <ul className="connect-page__list">
              <li>The connector receives an OAuth token.</li>
              <li>brAIn.md stores a token record for the connection.</li>
              <li>You can view the token in the token admin page.</li>
              <li>The connector can call the MCP tools exposed by the server.</li>
            </ul>
          </article>

          <article className="connect-page__panel">
            <p className="connect-page__panel-label">Common mistakes</p>
            <ul className="connect-page__list">
              {COMMON_MISTAKES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <article className="connect-page__panel connect-page__panel--full">
          <p className="connect-page__panel-label">If something fails</p>
          <p className="connect-page__panel-copy">
            If the connector says it cannot resolve OAuth, check that the server URL is exactly
            https://mcp.brain-md.dev/mcp. If the browser shows a login or authorization error, make
            sure you are signed into the correct brAIn.md account. If Claude or ChatGPT says the
            tools could not be loaded, remove the connector and add it again using the /mcp URL.
          </p>
        </article>

        <section className="connect-page__section connect-page__panel connect-page__panel--full">
          <div className="connect-page__section-head">
            <p className="connect-page__panel-label">Prompt templates</p>
            <p className="connect-page__panel-copy">
              Copy one of these into your custom instructions, system prompt, or connector setup.
              The shared rules can be pasted into both models, then use the ChatGPT or Claude block
              on top if you want a model-specific version.
            </p>
          </div>

          <div className="connect-page__prompt-grid">
            <article className="connect-page__prompt-card">
              <p className="connect-page__prompt-label">Shared rules</p>
              <pre className="connect-page__prompt-block">
                <code>{SHARED_RULES_PROMPT}</code>
              </pre>
            </article>

            <article className="connect-page__prompt-card">
              <p className="connect-page__prompt-label">ChatGPT prompt</p>
              <pre className="connect-page__prompt-block">
                <code>{CHATGPT_PROMPT}</code>
              </pre>
            </article>

            <article className="connect-page__prompt-card connect-page__prompt-card--full">
              <p className="connect-page__prompt-label">Claude prompt</p>
              <pre className="connect-page__prompt-block">
                <code>{CLAUDE_PROMPT}</code>
              </pre>
            </article>
          </div>
        </section>
      </section>

      <footer className="connect-page__footer">
        <span>brAIn.md</span>
        <span>Claude + ChatGPT connector guide</span>
        <Link href="/privacy">Privacy policy</Link>
      </footer>
    </main>
  );
}
