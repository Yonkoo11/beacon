# Beacon - Memory

## Phase 1 Gate (MUST PASS BEFORE ANY OTHER WORK)
Core Action: Probe 5 x402 endpoints on Stellar testnet, expose GET /api/score/:url behind x402 paywall
Success Test: Client pays $0.001 USDC via x402 on Stellar testnet, gets trust score JSON back, transaction visible on explorer
NOT Phase 1: Dashboard UI, human reports, on-chain reputation, alerting, MCP server, MPP, mainnet
Status: [ ] NOT STARTED

## Hackathon
- Name: Stellar Hacks: Agents
- Deadline: April 13, 2026 18:00 UTC
- Track: Single open innovation track
- Prizes: $5K / $2K / $1.25K / $1K / $750 in XLM
- Organizer: Stellar Development Foundation
- Required: Public repo + 2-3 min video + real Stellar testnet/mainnet transactions
- Competition: 336 hackers, BUIDLs private
- Organizer signal: Ideas & Inspiration explicitly lists "rating/reputation/trust systems"

## Architecture Decisions
- Express.js (simpler than Hono, more x402 starter code available)
- @x402/stellar v2.9.0 (official Coinbase/x402 Foundation SDK, NOT the mertkaradayi one)
- OpenZeppelin hosted testnet facilitator (no self-hosting needed)
- SQLite with WAL mode + prepared statements (proven pattern from Trust Oracle)
- Vanilla HTML dashboard (no React overhead)

## Key Gotchas
- Stellar x402 payments expire in ~12 ledgers (~60s). Handle retries.
- @x402/stellar and @stellar/mpp are NOT interoperable. We use @x402/stellar.
- Freighter Mobile does NOT support x402. Browser extension only.
- x402-stellar npm package (mertkaradayi) is NOT official. Use @x402/stellar.
- Facilitator always sponsors fees on testnet. Fine for demo.

## Competitive Landscape
- Zero reliability/monitoring projects found across ALL x402 hackathons (Cronos, Stacks, SKALE, Stellar)
- Everyone builds "agent pays for X" demos or agent marketplaces
- Trust Oracle (our prior build) was for Base/EVM, different chain, different stack
- This is a fresh build for Stellar. Same concept, new code.

## Reference Repos
- jamesbachini/x402-Stellar-Demo (server-basic = 1KB working x402 server)
- oceans404/1-shot-stellar (video paywall + 52KB guide)
- oceans404/stellar-sponsored-agent-account (agent wallet bootstrapping)
- jamesbachini/x402-mcp-stellar (Claude MCP integration)

## Seed Endpoints
1. https://xlm402.com
2. https://stellar-observatory.vercel.app
3. https://channels.openzeppelin.com/x402/testnet/supported
4. https://x402.org/facilitator/supported
5. https://mpp.stellar.buzz
