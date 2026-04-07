import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { paymentMiddlewareFromConfig } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { seedEndpoints, getRecentProbes, getEndpoints, countProbesToday } from "./db.js";
import { computeScore, computeAllScores } from "./score.js";
import { startProbeLoop } from "./probe.js";
import type { SummaryResponse } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "3001");
const PAY_TO = process.env.STELLAR_PUBLIC_KEY || "";
const NETWORK = "stellar:testnet";
const FACILITATOR_URL = "https://www.x402.org/facilitator";

if (!PAY_TO) {
  console.error("[server] STELLAR_PUBLIC_KEY is required in .env");
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// x402 payment middleware - protects /api/score and /api/scores
const facilitator = new HTTPFacilitatorClient({ url: FACILITATOR_URL });

app.use(
  paymentMiddlewareFromConfig(
    {
      "GET /api/score": {
        accepts: {
          scheme: "exact",
          price: "$0.001",
          network: NETWORK,
          payTo: PAY_TO,
        },
      },
      "GET /api/scores": {
        accepts: {
          scheme: "exact",
          price: "$0.01",
          network: NETWORK,
          payTo: PAY_TO,
        },
      },
    },
    facilitator,
    [{ network: NETWORK, server: new ExactStellarScheme() }],
  ),
);

// --- FREE ROUTES ---

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "beacon",
    description: "x402 endpoint reliability monitor for Stellar",
    version: "0.1.0",
    endpoints_tracked: getEndpoints().length,
    probes_today: countProbesToday(),
  });
});

app.get("/api/summary", (_req, res) => {
  const scores = computeAllScores();
  const recentProbes = getRecentProbes(30);
  const endpoints = getEndpoints();

  const summary: SummaryResponse = {
    endpoints: scores.map(s => ({
      url: s.url,
      name: s.name,
      trust_score: s.trust_score,
      uptime_score: s.uptime_score,
      latency_score: s.latency_score,
      avg_latency_ms: s.avg_latency_ms,
      p95_latency_ms: s.p95_latency_ms,
      total_probes_24h: s.total_probes_24h,
      last_probed: s.last_probed,
      status: s.total_probes_24h === 0
        ? "unknown" as const
        : s.uptime_score >= 50 ? "up" as const : "down" as const,
      x402_valid_rate: s.x402_valid_rate,
      x402_network: s.x402_network,
      x402_price: s.x402_price,
    })),
    recent_probes: recentProbes,
    stats: {
      endpoints_tracked: endpoints.length,
      probes_today: countProbesToday(),
      avg_uptime: scores.length > 0
        ? Math.round(scores.reduce((a, s) => a + s.uptime_score, 0) / scores.length)
        : 0,
    },
    updated_at: Date.now(),
  };

  res.json(summary);
});

app.get("/api/docs", (_req, res) => {
  res.json({
    service: "beacon",
    description: "x402 endpoint reliability monitor for Stellar. Probes x402 services every 5 minutes and computes trust scores.",
    endpoints: [
      { method: "GET", path: "/api/health", auth: "none", price: "free" },
      { method: "GET", path: "/api/summary", auth: "none", price: "free" },
      { method: "GET", path: "/api/score?url=<encoded_url>", auth: "x402", price: "$0.001 USDC", description: "Detailed trust score for a specific endpoint" },
      { method: "GET", path: "/api/scores", auth: "x402", price: "$0.01 USDC", description: "All trust scores in bulk" },
      { method: "GET", path: "/api/docs", auth: "none", price: "free" },
    ],
    network: NETWORK,
    payTo: PAY_TO,
  });
});

// --- PAID ROUTES (protected by x402 middleware) ---

app.get("/api/score", (req: any, res: any) => {
  const rawUrl = req.query.url as string;
  if (!rawUrl) {
    res.status(400).json({ error: "Missing ?url= query parameter" });
    return;
  }
  try {
    new URL(rawUrl);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }
  res.json(computeScore(rawUrl));
});

app.get("/api/scores", (_req, res) => {
  res.json(computeAllScores());
});

// --- DASHBOARD ---

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// --- START ---

seedEndpoints();
startProbeLoop();

app.listen(PORT, () => {
  console.log(`[server] Beacon listening on http://localhost:${PORT}`);
  console.log(`[server] Dashboard: http://localhost:${PORT}`);
  console.log(`[server] Pay-to address: ${PAY_TO}`);
  console.log(`[server] Network: ${NETWORK}`);
});
