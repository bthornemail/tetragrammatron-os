# mesh-proxy

RFC-0001 reference executor for the idempotent identity: **∅! = 1**.

This repository encodes the philosophy that **all policy lives in dotfiles** and the executor is a minimal, POSIX-pure stream transformer.

## Philosophy

- **∅! = 1**: empty input yields identity output.
- **No policy in code**: `start.sh` only applies dotfile-defined transforms/gates/invariants.
- **Determinism**: identical input + identical dotfiles = identical output.

## Usage

```sh
./start.sh               # prints "∅! = 1"
./start.sh file.txt      # transforms file
cat file.txt | ./start.sh

# Optional: use a custom dotfile directory
DOT_DIR=examples/dotfiles ./start.sh file.txt
```

## Dotfiles (policy)

All dotfiles are optional. Missing or empty files are treated as identity/no-op.
By default, dotfiles are read from the repo root. You can override any dotfile path with flags:
`--env`, `--atom`, `--manifest`, `--genesis`, `--schema`, `--include`, `--ignore`, `--sequence`.
Dotfiles also support `@include path` to splice in other dotfiles (relative to the including file).
Use `--include=PATH` to point at a dotfile directory or an include map.

- `.sequence`: phase order
- `.env`: sed program for observation normalization
- `.atom`: sed program for reference expansion
- `.manifest`: sed program for intent overlay
- `.genesis`: sed program for structural rewrite
- `.schema`: ERE checked by `grep -Eq`
- `.include`: allowlist gate (`grep -E`)
- `.ignore`: denylist gate (`grep -Ev`)

## Default Phase Order

If `.sequence` is missing or empty:

```
env atom manifest genesis schema include ignore
```

## Examples

Sample dotfiles live in `examples/dotfiles` for reference. Copy or edit root dotfiles to define your own policy.

## Custom Implementations

Custom implementations are **dotfile sets**, not alternate executors. Use the same `start.sh` with different `DOT_DIR` values.

Root dotfiles currently include the mesh-proxy extension set:

```
@include extensions/mesh-proxy/dot/.env
```

You can still override with `DOT_DIR` or `--include` if needed.

Switch extensions by updating the `extensions/active` symlink.

Override a single dotfile:

```sh
DOT_DIR=implementations/mesh-proxy/dot DOT_SCHEMA=/tmp/schema ./start.sh file.txt
```

## Legacy

All execution is via `start.sh`. There are no other scripts.
