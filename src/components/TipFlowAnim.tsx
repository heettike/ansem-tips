const TARGETS: {
  id: string;
  label: string;
  x: number;
  y: number;
  delay: string;
  gold?: boolean;
}[] = [
  { id: "like", label: "LIKE", x: 320, y: 28, delay: "0s" },
  { id: "reply", label: "REPLY", x: 320, y: 78, delay: "0.35s" },
  { id: "follow", label: "FOLLOW", x: 320, y: 128, delay: "0.7s" },
  { id: "qt", label: "QT", x: 320, y: 178, delay: "1.05s" },
  { id: "bull", label: "🐂 SUPER", x: 320, y: 228, delay: "1.4s", gold: true },
];

/** CSS/SVG tip flow: tipper → engagement wallets. No WebGL/canvas. */
export function TipFlowAnim() {
  return (
    <div className="tip-flow" aria-hidden="true">
      <svg
        className="tip-flow-svg"
        viewBox="0 0 420 270"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
      >
        <title>Tip flow: one tipper spreads $ansem to many wallets</title>

        {/* faint grid */}
        <defs>
          <pattern id="tip-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" stroke="rgba(182,255,59,0.06)" strokeWidth="1" />
          </pattern>
          {TARGETS.map((t) => (
            <path
              key={`path-${t.id}`}
              id={`tip-path-${t.id}`}
              d={`M 108 135 C 180 ${135 + (t.y - 128) * 0.35}, 240 ${t.y}, ${t.x - 8} ${t.y + 12}`}
            />
          ))}
        </defs>
        <rect width="420" height="270" fill="url(#tip-grid)" />

        {/* Tipper node */}
        <rect x="28" y="108" width="80" height="54" fill="#0a0a0a" stroke="#b6ff3b" strokeWidth="1.5" />
        <text
          x="68"
          y="128"
          textAnchor="middle"
          fill="#9ca3af"
          fontFamily="ui-monospace, monospace"
          fontSize="8"
          letterSpacing="1.5"
        >
          TIPPER
        </text>
        <text
          x="68"
          y="146"
          textAnchor="middle"
          fill="#b6ff3b"
          fontFamily="ui-monospace, monospace"
          fontSize="11"
          fontWeight="700"
        >
          YOU
        </text>

        {/* Paths + target nodes */}
        {TARGETS.map((t) => (
          <g key={t.id}>
            <path
              className="flow-path"
              d={`M 108 135 C 180 ${135 + (t.y - 128) * 0.35}, 240 ${t.y}, ${t.x - 8} ${t.y + 12}`}
              stroke={t.gold ? "rgba(245,185,66,0.55)" : "rgba(182,255,59,0.35)"}
              strokeWidth="1.25"
              fill="none"
              style={{ animationDelay: t.delay }}
            />
            <rect
              x={t.x}
              y={t.y}
              width={88}
              height={26}
              fill="#0a0a0a"
              stroke={t.gold ? "#f5b942" : "#b6ff3b"}
              strokeWidth="1.25"
            />
            <text
              x={t.x + 44}
              y={t.y + 17}
              textAnchor="middle"
              fill={t.gold ? "#f5b942" : "#b6ff3b"}
              fontFamily="ui-monospace, monospace"
              fontSize="9"
              fontWeight="700"
              letterSpacing="1"
            >
              {t.label}
            </text>
            {/* particle as SVG circle along path */}
            <circle r="3.5" fill={t.gold ? "#f5b942" : "#b6ff3b"}>
              <animateMotion
                dur="2.8s"
                repeatCount="indefinite"
                begin={t.delay}
                path={`M 108 135 C 180 ${135 + (t.y - 128) * 0.35}, 240 ${t.y}, ${t.x - 8} ${t.y + 12}`}
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.1;0.85;1"
                dur="2.8s"
                repeatCount="indefinite"
                begin={t.delay}
              />
            </circle>
          </g>
        ))}

        <text
          x="210"
          y="262"
          textAnchor="middle"
          fill="#9ca3af"
          fontFamily="ui-monospace, monospace"
          fontSize="8"
          letterSpacing="2"
        >
          ONE TIPPER → MANY WALLETS
        </text>
      </svg>
    </div>
  );
}
