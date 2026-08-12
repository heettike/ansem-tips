"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";

const PrivyProviders = dynamic(() => import("./PrivyProviders"), {
  ssr: false,
  loading: () => null,
});

/**
 * Real PrivyProvider when NEXT_PUBLIC_PRIVY_APP_ID is set.
 * Dynamic import keeps builds green when Privy peer graph is heavy.
 * Error boundary prevents a Privy crash from blanking the whole site.
 */
export function Providers({ children }: { children: ReactNode }) {
  const appId = (process.env.NEXT_PUBLIC_PRIVY_APP_ID || "").trim();
  const forceDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (!appId || forceDemo) {
    return <>{children}</>;
  }

  return (
    <ClientErrorBoundary fallback={<>{children}</>}>
      <PrivyProviders>{children}</PrivyProviders>
    </ClientErrorBoundary>
  );
}
