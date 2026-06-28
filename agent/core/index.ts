// Module surface imported by the container app (Vpay). Two halves run in
// different places: runAgent (LLM and reads, backend) and executePlan (signing,
// frontend). The types are the integration contract.

export { runAgent } from "./loop";
export { executePlan } from "./execute";
export type {
  TxRequest,
  TxResult,
  ChatMessage,
  PlanStep,
  AgentContext,
  Signer,
  AgentResult,
} from "./types";
