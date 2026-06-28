// Chain metadata and read-client wiring built from an injected AgentContext.
// Core never reads wallet env and never builds a signer. The RPC URL comes from
// the context per request, not from module-level env.
// Arc metadata: chainId 5042002, native USDC with 18 decimals, Arcscan explorer.

import { createPublicClient, defineChain, http } from "viem";
import type { AgentContext } from "./types";

export function buildChain(ctx: AgentContext) {
  return defineChain({
    id: ctx.chainId,
    name: "Arc Testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    rpcUrls: { default: { http: [ctx.rpcUrl] } },
    blockExplorers: { default: { name: "Arcscan", url: "https://testnet.arcscan.app" } },
  });
}

export function buildPublicClient(ctx: AgentContext) {
  return createPublicClient({ chain: buildChain(ctx), transport: http(ctx.rpcUrl) });
}

// What read tools receive: a public client for the injected chain and the user
// address from the context. No tool reads the address from env.
export type ToolContext = {
  publicClient: ReturnType<typeof buildPublicClient>;
  userAddress: `0x${string}`;
};

export function buildToolContext(ctx: AgentContext): ToolContext {
  return { publicClient: buildPublicClient(ctx), userAddress: ctx.userAddress };
}
