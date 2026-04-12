# DoraHacks BUIDL Submission

## Profile Tab

**BUIDL name:** Beacon

**BUIDL logo:** Use the dashboard screenshot (crop the gauge area) or generate a 480x480 from the closing frame.

**Vision:** AI agents on Stellar are about to start paying for API calls with x402. But right now there's no way for an agent to know if an endpoint is reliable before it sends money. Beacon fixes that. It probes x402 endpoints every five minutes, scores them on uptime and latency, and serves those scores behind an x402 paywall so agents can check trust before spending.

**Category:** Crypto / Web3

**Is this BUIDL an AI Agent?** No

## Details Tab

**Description (long form):**

Beacon is a trust layer for the x402 agent economy on Stellar.

The problem is simple: an AI agent finds an x402 endpoint and needs to decide whether to pay for it. Is it up? Is it fast? Has it been reliable over the last 24 hours? Right now there's nothing to answer those questions. The agent just sends money and hopes for the best.

Beacon runs a probe cycle every five minutes against eight x402 endpoints on Stellar testnet. Each probe is a real HTTP request that measures response time, status code, and whether the endpoint returns a valid x402 payment header. From that raw data, Beacon computes a trust score (0-100) that weights uptime at 70% and p95 latency at 30% over a rolling 24-hour window.

The scores themselves are served behind an x402 paywall. An agent pays 0.001 USDC on Stellar testnet, and gets back the full trust score JSON for any endpoint. That payment settles on-chain. You can verify every transaction on Stellar Explorer.

The dashboard shows all eight endpoints with their scores, probe history bars, and a live feed of every probe result. Endpoints that stop responding drop to zero and visually fade out. Everything updates in real time.

**What we built:**
- Express.js server with SQLite (WAL mode) for probe storage
- Probe scheduler that hits all endpoints every 5 minutes via real HTTP requests
- Trust score algorithm: 70% uptime + 30% normalized p95 latency over 24h
- x402 payment gate using @x402/stellar v2.9.0 and the Coinbase x402 Foundation facilitator
- SSRF protection (private IP blocking, URL validation)
- Live dashboard with two-tier endpoint display, probe history visualization, and ambient trust indicator
- 32 passing tests

**What makes it different:**
- Not a status page. Not an uptime monitor. It's a trust oracle for autonomous agents that need to make spending decisions without human input.
- The scores are behind x402, so accessing trust data is itself a demonstration of x402 working on Stellar.
- Every probe result is real. No mock data, no simulated responses. The probe bars on the dashboard reflect actual HTTP calls happening in production.

## Links

**GitHub:** https://github.com/Yonkoo11/beacon

**Project website:** https://beacon-gi0z.onrender.com

**Demo video:** [PASTE YOUTUBE LINK AFTER UPLOAD]

**Social links:** https://x.com/yonkoo11

## Team Tab

Just you. Solo builder.

## Submission Tab

**Tracks:** Check whichever Stellar Hacks tracks apply (likely "Best Use of x402" or general track).

**Built during the hackathon:** Yes
