// Tool getBalance (read). Params: none.
// Returns the user native USDC balance on Arc, where USDC is the native gas
// token with 18 decimals, so formatEther produces the correct human amount.

import { formatEther, getAddress } from "viem";
import { publicClient } from "../chain";

export type GetBalanceResult = { balanceUSDC: string };

// Temporary: the address is taken from process.env.USER_ADDRESS so the backend
// can be exercised before the wallet layer exists. Replace this with the
// connected wallet address passed from the frontend once that layer lands.
export async function getBalance(): Promise<GetBalanceResult> {
  const raw = process.env.USER_ADDRESS;
  if (!raw) {
    throw new Error("USER_ADDRESS is not set");
  }

  const address = getAddress(raw);
  const balanceWei = await publicClient.getBalance({ address });
  return { balanceUSDC: formatEther(balanceWei) };
}
