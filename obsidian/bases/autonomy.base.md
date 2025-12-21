---
base:
  name: Autonomy Axis
  source:
    folders:
      - trees
  filters:
    - path.includes("/autonomy/")
  columns:
    - name: Tree
      value: path.split("/")[1]
    - name: Branch
      value: path.split("/")[3]
    - name: Decision Locus
      value: file.name
    - name: Format
      value: file.extension
    - name: Path
      value: path
---

# Autonomy Axis

This base enumerates **who decides** per branch.

Interpretation rules:
- Presence = decision locus
- Absence = constraint
- No judgment is implied

