#!/usr/bin/env node
/**
 * Package NEXUS for Anvita upload.
 * Uses forward-slash zip paths (Windows Compress-Archive uses backslashes and breaks Anvita).
 */
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..");
const pkg = join(root, "nexus-service-agent");
const dist = join(pkg, "dist");
const zipPath = join(dist, "nexus-trust-agent-anvita.zip");
const staging = join(dist, "staging");
const skillDir = join(staging, "nexus-trust-agent");
const skillName = "nexus-trust-agent";

rmSync(staging, { recursive: true, force: true });
mkdirSync(join(skillDir, "scripts"), { recursive: true });
mkdirSync(join(skillDir, "references"), { recursive: true });
mkdirSync(join(skillDir, "assets"), { recursive: true });

copyFileSync(join(pkg, "SKILL.md"), join(skillDir, "SKILL.md"));
copyFileSync(join(pkg, "scripts", "handler.mjs"), join(skillDir, "scripts", "handler.mjs"));
copyFileSync(join(pkg, "scripts", "status.mjs"), join(skillDir, "scripts", "status.mjs"));
cpSync(join(pkg, "references"), join(skillDir, "references"), { recursive: true });
cpSync(join(pkg, "assets"), join(skillDir, "assets"), { recursive: true });

const deploymentsSrc = existsSync(join(pkg, "deployments.json"))
  ? join(pkg, "deployments.json")
  : join(root, "deployments.example.json");
copyFileSync(deploymentsSrc, join(skillDir, "deployments.json"));

function walkFiles(dir, base = skillDir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      entries.push(...walkFiles(full, base));
      continue;
    }
    const rel = relative(base, full).split("\\").join("/");
    entries.push({ full, rel: `${skillName}/${rel}` });
  }
  return entries;
}

const zip = new AdmZip();
for (const { full, rel } of walkFiles(skillDir)) {
  zip.addFile(rel, readFileSync(full));
}

mkdirSync(dist, { recursive: true });
zip.writeZip(zipPath);
rmSync(staging, { recursive: true, force: true });

const entries = new AdmZip(zipPath).getEntries().map((e) => e.entryName);
console.log(`Created: ${zipPath}`);
console.log("Zip entries (forward slashes):");
for (const e of entries) console.log(`  ${e}`);

if (!entries.includes(`${skillName}/SKILL.md`)) {
  console.error("ERROR: nexus-trust-agent/SKILL.md missing from zip");
  process.exit(1);
}
