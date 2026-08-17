/**
 * one idea object: tip → herd → mission compounds.
 * visualize value network — not a tip-actions feature list.
 */
import Image from "next/image";
import type { CSSProperties } from "react";

const VIEW = { w: 1000, h: 860 } as const;
const HUB = { x: 500, y: 400, r: 105 } as const;

function herdNodes() {
  const nodes: { cx: number; cy: number; r: number; delay: string }[] = [];
  const rings = [
    { count: 8, radius: 200, size: 7, baseDelay: 0.15 },
    { count: 16, radius: 285, size: 5.5, baseDelay: 0.45 },
    { count: 28, radius: 365, size: 4, baseDelay: 0.85 },
    { count: 42, radius: 440, size: 3, baseDelay: 1.3 },
  ];

  for (const ring of rings) {
    for (let i = 0; i < ring.count; i++) {
      const angle = (Math.PI * 2 * i) / ring.count - Math.PI / 2;
      const jitter = ((i % 5) - 2) * 2.2;
      nodes.push({
        cx: HUB.x + Math.cos(angle) * (ring.radius + jitter),
        cy: HUB.y + Math.sin(angle) * (ring.radius * 0.72 + jitter * 0.4),
        r: ring.size,
        delay: `${ring.baseDelay + i * 0.03}s`,
      });
    }
  }
  return nodes;
}

const NODES = herdNodes();
const RINGS = [200, 285, 365, 440];

const CHIPS: {
  amount: string;
  node: number;
  tone: "gold" | "acid";
  delay: string;
  duration: string;
}[] = [
  { amount: "$12", node: 0, tone: "gold", delay: "0s", duration: "6.2s" },
  { amount: "$19", node: 2, tone: "acid", delay: "3.6s", duration: "5.5s" },
  { amount: "$28", node: 4, tone: "gold", delay: "0.9s", duration: "5.8s" },
  { amount: "$47", node: 6, tone: "acid", delay: "1.8s", duration: "6.6s" },
  { amount: "$64", node: 9, tone: "gold", delay: "2.7s", duration: "7s" },
  { amount: "$73", node: 14, tone: "acid", delay: "4.4s", duration: "5.4s" },
  { amount: "$81", node: 19, tone: "gold", delay: "3.2s", duration: "6.8s" },
  { amount: "$100", node: 24, tone: "acid", delay: "1.3s", duration: "6.1s" },
];

const TONE = {
  gold: "#f5b942",
  acid: "#b6ff3b",
} as const;

export function TipSpreadStory() {
  return (
    <section className="px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <h2 className="display text-[clamp(2.5rem,9vw,5.5rem)]">
          tip → herd →
          <br />
          <span className="mark">mission compounds</span>
        </h2>

        <div className="relative mt-14 sm:mt-20">
          <svg
            viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
            className="mx-auto h-auto w-full max-w-5xl"
            role="img"
            aria-label="ansem sending $ansem from one tipper into a growing network of wallets"
          >
            {RINGS.map((radius, i) => (
              <ellipse
                key={radius}
                className="vv-ring"
                cx={HUB.x}
                cy={HUB.y}
                rx={radius}
                ry={radius * 0.72}
                fill="none"
                stroke="#222"
                strokeWidth="1"
                style={{ animationDelay: `${0.15 + i * 0.2}s` }}
              />
            ))}

            {NODES.filter((_, i) => i < 8).map((n, i) => (
              <line
                key={`spoke-${i}`}
                className="vv-line"
                x1={HUB.x}
                y1={HUB.y}
                x2={n.cx}
                y2={n.cy}
                stroke="#ffffff"
                strokeWidth="1.25"
                strokeOpacity="0.5"
                style={{ animationDelay: `${0.1 + i * 0.04}s` }}
              />
            ))}

            {NODES.slice(8, 24).map((n, i) => {
              const parent = NODES[i % 8];
              return (
                <line
                  key={`link-${i}`}
                  className="vv-line"
                  x1={parent.cx}
                  y1={parent.cy}
                  x2={n.cx}
                  y2={n.cy}
                  stroke="#ffffff"
                  strokeWidth="0.75"
                  strokeOpacity="0.25"
                  style={{ animationDelay: `${0.45 + i * 0.03}s` }}
                />
              );
            })}

            {NODES.map((n, i) => (
              <circle
                key={`node-${i}`}
                className="vv-node"
                cx={n.cx}
                cy={n.cy}
                r={n.r}
                fill={
                  i % 11 === 0 ? "#f5b942" : i % 7 === 0 ? "#b6ff3b" : "#ffffff"
                }
                fillOpacity={i % 11 === 0 || i % 7 === 0 ? 0.95 : 0.7}
                style={{ animationDelay: n.delay }}
              />
            ))}

            <text
              x={HUB.x}
              y={HUB.y + HUB.r + 22}
              textAnchor="middle"
              fill="#6b6b6b"
              fontSize="12"
              fontFamily="Helvetica, Arial, sans-serif"
            >
              @blknoiz06
            </text>

            <text
              x={HUB.x}
              y="820"
              textAnchor="middle"
              fill="#6b6b6b"
              fontSize="16"
              fontFamily="Helvetica, Arial, sans-serif"
            >
              hundreds of wallets. reach keeps increasing.
            </text>
          </svg>

          <div
            className="pointer-events-none absolute left-1/2 top-0 h-full w-full max-w-5xl -translate-x-1/2"
            aria-hidden="true"
          >
            {CHIPS.map((chip) => {
              const n = NODES[chip.node];
              const color = TONE[chip.tone];
              const style = {
                "--end-x": `${(n.cx / VIEW.w) * 100}%`,
                "--end-y": `${(n.cy / VIEW.h) * 100}%`,
                animationDelay: chip.delay,
                animationDuration: chip.duration,
                color,
                borderColor: color,
              } as CSSProperties;
              return (
                <span key={chip.amount} className="vv-chip" style={style}>
                  {chip.amount}
                </span>
              );
            })}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: "50%",
                top: `${(HUB.y / VIEW.h) * 100}%`,
                width: `${((HUB.r * 2) / VIEW.w) * 100}%`,
                zIndex: 2,
              }}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-full border-[3px] border-white">
                <Image
                  src="/brand/ansem-pfp.jpg"
                  alt="ansem"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 21vw, 220px"
                />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 max-w-lg text-lg text-muted sm:text-xl">
          one tipper sends $ansem outward. the herd pushes the black bull
          further. network effects compound.
        </p>
      </div>
    </section>
  );
}
