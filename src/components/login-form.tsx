"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brain, Loader2, Lock, Sparkles } from "lucide-react";

import { setAuthenticated } from "@/lib/auth";
import { BackendApiError, backendApi } from "@/lib/backend-api";

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
      const { user } = await backendApi.login({
        email: email.trim(),
        password,
      });

      setAuthenticated(user.email);

      const nextPath = searchParams.get("next");
      const destination =
        nextPath?.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/dashboard";

      window.location.assign(destination);
    } catch (err) {
      setIsLoading(false);
      if (err instanceof BackendApiError) {
        setError(err.message);
        return;
      }
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <div className="login-page__brand">
        <div className="login-page__logo">
          <Brain className="size-7 text-foreground" />
        </div>
        <h1 className="login-page__title">brAIn.md</h1>
        <p className="login-page__subtitle">
          Sign in to open your markdown vault
        </p>
      </div>

      <div className="login-card">
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
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="password" className="login-card__label">
                Password
              </label>
              <button
                type="button"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Forgot password?
              </button>
            </div>
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

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              defaultChecked
              className="size-4 rounded border border-input accent-primary"
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
              "Sign in to vault"
            )}
          </button>
        </form>

        <div className="mt-6 space-y-3 border-t border-border/60 pt-5">
          <div className="login-card__hint">
            <Lock className="size-4" />
            <span>Secure sign-in to access your vault and notes.</span>
          </div>
          <div className="login-card__hint">
            <Sparkles className="size-4" />
            <span>Jump straight into your files, folders, and notes after sign-in.</span>
          </div>
        </div>
      </div>

      <p className="login-page__footer">
        Don&apos;t have an account?{" "}
        <Link href="/signup">Create one</Link>
      </p>
    </>
  );
}
