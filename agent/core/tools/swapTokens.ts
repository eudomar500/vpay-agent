// Tool swapTokens (write). Params: fromToken, toToken (USDC, EURC, cirBTC) and a
// human decimal amount. It produces a SwapStep for confirmation. A swap is not a
// transfer, so it does not return a TxRequest; the SwapStep carries the swap
// intent and the App Kit executor runs it later. This tool does not execute and
// does not import any swap SDK; core stays App-Kit-free.

import { parseEther } from "viem";
import type { ToolContext } from "../context";
import type { SwapStep, SwapToken } from "../types";
import { assertAmountPositive } from "../validate";

const SUPPORTED_TOKENS: SwapToken[] = ["USDC", "EURC", "cirBTC"];

export type SwapTokensInput = { fromToken: string; toToken: string; amount: string };

export async function swapTokens(ctx: ToolContext, input: SwapTokensInput): Promise<SwapStep> {
  const { fromToken, toToken, amount } = input;

  if (!isSupported(fromToken)) {
    throw new Error(`Unsupported fromToken: ${String(fromToken)}`);
  }
  if (!isSupported(toToken)) {
    throw new Error(`Unsupported toToken: ${String(toToken)}`);
  }
  if (fromToken === toToken) {
    throw new Error("fromToken and toToken must be different");
  }
  if (typeof amount !== "string") {
    throw new Error("amount must be a string in human units, for example 1 or 1.5");
  }
  assertAmountPositive(amount);

  // Balance guard. Native USDC is readable with the injected client. EURC and
  // cirBTC are ERC-20 on Arc, and core holds no token addresses and must not
  // import App Kit, so their balance and liquidity are checked by the App Kit
  // swap at execution time, which fails the swap if the balance is short.
  if (fromToken === "USDC") {
    const balanceWei = await ctx.publicClient.getBalance({ address: ctx.userAddress });
    if (parseEther(amount) > balanceWei) {
      throw new Error("Amount exceeds the available USDC balance");
    }
  }

  return {
    kind: "swap",
    fromToken,
    toToken,
    amount,
    description: `Swap ${amount} ${fromToken} for ${toToken} on Arc Testnet`,
  };
}

function isSupported(token: string): token is SwapToken {
  return (SUPPORTED_TOKENS as string[]).includes(token);
}
