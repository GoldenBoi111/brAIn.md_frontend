"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Brain, Loader2, Lock, Sparkles } from "lucide-react";

import { backendApi } from "@/lib/backend-api";
import { setAuthenticated } from "@/lib/auth";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) return;

    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsLoading(true);

    try {
      await backendApi.login({
        email: email.trim(),
        password,
      });
      setAuthenticated(email.trim());

      const nextPath = searchParams?.get("next");
      const destination =
        nextPath?.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/dashboard";

      window.location.assign(destination);
    } catch (error) {
      setIsLoading(false);
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <section className="login-page__stack">
      <div className="login-page__brand">
        <div className="login-page__logo">
          <Brain className="size-6 text-foreground" />
        </div>
        <p className="login-page__eyebrow">Personal memory graph</p>
        <h1 className="login-page__title">Open the notebook brain</h1>
        <p className="login-page__subtitle">
          Sign in to the AI-connected vault, browse the graph, and keep every memory anchored with live links.
        </p>
      </div>

      <section className="login-card" aria-labelledby="login-card-title">
        <h2 id="login-card-title" className="sr-only">
          Sign in form
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="login-card__field">
            <label htmlFor="email" className="login-card__label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
              className="login-card__input"
            />
          </div>

          <div className="login-card__field">
            <label htmlFor="password" className="login-card__label">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              className="login-card__input"
            />
          </div>

          <label className="login-card__checkbox">
            <input
              type="checkbox"
              defaultChecked
              className="size-4 accent-primary"
            />
            Remember this device
          </label>

          {error && (
            <div className="login-card__error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-card__button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Opening your vault...
              </>
            ) : (
              <>
                Sign in to vault
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        <div className="login-card__notes">
          <div className="login-card__hint">
            <Sparkles className="size-4" />
            <span>AI connectivity keeps the graph ready for linked search and recall.</span>
          </div>
          <div className="login-card__hint">
            <Lock className="size-4" />
            <span>Sessions are handled by the secure website API.</span>
          </div>
        </div>
      </section>

      <p className="login-page__footer">
        Don&apos;t have an account? <Link href="/signup">Create one</Link>
      </p>
    </section>
  );
}
