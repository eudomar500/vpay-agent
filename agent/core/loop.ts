// Agent reasoning half. Runs in the backend: it calls the LLM, executes read
// tools inline against the injected context, and turns write actions into a
// confirmation plan. It never signs and never builds a signer. The LLM API key
// is read from the backend env here, which is allowed for this half.

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { toolSchemas } from "./schemas";
import { tools } from "./tools";
import { buildToolContext, type ToolContext } from "./context";
import type { AgentContext, AgentResult, ChatMessage, PlanItem } from "./types";

const MAX_ITERATIONS = 8;
const MAX_TOKENS = 1024;

// The SDK reads ANTHROPIC_API_KEY from the environment.
const client = new Anthropic();

export type RunAgentInput = {
  message: string;
  history?: ChatMessage[];
};

export async function runAgent(input: RunAgentInput, ctx: AgentContext): Promise<AgentResult> {
  const model = process.env.ANTHROPIC_MODEL;
  if (!model) {
    throw new Error("ANTHROPIC_MODEL is not set");
  }

  const toolCtx = buildToolContext(ctx);
  const messages: Anthropic.MessageParam[] = [
    ...(input.history ?? []).map((entry) => ({ role: entry.role, content: entry.content })),
    { role: "user", content: input.message },
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

    const plan: PlanItem[] = [];
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of toolUses) {
      const tool = tools[block.name];
      if (!tool) {
        toolResults.push(errorResult(block.id, `Unknown tool: ${block.name}`));
        continue;
      }

      if (tool.type === "write") {
        // Validate and build the plan step(s) only. Never sign here. A write
        // tool returns one step (sendUSDC) or several (splitPayment); both
        // accumulate into the single confirmation plan, as do multiple write
        // calls in one turn. On a validation error, feed it back so the model
        // reports it plainly instead of proposing an invalid action.
        try {
          const produced = await tool.execute(toolCtx, block.input);
          const steps = Array.isArray(produced) ? (produced as PlanItem[]) : [produced as PlanItem];
          plan.push(...steps);
        } catch (error) {
          toolResults.push(errorResult(block.id, errorMessage(error)));
        }
        continue;
      }

      toolResults.push(await runReadTool(toolCtx, block));
    }

    // A validated write stops the loop: hand the plan to the user and wait for
    // client-side confirmation rather than continuing or signing.
    if (plan.length > 0) {
      const text = concatText(response.content) || "Review and confirm the action below.";
      return { type: "needs_confirmation", text, plan };
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
  ctx: ToolContext,
  block: Anthropic.ToolUseBlock,
): Promise<Anthropic.ToolResultBlockParam> {
  const tool = tools[block.name];
  if (!tool) {
    return errorResult(block.id, `Unknown tool: ${block.name}`);
  }

  try {
    const result = await tool.execute(ctx, block.input);
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
