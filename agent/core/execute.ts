// On-chain execution of a confirmed sendUSDC proposal.
// The agent never signs. Signing is injected through a Signer (the container
// app supplies it: the test wallet now, Privy in production). This module only
// re-validates and dispatches to the signer.
// Native USDC on Arc is the gas token with 18 decimals, so a transfer is a plain
// value transaction, not an ERC-20 transfer.

import { parseEther } from "viem";
import { arc, publicClient } from "./chain";
import { getBalance } from "./tools/getBalance";
import { assertAmountPositive, assertWithinBalance, isValidAddress } from "./validate";
import type { Signer } from "./signer";
import type { SendUSDCProposal } from "./tools/sendUSDC";

export type ExecuteSendResult = {
  hash: string;
  status: string;
  explorerUrl: string;
};

export async function executeSend(
  proposal: SendUSDCProposal,
  signer: Signer,
): Promise<ExecuteSendResult> {
  // Re-validate before dispatching to the signer. A proposal handed back from
  // the client is not trusted: re-check the address, the amount, and the live
  // balance of the user account that funds the transfer.
  if (!isValidAddress(proposal.to)) {
    throw new Error(`Invalid recipient address: ${String(proposal.to)}`);
  }
  assertAmountPositive(proposal.amountUSDC);

  const amountWei = BigInt(proposal.amountWei);
  const { balanceUSDC } = await getBalance();
  assertWithinBalance(amountWei, parseEther(balanceUSDC));

  const hash = await signer.signAndSend({ to: proposal.to, value: amountWei });

  // The signer returns once it has a hash. Read the receipt here so status is
  // reported even when a production signer resolves before the tx is mined.
  const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });

  return {
    hash,
    status: receipt.status,
    explorerUrl: `${arc.blockExplorers.default.url}/tx/${hash}`,
  };
}
