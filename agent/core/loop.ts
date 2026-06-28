// Agent loop (spec section 8). Runs in the backend.
// Read tools execute directly and feed results back to the LLM.
// Write tools pause the loop and return { type: "needs_confirmation", plan }.
// Max N iterations (for example 8). Returns { type: "final", text } when no more tool calls.

// TODO: implement runAgent(userMessage, conversationHistory)
export {};
