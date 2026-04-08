/**
 * Test client that makes a real x402 payment on Stellar testnet
 * to query Beacon's /api/score endpoint.
 *
 * Usage: npx tsx src/test-client.ts
 * Requires: STELLAR_SECRET_KEY in .env (funded testnet account)
 */
import "dotenv/config";
import { x402Client, x402HTTPClient } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { Transaction, TransactionBuilder } from "@stellar/stellar-sdk";
import { getNetworkPassphrase } from "@x402/stellar";

const SECRET_KEY = process.env.STELLAR_SECRET_KEY;
const BEACON_URL = process.env.BEACON_URL || "http://localhost:3001";
const NETWORK = "stellar:testnet";
const RPC_URL = "https://soroban-testnet.stellar.org";

if (!SECRET_KEY) {
  console.error("STELLAR_SECRET_KEY required in .env");
  process.exit(1);
}

async function main() {
  const targetUrl = encodeURIComponent("https://xlm402.com/health");
  const url = `${BEACON_URL}/api/score?url=${targetUrl}`;

  console.log(`[client] Querying: ${url}`);
  console.log(`[client] Network: ${NETWORK}`);

  // Step 1: hit endpoint, expect 402
  const firstTry = await fetch(url);
  console.log(`[client] Initial response: ${firstTry.status}`);

  if (firstTry.status !== 402) {
    const body = await firstTry.text();
    console.log(`[client] Not a 402. Body: ${body.slice(0, 200)}`);
    return;
  }

  // Step 2: set up x402 client with Stellar signer
  const signer = createEd25519Signer(SECRET_KEY, NETWORK);
  const rpcConfig = { url: RPC_URL };
  const client = new x402Client().register("stellar:*", new ExactStellarScheme(signer, rpcConfig));
  const httpClient = new x402HTTPClient(client);

  // Step 3: parse 402 headers
  const paymentRequired = httpClient.getPaymentRequiredResponse(
    (name: string) => firstTry.headers.get(name)
  );
  console.log(`[client] Payment required:`, JSON.stringify(paymentRequired).slice(0, 200));

  // Step 4: create payment payload
  let paymentPayload = await client.createPaymentPayload(paymentRequired);

  // Step 5: fix Soroban data if present (from Bachini demo pattern)
  const networkPassphrase = getNetworkPassphrase(NETWORK);
  const tx = new Transaction(paymentPayload.payload.transaction, networkPassphrase);
  const sorobanData = tx.toEnvelope().v1()?.tx()?.ext()?.sorobanData();
  if (sorobanData) {
    paymentPayload = {
      ...paymentPayload,
      payload: {
        ...paymentPayload.payload,
        transaction: TransactionBuilder.cloneFrom(tx, {
          fee: "1",
          sorobanData,
          networkPassphrase,
        }).build().toXDR(),
      },
    };
  }

  // Step 6: retry with payment
  const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);
  console.log(`[client] Sending payment...`);

  const paidResponse = await fetch(url, {
    method: "GET",
    headers: paymentHeaders,
  });

  const body = await paidResponse.text();
  console.log(`[client] Paid response: ${paidResponse.status}`);
  console.log(`[client] Body: ${body.slice(0, 500)}`);

  if (paidResponse.status === 200) {
    console.log(`[client] SUCCESS! x402 payment worked on Stellar testnet.`);
    try {
      const score = JSON.parse(body);
      console.log(`[client] Trust score for xlm402.com/health: ${score.trust_score}`);
    } catch {}
  }
}

main().catch(err => {
  console.error(`[client] Error: ${err.message}`);
  process.exit(1);
});
