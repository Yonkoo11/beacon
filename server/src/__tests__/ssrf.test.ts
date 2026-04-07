import { describe, it, expect } from "vitest";
import { isSafeUrl } from "../ssrf.js";

describe("isSafeUrl", () => {
  it("allows valid HTTPS URLs", () => {
    expect(isSafeUrl("https://xlm402.com/health").safe).toBe(true);
    expect(isSafeUrl("https://example.com/api/v1").safe).toBe(true);
  });

  it("blocks HTTP URLs", () => {
    expect(isSafeUrl("http://example.com").safe).toBe(false);
  });

  it("blocks localhost", () => {
    expect(isSafeUrl("https://localhost/admin").safe).toBe(false);
    expect(isSafeUrl("https://127.0.0.1/admin").safe).toBe(false);
  });

  it("blocks IPv4 addresses", () => {
    expect(isSafeUrl("https://192.168.1.1/admin").safe).toBe(false);
    expect(isSafeUrl("https://10.0.0.1/admin").safe).toBe(false);
  });

  it("blocks IPv6 addresses", () => {
    expect(isSafeUrl("https://[::1]/admin").safe).toBe(false);
  });

  it("blocks hex IP addresses", () => {
    expect(isSafeUrl("https://0x7f000001/admin").safe).toBe(false);
  });

  it("blocks octal IP addresses", () => {
    expect(isSafeUrl("https://0177.0.0.1/admin").safe).toBe(false);
  });

  it("blocks decimal IP addresses", () => {
    expect(isSafeUrl("https://2130706433/admin").safe).toBe(false);
  });

  it("blocks .local domains", () => {
    expect(isSafeUrl("https://myservice.local/api").safe).toBe(false);
  });

  it("blocks .internal domains", () => {
    expect(isSafeUrl("https://metadata.google.internal/computeMetadata").safe).toBe(false);
  });

  it("blocks cloud metadata endpoints", () => {
    expect(isSafeUrl("https://169.254.169.254/latest/meta-data").safe).toBe(false);
  });

  it("blocks non-standard ports", () => {
    expect(isSafeUrl("https://example.com:8080/api").safe).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isSafeUrl("not-a-url").safe).toBe(false);
    expect(isSafeUrl("").safe).toBe(false);
  });
});
