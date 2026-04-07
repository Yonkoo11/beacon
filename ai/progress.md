# Beacon - Progress

## Status: Phase 1+2 COMPLETE. Phase 3 starting (dashboard + README).

### Phase 1 Results (verified)
- Server starts, probes 8 endpoints every 5 min
- 7/8 healthy (x402.org/facilitator correctly flagged as timeout)
- Trust scores: 94-96 for healthy endpoints
- x402 paywall working: /api/score returns 402 without payment
- Free endpoints working: /api/health, /api/summary, /api/docs return 200
- Stellar testnet wallet funded (GB7DLRN3...)
- Facilitator: www.x402.org/facilitator (NOT x402.org -- times out)

### Key findings during build
- Express 5 changed wildcard syntax (no bare `*` in routes)
- x402 middleware route matching needs exact paths (no `:param` routes)
- Used query params instead: /api/score?url=...
- @x402/express v2.6.0 + @x402/core v2.6.0 + @x402/stellar v2.6.0
- Facilitator at www.x402.org works; x402.org (no www) times out

### Phase 2 Results (verified)
- SSRF protection: blocks internal IPs, localhost, non-HTTPS, .local/.internal, non-standard ports
- Guardrails: daily budget (500), circuit breaker (3 consecutive all-fail)
- 32 tests passing (SSRF: 13, probe parsing: 7, score math: 12)
- x402 payment tested end-to-end: client pays 0.001 USDC -> gets trust score JSON
- Stellar wallet funded: 10 USDC + 9990 XLM via DEX swap (Circle faucet blocked by reCAPTCHA)
- xlm402 endpoints show real reliability variation (3-7/8 healthy across cycles)

### What's Next (Phase 3)
1. Dashboard UI (endpoint cards, probe feed, stats)
2. README.md
3. GitHub repo creation
4. Then Phase 4: /design polish + demo video + submit

### Build Order
1. ~~Phase 1: Core action works~~ DONE
2. Phase 2: Data flows (SSRF, guardrails, parsing)
3. Phase 3: Product complete (dashboard, README)
4. Phase 4: Polish + submit
