import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// NO TOUCH EMULATION IN THE BROWSER PROJECTS (2026-10-15, PR #166's CI).
//
// The Vitest browser projects (components, storybook) run their files one
// after another in a SHARED Chromium tab. Playwright launches that browser
// with a mouse forced in (`--blink-settings=primaryHoverType=…`), and switching
// Chromium's touch emulation on and back off through `cdp()` does not restore
// it: on CI's headless Linux the tab then reports `(pointer: fine)` and
// `(hover: hover)` FALSE for every LATER file — the band scale's `scalable:`
// regime and every Tailwind `hover:` style silently stop applying — while a Mac
// falls back to its real trackpad and stays green. PR #166 lost 11
// PostList.scale cases and 7 TextButton hover tests that way;
// DoctorShowcase.test.tsx had recorded the same lesson on 2026-10-01.
//
// So a coarse pointer is tested STATICALLY in these projects (walk the CSSOM:
// the rules sit under `@media (pointer: fine)` — DoctorShowcase's and
// PostList.scale's GATES cases) and LIVE in tests/e2e, where every project gets
// a fresh browser. This file refuses the device-emulation calls in any src
// test or story file.

const SRC = join(process.cwd(), 'src');

/** Every test and story file under src/, recursively. */
const browserFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return browserFiles(path);
    return /\.(test|stories)\.tsx?$/.test(entry.name) ? [path] : [];
  });

/** The CDP commands that change the shared tab's input devices. A comment may
 *  name them (the lesson needs explaining); a CALL — a `send(` with the
 *  command as its quoted first argument — may not. */
const FORBIDDEN = [
  'Emulation.setTouchEmulationEnabled',
  'Emulation.setEmitTouchEventsForMouse',
] as const;

const escape = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CALL = new RegExp(
  `\\bsend\\s*\\(\\s*['"\`](${FORBIDDEN.map(escape).join('|')})['"\`]`,
  'g',
);

const offendersIn = (source: string): string[] =>
  [...source.matchAll(CALL)].map((match) => match[1] ?? '');

describe('no touch emulation in the Vitest browser projects (PR #166, CI’s Linux)', () => {
  it('finds the browser test and story files it scans (never vacuous)', () => {
    const files = browserFiles(SRC);
    expect(files.length).toBeGreaterThan(100);
    expect(files.some((file) => file.endsWith('.test.tsx'))).toBe(true);
    expect(files.some((file) => file.endsWith('.stories.tsx'))).toBe(true);
  });

  it('has teeth: each forbidden call is caught in a sample source, a comment naming it is not', () => {
    for (const call of FORBIDDEN) {
      for (const quote of ["'", '"', '`']) {
        expect(
          offendersIn(
            `await session.send(${quote}${call}${quote}, { enabled: true });`,
          ),
        ).toEqual([call]);
      }
      expect(offendersIn(`// never call \`${call}\` here`)).toEqual([]);
    }
    expect(
      offendersIn("await session.send('Emulation.setEmulatedMedia', {});"),
    ).toEqual([]);
  });

  it('no src test or story file switches the shared tab’s touch emulation', () => {
    const offenders = browserFiles(SRC)
      .map((file) => ({
        file: relative(process.cwd(), file),
        calls: offendersIn(readFileSync(file, 'utf8')),
      }))
      .filter(({ calls }) => calls.length > 0);
    expect(
      offenders,
      'test a coarse pointer through the CSSOM (DoctorShowcase’s GATES case) or in tests/e2e — never by toggling the shared tab’s devices',
    ).toEqual([]);
  });
});
