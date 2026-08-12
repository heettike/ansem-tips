"use client";

import { publicEnv } from "@/lib/publicEnv";

import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";
import { type ReactNode, useMemo } from "react";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";

/** Isolated so the main Providers tree can load without Privy when app id is unset. */
export default function PrivyProviders({ children }: { children: ReactNode }) {
  const appId = publicEnv.privyAppId;

  const config = useMemo<PrivyClientConfig>(
    () => ({
      loginMethods: ["twitter"],
      appearance: {
        theme: "dark",
        accentColor: "#b6ff3b",
      },
      // Solana embedded wallets — keep shape Privy v3 expects
      embeddedWallets: {
        solana: {
          createOnLogin: "users-without-wallets",
        },
        ethereum: {
          createOnLogin: "off",
        },
      },
    }),
    []
  );

  if (!appId) return <>{children}</>;

  return (
    <ClientErrorBoundary fallback={<>{children}</>}>
      <PrivyProvider appId={appId} config={config}>
        {children}
      </PrivyProvider>
    </ClientErrorBoundary>
  );
}
