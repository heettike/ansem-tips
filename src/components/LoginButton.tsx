"use client";

import { useEffect, useRef } from "react";
import { useXSession } from "@/components/XSession";

type Props = {
  label?: string;
  className?: string;
  /** kept for call-site compatibility; the provider owns the role now */
  role?: "tipper" | "recipient";
  onAuthed?: (info: {
    privyDid: string;
    username?: string;
    walletAddress?: string | null;
  }) => void;
};

/**
 * Session-state button. Must render inside <XSessionProvider>.
 * out → login CTA · in → signed-in chip + log out · loading → quiet.
 * onAuthed fires automatically when a session lands (fresh login or
 * restored on page load), so pages can keep their data loading as-is.
 */
export function LoginButton({
  label = "log in with x",
  className = "btn-primary",
  onAuthed,
}: Props) {
  const session = useXSession();
  const notifiedFor = useRef<string | null>(null);

  useEffect(() => {
    if (session.status !== "in" || !session.privyDid) return;
    if (notifiedFor.current === session.privyDid) return;
    notifiedFor.current = session.privyDid;
    onAuthed?.({
      privyDid: session.privyDid,
      username: session.username ?? undefined,
      walletAddress: session.walletAddress,
    });
  }, [session.status, session.privyDid, session.username, session.walletAddress, onAuthed]);

  if (session.status === "loading") {
    return (
      <button type="button" className={className} disabled>
        one second…
      </button>
    );
  }

  if (session.status === "in") {
    return (
      <span className="inline-flex flex-wrap items-center gap-3">
        <span className="pill">
          {session.username ? `signed in as @${session.username}` : "signed in"}
        </span>
        <button
          type="button"
          className="text-sm text-muted underline-offset-2 hover:underline"
          onClick={() => {
            notifiedFor.current = null;
            session.logout();
          }}
        >
          log out
        </button>
      </span>
    );
  }

  if (!session.configured) {
    return (
      <button type="button" className={className} disabled>
        {label}
      </button>
    );
  }

  return (
    <button type="button" className={className} onClick={session.login}>
      {label}
    </button>
  );
}
