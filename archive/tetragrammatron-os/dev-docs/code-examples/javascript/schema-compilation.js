/**
 * Schema Compilation: JSONL → Binary
 * 
 * Demonstrates compiling address schema from JSONL format to compact binary
 * format for embedded nodes. Includes schema hash computation and validation.
 */

const crypto = require('crypto');

/**
 * Parse prefix40 string to bytes
 * @param {string} prefix40 - Format "AA:BB:CC:DD:EE::/40"
 * @returns {number[]} - Array of 5 bytes
 */
function parsePrefix40(prefix40) {
  const parts = prefix40.split("::")[0].split(":");
  if (parts.length !== 5) {
    throw new Error(`invalid prefix40: ${prefix40}`);
  }
  
  const bytes = parts.map(p => {
    const v = parseInt(p, 16);
    if (Number.isNaN(v) || v < 0 || v > 255) {
      throw new Error(`invalid byte ${p} in ${prefix40}`);
    }
    return v;
  });
  
  return bytes;
}

/**
 * Compute schema hash (SHA-256, truncated to 16 bytes)
 * @param {Object} schema - Schema definition object
 * @returns {Buffer} - 16-byte hash
 */
function computeSchemaHash(schema) {
  // Canonicalize: sort allowed values, normalize structure
  const canonical = {
    rowspec: {}
  };
  
  for (let i = 0; i < 8; i++) {
    const key = `R${i}`;
    const row = schema.rowspec[key] || {};
    canonical.rowspec[key] = {
      fixed: row.fixed || false,
      allowed: (row.allowed || []).slice().sort((a, b) => a - b)
    };
  }
  
  const json = JSON.stringify(canonical);
  const hash = crypto.createHash('sha256').update(json, 'utf8').digest();
  return hash.slice(0, 16); // Truncate to 16 bytes
}

/**
 * Convert schema class string to byte
 * @param {string} cls - "private", "protected", or "public"
 * @returns {number} - 0, 1, or 2
 */
function classToByte(cls) {
  if (cls === "private") return 0;
  if (cls === "protected") return 1;
  if (cls === "public") return 2;
  throw new Error(`invalid schema class: ${cls}`);
}

/**
 * Compile schema to binary (ABI v2)
 * @param {Object} schema - Schema definition from JSONL
 * @returns {Buffer} - Binary schema data
 */
function compileSchemaBin(schema) {
  const MAGIC = Buffer.from("TADR", "ascii");
  const ABI_VERSION = 2;
  const ROWS = 8;
  const SCHEMA_ROWS = 5;
  
  const schemaClass = classToByte(schema.schema_class || "public");
  const realm = parseInt(schema.realm, 16);
  const epoch = schema.epoch || 0;
  const allowedPrefixes = schema.allowed_prefixes || [];
  
  // Calculate size: header (13 bytes) + prefixes (5 bytes each)
  const totalSize = 13 + (allowedPrefixes.length * 5);
  const buf = Buffer.alloc(totalSize);
  let offset = 0;
  
  // Magic (4 bytes)
  MAGIC.copy(buf, offset);
  offset += 4;
  
  // ABI version (2 bytes, little-endian)
  buf.writeUInt16LE(ABI_VERSION, offset);
  offset += 2;
  
  // Rows (1 byte)
  buf.writeUInt8(ROWS, offset);
  offset += 1;
  
  // Schema rows (1 byte)
  buf.writeUInt8(SCHEMA_ROWS, offset);
  offset += 1;
  
  // Schema class (1 byte)
  buf.writeUInt8(schemaClass, offset);
  offset += 1;
  
  // Realm (1 byte)
  buf.writeUInt8(realm & 0xFF, offset);
  offset += 1;
  
  // Epoch (2 bytes, little-endian)
  buf.writeUInt16LE(epoch & 0xFFFF, offset);
  offset += 2;
  
  // Prefix count (1 byte)
  buf.writeUInt8(allowedPrefixes.length & 0xFF, offset);
  offset += 1;
  
  // Allowed prefixes (5 bytes each)
  for (const prefix40 of allowedPrefixes) {
    const bytes = parsePrefix40(prefix40);
    for (const b of bytes) {
      buf.writeUInt8(b, offset);
      offset += 1;
    }
  }
  
  return buf;
}

