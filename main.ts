// Dapur Kilat — hand-in program (Node 22, standard library only).
// It copies this repository's game/ and screenshots/ into the output
// directory and writes the dossier.json the judge reads, using the kit's
// vendored make.fun library (vendor/makefun-game.ts, unchanged).
//
// Run locally:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader MAKEFUN_OUTPUT_DIR is unset and /output is used.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

if (!existsSync(gameDir)) {
  throw new Error(`game/ not found beside main.ts (looked in ${repoRoot})`);
}

// Start from a clean output directory so stale files never leak into an entry.
// Clear only the CONTENTS of outDir, never outDir itself: in the grader
// outDir is a mount point (/output), and removing a mount point fails with
// EBUSY ("Device or resource busy"), which aborted the run with exit 1.
mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(join(outDir, entry), { recursive: true, force: true });
}
cpSync(gameDir, join(outDir, 'game'), { recursive: true });

const outShots = join(outDir, 'screenshots');
mkdirSync(outShots, { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, outShots, { recursive: true });
}

// The scorer's own caps for this bounty: only text_max_bytes shapes the
// dossier bytes; the rest refuse an entry the scorer would refuse.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const dossier = buildDossier(outDir, dossierCaps);
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Dapur Kilat handed in: ${outDir} (${dossier.length} dossier bytes)`);
