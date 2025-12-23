import { hexToU8 } from "./crypto-ed25519";

export type TrustConfig = {
  // Map: realm (hex string) -> array of trusted pubkeys (hex strings)
  trustedPubkeys: Map<string, string[]>;
  // Map: realm -> require signature even for private schemas
  requirePrivateSig: Map<string, boolean>;
};

// Default trust configuration
// In production, this should be loaded from a config file or environment
export function getDefaultTrustConfig(): TrustConfig {
  const config: TrustConfig = {
    trustedPubkeys: new Map(),
    requirePrivateSig: new Map(),
  };

  // Example: Trust a specific pubkey for realm 1A (ULP)
  // In production, load from /public/trust-config.json or similar
  config.trustedPubkeys.set("1A", [
    // Add trusted pubkeys here as hex strings
    // Example: "a1b2c3d4e5f6..."
  ]);

  // By default, don't require signatures for private schemas
  config.requirePrivateSig.set("1A", false);

  return config;
}

// Load trust config from JSON file
export async function loadTrustConfig(url: string = "/trust-config.json"): Promise<TrustConfig> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Trust config not found at ${url}, using defaults`);
      return getDefaultTrustConfig();
    }
    const obj = await res.json();
    const config: TrustConfig = {
      trustedPubkeys: new Map(),
      requirePrivateSig: new Map(),
    };

    if (obj.trusted_pubkeys) {
      for (const [realm, pubkeys] of Object.entries(obj.trusted_pubkeys)) {
        config.trustedPubkeys.set(
          realm.toUpperCase(),
          Array.isArray(pubkeys) ? pubkeys.map((p: string) => p.toLowerCase()) : []
        );
      }
    }

    if (obj.require_private_sig) {
      for (const [realm, require] of Object.entries(obj.require_private_sig)) {
        config.requirePrivateSig.set(realm.toUpperCase(), Boolean(require));
      }
    }

    return config;
  } catch (e) {
    console.warn(`Failed to load trust config: ${e}, using defaults`);
    return getDefaultTrustConfig();
  }
}

// Check if a pubkey is trusted for a realm
export function isPubkeyTrusted(
  config: TrustConfig,
  realm: string,
  pubkeyHex: string
): boolean {
  const realmUpper = realm.toUpperCase();
  const trusted = config.trustedPubkeys.get(realmUpper);
  if (!trusted || trusted.length === 0) {
    // No pinned pubkeys = accept any (for now, can be made stricter)
    return true;
  }
  return trusted.includes(pubkeyHex.toLowerCase());
}

