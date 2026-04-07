const MAX_DAILY_PROBES = parseInt(process.env.MAX_DAILY_PROBES || "500");
const CIRCUIT_BREAKER_THRESHOLD = 3;

let consecutiveAllFail = 0;
let circuitBreakerActive = false;

export interface GuardrailCheck {
  safe: boolean;
  reason?: string;
}

export function checkBudget(currentCount: number, batchSize: number): GuardrailCheck {
  if (currentCount + batchSize > MAX_DAILY_PROBES) {
    return {
      safe: false,
      reason: `Daily budget reached: ${currentCount}/${MAX_DAILY_PROBES}`,
    };
  }
  return { safe: true };
}

export function checkCircuitBreaker(): GuardrailCheck {
  if (circuitBreakerActive) {
    return {
      safe: false,
      reason: `Circuit breaker active after ${CIRCUIT_BREAKER_THRESHOLD} consecutive all-fail cycles`,
    };
  }
  return { safe: true };
}

export function recordCycleResult(allFailed: boolean): void {
  if (allFailed) {
    consecutiveAllFail++;
    if (consecutiveAllFail >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitBreakerActive = true;
      console.error("[guardrails] Circuit breaker ACTIVE. All recent cycles failed.");
    }
  } else {
    if (circuitBreakerActive) {
      console.log("[guardrails] Circuit breaker reset.");
    }
    consecutiveAllFail = 0;
    circuitBreakerActive = false;
  }
}

export function getGuardrailStatus() {
  return {
    circuit_breaker_active: circuitBreakerActive,
    consecutive_all_fail: consecutiveAllFail,
    max_daily_probes: MAX_DAILY_PROBES,
  };
}
