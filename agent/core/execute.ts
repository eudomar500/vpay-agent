// Agent execution half. Runs where the signer lives (the test host now, Vpay's
// frontend in production). It orchestrates the plan steps through the injected
// signer and collects the results. It does not validate balances or build
// wallets: the signer owns signing and the proposal was already validated when
// the plan was built.

import type { PlanStep, Signer, TxResult } from "./types";

export async function executePlan(plan: PlanStep[], signer: Signer): Promise<TxResult[]> {
  if (plan.length === 0) {
    return [];
  }

  // A batch-capable signer can confirm several steps in one prompt.
  if (plan.length > 1 && signer.signAndSendBatch) {
    return signer.signAndSendBatch(plan.map((step) => step.tx));
  }

  const results: TxResult[] = [];
  for (const step of plan) {
    results.push(await signer.signAndSend(step.tx));
  }
  return results;
}
