// Tool sendUSDC (write). Params: to (address), amount (human USDC like "25" or "25.5").
// Native USDC on Arc has 18 decimals, so amounts parse with parseEther, not 1e6.
// This function validates and returns a proposal only. Execution and signing
// happen client-side with the user wallet in a later phase; the backend never
// sends and never touches keys.

import { formatEther, getAddress, parseEther } from "viem";
import { arc } from "../chain";
import { getBalance } from "./getBalance";
import { assertAmountPositive, assertWithinBalance, isValidAddress } from "../validate";

export type SendUSDCInput = { to: string; amount: string };

export type SendUSDCProposal = {
  action: "sendUSDC";
  to: string;
  amountUSDC: string;
  amountWei: string;
  feeNote: string;
  network: string;
};

export async function sendUSDC(input: SendUSDCInput): Promise<SendUSDCProposal> {
  const { to, amount } = input;

  if (typeof to !== "string" || !isValidAddress(to)) {
    throw new Error(`Invalid recipient address: ${String(to)}`);
  }
  if (typeof amount !== "string") {
    throw new Error("Amount must be a string in human USDC, for example 25 or 25.5");
  }

  const recipient = getAddress(to);
  assertAmountPositive(amount);
  const amountWei = parseEther(amount);

  // Re-check against the live balance; never trust the model amount unverified.
  const { balanceUSDC } = await getBalance();
  assertWithinBalance(amountWei, parseEther(balanceUSDC));

  return {
    action: "sendUSDC",
    to: recipient,
    amountUSDC: formatEther(amountWei),
    amountWei: amountWei.toString(),
    feeNote: "gas paid in native USDC on Arc",
    network: arc.name,
  };
}
