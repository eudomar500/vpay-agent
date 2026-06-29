// Integration contract shared with the container app (Vpay). These shapes are
// the boundary between the agent module and whatever hosts it: the test host
// here, or Vpay's frontend in production. Keep them verbatim.

export interface TxRequest {
  to: `0x${string}`;
  value?: string;
  data?: `0x${string}`;
  description: string;
}

export interface TxResult {
  hash: `0x${string}`;
  success: boolean;
  error?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PlanStep {
  title: string;
  tx: TxRequest;
}

// Tokens supported for swap on Arc Testnet (Circle App Kit).
export type SwapToken = "USDC" | "EURC" | "cirBTC";

// A swap is not a transfer: it has no single recipient and no value in the
// TxRequest sense, so it does not fit TxRequest (to + value). It is carried as
// its own step kind, discriminated by `kind`. Vpay integration will need a
// dedicated swap type in the contract to coordinate this with the container;
// for this test the type lives here.
export interface SwapStep {
  kind: "swap";
  fromToken: SwapToken;
  toToken: SwapToken;
  amount: string;
  description: string;
}

// A confirmation plan may mix transfer steps (PlanStep) and swap steps
// (SwapStep). PlanStep carries no `kind`, so the presence of `kind` discriminates
// a swap step from a transfer step.
export type PlanItem = PlanStep | SwapStep;

export interface AgentContext {
  rpcUrl: string;
  userAddress: `0x${string}`;
  chainId: number;
  contracts: { p2pMarket: `0x${string}` };
}

export interface Signer {
  signAndSend: (tx: TxRequest) => Promise<TxResult>;
  signAndSendBatch?: (txs: TxRequest[]) => Promise<TxResult[]>;
}

export type AgentResult =
  | { type: "final"; text: string }
  | { type: "needs_confirmation"; text: string; plan: PlanItem[] };
