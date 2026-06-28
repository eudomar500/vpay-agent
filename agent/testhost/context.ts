// Test-only AgentContext wiring. It reads RPC and the user address from env so
// the agent module can run against Arc for curl testing. In production the
// container builds the AgentContext from the connected user session.

import { getAddress } from "viem";
import type { AgentContext } from "../core";

const ARC_CHAIN_ID = 5042002;

// Placeholder until the Vpay P2PMarket contract is deployed and wired. The
// current tools do not use it; it satisfies the contract shape.
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function buildTestContext(): AgentContext {
  const rpcUrl = process.env.RPC;
  if (!rpcUrl) {
    throw new Error("RPC is not set");
  }
  const userAddress = process.env.USER_ADDRESS;
  if (!userAddress) {
    throw new Error("USER_ADDRESS is not set");
  }

  return {
    rpcUrl,
    userAddress: getAddress(userAddress),
    chainId: ARC_CHAIN_ID,
    contracts: { p2pMarket: getAddress(process.env.P2P_MARKET ?? ZERO_ADDRESS) },
  };
}
