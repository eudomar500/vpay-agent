// Local Express backend. Hides the Anthropic API key and runs the agent loop.
// One route POST /api/agent: receives message and history, runs the loop,
// returns { type: "final" } or { type: "needs_confirmation", plan }.
// Never signs, never touches keys. On-chain execution happens in the frontend.
// TODO: implement the Express server reading PORT and ANTHROPIC_API_KEY from env.
export {};
