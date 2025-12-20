# CAN-ISA Tools

This directory contains tools for the repo lattice, merge gate, CAN-ISA bytecode, and Agent 7 Termux automation.

## Files

- `gen_repo_canvasl.py` - Generate/verify the canonical repo.canvasl kernel + 8³ registers
- `fano-merge-check.py` - Enforce Agent-6 branch topology + Fano triad declarations
- `can-pack.scm` - Big-endian byte packing helpers
- `can-asm.scm` - CANB v1 assembler (RFC-0012 compliant)
- `hwscan_termux_canvasl.sh` - Termux hardware probe → CanvasL JSONL stream (Agent 7)
- `termux_mesh_agent.sh` - Termux heartbeat daemon for the 7-phase phone mesh (Agent 7)

## Repo kernel generator / verifier (`REPO-LATTICE-TIME`)

Regenerate the entire lattice:

```bash
python3 tools/gen_repo_canvasl.py          # or: make repo-lattice
```

CI and local checks can validate the files without rewriting (`make repo-check`):

```bash
python3 tools/gen_repo_canvasl.py --check
```

Run the combined lattice + Fano gate preflight with `make repo-verify` (override `FANO_BASE` if needed):

```bash
make repo-verify FANO_BASE=origin/current
```

## Fano merge gate CLI

Run the merge gate locally before opening a PR (same command GitHub Actions executes):

```bash
python3 tools/fano-merge-check.py origin/main HEAD
```

## Assembler Usage

The assembler reads S-expression assembly files and produces CANB v1 bytecode:

```scheme
;; Example assembly file
(inst CANON (flags canon_out proof) 1 0 0 0 1)
(inst MEET  (flags canon_out proof) 2 1 1 0 0)
```

### Running the Assembler

**Guile:**
```bash
guile -s can-asm.scm input.canasm output.canb
```

**Racket:**
```bash
racket can-asm.scm input.canasm output.canb
```

### Assembly Format

Each instruction follows this format:
```scheme
(inst OPCODE FLAGS RDST RA RB IMM16 REF32)
```

Where:
- `OPCODE` is one of: `CANON`, `MEET`, `JOIN`, `PROJ_FANO`, `ASSERT_IDEMP`, `COMMIT`, `EMIT_GEOM`
- `FLAGS` is `(flags flag1 flag2 ...)` with flags: `canon_in`, `canon_out`, `proof`, `emit`
- `RDST`, `RA`, `RB` are register indices (0..255)
- `IMM16` is a 16-bit immediate (0..65535)
- `REF32` is a 32-bit object pool reference (0..2^32-1)

## Termux Hardware → CanvasL Probe (`HW-TIME-REAL`)

The Agent 7 hardware script emits a deterministic JSONL stream describing an
Android/Termux device (OS props, CPU/memory, storage, network, proxy settings).
Use it to ground VM runs on phones/tablets and replay hardware constraints on
desktop test rigs.

```bash
pkg install -y coreutils iproute2   # optional: ensures df/ip are available
bash tools/hwscan_termux_canvasl.sh hw.can.jsonl
```

Each line in `hw.can.jsonl` is a CanvasL-compatible record (`HW_*`, `NET_*`,
`CANVASL_FIELDS`, `HW_DONE`). Feed this into your normalizer/renderer or hash it
as part of a hardware witness log. The script uses only POSIX utilities, so it
still runs on offline Termux devices without Python.

## Termux Mesh Agent (`HW-TIME-REAL`)

`termux_mesh_agent.sh` turns a Termux phone into a self-reporting mesh node. It
records a hardware snapshot (via the probe above), emits deterministic
`ROLE_HEARTBEAT` JSONL records, and can stream them to an anchor (UDP/TCP/file)
for automatic enrollment in the 7-phase mesh.

### Quick start

```bash
pkg install -y termux-services openssh ncurses  # once per phone
git clone https://github.com/bthornemail/tetragrammatron-os ~/tetragrammatron-os
cd ~/tetragrammatron-os
DEVICE_ID=phone-renderer ROLE=renderer ROLE_OFFSET=4 ANCHOR_HOST=10.229.211.135 \
ANCHOR_PORT=7777 HEARTBEAT_SEC=2 bash tools/termux_mesh_agent.sh
```

Environment knobs:
- `ROLE` – logical chakra role (`gateway`, `renderer`, `identity`, etc.)
- `ROLE_OFFSET` – phase offset (0..6) to line up with the chakra schedule
- `DEVICE_ID` – stable label for logs and anchor packets
- `ANCHOR_HOST`/`ANCHOR_PORT` – optional UDP/TCP endpoint that ingests heartbeats
- `ANCHOR_PROTO` – `udp` (default), `tcp`, or `file` (append payload locally)
- `HEARTBEAT_SEC` – cadence between pulses (seconds)

Heartbeats are stored under `mesh-logs/DEVICE-heartbeat.jsonl`; hardware
profiles land next to them. Use `termux-services` or Termux:Boot to launch the
agent at startup:

```bash
pkg install termux-services
mkdir -p ~/.termux/services/mesh-agent
cat > ~/.termux/services/mesh-agent/run <<'EOF'
#!/data/data/com.termux/files/usr/bin/sh
cd ~/tetragrammatron-os
export ROLE=renderer ROLE_OFFSET=4 DEVICE_ID=phone-renderer \
       ANCHOR_HOST=10.229.211.135 ANCHOR_PORT=7777 HEARTBEAT_SEC=2
exec bash tools/termux_mesh_agent.sh
EOF
chmod +x ~/.termux/services/mesh-agent/run
sv up mesh-agent
```

Repeat with different `ROLE` / `ROLE_OFFSET` values for the other phones to
cover the full 7-chakra schedule. The anchor (ESP32/Pico/host) now receives
continuous phone heartbeats even when the router or WAN link is offline.

## Mesh Anchor (`HW-TIME-REAL`)

`mesh_anchor.py` is the companion collector that runs on your laptop, router,
or ESP32/Linux gateway. It listens for `ROLE_HEARTBEAT` packets and writes them
to an append-only log so you can audit timing, grades, and drift.

```bash
python3 tools/mesh_anchor.py --port 7777 --log mesh-logs/anchor-heartbeats.jsonl
```

Flags:
- `--proto udp|tcp` — match what the phones are using (default UDP)
- `--host` / `--port` — bind address (default 0.0.0.0:7777)
- `--log` — JSONL output path (directory is created automatically)
- `--quiet` — suppress console summaries

Run this on whichever host acts as your mesh gateway, then point each Termux
agent at that host/port. All heartbeats are now captured centrally for
replay, visualization, or proof correlation.

## RFC Compliance

The assembler enforces:
- RFC-0012 §4 (CANB v1 encoding)
- Reserved flag bits must be 0
- Register bounds checking
- Instruction width (16 bytes fixed)


