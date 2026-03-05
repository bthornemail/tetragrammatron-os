# compile_schema.py
import yaml, struct

MAGIC = 0x54414452  # 'TADR'

with open("address-schema.yaml") as f:
    y = yaml.safe_load(f)

rowspec = y["rowspec"]

out = bytearray()
out += struct.pack(">IHB B", MAGIC, 1, y["rows"], y["schema_rows"])

for i in range(8):
    key = f"R{i}"
    r = rowspec[key]
    fixed = 1 if r.get("fixed", False) else 0
    allowed = r.get("allowed", [])
    out += struct.pack("BB", fixed, len(allowed))
    for v in allowed:
        out.append(int(v, 16))
    out += bytes(16 - len(allowed))  # pad

with open("address-schema.bin", "wb") as f:
    f.write(out)

print("Wrote address-schema.bin", len(out), "bytes")