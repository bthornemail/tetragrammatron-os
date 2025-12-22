export const MODE = {
  PRIVATE7: 0x07,
  PUBLIC4: 0x04,
  PARITY: 0x02,
  PRIME: 0x03,
};

export const RULE = {
  EXCEPT6: 0x01,
  SET4: 0x02,
  CUSTOM: 0x03,
};

export const OP = {
  NOP: 0x00,
  HALT: 0x01,

  MOV: 0x10,
  LOAD8: 0x11,
  LOAD16: 0x12,
  LOAD32: 0x13,

  ADD: 0x20,
  SUB: 0x21,
  AND: 0x22,
  OR: 0x23,
  XOR: 0x24,

  MOD8: 0x30,
  ADMISS_EXCEPT6: 0x31,
  MAP_PARITY: 0x32,
  MAP_PRIME8: 0x33,

  CMP8: 0x40,
  JZ: 0x41,
  JNZ: 0x42,
  JMP: 0x43,

  EMIT8: 0x50,
  EMITREGS: 0x51,

  LOADADDR8: 0x60,
  HASHREGS: 0x61,
};

export function isPrime8(value) {
  const x = value & 0xff;
  if (x < 2) return false;
  for (let i = 2; i * i <= x; i += 1) {
    if (x % i === 0) return false;
  }
  return true;
}

function pack2(a, b) {
  return ((b & 0x0f) << 4) | (a & 0x0f);
}

function unpack2(byte) {
  return [byte & 0x0f, (byte >> 4) & 0x0f];
}

function parseReg(token) {
  const match = /^r(\d+)$/i.exec(token);
  if (!match) throw new Error(`invalid register ${token}`);
  const reg = Number.parseInt(match[1], 10);
  if (reg < 0 || reg > 15) throw new Error(`register out of range ${token}`);
  return reg;
}

function parseImm(token) {
  if (/^0x[0-9a-f]+$/i.test(token)) {
    return Number.parseInt(token, 16) >>> 0;
  }
  if (/^-?\d+$/.test(token)) {
    return Number.parseInt(token, 10) >>> 0;
  }
  throw new Error(`invalid immediate ${token}`);
}

function emitU8(buffer, value) {
  buffer.push(value & 0xff);
}

function emitU16(buffer, value) {
  buffer.push(value & 0xff, (value >> 8) & 0xff);
}

function emitU32(buffer, value) {
  buffer.push(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);
}

function tokenize(line) {
  const tokens = [];
  line.replace(/"([^\"]*)"|[^\s,]+/g, (match, str) => {
    if (str !== undefined) {
      tokens.push(`"${str}"`);
    } else {
      tokens.push(match);
    }
    return '';
  });
  return tokens;
}

function normalizeLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/;.*$/, '').trim())
    .filter(Boolean);
}

function strIndex(strings, value) {
  let idx = strings.indexOf(value);
  if (idx === -1) {
    strings.push(value);
    idx = strings.length - 1;
  }
  if (idx > 0xffff) {
    throw new Error('too many strings in const table');
  }
  return idx;
}

