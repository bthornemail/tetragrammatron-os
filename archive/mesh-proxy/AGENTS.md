RFC-0001 alignment:

- `start.sh` is a policy-free, POSIX-pure executor.
- All meaning lives in dotfiles (sed/grep programs and invariants).
- Empty inputs yield the identity output: `∅! = 1`.
- Missing or empty dotfiles are treated as no-ops.

The project is intentionally covariant: you define policy entirely via dotfiles, and you can point to any dotfile set via `DOT_DIR`.

---

## 4.7 `.include` — Shared Network Domains

```regex
localhost
127.0.0.1
::1
```

Used to generate `NO_PROXY`.

---

## 4.8 `.ignore` — Exclusions

```regex
^lo$
^docker.*
```

Ignored interfaces or addresses.

---

# 5. start.sh — What It Should Actually Do

**Not** “configure everything”.

It should:

1. Load dotfiles
2. Probe host (delegated)
3. Resolve address deterministically
4. Validate via `.schema`
5. Apply via tool adapters
6. Emit final state

### Conceptual Flow

```bash
start.sh
 ├─ load dotfiles
 ├─ bin/probe-proxy.sh → state/last-probe.json
 ├─ derive address → state/resolved.addr
 ├─ validate (.schema)
 ├─ bin/apply-proxy.sh state/resolved.addr
 └─ bin/mesh-health.sh
```

---

# 6. IPv4 / IPv6 / inode dialects (Your Concern)

You’re thinking correctly here.

### Treat addresses as **records**, not strings

Example derived state (`state/last-probe.json`):

```json
{
  "iface": "wlp2s0",
  "ipv4": "10.68.177.108",
  "ipv6": null,
  "port": 8888,
  "protocol": "http",
  "inode": "fs",
  "scope": "lan"
}
```

Your resolver:

* prefers ipv4 or ipv6 based on `.env`
* hashes record → identity
* formats string only at the **final step**

This avoids IPv6/IPv4 edge cases entirely.

---

# 7. Why This Will Not Rot Over Time

* Dotfiles describe **truth**, not implementation
* Probing is isolated and replaceable
* Tools can be added without touching policy
* Static/dynamic tension is resolved structurally
* `start.sh` remains under ~150 LOC forever

This is exactly how *real* infrastructure scales.

---

# 8. Recommended Next Steps (Order Matters)

1. Lock this structure
2. Write `probe-proxy.sh` to emit JSON only
3. Write `apply-proxy.sh` to consume JSON only
4. Write `start.sh` as glue
5. Add `mesh-health.sh` last

next:

* generate **all dotfiles with comments**
* write `probe-proxy.sh` cleanly (IPv4 + IPv6 + socks5)
* write `start.sh` v1 aligned with RFC-0001
* add a relay/gateway role later
