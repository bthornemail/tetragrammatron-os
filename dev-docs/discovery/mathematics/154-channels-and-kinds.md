# 15.4 Channels and kinds

## 15.4.1 Channels (u8)
Minimum standardized channel IDs:

| chan | Name        | Meaning |
|------|-------------|---------|
| 0x00 | DEBUG       | human debug trace |
| 0x01 | TELEMETRY   | sensors / env cues |
| 0x02 | GEOM_2D     | SVG primitives |
| 0x03 | GEOM_3D     | OBJ primitives |
| 0x04 | GEOM_GLB    | GLB chunk events |
| 0x05 | AUDIO       | waveform / note events |
| 0x06 | HAPTIC      | vibro patterns |
| 0x07 | RESERVED    | future |

## 15.4.2 Kinds (u8)
Kinds define the payload schema. A stream has a single `kind` set at OPEN:

| kind | Name              | Payload family |
|------|-------------------|----------------|
| 0x10 | SVG_LINESET       | line segments, polylines |
| 0x11 | SVG_PATH          | path commands |
| 0x20 | OBJ_MESH          | vertices/faces/material refs |
| 0x30 | GLB_CHUNK         | binary chunk slices |
| 0x40 | PCM16_FRAME       | signed 16-bit samples |
| 0x41 | NOTE_EVENT        | freq/amplitude/duration |
| 0x50 | SENSOR_EVENT      | (key,value) pairs |

---
