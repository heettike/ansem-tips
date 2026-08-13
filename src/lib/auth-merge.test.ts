import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mergeLoginIdentity } from "./auth-merge";

describe("mergeLoginIdentity", () => {
  it("keeps pre-created privyDid and wallet when they log in with X", () => {
    const merged = mergeLoginIdentity(
      {
        privyDid: "did:privy:precreated",
        walletAddress: "PrivySol111111111111111111111111111111111",
      },
      {
        privyDid: "did:privy:login-session",
        walletAddress: "TypedIn999999999999999999999999999999999",
      }
    );
    assert.equal(merged.privyDid, "did:privy:precreated");
    assert.equal(
      merged.walletAddress,
      "PrivySol111111111111111111111111111111111"
    );
  });

  it("fills empty privyDid from login without inventing a wallet", () => {
    const merged = mergeLoginIdentity(
      { privyDid: null, walletAddress: null },
      { privyDid: "did:privy:fresh", walletAddress: "SolFresh1111111111111111111111111111111" }
    );
    assert.equal(merged.privyDid, "did:privy:fresh");
    assert.equal(merged.walletAddress, "SolFresh1111111111111111111111111111111");
  });
});
