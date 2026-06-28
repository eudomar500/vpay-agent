// Agent loop (spec section 8). Runs in the backend.
// Read tools execute directly and feed their result back to the model.
// Write tools pause the loop and return a plan for client-side confirmation;
// the backend never executes a write and never signs.

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { toolSchemas } from "./schemas";
import { tools } from "./tools";

const MAX_ITERATIONS = 8;
const MAX_TOKENS = 1024;

// The SDK reads ANTHROPIC_API_KEY from the environment.
const client = new Anthropic();

export type AgentResult =
  | { type: "final"; text: string }
  | { type: "needs_confirmation"; plan: Anthropic.ToolUseBlock[] };

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

    // A write tool moves funds, so stop and hand the plan to the user. Surface
    // every write block in this turn so the client can confirm them together.
    const writes = toolUses.filter((block) => tools[block.name]?.type === "write");
    if (writes.length > 0) {
      return { type: "needs_confirmation", plan: writes };
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUses) {
      toolResults.push(await runReadTool(block));
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
    const message = error instanceof Error ? error.message : "Tool execution failed";
    return errorResult(block.id, message);
  }
}

function errorResult(toolUseId: string, message: string): Anthropic.ToolResultBlockParam {
  return {
    type: "tool_result",
    tool_use_id: toolUseId,
    content: message,
    is_error: true,
  };
}
