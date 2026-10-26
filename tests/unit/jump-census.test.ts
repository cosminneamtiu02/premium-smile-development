import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// THE JUMP CENSUS (owner, 2026-10-01, verbatim: "like in old webpage i want the
// book consultation, see our services, call hover button in bottom right and
// whatsapp button, contact button in top bar, more about me button in doctor
// card, to have that jump at you animation on hover. this should not affect
// buttons from footer"). ui/Button and ui/GlyphButton carry a `motion` axis
// whose `jump` cell is the old site's hover:scale-105 on its own 200ms clock
// (Button.tsx's THE JUMP); it is OPT-IN per call site, and the owner's list is
// closed at both ends — six buttons jump, and the Footer's discs, the reviews
// deck's prev/next, the map band's row discs, the burger panel's full-width
// Contact and the dialog's buttons hold still. This file keeps both halves
// the way tests/unit/accent-census.test.ts keeps the lavender's: a new
// `motion="jump"` anywhere in src turns it red until it is named here, and a
// named wearer that stops jumping turns it red too. The old pop's OTHER half,
// a shadow that grows on hover, was NOT ported, and the third test keeps it
// out of every file.
//
// COMMENTS ARE STRIPPED FIRST (the aura census's lesson): the wearers' and the
// atoms' headers quote the prop in prose.

const SRC_DIR = fileURLToPath(new URL('../../src', import.meta.url));

/** Who jumps — the owner's six buttons, by the file that asks, how often, and for what. */
const JUMPERS: Readonly<Record<string, { asks: number; buttons: string }>> = {
  'components/sections/Hero/Hero.tsx': {
    asks: 2,
    buttons:
      '„Programează o consultație" (the contact trigger) and „Vezi serviciile" (the services link)',
  },
  'components/sections/PersonnelCard/PersonnelCard.tsx': {
    asks: 1,
    buttons: '„Mai multe despre mine" — the doctor card’s one link',
  },
  'components/sections/Header/Header.tsx': {
    asks: 1,
    buttons:
      'the bar’s Contact (its full-width twin in the burger panel, NavMenu.tsx, holds still)',
  },
  'components/sections/FloatingActions/FloatingActions.tsx': {
    asks: 2,
    buttons: 'the call disc and the WhatsApp disc, through ui/GlyphButton',
  },
};

/** Who holds still — by the owner's word, or because he never named them. */
const STILL = [
  'components/sections/Footer/Footer.tsx', // "this should not affect buttons from footer"
  'components/sections/ReviewsCarousel/ReviewsDeck.tsx',
  'components/sections/ClinicLocation/ClinicLocation.tsx',
  'components/sections/Header/NavMenu.tsx',
  'components/sections/ContactModal/ContactModal.tsx',
  'components/sections/LanguageBanner/LanguageBanner.tsx',
];

