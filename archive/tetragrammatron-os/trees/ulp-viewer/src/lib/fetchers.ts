import { parseYaml } from "./yaml";
import type { RenderMap, TreesIndex, TreeIndex, BranchIndex, BookIndex } from "./model";

export async function fetchText(url: string): Promise<string> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return await r.text();
}

export async function fetchJson<T>(url: string): Promise<T> {
  return JSON.parse(await fetchText(url)) as T;
}

export async function fetchYaml<T>(url: string): Promise<T> {
  return parseYaml<T>(await fetchText(url));
}

export function join(base: string, rel: string): string {
  if (rel.startsWith("http")) return rel;
  return base.replace(/\/+$/, "") + "/" + rel.replace(/^\/+/, "");
}

export function parseJsonl(text: string): any[] {
  const out: any[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    try { out.push(JSON.parse(line)); } catch {}
  }
  return out;
}

export function normalizeRecords(records: any[]): { id: string; title: string; fields: any; assets: string[]; path: string | null }[] {
  const entries: any[] = [];
  for (const r of records) {
    if (!r || typeof r !== "object") continue;

    // Entry-object form
    if (r.id || r.title || r.fields || r.assets) {
      entries.push({
        id: r.id ?? r.k ?? "entry",
        title: r.title ?? r.k ?? r.id ?? "entry",
        fields: r.fields ?? (r.k ? { [r.k]: r.v } : {}),
        assets: Array.isArray(r.assets) ? r.assets : [],
        path: typeof r.path === "string" ? r.path : null
      });
      continue;
    }

    // Event form
    if (r.k) {
      entries.push({
        id: `${String(r.k)}@${String(r.t ?? "")}`,
        title: String(r.k),
        fields: { [String(r.k)]: r.v },
        assets: [],
        path: null
      });
    }
  }
  return entries;
}

export async function loadRenderMap(base: string): Promise<RenderMap> {
  return await fetchYaml<RenderMap>(join(base, "descriptors/render.map.yaml"));
}

export async function loadTreeGraph(base: string, map: RenderMap) {
  const TDIR = map.roots.trees_dir;
  const treesIdx = await fetchJson<TreesIndex>(join(base, `${TDIR}/index.json`));
  const trees = treesIdx.trees ?? [];

  const graph: {
    trees: {
      name: string;
      branches: {
        name: string;
        books: {
          name: string;
          entries: string | null;
          entriesData: ReturnType<typeof normalizeRecords>;
        }[];
      }[];
    }[];
  } = { trees: [] };

  for (const t of trees) {
    const tIdx = await fetchJson<TreeIndex>(join(base, `${TDIR}/${t}/index.json`));
    const branches = tIdx.branches ?? [];
    const tNode = { name: t, branches: [] as any[] };

    for (const b of branches) {
      const bIdx = await fetchJson<BranchIndex>(join(base, `${TDIR}/${t}/branches/${b}/index.json`));
      const books = bIdx.books ?? [];
      const bNode = { name: b, books: [] as any[] };

      for (const book of books) {
        const bookIdx = await fetchJson<BookIndex>(join(base, `${TDIR}/${t}/branches/${b}/books/${book}/index.json`));
        const hasEntries = bookIdx.has_entries ?? false;

        let entriesData: any[] = [];
        if (hasEntries) {
          const entriesRel = "entries.jsonl";
          const text = await fetchText(join(base, `${TDIR}/${t}/branches/${b}/books/${book}/${entriesRel}`));
          entriesData = normalizeRecords(parseJsonl(text));
        }

        bNode.books.push({ name: book, entries: hasEntries ? "entries.jsonl" : null, entriesData });
      }

      tNode.branches.push(bNode);
    }

    graph.trees.push(tNode);
  }

  return graph;
}

