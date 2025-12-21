---
base:
  name: Axes Overview
  source:
    folders:
      - trees
  filters:
    - path.includes("/branches/")
  columns:
    - name: Tree
      value: path.split("/")[1]
    - name: Branch
      value: path.split("/")[3]
    - name: Axis
      value: |
        if (path.includes("/freedom/")) return "Freedom";
        if (path.includes("/autonomy/")) return "Autonomy";
        if (path.includes("/sovereignty/")) return "Sovereignty";
        if (path.includes("/context/")) return "Context";
        return "—";
    - name: File
      value: file.name
    - name: Type
      value: file.extension
    - name: Modified
      value: file.mtime
---

# Axes Overview

This base shows **all constraint artifacts** across all branches,
classified by the four invariant axes.

Use this to:
- detect imbalance (missing axes)
- inspect where meaning is coming from
- compare branches structurally

