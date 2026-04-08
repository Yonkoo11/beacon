import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import type { ProbeResult, Endpoint } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "beacon.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");
db.pragma("synchronous = NORMAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS probes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    success INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    status_code INTEGER,
    error TEXT,
    has_x402 INTEGER NOT NULL DEFAULT 0,
    x402_version INTEGER,
    x402_network TEXT,
    x402_price TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_probes_url_ts ON probes(url, timestamp);
  CREATE INDEX IF NOT EXISTS idx_probes_ts ON probes(timestamp);

  CREATE TABLE IF NOT EXISTS endpoints (
    url TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    method TEXT NOT NULL DEFAULT 'GET',
    added_at INTEGER NOT NULL
  );
`);

const stmtInsertProbe = db.prepare(`
  INSERT INTO probes (url, timestamp, success, latency_ms, status_code, error, has_x402, x402_version, x402_network, x402_price)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const stmtGetProbes24h = db.prepare(
  `SELECT * FROM probes WHERE url = ? AND timestamp > ? ORDER BY timestamp DESC`
);

const stmtGetRecentProbes = db.prepare(
  `SELECT url, timestamp, success, latency_ms, status_code, error FROM probes ORDER BY timestamp DESC LIMIT ?`
);

const stmtGetProbeHistory = db.prepare(
  `SELECT success, latency_ms FROM probes WHERE url = ? ORDER BY timestamp DESC LIMIT ?`
);

const stmtGetEndpoints = db.prepare(`SELECT * FROM endpoints`);

const stmtUpsertEndpoint = db.prepare(`
  INSERT INTO endpoints (url, name, description, method, added_at)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(url) DO UPDATE SET name=excluded.name, description=excluded.description
`);

const stmtPruneOldProbes = db.prepare(
  `DELETE FROM probes WHERE timestamp < ?`
);

const stmtCountProbesToday = db.prepare(
  `SELECT COUNT(*) as count FROM probes WHERE timestamp > ?`
);

export function insertProbe(probe: ProbeResult): void {
  stmtInsertProbe.run(
    probe.url,
    probe.timestamp,
    probe.success ? 1 : 0,
    probe.latency_ms,
    probe.status_code,
    probe.error,
    probe.has_x402 ? 1 : 0,
    probe.x402_version,
    probe.x402_network,
    probe.x402_price
  );
}

export function getProbes24h(url: string): ProbeResult[] {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const rows = stmtGetProbes24h.all(url, cutoff) as any[];
  return rows.map(r => ({
    ...r,
    success: !!r.success,
    has_x402: !!r.has_x402,
  }));
}

export function getRecentProbes(limit: number = 20): Array<{ url: string; timestamp: number; success: boolean; latency_ms: number; status_code: number | null; error: string | null }> {
  const rows = stmtGetRecentProbes.all(limit) as any[];
  return rows.map(r => ({ ...r, success: !!r.success }));
}

export function getProbeHistory(url: string, limit: number = 30): Array<{ success: boolean; latency_ms: number }> {
  const rows = stmtGetProbeHistory.all(url, limit) as any[];
  return rows.map(r => ({ success: !!r.success, latency_ms: r.latency_ms })).reverse();
}

export function getEndpoints(): Endpoint[] {
  return stmtGetEndpoints.all() as Endpoint[];
}

export function upsertEndpoint(ep: Omit<Endpoint, "added_at">): void {
  stmtUpsertEndpoint.run(ep.url, ep.name, ep.description, ep.method, Date.now());
}

export function pruneOldProbes(): number {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const result = stmtPruneOldProbes.run(cutoff);
  return result.changes;
}

export function countProbesToday(): number {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const row = stmtCountProbesToday.get(midnight.getTime()) as { count: number };
  return row.count;
}

export function seedEndpoints(): void {
  const seeds: Array<Omit<Endpoint, "added_at">> = [
    {
      url: "https://xlm402.com/testnet/weather/current?latitude=40.7&longitude=-74.0&timezone=UTC",
      name: "xlm402 Weather",
      description: "Real-time weather data via x402 on Stellar testnet",
      method: "GET",
    },
    {
      url: "https://xlm402.com/testnet/news/tech",
      name: "xlm402 Tech News",
      description: "Tech news feed via x402 on Stellar testnet",
      method: "GET",
    },
    {
      url: "https://xlm402.com/testnet/news/ai",
      name: "xlm402 AI News",
      description: "AI news feed via x402 on Stellar testnet",
      method: "GET",
    },
    {
      url: "https://xlm402.com/testnet/news/blockchain",
      name: "xlm402 Blockchain News",
      description: "Blockchain news feed via x402 on Stellar testnet",
      method: "GET",
    },
    {
      url: "https://xlm402.com/health",
      name: "xlm402 Health",
      description: "xlm402.com service health check",
      method: "GET",
    },
    {
      url: "https://channels.openzeppelin.com/x402/testnet/supported",
      name: "OZ Facilitator",
      description: "OpenZeppelin x402 facilitator for Stellar testnet",
      method: "GET",
    },
    {
      url: "https://x402.org/facilitator/supported",
      name: "Coinbase Facilitator",
      description: "Coinbase x402 facilitator for Stellar",
      method: "GET",
    },
    {
      url: "https://mpp.stellar.buzz",
      name: "MPP Demo",
      description: "Stellar MPP chat demo service",
      method: "GET",
    },
  ];

  for (const seed of seeds) {
    upsertEndpoint(seed);
  }
}
