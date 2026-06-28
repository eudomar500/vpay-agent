// On-chain execution of a confirmed sendUSDC proposal.
// Test-only: it signs with the backend TEST_PRIVATE_KEY wallet so the full path
// can be validated. In production the user signs client-side with their own
// wallet and this module is replaced; the backend never holds a key.
// Native USDC on Arc is the gas token with 18 decimals, so a transfer is a plain
// value transaction, not an ERC-20 transfer.

import { getAddress } from "viem";
import { arc, buildWalletClient, publicClient } from "./chain";
import { assertAmountPositive, assertWithinBalance, isValidAddress } from "./validate";
import type { SendUSDCProposal } from "./tools/sendUSDC";

export type ExecuteSendResult = {
  hash: string;
  status: string;
  explorerUrl: string;
};

export async function executeSend(proposal: SendUSDCProposal): Promise<ExecuteSendResult> {
  // Re-validate before signing. A proposal handed back from the client is not
  // trusted: re-check the address, the amount, and the live balance.
  if (!isValidAddress(proposal.to)) {
    throw new Error(`Invalid recipient address: ${String(proposal.to)}`);
  }
  assertAmountPositive(proposal.amountUSDC);

  const to = getAddress(proposal.to);
  const amountWei = BigInt(proposal.amountWei);

  const walletClient = buildWalletClient();
  const sender = walletClient.account.address;

  const balanceWei = await publicClient.getBalance({ address: sender });
  assertWithinBalance(amountWei, balanceWei);

  const hash = await walletClient.sendTransaction({ to, value: amountWei });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    hash,
    status: receipt.status,
    explorerUrl: `${arc.blockExplorers.default.url}/tx/${hash}`,
  };
}
