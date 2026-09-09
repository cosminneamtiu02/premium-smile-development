import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// THE CARD SURFACE'S SINGLE-SPELLING FENCE (ui/Card promotion lane, board
// .claude/plans/card-atom.plan.md, owner verdict fb-415).
// The promotion exists because the surface was ALREADY being spelled more
// than once: the two approved dossiers (TeamMemberCard, ServiceCard) and the
// archived ServicesTeaser <li> carried byte-identical roots, and the old repo
// managed five divergent spellings of the same idea. Card.test.tsx's own
// residue counter can only see ITS file — and this repo has watched exactly
// this invariant rot before: the cx promotion's aftermath was SEVEN regrown
// inline copies, caught only by a later whole-repo review (§4's fb-307
// history, recorded in lib/cx/cx.ts's header). This test is the machine for
// the src-wide half: the moment any file beyond the allowlist below spells
// the geometry — a section pasting the old dossier root instead of composing
// <Card> — the fast unit project (and the pre-push hook, and CI) goes red
// naming the file.
//
// WHY THIS PARTICULAR STRING. It is the contiguous signature shared by the
// definition (`cardClasses`) AND by the dossier spelling it replaces
// (`… border border-line-subtle bg-surface p-6` continues from the same four
// utilities), so a paste of EITHER shape is caught, while the individual
// utilities stay free everywhere: `flex flex-col` and `gap-3` are ordinary
// layout vocabulary in every story and section, and fencing them would be a
// fence nobody could live behind.
// THE LIMIT, NAMED RATHER THAN DISCOVERED: the fence is ORDER-SENSITIVE by
// construction. This repo runs no prettier-plugin-tailwindcss, so nothing
// normalises class order, and a hand-typed re-spelling in a different order —
// `flex-col flex gap-3 rounded-md` — slips past it. That is the same limit
// every string fence here carries, the gutter clamp's included: it catches the
// PASTE, which is how copies actually spread, not every possible re-invention.
//
// The allowlist is DELIBERATE spellings, each with a reason to be independent
// of the constant:
//   · Card.tsx       — the definition itself (its file-local test counts it
//                      exactly once and its header prose writes the utilities
//                      apart on purpose);
//   · Card.test.tsx  — the byte-pin written out so a silent edit to
//                      `cardClasses` fails against an independent copy (the
//                      ui/Eyebrow RECIPE convention).
// Growing this list is a deliberate act with a comment naming the reason,
// never a paste.

const SRC_DIR = fileURLToPath(new URL('../../src', import.meta.url));

/** The card surface's geometry — the string the promotion de-duplicated. */
const CARD_SPELLING = 'flex flex-col gap-3 rounded-md';

const ALLOWED = [
  'components/ui/Card/Card.test.tsx',
  'components/ui/Card/Card.tsx',
];

describe('the card surface has ONE definition in src/ (board fb-415)', () => {
  const sourceFiles = readdirSync(SRC_DIR, {
    recursive: true,
    encoding: 'utf8',
  })
    .filter((name) => /\.(ts|tsx)$/.test(name))
    .sort();

  it('scans a real tree (the fence never passes vacuously)', () => {
    expect(sourceFiles.length).toBeGreaterThan(40);
  });

  it('finds the spelling ONLY in the definition and its deliberate pin', () => {
    const spelling = sourceFiles.filter((name) =>
      readFileSync(join(SRC_DIR, name), 'utf8').includes(CARD_SPELLING),
    );
    expect(spelling).toEqual(ALLOWED);
  });

  it('the definition itself is present (the allowlist is not stale)', () => {
    // If Card.tsx ever stopped spelling the geometry, the fence above would
    // still pass on the test pin alone while the atom silently emitted
    // something else — this pin makes that impossible.
    const definition = readFileSync(
      join(SRC_DIR, 'components/ui/Card/Card.tsx'),
      'utf8',
    );
    expect(definition).toContain(CARD_SPELLING);
  });
});
