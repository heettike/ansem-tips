import { TipFlowAnim } from "@/components/TipFlowAnim";

/** Exact herd tape tokens from brief */
const TAPE = [
  "like → tip",
  "reply → tip",
  "🐂 → super tip",
  "herd growing",
];

export function SpreadStory() {
  const loop = [...TAPE, ...TAPE, ...TAPE, ...TAPE];

  return (
    <section className="space-y-4" aria-label="How tips spread">
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
