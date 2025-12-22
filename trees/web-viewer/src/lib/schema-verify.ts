import { verifyBytes, hexToU8 } from "./crypto-ed25519";

export function verifySchemaSig(bin: Uint8Array, sigJson: any): boolean {
  const v = sigJson?.v;
  const pk = hexToU8(v.pubkey_ed25519);
  const sig = hexToU8(v.sig_ed25519);
  return verifyBytes(pk, bin, sig);
}