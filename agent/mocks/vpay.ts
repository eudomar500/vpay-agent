// Stubs for what Vpay (the P2P) adds later. The agent runs and demos with these.
// When Vpay lands, replace each stub with the real call. This file is the integration point.

// resolveContact: resolve a name to an address (real version reads the Vpay agenda or allowlist)
export async function resolveContact(name: string): Promise<string> {
  throw new Error("mock: wire to Vpay agenda");
}

// createPaymentLink: build a USDC collect link or QR (real version uses the Vpay app feature)
export async function createPaymentLink(amount?: string, memo?: string): Promise<string> {
  throw new Error("mock: wire to Vpay payment links");
}

// postP2POffer: publish an offer on the P2PMarket contract (advanced, needs the contract)
export async function postP2POffer(amount: string, rate: string, method: string, memo: string): Promise<string> {
  throw new Error("mock: wire to Vpay P2PMarket contract");
}
