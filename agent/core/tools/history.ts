// Shared block-scan helper for getTxHistory and getSpending, so neither
// duplicates the walk-back logic. USDC is the native token on Arc with 18
// decimals, so transaction values format with formatEther. The chain client and
// the user address come from the injected context, not from env.

import { formatEther } from "viem";
import type { ToolContext } from "../context";

// Cap on how far back a single scan reaches. The scan is bounded so a demo
// request cannot fan out into an unbounded number of RPC calls.
export const MAX_SCAN_BLOCKS = 500;

// Blocks fetched concurrently per batch. Sequential fetching of the full window
// is too slow for an interactive loop, so blocks are read in parallel batches.
// The batch size also caps how many requests are in flight at once.
const FETCH_CONCURRENCY = 50;

export type TxRecord = {
  hash: string;
  from: string;
  to: string | null;
  valueUSDC: string;
  blockNumber: number;
};

// Walk back from the current block and collect transactions that touch the
// context user address as sender or recipient, newest first. The window is
// clamped to MAX_SCAN_BLOCKS and to the genesis block.
export async function scanTransactions(
  ctx: ToolContext,
  window: number = MAX_SCAN_BLOCKS,
): Promise<TxRecord[]> {
  const address = ctx.userAddress.toLowerCase();
  const blocks = Math.min(window, MAX_SCAN_BLOCKS);

  const latest = await ctx.publicClient.getBlockNumber();
  const oldest = latest - BigInt(blocks - 1);
  const stop = oldest > 0n ? oldest : 0n;

  const heights: bigint[] = [];
  for (let height = latest; height >= stop; height--) {
    heights.push(height);
  }

  const records: TxRecord[] = [];
  for (let offset = 0; offset < heights.length; offset += FETCH_CONCURRENCY) {
    const batch = heights.slice(offset, offset + FETCH_CONCURRENCY);
    const fetched = await Promise.all(
      batch.map((height) => ctx.publicClient.getBlock({ blockNumber: height, includeTransactions: true })),
    );
    for (const block of fetched) {
      for (const tx of block.transactions) {
        const isSender = tx.from.toLowerCase() === address;
        const isRecipient = tx.to !== null && tx.to.toLowerCase() === address;
        if (!isSender && !isRecipient) {
          continue;
        }
        records.push({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          valueUSDC: formatEther(tx.value),
          blockNumber: Number(tx.blockNumber),
        });
      }
    }
  }

  return records;
}
