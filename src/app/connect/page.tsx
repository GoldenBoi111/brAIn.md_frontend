import type { Metadata } from "next";

import { ConnectPage } from "@/components/connect-page";

export const metadata: Metadata = {
  title: "Connect Claude and ChatGPT | brAIn.md",
  description: "A friendly guide for connecting brAIn.md to Claude and ChatGPT using the MCP server.",
};

export default function ConnectRoute() {
  return <ConnectPage />;
}
