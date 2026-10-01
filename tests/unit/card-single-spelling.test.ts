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
// TWO SIGNATURES SINCE THE CORNER AXIS (owner 2026-10-01, §15.29). Until that
// day one contiguous string served both jobs — `flex flex-col gap-3
// rounded-md` opened the definition (`cardClasses`) AND the dossier root it
// replaced (`… border border-line-subtle bg-surface p-6` continues from the
// same four utilities), so a paste of EITHER shape was caught by one fence.
// The radius now rides ui/Card's `corners` lookup and is composed at render,
// so the definition (`cardGeometry`) opens with its FOUR utilities alone,
// `@container flex flex-col gap-3`, and the old signature survives in exactly
// one place: Card.test.tsx's independent byte-pin of the default card. Hence
// two fences — the DEFINITION's signature, allowed in the atom and its pin,
// and the DOSSIER's, allowed in the pin alone — with the individual utilities
// still free everywhere: `flex flex-col` and `gap-3` are ordinary layout
// vocabulary in every story and section, and fencing them would be a fence
// nobody could live behind.
// THE LIMIT, NAMED RATHER THAN DISCOVERED: both fences are ORDER-SENSITIVE by
// construction. This repo runs no prettier-plugin-tailwindcss, so nothing
// normalises class order, and a hand-typed re-spelling in a different order —
// `flex-col flex gap-3 rounded-md` — slips past. That is the same limit
// every string fence here carries, the gutter clamp's included: it catches the
// PASTE, which is how copies actually spread, not every possible re-invention.
//
// The allowlists are DELIBERATE spellings, each with a reason to be
// independent of the constant:
//   · Card.tsx       — the definition itself (its file-local test counts it
//                      exactly once and its header prose writes the utilities
//                      apart on purpose);
//   · Card.test.tsx  — the byte-pin written out so a silent edit to the atom's
//                      constants fails against an independent copy (the
//                      ui/Eyebrow RECIPE convention); it carries BOTH
//                      signatures, since the default card's pin still reads
//                      `… gap-3 rounded-md …` in one breath.
// Growing a list is a deliberate act with a comment naming the reason,
// never a paste.

const SRC_DIR = fileURLToPath(new URL('../../src', import.meta.url));

/** The card surface's geometry — the four utilities `cardGeometry` spells,
 *  which every rendered card opens with (the corner, the clock, the tint and
 *  the tone row follow, each from its own constant or lookup). */
const CARD_SPELLING = '@container flex flex-col gap-3';

const ALLOWED = [
  'components/ui/Card/Card.test.tsx',
  'components/ui/Card/Card.tsx',
];

/** The DOSSIER root the promotion replaced, caught by its first four
 *  utilities — the shape a section would paste instead of composing <Card>. */
const DOSSIER_SPELLING = 'flex flex-col gap-3 rounded-md';

const DOSSIER_ALLOWED = ['components/ui/Card/Card.test.tsx'];

describe('the card surface has ONE definition in src/ (board fb-415)', () => {
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

  const spelling = (signature: string): string[] =>
    sourceFiles.filter((name) =>
      readFileSync(join(SRC_DIR, name), 'utf8').includes(signature),
    );

  it('scans a real tree (the fence never passes vacuously)', () => {
    expect(sourceFiles.length).toBeGreaterThan(40);
  });

  it('finds the definition’s spelling ONLY in the atom and its deliberate pin', () => {
    expect(spelling(CARD_SPELLING)).toEqual(ALLOWED);
  });

  it('finds the dossier’s spelling ONLY in the pin — no section pastes the old root', () => {
    expect(spelling(DOSSIER_SPELLING)).toEqual(DOSSIER_ALLOWED);
  });

  it('the definition itself is present (the allowlist is not stale)', () => {
    // If Card.tsx ever stopped spelling the geometry, the fence above would
    // still pass on the test pin alone while the atom silently emitted
    // something else — this pin makes that impossible. And the atom composes
    // its corner at render: the dossier shape must NOT be in its source, or
    // the `corners` lookup would be dead code beside a hard-wired radius.
    const definition = readFileSync(
      join(SRC_DIR, 'components/ui/Card/Card.tsx'),
      'utf8',
    );
    expect(definition).toContain(CARD_SPELLING);
    expect(definition).not.toContain(DOSSIER_SPELLING);
  });
});
