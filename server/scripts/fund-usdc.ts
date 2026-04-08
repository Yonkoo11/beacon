/**
 * Swaps XLM for USDC on Stellar testnet DEX.
 * Alternative to Circle faucet (which requires reCAPTCHA).
 *
 * Usage: npx tsx scripts/fund-usdc.ts
 */
import "dotenv/config";
import {
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  Horizon,
} from "@stellar/stellar-sdk";

const SECRET_KEY = process.env.STELLAR_SECRET_KEY;
if (!SECRET_KEY) {
  console.error("STELLAR_SECRET_KEY required");
  process.exit(1);
}

async function main() {
  const server = new Horizon.Server("https://horizon-testnet.stellar.org");
  const keypair = Keypair.fromSecret(SECRET_KEY!);
  const pubKey = keypair.publicKey();

  const account = await server.loadAccount(pubKey);
  const balances = account.balances.map((b: any) =>
    `${b.asset_type === "native" ? "XLM" : b.asset_code}: ${b.balance}`
  );
  console.log(`Account: ${pubKey}`);
  console.log(`Balances: ${balances.join(", ")}`);

  // Check if we already have USDC
  const usdcBalance = account.balances.find(
    (b: any) => b.asset_code === "USDC"
  );
  if (usdcBalance && parseFloat((usdcBalance as any).balance) > 1) {
    console.log(`Already have ${(usdcBalance as any).balance} USDC. No swap needed.`);
    return;
  }

  // USDC issuer on Stellar testnet (Circle)
  const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
  const usdc = new Asset("USDC", USDC_ISSUER);

  // Use strict receive path payment: receive exactly 10 USDC, send at most 200 XLM
  console.log("Swapping XLM -> USDC via testnet DEX (strict receive: 10 USDC)...");

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.pathPaymentStrictReceive({
        sendAsset: Asset.native(),
        sendMax: "200",
        destination: pubKey,
        destAsset: usdc,
        destAmount: "10",
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(keypair);

  try {
    const result = await server.submitTransaction(tx);
    console.log("Swap successful! Hash:", (result as any).hash);
  } catch (err: any) {
    // If DEX has no liquidity, try a manage buy offer instead
    const detail = err?.response?.data?.extras?.result_codes;
    console.error("Swap failed:", detail || err.message);
    console.log("\nDEX may have no XLM/USDC liquidity on testnet.");
    console.log("Please manually get USDC from https://faucet.circle.com");
    console.log("Select: Stellar Testnet, paste address:", pubKey);
    return;
  }

  // Verify
  const updated = await server.loadAccount(pubKey);
  const newBalances = updated.balances.map((b: any) =>
    `${b.asset_type === "native" ? "XLM" : b.asset_code}: ${b.balance}`
  );
  console.log(`Updated balances: ${newBalances.join(", ")}`);
}

main().catch(console.error);
