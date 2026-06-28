// Tool resolveContact (read). Param: name.
// Vpay-dependent: resolves a name to an address through the Vpay agenda.
// The mock throws until Vpay lands; that error surfaces to the model, which
// reports that the contact directory is not available yet. Never invent an address.

import { resolveContact as resolveContactFromVpay } from "../../mocks/vpay";

export type ResolveContactInput = { name: string };

export type ResolveContactResult = { name: string; address: string };

export async function resolveContact(input: ResolveContactInput): Promise<ResolveContactResult> {
  const address = await resolveContactFromVpay(input.name);
  return { name: input.name, address };
}
