// Aurora Flip, a best-game-01 entry (Node 22, standard library only).
// The game is the static files under game/, played offline from
// game/index.html with no library and no network request. This program
// hands it in: it copies game/ and screenshots/ beside this file into
// the output directory and writes dossier.json with the vendored
// make.fun library, the summary the judge reads.
//
// Serve the game locally with `node serve.ts`, then open the address it
// prints. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(output, { recursive: true });
cpSync(join(root, 'game'), join(output, 'game'), { recursive: true });
mkdirSync(join(output, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(output, 'screenshots'), { recursive: true });
}

// The scorer's own caps, as the kit's gate states them: the dossier text
// is capped at 160 KiB, screenshots at 4 files of 256 KiB each, and
// game/ at 993 entries and 48 MiB, with no path over 1000 bytes.
writeFileSync(
  join(output, 'dossier.json'),
  buildDossier(output, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
