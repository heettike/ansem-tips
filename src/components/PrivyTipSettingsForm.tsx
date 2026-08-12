"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { TipSettingsForm } from "./TipSettingsForm";
import type { TipAmountSettings } from "@/types";

export default function PrivyTipSettingsForm({
  initial,
  minTip = 0.01,
}: {
  initial: TipAmountSettings;
  minTip?: number;
}) {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !authenticated) {
      setToken(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const t = await getAccessToken();
      if (!cancelled) setToken(t);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, getAccessToken]);

  return <TipSettingsForm initial={initial} minTip={minTip} authToken={token} />;
}
