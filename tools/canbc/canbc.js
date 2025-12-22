import fs from 'node:fs';
import crypto from 'node:crypto';

export const FLAGS = {
  HAS_DEBUG: 1 << 0,
  HAS_HASHES: 1 << 1,
  HAS_SIGNATURE: 1 << 2,
  HAS_SYMBOLS: 1 << 3,
};

export const SECTION = {
  HASHES: 0x0001,
  DEBUG: 0x0002,
  SYMBOLS: 0x0003,
  SIGNATURE: 0x0004,
};

export function parseAddr(addrStr) {
  if (typeof addrStr !== 'string') {
    throw new Error('addr must be string');
  }
  const parts = addrStr.split(':').map((chunk) => chunk.trim()).filter(Boolean);
  if (parts.length !== 8) {
    throw new Error(`addr must have 8 segments: ${addrStr}`);
  }
  const bytes = new Uint8Array(8);
  for (let i = 0; i < parts.length; i += 1) {
    const value = Number.parseInt(parts[i], 16);
    if (!Number.isFinite(value) || value < 0 || value > 255) {
      throw new Error(`invalid addr segment: ${parts[i]}`);
    }
    bytes[i] = value;
  }
  return bytes;
}

export function formatAddr(bytes) {
  if (!(bytes instanceof Uint8Array) && !Buffer.isBuffer(bytes)) {
    throw new Error('bytes must be Uint8Array or Buffer');
  }
  const arr = Buffer.from(bytes);
  return Array.from(arr).map((value) => value.toString(16).padStart(2, '0').toUpperCase()).join(':');
}

function u16le(value) {
  const buf = Buffer.allocUnsafe(2);
  buf.writeUInt16LE(value & 0xffff, 0);
  return buf;
}

function u32le(value) {
  const buf = Buffer.allocUnsafe(4);
  buf.writeUInt32LE(value >>> 0, 0);
  return buf;
}

export function sha256File(path) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(path));
  return hash.digest();
}

export function buildHashesSection(entries) {
  const chunks = [];
  for (const entry of entries) {
    const kind = entry.kind & 0xff;
    const alg = (entry.alg ?? 1) & 0xff;
    const hash = entry.hash;
    if (!Buffer.isBuffer(hash) || hash.length !== 32) {
      throw new Error('expected 32-byte sha256 hash');
    }
    chunks.push(Buffer.from([kind, alg, hash.length]));
    chunks.push(hash);
  }
  return Buffer.concat(chunks);
}

export function writeCanbc({
  outPath,
  addrBytes,
  mode,
  admissibleRule,
  flags = 0,
  codeBytes,
  constBytes = Buffer.alloc(0),
  sections = [],
}) {
  if (!outPath) {
    throw new Error('outPath required');
  }
  if (!(addrBytes instanceof Uint8Array) || addrBytes.length !== 8) {
    throw new Error('addrBytes must be Uint8Array(8)');
  }
  if (!Buffer.isBuffer(codeBytes)) {
    throw new Error('codeBytes must be Buffer');
  }
  if (!Buffer.isBuffer(constBytes)) {
    throw new Error('constBytes must be Buffer');
  }

  const header = Buffer.concat([
    Buffer.from('CANBC1', 'ascii'),
    Buffer.from([1, 0]),
    Buffer.from(addrBytes),
    Buffer.from([mode & 0xff, admissibleRule & 0xff]),
    u16le(flags),
    u32le(codeBytes.length),
    u32le(constBytes.length),
    u32le(sections.length),
  ]);

  if (header.length !== 32) {
    throw new Error('header must be 32 bytes');
  }

  const tlv = [];
  for (const section of sections) {
    if (!Buffer.isBuffer(section.payload)) {
      throw new Error('section payload must be Buffer');
    }
    tlv.push(u16le(section.tag & 0xffff));
    tlv.push(u32le(section.payload.length));
    tlv.push(section.payload);
  }

  const out = Buffer.concat([header, codeBytes, constBytes, ...tlv]);
  fs.writeFileSync(outPath, out);
}

export function readCanbc(pathStr) {
  const buf = fs.readFileSync(pathStr);
  if (buf.length < 32) {
    throw new Error('invalid canbc file');
  }
  const magic = buf.subarray(0, 6).toString('ascii');
  if (magic !== 'CANBC1') {
    throw new Error('bad magic');
  }
  const vMajor = buf.readUInt8(6);
  const vMinor = buf.readUInt8(7);
  if (vMajor !== 1) {
    throw new Error(`unsupported version ${vMajor}.${vMinor}`);
  }
  const addr = buf.subarray(8, 16);
  const mode = buf.readUInt8(16);
  const admissibleRule = buf.readUInt8(17);
  const flags = buf.readUInt16LE(18);
  const codeLen = buf.readUInt32LE(20);
  const constLen = buf.readUInt32LE(24);
  const sectionCount = buf.readUInt32LE(28);

  let offset = 32;
  const codeBytes = buf.subarray(offset, offset + codeLen);
  offset += codeLen;
  const constBytes = buf.subarray(offset, offset + constLen);
  offset += constLen;

  const sections = [];
  for (let i = 0; i < sectionCount; i += 1) {
    const tag = buf.readUInt16LE(offset);
    offset += 2;
    const len = buf.readUInt32LE(offset);
    offset += 4;
    const payload = buf.subarray(offset, offset + len);
    offset += len;
    sections.push({ tag, payload: Buffer.from(payload) });
  }

  return {
    version: `${vMajor}.${vMinor}`,
    addr: Buffer.from(addr),
    mode,
    admissibleRule,
    flags,
    codeBytes: Buffer.from(codeBytes),
    constBytes: Buffer.from(constBytes),
    sections,
  };
}
