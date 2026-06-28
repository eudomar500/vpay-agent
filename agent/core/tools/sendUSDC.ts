// Tool sendUSDC (write). Params: to (address), amount (human USDC like "25" or "25.5").
// It produces a PlanStep for confirmation. It does not compute or emit wei and
// does not sign: the plan carries the human decimal value, and the signer does
// parseEther when it builds the on-chain transaction. Native USDC on Arc is the
// gas token with 18 decimals, so the transfer is a plain value transaction.

import { getAddress, parseEther } from "viem";
import type { ToolContext } from "../context";
import type { PlanStep } from "../types";
import { assertAmountPositive, assertWithinBalance, isValidAddress } from "../validate";

export type SendUSDCInput = { to: string; amount: string };

export async function sendUSDC(ctx: ToolContext, input: SendUSDCInput): Promise<PlanStep> {
  const { to, amount } = input;

  if (typeof to !== "string" || !isValidAddress(to)) {
    throw new Error(`Invalid recipient address: ${String(to)}`);
  }
  if (typeof amount !== "string") {
    throw new Error("Amount must be a string in human USDC, for example 25 or 25.5");
  }

  const recipient = getAddress(to);
  assertAmountPositive(amount);

  // Balance guard (required by the engineering rules): the amount must not
  // exceed the user balance. The comparison is done in wei for precision using
  // the injected client; this wei value is never emitted into the plan.
  const balanceWei = await ctx.publicClient.getBalance({ address: ctx.userAddress });
  assertWithinBalance(parseEther(amount), balanceWei);

  return {
    title: `Send ${amount} USDC`,
    tx: {
      to: recipient,
      value: amount,
      description: `Send ${amount} USDC to ${recipient} on Arc. Gas is paid in native USDC.`,
    },
  };
}
