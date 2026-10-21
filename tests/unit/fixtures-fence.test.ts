import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// THE FIXTURES FENCE (G2 react, real-reviews lane, 2026-09-30). A
// `*.fixtures.*` module beside a component holds workbench data: the ribbon's
// stand-in column, the reviews deck's six FABRICATED testimonials (lib/reviews'
// D15 — fabricated copy never ships). Only a story, a test or another fixture
// may import one; a page, a band or a lib module that did would ship the
// fabricated copy to every visitor. The band's own `?raw` guard fences its two
// runtime files; this walks the whole of src/, the tests/unit/lib-react-free
// precedent, so the next page or band that reaches for a fixture fails CI.
//
// WHAT IT READS (2026-10-21, the TypeScript review of sections/ShareLinks,
// round 3 — whose server-render worker, ShareLinks.worker.fixtures.tsx, has no
// other fence): every way a module can be named — `from '…'` (an import or a
// re-export), a bare side-effect `import '…'`, a dynamic `import('…')`, and a
// module URL built for the bundler, `new URL('…', import.meta.url)`, the way a
// Worker's entry is named — with a query Vite reads (`?raw`, `?worker`,
// `?url`) or without; and the comments are stripped in ONE pass, so a `/*`
// inside a `//` comment opens no block. Until that day the scanner read the
// first and the third alone, a fixture's specifier had to END the string, and
// every block comment was stripped first, so a `/*` written in a `//` comment
// swallowed the code after it up to the next block's end — an import of a
// fixture among it.

const SRC = fileURLToPath(new URL('../../src', import.meta.url));

/** A file allowed to import a fixture: a story, a test, or a fixture itself. */
const WORKBENCH = /\.(stories|test|fixtures)\.tsx?$/;

/** TS without its comments, in ONE left-to-right pass — sections/ShareLinks'
 *  suite's `code`, after tests/unit/blog-tags-sync.test.ts's `tsCode`: string
 *  literals stepped over whole, a `//` comment consumed before a `/*` inside
 *  it can open a block. */
const code = (text: string): string =>
  text.replace(
    /('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|(?<=^|\s)\/\/[^\n]*/gm,
    (match: string, literal: string | undefined) => literal ?? ' ',
  );

/** Every way a module is named (WHAT IT READS): `from '…'`, `import '…'` or
 *  `import('…')`, and `new URL('…', import.meta.url)`. */
const SPECIFIER =
  /\bfrom\s*(['"`])([^'"`]+)\1|\bimport\s*\(?\s*(['"`])([^'"`]+)\3|\bnew\s+URL\s*\(\s*(['"`])([^'"`]+)\5\s*,\s*import\.meta\.url\b/g;

/** A specifier that names a fixture — its extension written or not, a query
 *  Vite reads after it or not. */
const FIXTURE = /\.fixtures(\.tsx?)?(\?.*)?$/;

/** Every module specifier a source file names, comments stripped first. */
function specifiers(source: string): string[] {
  return [...code(source).matchAll(SPECIFIER)].map(
    (match) => match[2] ?? match[4] ?? match[6] ?? '',
  );
}

/** Whether a source names a fixture. */
const namesAFixture = (source: string): boolean =>
  specifiers(source).some((spec) => FIXTURE.test(spec));

describe('fixtures fence — only stories, tests and fixtures import a *.fixtures module', () => {
  const files = readdirSync(SRC, { recursive: true, encoding: 'utf8' }).filter(
    (file) => /\.tsx?$/.test(file) && !WORKBENCH.test(file),
  );

  it('scans the runtime source (never vacuous)', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it('no runtime file imports a fixture', () => {
    const offenders = files.filter((file) =>
      namesAFixture(readFileSync(join(SRC, file), 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  it('has teeth: a runtime-shaped import of a fixture is caught', () => {
    expect(
      namesAFixture("import { StandInColumn } from './Ribbon.fixtures';\n"),
    ).toBe(true);
    expect(namesAFixture("// import { x } from './A.fixtures';\n")).toBe(false);
  });

  it.each([
    ['a bare side-effect import', "import './A.fixtures';\n"],
    ['a re-export', "export * from './A.fixtures.tsx';\n"],
    ['a dynamic import', "const a = await import('./A.fixtures');\n"],
    [
      'a Worker built from a module URL',
      "const w = new Worker(new URL('./A.worker.fixtures.tsx', import.meta.url), { type: 'module' });\n",
    ],
    ['a query Vite reads', "import text from './A.fixtures.tsx?raw';\n"],
    [
      'an import after a block opener inside a line comment',
      [
        '// a note that names a /* block opener',
        "import { x } from './A.fixtures';",
        '/* a real block */',
        'export const y = x;',
      ].join('\n'),
    ],
  ])('has teeth for every way a module is named: %s', (_case, source) => {
    expect(namesAFixture(source)).toBe(true);
  });

  it.each([
    ['a line comment', "// import './A.fixtures';\n"],
    ['a block comment', "/* new URL('./A.fixtures.tsx', import.meta.url) */\n"],
    ['a module that is no fixture', "import { a } from './A.fixturesque';\n"],
  ])('names no fixture in %s', (_case, source) => {
    expect(namesAFixture(source)).toBe(false);
  });
});
