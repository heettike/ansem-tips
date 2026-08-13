/**
 * Provision a Privy user + Solana embedded wallet for a tip recipient,
 * keyed by their Twitter/X numeric id so a later X login matches.
 *
 * Destination for SPL tips is always the Privy Solana address we provisioned —
 * never a self-reported address sitting on User.walletAddress without a DID.
 */

export type PrivyLinkedAccount = {
  type?: string;
  chainType?: string;
  chain_type?: string;
  address?: string;
  walletClient?: string;
  wallet_client?: string;
  subject?: string;
  custom_user_id?: string;
};

export type PrivyUserSnapshot = {
  id: string;
  linkedAccounts?: PrivyLinkedAccount[];
  linked_accounts?: PrivyLinkedAccount[];
};

export type CreatePrivyUserInput = {
  linked_accounts: Array<Record<string, string>>;
  wallets: Array<{ chain_type: "solana" }>;
};

export type PrivyAdmin = {
  createUser(input: CreatePrivyUserInput): Promise<PrivyUserSnapshot>;
  getUser(did: string): Promise<PrivyUserSnapshot | null>;
  getUserByTwitterSubject(subject: string): Promise<PrivyUserSnapshot | null>;
  pregenerateSolanaWallet(did: string): Promise<PrivyUserSnapshot>;
};

export type RecipientIdentity = {
  xId: string;
  username: string;
  existingPrivyDid: string | null;
  /** Ignored as an SPL destination unless paired with a Privy DID we control. */
  existingWalletAddress: string | null;
};

export type ProvisionedRecipient = {
  privyDid: string;
  walletAddress: string;
  created: boolean;
};

export function isTwitterNumericId(xId: string): boolean {
  return /^\d{1,20}$/.test(xId);
}

function accountsOf(user: PrivyUserSnapshot): PrivyLinkedAccount[] {
  return user.linkedAccounts ?? user.linked_accounts ?? [];
}

export function solanaAddressFromPrivyUser(
  user: PrivyUserSnapshot | null | undefined
): string | null {
  if (!user) return null;
  const sol = accountsOf(user).find((a) => {
    const chain = a.chainType || a.chain_type;
    return a.type === "wallet" && chain === "solana" && Boolean(a.address);
  });
  return sol?.address ?? null;
}

function twitterUsername(raw: string): string {
  return raw.replace(/^@/, "").slice(0, 15);
}

function twitterImportAllowed(username: string): boolean {
  return /^[0-9a-zA-Z_]{1,15}$/.test(username);
}

async function walletOnUser(
  admin: PrivyAdmin,
  user: PrivyUserSnapshot
): Promise<{ privyDid: string; walletAddress: string }> {
  let address = solanaAddressFromPrivyUser(user);
  let snapshot = user;
  if (!address) {
    snapshot = await admin.pregenerateSolanaWallet(user.id);
    address = solanaAddressFromPrivyUser(snapshot);
  }
  if (!address) {
    throw new Error("Privy user has no Solana wallet");
  }
  return { privyDid: snapshot.id, walletAddress: address };
}

/**
 * Idempotent: existing privyDid reuses that user (create wallet if missing).
 * Self-reported walletAddress without a DID is not reused as the send target.
 */
export async function ensureRecipientPrivyWallet(
  identity: RecipientIdentity,
  admin: PrivyAdmin
): Promise<ProvisionedRecipient> {
  const username = twitterUsername(identity.username || "user");

  if (identity.existingPrivyDid) {
    const existing = await admin.getUser(identity.existingPrivyDid);
    if (!existing) {
      throw new Error("Stored Privy user not found");
    }
    const wallet = await walletOnUser(admin, existing);
    return { ...wallet, created: false };
  }

  if (isTwitterNumericId(identity.xId)) {
    const byTwitter = await admin.getUserByTwitterSubject(identity.xId);
    if (byTwitter) {
      const wallet = await walletOnUser(admin, byTwitter);
      return { ...wallet, created: false };
    }
  }

  const wallets = [{ chain_type: "solana" as const }];
  const tryTwitter =
    isTwitterNumericId(identity.xId) && twitterImportAllowed(username);

  let created: PrivyUserSnapshot | null = null;
  if (tryTwitter) {
    try {
      created = await admin.createUser({
        linked_accounts: [
          {
            type: "twitter_oauth",
            subject: identity.xId,
            name: username,
            username,
          },
        ],
        wallets,
      });
    } catch {
      const existing = await admin.getUserByTwitterSubject(identity.xId);
      if (existing) {
        const wallet = await walletOnUser(admin, existing);
        return { ...wallet, created: false };
      }
    }
  }

  if (!created) {
    created = await admin.createUser({
      linked_accounts: [
        {
          type: "custom_auth",
          custom_user_id: `x:${identity.xId}`,
        },
      ],
      wallets,
    });
  }
  const wallet = await walletOnUser(admin, created);
  return { ...wallet, created: true };
}

function basicAuthHeader(appId: string, appSecret: string): string {
  return `Basic ${Buffer.from(`${appId}:${appSecret}`).toString("base64")}`;
}

function readErrorBody(status: number, text: string): Error {
  const clipped = text.replace(/\s+/g, " ").slice(0, 180);
  return new Error(`Privy HTTP ${status}${clipped ? `: ${clipped}` : ""}`);
}

function parseUser(json: unknown): PrivyUserSnapshot | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : null;
  if (!id) return null;
  return json as PrivyUserSnapshot;
}

/** Live Privy REST admin. Never log appSecret. */
export function createPrivyAdmin(opts: {
  appId: string;
  appSecret: string;
  fetchImpl?: typeof fetch;
}): PrivyAdmin {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const { appId, appSecret } = opts;
  const base = "https://auth.privy.io/api/v1";

  async function req(path: string, init: RequestInit): Promise<unknown> {
    const response = await fetchImpl(`${base}${path}`, {
      ...init,
      headers: {
        Authorization: basicAuthHeader(appId, appSecret),
        "privy-app-id": appId,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
    const text = await response.text();
    let json: unknown = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }
    if (!response.ok) {
      throw readErrorBody(response.status, text);
    }
    return json;
  }

  const admin: PrivyAdmin = {
    async createUser(input) {
      const json = await req("/users", {
        method: "POST",
        body: JSON.stringify(input),
      });
      const user = parseUser(json);
      if (!user) throw new Error("Privy create user returned no id");
      return user;
    },
    async getUser(did) {
      try {
        const json = await req(`/users/${encodeURIComponent(did)}`, {
          method: "GET",
        });
        return parseUser(json);
      } catch {
        return null;
      }
    },
    async getUserByTwitterSubject(subject) {
      try {
        const json = await req("/users/twitter/subject", {
          method: "POST",
          body: JSON.stringify({ subject }),
        });
        return parseUser(json);
      } catch {
        return null;
      }
    },
    async pregenerateSolanaWallet(did) {
      const json = await req(`/users/${encodeURIComponent(did)}/wallets`, {
        method: "POST",
        body: JSON.stringify({
          wallets: [{ chain_type: "solana" }],
        }),
      });
      const user = parseUser(json);
      if (user) return user;
      const refreshed = await admin.getUser(did);
      if (!refreshed) throw new Error("Privy pregenerate wallet failed");
      return refreshed;
    },
  };
  return admin;
}