/**
 * Load schema from binary
 * @param {Buffer} bin - Binary schema data
 * @returns {Object} - Parsed schema object
 */
function loadSchemaBin(bin) {
  if (bin.length < 13) {
    throw new Error("binary too short");
  }
  
  const magic = bin.slice(0, 4).toString("ascii");
  if (magic !== "TADR") {
    throw new Error(`invalid magic: ${magic}`);
  }
  
  const abi = bin.readUInt16LE(4);
  if (abi !== 2) {
    throw new Error(`unsupported ABI version: ${abi}`);
  }
  
  const rows = bin.readUInt8(6);
  const schemaRows = bin.readUInt8(7);
  const schemaClassByte = bin.readUInt8(8);
  const realm = bin.readUInt8(9);
  const epoch = bin.readUInt16LE(10);
  const prefixCount = bin.readUInt8(12);
  
  const schemaClass = schemaClassByte === 0 ? "private" :
                     schemaClassByte === 1 ? "protected" : "public";
  
  const allowedPrefixes = [];
  let offset = 13;
  
  for (let i = 0; i < prefixCount; i++) {
    const bytes = Array.from(bin.slice(offset, offset + 5));
    const prefix40 = bytes.map(b => b.toString(16).toUpperCase().padStart(2, "0")).join(":") + "::/40";
    allowedPrefixes.push(prefix40);
    offset += 5;
  }
  
  return {
    realm: realm.toString(16).toUpperCase().padStart(2, "0"),
    schema_class: schemaClass,
    epoch,
    allowed_prefixes: allowedPrefixes
  };
}

/**
 * Validate schema binary
 * @param {Buffer} bin - Binary schema data
 * @param {string} expectedHash - Expected schema hash (hex)
 * @returns {Object} - Validation result
 */
function validateSchemaBin(bin, expectedHash) {
  try {
    const schema = loadSchemaBin(bin);
    const computedHash = computeSchemaHash(schema);
    const hashHex = computedHash.toString('hex');
    
    return {
      valid: hashHex === expectedHash.toLowerCase(),
      computedHash: hashHex,
      expectedHash: expectedHash.toLowerCase(),
      schema
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

// Example usage:
if (require.main === module) {
  // Example schema from JSONL
  const exampleSchema = {
    realm: "1A",
    schema_hash: "a9f3c21d9e4b0a77d1a5f0b3a9e7c2ff",
    schema_class: "public",
    epoch: 3,
    rows: 8,
    schema_rows: 5,
    allowed_prefixes: [
      "1A:02:04:03:02::/40",
      "1A:02:04:03:03::/40"
    ],
    rowspec: {
      R0: { fixed: true, allowed: [0x1A] },
      R1: { fixed: true, allowed: [0x02] },
      R2: { fixed: true, allowed: [0x04] },
      R3: { fixed: true, allowed: [0x03] },
      R4: { fixed: true, allowed: [0x02, 0x03] }
    }
  };
  
  console.log("Compiling schema to binary...");
  const bin = compileSchemaBin(exampleSchema);
  console.log(`Binary size: ${bin.length} bytes`);
  console.log(`Binary (hex): ${bin.toString('hex')}`);
  
  console.log("\nLoading schema from binary...");
  const loaded = loadSchemaBin(bin);
  console.log("Loaded schema:", JSON.stringify(loaded, null, 2));
  
  console.log("\nComputing schema hash...");
  const hash = computeSchemaHash(exampleSchema);
  console.log(`Schema hash: ${hash.toString('hex')}`);
}

module.exports = {
  parsePrefix40,
  computeSchemaHash,
  classToByte,
  compileSchemaBin,
  loadSchemaBin,
  validateSchemaBin
};

