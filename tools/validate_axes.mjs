#!/usr/bin/env node
/**
 * validate_axes.mjs
 *
 * Structural validator for Tree-of-Life branches.
 * Enforces four-axis ontology.
 */

import fs from "node:fs";
import path from "node:path";

const REQUIRED_AXES = [
  "freedom",
  "autonomy",
  "sovereignty",
  "context"
];

const CONTEXT_SUBFOLDERS = [
  "networks",
  "views",
  "connections",
  "documents",
  "assets",
  "services"
];

function die(msg) {
  console.error("✖", msg);
  process.exit(1);
}

function assertDir(p) {
  if (!fs.existsSync(p) || !fs.statSync(p).isDirectory()) {
    die(`Missing directory: ${p}`);
  }
}

function main() {
  const treesDir = "trees";
  assertDir(treesDir);

  const trees = fs.readdirSync(treesDir);

  for (const tree of trees) {
    const branchesDir = path.join(treesDir, tree, "branches");
    if (!fs.existsSync(branchesDir)) continue;

    const branches = fs.readdirSync(branchesDir);
    for (const branch of branches) {
      const branchDir = path.join(branchesDir, branch);

      console.log(`✓ Checking ${tree}/${branch}`);

      // Required files
      ["AGENTS.md", "README.md"].forEach(f => {
        if (!fs.existsSync(path.join(branchDir, f))) {
          die(`Missing ${f} in ${branchDir}`);
        }
      });

      // Axes
      const presentAxes = fs.readdirSync(branchDir)
        .filter(n => fs.statSync(path.join(branchDir, n)).isDirectory());

      REQUIRED_AXES.forEach(axis => {
        if (!presentAxes.includes(axis)) {
          die(`Missing axis '${axis}' in ${branchDir}`);
        }
      });

      presentAxes.forEach(axis => {
        if (!REQUIRED_AXES.includes(axis)) {
          die(`Unknown axis '${axis}' in ${branchDir}`);
        }
      });

      // Context subfolders
      const contextDir = path.join(branchDir, "context");
      CONTEXT_SUBFOLDERS.forEach(sub => {
        assertDir(path.join(contextDir, sub));
      });
    }
  }

  console.log("✔ All branches structurally valid.");
}

main();

