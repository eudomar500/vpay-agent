// Arc chain config and viem clients.
// RPC comes from the ARC CLI: run `arc-canteen rpc-url --export` to load it into $RPC.
// chainId 5042002 (0x4cef52). USDC is native gas with 18 decimals: use parseEther, not 1e6.

import { defineChain } from "viem";

export const arc = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC ?? "https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "Arcscan", url: "https://testnet.arcscan.app" } },
});

// TODO: export a publicClient (createPublicClient). The walletClient is built
// client-side with the user wallet. The backend never signs.
