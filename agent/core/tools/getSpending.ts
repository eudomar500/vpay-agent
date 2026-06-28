// Tool getSpending (read). Param: period ("week" or "month").
// Sums outgoing USDC (transactions sent by the context user) over the period.

import { formatEther, parseEther } from "viem";
import type { ToolContext } from "../context";
import { scanTransactions } from "./history";

export type SpendingPeriod = "week" | "month";

export type GetSpendingInput = { period: SpendingPeriod };

export type GetSpendingResult = {
  period: SpendingPeriod;
  totalSpentUSDC: string;
  txCount: number;
};

// Approximate Arc block time in seconds. The period is converted to a block
// window with this value, so the window is an estimate, not an exact cutoff;
// the scan is further bounded by MAX_SCAN_BLOCKS in history.ts.
const ARC_BLOCK_TIME_SECONDS = 1;

const PERIOD_SECONDS: Record<SpendingPeriod, number> = {
  week: 7 * 24 * 60 * 60,
  month: 30 * 24 * 60 * 60,
};

export async function getSpending(
  ctx: ToolContext,
  input: GetSpendingInput,
): Promise<GetSpendingResult> {
  const period = input.period;
  if (period !== "week" && period !== "month") {
    throw new Error('period must be "week" or "month"');
  }

  const address = ctx.userAddress.toLowerCase();
  const windowBlocks = Math.ceil(PERIOD_SECONDS[period] / ARC_BLOCK_TIME_SECONDS);
  const records = await scanTransactions(ctx, windowBlocks);

  const outgoing = records.filter((tx) => tx.from.toLowerCase() === address);

  // Sum in wei to keep exact precision, then format once at the end.
  let totalWei = 0n;
  for (const tx of outgoing) {
    totalWei += parseEther(tx.valueUSDC);
  }

  return {
    period,
    totalSpentUSDC: formatEther(totalWei),
    txCount: outgoing.length,
  };
}
