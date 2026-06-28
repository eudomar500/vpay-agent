// Validation reused by write tools, before a proposal is built or signed.
// The model proposes; these checks re-verify its numbers and addresses so an
// invalid action never reaches the user. Failures throw plain messages.

import { getAddress, isAddress, parseEther } from "viem";

// True for a 20-byte hex address that is already checksummed or can be
// checksummed (all-lowercase or all-uppercase). A wrong mixed-case checksum or
// a malformed string is rejected. getAddress does the checksum decision.
export function isValidAddress(value: string): boolean {
  if (!isAddress(value, { strict: false })) {
    return false;
  }
  try {
    getAddress(value);
    return true;
  } catch {
    return false;
  }
}

// Throws unless the human USDC amount parses and is strictly greater than zero.
export function assertAmountPositive(amount: string): void {
  let amountWei: bigint;
  try {
    amountWei = parseEther(amount);
  } catch {
    throw new Error(`Invalid amount: ${amount}`);
  }
  if (amountWei <= 0n) {
    throw new Error("Amount must be greater than zero");
  }
}

// Throws when the amount exceeds the available balance. Both values are in wei.
export function assertWithinBalance(amountWei: bigint, balanceWei: bigint): void {
  if (amountWei > balanceWei) {
    throw new Error("Amount exceeds the available balance");
  }
}
