/**
 * Optional companion to /api/cron/poll -- run locally:
 *   npm run poll
 *
 * Requires DATABASE_URL. Uses per-tipper stored X OAuth tokens when present;
 * falls back to TWITTER_BEARER_TOKEN; else mock.
 */
import { config } from "../src/lib/config";
import { watchTipperDeposits } from "../src/lib/deposits";
import { clawbackRetroTips, pollAndEnqueueTips, processPendingTips } from "../src/lib/tips";

async function main() {
  console.log("[poll-actions] demoMode=", config.demoMode);
  console.log("[poll-actions] tippers=", config.tipperAllowlist.join(", "));

  const clawback = await clawbackRetroTips();
  console.log("[poll-actions] clawback", {
    reversed: clawback.reversed,
    reversedAmount: clawback.reversedAmount,
    voidedPending: clawback.voidedPending,
    reportedOnchain: clawback.reportedOnchain.length,
  });

  const deposits = await watchTipperDeposits();
  console.log("[poll-actions] deposits", {
    checked: deposits.checked,
    creditedTotal: deposits.creditedTotal,
  });

  for (const tipper of config.tipperAllowlist) {
    const poll = await pollAndEnqueueTips(tipper);
    console.log("[poll-actions] @" + tipper, {
      polled: poll.polled,
      enqueued: poll.enqueued,
      skipped: poll.skipped,
      authMode: poll.authMode,
      tokenRefreshed: poll.tokenRefreshed,
    });
  }

  const processed = await processPendingTips();
  console.log("[poll-actions] processed", processed.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