const PASSES_JUMP = /\bmotion=["']jump["']/g;
/** The old pop's second half — a shadow that grows on hover or press — in any variant spelling. */
const SHADOW_POP =
  /\b(?:hover|active|focus|focus-visible|group-hover|group-active):(?:inset-)?shadow-/;

/**
 * Line and block comments out; strings and code stay. THREE passes, the
 * accent census's fix of 2026-10-02 (G2 typescript, 2026-10-14): a FULL-LINE
 * `//` comment goes first, because one that names a glob — `src/messages/*.json`
 * — would otherwise open a fake `/*` block and the next pass would delete real
 * code up to the next `*\/` (measured: 18 code lines of the team page, 9 of
 * the services page, 12 of the 404 page and 1 of ui/Keyword were invisible
 * to this census until then). Blocks second, trailing `//` comments last.
 */
function stripComments(source: string): string {
  return source
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

function read(file: string): string {
  return readFileSync(join(SRC_DIR, file), 'utf8');
}

function asks(source: string): number {
  return source.match(PASSES_JUMP)?.length ?? 0;
}

const sourceFiles = readdirSync(SRC_DIR, { recursive: true, encoding: 'utf8' })
  .filter((file) => /\.(ts|tsx|css)$/.test(file))
  .filter((file) => !/\.(test|stories)\.tsx?$/.test(file))
  .map((file) => file.replaceAll('\\', '/'));

describe('the jump — who wears it (owner, 2026-10-01)', () => {
  it('is asked for by the named files only, each as many times as the owner named a button there', () => {
    const askers = sourceFiles.filter(
      (file) => asks(stripComments(read(file))) > 0,
    );
    expect(askers.sort()).toEqual(Object.keys(JUMPERS).sort());
    for (const [file, { asks: count, buttons }] of Object.entries(JUMPERS)) {
      expect(asks(stripComments(read(file))), `${file} — ${buttons}`).toBe(
        count,
      );
    }
  });

  it('is refused by the Footer, the reviews deck, the map band, the panel’s Contact, the dialog and the banner', () => {
    for (const file of STILL) {
      expect(asks(stripComments(read(file))), file).toBe(0);
    }
  });

  it('never brings the old pop’s growing shadow back with it, anywhere in src', () => {
    for (const file of sourceFiles) {
      expect(SHADOW_POP.test(stripComments(read(file))), file).toBe(false);
    }
  });

  it('strips the prose mention, so the count is the prop and not the comment', () => {
    // A guard that cannot fail is not a guard: the Hero's own comment quotes
    // the prop, so the raw text must count MORE than the stripped.
    const raw = read('components/sections/Hero/Hero.tsx');
    expect(asks(raw)).toBeGreaterThan(asks(stripComments(raw)));
    expect(stripComments('a // motion="jump"\n/* motion="jump" */ b')).toBe(
      'a \n b',
    );
    expect(
      asks('<Button motion="jump" /> <GlyphButton motion=\'jump\' />'),
    ).toBe(2);
    expect(SHADOW_POP.test('hover:shadow-cta-lg')).toBe(true);
    expect(SHADOW_POP.test('shadow-aura hover:bg-surface')).toBe(false);
  });
});

// THE CARD JUMP (owner, 2026-10-11, the blog's first page — CLAUDE.md §15.39:
// "the pages should not be clickable yet. so just react on hover like a
// button"). sections/PostCard's article jumps on hover with no button under
// it: the jump SPELLED outside the two atoms, as its own constant (CARD_JUMP),
// because the `motion` axis belongs to ui/Button and ui/GlyphButton and a
// card is neither. This block names every file whose code spells a hover
// scale, and holds the card to the buttons' own numbers — the 200ms clock,
// the `ease-out` KEYWORD (Tailwind's `ease-out` utility is another curve),
// 105% and still under reduced motion — so the card and the buttons cannot
// drift (KEEP-IN-SYNC, §4).
const HOVER_SCALE = /\bhover:(?:\*:)?scale-/;

/** The files whose CODE spells a hover scale: the two button atoms and the named cards. */
const SPELLS_A_HOVER_SCALE = [
  'components/ui/Button/Button.tsx',
  'components/ui/GlyphButton/GlyphButton.tsx',
  'components/sections/PostCard/PostCard.tsx', // the blog card, 2026-10-11
  // The card carousel's tall chevrons (2026-10-17, the owner: "on hover it
  // gets a bit larger and lilla"): the CHEVRON inside each previous / next
  // button grows to 110 % on the jump clock — the button's own box never
  // scales, so its invisible strip cannot reach past the screen's edge.
  // And since 2026-10-25 (THE FLAT ROW — the owner: "on hover of non central
  // they turn the size of central and on hover of central they turn larger a
  // bit as they do now") the SLOT of a card in a flat-row carousel: the
  // centre card's to 105 %, a live side card's to the centre card's size —
  // the card's own jump turned off by its page (sections/PostCard's
  // `jump={false}`), held to Button's numbers by the block after this one.
  'components/sections/CardCarousel/CardCarousel.tsx',
];

/**
 * The value of `name` when its source joins string literals with `+` — and
 * ONLY literals: anything else in the capture (an identifier, a template
 * hole) would add classes this reader cannot see, so it throws instead of
 * returning a value that looks complete.
 */
function joinedLiterals(source: string, name: RegExp): string {
  const match = name.exec(source);
  if (!match?.[1]) throw new Error(`no ${String(name)} in the source`);
  const rest = match[1].replace(/'[^']*'/g, '').trim();
  if (!/^[+\s]*$/.test(rest)) {
    throw new Error(`${String(name)} joins more than string literals: ${rest}`);
  }
  return [...match[1].matchAll(/'([^']*)'/g)].map((m) => m[1]).join('');
}

/** One of Button's bracketed transition lists, read into its entries (the three lists hold one entry per property, in order). No example is spelled here: Tailwind turns any class-shaped text in a scanned file into a CSS rule, tests included. */
function transitionList(cell: string, longhand: string): string[] {
  const list = new RegExp(`\\[transition-${longhand}:([^\\]]+)\\]`).exec(cell);
  if (!list?.[1]) throw new Error(`no transition-${longhand} list in ${cell}`);
  return list[1].split(',');
}

describe('the card jump — a hover scale with no button under it (owner, 2026-10-11)', () => {
  it('is spelled in code by the two button atoms and the named cards only', () => {
    const spellers = sourceFiles.filter((file) =>
      HOVER_SCALE.test(stripComments(read(file))),
    );
    expect(spellers.sort()).toEqual([...SPELLS_A_HOVER_SCALE].sort());
  });

  it('jumps the blog card on the buttons’ own numbers', () => {
    const card = joinedLiterals(
      stripComments(read('components/sections/PostCard/PostCard.tsx')),
      /const CARD_JUMP =([^;]*);/,
    );
    expect(card).toBe(
      '[--jump:200ms] transition-[scale] duration-(--jump) ease-[ease-out] hover:scale-105 motion-reduce:hover:scale-100',
    );
    const button = joinedLiterals(
      stripComments(read('components/ui/Button/Button.tsx')),
      /\bjump:((?:\s*'[^']*'\s*\+?)+),/,
    );
    expect(button).toContain('[--jump:200ms]');
    expect(button).toContain('hover:scale-105');
    expect(button).toContain('motion-reduce:hover:scale-100');
    // The card's clock and curve are the ones Button gives its SCALE — read
    // off the very position `scale` holds in Button's per-property lists, so
    // a Button whose scale moved to another clock turns this red.
    const at = transitionList(button, 'property').indexOf('scale');
    expect(at, 'Button transitions its scale').toBeGreaterThanOrEqual(0);
    expect(transitionList(button, 'duration')[at]).toBe('var(--jump)');
    expect(transitionList(button, 'timing-function')[at]).toBe('ease-out');
  });

  it('refuses to read a constant that joins anything but string literals', () => {
    expect(() =>
      joinedLiterals("const X = 'a ' + EXTRA + 'b';", /const X =([^;]*);/),
    ).toThrow(/joins more than string literals/);
    expect(
      joinedLiterals("const X = 'a ' +\n  'b';", /const X =([^;]*);/),
    ).toBe('a b');
  });

  it('keeps real code a fake comment would hide — the three-pass stripper', () => {
    const code =
      "// see src/messages/*.json\nconst KEEP = 'hover:scale-105';\n// end */";
    expect(stripComments(code)).toContain('hover:scale-105');
  });
});

/** A bracketed transition list's entries, split at its TOP-LEVEL commas only
 *  — a cubic-bezier() keeps its own four. */
function entries(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let at = 0; at < list.length; at += 1) {
    const char = list[at];
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    else if (char === ',' && depth === 0) {
      out.push(list.slice(start, at));
      start = at + 1;
    }
  }
  out.push(list.slice(start));
  return out;
}

// THE SLOT JUMP (2026-10-25, sections/CardCarousel's THE FLAT ROW). In a
// flat-row carousel the card's SLOT grows on hover instead of the card — the
// Home band turns sections/PostCard's own jump off — so the slot is held to
// the same numbers as the card's jump and the buttons': Button's 105 % as the
// centre card's size (a live side card grows past it, to the centre card's
// rest size, `1 / --fsc`), Button's scale clock — 200ms, the `ease-out`
// KEYWORD — in both of the slot's transition strings, and still under
// reduced motion.
describe('the card carousel’s slot jump — the flat row’s hover, on the buttons’ numbers (owner, 2026-10-25)', () => {
  const carousel = stripComments(
    read('components/sections/CardCarousel/CardCarousel.tsx'),
  );
  const button = joinedLiterals(
    stripComments(read('components/ui/Button/Button.tsx')),
    /\bjump:((?:\s*'[^']*'\s*\+?)+),/,
  );
  const buttonScale = transitionList(button, 'property').indexOf('scale');

  it('grows the centre card to Button’s 105 %, a live side card to the centre card’s size, and neither under reduced motion', () => {
    const slide = /const FLAT_SLIDE = cx\(([^;]*)\);/.exec(carousel)?.[1];
    expect(slide, 'FLAT_SLIDE in the carousel').toBeDefined();
    const classes = [...(slide ?? '').matchAll(/'([^']*)'/g)]
      .map((match) => match[1])
      .join(' ');
    expect(classes).toContain('hover:scale-[max(1.05,calc(1/var(--fsc)))]');
    expect(classes).toContain('motion-reduce:hover:scale-100');
    // The floor of the max() IS Button's jump: 105 %.
    expect(button).toContain('hover:scale-105');
  });

  it('glides the slot’s scale on Button’s clock in the move — its own entry of three', () => {
    const move = joinedLiterals(carousel, /const FLAT_MOVE =([^;]*);/);
    expect(move).toContain('[--jump:200ms]');
    const list = (longhand: string): string[] =>
      entries(
        new RegExp(`\\[transition-${longhand}:([^\\]]+)\\]`).exec(move)?.[1] ??
          '',
      );
    const at = list('property').indexOf('scale');
    expect(at, 'the move transitions the slot’s scale').toBeGreaterThanOrEqual(
      0,
    );
    expect(list('duration')[at]).toBe(
      transitionList(button, 'duration')[buttonScale],
    );
    expect(list('timing-function')[at]).toBe(
      transitionList(button, 'timing-function')[buttonScale],
    );
  });

  it('glides it on the same clock in the snap — the card’s own jump’s clock, byte for byte', () => {
    const snap = joinedLiterals(carousel, /const FLAT_SNAP =([^;]*);/);
    const card = joinedLiterals(
      stripComments(read('components/sections/PostCard/PostCard.tsx')),
      /const CARD_JUMP =([^;]*);/,
    );
    // CARD_JUMP's clock half (its first four classes): the snap's own.
    const clock = card.split(' ').slice(0, 4).join(' ');
    expect(clock).toBe(
      '[--jump:200ms] transition-[scale] duration-(--jump) ease-[ease-out]',
    );
    expect(snap.startsWith(clock)).toBe(true);
  });

  it('spells exactly its four hover scales — the chevron’s two and the slot’s two — so a stray one anywhere in the file turns this red (the TypeScript review)', () => {
    // The file is allowlisted whole (SPELLS_A_HOVER_SCALE), so the count is
    // what keeps a fifth hover scale out: the chevron's grow and its
    // reduced-motion hold, the slot's grow and its reduced-motion hold.
    expect(carousel.match(/\bhover:(?:\*:)?scale-/g)?.length).toBe(4);
  });

  it('splits a transition list at its top-level commas only', () => {
    expect(entries('a,cubic-bezier(1,2,3,4),b')).toEqual([
      'a',
      'cubic-bezier(1,2,3,4)',
      'b',
    ]);
  });
});
