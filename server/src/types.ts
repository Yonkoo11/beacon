export interface ProbeResult {
  url: string;
  timestamp: number;
  success: boolean;
  latency_ms: number;
  status_code: number | null;
  error: string | null;
  has_x402: boolean;
  x402_version: number | null;
  x402_network: string | null;
  x402_price: string | null;
}

export interface Endpoint {
  url: string;
  name: string;
  description: string;
  method: string;
  added_at: number;
}

export interface TrustScore {
  url: string;
  name: string;
  trust_score: number;
  uptime_score: number;
  latency_score: number;
  total_probes_24h: number;
  successful_probes_24h: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  last_probed: number | null;
  x402_valid_rate: number;
  x402_network: string | null;
  x402_price: string | null;
}

export interface SummaryResponse {
  endpoints: Array<{
    url: string;
    name: string;
    trust_score: number;
    uptime_score: number;
    latency_score: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
    total_probes_24h: number;
    last_probed: number | null;
    status: "up" | "down" | "unknown";
    x402_valid_rate: number;
    x402_network: string | null;
    x402_price: string | null;
  }>;
  recent_probes: Array<{
    url: string;
    timestamp: number;
    success: boolean;
    latency_ms: number;
    status_code: number | null;
    error: string | null;
  }>;
  stats: {
    endpoints_tracked: number;
    probes_today: number;
    avg_uptime: number;
  };
  updated_at: number;
}
