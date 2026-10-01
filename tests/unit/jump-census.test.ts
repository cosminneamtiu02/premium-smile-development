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

/** Line and block comments out; strings and code stay. */
function stripComments(source: string): string {
  return source
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
