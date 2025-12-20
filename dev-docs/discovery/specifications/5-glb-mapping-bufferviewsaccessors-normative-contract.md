# 5) GLB mapping: bufferViews/accessors (Normative contract)

We treat **ChannelID12 as the stable index** into a GLB multiplexer table.

## 5.1 Buffer layout
A GLB asset contains:

- A single binary `buffer` (standard glTF).
- A table of `bufferViews` representing channels.

### Rule
For a given compiled artifact, if a channel exists, then:

```
bufferViews[channelIndex] corresponds to ChannelID12 == channelIndex
```

That means bufferViews is an array of length **N ≤ 4096**, where absent channels are omitted.

## 5.2 Required channel table chunk
To preserve deterministic lookup even when omitting empty channels, include a compact index:

**CHIX chunk** (custom GLB chunk type)
- Type: `"CHIX"`
- Payload: sorted list of `(ChannelID12, bufferViewIndex)` pairs.

Binary format:

```
u16 count               ; number of entries (big-endian)
repeat count times:
  u16 channel_id12      ; 0..4095 (big-endian, top 4 bits MUST be 0)
  u16 bufferview_index  ; index into glTF bufferViews (big-endian)
```

Determinism rules:
- Pairs MUST be sorted by `channel_id12` ascending.
- No duplicates.
- `bufferview_index` MUST be < len(bufferViews).

This avoids needing 4096 bufferViews while keeping canonical mapping.

---
