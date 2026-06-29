// Thin HTTP test host for the agent module. It imports the module, injects a
// test AgentContext and a test Signer, and exposes the two endpoints for curl
// testing. It replaces the old agent/server role. Reasoning and execution stay
// separate: /api/agent only reasons and proposes, /api/confirm signs and sends.
// The signing here is test-only; in production the container supplies the signer.

import "dotenv/config";
import express from "express";
import { executePlan, runAgent } from "../core";
import type { ChatMessage, PlanItem, SwapStep, SwapToken, TxRequest } from "../core";
import { buildTestContext } from "./context";
import { buildTestSigner } from "./signer";
import { buildTestSwapExecutor } from "./swap";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/agent", async (req, res) => {
  const { message, history } = req.body ?? {};
  if (typeof message !== "string" || message.length === 0) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  try {
    const result = await runAgent(
      { message, history: Array.isArray(history) ? (history as ChatMessage[]) : [] },
      buildTestContext(),
    );
    res.json(result);
  } catch (error) {
    // Log the detail server-side; return a plain message without a stack trace.
    console.error(error);
    res.status(500).json({ error: "Agent failed to process the request" });
  }
});

app.post("/api/confirm", async (req, res) => {
  const { plan } = req.body ?? {};
  if (!Array.isArray(plan)) {
    res.status(400).json({ error: "plan is required" });
    return;
  }

  try {
    // Inject both executors: transfers sign with the test wallet, swaps run
    // through App Kit. In production the container provides both.
    const results = await executePlan(plan as PlanItem[], buildTestSigner(), buildTestSwapExecutor());
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to execute the plan" });
  }
});

// Signs and sends a single TxRequest with the .env wallet. The browser Signer
// calls this so the private key never leaves the server.
app.post("/api/sign", async (req, res) => {
  const tx = req.body ?? {};
  if (typeof tx !== "object" || typeof tx.to !== "string") {
    res.status(400).json({ error: "a TxRequest with a 'to' address is required" });
    return;
  }

  try {
    const result = await buildTestSigner().signAndSend(tx as TxRequest);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to sign and send the transaction" });
  }
});

// Runs a single swap with App Kit and the .env wallet. The browser swap executor
// calls this so the kit key never leaves the server.
app.post("/api/swap", async (req, res) => {
  const { fromToken, toToken, amount } = req.body ?? {};
  if (typeof fromToken !== "string" || typeof toToken !== "string" || typeof amount !== "string") {
    res.status(400).json({ error: "fromToken, toToken and amount are required" });
    return;
  }

  const step: SwapStep = {
    kind: "swap",
    fromToken: fromToken as SwapToken,
    toToken: toToken as SwapToken,
    amount,
    description: `Swap ${amount} ${fromToken} for ${toToken} on Arc Testnet`,
  };

  try {
    const result = await buildTestSwapExecutor()(step);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to execute the swap" });
  }
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`Venai agent test host listening on port ${port}`);
});
