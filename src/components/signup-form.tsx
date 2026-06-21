"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, Loader2, Lock, Sparkles } from "lucide-react";

import FadeContent from "@/components/FadeContent";
import GlareHover from "@/components/GlareHover";
import GradientText from "@/components/GradientText";
import { setAuthenticated } from "@/lib/auth";
import { BackendApiError, backendApi } from "@/lib/backend-api";

const BRAND_GRADIENT = ["#a78bfa", "#fafafa", "#818cf8"];

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
      const { user } = await backendApi.register({
        email: email.trim(),
        password,
      });

      setAuthenticated(user.email);
      window.location.assign("/dashboard");
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
      <FadeContent blur duration={900} delay={0} threshold={0.05}>
        <div className="login-page__brand">
          <div className="login-page__logo">
            <Brain className="size-7 text-foreground" />
          </div>
          <GradientText
            colors={BRAND_GRADIENT}
            animationSpeed={6}
            className="login-page__title mx-auto inline-flex"
          >
            brAIn.md
          </GradientText>
          <p className="login-page__subtitle">
            Create an account to start your vault
          </p>
        </div>
      </FadeContent>

      <FadeContent blur duration={900} delay={120} threshold={0.05}>
      <GlareHover
        width="100%"
        height="auto"
        background="var(--card)"
        borderColor="var(--border)"
        borderRadius="1rem"
        glareColor="#a78bfa"
        glareOpacity={0.28}
        className="login-card !block w-full !cursor-default !place-items-stretch"
        style={{ width: "100%", display: "block" }}
      >
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
            <span>Secure sign-up to start organizing your vault.</span>
          </div>
          <div className="login-card__hint">
            <Sparkles className="size-4" />
            <span>After sign-up you&apos;ll land on your vault hub.</span>
          </div>
        </div>
      </GlareHover>
      </FadeContent>

      <FadeContent blur duration={800} delay={220} threshold={0.05}>
        <p className="login-page__footer">
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </p>
      </FadeContent>
    </>
  );
}
