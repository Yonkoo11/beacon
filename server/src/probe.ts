import { getEndpoints, insertProbe, pruneOldProbes, countProbesToday } from "./db.js";
import { isSafeUrl } from "./ssrf.js";
import { checkBudget, checkCircuitBreaker, recordCycleResult } from "./guardrails.js";
import type { ProbeResult } from "./types.js";

const PROBE_INTERVAL_MS = 5 * 60 * 1000;
const PROBE_TIMEOUT_MS = 10_000;

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
      url, timestamp, success, latency_ms,
      status_code: resp.status,
      error: null,
      has_x402,
      x402_version: x402.version,
      x402_network: x402.network,
      x402_price: x402.price,
    };
  } catch (err: any) {
    return {
      url, timestamp,
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
  // Guardrail: circuit breaker
  const cbCheck = checkCircuitBreaker();
  if (!cbCheck.safe) {
    console.log(`[probe] ${cbCheck.reason}. Skipping cycle.`);
    return;
  }

  const endpoints = getEndpoints();
  const todayCount = countProbesToday();

  // Guardrail: daily budget
  const budgetCheck = checkBudget(todayCount, endpoints.length);
  if (!budgetCheck.safe) {
    console.log(`[probe] ${budgetCheck.reason}. Skipping cycle.`);
    return;
  }

  // SSRF: filter unsafe endpoints
  const safeEndpoints = endpoints.filter(ep => {
    const check = isSafeUrl(ep.url);
    if (!check.safe) {
      console.warn(`[probe] SSRF blocked: ${ep.url} (${check.reason})`);
    }
    return check.safe;
  });

  if (safeEndpoints.length === 0) {
    console.log("[probe] No safe endpoints to probe.");
    recordCycleResult(true);
    return;
  }

  console.log(`[probe] Cycle: ${safeEndpoints.length} endpoints (${endpoints.length - safeEndpoints.length} SSRF-blocked)`);

  const results = await Promise.allSettled(
    safeEndpoints.map(ep => probeEndpoint(ep.url, ep.method))
  );

  let successCount = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      insertProbe(result.value);
      if (result.value.success) successCount++;
      const status = result.value.success ? "OK" : "FAIL";
      const x402Tag = result.value.has_x402 ? " [x402]" : "";
      console.log(`  [${status}] ${result.value.url} (${result.value.latency_ms}ms)${x402Tag}`);
    }
  }

  const allFailed = successCount === 0;
  recordCycleResult(allFailed);
  console.log(`[probe] Cycle complete: ${successCount}/${safeEndpoints.length} healthy`);
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
