// Tool getBalance (read). Params: none.
// Returns the native USDC balance of the context user address on Arc, where
// USDC is the native gas token with 18 decimals, so formatEther is correct.

import { formatEther } from "viem";
import type { ToolContext } from "../context";

export type GetBalanceResult = { balanceUSDC: string };

export async function getBalance(ctx: ToolContext): Promise<GetBalanceResult> {
  const balanceWei = await ctx.publicClient.getBalance({ address: ctx.userAddress });
  return { balanceUSDC: formatEther(balanceWei) };
}
