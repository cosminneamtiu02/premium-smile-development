import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// THE GUTTER SINGLE-SPELLING FENCE (ui/Container promotion lane, board
// container-gutter.plan.md fb-343; G2 react-reviewer MEDIUM, 2026-09-04).
// The promotion's whole point is that src/ never grows a fourth copy of the
// clamp — but Container.test.tsx's own residue counter can only see its OWN
// file, and this repo has watched exactly this invariant rot before: the cx
// promotion's aftermath was SEVEN regrown inline copies, caught only by a
// later whole-repo review (§4's fb-307 history). This test is the machine
// for the src-wide half: the moment any file beyond the allowlist below
// spells the margin utility — a page band pasting the number instead of
// composing <Container> or importing `containerClasses` — the fast unit
// project (and the pre-push hook, and CI) goes red naming the file.
//
// The allowlist is DELIBERATE spellings, each with a reason to be
// independent of the constant:
//   · Container.tsx            — the definition itself (its file-local test
//                                pins the pair verbatim and counts it once);
//   · Container.test.tsx       — the byte-pin written out so a silent edit
//                                to the constant fails against an
//                                independent copy (the Eyebrow RECIPE
//                                convention);
//   · Footer.test.tsx          — the pre-lane cross-section pin ("the SAME
//                                clamp the Header pill wears"), kept
//                                UNTOUCHED as the retrofit's proof-(ii)
//                                witness — it polices the atom through the
//                                section.
// Growing this list is a deliberate act with a comment naming the reason,
// never a paste.

const SRC_DIR = fileURLToPath(new URL('../../src', import.meta.url));

/** The distinctive half of the pair — the margin utility. `@container` alone
 * is legitimately everywhere (every band context); this string is the number
 * the promotion de-duplicated. Since 2026-10-09 its middle term is a clamp of
 * its own (THE PHONE GUTTER, CLAUDE.md §15.35). */
const CLAMP_SPELLING = 'mx-[clamp(1rem,clamp(5vw,30vw_-_7.5rem,10vw),12.5rem)]';

/** The spelling it replaced — the one-slope gutter, 10vw on a phone too.
 * RETIRED, so it may appear NOWHERE in src/: a band that pasted it from an
 * older record would quietly bring back the phone gutter the owner halved —
 * and, Tailwind generating a rule for every class-like string it scans, even
 * a comment spelling it would ship that rule as dead CSS. Built from two
 * halves for that very reason: written whole here, this guard would be the
 * one file still making Tailwind ship it (measured on the lane's first
 * build, 2026-10-09). */
const RETIRED_SPELLING = 'mx-[clamp(1rem,' + '10vw,12.5rem)]';

const ALLOWED = [
  'components/sections/Footer/Footer.test.tsx',
  'components/ui/Container/Container.test.tsx',
  'components/ui/Container/Container.tsx',
];

describe('the gutter clamp has ONE definition in src/ (board fb-343)', () => {
  const sourceFiles = readdirSync(SRC_DIR, {
    recursive: true,
    encoding: 'utf8',
  })
    .filter((name) => /\.(ts|tsx)$/.test(name))
    // readdirSync answers with the platform's separator — backslashes on
    // Windows — while ALLOWED is spelled with slashes; normalize so the
    // census compares paths, not separators (the win32 workstation,
    // 2026-09-18). join() below accepts either.
    .map((name) => name.replaceAll('\\', '/'))
    .sort();

  it('scans a real tree (the fence never passes vacuously)', () => {
    expect(sourceFiles.length).toBeGreaterThan(40);
  });

  it('finds the spelling ONLY in the definition and the two deliberate pins', () => {
    const spelling = sourceFiles.filter((name) =>
      readFileSync(join(SRC_DIR, name), 'utf8').includes(CLAMP_SPELLING),
    );
    expect(spelling).toEqual(ALLOWED);
  });

  it('finds the RETIRED one-slope spelling nowhere in src/ (§15.35)', () => {
    const retired = sourceFiles.filter((name) =>
      readFileSync(join(SRC_DIR, name), 'utf8').includes(RETIRED_SPELLING),
    );
    expect(retired).toEqual([]);
  });

  it('the definition itself is present (the allowlist is not stale)', () => {
    // If Container.tsx ever stopped spelling the pair, the fence above would
    // still pass on the two pins alone while the atom silently emitted
    // something else — this pin makes that impossible.
    const definition = readFileSync(
      join(SRC_DIR, 'components/ui/Container/Container.tsx'),
      'utf8',
    );
    expect(definition).toContain(CLAMP_SPELLING);
  });
});
