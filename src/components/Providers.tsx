"use client";

import { type ReactNode } from "react";

/**
 * Root providers stay light. Privy/Solana is mounted only inside login buttons
 * so the homepage never loads wallet SDKs that can crash mobile/desktop tabs.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
