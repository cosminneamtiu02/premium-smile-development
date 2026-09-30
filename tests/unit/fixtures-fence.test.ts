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

const SRC = fileURLToPath(new URL('../../src', import.meta.url));

/** A file allowed to import a fixture: a story, a test, or a fixture itself. */
const WORKBENCH = /\.(stories|test|fixtures)\.tsx?$/;

/** Every module specifier a source file names, comments stripped first. */
function specifiers(source: string): string[] {
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  return [
    ...code.matchAll(
      /\bfrom\s+['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ),
  ].map((match) => match[1] ?? match[2] ?? '');
}

describe('fixtures fence — only stories, tests and fixtures import a *.fixtures module', () => {
  const files = readdirSync(SRC, { recursive: true, encoding: 'utf8' }).filter(
    (file) => /\.tsx?$/.test(file) && !WORKBENCH.test(file),
  );

  it('scans the runtime source (never vacuous)', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it('no runtime file imports a fixture', () => {
    const offenders = files.filter((file) =>
      specifiers(readFileSync(join(SRC, file), 'utf8')).some((spec) =>
        /\.fixtures(\.tsx?)?$/.test(spec),
      ),
    );
    expect(offenders).toEqual([]);
  });

  it('has teeth: a runtime-shaped import of a fixture is caught', () => {
    expect(
      specifiers("import { StandInColumn } from './Ribbon.fixtures';\n").some(
        (spec) => /\.fixtures(\.tsx?)?$/.test(spec),
      ),
    ).toBe(true);
    expect(
      specifiers("// import { x } from './A.fixtures';\n").some((spec) =>
        /\.fixtures(\.tsx?)?$/.test(spec),
      ),
    ).toBe(false);
  });
});
