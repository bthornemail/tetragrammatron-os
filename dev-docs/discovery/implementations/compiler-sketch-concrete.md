# Compiler Sketch (Concrete)

## Input
- `repo.canvasl` YAML front matter (RFC-0011 schema)

## Output
- `ir/repo.canon.json`
- `ir/repo.ir.jsonl`
- `bytecode/repo.canb` (RFC-0012 encoding)

## Pseudocode
```text
parse_yaml(repo.canvasl) -> AST
validate_against_RFC0011_schema(AST)
canon_json = normalize(AST)              // key sort, defaults, canonical enums
emit IR:
  CANON   reg0 <- obj(pool[canon_json])
  PROJ_FANO reg1 <- reg0
  ASSERT_IDEMP (CANON)
  ASSERT_IDEMP (PROJ_FANO)
  COMMIT  hash(reg1), triads(reg1)
  EMIT_GEOM reg1
assemble IR -> CANB bytecode
embed referenced POLY blobs using CLBC-POLY v1 framing
```

---
