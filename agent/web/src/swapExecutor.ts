// Test-only browser swap executor. A swap is not a TxRequest, so it cannot go
// through the signer. This POSTs the swap intent to the testhost /api/swap,
// which runs App Kit with the .env wallet and kit key. The kit key never reaches
// the browser. In Vpay this is replaced by the container's own swap executor;
// the SwapExecutor interface is identical, so integration swaps only this file.

import type { SwapExecutor } from "../../core/execute";
import type { SwapStep, TxResult } from "../../core/types";

const NO_HASH = `0x${"0".repeat(64)}` as `0x${string}`;

export const browserSwapExecutor: SwapExecutor = async (step: SwapStep): Promise<TxResult> => {
  try {
    const response = await fetch("/api/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromToken: step.fromToken, toToken: step.toToken, amount: step.amount }),
    });
    if (!response.ok) {
      return { hash: NO_HASH, success: false, error: await readError(response) };
    }
    return (await response.json()) as TxResult;
  } catch (error) {
    return { hash: NO_HASH, success: false, error: error instanceof Error ? error.message : "Swap request failed" };
  }
};

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}
