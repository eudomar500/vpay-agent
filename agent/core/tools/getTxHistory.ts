// Tool getTxHistory (read). Param: limit (optional, default 10).
// Returns the most recent transactions touching the user address. An empty
// history is a valid result, not an error.

import { scanTransactions, type TxRecord } from "./history";

const DEFAULT_LIMIT = 10;

export type GetTxHistoryInput = { limit?: number };

export async function getTxHistory(input: GetTxHistoryInput = {}): Promise<TxRecord[]> {
  const limit = input.limit && input.limit > 0 ? Math.floor(input.limit) : DEFAULT_LIMIT;
  const records = await scanTransactions();
  return records.slice(0, limit);
}
