import type { Metadata } from "next";

import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = {
  title: "brAIn.md | Living memory graph",
  description: "A graph-first home for notes, files, tokens, and linked memories.",
};

export default function Home() {
  return <LandingPage />;
}
