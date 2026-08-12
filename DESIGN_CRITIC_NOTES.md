# Design critic notes — ansem.tips portfolio bar

## What shipped (v1 → live)

- **CT-native look**: acid green `#b6ff3b` + black `#050505` + gold `#f5b942`, square edges (`--radius: 0px`), mono labels, stadium-banner H1 (mono/uppercase/scoreboard), CRT scanlines / grid-noise.
- **Landing**: brand-first stadium hero, subtle `/brand/1_photo.jpg` atmosphere (not meme dump).
- **Hero copy (exact)**: “Like someone. They get $ansem. Reply, follow, QT — same deal. Drop a bull emoji and they get more.”
- **SpreadStory + TipFlowAnim**: SVG/CSS tipper → LIKE / REPLY / FOLLOW / QT / 🐂 SUPER square nodes + tip-particle drift. Herd tape: `like → tip · reply → tip · 🐂 → super tip · herd growing`. No WebGL/canvas.
- **Nav**: Home / Tipper / Dash / Cash out — mono uppercase, solid dark strip, green hairline, square `/brand/ansem.png` mark, mobile menu.
- **Onboard**: 3 step-rail cards — Sign in with X → Deposit (dashed address box + “Empty for now”) → Tip amounts.
- **Dashboard**: no Run poll / cron docs; “Zero tip fuel” when deposited=0.
- **Withdraw**: empty state “Nothing to withdraw yet — tips show up after a tipper likes, replies, follows, or QTs you.” Button disabled at 0.
- **Product intact**: `Providers` empty; Privy only on LoginButton dynamic import path; real balances only.

## v2 polish

1. Stronger CRT scanline/vignette + larger stadium H1; mobile nav 44px tap rows + green hairline drawer.
2. Tip-flow readability: larger square nodes/fonts (12px labels), tighter viewBox, taller min-height under ~400px.

## Known gaps

- Tip-flow is illustrative (not wired to live tip events).
- Atmosphere + CRT can still feel dense on tiny phones — further opacity tuning possible.
- Deposit address needs a one-tap copy control once wallet exists.
- Allowlist tippers only (`heettike` + `blknoiz06`).
- No visual regression tests for hero/tip-flow composition.
