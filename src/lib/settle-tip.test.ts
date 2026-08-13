import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { settlePendingTip, type SettleTipInput } from "./settle-tip";
import {
  ensureRecipientPrivyWallet,
  type PrivyAdmin,
  type PrivyUserSnapshot,
} from "./provision-recipient";

const REAL_SIG =
  "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d6rT3abcDEF1234567890xyzABCDEFGHJK";

const PRIVY_SOL = "PrivySol111111111111111111111111111111111";
const TYPED_IN = "TypedIn999999999999999999999999999999999";

function tip(overrides: Partial<SettleTipInput> = {}): SettleTipInput {
  return {
    id: "tip_1",
    amount: 1.25,
    toXId: "123456789",
    toXUsername: "randomuser",
    fromDeposited: 10,
    toUser: {
      id: "recip_1",
      xId: "123456789",
      username: "randomuser",
      privyDid: null,
      walletAddress: null,
    },
    ...overrides,
  };
}

describe("settlePendingTip — on-chain to Privy wallet", () => {
  it("first tip to unknown @user creates Privy wallet, transfers there, withdrawable 0", async () => {
    let createCalls = 0;
    let transferTo: string | null = null;
    const result = await settlePendingTip(tip(), {
      async provision(identity) {
        createCalls++;
        assert.equal(identity.xId, "123456789");
        assert.equal(identity.existingPrivyDid, null);
        return {
          privyDid: "did:privy:new",
          walletAddress: PRIVY_SOL,
          created: true,
        };
      },
      async transfer(toAddress, amount) {
        transferTo = toAddress;
        assert.equal(amount, 1.25);
        return { signature: REAL_SIG, demo: false };
      },
    });

    assert.equal(createCalls, 1);
    assert.equal(transferTo, PRIVY_SOL);
    assert.equal(result.onChain, true);
    assert.equal(result.withdrawableInc, 0);
    assert.equal(result.depositedDec, 1.25);
    assert.equal(result.txSig, REAL_SIG);
    assert.equal(result.privyDid, "did:privy:new");
    assert.equal(result.privyCreated, true);
  });

  it("second tip to same @user does not create a second Privy user and reuses wallet", async () => {
    let createCalls = 0;
    const transfers: string[] = [];
    const provision = async (
      identity: {
        existingPrivyDid: string | null;
        existingWalletAddress: string | null;
        xId: string;
        username: string;
      }
    ) => {
      if (identity.existingPrivyDid && identity.existingWalletAddress) {
        return {
          privyDid: identity.existingPrivyDid,
          walletAddress: identity.existingWalletAddress,
          created: false,
        };
      }
      createCalls++;
      return {
        privyDid: "did:privy:new",
        walletAddress: PRIVY_SOL,
        created: true,
      };
    };
    const transfer = async (toAddress: string) => {
      transfers.push(toAddress);
      return { signature: REAL_SIG, demo: false };
    };

    const first = await settlePendingTip(tip(), { provision, transfer });
    const second = await settlePendingTip(
      tip({
        id: "tip_2",
        toUser: {
          id: "recip_1",
          xId: "123456789",
          username: "randomuser",
          privyDid: first.privyDid,
          walletAddress: first.walletAddress,
        },
      }),
      { provision, transfer }
    );

    assert.equal(createCalls, 1);
    assert.equal(first.privyCreated, true);
    assert.equal(second.privyCreated, false);
    assert.deepEqual(transfers, [PRIVY_SOL, PRIVY_SOL]);
    assert.equal(second.transferTo, PRIVY_SOL);
    assert.equal(second.withdrawableInc, 0);
    assert.equal(second.onChain, true);
  });

  it("Privy create failure skips SPL and credits withdrawable", async () => {
    let transferred = false;
    const result = await settlePendingTip(tip(), {
      async provision() {
        throw new Error("twitter_oauth import rejected");
      },
      async transfer() {
        transferred = true;
        return { signature: REAL_SIG, demo: false };
      },
    });

    assert.equal(transferred, false);
    assert.equal(result.onChain, false);
    assert.equal(result.withdrawableInc, 1.25);
    assert.equal(result.depositedDec, 1.25);
    assert.equal(result.txSig, "ledger_tip_1");
    assert.match(result.txSig ?? "", /^ledger_/);
  });

  it("does not send SPL to a self-reported wallet — only the Privy address", async () => {
    let transferTo: string | null = null;
    const result = await settlePendingTip(
      tip({
        toUser: {
          id: "recip_1",
          xId: "123456789",
          username: "randomuser",
          privyDid: null,
          walletAddress: TYPED_IN,
        },
      }),
      {
        async provision(identity) {
          assert.equal(identity.existingWalletAddress, TYPED_IN);
          assert.equal(identity.existingPrivyDid, null);
          return {
            privyDid: "did:privy:new",
            walletAddress: PRIVY_SOL,
            created: true,
          };
        },
        async transfer(toAddress) {
          transferTo = toAddress;
          return { signature: REAL_SIG, demo: false };
        },
      }
    );
    assert.equal(transferTo, PRIVY_SOL);
    assert.notEqual(transferTo, TYPED_IN);
    assert.equal(result.transferTo, PRIVY_SOL);
    assert.equal(result.withdrawableInc, 0);
  });

  it("demo/fake signatures never count as on-chain; withdrawable is credited", async () => {
    const result = await settlePendingTip(tip(), {
      async provision() {
        return {
          privyDid: "did:privy:new",
          walletAddress: PRIVY_SOL,
          created: true,
        };
      },
      async transfer() {
        return { signature: "demo_tip_fake", demo: true };
      },
    });
    assert.equal(result.onChain, false);
    assert.equal(result.withdrawableInc, 1.25);
    assert.equal(result.txSig, "ledger_tip_1");
  });
});

