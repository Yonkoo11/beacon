import { getProbes24h, getEndpoints } from "./db.js";
import type { TrustScore } from "./types.js";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function computeScore(url: string): TrustScore {
  const probes = getProbes24h(url);
  const endpoints = getEndpoints();
  const ep = endpoints.find(e => e.url === url);

  const totalProbes = probes.length;
  const successfulProbes = probes.filter(p => p.success).length;

  const uptimeScore = totalProbes > 0
    ? (successfulProbes / totalProbes) * 100
    : 0;

  const latencies = probes.filter(p => p.success).map(p => p.latency_ms).sort((a, b) => a - b);
  const p95 = percentile(latencies, 95);
  const avgLatency = latencies.length > 0
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length
    : 0;

  const latencyScore = latencies.length > 0
    ? clamp((5000 - p95) / 4900 * 100, 0, 100)
    : 0;

  const trustScore = totalProbes > 0
    ? Math.round(0.7 * uptimeScore + 0.3 * latencyScore)
    : 0;

  const x402Probes = probes.filter(p => p.status_code === 402);
  const x402Valid = x402Probes.filter(p => p.has_x402);
  const x402ValidRate = x402Probes.length > 0
    ? Math.round((x402Valid.length / x402Probes.length) * 100)
    : 0;

  const lastX402 = x402Valid[0];

  return {
    url,
    name: ep?.name ?? url,
    trust_score: trustScore,
    uptime_score: Math.round(uptimeScore),
    latency_score: Math.round(latencyScore),
    total_probes_24h: totalProbes,
    successful_probes_24h: successfulProbes,
    avg_latency_ms: Math.round(avgLatency),
    p95_latency_ms: Math.round(p95),
    last_probed: probes[0]?.timestamp ?? null,
    x402_valid_rate: x402ValidRate,
    x402_network: lastX402?.x402_network ?? null,
    x402_price: lastX402?.x402_price ?? null,
  };
}

export function computeAllScores(): TrustScore[] {
  const endpoints = getEndpoints();
  return endpoints.map(ep => computeScore(ep.url));
}
