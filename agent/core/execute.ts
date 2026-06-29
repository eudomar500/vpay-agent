// Agent execution half. Runs where the signer lives (the test host now, Vpay's
// frontend in production). It orchestrates the plan steps and collects results.
// It does not validate balances or build wallets, and it does not import any
// swap SDK: transfer steps go through the injected Signer, swap steps go through
// an injected swap executor. Both are supplied by the host, so core stays
// agnostic to how signing and swapping are implemented.

import type { PlanItem, PlanStep, SwapStep, Signer, TxResult } from "./types";

// Injected swap executor. The host provides the App Kit implementation (test
// host now, Vpay later); core never references the swap SDK.
export type SwapExecutor = (step: SwapStep) => Promise<TxResult>;

// Marks a result with no real hash (a step that could not run).
const NO_HASH = `0x${"0".repeat(64)}` as `0x${string}`;

export async function executePlan(
  plan: PlanItem[],
  signer: Signer,
  swapExecutor?: SwapExecutor,
): Promise<TxResult[]> {
  if (plan.length === 0) {
    return [];
  }

  // A plan of only transfers keeps the single-confirmation batch path when the
  // signer supports it. Swap steps cannot batch with transfers, so a mixed plan
  // runs step by step instead.
  const hasSwap = plan.some(isSwapStep);
  if (!hasSwap && plan.length > 1 && signer.signAndSendBatch) {
    return signer.signAndSendBatch(plan.map((step) => (step as PlanStep).tx));
  }

  const results: TxResult[] = [];
  for (const step of plan) {
    if (isSwapStep(step)) {
      results.push(await runSwap(step, swapExecutor));
    } else {
      results.push(await signer.signAndSend(step.tx));
    }
  }
  return results;
}

function isSwapStep(step: PlanItem): step is SwapStep {
  return "kind" in step && step.kind === "swap";
}

async function runSwap(step: SwapStep, swapExecutor?: SwapExecutor): Promise<TxResult> {
  if (!swapExecutor) {
    return { hash: NO_HASH, success: false, error: "Swap execution is not available in this environment." };
  }
  return swapExecutor(step);
}
