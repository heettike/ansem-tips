# ansem.tips

Production Next.js app that tips **$ansem** on Solana when an allowlisted tipper likes, replies, follows, or quote-tweets on X. Comments/QTs containing the bull emoji upgrade to a **super-tip**.

**Tippers:** `@heettike`, `@blknoiz06`, `@srijancse` (via `TIPPER_ALLOWLIST`)
**Trial tipper:** `@heettike`
**Mint:** `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump`
**Gratitude wallet:** `G4uHQ85j65KBsypPH6qVqoiSYUBuH9YTAqRpuhjLRJBq`

`DEMO_MODE` is an **explicit fallback** when credentials are missing or `DEMO_MODE=true`. With Privy, X, and hot-wallet env vars set, the live code paths run.

---

## Architecture

```mermaid
flowchart TB
  subgraph X["X / Twitter"]
    Tipper["Allowlisted tipper @heettike"]
    Actions["likes / replies / follows / QTs"]
    Tipper --> Actions
  end

  subgraph App["ansem.tips Next.js"]
    Cron["GET/POST /api/cron/poll"]
    TwitterLib["lib/twitter.ts X API v2"]
    TipsLib["lib/tips.ts dedupe + ledger"]
    DB[(Prisma SQLite or Postgres)]
    PrivySrv["lib/privy.ts server-auth"]
    SolanaLib["lib/solana.ts SPL ansem"]
    Cron --> TwitterLib
    TwitterLib --> TipsLib
    TipsLib --> DB
    TipsLib --> SolanaLib
    PrivySrv --> DB
  end

  subgraph Chain["Solana"]
    Hot["Custody hot wallet"]
    Recip["Recipient wallet"]
    Mint["ansem mint"]
    Hot -->|withdraw / tip SPL| Recip
    Mint -.-> Hot
  end

  Actions -->|poll| Cron
  Tipper -->|deposit ansem| Hot
  SolanaLib --> Hot
  Recip -->|withdraw UI| App
```

### Tip pipeline
hi

1. **Poll** X actions for TIPPER_X_USERNAME via /api/cron/poll (or the poll script).
2. **Dedupe** with unique ProcessedAction.actionId.
3. **Enqueue** Tip rows using TipSettings amounts (bull emoji upgrades to super_tip).
4. **Process** debit tipper Balance.deposited and credit recipient Balance.withdrawable.
5. **On-chain** SPL transfer when recipient wallet is linked and HOT_WALLET_SECRET is set; otherwise withdraw later via /api/withdraw.

---

## Custody model

| Role | Funds | Mechanism |
|------|--------|-----------|
| Tipper | Deposits \$ansem into custody | Send SPL to hot wallet; credit Balance.deposited via /api/deposit |
| Tip | Internal ledger move | Debit tipper deposited; credit recipient withdrawable (optional immediate SPL) |
| Recipient | Withdraw | /api/withdraw sends SPL from hot wallet to personal address |
| Platform | Hot wallet key | HOT_WALLET_SECRET (base58) — never commit |
| Gratitude | Culture fund address | GRATITUDE_WALLET (no product token) |

Ledger is authoritative for tips. Chain transfers happen on withdraw (always) and on tip process when the recipient wallet is already known.
## Quick start

---

## Quick start

1. Copy env example file to .env and fill production credentials.
2. Install JS dependencies.
3. Push the database schema.
4. Start the Next.js development server.
5. Open http://localhost:3000

### Package scripts

| Script | Purpose |
|--------|---------|
| dev | Next.js development server |
| build / start | Production build and serve |
| db:push | Push Prisma schema |
| db:studio | Prisma Studio |
| poll | Local poll and process loop |

---

## Environment setup

Copy `.env.example` to `.env`. Keys are uncommented with empty or default values.

Required for production:

- DATABASE_URL (SQLite file locally; Postgres in prod)
- CRON_SECRET (bearer for cron poll route)
- TIPPER_ALLOWLIST / TIPPER_X_USERNAME (default heettike,blknoiz06,srijancse)
- ANSEM_MINT, GRATITUDE_WALLET, SOLANA_RPC_URL
- HOT_WALLET_SECRET (base58; never commit)
- NEXT_PUBLIC_PRIVY_APP_ID, PRIVY_APP_SECRET
- TWITTER_BEARER_TOKEN

Optional: DEMO_MODE, NEXT_PUBLIC_DEMO_MODE, HOT_WALLET_ADDRESS, ANSEM_DECIMALS, MIN_DEPOSIT_USD, MIN_TIP_USD

Without X/Privy/hot-wallet credentials, those subsystems fall back to mocks automatically.

---

## API surface

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| /api/cron/poll | GET/POST | Bearer CRON_SECRET (skipped in DEMO_MODE) | Deposits + poll X + process tips |
| /api/cron/deposits | GET/POST | Bearer CRON_SECRET | Credit tipper Privy wallet  deltas |
| /api/tips/process | GET/POST | none | Process pending tips |
| /api/tips/settings | GET/POST | Privy bearer | Read/save tipper amounts |
| /api/balance | GET | none | Ledger balances |
| /api/withdraw | POST | none | SPL payout from hot wallet |
| /api/deposit | GET/POST | Privy bearer on POST | Deposit instructions / credit ledger |
| /api/auth/sync | POST | Privy bearer | Upsert user from X + Solana wallet |

Call the cron route with an Authorization Bearer header equal to CRON_SECRET.

---

## Pages

- / — dark crypto landing (mint + gratitude links)
- /onboard — Privy X login, deposit address, tip settings
- /dashboard — tipper balances + recent tips + poll
- /withdraw — recipient earned balance + SPL withdraw

---

## Production checklist

1. Set Postgres DATABASE_URL and push the Prisma schema.
2. Configure Privy with Twitter login and Solana embedded wallets.
3. Fund hot wallet with ansem token + SOL for fees; set HOT_WALLET_SECRET.
4. Set X API bearer with liked tweets / recent search / following access.
5. Keep vercel.json daily cron on /api/cron/poll (Hobby 1/day); overnight agent may hit poll+deposits more often.
6. Keep DEMO_MODE unset or false.

---

## Stack

Next.js 16 · React 19 · Prisma · Privy · Solana web3.js + spl-token · Tailwind 4 · Zod

## One-login tipper flow (no pasted X tokens)

1. Tipper (e.g. @blknoiz06) clicks Continue with X on /onboard.
2. Privy X OAuth runs. Client useOAuthTokens captures access+refresh tokens and POSTs them to /api/auth/sync with the Privy bearer. Never ask the tipper to paste X user tokens.
3. Server stores twitterAccessToken / twitterRefreshToken / twitterTokenExpiresAt on User, plus Privy Solana walletAddress.
4. Tipper sends SPL $ansem (Token-2022) to their Privy wallet. /api/cron/deposits (or daily /api/cron/poll) credits Balance.deposited for positive deltas.
5. Poller uses stored user-context tokens for liked_tweets; falls back to app bearer where allowed.
6. Recipient withdraws use HOT_WALLET_* only — fund hot wallet with $ansem + SOL for fees; no fake withdraws.

**Privy dashboard (required):** Login Methods → Twitter → custom OAuth creds + toggle **Return OAuth tokens**. Scopes: tweet.read users.read like.read offline.access follows.read. Server-auth getUser does **not** return provider tokens today.

**Vercel Hobby cron (1/day):** /api/cron/poll at `30 20 * * *` also runs deposits. Overnight agent can hit /api/cron/deposits and poll more often — do not add */5 Hobby crons.
