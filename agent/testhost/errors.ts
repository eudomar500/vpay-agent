// Maps a viem or RPC error to a short readable reason for the user. The raw
// viem error embeds the RPC URL, the request body, gas params, and the library
// version; none of that reaches the user. Classification scans the concise
// reason fields only; the output is always one of the clean strings below.
// Shared by the transfer signer and the swap executor in the test host.

type ErrorLike = {
  shortMessage?: string;
  details?: string;
  message?: string;
  cause?: unknown;
};

export function toUserError(error: unknown): string {
  const reason = collectReason(error).toLowerCase();

  if (reason.includes("blocked address")) {
    return "Recipient address is blocked by the network.";
  }
  if (reason.includes("insufficient funds") || reason.includes("exceeds the balance")) {
    return "Insufficient balance to cover amount plus gas.";
  }
  if (
    reason.includes("replacement transaction underpriced") ||
    reason.includes("nonce") ||
    reason.includes("already known")
  ) {
    return "Network is busy, please retry.";
  }

  // Generic case: a fixed message plus viem's one-line shortMessage when present.
  // Never the full message, which carries the request body and URL.
  const short = shortMessageOf(error);
  return short ? `Transaction failed. Please try again. ${short}` : "Transaction failed. Please try again.";
}

// Gather the concise reason fields across the cause chain for classification.
// viem keeps the node reason in shortMessage and details; the full message dump
// is deliberately left out. Plain errors expose their reason only in message.
function collectReason(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current && depth < 10; depth++) {
    const candidate = current as ErrorLike;
    if (typeof candidate.shortMessage === "string") {
      parts.push(candidate.shortMessage);
    }
    if (typeof candidate.details === "string") {
      parts.push(candidate.details);
    }
    current = candidate.cause;
  }
  if (parts.length === 0 && error instanceof Error) {
    parts.push(error.message);
  }
  return parts.join(" ");
}

function shortMessageOf(error: unknown): string | undefined {
  const candidate = error as ErrorLike;
  return typeof candidate.shortMessage === "string" && candidate.shortMessage.length > 0
    ? candidate.shortMessage
    : undefined;
}
