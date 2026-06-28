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
  | { type: "needs_confirmation"; text: string; plan: PlanStep[] };
