"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { type ReactNode, useMemo } from "react";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";

/** Isolated so the main Providers tree can load without Privy when app id is unset. */
export default function PrivyProviders({ children }: { children: ReactNode }) {
  const appId = (process.env.NEXT_PUBLIC_PRIVY_APP_ID || "").trim();

  const config = useMemo(
    () => ({
      loginMethods: ["twitter"] as const,
      appearance: {
        theme: "dark" as const,
        accentColor: "#b6ff3b" as `#${string}`,
      },
      // Solana embedded wallets — keep shape Privy v3 expects
      embeddedWallets: {
        solana: {
          createOnLogin: "users-without-wallets" as const,
        },
        ethereum: {
          createOnLogin: "off" as const,
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
