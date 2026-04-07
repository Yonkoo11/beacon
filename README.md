# Beacon

Trust scores for the x402 agent economy on Stellar.

Beacon continuously probes x402 endpoints with real HTTP requests, computes reliability scores, and serves them behind an x402 paywall. Agents query Beacon before spending money to know which services are actually working.

## Why This Exists

x402 enables agents to pay for API calls with stablecoin micropayments. But there's a problem: **agents have no way to check if an endpoint is reliable before paying.** On Stellar testnet, we measured 60%+ failure rates on some x402 facilitator endpoints. Agents that pay blindly waste money on dead services.

Beacon solves this by acting as a trust layer: it probes endpoints every 5 minutes, tracks uptime and latency over a 24-hour window, and publishes trust scores that other agents can query before making payment decisions.

## How It Works

```
Every 5 minutes:
  1. Probe all monitored x402 endpoints
  2. Record: status code, latency, x402 header validity
  3. Compute trust scores (weighted uptime + latency)
  4. Store in SQLite

Agents can then:
  GET /api/score?url=<endpoint>   (paid, $0.001 USDC via x402)
  GET /api/scores                 (paid, $0.01 USDC via x402)
  GET /api/summary                (free, limited fields)
```

## Trust Score Formula

```
trust_score = 0.7 * uptime_score + 0.3 * latency_score

uptime_score  = (successful probes / total probes) * 100  [24h window]
latency_score = clamp((5000ms - p95_latency) / 4900 * 100, 0, 100)

Success = HTTP 200-499 (402 is healthy for x402 endpoints)
Failure = 5xx, timeout (10s), network error
```

Additionally tracked (not weighted):
- `x402_valid_rate`: % of 402 responses with valid x402v2 payment-required headers
- `x402_network`: what chain the endpoint settles on
- `x402_price`: what the endpoint charges per request

## Architecture

```
beacon/
  server/
    src/
      index.ts        Express app + x402 middleware
      probe.ts        5-min autonomous probe loop
      score.ts        Trust score computation
      db.ts           SQLite (WAL mode, prepared statements)
      ssrf.ts         URL validation (blocks internal IPs)
      guardrails.ts   Daily budget + circuit breaker
      types.ts        TypeScript types
    public/
      index.html      Live dashboard
```

**Stack:** Express.js, @x402/stellar v2.6.0, @stellar/stellar-sdk, SQLite, TypeScript

**Payment:** x402 on Stellar testnet via OpenZeppelin facilitator. USDC micropayments.

## Quick Start

```bash
cd server
cp .env.example .env

# Generate a Stellar testnet keypair
node -e "import('@stellar/stellar-sdk').then(({Keypair})=>{const k=Keypair.random();console.log('STELLAR_PUBLIC_KEY='+k.publicKey());console.log('STELLAR_SECRET_KEY='+k.secret())})"
# Paste output into .env

# Fund the account
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"

# Add USDC trustline + get testnet USDC
npm install
npx tsx src/setup-trustline.ts
npx tsx src/fund-usdc.ts

# Start
npm run dev
```

Dashboard at http://localhost:3001. Probes start immediately.

## API

| Endpoint | Auth | Price | Description |
|----------|------|-------|-------------|
| `GET /api/health` | None | Free | Service status |
| `GET /api/summary` | None | Free | All endpoints with limited score fields |
| `GET /api/docs` | None | Free | Machine-readable API discovery |
| `GET /api/score?url=<url>` | x402 | $0.001 USDC | Full trust score for one endpoint |
| `GET /api/scores` | x402 | $0.01 USDC | All trust scores in bulk |

## Safety

- **SSRF protection**: blocks internal IPs, localhost, .local/.internal domains, non-HTTPS
- **Daily probe budget**: 500 probes/day max (prevents runaway costs)
- **Circuit breaker**: halts after 3 consecutive all-fail cycles
- **Probe pruning**: data older than 7 days automatically deleted

## What Beacon Found

During development on Stellar testnet, Beacon detected:
- **Coinbase x402 facilitator** (x402.org): consistently times out (10s+)
- **xlm402 testnet endpoints**: intermittent failures (3-87% uptime depending on endpoint)
- **OpenZeppelin facilitator**: stable but returns 401 without auth
- **MPP demo service**: generally healthy

This is the exact reliability data that agents need before making payment decisions.

## Tests

```bash
cd server && npm test
# 32 tests passing (SSRF: 13, probe parsing: 7, score math: 12)
```

## Built For

[Stellar Hacks: Agents](https://dorahacks.io/hackathon/stellar-agents-x402-stripe-mpp) hackathon. Single open innovation track. April 2026.

Built on Stellar because sub-cent transaction fees ($0.00001) make high-frequency endpoint probing economically viable. On EVM chains, probing 1000 endpoints daily would cost $10-100 in gas. On Stellar, it costs $0.01.
