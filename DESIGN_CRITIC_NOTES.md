# Design critic notes — ansem.tips portfolio bar

## What shipped (v1 → live)

- **CT-native look**: acid green `#b6ff3b` + black `#050505` + gold `#f5b942`, square edges (`--radius: 0`), mono labels, stadium-banner H1, CRT scanlines / grid-noise.
- **Landing**: brand-first stadium hero, subtle `/brand/1_photo.jpg` atmosphere (not meme dump), CT copy (“Like someone. They get $ansem…”), tipper + withdraw paths.
- **SpreadStory + TipFlowAnim**: SVG/CSS tipper → like / reply / follow / QT / 🐂 nodes + herd tape. No WebGL/canvas.
- **Nav / footer**: square bull mark, terminal strip, mono uppercase links, mobile menu.
- **Onboard / Dash / Withdraw**: plain-English steps and empty states; withdraw disabled at 0; no cron/API docs for tippers.
- **Product intact**: `Providers` empty; Privy mounts only on LoginButton click path; real balances only.

## v2 polish (this pass)

- Nav labels shortened: Home / Tipper / Dash / Cash out.
- `.site-nav` solid `#050505` — no `backdrop-filter` blur (perf + sharper CRT read).
- Tip-flow mobile readability (larger target rects/fonts) + stadium H1 blink cursor.

## Known gaps

- Tip-flow is still illustrative (not wired to live tip events).
- Atmosphere photo + CRT overlay can feel dense on very small phones; may need a lighter mobile opacity pass.
- Deposit address UX depends on tipper sign-in — empty state is clear, but copy/paste affordance could be stronger.
- Allowlist tippers only (`heettike` + `blknoiz06`); product copy should stay honest about that.
- No automated visual regression tests for the hero/tip-flow composition.
- `PrivyLoginButton` edge states should stay jargon-free if config is missing.
