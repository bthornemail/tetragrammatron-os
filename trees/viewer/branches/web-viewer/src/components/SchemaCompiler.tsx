import React, { useMemo, useState } from "react";
import { compileSchemaBin } from "../lib/schema-compile";
import { SchemaJson } from "../lib/schema-jsonl";
import {
  clearKeypairLS,
  generateEd25519,
  loadKeypairLS,
  saveKeypairLS,
  signBytes,
  u8ToHex,
  verifyBytes
} from "../lib/crypto-ed25519";

function downloadBin(buf: ArrayBuffer, name: string) {
  const blob = new Blob([buf], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function download(buf: ArrayBuffer | Uint8Array | string, name: string, type: string) {
  const blob =
    typeof buf === "string"
      ? new Blob([buf], { type })
      : buf instanceof Uint8Array
      ? new Blob([buf], { type })
      : new Blob([buf], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function toU8(buf: ArrayBuffer): Uint8Array {
  return new Uint8Array(buf);
}
export function SchemaCompiler({ schemas }: { schemas: Map<string, SchemaJson> }) {
  const list = useMemo(() => [...schemas.entries()], [schemas]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  
  // if (list.length === 0) return null;
  if (list.length === 0) return <div style={{ position: "absolute", right: 12, top: 12, zIndex: 10, border: "1px solid white", padding: 12, borderRadius: 12 }}>
  No Schemas Loaded
  </div>;
  async function ensureKey(name: string) {
    let kp = loadKeypairLS(name);
    if (!kp) {
      kp = await generateEd25519();
      saveKeypairLS(name, kp);
    }
    return kp;
  }
  return (
    <div style={{
      position: "absolute",
      right: 12,
      top: 12,
      zIndex: 10,
      background: "rgba(0,0,0,0.6)",
      color: "white",
      padding: "10px 12px",
      borderRadius: 10,
      width: 420,
      fontSize: 13
    }}>
      <div style={{ fontWeight: "bold", marginBottom: 6 }}>
        Schema Compiler + Signer (JSONL → BIN + SIG)
      </div>

      <div style={{ opacity: 0.85, marginBottom: 8 }}>
        Keys stored in <code>localStorage</code> (dev-only). Use exports before production.
      </div>

      {busy && <div style={{ marginBottom: 8 }}>working…</div>}
      {msg && <div style={{ marginBottom: 8, opacity: 0.9 }}>{msg}</div>}

      {list.map(([key, s]) => (
        <div key={key} style={{
          marginBottom: 8,
          padding: 8,
          borderRadius: 8,
          background: "rgba(255,255,255,0.05)"
        }}>
          <div><b>{key}</b></div>
          <div>class: {s.schemaClass}, epoch: {s.epoch}, prefixes: {s.allowedPrefixes.length}</div>

          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                const buf = compileSchemaBin(s);
                download(buf, `${key}.bin`, "application/octet-stream");
              }}
            >
              download .bin
            </button>

            <button
              onClick={async () => {
                setBusy(true); setMsg("");
                try {
                  // Keying policy (triad-consistent):
                  // - public: key name "public:<realm>"
                  // - protected: key name "protected:<realm>" (group key)
                  // - private: allow but you may choose to disable
                  const keyName =
                    s.schemaClass === "public" ? `public:${s.realm.toString(16).toUpperCase().padStart(2,"0")}` :
                    s.schemaClass === "protected" ? `protected:${s.realm.toString(16).toUpperCase().padStart(2,"0")}` :
                    `private:${s.realm.toString(16).toUpperCase().padStart(2,"0")}`;

                  const kp = await ensureKey(keyName);

                  const bin = compileSchemaBin(s);
                  const binU8 = toU8(bin);

                  const sig = signBytes(kp, binU8);
                  const ok = verifyBytes(kp.publicKey, binU8, sig);
                  if (!ok) throw new Error("signature self-check failed");

                  const sigJson = JSON.stringify({
                    k: "schema.sig",
                    v: {
                      realm: s.realm.toString(16).toUpperCase().padStart(2,"0"),
                      schema_hash: s.schemaHash,
                      schema_class: s.schemaClass,
                      epoch: s.epoch,
                      abi: 2,
                      signed_over: `${key}.bin`,
                      pubkey_ed25519: u8ToHex(kp.publicKey),
                      sig_ed25519: u8ToHex(sig)
                    }
                  }, null, 2);

                  download(sigJson, `${key}.sig.json`, "application/json");

                  setMsg(`signed OK with key ${keyName} (pubkey ${u8ToHex(kp.publicKey).slice(0,12)}…)`);
                } catch (e: any) {
                  setMsg(`sign failed: ${String(e?.message ?? e)}`);
                } finally {
                  setBusy(false);
                }
              }}
            >
              download .sig.json
            </button>

            <button
              onClick={async () => {
                setBusy(true); setMsg("");
                try {
                  const keyName =
                    s.schemaClass === "public" ? `public:${s.realm.toString(16).toUpperCase().padStart(2,"0")}` :
                    s.schemaClass === "protected" ? `protected:${s.realm.toString(16).toUpperCase().padStart(2,"0")}` :
                    `private:${s.realm.toString(16).toUpperCase().padStart(2,"0")}`;
                  const kp = await ensureKey(keyName);
                  const pk = u8ToHex(kp.publicKey);
                  download(pk + "", `${keyName}.pubkey.hex`, "text/plain");
                  setMsg(`exported pubkey for ${keyName}`);
                } finally {
                  setBusy(false);
                }
              }}
            >
              export pubkey
            </button>

            <button
              onClick={() => {
                const keyName =
                  s.schemaClass === "public" ? `public:${s.realm.toString(16).toUpperCase().padStart(2,"0")}` :
                  s.schemaClass === "protected" ? `protected:${s.realm.toString(16).toUpperCase().padStart(2,"0")}` :
                  `private:${s.realm.toString(16).toUpperCase().padStart(2,"0")}`;
                clearKeypairLS(keyName);
                setMsg(`cleared key ${keyName}`);
              }}
            >
              clear key
            </button>
          </div>
          {/* <button
            style={{ marginTop: 4 }}
            onClick={() => {
              const buf = compileSchemaBin(s);
              downloadBin(buf, `${key}.bin`);
            }}
          >
            download .bin
          </button> */}
        </div>
      ))}
    </div>
  );
}