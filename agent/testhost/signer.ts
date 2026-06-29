// Test-only Signer. It signs with the .env TEST_PRIVATE_KEY wallet so the full
// path can be validated with curl. In production Vpay's frontend implements the
// Signer with Privy and the backend never holds a key. The private key is read
// here, in the test host, never in core.
// Native USDC on Arc has 18 decimals, so tx.value (a human decimal string) is
// converted with parseEther at this boundary.

import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { buildChain, buildPublicClient } from "../core/context";
import type { Signer, TxRequest, TxResult } from "../core";
import { buildTestContext } from "./context";
import { toUserError } from "./errors";

// Used when a send fails before a hash exists (for example an RPC rejection).
// TxResult requires a hash, so this marks the absence of a real one.
const NO_HASH = `0x${"0".repeat(64)}` as `0x${string}`;

export function buildTestSigner(): Signer {
  const key = process.env.TEST_PRIVATE_KEY;
  if (!key) {
    throw new Error("TEST_PRIVATE_KEY is not set");
  }

  const ctx = buildTestContext();
  const account = privateKeyToAccount(key as `0x${string}`);
  const walletClient = createWalletClient({ account, chain: buildChain(ctx), transport: http(ctx.rpcUrl) });
  const publicClient = buildPublicClient(ctx);

  async function send(tx: TxRequest): Promise<TxResult> {
    try {
      const hash = await walletClient.sendTransaction({
        to: tx.to,
        value: tx.value ? parseEther(tx.value) : 0n,
        data: tx.data,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return { hash, success: receipt.status === "success" };
    } catch (error) {
      return { hash: NO_HASH, success: false, error: toUserError(error) };
    }
  }

  return {
    signAndSend: send,
    // Sign and send each transaction in order, waiting for each receipt before
    // the next so nonces stay sequential. Returns results in plan order.
    async signAndSendBatch(txs: TxRequest[]): Promise<TxResult[]> {
      const results: TxResult[] = [];
      for (const tx of txs) {
        results.push(await send(tx));
      }
      return results;
    },
  };
}
