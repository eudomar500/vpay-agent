// Local Express backend. Holds the Anthropic API key and runs the agent loop.
// It reasons only: it never signs and never touches keys. On-chain execution
// happens in the frontend with the user wallet.

import "dotenv/config";
import express from "express";
import { runAgent } from "../core/loop";

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

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`Venai agent server listening on port ${port}`);
});
