import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const roots = ["src", "scripts", "test", "e2e"];
const extensions = new Set([".ts", ".tsx", ".js", ".mjs"]);
let checked = 0;
const violations = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (extensions.has(extname(path))) {
      checked += 1;
      const lines = (await readFile(path, "utf8")).split("\n").length;
      if (lines > 500) violations.push(`${path}: ${lines}`);
    }
  }
}
for (const root of roots) await walk(root);
if (violations.length) { console.error(violations.join("\n")); process.exit(1); }
console.log(`Checked ${checked} files; all are within 500 lines.`);
