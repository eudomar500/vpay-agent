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

type ErrorLike = {
  shortMessage?: string;
  details?: string;
  message?: string;
  cause?: unknown;
};

// Map a viem or RPC error to a short readable reason. The raw viem error embeds
// the RPC URL, the request body, gas params, and the library version; none of
// that reaches the user. Classification scans the reason fields; the output is
// always one of the clean strings below.
function toUserError(error: unknown): string {
  const reason = collectReason(error).toLowerCase();

  if (reason.includes("blocked address")) {
    return "Recipient address is blocked by the network.";
  }
  if (reason.includes("insufficient funds") || reason.includes("exceeds the balance")) {
    return "Insufficient balance to cover amount plus gas.";
  }
  if (
    reason.includes("replacement transaction underpriced") ||
    reason.includes("nonce") ||
    reason.includes("already known")
  ) {
    return "Network is busy, please retry.";
  }

  // Generic case: a fixed message plus viem's one-line shortMessage when present.
  // Never the full message, which carries the request body and URL.
  const short = shortMessageOf(error);
  return short ? `Transaction failed. Please try again. ${short}` : "Transaction failed. Please try again.";
}

// Gather the concise reason fields across the cause chain for classification.
// viem keeps the node reason in shortMessage and details; the full message dump
// is deliberately left out. Plain errors expose their reason only in message.
function collectReason(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current && depth < 10; depth++) {
    const candidate = current as ErrorLike;
    if (typeof candidate.shortMessage === "string") {
      parts.push(candidate.shortMessage);
    }
    if (typeof candidate.details === "string") {
      parts.push(candidate.details);
    }
    current = candidate.cause;
  }
  if (parts.length === 0 && error instanceof Error) {
    parts.push(error.message);
  }
  return parts.join(" ");
}

function shortMessageOf(error: unknown): string | undefined {
  const candidate = error as ErrorLike;
  return typeof candidate.shortMessage === "string" && candidate.shortMessage.length > 0
    ? candidate.shortMessage
    : undefined;
}
