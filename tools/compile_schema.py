#!/usr/bin/env python3
import sys, struct, yaml, argparse
MAGIC = 0x54414452  # 'TADR'
MAX_ALLOWED = 16
ROWS = 8

def parse_u8(x):
  if isinstance(x, int):
    return x & 0xFF
  s = str(x).strip()
  if s.startswith("0x") or s.startswith("0X"):
    return int(s, 16) & 0xFF
  return int(s) & 0xFF

def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("yaml_path")
  ap.add_argument("-o", "--out", default="build/address-schema.bin")
  args = ap.parse_args()

  with open(args.yaml_path, "r", encoding="utf-8") as f:
    y = yaml.safe_load(f)

  rowspec = y["rowspec"]
  rows = int(y.get("rows", 8))
  schema_rows = int(y.get("schema_rows", 5))
  if rows != 8:
    raise SystemExit("rows must be 8 for Addr8")
  if schema_rows != 5:
    raise SystemExit("schema_rows must be 5 (R0..R4)")

  out = bytearray()
  # Header: >I H B B
  out += struct.pack(">IHBB", MAGIC, 1, rows, schema_rows)

  for i in range(ROWS):
    key = f"R{i}"
    r = rowspec.get(key, {})
    fixed = 1 if r.get("fixed", False) else 0
    allowed = [parse_u8(v) for v in r.get("allowed", [])]
    if len(allowed) > MAX_ALLOWED:
      raise SystemExit(f"{key}.allowed too long (max {MAX_ALLOWED})")
    out += struct.pack("BB", fixed, len(allowed))
    out += bytes(allowed)
    out += bytes([0] * (MAX_ALLOWED - len(allowed)))

  import os
  os.makedirs(os.path.dirname(args.out), exist_ok=True)
  with open(args.out, "wb") as f:
    f.write(out)

  print(f"Wrote {args.out} ({len(out)} bytes)")
  print("Header:", hex(MAGIC), "version=1 rows=8 schema_rows=5")

if __name__ == "__main__":
  main()
