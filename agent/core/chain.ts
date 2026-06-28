// Arc chain config and viem clients.
// RPC comes from the ARC CLI: run `arc-canteen rpc-url --export` to load it into $RPC.
// chainId 5042002 (0x4cef52). USDC is native gas with 18 decimals: use parseEther, not 1e6.

import { createPublicClient, createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const arc = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC ?? "https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "Arcscan", url: "https://testnet.arcscan.app" } },
});

// Read-only client for backend reasoning. The RPC URL is carried by the chain
// config above, which reads process.env.RPC.
export const publicClient = createPublicClient({ chain: arc, transport: http() });

// Test-only signing wallet. In production the user signs client-side with their
// own wallet (Vpay or Privy) and the backend never holds a key. This exists so
// the full propose-confirm-sign-send path can be validated end to end.
// TEST_PRIVATE_KEY is read at call time so dotenv has loaded.
export function buildWalletClient() {
  const key = process.env.TEST_PRIVATE_KEY;
  if (!key) {
    throw new Error("TEST_PRIVATE_KEY is not set");
  }
  const account = privateKeyToAccount(key as `0x${string}`);
  return createWalletClient({ account, chain: arc, transport: http() });
}
