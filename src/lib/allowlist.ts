import { config, isAllowlistedTipper } from "@/lib/config";

/**
 * Tipper allowlist — multi-tipper via TIPPER_ALLOWLIST (comma-separated, lowercase, no @).
 * Fallback in config is heettike,blknoiz06,srijancse when env is unset.
 */
export function getTipperAllowlist(): string[] {
  return [...config.tipperAllowlist];
}

export function assertAllowlistedTipper(username: string): void {
  if (!isAllowlistedTipper(username)) {
    throw new Error(
      `@${username.replace(/^@/, "")} isn’t on the tipper list yet. ` +
        `Ask to get added, or tip as @${config.trialTipper}.`
    );
  }
}

export { isAllowlistedTipper };
