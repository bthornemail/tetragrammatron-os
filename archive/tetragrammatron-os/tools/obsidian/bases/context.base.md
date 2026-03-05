---
base:
  name: Context Axis
  source:
    folders:
      - trees
  filters:
    - path.includes("/context/")
  columns:
    - name: Tree
      value: path.split("/")[1]
    - name: Branch
      value: path.split("/")[3]
    - name: Context Type
      value: path.split("/")[5]
    - name: Artifact
      value: file.name
    - name: Format
      value: file.extension
---

# Context Axis

Context types include:
- networks
- views
- connections
- documents
- assets
- services

This base defines **how interpretation is framed**, not what is true.

