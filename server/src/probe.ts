import { getEndpoints, insertProbe, pruneOldProbes, countProbesToday } from "./db.js";
import type { ProbeResult } from "./types.js";

const PROBE_INTERVAL_MS = 5 * 60 * 1000;
const PROBE_TIMEOUT_MS = 10_000;
const MAX_DAILY_PROBES = 500;

let probeTimer: ReturnType<typeof setInterval> | null = null;
let pruneTimer: ReturnType<typeof setInterval> | null = null;

export function parseX402Header(header: string | null): {
  version: number | null;
  network: string | null;
  price: string | null;
} {
  if (!header) return { version: null, network: null, price: null };
  try {
    const decoded = JSON.parse(Buffer.from(header, "base64").toString("utf-8"));
    const version = decoded.x402Version ?? null;
    const firstAccept = decoded.accepts?.[0];
    const network = firstAccept?.network ?? null;
    const price = firstAccept?.amount ?? firstAccept?.price ?? null;
    return { version, network, price };
  } catch {
    return { version: null, network: null, price: null };
  }
}

async function probeEndpoint(url: string, method: string = "GET"): Promise<ProbeResult> {
  const start = Date.now();
  const timestamp = start;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    const resp = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        "User-Agent": "Beacon/1.0 (x402 reliability monitor)",
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      ...(method === "POST" ? { body: "{}" } : {}),
    });

    clearTimeout(timeout);
    await resp.arrayBuffer();
    const latency_ms = Date.now() - start;

    const success = resp.status >= 200 && resp.status < 500;

    const paymentHeader = resp.headers.get("x-payment-required")
      || resp.headers.get("payment-required");
    const x402 = parseX402Header(paymentHeader);
    const has_x402 = resp.status === 402 && x402.version !== null;

    return {
      url,
      timestamp,
      success,
      latency_ms,
      status_code: resp.status,
      error: null,
      has_x402,
      x402_version: x402.version,
      x402_network: x402.network,
      x402_price: x402.price,
    };
  } catch (err: any) {
    return {
      url,
      timestamp,
      success: false,
      latency_ms: Date.now() - start,
      status_code: null,
      error: err.name === "AbortError" ? "timeout" : err.message,
      has_x402: false,
      x402_version: null,
      x402_network: null,
      x402_price: null,
    };
  }
}

async function runProbeCycle(): Promise<void> {
  const todayCount = countProbesToday();
  const endpoints = getEndpoints();

  if (todayCount + endpoints.length > MAX_DAILY_PROBES) {
    console.log(`[probe] Daily budget reached (${todayCount}/${MAX_DAILY_PROBES}). Skipping cycle.`);
    return;
  }

  console.log(`[probe] Starting cycle: ${endpoints.length} endpoints`);

  const results = await Promise.allSettled(
    endpoints.map(ep => probeEndpoint(ep.url, ep.method))
  );

  let successCount = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      insertProbe(result.value);
      if (result.value.success) successCount++;
      const status = result.value.success ? "OK" : "FAIL";
      const latency = result.value.latency_ms;
      console.log(`  [${status}] ${result.value.url} (${latency}ms)`);
    }
  }

  console.log(`[probe] Cycle complete: ${successCount}/${endpoints.length} healthy`);
}

export function startProbeLoop(): void {
  console.log("[probe] Starting probe loop (5-min interval)");
  runProbeCycle();
  probeTimer = setInterval(runProbeCycle, PROBE_INTERVAL_MS);
  pruneTimer = setInterval(() => {
    const pruned = pruneOldProbes();
    if (pruned > 0) console.log(`[probe] Pruned ${pruned} old probes`);
  }, 60 * 60 * 1000);
}

export function stopProbeLoop(): void {
  if (probeTimer) clearInterval(probeTimer);
  if (pruneTimer) clearInterval(pruneTimer);
}
