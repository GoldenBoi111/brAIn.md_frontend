"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, Loader2, Lock, Sparkles } from "lucide-react";

import { setAuthenticated } from "@/lib/auth";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

    window.setTimeout(() => {
      setAuthenticated(email.trim());
      window.location.assign("/dashboard");
    }, 400);
  };

  return (
    <>
      <div className="login-page__brand">
        <div className="login-page__logo">
          <Brain className="size-7 text-foreground" />
        </div>
        <h1 className="login-page__title">brAIn.md</h1>
        <p className="login-page__subtitle">
          Create an account to start your local vault
        </p>
      </div>

      <div className="login-card">
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
              "Create account"
            )}
          </button>
        </form>

        <div className="mt-6 space-y-3 border-t border-border/60 pt-5">
          <div className="login-card__hint">
            <Lock className="size-4" />
            <span>Your notes stay on your machine. Nothing leaves this device.</span>
          </div>
          <div className="login-card__hint">
            <Sparkles className="size-4" />
            <span>After sign-up you&apos;ll land on your vault hub.</span>
          </div>
        </div>
      </div>

      <p className="login-page__footer">
        Already have an account?{" "}
        <Link href="/login">Sign in</Link>
      </p>
    </>
  );
}
