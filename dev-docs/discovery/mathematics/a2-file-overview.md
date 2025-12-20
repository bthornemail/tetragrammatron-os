# A.2 File Overview

A CANBC file is:

```
[Header][Section0][Section1]...[SectionN]
```

- Header is fixed-size.
- Sections are TLV-like: `(tag, flags, length, payload)`.
- Tags are 4 ASCII bytes for readability and stable tooling.

---
