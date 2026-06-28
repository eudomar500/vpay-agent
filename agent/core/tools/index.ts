// Tool registry. Maps a tool name to its kind and executor.
// Read tools run in the backend and feed their result back to the model.
// Write tools move funds and are gated by user confirmation; none in Phase 0.

import { getBalance } from "./getBalance";
import { getTxHistory, type GetTxHistoryInput } from "./getTxHistory";
import { getSpending, type GetSpendingInput } from "./getSpending";
import { resolveContact, type ResolveContactInput } from "./resolveContact";

export type ToolKind = "read" | "write";

export type ToolEntry = {
  type: ToolKind;
  execute: (input: unknown) => Promise<unknown>;
};

export const tools: Record<string, ToolEntry> = {
  getBalance: { type: "read", execute: () => getBalance() },
  getTxHistory: { type: "read", execute: (input) => getTxHistory(input as GetTxHistoryInput) },
  getSpending: { type: "read", execute: (input) => getSpending(input as GetSpendingInput) },
  resolveContact: { type: "read", execute: (input) => resolveContact(input as ResolveContactInput) },
};
