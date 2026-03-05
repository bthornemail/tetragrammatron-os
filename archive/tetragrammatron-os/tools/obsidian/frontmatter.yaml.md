## 3) Obsidian Bases: `.base` file that *renders your lattice*

Obsidian Bases files are **YAML** with sections like `filters`, `formulas`, `properties`, `views` (table/cards/etc).  cite turn1view0 turn0search3   
Obsidian Canvas uses JSON Canvas `.canvas` format.   6 turn0search1 

### 3.1 What we’ll store on each node note (frontmatter)

Every node file (markdown) in your vault gets:

```yaml
---
addr: "1A:02:04:03:02:7F:11:C7"
r0: "1A"
r1: "02"
r2: "04"
r3: "03"
r4: "02"
r5: "7F"
r6: "11"
r7: "C7"
realm: ulp
ontology: device
capability: route
process: consensus
context: public
prefix40: "1A:02:04:03:02::/40"
---
```
# 7) Obsidian: visible policy + trust signal

Add to frontmatter:

```yaml
schema_hash: a9f3c21d9e4b0a77d1a5f0b3a9e7c2ff
schema_version: v2
context_mode: public4
```

In Bases:
- group by `schema_hash`
- highlight mismatches
- show **policy drift visually**

---