const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "metadata.google.internal",
  "169.254.169.254",
  "metadata.internal",
]);

function isIpAddress(host: string): boolean {
  if (host.startsWith("[")) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  if (/^0x[0-9a-f]+$/i.test(host)) return true;
  if (/^0\d+\./.test(host)) return true;
  if (/^\d{8,}$/.test(host)) return true;
  return false;
}

export function isSafeUrl(url: string): { safe: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { safe: false, reason: "invalid URL" };
  }

  if (parsed.protocol !== "https:") {
    return { safe: false, reason: "non-HTTPS protocol" };
  }

  const host = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(host)) {
    return { safe: false, reason: `blocked hostname: ${host}` };
  }

  if (host.endsWith(".local")) {
    return { safe: false, reason: "local domain" };
  }

  if (host.endsWith(".internal")) {
    return { safe: false, reason: "internal domain" };
  }

  if (isIpAddress(host)) {
    return { safe: false, reason: "IP address not allowed" };
  }

  if (parsed.port && !["443", ""].includes(parsed.port)) {
    return { safe: false, reason: `non-standard port: ${parsed.port}` };
  }

  return { safe: true };
}
