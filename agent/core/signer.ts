// Signer abstraction for the integration contract with the container app (Vpay).
// The agent never signs. It receives a signAndSend callback from outside and
// stays agnostic to how signing happens: in test it wraps the .env wallet, in
// production Vpay implements it with Privy.

import { getAddress } from "viem";
import { buildWalletClient, publicClient } from "./chain";

export type SignerTx = { to: string; value: bigint };

export type Signer = {
  signAndSend(tx: SignerTx): Promise<string>;
};

// Test-only signer, replaced by the container's signer (Privy) in production.
// It signs with the .env TEST_PRIVATE_KEY wallet and resolves after the receipt
// confirms, returning the transaction hash.
export function buildTestSigner(): Signer {
  const walletClient = buildWalletClient();
  return {
    async signAndSend(tx) {
      const hash = await walletClient.sendTransaction({
        to: getAddress(tx.to),
        value: tx.value,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
  };
}
