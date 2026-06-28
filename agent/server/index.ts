// Local Express backend. Holds the Anthropic API key and runs the agent loop.
// Reasoning and execution are deliberately separate endpoints: /api/agent only
// reasons and proposes, /api/confirm signs and sends. Signing in /api/confirm
// is test-only, using the backend TEST_PRIVATE_KEY wallet; in production the
// user signs client-side and the backend never holds a key.

import "dotenv/config";
import express from "express";
import { runAgent } from "../core/loop";
import { executeSend } from "../core/execute";
import type { SendUSDCProposal } from "../core/tools/sendUSDC";

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
    const result = await runAgent(message, Array.isArray(history) ? history : []);
    res.json(result);
  } catch (error) {
    // Log the detail server-side; return a plain message without a stack trace.
    console.error(error);
    res.status(500).json({ error: "Agent failed to process the request" });
  }
});

app.post("/api/confirm", async (req, res) => {
  const { proposal } = req.body ?? {};
  if (!proposal || typeof proposal !== "object") {
    res.status(400).json({ error: "proposal is required" });
    return;
  }

  try {
    const result = await executeSend(proposal as SendUSDCProposal);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to execute the transfer" });
  }
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`Venai agent server listening on port ${port}`);
});
