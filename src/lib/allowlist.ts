import { config, isAllowlistedTipper } from "@/lib/config";

/**
 * Tipper allowlist — v0 single tipper (@heettike).
 * Structure supports up to 100 community tippers later:
 * set TIPPER_ALLOWLIST=user1,user2,... in env.
 */
export function getTipperAllowlist(): string[] {
  return [...config.tipperAllowlist];
}

export function assertAllowlistedTipper(username: string): void {
  if (!isAllowlistedTipper(username)) {
    throw new Error(
      `User @${username.replace(/^@/, "")} is not an allowlisted tipper. ` +
        `Trial tipper: @${config.trialTipper}. Future prod: @${config.prodTipperFuture}.`
    );
  }
}

export { isAllowlistedTipper };
