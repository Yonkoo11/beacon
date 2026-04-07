import { describe, it, expect } from "vitest";

// Test the scoring logic directly (math only, no DB dependency)

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function computeTrustScore(uptimeScore: number, latencyScore: number): number {
  return Math.round(0.7 * uptimeScore + 0.3 * latencyScore);
}

function computeLatencyScore(p95: number): number {
  return clamp((5000 - p95) / 4900 * 100, 0, 100);
}

describe("Trust Score Math", () => {
  it("perfect uptime + fast latency = high score", () => {
    const uptime = 100;
    const latency = computeLatencyScore(200);
    const score = computeTrustScore(uptime, latency);
    expect(score).toBeGreaterThan(90);
  });

  it("zero uptime = zero score", () => {
    const score = computeTrustScore(0, 0);
    expect(score).toBe(0);
  });

  it("100% uptime + 5s latency = 70", () => {
    const latency = computeLatencyScore(5000);
    expect(latency).toBe(0);
    const score = computeTrustScore(100, 0);
    expect(score).toBe(70);
  });

  it("50% uptime + fast latency = moderate score", () => {
    const latency = computeLatencyScore(100);
    const score = computeTrustScore(50, latency);
    expect(score).toBeGreaterThan(60);
    expect(score).toBeLessThan(70);
  });
});

describe("Percentile Calculation", () => {
  it("p95 of single value is that value", () => {
    expect(percentile([500], 95)).toBe(500);
  });

  it("p95 of sorted array picks near-top value", () => {
    const data = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
                  100, 200, 300, 400, 500, 600, 700, 800, 900, 5000];
    data.sort((a, b) => a - b);
    const p95 = percentile(data, 95);
    // 20 elements, p95 index = ceil(0.95 * 20) - 1 = 18, value at index 18 = 1000
    expect(p95).toBe(1000);
  });

  it("empty array returns 0", () => {
    expect(percentile([], 95)).toBe(0);
  });
});

describe("Latency Score", () => {
  it("100ms = perfect score (100)", () => {
    expect(Math.round(computeLatencyScore(100))).toBe(100);
  });

  it("5000ms = zero score", () => {
    expect(computeLatencyScore(5000)).toBe(0);
  });

  it("2500ms = ~51", () => {
    const score = computeLatencyScore(2500);
    expect(Math.round(score)).toBe(51);
  });

  it("scores above 5000ms clamp to 0", () => {
    expect(computeLatencyScore(10000)).toBe(0);
  });

  it("scores below 100ms clamp to 100", () => {
    expect(computeLatencyScore(50)).toBe(100);
  });
});
