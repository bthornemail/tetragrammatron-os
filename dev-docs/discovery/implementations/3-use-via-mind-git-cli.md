# 3. Use via MIND-GIT CLI
node bin/mind-git-metadata.cjs kernel:analyze .
node bin/mind-git-metadata.cjs kernel:export . --format ipfs
```

---

## 📊 Test Results

### Tested on Real Repositories

#### 1. **Lodash** (JavaScript utility library)
- **Components Analyzed**: 18
- **Relationships Found**: 84
- **Layer Distribution**: Layers 2, 3, 7, 8
- **Mathematical Content**: 54% of components
- **Export Size**: ~45KB (all formats)

#### 2. **Flask** (Python web framework)
- **Components Analyzed**: 22
- **Relationships Found**: 180
- **Layer Distribution**: Layers 2, 3, 7, 8
- **Mathematical Content**: None detected (expected)
- **Export Size**: ~52KB (all formats)

#### 3. **MIND-GIT** (This repository)
- **Components Analyzed**: 701 (including dependencies)
- **Relationships Found**: 370,859
- **Mathematical Components**: 479 (layers 1-2-3)
- **Layer 1 (Foundation)**: 29 components
- **Layer 2 (Core)**: 435 components
- **Export Formats**: All 6 formats working

---

## 🏗️ Architecture

### Universal Metadata Kernel

**File**: `universal-metadata-kernel.js`

#### Capabilities:
1. **Repository Detection**
   - Automatically detects: JavaScript/TypeScript, Python, Rust, Go, Java, C++
   - Identifies frameworks, build systems, test frameworks
   - Detects mathematical content (polynomials, proofs, formal systems)

2. **Layer Classification** (8 Universal Layers)
   - Layer 1: Mathematical Foundation
   - Layer 2: Core Implementation
   - Layer 3: API/Interface
   - Layer 4: Services/Business Logic
   - Layer 5: Data Layer
   - Layer 6: UI/Presentation
   - Layer 7: Tests
   - Layer 8: Documentation

3. **Component Analysis**
   - Complexity scoring (logarithmic scale + pattern detection)
   - Mathematical content extraction (concepts, theorems, formal systems)
   - Dependency mapping
   - Test coverage calculation

4. **Output Generation**
   - **AGENTS.md** per component (AI development contracts)
   - **CanvasL visualization** (.canvas file for Obsidian)
   - **Component registry** (JSONL format)
   - **Relationship graph** (dependency network)

### Universal Exporter

**File**: `universal-exporter.js`

#### Export Formats:

1. **JSON** (`knowledge-base.json`)
   - Standard machine-readable format
   - Complete component metadata
   - Statistics and hash verification

2. **JSON-LD** (`knowledge-base.jsonld`)
   - Linked Data for Semantic Web
   - Schema.org vocabulary
   - RDF-compatible

3. **Markdown** (`knowledge-base.md`)
   - Human-readable documentation
   - Organized by layers
   - Includes statistics tables

4. **RDF/Turtle** (`knowledge-base.ttl`)
   - Semantic Web triple format
   - SPARQL-queryable
   - Ontology-based

5. **IPFS Export** (`ipfs-export/`)
   - Content-addressed files
   - Individual component JSONs
   - Master index + README
   - Ready for `ipfs add -r`

6. **Federation Manifest** (`federation-manifest.json`)
   - P2P replication instructions
   - Merkle tree for verification
   - Cryptographic signatures
   - Dependency graphs

---

## 🎨 Generated Artifacts

### For Each Repository Analyzed:

```
.metadata-kernel/
├── components/
│   └── registry.jsonl              # Component index
├── relationships/                   # (Reserved for future use)
├── exports/
│   ├── knowledge-base.json         # JSON export
│   ├── knowledge-base.jsonld       # Linked Data
│   ├── knowledge-base.md           # Markdown docs
│   ├── knowledge-base.ttl          # RDF/Turtle
│   ├── federation-manifest.json    # P2P manifest
│   └── ipfs-export/
│       ├── index.json
│       ├── README.md
│       └── <hash>.json             # Per-component files
├── templates/                       # (Reserved for future use)
└── repository-structure.canvas      # CanvasL visualization
```

### For Each Component Directory:

```
component-dir/
└── AGENTS.md                        # AI development contract
```

---

## 🧪 CLI Integration

### MIND-GIT CLI Commands

```bash