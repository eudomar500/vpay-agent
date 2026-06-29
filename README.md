# Venai

Venai is a natural-language payment agent on Arc, Circle's L1 with native USDC. It is part of the Vpay project: Vpay is the P2P payments product, Venai is the agent layer it embeds.

## What it does

The agent reads a plain-language request, plans the work, runs on-chain reads on its own, and proposes any fund-moving action as a plan that the user must confirm before it executes. The LLM proposes; the user signs. The backend reasons and never holds a key.

Capabilities, with one example request each:

- Check balance: "What is my USDC balance?"
- Transaction history: "Show my last 5 transactions."
- Spending over a period: "How much have I spent this week?"
- Send USDC: "Send 25 USDC to 0xRecipient."
- Split a payment across recipients in one confirmation: "Split 30 USDC equally among 0xA, 0xB, and 0xC."
- Swap tokens (USDC, EURC, cirBTC) through Circle App Kit: "Swap 1 USDC for EURC."

Reads (balance, history, spending) run inline and feed their result back to the model. Writes (send, split, swap) never run during reasoning. They return a confirmation plan, and execution happens only after the user confirms. Contact resolution by name is defined but backed by a Vpay stub that fails until Vpay provides the directory, so the agent reports it as unavailable rather than inventing an address.

## Architecture

The agent has two halves that run in different places.

`runAgent` is the reasoning half. It calls the LLM and runs on-chain reads. It runs in a backend, holds the Anthropic API key, and never signs. Given a user message it returns either a final text answer or a `needs_confirmation` result carrying a plan.

`executePlan` is the execution half. It takes a confirmed plan and a signer and runs each step. It runs where the wallet lives, which is the frontend with the user's wallet. It does not hold the API key and does not reason.

The agent core in `agent/core` is a framework-agnostic ESM module with no React. Vpay imports it directly. The boundary is a small set of types in `agent/core/types.ts`:

- `AgentContext` carries the read configuration: `rpcUrl`, `userAddress`, `chainId`, and contract addresses.
- `Signer` is the signing callback the host provides: `signAndSend(tx)` and an optional `signAndSendBatch(txs)` for a single confirmation over several transfers.
- `PlanStep` is a transfer step `{ title, tx: TxRequest }`. `SwapStep` is a swap step, which is not a transfer and so does not fit `TxRequest`. A plan is a list of either kind.
- `TxRequest` is `{ to, value, data, description }` where `value` is a human decimal string. `TxResult` is `{ hash, success, error }`.

The module surface is `runAgent`, `executePlan`, and these types, exported from `agent/core/index.ts`. The agent emits human decimal amounts in plans; the signer converts to base units when it builds the transaction.

## Repository layout

- `agent/core` the importable module: the loop (`loop.ts`, `runAgent`), execution (`execute.ts`, `executePlan`), the tool registry and one file per tool in `tools/`, the Anthropic tool schemas, argument validation, the injected chain context, the system prompt, and the contract types.
- `agent/testhost` a disposable local backend. An Express server injects a test `AgentContext` and a test `Signer` and swap executor built from the `.env` wallet, and exposes HTTP for testing: `POST /api/agent`, `POST /api/confirm`, `POST /api/sign`, `POST /api/swap`, and `GET /health`.
- `agent/web` a disposable React and Vite test shell that drives the agent from a browser: a chat, a plan confirmation screen, and a result view.
- `agent/mocks` stubs for the parts Vpay provides later (contact resolution, payment links, P2P offers). They fail until wired.
- `agent/ui` an empty placeholder for the production UI.

## Circle and Arc usage

On Arc, USDC is the native gas token with 18 decimals. Sending USDC is a native value transfer encoded with `parseEther`, not a 6-decimal ERC-20 amount and not `1e6`. Gas is paid in USDC. Token swaps between USDC, EURC, and cirBTC on Arc Testnet go through Circle App Kit Swap (`@circle-fin/app-kit` with `@circle-fin/adapter-viem-v2`). App Kit is imported only in the test host swap executor; the agent core never imports it.

## Run the test locally

Copy `.env.example` to `.env` and fill these variables. Values are omitted on purpose.

```
RPC=                 # authenticated Arc RPC, from the ARC CLI: arc-canteen rpc-url --export
USER_ADDRESS=        # address the agent reads balances and history for
ANTHROPIC_API_KEY=   # backend only
ANTHROPIC_MODEL=     # for example claude-sonnet-4-6
TEST_PRIVATE_KEY=    # test-only signing wallet for the test host
CIRCLE_KIT_KEY=      # Circle App Kit key for swaps, from console.circle.com
```

Then install and run the two processes:

```
npm install
npm run dev:server   # test host backend on PORT, default 8787
npm run dev:web      # Vite dev server, proxies /api to the test host
```

Open the URL Vite prints, default `http://localhost:5173`, and send a request. The test host and the `.env` wallet are test-only. In production Vpay hosts the backend and the user signs with Privy, so neither the test host nor `TEST_PRIVATE_KEY` is used.

## Integration with Vpay

Vpay imports `agent/core` and supplies its own `AgentContext` for reads and a Privy-backed `Signer` for signing on the frontend. Vpay hosts the reasoning backend and keeps the Anthropic key there. The test host and web shell in this repository are disposable scaffolding for local testing and are replaced by Vpay and Privy in production.

## Security

Keys live only in the backend environment. The Anthropic key, the test signing key, and the Circle kit key are read from `.env` in the backend and the test host, never in the browser. The web shell delegates signing and swapping to the test host over HTTP, so no key reaches the client. `.env` is excluded by `.gitignore` and is never committed; only `.env.example`, with empty values, is tracked.

## On-chain evidence

All transactions below ran on Arc Testnet and confirmed in under one second.

- Send USDC: https://testnet.arcscan.app/tx/0xa793972e2087b7fc6f9d601438e7516ba5beb5a3a70052efbf0f44c5f31a391e
- Split a payment across three recipients in one confirmation:
  - https://testnet.arcscan.app/tx/0x6ac24d90c8809ad15e4cbc50830439811c94e0240b28ebf44a8a0c18c28bc8b8
  - https://testnet.arcscan.app/tx/0xe62f3ba184c06457c7dc347d8075475df2e66783039aaf0a9dc035502b3c0313
  - https://testnet.arcscan.app/tx/0xf91ca793150756a561a132a10330326fbf710a5991139c4fc4eccdd063db4abe
- Swap USDC to EURC via Circle App Kit: https://testnet.arcscan.app/tx/0x2d9e2f4b3a1d7275fb3b8dff3dada31d67e11b2add5f3060c5f31c69f2b21a7e
