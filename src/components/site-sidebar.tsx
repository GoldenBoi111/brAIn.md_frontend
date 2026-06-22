"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Brain, LogOut } from "lucide-react";

import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { backendApi } from "@/lib/backend-api";
import { clearAuthenticatedSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

type SidebarLink = {
  href: string;
  label: string;
  description: string;
};

const SITE_LINKS: SidebarLink[] = [
  { href: "/", label: "Home", description: "Landing page and project overview." },
  { href: "/dashboard", label: "Dashboard", description: "Vault hub and recent memories." },
  { href: "/mind", label: "Mind map", description: "Explore the brain graph." },
  { href: "/tokens", label: "Tokens", description: "Token names, images, and permissions." },
  { href: "/connect", label: "Connect", description: "Claude and ChatGPT setup guide." },
  { href: "/privacy", label: "Privacy", description: "Data and storage notes." },
  { href: "/login", label: "Log in", description: "Access the vault and graph." },
  { href: "/signup", label: "Sign up", description: "Create a new account." },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteSidebar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  return (
    <aside className="site-sidebar" aria-label="Site navigation">
      <div className="site-sidebar__panel">
        <div className="site-sidebar__brand">
          <Brain className="size-5 text-muted-foreground" />
          <div>
            <p className="site-sidebar__eyebrow">brAIn.md</p>
            <h2 className="site-sidebar__title">Site pages</h2>
          </div>
        </div>

        <p className="site-sidebar__lede">
          Jump between the landing page, dashboard, graph, vault, tokens, and the connector guide.
        </p>

        <nav className="site-sidebar__nav">
          {SITE_LINKS.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("site-sidebar__link", active && "site-sidebar__link--active")}
                aria-current={active ? "page" : undefined}
              >
                <span>{item.label}</span>
                <span>{item.description}</span>
              </Link>
            );
          })}
        </nav>

        <div className="site-sidebar__actions">
          <ThemeToggleButton />
          <button
            type="button"
            className="site-sidebar__sign-out"
            onClick={async () => {
              try {
                await backendApi.logout();
              } finally {
                clearAuthenticatedSession();
                router.push("/login");
              }
            }}
          >
            <LogOut className="size-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
