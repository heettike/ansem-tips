"use client";

import { publicEnv } from "@/lib/publicEnv";

import dynamic from "next/dynamic";

type Props = {
  label?: string;
  className?: string;
  role?: "tipper" | "recipient";
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
 * Privy X login. Demo impersonation only when NEXT_PUBLIC_DEMO_MODE=true.
 * Missing app id must not silently log in as heettike.
 */
export function LoginButton({
  label = "log in with x",
  className = "btn-primary",
  role = "tipper",
  onAuthed,
}: Props) {
  const appId = publicEnv.privyAppId;
  const forceDemo = publicEnv.demoMode;

  if (forceDemo) {
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
            body: JSON.stringify({ role }),
          }).catch(() => null);
        }}
      >
        {label} (demo)
      </button>
    );
  }

  if (!appId) {
    return (
      <button type="button" className={className} disabled>
        {label}
      </button>
    );
  }

  return (
    <PrivyLoginButton
      label={label}
      className={className}
      role={role}
      onAuthed={onAuthed}
    />
  );
}
