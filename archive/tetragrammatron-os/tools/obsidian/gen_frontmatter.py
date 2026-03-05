#!/usr/bin/env python3
import argparse, pathlib

TEMPLATE = pathlib.Path("tools/obsidian/frontmatter_template.md").read_text(encoding="utf-8")

def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("--addr", required=True, help="AA:BB:CC:DD:EE:FF:GG:HH")
  ap.add_argument("--labels", nargs=5, default=["ulp","device","route","consensus","public"])
  ap.add_argument("-o", "--out", required=True)
  args = ap.parse_args()

  parts = args.addr.split(":")
  if len(parts) != 8: raise SystemExit("addr must have 8 bytes")
  R0,R1,R2,R3,R4,R5,R6,R7 = [p.upper() for p in parts]
  REALM,ONTOLOGY,CAPABILITY,PROCESS,CONTEXT = args.labels
  pfx40 = f"{R0}:{R1}:{R2}:{R3}:{R4}::/40"

  s = TEMPLATE
  for k,v in {
    "ADDR": args.addr.upper(),
    "R0":R0,"R1":R1,"R2":R2,"R3":R3,"R4":R4,"R5":R5,"R6":R6,"R7":R7,
    "REALM":REALM,"ONTOLOGY":ONTOLOGY,"CAPABILITY":CAPABILITY,"PROCESS":PROCESS,"CONTEXT":CONTEXT,
    "PFX40":pfx40
  }.items():
    s = s.replace("{{"+k+"}}", v)

  pathlib.Path(args.out).write_text(s, encoding="utf-8")

if __name__ == "__main__":
  main()
