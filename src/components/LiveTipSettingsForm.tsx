"use client";

import { publicEnv } from "@/lib/publicEnv";

import dynamic from "next/dynamic";
import type { TipAmountSettings } from "@/types";
import { TipSettingsForm } from "./TipSettingsForm";

const PrivyTipSettingsForm = dynamic(() => import("./PrivyTipSettingsForm"), {
  ssr: false,
  loading: () => (
    <div className="py-6 text-sm text-muted">loading tip amounts…</div>
  ),
});

export function LiveTipSettingsForm({
  initial,
  minTip = 0.01,
}: {
  initial: TipAmountSettings;
  minTip?: number;
}) {
  const appId = publicEnv.privyAppId;
  const forceDemo = publicEnv.demoMode;

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
