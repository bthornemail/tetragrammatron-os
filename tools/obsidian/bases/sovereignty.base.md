---
base:
  name: Sovereignty Axis
  source:
    folders:
      - trees
  filters:
    - path.includes("/sovereignty/")
  columns:
    - name: Tree
      value: path.split("/")[1]
    - name: Branch
      value: path.split("/")[3]
    - name: Accountability
      value: file.name
    - name: Format
      value: file.extension
    - name: Path
      value: path
---

# Sovereignty Axis

This base enumerates **who is accountable** per branch.

Interpretation rules:
- Presence = accountability
- Absence = constraint
- No judgment is implied

