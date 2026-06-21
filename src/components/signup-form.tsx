"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Brain, Loader2, Lock, Sparkles } from "lucide-react";

import { setAuthenticated } from "@/lib/auth";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      setAuthenticated(email.trim());
      window.location.assign("/dashboard");
    } catch {
      setIsLoading(false);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="login-page__stack">
      <div className="login-page__brand">
        <div className="login-page__logo">
          <Brain className="size-6 text-foreground" />
        </div>
        <p className="login-page__eyebrow">Personal memory graph</p>
        <h1 className="login-page__title">Start a fresh notebook vault</h1>
        <p className="login-page__subtitle">
          Create a local account, then begin linking notes into the graph without needing a live backend.
        </p>
      </div>

      <section className="login-card" aria-labelledby="signup-card-title">
        <h2 id="signup-card-title" className="sr-only">
          Sign up form
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="login-card__field">
            <label htmlFor="signup-email" className="login-card__label">
              Email
            </label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-password" className="login-card__label">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              className="login-card__input"
            />
          </div>

          <div className="login-card__field">
            <label htmlFor="signup-confirm" className="login-card__label">
              Confirm password
            </label>
            <input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isLoading}
              className="login-card__input"
            />
          </div>

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
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        <div className="login-card__notes">
          <div className="login-card__hint">
            <Lock className="size-4" />
            <span>Your account is stored locally for this prototype.</span>
          </div>
          <div className="login-card__hint">
            <Sparkles className="size-4" />
            <span>After sign-up you&apos;ll open the graph immediately.</span>
          </div>
        </div>
      </section>

      <p className="login-page__footer">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </section>
  );
}
