// Anthropic tool schemas advertised to the model.
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
  {
    name: "getTxHistory",
    description: "List the user most recent USDC transactions on Arc, newest first.",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of transactions to return. Defaults to 10.",
        },
      },
    },
  },
  {
    name: "getSpending",
    description: "Sum the user outgoing USDC over the given period.",
    input_schema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["week", "month"],
          description: "Period to sum spending over.",
        },
      },
      required: ["period"],
    },
  },
  {
    name: "resolveContact",
    description: "Resolve a contact name to an Arc address through the Vpay agenda.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Contact name to resolve.",
        },
      },
      required: ["name"],
    },
  },
];
