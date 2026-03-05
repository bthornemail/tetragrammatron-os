export type RenderMap = {
  version: number | string;
  roots: {
    trees_dir: string;
    obsidian_dir?: string;
    hardware_dir?: string;
  };
  render?: any;
};

export type TreesIndex = { trees: string[] };
export type TreeIndex = { branches: string[] };
export type BranchIndex = { books: string[] };
export type BookIndex = { has_entries: boolean };

export type Entry = {
  id: string;
  title: string;
  fields: Record<string, any>;
  assets: string[];
  path: string | null;
};

export type NodeMeta =
  | { kind: "entry"; tree: string; branch: string; book: string; entry: Entry }
  | { kind: "book"; tree: string; branch: string; book: string }
  | { kind: "branch"; tree: string; branch: string }
  | { kind: "tree"; tree: string };

