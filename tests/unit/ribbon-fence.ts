import { readdirSync, readFileSync } from 'node:fs';

// THE RIBBON'S FENCES READ ITS FILES ONE WAY (CLAUDE.md §15.26; §4's sharing
// table, row 1 — identical mechanics, extracted in the lane where the second
// consumer was born). This module serves the ribbon's three fences ONLY —
// ribbon-no-names, ribbon-never-moves-the-page and ribbon-lanes-sync — and
// nothing else imports it. The repo-wide story/test helper promotion (the
// recorded lane, CLAUDE.md §15.19 round 3: `stripComments` and its kin
// across the other fences) is a different, later thing: this file neither
// starts it nor stands in for it. Not a test itself — the unit project
// collects `*.test.ts` only.

const REPO = new URL('../../', import.meta.url);

/**
 * The ribbon's product files, by their path from the repo's root: every
 * module of the src/lib/ribbon-… folders but their tests and their recorded
 * numbers (the `.test.ts` and `.golden.ts` files — two dots in the name),
 * and the atom.
 */
export const RIBBON_FILES: readonly string[] = [
  ...readdirSync(new URL('src/lib/', REPO))
    .filter((folder) => folder.startsWith('ribbon-'))
    .flatMap((folder) =>
      readdirSync(new URL(`src/lib/${folder}/`, REPO))
        .filter((file) => /^[^.]+\.ts$/.test(file))
        .map((file) => `src/lib/${folder}/${file}`),
    ),
  'src/components/ui/Ribbon/Ribbon.tsx',
];

/** A file's source, by its path from the repo's root. */
export function sourceOf(file: string): string {
  return readFileSync(new URL(file, REPO), 'utf8');
}

/** A comment, a string or a template — whichever starts first, whole. */
const TOKEN =
  /\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g;

/** CODE ONLY: comments and text removed; a template that interpolates (`${`) is code, and stays. */
export function codeOnly(source: string): string {
  return source.replace(TOKEN, (token) =>
    token.startsWith('`') && token.includes('${') ? token : ' ',
  );
}

/** Comments removed, every string kept — what a computed member names, and what a class string declares. */
export function withoutComments(source: string): string {
  return source.replace(TOKEN, (token) =>
    token.startsWith('/') ? ' ' : token,
  );
}
