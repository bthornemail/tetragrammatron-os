/**
 * Address Schema Parsing and Validation
 * 
 * Demonstrates parsing 8-byte addresses, extracting schema prefixes,
 * validating against schema, and normalizing addresses.
 */

/**
 * Parse an address string into components
 * @param {string} addrStr - Address in format "R0:R1:R2:R3:R4:R5:R6:R7"
 * @returns {Object|null} - Parsed address or null if invalid
 */
function parseAddr8(addrStr) {
  const parts = addrStr.split(":").map(p => p.trim()).filter(Boolean);
  if (parts.length !== 8) return null;
  
  const bytes = parts.map(p => {
    const v = parseInt(p, 16);
    if (Number.isNaN(v) || v < 0 || v > 255) return null;
    return v;
  });
  
  if (bytes.some(b => b === null)) return null;
  
  const text = parts.map(p => p.toUpperCase().padStart(2, "0")).join(":");
  const realm = bytes[0];
  const prefix40 = `${text.split(":").slice(0, 5).join(":")}::/40`;
  
  return {
    bytes,
    text,
    realm,
    prefix40,
    schemaPrefix: bytes.slice(0, 5),
    instanceBytes: bytes.slice(5, 8)
  };
}

/**
 * Extract schema prefix (R0-R4) from address
 * @param {Object} addr - Parsed address object
 * @returns {number[]} - Array of 5 bytes (R0-R4)
 */
function extractSchemaPrefix(addr) {
  return addr.bytes.slice(0, 5);
}

/**
 * Extract instance bytes (R5-R7) from address
 * @param {Object} addr - Parsed address object
 * @returns {number[]} - Array of 3 bytes (R5-R7)
 */
function extractInstanceBytes(addr) {
  return addr.bytes.slice(5, 8);
}

/**
 * Validate address prefix against schema
 * @param {Object} addr - Parsed address object
 * @param {Object} schema - Schema definition with allowed values per row
 * @returns {boolean} - True if prefix is valid
 */
function validateSchemaPrefix(addr, schema) {
  const prefix = extractSchemaPrefix(addr);
  
  for (let i = 0; i < 5; i++) {
    const rowSpec = schema.rowspec[`R${i}`];
    if (!rowSpec || !rowSpec.fixed) continue;
    
    const allowed = rowSpec.allowed || [];
    if (!allowed.includes(prefix[i])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Normalize address string
 * @param {string} addrStr - Address string (may have inconsistent formatting)
 * @returns {string|null} - Normalized address or null if invalid
 */
function normalizeAddress(addrStr) {
  const addr = parseAddr8(addrStr);
  if (!addr) return null;
  return addr.text;
}

/**
 * Format address as prefix40 notation
 * @param {Object|string} addr - Parsed address object or address string
 * @returns {string|null} - Prefix40 string or null if invalid
 */
function formatPrefix40(addr) {
  const parsed = typeof addr === 'string' ? parseAddr8(addr) : addr;
  if (!parsed) return null;
  return parsed.prefix40;
}

/**
 * Check if address is valid for execution
 * Requires: valid schema prefix
 * @param {Object} addr - Parsed address object
 * @param {Object} schema - Schema definition
 * @returns {Object} - Validation result with status and reason
 */
function validateForExecution(addr, schema) {
  if (!validateSchemaPrefix(addr, schema)) {
    return {
      valid: false,
      reason: "invalid_schema_prefix",
      message: "Schema prefix (R0-R4) is not valid according to address schema"
    };
  }
  
  return {
    valid: true,
    reason: "valid",
    message: "Address is valid for execution"
  };
}

// Example usage:
if (require.main === module) {
  const exampleAddr = "1A:02:04:03:02:7F:11:C7";
  const addr = parseAddr8(exampleAddr);
  
  console.log("Parsed address:", addr);
  console.log("Schema prefix:", extractSchemaPrefix(addr));
  console.log("Instance bytes:", extractInstanceBytes(addr));
  console.log("Prefix40:", formatPrefix40(addr));
  
  // Example schema (simplified)
  const exampleSchema = {
    rowspec: {
      R0: { fixed: true, allowed: [0x00, 0x01, 0x1A] },
      R1: { fixed: true, allowed: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07] },
      R2: { fixed: true, allowed: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07] },
      R3: { fixed: true, allowed: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06] },
      R4: { fixed: true, allowed: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06] }
    }
  };
  
  const validation = validateForExecution(addr, exampleSchema);
  console.log("Validation result:", validation);
}

module.exports = {
  parseAddr8,
  extractSchemaPrefix,
  extractInstanceBytes,
  validateSchemaPrefix,
  normalizeAddress,
  formatPrefix40,
  validateForExecution
};

