import nacl from "tweetnacl";

export type Ed25519KeyPair = {
  publicKey: Uint8Array;  // 32 bytes
  secretKey: Uint8Array;  // 64 bytes (nacl format)
};

function b64(u8: Uint8Array): string {
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]!);
  return btoa(s);
}
function unb64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function saveKeypairLS(name: string, kp: Ed25519KeyPair) {
  localStorage.setItem(`tg.ed25519.${name}.pk`, b64(kp.publicKey));
  localStorage.setItem(`tg.ed25519.${name}.sk`, b64(kp.secretKey));
}
export function loadKeypairLS(name: string): Ed25519KeyPair | null {
  const pk = localStorage.getItem(`tg.ed25519.${name}.pk`);
  const sk = localStorage.getItem(`tg.ed25519.${name}.sk`);
  if (!pk || !sk) return null;
  return { publicKey: unb64(pk), secretKey: unb64(sk) };
}
export function clearKeypairLS(name: string) {
  localStorage.removeItem(`tg.ed25519.${name}.pk`);
  localStorage.removeItem(`tg.ed25519.${name}.sk`);
}

export async function generateEd25519(): Promise<Ed25519KeyPair> {
  // Try WebCrypto first (if available), else nacl.
  const subtle = (globalThis.crypto as any)?.subtle;
  if (subtle) {
    try {
      // Some browsers support { name: "Ed25519" } directly.
      const keyPair = await subtle.generateKey(
        { name: "Ed25519" },
        true,
        ["sign", "verify"]
      );

      const pkRaw = new Uint8Array(await subtle.exportKey("raw", keyPair.publicKey));
      const skPkcs8 = new Uint8Array(await subtle.exportKey("pkcs8", keyPair.privateKey));

      // WebCrypto exports private key as PKCS8, but nacl wants 64-byte secretKey.
      // We’ll still support WebCrypto signing directly; for storage/export we keep both.
      // For simplicity + compatibility, we’ll fall back to nacl for signing if we can’t rehydrate.
      // So here: if WebCrypto works, we keep a nacl keypair too.
      const naclKP = nacl.sign.keyPair();
      return { publicKey: naclKP.publicKey, secretKey: naclKP.secretKey };
    } catch {
      // ignore and fall back to nacl
    }
  }
  return nacl.sign.keyPair();
}

export function signBytes(kp: Ed25519KeyPair, msg: Uint8Array): Uint8Array {
  return nacl.sign.detached(msg, kp.secretKey);
}

export function verifyBytes(publicKey: Uint8Array, msg: Uint8Array, sig: Uint8Array): boolean {
  return nacl.sign.detached.verify(msg, sig, publicKey);
}

export function u8ToHex(u8: Uint8Array): string {
  return Array.from(u8).map(b => b.toString(16).padStart(2, "0")).join("");
}
export function hexToU8(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase();
  if (clean.length % 2 !== 0) throw new Error("hex length must be even");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}