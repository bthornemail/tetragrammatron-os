# Build 8^3 nodes: depth-3 cube: a/b/c where each in axes
nodes=[]
for a,b,c in itertools.product(axis_names, repeat=3):
    path=f"{a}/{b}/{c}"
    nid="n_"+hashlib.sha1(path.encode()).hexdigest()[:12]
    nodes.append({
        "kind":"layer",
        "dim":3,
        "axes":[a,b,c],
        "path":path,
        "id":nid,
        "labels":[a,b,c],
        "norm": {"path":path, "id":nid}
    })

kernel = {
    "kind":"repo.kernel",
    "version":"1.0",
    "rfc":"RFC-011",
    "generated_utc": datetime.datetime.utcnow().replace(microsecond=0).isoformat()+"Z",
    "branches":{
        "main":"Normalized fixed point",
        "current":"Integration manifold",
        "feature_axes":[f"feature/{a}" for a in axis_names],
        "release":"release/* immutable snapshots"
    },
    "axes":[{"name":n, "desc":d} for n,d in axes],
    "normalization":{
        "token":"lowercase kebab-case; ASCII; no unicode; no spaces",
        "path":"axis/axis/axis (depth=3) with '/' separators",
        "id":"sha1(path) truncated 12 hex, prefixed 'n_'"
    },
    "semantics":{
        "node_identity":"id is derived only from normalized path",
        "merge":"commutative, associative, idempotent on node sets by id",
        "projection":"Fano projection uses axis-triples as incidence candidates"
    }
}

rfc = f"""\