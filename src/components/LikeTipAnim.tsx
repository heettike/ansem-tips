"use client";

import { useSyncExternalStore } from "react";

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function reducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * poster-diagram: tweet → like → $ansem leaves @you for @them.
 * svg loop, not a video. white field, ink lines, one orange chip.
 */
export function LikeTipAnim() {
  const reduce = useSyncExternalStore(
    subscribeReducedMotion,
    reducedMotionSnapshot,
    () => false
  );

  return (
    <figure className="like-tip mt-10 rounded-3xl border border-black/[0.08] bg-white px-4 py-8 sm:px-8">
      <svg
        viewBox="0 0 720 360"
        className="mx-auto h-auto w-full max-w-2xl"
        role="img"
        aria-label="a tweet about $ansem. you like it. $ansem leaves @you for @them."
      >
        <rect
          className="like-tip-frame"
          x="160"
          y="24"
          width="400"
          height="148"
          rx="20"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="1.5"
        />
        <text
          className="like-tip-frame"
          x="184"
          y="64"
          fill="rgba(0,0,0,0.4)"
          fontSize="16"
          fontFamily="Helvetica, Arial, sans-serif"
        >
          @them
        </text>
        <text
          className="like-tip-frame"
          x="184"
          y="104"
          fill="#ff4d00"
          fontSize="28"
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight="700"
        >
          $ansem
        </text>
        <circle
          className="like-tip-like-dot"
          cx="192"
          cy="140"
          r="7"
          fill={reduce ? "#ff4d00" : "#ffffff"}
          stroke={reduce ? "#ff4d00" : "#999999"}
          strokeWidth="1.5"
        />
        <text
          className="like-tip-like-word"
          x="210"
          y="145"
          fill={reduce ? "#ff4d00" : "#999999"}
          fontSize="16"
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight="700"
        >
          like
        </text>

        <g className="like-tip-nodes">
          <circle
            cx="120"
            cy="280"
            r="34"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="2"
          />
          <text
            x="120"
            y="286"
            textAnchor="middle"
            fill="#000000"
            fontSize="14"
            fontFamily="Helvetica, Arial, sans-serif"
            fontWeight="700"
          >
            @you
          </text>
          <circle
            cx="600"
            cy="280"
            r="34"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="2"
          />
          <text
            x="600"
            y="286"
            textAnchor="middle"
            fill="#000000"
            fontSize="14"
            fontFamily="Helvetica, Arial, sans-serif"
            fontWeight="700"
          >
            @them
          </text>
        </g>

        <line
          className="like-tip-path"
          x1="154"
          y1="280"
          x2="566"
          y2="280"
          stroke="#000000"
          strokeWidth="1.25"
          strokeOpacity="0.35"
        />

        <g
          className="like-tip-chip"
          transform={reduce ? "translate(320, 0)" : undefined}
        >
          {!reduce && (
            <>
              <animate
                attributeName="opacity"
                values="1; 1; 1; 0"
                keyTimes="0; 0.78; 0.88; 1"
                dur="5s"
                repeatCount="indefinite"
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; 0,0; 320,0; 320,0; 320,0"
                keyTimes="0; 0.28; 0.62; 0.78; 1"
                dur="5s"
                repeatCount="indefinite"
                calcMode="linear"
              />
            </>
          )}
          <rect
            x="168"
            y="264"
            width="88"
            height="32"
            rx="16"
            fill="#ffffff"
            stroke="#ff4d00"
            strokeWidth="1.5"
          />
          <text
            x="212"
            y="285"
            textAnchor="middle"
            fill="#ff4d00"
            fontSize="14"
            fontFamily="Helvetica, Arial, sans-serif"
            fontWeight="700"
          >
            $ansem
          </text>
        </g>
      </svg>
      <figcaption className="caption mt-6">
        like → $ansem leaves @you for @them
      </figcaption>
    </figure>
  );
}
