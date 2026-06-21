"use client";

import Aurora from "@/components/Aurora";

const AUTH_AURORA_STOPS = ["#1e1b4b", "#6366f1", "#27272a"];

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="login-page">
      <div className="pointer-events-none absolute inset-0 opacity-55">
        <Aurora
          colorStops={AUTH_AURORA_STOPS}
          amplitude={0.7}
          blend={0.42}
          speed={0.85}
        />
      </div>
      <div className="login-page__inner">{children}</div>
    </main>
  );
}
