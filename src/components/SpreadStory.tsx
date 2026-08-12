import { TipFlowAnim } from "@/components/TipFlowAnim";

const TAPE = [
  "LIKE → $ANSEM",
  "REPLY → $ANSEM",
  "FOLLOW → $ANSEM",
  "QT → $ANSEM",
  "🐂 → SUPER TIP",
  "HERD MOVES",
  "BLACK BULL",
];

export function SpreadStory() {
  const loop = [...TAPE, ...TAPE, ...TAPE, ...TAPE];

  return (
    <div className="space-y-4">
      <div className="herd-tape" aria-hidden="true">
        <div className="herd-tape-track">
          {loop.map((item, i) => (
            <div key={`${item}-${i}`} className="herd-tape-item">
              {item}
              <span>·</span>
            </div>
          ))}
          {/* duplicate for seamless -50% scroll */}
          {loop.map((item, i) => (
            <div key={`dup-${item}-${i}`} className="herd-tape-item">
              {item}
              <span>·</span>
            </div>
          ))}
        </div>
      </div>

      <TipFlowAnim />

      <p className="label-mono text-center text-muted">
        Engage someone. They get paid. Drop 🐂 — they get more.
      </p>
    </div>
  );
}