export function assembleCanisa(text, constPool = { strings: [] }) {
  const code = [];
  const strings = constPool.strings ?? [];
  const lines = normalizeLines(text);

  for (const line of lines) {
    const rawTokens = tokenize(line).filter((tok) => tok !== ',');
    if (rawTokens.length === 0) continue;
    const op = rawTokens[0].toUpperCase();
    const args = rawTokens.slice(1);

    switch (op) {
      case 'NOP':
        emitU8(code, OP.NOP);
        break;
      case 'HALT':
        emitU8(code, OP.HALT);
        break;
      case 'MOV': {
        const dst = parseReg(args[0]);
        const src = parseReg(args[1]);
        emitU8(code, OP.MOV);
        emitU8(code, pack2(dst, src));
        break;
      }
      case 'LOAD8': {
        const dst = parseReg(args[0]);
        const imm = parseImm(args[1]);
        emitU8(code, OP.LOAD8);
        emitU8(code, dst);
        emitU8(code, imm);
        break;
      }
      case 'LOAD16': {
        const dst = parseReg(args[0]);
        const imm = parseImm(args[1]);
        emitU8(code, OP.LOAD16);
        emitU8(code, dst);
        emitU16(code, imm);
        break;
      }
      case 'LOAD32': {
        const dst = parseReg(args[0]);
        const imm = parseImm(args[1]);
        emitU8(code, OP.LOAD32);
        emitU8(code, dst);
        emitU32(code, imm);
        break;
      }
      case 'ADD':
      case 'SUB':
      case 'AND':
      case 'OR':
      case 'XOR': {
        const opcodeMap = { ADD: OP.ADD, SUB: OP.SUB, AND: OP.AND, OR: OP.OR, XOR: OP.XOR };
        const dst = parseReg(args[0]);
        const a = parseReg(args[1]);
        const b = parseReg(args[2]);
        emitU8(code, opcodeMap[op]);
        emitU8(code, dst);
        emitU8(code, pack2(a, b));
        break;
      }
      case 'MOD8': {
        const dst = parseReg(args[0]);
        emitU8(code, OP.MOD8);
        emitU8(code, dst);
        break;
      }
      case 'ADMISS_EXCEPT6': {
        const dst = parseReg(args[0]);
        emitU8(code, OP.ADMISS_EXCEPT6);
        emitU8(code, dst);
        break;
      }
      case 'MAP_PARITY': {
        const dst = parseReg(args[0]);
        emitU8(code, OP.MAP_PARITY);
        emitU8(code, dst);
        break;
      }
      case 'MAP_PRIME8': {
        const dst = parseReg(args[0]);
        emitU8(code, OP.MAP_PRIME8);
        emitU8(code, dst);
        break;
      }
      case 'CMP8': {
        const rA = parseReg(args[0]);
        const imm = parseImm(args[1]);
        emitU8(code, OP.CMP8);
        emitU8(code, rA);
        emitU8(code, imm);
        break;
      }
      case 'JZ':
      case 'JNZ':
      case 'JMP': {
        const opcodeMap = { JZ: OP.JZ, JNZ: OP.JNZ, JMP: OP.JMP };
        const rel = parseImm(args[0]);
        emitU8(code, opcodeMap[op]);
        emitU8(code, rel);
        break;
      }
      case 'EMIT8': {
        const key = args[0];
        if (!key.startsWith('"') || !key.endsWith('"')) {
          throw new Error('EMIT8 expects string literal');
        }
        const idx = strIndex(strings, key.slice(1, -1));
        const src = parseReg(args[1]);
        emitU8(code, OP.EMIT8);
        emitU16(code, idx);
        emitU8(code, src);
        break;
      }
      case 'EMITREGS': {
        const key = args[0];
        if (!key.startsWith('"') || !key.endsWith('"')) {
          throw new Error('EMITREGS expects string literal');
        }
        const idx = strIndex(strings, key.slice(1, -1));
        const start = parseReg(args[1]);
        const count = parseImm(args[2]);
        emitU8(code, OP.EMITREGS);
        emitU16(code, idx);
        emitU8(code, start);
        emitU8(code, count);
        break;
      }
      case 'LOADADDR8': {
        const start = parseReg(args[0]);
        emitU8(code, OP.LOADADDR8);
        emitU8(code, start);
        break;
      }
      case 'HASHREGS': {
        const start = parseReg(args[0]);
        const count = parseImm(args[1]);
        const out = parseReg(args[2]);
        emitU8(code, OP.HASHREGS);
        emitU8(code, start);
        emitU8(code, count);
        emitU8(code, out);
        break;
      }
      default:
        throw new Error(`unknown opcode ${op}`);
    }
  }

  const constBytes = buildConstBytes(strings);

  return {
    codeBytes: Buffer.from(code),
    constBytes,
    strings,
  };
}

export function buildConstBytes(strings) {
  const parts = [];
  const header = Buffer.allocUnsafe(2);
  header.writeUInt16LE(strings.length, 0);
  parts.push(header);
  for (const str of strings) {
    const buf = Buffer.from(str, 'utf8');
    if (buf.length > 0xffff) throw new Error('string literal too long');
    const lenBuf = Buffer.allocUnsafe(2);
    lenBuf.writeUInt16LE(buf.length, 0);
    parts.push(lenBuf, buf);
  }
  return Buffer.concat(parts);
}

export function readConstBytes(constBytes) {
  if (!constBytes || constBytes.length < 2) return [];
  let offset = 0;
  const count = constBytes.readUInt16LE(offset);
  offset += 2;
  const out = [];
  for (let i = 0; i < count; i += 1) {
    if (offset + 2 > constBytes.length) throw new Error('bad const pool');
    const len = constBytes.readUInt16LE(offset);
    offset += 2;
    const str = constBytes.subarray(offset, offset + len).toString('utf8');
    offset += len;
    out.push(str);
  }
  return out;
}