describe("ensureRecipientPrivyWallet", () => {
  function memoryAdmin() {
    const users = new Map<string, PrivyUserSnapshot>();
    let createUserCalls = 0;
    const admin: PrivyAdmin = {
      async createUser(input) {
        createUserCalls++;
        const tw = input.linked_accounts.find((a) => a.type === "twitter_oauth");
        const id = `did:privy:${createUserCalls}`;
        const user: PrivyUserSnapshot = {
          id,
          linked_accounts: [
            ...(tw
              ? [{ type: "twitter_oauth", subject: tw.subject }]
              : [{ type: "custom_auth", custom_user_id: input.linked_accounts[0]?.custom_user_id }]),
            {
              type: "wallet",
              chain_type: "solana",
              address: `PrivySol${String(createUserCalls).padStart(39, "1")}`,
            },
          ],
        };
        users.set(id, user);
        return user;
      },
      async getUser(did) {
        return users.get(did) ?? null;
      },
      async getUserByTwitterSubject(subject) {
        for (const u of users.values()) {
          const accounts = u.linked_accounts ?? [];
          if (
            accounts.some(
              (a) => a.type === "twitter_oauth" && (a as { subject?: string }).subject === subject
            )
          ) {
            return u;
          }
        }
        return null;
      },
      async pregenerateSolanaWallet(did) {
        const u = users.get(did);
        if (!u) throw new Error("missing user");
        return u;
      },
    };
    return { admin, created: () => createUserCalls };
  }

  it("reuses an existing Privy user instead of creating a second one", async () => {
    const { admin, created } = memoryAdmin();
    const first = await ensureRecipientPrivyWallet(
      {
        xId: "123456789",
        username: "randomuser",
        existingPrivyDid: null,
        existingWalletAddress: null,
      },
      admin
    );
    const second = await ensureRecipientPrivyWallet(
      {
        xId: "123456789",
        username: "randomuser",
        existingPrivyDid: first.privyDid,
        existingWalletAddress: first.walletAddress,
      },
      admin
    );
    assert.equal(created(), 1);
    assert.equal(second.created, false);
    assert.equal(second.walletAddress, first.walletAddress);
  });

  it("ignores a self-reported wallet and still creates a Privy address", async () => {
    const { admin, created } = memoryAdmin();
    const got = await ensureRecipientPrivyWallet(
      {
        xId: "123456789",
        username: "randomuser",
        existingPrivyDid: null,
        existingWalletAddress: TYPED_IN,
      },
      admin
    );
    assert.equal(created(), 1);
    assert.equal(got.created, true);
    assert.notEqual(got.walletAddress, TYPED_IN);
  });

  it("falls back to custom_auth when twitter_oauth import is rejected", async () => {
    let twitterAttempts = 0;
    let customAttempts = 0;
    const users = new Map<string, PrivyUserSnapshot>();
    const admin: PrivyAdmin = {
      async createUser(input) {
        const tw = input.linked_accounts.find((a) => a.type === "twitter_oauth");
        if (tw) {
          twitterAttempts++;
          throw new Error("twitter_oauth import rejected");
        }
        customAttempts++;
        const id = "did:privy:custom";
        const user: PrivyUserSnapshot = {
          id,
          linked_accounts: [
            { type: "custom_auth", custom_user_id: `x:123456789` },
            {
              type: "wallet",
              chain_type: "solana",
              address: PRIVY_SOL,
            },
          ],
        };
        users.set(id, user);
        return user;
      },
      async getUser(did) {
        return users.get(did) ?? null;
      },
      async getUserByTwitterSubject() {
        return null;
      },
      async pregenerateSolanaWallet(did) {
        const u = users.get(did);
        if (!u) throw new Error("missing user");
        return u;
      },
    };
    const got = await ensureRecipientPrivyWallet(
      {
        xId: "123456789",
        username: "randomuser",
        existingPrivyDid: null,
        existingWalletAddress: null,
      },
      admin
    );
    assert.equal(twitterAttempts, 1);
    assert.equal(customAttempts, 1);
    assert.equal(got.created, true);
    assert.equal(got.walletAddress, PRIVY_SOL);
  });
});
