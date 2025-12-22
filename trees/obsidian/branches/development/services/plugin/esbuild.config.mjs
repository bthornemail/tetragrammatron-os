import esbuild from "esbuild";
import process from "process";

const isProd = process.argv.includes("--production");

const ctx = await esbuild.context({
  bundle: true,
  format: "cjs",
  target: "es2020",
  logLevel: "info",
  entryPoints: ["main.ts"],
  outfile: "main.js",
  external: ["obsidian"],
  sourcemap: isProd ? false : "inline",
  treeShaking: true,
  minify: isProd,
});

if (isProd) {
  await ctx.rebuild();
  process.exit(0);
} else {
  await ctx.watch();
}

