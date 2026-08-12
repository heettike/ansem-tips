"use client";

import dynamic from "next/dynamic";
import type { TipAmountSettings } from "@/types";
import { TipSettingsForm } from "./TipSettingsForm";

const PrivyTipSettingsForm = dynamic(() => import("./PrivyTipSettingsForm"), {
  ssr: false,
  loading: () => (
    <div className="card p-5 text-sm text-muted">Loading tip settings…</div>
  ),
});

export function LiveTipSettingsForm({
  initial,
  minTip = 0.01,
}: {
  initial: TipAmountSettings;
  minTip?: number;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const forceDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (!appId || forceDemo) {
    return (
      <TipSettingsForm
        initial={initial}
        minTip={minTip}
        authToken="demo:heettike"
      />
    );
  }

  return <PrivyTipSettingsForm initial={initial} minTip={minTip} />;
}
