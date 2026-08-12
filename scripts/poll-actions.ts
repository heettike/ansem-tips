/**
 * Optional companion to /api/cron/poll -- run locally:
  *   npm run poll
 *
 * Requires DATABASE_URL. Live X when TWITTER_BEARER_TOKEN set; else mock fallback.
  */
import { config } from "../src/lib/config";
import { pollAndEnqueueTips, processPendingTips } from "../src/lib/tips";

async function main() {
  console.log("[poll-actions] demoMode=", config.demoMode);
  console.log("[poll-actions] tippers=", config.tipperAllowlist.join(", "));

  for (const tipper of config.tipperAllowlist) {
    const poll = await pollAndEnqueueTips(tipper);
    console.log(`[poll-actions] @${tipper}`, poll);
  }

  const processed = await processPendingTips();
  console.log("[poll-actions] processed", processed);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
