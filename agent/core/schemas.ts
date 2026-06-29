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
  {
    name: "sendUSDC",
    description:
      "Propose a native USDC transfer on Arc. This does not send funds; it returns a plan the user must confirm and sign.",
    input_schema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Recipient address as a 0x-prefixed hex address.",
        },
        amount: {
          type: "string",
          description: 'Amount in human USDC, for example "25" or "25.5". Not the wei value.',
        },
      },
      required: ["to", "amount"],
    },
  },
  {
    name: "splitPayment",
    description:
      "Propose a native USDC split among several recipients on Arc. Provide exactly one of total (split equally) or each (same amount to everyone); they are mutually exclusive. This does not send funds; it returns a multi-step plan the user must confirm and sign.",
    input_schema: {
      type: "object",
      properties: {
        recipients: {
          type: "array",
          items: { type: "string" },
          description: "Recipient addresses, each a 0x-prefixed hex address.",
        },
        total: {
          type: "string",
          description:
            'Total human USDC to split equally among the recipients, for example "30". Mutually exclusive with each.',
        },
        each: {
          type: "string",
          description:
            'Human USDC to send to every recipient, for example "10". Mutually exclusive with total.',
        },
      },
      required: ["recipients"],
    },
  },
  {
    name: "swapTokens",
    description:
      "Propose a token swap on Arc Testnet using Circle App Kit. Supported tokens are USDC, EURC, and cirBTC. This does not execute the swap; it returns a plan the user must confirm.",
    input_schema: {
      type: "object",
      properties: {
        fromToken: {
          type: "string",
          enum: ["USDC", "EURC", "cirBTC"],
          description: "Token to swap from. One of USDC, EURC, cirBTC.",
        },
        toToken: {
          type: "string",
          enum: ["USDC", "EURC", "cirBTC"],
          description: "Token to receive. One of USDC, EURC, cirBTC, different from fromToken.",
        },
        amount: {
          type: "string",
          description: 'Amount of fromToken to swap, human decimal, for example "1" or "1.5".',
        },
      },
      required: ["fromToken", "toToken", "amount"],
    },
  },
];
