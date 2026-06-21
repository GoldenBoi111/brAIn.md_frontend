import type { Metadata } from "next";

import { PrivacyPage } from "@/components/privacy-page";

export const metadata: Metadata = {
  title: "Privacy Policy | brAIn.md",
  description: "Privacy policy draft for the brAIn.md memory graph workspace.",
};

export default function PrivacyRoute() {
  return <PrivacyPage />;
}
