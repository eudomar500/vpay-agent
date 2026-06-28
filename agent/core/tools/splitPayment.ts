// Tool splitPayment (write). Params: recipients plus exactly one of total
// (split equally) or each (same amount to everyone). It produces one PlanStep
// per recipient for a single batched confirmation. It does not sign and does not
// emit wei: the plan carries human decimal values and the signer does parseEther.
// Native USDC on Arc is the gas token with 18 decimals.

import { formatEther, getAddress, parseEther } from "viem";
import type { ToolContext } from "../context";
import type { PlanStep } from "../types";
import { assertAmountPositive, assertWithinBalance, isValidAddress } from "../validate";

export type SplitPaymentInput = {
  recipients: string[];
  total?: string;
  each?: string;
};

export async function splitPayment(ctx: ToolContext, input: SplitPaymentInput): Promise<PlanStep[]> {
  const { recipients, total, each } = input;

  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("recipients must be a non-empty array of addresses");
  }

  // total and each are mutually exclusive; exactly one is required.
  const hasTotal = typeof total === "string" && total.length > 0;
  const hasEach = typeof each === "string" && each.length > 0;
  if (hasTotal === hasEach) {
    throw new Error('provide exactly one of "total" or "each"');
  }

  // Validate and checksum every recipient. Reject the whole split if any fails.
  const addresses = recipients.map((addr) => {
    if (typeof addr !== "string" || !isValidAddress(addr)) {
      throw new Error(`Invalid recipient address: ${String(addr)}`);
    }
    return getAddress(addr);
  });
  const count = addresses.length;

  // Per-recipient amounts in wei, computed internally for exact splitting and
  // the balance guard. Wei is never emitted; the plan carries decimal strings.
  let amountsWei: bigint[];
  if (hasEach) {
    assertAmountPositive(each as string);
    const perWei = parseEther(each as string);
    amountsWei = addresses.map(() => perWei);
  } else {
    assertAmountPositive(total as string);
    const totalWei = parseEther(total as string);
    const base = totalWei / BigInt(count);
    if (base <= 0n) {
      throw new Error("total is too small to give every recipient a positive amount");
    }
    // Hand out the remainder one wei at a time so the parts sum to the total.
    const remainder = totalWei % BigInt(count);
    amountsWei = addresses.map((_, index) => (BigInt(index) < remainder ? base + 1n : base));
  }

  const sumWei = amountsWei.reduce((acc, value) => acc + value, 0n);
  const balanceWei = await ctx.publicClient.getBalance({ address: ctx.userAddress });
  assertWithinBalance(sumWei, balanceWei);

  return addresses.map((recipient, index) => {
    const value = hasEach ? (each as string) : formatEther(amountsWei[index]);
    return {
      title: `Send ${value} USDC to ${recipient}`,
      tx: {
        to: recipient,
        value,
        description: `Send ${value} USDC to ${recipient} on Arc as part of a split among ${count} recipients. Gas is paid in native USDC.`,
      },
    };
  });
}
