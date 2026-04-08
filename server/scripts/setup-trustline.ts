/**
 * Sets up USDC trustline on Stellar testnet for the Beacon wallet.
 * Run once: npx tsx src/setup-trustline.ts
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

  console.log(`Setting up USDC trustline for ${pubKey}`);

  const account = await server.loadAccount(pubKey);
  console.log(
    "Current balances:",
    account.balances.map((b: any) => `${b.asset_type === "native" ? "XLM" : b.asset_code}: ${b.balance}`).join(", ")
  );

  // Stellar testnet USDC issuer (Circle's testnet anchor)
  // This is the standard testnet USDC - check if x402 uses SAC (Soroban Asset Contract) instead
  const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
  const usdc = new Asset("USDC", USDC_ISSUER);

  // Check if trustline already exists
  const hasUSDC = account.balances.some(
    (b: any) => b.asset_code === "USDC" && b.asset_issuer === USDC_ISSUER
  );

  if (hasUSDC) {
    console.log("USDC trustline already exists!");
  } else {
    console.log("Adding USDC trustline...");
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.changeTrust({ asset: usdc }))
      .setTimeout(30)
      .build();

    tx.sign(keypair);
    const result = await server.submitTransaction(tx);
    console.log("Trustline added! Hash:", (result as any).hash);
  }

  // Now we need testnet USDC. Try the testnet USDC faucet
  // The x402 facilitator sponsors fees, but we need USDC to pay for services
  console.log("\nTo get testnet USDC:");
  console.log("1. Visit https://laboratory.stellar.org/#account/fundaccount");
  console.log("2. Or use the Circle testnet faucet");
  console.log("3. Or check xlm402.com for a USDC faucet");

  // Re-check balances
  const updated = await server.loadAccount(pubKey);
  console.log(
    "\nUpdated balances:",
    updated.balances.map((b: any) => `${b.asset_type === "native" ? "XLM" : b.asset_code}: ${b.balance}`).join(", ")
  );
}

main().catch(console.error);
