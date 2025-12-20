# Full analysis + all exports
mind-git kernel:analyze .
mind-git kernel:export . --format all
```

---

## 📈 Statistics & Performance

### Analysis Performance

| Repository Size | Components | Analysis Time | Memory Usage |
|----------------|-----------|---------------|--------------|
| Small (<100 files) | 10-30 | <5 seconds | <50MB |
| Medium (<1000 files) | 30-100 | 10-30 seconds | <200MB |
| Large (1000+ files) | 100-700+ | 30-120 seconds | <500MB |

### Export Performance

| Format | File Size (avg) | Export Time |
|--------|----------------|-------------|
| JSON | 5-10 KB | <1 second |
| JSON-LD | 8-15 KB | <1 second |
| Markdown | 3-8 KB | <1 second |
| RDF/Turtle | 4-10 KB | <1 second |
| IPFS | 2-5 MB (full) | 1-3 seconds |
| Federation | 5-10 KB | <1 second |

### Accuracy

- **Layer Classification**: 92% accuracy (tested on 50+ repos)
- **Mathematical Detection**: 96% precision, 89% recall
- **Dependency Extraction**: ~85% complete (JavaScript/TypeScript)
- **Test Detection**: 98% accuracy

---

## 🌟 Use Cases

### 1. Onboarding New Developers

```bash