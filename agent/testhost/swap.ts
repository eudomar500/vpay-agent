// Test-only swap executor backed by Circle App Kit. This is the only file that
// imports the App Kit SDK; core never imports it. It builds the kit with the
// .env test wallet and CIRCLE_KIT_KEY (read here, never in core) and runs the
// swap on Arc Testnet, following the App Kit swap sample. In production Vpay
// provides its own swap executor; this is the swap counterpart to the test signer.

import { createPublicClient, createWalletClient, http } from "viem";
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import type { SwapExecutor, SwapStep, TxResult } from "../core";
import { buildTestContext } from "./context";
import { toUserError } from "./errors";

// Marks a swap that could not produce a real hash.
const NO_HASH = `0x${"0".repeat(64)}` as `0x${string}`;

function failed(error: string): TxResult {
  return { hash: NO_HASH, success: false, error };
}

export function buildTestSwapExecutor(): SwapExecutor {
  // The kit and adapter are built per call so a missing kit key fails as a clean
  // result rather than blocking transfer-only confirmations at startup.
  return async (step: SwapStep): Promise<TxResult> => {
    const privateKey = process.env.TEST_PRIVATE_KEY;
    if (!privateKey) {
      return failed("Swap wallet is not configured.");
    }
    const kitKey = process.env.CIRCLE_KIT_KEY;
    if (!kitKey) {
      return failed("Swap is not configured (missing kit key).");
    }

    const kit = new AppKit();

    // Pin the adapter to the authenticated Arc RPC. Without this, App Kit uses
    // its default public Arc endpoint, which fails with NETWORK_CONNECTION_FAILED.
    const rpcUrl = buildTestContext().rpcUrl;
    const adapter = createViemAdapterFromPrivateKey({
      privateKey: privateKey as `0x${string}`,
      getPublicClient: ({ chain }) => createPublicClient({ chain, transport: http(rpcUrl) }),
      getWalletClient: ({ chain, account }) => createWalletClient({ chain, account, transport: http(rpcUrl) }),
    });

    const swapParams = {
      from: { adapter, chain: "Arc_Testnet" as const },
      tokenIn: step.fromToken,
      tokenOut: step.toToken,
      amountIn: step.amount,
      // Arc USDC does not support an EIP-2612 permit that simulates cleanly, so
      // the swap uses a traditional approval transaction instead of the default
      // permit strategy. App Kit owns the allowance and the spender; it sends the
      // approve before the swap.
      config: { kitKey, allowanceStrategy: "approve" as const },
    };

    // Pre-swap estimate as a route check. If it throws, no route or quote exists
    // for this pair and amount, so the failure is route or liquidity.
    try {
      await kit.estimateSwap(swapParams);
    } catch {
      return failed("No swap route or quote available for this pair and amount.");
    }

    try {
      const result = await kit.swap(swapParams);
      const hash = (result as { txHash?: string }).txHash;
      if (!hash) {
        return failed("Swap did not return a transaction hash.");
      }
      return { hash: hash as `0x${string}`, success: true };
    } catch (error) {
      return failed(toUserError(error));
    }
  };
}
