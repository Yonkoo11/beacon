# Beacon - Progress

## Status: Phase 1 COMPLETE. Phase 2 starting.

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

### What's NOT done yet (Phase 1 gate partial)
- Haven't tested a PAID query with actual USDC payment (only verified 402 response)
- No client-side test script to make a real payment
- No dashboard UI yet

### What's Next (Phase 2)
1. SSRF protection module
2. Guardrails (daily budget, circuit breaker)
3. x402 header parsing in probe results
4. Probe pruning
5. Dashboard UI (Phase 3)

### Build Order
1. ~~Phase 1: Core action works~~ DONE
2. Phase 2: Data flows (SSRF, guardrails, parsing)
3. Phase 3: Product complete (dashboard, README)
4. Phase 4: Polish + submit
