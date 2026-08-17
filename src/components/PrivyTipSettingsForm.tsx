"use client";

import dynamic from "next/dynamic";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState, type ReactNode } from "react";
import { TipSettingsForm } from "./TipSettingsForm";
import type { TipAmountSettings } from "@/types";

const PrivyProviders = dynamic(() => import("./PrivyProviders"), {
  ssr: false,
});

function TipSettingsInner({
  initial,
  minTip,
}: {
  initial: TipAmountSettings;
  minTip: number;
}) {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !authenticated) return;
    let cancelled = false;
    (async () => {
      const t = await getAccessToken();
      if (!cancelled) setToken(t);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, getAccessToken]);

  if (!ready) {
    return <p className="text-sm text-muted">one second…</p>;
  }

  if (!authenticated) {
    return (
      <p className="text-muted">
        log in with x first — then set how much leaves your wallet.
      </p>
    );
  }

  return (
    <TipSettingsForm initial={initial} minTip={minTip} authToken={token} />
  );
}

function WithPrivy({ children }: { children: ReactNode }) {
  return <PrivyProviders>{children}</PrivyProviders>;
}

/** Privy-backed tip settings — provider mounted here (not on homepage). */
export default function PrivyTipSettingsForm({
  initial,
  minTip = 0.01,
}: {
  initial: TipAmountSettings;
  minTip?: number;
}) {
  return (
    <WithPrivy>
      <TipSettingsInner initial={initial} minTip={minTip} />
    </WithPrivy>
  );
}
