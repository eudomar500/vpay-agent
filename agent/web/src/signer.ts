// Test-only Signer for the browser shell. It implements the contract Signer but
// does NOT sign in the browser: it POSTs the TxRequest to the testhost /api/sign,
// which signs with the .env wallet and returns the TxResult. The private key
// never reaches the browser. In Vpay this is replaced by a Privy browser signer.
// The interface is identical, so integration swaps only this one file.

import type { Signer, TxRequest, TxResult } from "../../core/types";

export const testSigner: Signer = {
  async signAndSend(tx: TxRequest): Promise<TxResult> {
    const response = await fetch("/api/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx),
    });
    if (!response.ok) {
      throw new Error(await readError(response));
    }
    return (await response.json()) as TxResult;
  },
};

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}
