"use client";

import { publicEnv } from "@/lib/publicEnv";
import {
  PrivyProvider,
  useOAuthTokens,
  usePrivy,
} from "@privy-io/react-auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";

/**
 * One Privy session per page. Pages wrap their client tree in
 * <XSessionProvider role=...> and read useXSession() — no per-button
 * providers, no dead login buttons when a session already exists.
 */

export type XSessionState = {
  /** loading = privy booting; out = no session; in = synced session */
  status: "loading" | "out" | "in";
  configured: boolean;
  username: string | null;
  walletAddress: string | null;
  role: string | null;
  accessStatus: string | null;
  privyDid: string | null;
  login: () => void;
  logout: () => void;
  getAuthToken: () => Promise<string | null>;
};

const noop = () => {};
const defaultState: XSessionState = {
  status: "loading",
  configured: false,
  username: null,
  walletAddress: null,
  role: null,
  accessStatus: null,
  privyDid: null,
  login: noop,
  logout: noop,
  getAuthToken: async () => null,
};

const Ctx = createContext<XSessionState>(defaultState);

export function useXSession(): XSessionState {
  return useContext(Ctx);
}

type CapturedOAuth = {
  provider: string;
  accessToken: string;
  refreshToken?: string | null;
  accessTokenExpiresInSeconds?: number | null;
};

function SessionBridge({
  role,
  children,
}: {
  role: "tipper" | "recipient";
  children: ReactNode;
}) {
  const { ready, authenticated, user, login, logout, getAccessToken } =
    usePrivy();
  const [synced, setSynced] = useState<{
    username: string | null;
    walletAddress: string | null;
    role: string | null;
    accessStatus: string | null;
  } | null>(null);
  const oauthRef = useRef<CapturedOAuth | null>(null);
  const syncedFor = useRef<string | null>(null);

  const syncAccount = useCallback(
    async (oauth?: CapturedOAuth | null) => {
      if (!user) return;
      try {
        const token = await getAccessToken();
        const linkedWallet = (user.linkedAccounts || []).find(
          (a) => a.type === "wallet" && "address" in a
        ) as { address?: string } | undefined;
        const sol = user.wallet?.address || linkedWallet?.address || null;
        const tokens = oauth || oauthRef.current;

        const res = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role,
            walletAddress: sol,
            ...(tokens
              ? {
                  oauthTokens: {
                    provider: tokens.provider,
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken ?? null,
                    accessTokenExpiresInSeconds:
                      tokens.accessTokenExpiresInSeconds ?? null,
                  },
                }
              : {}),
          }),
        });
        const data = await res.json().catch(() => null);
        const twitter = user.twitter as { username?: string } | undefined;
        setSynced({
          username:
            (data?.ok && data.username) ||
            twitter?.username?.toLowerCase() ||
            null,
          walletAddress: (data?.ok && data.walletAddress) || sol,
          role: (data?.ok && data.role) || role,
          accessStatus: (data?.ok && data.accessStatus) || null,
        });
        syncedFor.current = user.id;
      } catch (e) {
        console.error("[xsession] sync failed", e);
        const twitter = user.twitter as { username?: string } | undefined;
        // Session exists even if sync failed — show it rather than a dead button.
        setSynced({
          username: twitter?.username?.toLowerCase() || null,
          walletAddress: user.wallet?.address || null,
          role,
          accessStatus: null,
        });
      }
    },
    [user, getAccessToken, role]
  );

  // Must stay mounted on the page the user returns to after the x grant.
  useOAuthTokens({
    onOAuthTokenGrant: ({ oAuthTokens }) => {
      if (oAuthTokens.provider !== "twitter") return;
      const captured: CapturedOAuth = {
        provider: oAuthTokens.provider,
        accessToken: oAuthTokens.accessToken,
        refreshToken: oAuthTokens.refreshToken ?? null,
        accessTokenExpiresInSeconds:
          oAuthTokens.accessTokenExpiresInSeconds ?? null,
      };
      oauthRef.current = captured;
      void syncAccount(captured);
    },
  });

  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    if (syncedFor.current === user.id) return;
    void syncAccount(oauthRef.current);
  }, [ready, authenticated, user, syncAccount]);

  const value = useMemo<XSessionState>(() => {
    const status: XSessionState["status"] = !ready
      ? "loading"
      : !authenticated
        ? "out"
        : synced
          ? "in"
          : "loading";
    return {
      status,
      configured: true,
      username: synced?.username ?? null,
      walletAddress: synced?.walletAddress ?? null,
      role: synced?.role ?? null,
      accessStatus: synced?.accessStatus ?? null,
      privyDid: user?.id ?? null,
      login: () => {
        if (!authenticated) login();
      },
      logout: () => {
        syncedFor.current = null;
        setSynced(null);
        void logout();
      },
      getAuthToken: async () => {
        try {
          return await getAccessToken();
        } catch {
          return null;
        }
      },
    };
  }, [ready, authenticated, synced, user, login, logout, getAccessToken]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function DemoBridge({
  role,
  children,
}: {
  role: "tipper" | "recipient";
  children: ReactNode;
}) {
  const [inSession, setInSession] = useState(false);
  const value = useMemo<XSessionState>(
    () => ({
      status: inSession ? "in" : "out",
      configured: true,
      username: inSession ? "heettike" : null,
      walletAddress: inSession
        ? "DemoTipper1111111111111111111111111111111"
        : null,
      role,
      accessStatus: inSession ? "approved" : null,
      privyDid: inSession ? "did:privy:demo-heettike" : null,
      login: () => {
        setInSession(true);
        void fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer demo:heettike",
          },
          body: JSON.stringify({ role }),
        }).catch(() => null);
      },
      logout: () => setInSession(false),
      getAuthToken: async () => "demo:heettike",
    }),
    [inSession, role]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function XSessionProvider({
  role = "tipper",
  children,
}: {
  role?: "tipper" | "recipient";
  children: ReactNode;
}) {
  const appId = publicEnv.privyAppId;

  if (publicEnv.demoMode) {
    return <DemoBridge role={role}>{children}</DemoBridge>;
  }

  if (!appId) {
    return (
      <Ctx.Provider value={{ ...defaultState, status: "out" }}>
        {children}
      </Ctx.Provider>
    );
  }

  return (
    <ClientErrorBoundary
      fallback={
        <Ctx.Provider value={{ ...defaultState, status: "out" }}>
          {children}
        </Ctx.Provider>
      }
    >
      <PrivyProvider
        appId={appId}
        config={{
          loginMethods: ["twitter"],
          appearance: { theme: "light", accentColor: "#292524" },
          embeddedWallets: {
            solana: { createOnLogin: "users-without-wallets" },
            ethereum: { createOnLogin: "off" },
          },
        }}
      >
        <SessionBridge role={role}>{children}</SessionBridge>
      </PrivyProvider>
    </ClientErrorBoundary>
  );
}
