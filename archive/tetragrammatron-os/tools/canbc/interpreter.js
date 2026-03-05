import fs from 'node:fs';
import crypto from 'node:crypto';
import { readCanbc, formatAddr } from './canbc.js';
import { OP, isPrime8 } from './canisa.js';

function readConstStrings(constBytes) {
  if (!constBytes || constBytes.length < 2) return [];
  const count = constBytes.readUInt16LE(0);
  let offset = 2;
  const strings = [];
  for (let i = 0; i < count; i += 1) {
    const len = constBytes.readUInt16LE(offset);
    offset += 2;
    const value = constBytes.subarray(offset, offset + len).toString('utf8');
    offset += len;
    strings.push(value);
  }
  return strings;
}

export function runCanbc(path, { emitPath = null, now = () => new Date().toISOString() } = {}) {
  const file = readCanbc(path);
  const addrStr = formatAddr(file.addr);
  const strings = readConstStrings(file.constBytes);

  const regs = new Uint32Array(16);
  let zf = false;
  let pc = 0;
  const code = file.codeBytes;

  const emit = (record) => {
    const line = JSON.stringify(record);
    if (emitPath) {
      fs.appendFileSync(emitPath, `${line}\n`);
    } else {
      process.stdout.write(`${line}\n`);
    }
  };

  const trap = (reason) => {
    emit({ t: now(), a: addrStr, k: 'trap', v: { reason, pc } });
    throw new Error(`trap: ${reason} @${pc}`);
  };

  const readU8 = () => {
    if (pc >= code.length) throw new Error('pc overflow');
    const value = code.readUInt8(pc);
    pc += 1;
    return value;
  };
  const readU16 = () => {
    const value = code.readUInt16LE(pc);
    pc += 2;
    return value;
  };
  const readU32 = () => {
    const value = code.readUInt32LE(pc);
    pc += 4;
    return value;
  };
  const readI8 = () => {
    const value = code.readInt8(pc);
    pc += 1;
    return value;
  };

  emit({ t: now(), a: addrStr, k: 'exec.start', v: { mode: file.mode, rule: file.admissibleRule } });

  while (pc < code.length) {
    const op = readU8();
    switch (op) {
      case OP.NOP:
        break;
      case OP.HALT:
        emit({ t: now(), a: addrStr, k: 'exec.halt', v: { pc } });
        return;
      case OP.MOV: {
        const packed = readU8();
        const dst = packed & 0x0f;
        const src = (packed >> 4) & 0x0f;
        regs[dst] = regs[src];
        break;
      }
      case OP.LOAD8: {
        const dst = readU8();
        regs[dst] = readU8();
        break;
      }
      case OP.LOAD16: {
        const dst = readU8();
        regs[dst] = readU16();
        break;
      }
      case OP.LOAD32: {
        const dst = readU8();
        regs[dst] = readU32();
        break;
      }
      case OP.ADD:
      case OP.SUB:
      case OP.AND:
      case OP.OR:
      case OP.XOR: {
        const dst = readU8();
        const packed = readU8();
        const a = packed & 0x0f;
        const b = (packed >> 4) & 0x0f;
        switch (op) {
          case OP.ADD:
            regs[dst] = (regs[a] + regs[b]) >>> 0;
            break;
          case OP.SUB:
            regs[dst] = (regs[a] - regs[b]) >>> 0;
            break;
          case OP.AND:
            regs[dst] = regs[a] & regs[b];
            break;
          case OP.OR:
            regs[dst] = regs[a] | regs[b];
            break;
          case OP.XOR:
            regs[dst] = regs[a] ^ regs[b];
            break;
          default:
            break;
        }
        break;
      }
      case OP.MOD8: {
        const dst = readU8();
        regs[dst] &= 0x07;
        break;
      }
      case OP.ADMISS_EXCEPT6: {
        const dst = readU8();
        if ((regs[dst] & 0xff) === 6) {
          trap('admissibility_violation_except6');
        }
        break;
      }
      case OP.MAP_PARITY: {
        const dst = readU8();
        regs[dst] &= 1;
        break;
      }
      case OP.MAP_PRIME8: {
        const dst = readU8();
        regs[dst] = isPrime8(regs[dst]) ? 1 : 0;
        break;
      }
      case OP.CMP8: {
        const reg = readU8();
        const imm = readU8();
        zf = ((regs[reg] & 0xff) === imm);
        break;
      }
      case OP.JZ: {
        const rel = readI8();
        if (zf) pc += rel;
        break;
      }
      case OP.JNZ: {
        const rel = readI8();
        if (!zf) pc += rel;
        break;
      }
      case OP.JMP: {
        const rel = readI8();
        pc += rel;
        break;
      }
      case OP.LOADADDR8: {
        const start = readU8();
        for (let i = 0; i < 8; i += 1) {
          regs[(start + i) & 0x0f] = file.addr[i];
        }
        break;
      }
      case OP.HASHREGS: {
        const start = readU8();
        const count = readU8();
        const dst = readU8();
        const hash = crypto.createHash('sha256');
        for (let i = 0; i < count; i += 1) {
          hash.update(Buffer.from([regs[(start + i) & 0x0f] & 0xff]));
        }
        regs[dst] = hash.digest()[0];
        break;
      }
      case OP.EMIT8: {
        const idx = readU16();
        const reg = readU8();
        emit({
          t: now(),
          a: addrStr,
          k: strings[idx] ?? `#${idx}`,
          v: regs[reg] & 0xff,
        });
        break;
      }
      case OP.EMITREGS: {
        const idx = readU16();
        const start = readU8();
        const count = readU8();
        const values = [];
        for (let i = 0; i < count; i += 1) {
          values.push(regs[(start + i) & 0x0f] & 0xff);
        }
        emit({
          t: now(),
          a: addrStr,
          k: strings[idx] ?? `#${idx}`,
          v: values,
        });
        break;
      }
      default:
        trap(`unknown_opcode_0x${op.toString(16)}`);
    }
  }

  emit({ t: now(), a: addrStr, k: 'exec.end', v: { pc } });
}
