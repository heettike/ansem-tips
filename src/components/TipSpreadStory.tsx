/**
 * one idea object: tip → herd → mission compounds.
 * visualize value network — not a tip-actions feature list.
 */

function herdNodes() {
  const nodes: { cx: number; cy: number; r: number; delay: string }[] = [];
  const rings = [
    { count: 8, radius: 150, size: 7, baseDelay: 0.15 },
    { count: 16, radius: 240, size: 5.5, baseDelay: 0.45 },
    { count: 28, radius: 330, size: 4, baseDelay: 0.85 },
    { count: 42, radius: 410, size: 3, baseDelay: 1.3 },
  ];

  for (const ring of rings) {
    for (let i = 0; i < ring.count; i++) {
      const angle = (Math.PI * 2 * i) / ring.count - Math.PI / 2;
      const jitter = ((i % 5) - 2) * 2.2;
      nodes.push({
        cx: 500 + Math.cos(angle) * (ring.radius + jitter),
        cy: 400 + Math.sin(angle) * (ring.radius * 0.72 + jitter * 0.4),
        r: ring.size,
        delay: `${ring.baseDelay + i * 0.03}s`,
      });
    }
  }
  return nodes;
}

const NODES = herdNodes();

export function TipSpreadStory() {
  return (
    <section className="px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <h2 className="display text-[clamp(2.5rem,9vw,5.5rem)]">
          tip → herd →
          <br />
          <span className="mark">mission compounds</span>
        </h2>

        <div className="mt-14 sm:mt-20">
          <svg
            viewBox="0 0 1000 860"
            className="mx-auto h-auto w-full max-w-5xl"
            role="img"
            aria-label="one tipper sending $ansem into a growing network of wallets"
          >
            {[150, 240, 330, 410].map((radius, i) => (
              <ellipse
                key={radius}
                className="vv-ring"
                cx="500"
                cy="400"
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
                x1="500"
                y1="400"
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

            <g className="vv-node" style={{ animationDelay: "0s" }}>
              <circle
                cx="500"
                cy="400"
                r="70"
                fill="#000"
                stroke="#ffffff"
                strokeWidth="3"
              />
              <text
                x="500"
                y="390"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="20"
                fontFamily="Helvetica, Arial, sans-serif"
                fontWeight="700"
              >
                tipper
              </text>
              <text
                x="500"
                y="418"
                textAnchor="middle"
                fill="#b6ff3b"
                fontSize="18"
                fontFamily="Helvetica, Arial, sans-serif"
                fontWeight="700"
              >
                $ansem
              </text>
            </g>

            <text
              x="500"
              y="820"
              textAnchor="middle"
              fill="#6b6b6b"
              fontSize="16"
              fontFamily="Helvetica, Arial, sans-serif"
            >
              hundreds of wallets. reach keeps increasing.
            </text>
          </svg>
        </div>

        <p className="mt-8 max-w-lg text-lg text-muted sm:text-xl">
          one tipper sends $ansem outward. the herd pushes the black bull
          further. network effects compound.
        </p>
      </div>
    </section>
  );
}
