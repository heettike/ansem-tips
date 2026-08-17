"use client";

import { useEffect, useState } from "react";
import { useXSession } from "@/components/XSession";
import { TipSettingsForm } from "./TipSettingsForm";
import type { TipAmountSettings } from "@/types";

/** Settings form bound to the page session. Renders inside <XSessionProvider>. */
export default function PrivyTipSettingsForm({
  initial,
  minTip,
}: {
  initial: TipAmountSettings;
  minTip: number;
}) {
  const session = useXSession();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (session.status !== "in") return;
    let cancelled = false;
    (async () => {
      const t = await session.getAuthToken();
      if (!cancelled) setToken(t);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (session.status === "loading") {
    return <p className="text-sm text-muted">one second…</p>;
  }

  if (session.status === "out") {
    return (
      <p className="text-muted">
        log in with x first — then set how much leaves your wallet.
      </p>
    );
  }

  return <TipSettingsForm initial={initial} minTip={minTip} authToken={token} />;
}
