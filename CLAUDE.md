# Beacon

x402 endpoint reliability monitor for Stellar. Probes endpoints, computes trust scores, serves them behind x402 paywall.

## Build Order (ENFORCED)
1. Core action works end-to-end (probe + score + x402 payment)
2. Data flows correctly (SSRF, guardrails, pruning, bulk endpoints)
3. Product complete (dashboard, logging, README)
4. Visual polish LAST (/design beacon)

## Phase 1 Gate
Core Action: Probe 5 x402 endpoints, expose GET /api/score/:url behind x402 paywall on Stellar testnet
Success Test: Paid query returns trust score, Stellar testnet transaction visible
NOT Phase 1: Dashboard, human reports, on-chain reputation, MCP, MPP, mainnet

## Running
```bash
cd server && npm run dev
```

## Tech Stack
- Express.js + TypeScript
- @x402/stellar v2.9.0 (Coinbase/x402 Foundation)
- @stellar/stellar-sdk
- SQLite (better-sqlite3, WAL mode)
- OpenZeppelin testnet facilitator

## Key Rules
- This is a NEW project. Do not copy code from Trust Oracle.
- Use @x402/stellar, NOT x402-stellar (different package).
- Stellar testnet only. No mainnet.
- Save after every task (git add + commit).
