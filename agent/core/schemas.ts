// Anthropic tool schemas advertised to the model. Phase 0 ships getBalance only.
// Each entry mirrors a tool in the registry (tools/index.ts).

import type Anthropic from "@anthropic-ai/sdk";

export const toolSchemas: Anthropic.Tool[] = [
  {
    name: "getBalance",
    description: "Get the user current native USDC balance on Arc.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
];
