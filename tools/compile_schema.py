#!/usr/bin/env python3
"""
Compile address-schema.yaml to ABI v2 binary format.

ABI v2 Layout:
  offset  size  field
  0       4     magic = "TADR"
  4       2     abi = 2 (little-endian)
  6       1     rows = 8
  7       1     schema_rows = 5
  8       1     schema_class (0=private, 1=protected, 2=public)
  9       1     realm (R0 byte)
  10      2     epoch (little-endian)
  12      1     prefix_count = N
  13      5*N   allowed_prefixes (each 5 bytes: R0-R4)
"""
import sys, struct, yaml, argparse
from itertools import product

MAGIC = 0x54414452  # 'TADR'
ROWS = 8
SCHEMA_ROWS = 5

def parse_u8(x):
  if isinstance(x, int):
    return x & 0xFF
  s = str(x).strip()
  if s.startswith("0x") or s.startswith("0X"):
    return int(s, 16) & 0xFF
  return int(s) & 0xFF

def class_to_byte(cls_str):
  """Convert schema_class string to byte."""
  cls = cls_str.lower() if isinstance(cls_str, str) else "public"
  if cls == "private":
    return 0
  elif cls == "protected":
    return 1
  else:  # public or default
    return 2

def generate_prefixes(rowspec):
  """
  Generate all valid prefix40 strings from rowspec.
  Returns list of 5-byte tuples (R0, R1, R2, R3, R4).
  """
  prefixes = []
  # Get allowed values for each schema row (R0-R4)
  allowed_per_row = []
  for i in range(SCHEMA_ROWS):
    key = f"R{i}"
    r = rowspec.get(key, {})
    if not r.get("fixed", False):
      raise SystemExit(f"{key} must be fixed (schema rows must be fixed)")
    allowed = [parse_u8(v) for v in r.get("allowed", [])]
    if not allowed:
      raise SystemExit(f"{key} has no allowed values")
    allowed_per_row.append(allowed)
  
  # Generate all combinations
  for combo in product(*allowed_per_row):
    prefixes.append(tuple(combo))
  
  return prefixes

def main():
  ap = argparse.ArgumentParser(description="Compile address-schema.yaml to ABI v2 binary")
  ap.add_argument("yaml_path")
  ap.add_argument("-o", "--out", default="build/address-schema.bin")
  ap.add_argument("--abi", type=int, default=2, help="ABI version (default: 2)")
  args = ap.parse_args()

  if args.abi != 2:
    raise SystemExit("Only ABI v2 is supported (use --abi 2)")

  with open(args.yaml_path, "r", encoding="utf-8") as f:
    y = yaml.safe_load(f)

  rowspec = y.get("rowspec", {})
  rows = int(y.get("rows", 8))
  schema_rows = int(y.get("schema_rows", 5))
  if rows != 8:
    raise SystemExit("rows must be 8 for Addr8")
  if schema_rows != 5:
    raise SystemExit("schema_rows must be 5 (R0..R4)")

  # Read ABI v2 fields
  schema_class_str = y.get("schema_class", "public")
  realm_val = y.get("realm", 0x1A)
  epoch_val = int(y.get("epoch", 0))
  
  # Parse realm (can be hex string or int)
  if isinstance(realm_val, str):
    realm = parse_u8(realm_val)
  else:
    realm = int(realm_val) & 0xFF

  schema_class_byte = class_to_byte(schema_class_str)

  # Generate prefix list from rowspec
  prefixes = generate_prefixes(rowspec)
  prefix_count = len(prefixes)
  
  if prefix_count == 0:
    raise SystemExit("No valid prefixes generated from rowspec")
  if prefix_count > 255:
    raise SystemExit(f"Too many prefixes ({prefix_count}, max 255)")

  # Build ABI v2 binary
  out = bytearray()
  
  # Magic (4 bytes, big-endian)
  out += struct.pack(">I", MAGIC)
  
  # ABI version (2 bytes, little-endian)
  out += struct.pack("<H", args.abi)
  
  # Rows (1 byte)
  out += struct.pack("B", rows)
  
  # Schema rows (1 byte)
  out += struct.pack("B", schema_rows)
  
  # Schema class (1 byte)
  out += struct.pack("B", schema_class_byte)
  
  # Realm (1 byte)
  out += struct.pack("B", realm)
  
  # Epoch (2 bytes, little-endian)
  out += struct.pack("<H", epoch_val & 0xFFFF)
  
  # Prefix count (1 byte)
  out += struct.pack("B", prefix_count)
  
  # Prefixes (5 bytes each: R0:R1:R2:R3:R4)
  for prefix in prefixes:
    out += struct.pack("BBBBB", *prefix)

  import os
  os.makedirs(os.path.dirname(args.out), exist_ok=True)
  with open(args.out, "wb") as f:
    f.write(out)

  print(f"Wrote {args.out} ({len(out)} bytes)")
  print(f"  ABI v{args.abi}, class={schema_class_str}, realm=0x{realm:02X}, epoch={epoch_val}")
  print(f"  Prefixes: {prefix_count}")

if __name__ == "__main__":
  main()
