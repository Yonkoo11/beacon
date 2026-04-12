# Beacon Demo — Voiceover Script

Target: 60-80s. 6 clips. Stellar Hacks judges.
Show first, explain second. Sound like a dev at a demo table.
Audio: ElevenLabs Brian, stability 0.82, style 0.03.

## 01-dashboard
**Frame:** Live dashboard with trust scores, sparkline bars, probe feed
**Text:** "This is Beacon. It probes eight x402 endpoints on Stellar every five minutes and scores them on uptime and latency. The sparkline bars show each probe result. Green is healthy. Red is a failure."

## 02-feed
**Frame:** Live probe feed close-up with latencies
**Text:** "The probe feed streams in every five minutes. Each line is a real HTTP request. You can see latency variation across endpoints. When something fails, it shows timeout or error instead of a fake latency number."

## 03-scores
**Frame:** Dashboard showing endpoint cards with trust scores and uptime percentages
**Text:** "Trust scores combine uptime and latency over twenty-four hours. Seventy percent weight on uptime. Thirty percent on p95 latency. A 402 response counts as healthy since that's the x402 paywall working."

## 04-payment
**Frame:** Terminal showing test-client making x402 payment and getting score back
**Text:** "The scores themselves are behind an x402 paywall. An agent pays one tenth of a cent in USDC on Stellar. It gets the full trust score JSON back. That transaction settles on Stellar testnet."

## 05-explorer
**Frame:** Stellar testnet explorer showing the real transactions
**Text:** "And here's the proof on chain. Account creation. USDC trustline. A DEX swap for testnet USDC. And the x402 payment invocation. All real transactions on Stellar."

## 06-close
**Frame:** Dashboard hero section (clean top shot with trust score)
**Text:** "Beacon gives agents the trust data they need before spending money. That's it."
