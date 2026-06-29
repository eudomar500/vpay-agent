// Test shell flow. The shell reasons through /api/agent and, when the agent
// proposes write actions, runs the plan through executePlan with the browser
// test signer. Conversation history is kept and passed back so context carries.

import { useState } from "react";
import { executePlan } from "../../core/execute";
import type { ChatMessage, PlanItem, TxResult } from "../../core/types";
import { postAgent } from "./api";
import { testSigner } from "./signer";
import { browserSwapExecutor } from "./swapExecutor";
import { Chat } from "./components/Chat";
import { PlanConfirm } from "./components/PlanConfirm";
import { TxResultView } from "./components/TxResultView";

type Pending = { plan: PlanItem[] } | null;

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<Pending>(null);
  const [results, setResults] = useState<TxResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function appendAssistant(content: string) {
    setMessages((prev) => [...prev, { role: "assistant", content }]);
  }

  async function handleSend(text: string) {
    setError(null);
    setResults(null);

    // Send the prior turns as history; runAgent appends this new message itself.
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setBusy(true);
    try {
      const result = await postAgent(text, history);
      if (result.type === "final") {
        appendAssistant(result.text);
      } else {
        appendAssistant(result.text);
        setPending({ plan: result.plan });
      }
    } catch (caught) {
      setError(toMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!pending) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const txResults = await executePlan(pending.plan, testSigner, browserSwapExecutor);
      setResults(txResults);
      appendAssistant(summarize(txResults));
      setPending(null);
    } catch (caught) {
      setError(toMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    setPending(null);
    appendAssistant("Plan cancelled.");
  }

  return (
    <main>
      <h1>Venai test shell</h1>
      <Chat messages={messages} onSend={handleSend} disabled={busy || pending !== null} />
      {error ? <div className="error">{error}</div> : null}
      {pending ? (
        <PlanConfirm plan={pending.plan} onConfirm={handleConfirm} onCancel={handleCancel} busy={busy} />
      ) : null}
      {results ? <TxResultView results={results} /> : null}
    </main>
  );
}

function summarize(results: TxResult[]): string {
  const succeeded = results.filter((result) => result.success).length;
  const noun = results.length === 1 ? "transaction" : "transactions";
  return `Submitted ${results.length} ${noun}, ${succeeded} succeeded.`;
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Request failed";
}
