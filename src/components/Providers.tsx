"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";

const PrivyProviders = dynamic(() => import("./PrivyProviders"), {
  ssr: false,
});

/**
 * Real PrivyProvider when NEXT_PUBLIC_PRIVY_APP_ID is set.
 * Dynamic import keeps builds green when Privy peer graph is heavy.
 */
export function Providers({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const forceDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (!appId || forceDemo) {
    return <>{children}</>;
  }

  return <PrivyProviders>{children}</PrivyProviders>;
}
