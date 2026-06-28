// Agent loop (spec section 8). Runs in the backend.
// Read tools execute directly and feed their result back to the model.
// Write tools validate their arguments and build a proposal, then the loop
// stops and returns the proposal for client-side confirmation. The backend
// never signs and never broadcasts.

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { toolSchemas } from "./schemas";
import { tools } from "./tools";

const MAX_ITERATIONS = 8;
const MAX_TOKENS = 1024;

// The SDK reads ANTHROPIC_API_KEY from the environment.
const client = new Anthropic();

// A validated write awaiting user confirmation. proposal is the structured plan
// the tool returned; toolUse is the original model request the frontend later
// executes once the user signs.
export type ProposedWrite = {
  toolUse: Anthropic.ToolUseBlock;
  proposal: unknown;
};

export type AgentResult =
  | { type: "final"; text: string }
  | { type: "needs_confirmation"; plan: ProposedWrite[] };

export async function runAgent(
  userMessage: string,
  history: Anthropic.MessageParam[] = [],
): Promise<AgentResult> {
  const model = process.env.ANTHROPIC_MODEL;
  if (!model) {
    throw new Error("ANTHROPIC_MODEL is not set");
  }

  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: "user", content: userMessage },
  ];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: toolSchemas,
      messages,
    });

    if (response.stop_reason !== "tool_use") {
      return { type: "final", text: concatText(response.content) };
    }

    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    const proposals: ProposedWrite[] = [];
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of toolUses) {
      const tool = tools[block.name];
      if (!tool) {
        toolResults.push(errorResult(block.id, `Unknown tool: ${block.name}`));
        continue;
      }

      if (tool.type === "write") {
        // Validate and build the proposal only. Never sign or send here. On a
        // validation error, feed it back so the model reports it plainly
        // instead of proposing an invalid action.
        try {
          const proposal = await tool.execute(block.input);
          proposals.push({ toolUse: block, proposal });
        } catch (error) {
          toolResults.push(errorResult(block.id, errorMessage(error)));
        }
        continue;
      }

      toolResults.push(await runReadTool(block));
    }

    // A validated write stops the loop: hand the proposal to the user and wait
    // for client-side confirmation rather than continuing or signing.
    if (proposals.length > 0) {
      return { type: "needs_confirmation", plan: proposals };
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });
  }

  throw new Error(`Agent loop exceeded ${MAX_ITERATIONS} iterations`);
}

function concatText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

async function runReadTool(
  block: Anthropic.ToolUseBlock,
): Promise<Anthropic.ToolResultBlockParam> {
  const tool = tools[block.name];
  if (!tool) {
    return errorResult(block.id, `Unknown tool: ${block.name}`);
  }

  try {
    const result = await tool.execute(block.input);
    return {
      type: "tool_result",
      tool_use_id: block.id,
      content: JSON.stringify(result),
    };
  } catch (error) {
    return errorResult(block.id, errorMessage(error));
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Tool execution failed";
}

function errorResult(toolUseId: string, message: string): Anthropic.ToolResultBlockParam {
  return {
    type: "tool_result",
    tool_use_id: toolUseId,
    content: message,
    is_error: true,
  };
}
