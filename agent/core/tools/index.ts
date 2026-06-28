// Tool registry. Maps a tool name to its kind and executor. Every executor
// receives the ToolContext (injected client and user address) and the raw
// model input. Read tools run inline; write tools return a PlanStep.

import type { ToolContext } from "../context";
import { getBalance } from "./getBalance";
import { getTxHistory, type GetTxHistoryInput } from "./getTxHistory";
import { getSpending, type GetSpendingInput } from "./getSpending";
import { resolveContact, type ResolveContactInput } from "./resolveContact";
import { sendUSDC, type SendUSDCInput } from "./sendUSDC";
import { splitPayment, type SplitPaymentInput } from "./splitPayment";

export type ToolKind = "read" | "write";

export type ToolEntry = {
  type: ToolKind;
  execute: (ctx: ToolContext, input: unknown) => Promise<unknown>;
};

export const tools: Record<string, ToolEntry> = {
  getBalance: { type: "read", execute: (ctx) => getBalance(ctx) },
  getTxHistory: { type: "read", execute: (ctx, input) => getTxHistory(ctx, input as GetTxHistoryInput) },
  getSpending: { type: "read", execute: (ctx, input) => getSpending(ctx, input as GetSpendingInput) },
  resolveContact: { type: "read", execute: (_ctx, input) => resolveContact(input as ResolveContactInput) },
  sendUSDC: { type: "write", execute: (ctx, input) => sendUSDC(ctx, input as SendUSDCInput) },
  splitPayment: { type: "write", execute: (ctx, input) => splitPayment(ctx, input as SplitPaymentInput) },
};
