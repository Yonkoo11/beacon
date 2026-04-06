# Fix Plan - Beacon

## Tasks

- [ ] Task 1: Project setup (npm init, dependencies, tsconfig, .gitignore)
  - Acceptance: `npm run dev` starts without errors
  - Files: server/package.json, server/tsconfig.json, .gitignore

- [ ] Task 2: Generate Stellar testnet keypair + fund via friendbot
  - Acceptance: Keypair stored in .env, account funded with XLM + USDC on testnet
  - Files: server/.env.example

- [ ] Task 3: SQLite schema + prepared statements
  - Acceptance: probes and endpoints tables created, insert/query statements work
  - Files: server/src/db.ts, server/src/types.ts

- [ ] Task 4: Probe loop (5-min interval, 10s timeout, success = 2xx-4xx)
  - Acceptance: 5 seed endpoints probed, results stored in SQLite
  - Files: server/src/probe.ts

- [ ] Task 5: Trust score computation (weighted formula)
  - Acceptance: computeScore returns valid trust_score for probed endpoints
  - Files: server/src/score.ts

- [ ] Task 6: x402-protected /api/score/:url route
  - Acceptance: Returns 402 without payment, returns score JSON with payment
  - Files: server/src/index.ts

- [ ] Task 7: Free /api/summary route
  - Acceptance: Returns endpoint list with limited score fields
  - Files: server/src/index.ts

- [ ] Task 8: SSRF protection module
  - Acceptance: Blocks localhost, internal IPs, non-HTTPS
  - Files: server/src/ssrf.ts

- [ ] Task 9: Guardrails (daily budget 500, circuit breaker)
  - Acceptance: Probe loop stops when budget exceeded or 3 consecutive failures
  - Files: server/src/guardrails.ts

- [ ] Task 10: Dashboard (vanilla HTML + fetch polling)
  - Acceptance: Shows endpoint cards, probe feed, stats grid, auto-refreshes
  - Files: server/public/index.html

## Completed
(builder fills this in)
