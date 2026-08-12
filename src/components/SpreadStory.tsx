import { TipFlowAnim } from "@/components/TipFlowAnim";

const TAPE = [
  "like → tip",
  "reply → tip",
  "follow → tip",
  "QT → tip",
  "🐂 → super tip",
  "herd moves",
  "$ansem spreads",
  "black bull",
];

const STEPS = [
  {
    num: "01",
    title: "Why tip",
    body: "You engage someone. They get paid in $ansem. Simple thank-you energy.",
  },
  {
    num: "02",
    title: "How it spreads",
    body: "Every like, reply, follow, or QT can send $ansem to a new wallet.",
  },
  {
    num: "03",
    title: "Herd mode",
    body: "Drop 🐂 for a super tip. The herd moves. More wallets hold $ansem.",
  },
];

export function SpreadStory() {
  const loop = [...TAPE, ...TAPE];

  return (
    <section className="space-y-5" aria-label="How tips spread">
      <div className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.num} className="card-terminal p-4">
            <p className="label-mono text-accent">{s.num}</p>
            <h3 className="mt-1 font-mono text-sm font-bold uppercase tracking-[0.08em]">
              {s.title}
            </h3>
            <p className="mt-2 text-sm text-muted">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="herd-track" aria-hidden="true">
        <div className="herd-track-inner">
          {loop.map((item, i) => (
            <span key={`${item}-${i}`} className="herd-track-item">
              {item}
              <span aria-hidden="true"> · </span>
            </span>
          ))}
          {loop.map((item, i) => (
            <span key={`dup-${item}-${i}`} className="herd-track-item">
              {item}
              <span aria-hidden="true"> · </span>
            </span>
          ))}
        </div>
      </div>

      <TipFlowAnim />

      <p className="label-mono text-center text-muted">
        tip → wallets · $ansem spreads · 🐂 for more
      </p>
    </section>
  );
}
