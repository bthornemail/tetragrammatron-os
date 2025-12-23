#!/usr/bin/env node
/**
 * gen_tree_indexes.mjs
 *
 * Read-only observer that emits index.json manifests
 * from the Tree-of-Life directory structure.
 *
 * Idempotent, deterministic, safe.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.argv[2] || "trees";

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); }
  catch { return false; }
}

function isFile(p) {
  try { return fs.statSync(p).isFile(); }
  catch { return false; }
}

function listDirs(p) {
  return fs.readdirSync(p)
    .filter(n => isDir(path.join(p, n)))
    .sort();
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
  console.log("wrote", p);
}

function main() {
  if (!isDir(ROOT)) {
    console.error("Not a directory:", ROOT);
    process.exit(1);
  }

  const trees = listDirs(ROOT).filter(n => n !== "index.json");

  // trees/index.json
  writeJson(path.join(ROOT, "index.json"), { trees });

  for (const tree of trees) {
    const treeDir = path.join(ROOT, tree);
    const branchesDir = path.join(treeDir, "branches");
    const branches = isDir(branchesDir) ? listDirs(branchesDir) : [];

    // trees/<tree>/index.json
    writeJson(path.join(treeDir, "index.json"), { branches });

    for (const branch of branches) {
      const branchDir = path.join(branchesDir, branch);
      const booksDir = path.join(branchDir, "books");
      const books = isDir(booksDir) ? listDirs(booksDir) : [];

      // trees/<tree>/branches/<branch>/index.json
      const branchIndex = { books: [] };
      for (const book of books) {
        const bookDir = path.join(booksDir, book);
        const entriesPath = path.join(bookDir, "entries.jsonl");
        if (isFile(entriesPath)) {
          branchIndex.books.push(book);
        }
      }
      branchIndex.books.sort();
      writeJson(path.join(branchDir, "index.json"), branchIndex);

      // trees/<tree>/branches/<branch>/books/<book>/index.json
      for (const book of books) {
        const bookDir = path.join(booksDir, book);
        const entriesPath = path.join(bookDir, "entries.jsonl");
        const bookIndex = {
          has_entries: isFile(entriesPath)
        };
        writeJson(path.join(bookDir, "index.json"), bookIndex);
      }
    }
  }
}

main();




