import { describe, it, expect } from "vitest";
import { parseX402Header } from "../probe.js";

describe("parseX402Header", () => {
  it("returns nulls for null input", () => {
    const result = parseX402Header(null);
    expect(result.version).toBeNull();
    expect(result.network).toBeNull();
    expect(result.price).toBeNull();
  });

  it("returns nulls for empty string", () => {
    const result = parseX402Header("");
    expect(result.version).toBeNull();
  });

  it("returns nulls for invalid base64", () => {
    const result = parseX402Header("not-base64!!!");
    expect(result.version).toBeNull();
  });

  it("parses valid x402v2 header", () => {
    const payload = {
      x402Version: 2,
      accepts: [{
        scheme: "exact",
        network: "stellar:testnet",
        amount: "100000",
        asset: "CBIELLTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHM5QDAMA",
        payTo: "GA4D33Z3EOB6BU4DOXS2JMZK3JQRABN3ERMF3FK5JF5YPG3CEKRI7WM4",
      }],
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
    const result = parseX402Header(encoded);

    expect(result.version).toBe(2);
    expect(result.network).toBe("stellar:testnet");
    expect(result.price).toBe("100000");
  });

  it("handles header with no accepts array", () => {
    const payload = { x402Version: 2 };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
    const result = parseX402Header(encoded);

    expect(result.version).toBe(2);
    expect(result.network).toBeNull();
    expect(result.price).toBeNull();
  });

  it("handles header with empty accepts array", () => {
    const payload = { x402Version: 2, accepts: [] };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
    const result = parseX402Header(encoded);

    expect(result.version).toBe(2);
    expect(result.network).toBeNull();
  });

  it("parses real xlm402.com header format", () => {
    // This is the actual base64 from xlm402.com testnet weather endpoint
    const payload = {
      x402Version: 2,
      error: "Payment required",
      resource: { url: "http://xlm402.com/testnet/weather/current", description: "Weather", mimeType: "application/json" },
      accepts: [
        { scheme: "exact", network: "stellar:testnet", amount: "100000", asset: "CBIELLTK...", payTo: "GA4D33Z3..." },
        { scheme: "exact", network: "stellar:testnet", amount: "643087", asset: "CDLZFC3S...", payTo: "GA4D33Z3..." },
      ],
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
    const result = parseX402Header(encoded);

    expect(result.version).toBe(2);
    expect(result.network).toBe("stellar:testnet");
    expect(result.price).toBe("100000");
  });
});
