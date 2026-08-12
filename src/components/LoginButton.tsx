"use client";

import { publicEnv } from "@/lib/publicEnv";

import dynamic from "next/dynamic";

type Props = {
  label?: string;
  className?: string;
  onAuthed?: (info: {
    privyDid: string;
    username?: string;
    walletAddress?: string | null;
  }) => void;
};

const PrivyLoginButton = dynamic(() => import("./PrivyLoginButton"), {
  ssr: false,
});

/**
 * Privy X login button. Demo path when app id missing; live Privy otherwise.
 */
export function LoginButton({
  label = "Sign in with X",
  className = "btn-primary",
  onAuthed,
}: Props) {
  const appId = publicEnv.privyAppId;
  const forceDemo = publicEnv.demoMode;

  if (!appId || forceDemo) {
    return (
      <button
        type="button"
        className={className}
        onClick={async () => {
          onAuthed?.({
            privyDid: "did:privy:demo-heettike",
            username: "heettike",
            walletAddress: "DemoTipper1111111111111111111111111111111",
          });
          await fetch("/api/auth/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer demo:heettike",
            },
            body: JSON.stringify({ role: "tipper" }),
          }).catch(() => null);
        }}
      >
        {label} (demo)
      </button>
    );
  }

  return (
    <PrivyLoginButton label={label} className={className} onAuthed={onAuthed} />
  );
}
