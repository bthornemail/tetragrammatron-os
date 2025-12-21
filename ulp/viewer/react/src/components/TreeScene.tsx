import React from "react";
import type { NodeMeta } from "../lib/model";
import { polar } from "../lib/layout";
import { NodeMesh } from "./NodeMesh";

export function TreeScene({
  base,
  graph,
  onPick
}: {
  base: string;
  graph: any;
  onPick: (m: NodeMeta) => void;
}) {
  const branchRadius = 14;
  const bookRadius = 6;
  const entryRadius = 2.3;

  return (
    <group>
      {graph.trees.map((t: any, ti: number) => (
        <group key={t.name} position={[0, 0, 0]}>
          {t.branches.map((b: any, bi: number) => {
            const [bx, by, bz] = polar(bi + ti * 0.25, t.branches.length + 0.0001, branchRadius);
            return (
              <group key={b.name} position={[bx, by, bz]}>
                {/* Branch node */}
                <NodeMesh
                  base={base}
                  position={[0, 0, 0]}
                  meta={{ kind: "branch", tree: t.name, branch: b.name }}
                  onPick={onPick}
                />

                {/* Books */}
                {b.books.map((book: any, i: number) => {
                  const [x, y, z] = polar(i, b.books.length, bookRadius);
                  return (
                    <group key={book.name} position={[x, y, z]}>
                      <NodeMesh
                        base={base}
                        position={[0, 0, 0]}
                        meta={{ kind: "book", tree: t.name, branch: b.name, book: book.name }}
                        onPick={onPick}
                      />

                      {/* Entries */}
                      {book.entriesData.map((e: any, ei: number) => {
                        const [ex, ey, ez] = polar(ei, book.entriesData.length, entryRadius);
                        const meta: NodeMeta = {
                          kind: "entry",
                          tree: t.name,
                          branch: b.name,
                          book: book.name,
                          entry: {
                            id: e.id,
                            title: e.title,
                            fields: e.fields ?? {},
                            assets: e.assets ?? [],
                            path: e.path ?? null
                          }
                        };

                        // Convention candidates (relative to vault base)
                        const baseDir = `trees/${t.name}/branches/${b.name}/books/${book.name}`;
                        const candidates = [
                          ...(Array.isArray(e.assets) ? e.assets : []),
                          `${baseDir}/assets/${e.id}.glb`
                        ];

                        return (
                          <NodeMesh
                            key={e.id}
                            base={base}
                            position={[ex, 0.5, ez]}
                            meta={meta}
                            assetCandidates={candidates}
                            onPick={onPick}
                          />
                        );
                      })}
                    </group>
                  );
                })}
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}

