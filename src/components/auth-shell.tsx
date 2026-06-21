"use client";

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="login-page">
      <div className="login-page__grain" aria-hidden="true" />
      <div className="login-page__tape login-page__tape--one" aria-hidden="true" />
      <div className="login-page__tape login-page__tape--two" aria-hidden="true" />
      <div className="login-page__note login-page__note--one" aria-hidden="true">
        graph first
      </div>
      <div className="login-page__note login-page__note--two" aria-hidden="true">
        AI connectivity
      </div>
      <div
        className="login-page__note"
        aria-hidden="true"
        style={{ left: "12%", top: "20%", transform: "rotate(10deg)" }}
      >
        offline ready
      </div>
      <div
        className="login-page__note"
        aria-hidden="true"
        style={{ right: "12%", top: "22%", transform: "rotate(-9deg)" }}
      >
        live linking
      </div>
      <div className="login-page__inner">{children}</div>
    </main>
  );
}
