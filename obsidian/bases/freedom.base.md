---
base:
  name: Freedom Axis
  source:
    folders:
      - trees
  filters:
    - path.includes("/freedom/")
  columns:
    - name: Tree
      value: path.split("/")[1]
    - name: Branch
      value: path.split("/")[3]
    - name: Capability
      value: file.name
    - name: Format
      value: file.extension
    - name: Path
      value: path
---

# Freedom Axis

This base enumerates **what actions are possible** per branch.

Interpretation rules:
- Presence = possibility
- Absence = constraint
- No judgment is implied

