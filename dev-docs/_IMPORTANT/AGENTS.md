```markdown
# AGENTS.md

## Component Identity
- Name: <component-name>
- Path: <relative/path>
- Component-ID: <content-hash>
- Layer: <1–8>

## Boundary Constraints
This component MUST:
- Preserve public interfaces listed below
- Respect declared invariants
- Maintain test validity

This component MUST NOT:
- Introduce undeclared dependencies
- Violate repository boundary schemas

## Responsibilities
- Primary role: <description>
- Secondary roles: <optional>

## Interfaces
### Provided
- <symbol/function/type>

### Required
- <dependency>

## Formal Properties (if applicable)
- Formal system: <Lean | Coq | AAL | Prolog | Datalog>
- Proven invariants:
  - <theorem / property>

## Complexity Budget
- Max allowed complexity: <value>
- Current complexity: <value>

## Test Expectations
- Minimum tests: <n>
- Test location: <path>

## CanvasL Projection
- Boundary ID: <boundary-hash>
- Interior ID: <interior-hash>
- Execution Phase: <n>

## Merge Semantics
This component MAY be merged iff:
- Boundary hash matches
- Tests pass
- No AGENTS.md invariant is violated
