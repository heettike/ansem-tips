/**
 * ansem.tips pinger — hits the poll route every minute so tips process
 * near-realtime. Secret lives in the POLL_SECRET worker secret.
 */
export default {
  async scheduled(_event: ScheduledEvent, env: { POLL_SECRET: string }, ctx: ExecutionContext) {
    ctx.waitUntil(
      fetch("https://ansem-tips.vercel.app/api/cron/poll", {
        headers: { Authorization: `Bearer ${env.POLL_SECRET}` },
        signal: AbortSignal.timeout(50_000),
      }).then(async (r) => {
        if (!r.ok) console.error("poll failed", r.status, (await r.text()).slice(0, 200));
      }).catch((e) => console.error("poll error", String(e).slice(0, 200)))
    );
  },
};
