"use client";

import { usePathname } from "next/navigation";

import { SiteSidebar } from "@/components/site-sidebar";
import { cn } from "@/lib/utils";

interface SiteFrameProps {
  children: React.ReactNode;
}

const SIDEBARLESS_ROUTES = ["/dashboard", "/mind", "/vault"];

function shouldShowSidebar(pathname: string): boolean {
  return !SIDEBARLESS_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function SiteFrame({ children }: SiteFrameProps) {
  const pathname = usePathname() ?? "/";
  const showSidebar = shouldShowSidebar(pathname);

  return (
    <div className={cn("site-frame", !showSidebar && "site-frame--sidebarless")}>
      {showSidebar ? <SiteSidebar /> : null}
      <div className="site-frame__content">{children}</div>
    </div>
  );
}
