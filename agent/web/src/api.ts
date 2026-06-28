// Client for the reasoning endpoint. The shell never holds the Anthropic key; it
// POSTs to the testhost /api/agent (proxied in dev) and receives an AgentResult.

import type { AgentResult, ChatMessage } from "../../core/types";

export async function postAgent(message: string, history: ChatMessage[]): Promise<AgentResult> {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return (await response.json()) as AgentResult;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}
