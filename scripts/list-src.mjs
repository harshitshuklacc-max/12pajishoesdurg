import { readdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";

const roots = [
  "src/app",
  "src/components",
  "src/app/api",
];

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p.replace(/\\/g, "/"));
  }
}

const lines = [];
for (const r of roots) {
  lines.push(`## ${r}`);
  const out = [];
  walk(r, out);
  out.sort();
  lines.push(...out);
  lines.push("");
}
writeFileSync("_file_list_temp.txt", lines.join("\n"), "utf8");
console.log("wrote", lines.length, "lines");
