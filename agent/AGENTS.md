# Venai Agent, context for the coding agent

Venai is the AI payment agent for Vpay on Arc. Build it so it runs and demos on its own,
without the P2P. Anything that depends on Vpay is behind a stub in agent/mocks/.

## Non-negotiable rules
- Native USDC on Arc has 18 decimals. Use parseEther for USDC, never 1e6. Other tokens
  (USDT, EURC) are ERC-20 with their own decimals.
- Every write tool (moves funds) pauses the loop and returns a plan for user confirmation.
  Read tools execute directly and feed the result back to the LLM.
- The LLM proposes, the user signs. Signing is always client-side with the user's wallet.
  The backend reasons only; it never touches keys.
- The Anthropic API key lives only in the backend.
- Validate every write arg before proposing: address checksum, amount above zero,
  amount at most the balance. Never trust the LLM raw numbers without re-checking.

## Engineering standard
Write like a senior engineer. Small, single-responsibility functions. Clear names.
Handle errors explicitly; never swallow them. No dead code, no speculative abstractions,
no commented-out blocks left behind. Prefer readable over clever. Type everything.

## No AI traces (strict)
Hard requirement across all code, comments, commit messages, README, and UI text.
- English only.
- Comments explain why, not what the code obviously does. No narration.
- No em-dashes. No en-dashes. Use a plain hyphen or rewrite the sentence.
- No arrows in prose: do not use the hyphen-greater-than sequence or the fat-arrow in
  comments or text. The fat-arrow in code is fine where the language requires it.
- No emojis anywhere.
- No celebratory or marketing tone. Avoid filler words like Lets, Here we, Great,
  Note that, powerful, seamless, robust, simply, just.
- No section headers padded with symbols. No decorative banners.
- Commit messages: imperative, plain, lowercase subject. Example: add sendUSDC validation.
  No conventional-commit emojis.
- If a sentence reads like a model wrote it, rewrite it until it does not.

## Tools (MVP core)
read:  getBalance, getTxHistory, getSpending, resolveContact
write: sendUSDC, splitPayment, createPaymentLink
Self-contained (no Vpay): getBalance, getTxHistory, getSpending, sendUSDC, splitPayment.
Vpay-dependent (via mocks): resolveContact, createPaymentLink, postP2POffer.
Secondary (later): swapTokens (App Kit Swap), createWallet (AA provider).

## Build order
1. core loop and read tools
2. sendUSDC and the confirmation gate
3. UI
4. chaining and splitPayment
Read the spec section 8 for the loop, section 9 for the tool registry.