export function disassemble(codeBytes, constBytes) {
  const strings = readConstBytes(constBytes);
  let pc = 0;
  const output = [];

  const readU8 = () => {
    const value = codeBytes.readUInt8(pc);
    pc += 1;
    return value;
  };

  const readU16 = () => {
    const value = codeBytes.readUInt16LE(pc);
    pc += 2;
    return value;
  };

  const readI8 = () => {
    const value = codeBytes.readInt8(pc);
    pc += 1;
    return value;
  };

  while (pc < codeBytes.length) {
    const curr = pc;
    const op = readU8();
    const hexPc = curr.toString(16).padStart(4, '0');

    const addLine = (text) => output.push(`${hexPc}: ${text}`);

    switch (op) {
      case OP.NOP:
        addLine('NOP');
        break;
      case OP.HALT:
        addLine('HALT');
        break;
      case OP.MOV: {
        const [dst, src] = unpack2(readU8());
        addLine(`MOV r${dst}, r${src}`);
        break;
      }
      case OP.LOAD8: {
        const dst = readU8();
        const imm = readU8();
        addLine(`LOAD8 r${dst}, 0x${imm.toString(16).padStart(2, '0')}`);
        break;
      }
      case OP.LOAD16: {
        const dst = readU8();
        const imm = readU16();
        addLine(`LOAD16 r${dst}, 0x${imm.toString(16).padStart(4, '0')}`);
        break;
      }
      case OP.LOAD32: {
        const dst = readU8();
        const imm = codeBytes.readUInt32LE(pc);
        pc += 4;
        addLine(`LOAD32 r${dst}, 0x${imm.toString(16).padStart(8, '0')}`);
        break;
      }
      case OP.ADD:
      case OP.SUB:
      case OP.AND:
      case OP.OR:
      case OP.XOR: {
        const dst = readU8();
        const [a, b] = unpack2(readU8());
        const name = { [OP.ADD]: 'ADD', [OP.SUB]: 'SUB', [OP.AND]: 'AND', [OP.OR]: 'OR', [OP.XOR]: 'XOR' }[op];
        addLine(`${name} r${dst}, r${a}, r${b}`);
        break;
      }
      case OP.MOD8: {
        const r = readU8();
        addLine(`MOD8 r${r}`);
        break;
      }
      case OP.ADMISS_EXCEPT6: {
        const r = readU8();
        addLine(`ADMISS_EXCEPT6 r${r}`);
        break;
      }
      case OP.MAP_PARITY: {
        const r = readU8();
        addLine(`MAP_PARITY r${r}`);
        break;
      }
      case OP.MAP_PRIME8: {
        const r = readU8();
        addLine(`MAP_PRIME8 r${r}`);
        break;
      }
      case OP.CMP8: {
        const r = readU8();
        const imm = readU8();
        addLine(`CMP8 r${r}, 0x${imm.toString(16).padStart(2, '0')}`);
        break;
      }
      case OP.JZ: {
        const rel = readI8();
        addLine(`JZ ${rel}`);
        break;
      }
      case OP.JNZ: {
        const rel = readI8();
        addLine(`JNZ ${rel}`);
        break;
      }
      case OP.JMP: {
        const rel = readI8();
        addLine(`JMP ${rel}`);
        break;
      }
      case OP.EMIT8: {
        const idx = readU16();
        const r = readU8();
        const name = strings[idx] ?? `#${idx}`;
        addLine(`EMIT8 "${name}", r${r}`);
        break;
      }
      case OP.EMITREGS: {
        const idx = readU16();
        const start = readU8();
        const count = readU8();
        const name = strings[idx] ?? `#${idx}`;
        addLine(`EMITREGS "${name}", r${start}, ${count}`);
        break;
      }
      case OP.LOADADDR8: {
        const start = readU8();
        addLine(`LOADADDR8 r${start}`);
        break;
      }
      case OP.HASHREGS: {
        const start = readU8();
        const count = readU8();
        const out = readU8();
        addLine(`HASHREGS r${start}, ${count}, r${out}`);
        break;
      }
      default:
        addLine(`DB 0x${op.toString(16).padStart(2, '0')}`);
        break;
    }
  }

  return `${output.join('\n')}\n`;
}
