# Venai Agent

Natural-language payment agent on Arc (Circle's L1, native USDC). Part of the Vpay project:
Vpay is the P2P product, Venai is the AI agent layer integrated into it.

## What it does
The agent understands natural language, plans, uses tools, chains steps, and executes
USDC operations after explicit user confirmation. The LLM proposes; the user signs.

## Hard rules
- Native USDC has 18 decimals on Arc. Sending USDC is a native transfer with parseEther, not 1e6.
- Every fund-moving action requires explicit user confirmation. The LLM never holds private keys.
- The Anthropic API key lives only in the backend, never in the client.

## Structure
- agent/core        pure logic, no UI (the loop, tools, schemas, validation, chain config)
- agent/core/tools  one tool per file
- agent/ui          agent UI (orb, chat, confirm dialog)
- agent/server      local Express backend, hides the API key, runs the loop
- agent/mocks       stubs for what Vpay adds later (resolveContact, createPaymentLink, postP2POffer)

## Run (local backend)
1. cp .env.example .env  and fill ANTHROPIC_API_KEY and RPC
2. Get RPC from the ARC CLI:  arc-canteen rpc-url --export
3. npm install
4. npm run dev:server
