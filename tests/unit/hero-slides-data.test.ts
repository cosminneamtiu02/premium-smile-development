import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  heroSlides,
  type HeroSlideEntry,
  type HeroSlideWords,
} from '../../src/lib/hero-slides/hero-slides';
import type { ImagePath } from '../../src/lib/image-path/image-path';
import { locales, type Locale } from '../../src/i18n/locales';

// lib/hero-slides INTEGRITY — the checks the compiler cannot make (the
// prices-data / reviews-data precedents). `tsc` proves every row HAS five
// languages and two words each; only a test can see that one of them is an
// empty string, that two rows share an id, or that a picture path points at
// nothing on disk — the last one is the check that matters most, because the
// export optimizer would ship a broken LCP picture without a word.
//
// SINCE THE CLINIC'S OWN PHOTOGRAPHS (2026-10-01, the hero-photos lane) it
// also holds what a LAYOUT and a PIPELINE need from this data, which no
// component can check about words and files it has not been given yet:
//   · the pictures live in public/images/hero/ — the convention the module's
//     header promised to enforce "the day a non-demo path appears";
//   · a source is at least as wide as the optimizer's largest variant (a
//     narrower one ships an upscaled LCP picture, and nothing warns) and
//     landscape (the band covers a screen, and a portrait would crop to a
//     strip of it on a laptop);
//   · a slogan's longest unbreakable word fits the 320px column at ui/
//     Heading's `hero` step — lib/team's own arithmetic for a name on that
//     step (tests/unit/team-data.test.ts, NAME_CEILING);
//   · the owner's two wording rules on every word: D-DASH (no dash inside a
//     sentence — the team data test's regex, its second copy) and, for CMSR,
//     tests/unit/cmsr-scan.test.ts walks these rows through its own patterns;
//   · an alt that never repeats its slogan (a screen reader would hear the
//     words twice — the slogan is display text on a <p> of its own).
//
// In the node `unit` project rather than beside the module: pure data, no
// DOM, and the existence check reads the file system.

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CURRENCY = /\b(?:RON|lei|EUR)\b|€/iu;
const PUBLIC_DIR = fileURLToPath(new URL('../../public/', import.meta.url));
/** The clinic's own pictures, by convention (the module's header). */
const HERO_FOLDER = '/images/hero/';
/**
 * next.config's largest `deviceSizes` entry: the widest variant
 * next-image-export-optimizer generates, and the widest picture the band's
 * `sizes="100vw"` srcset can ever hand a browser. A source narrower than
 * this is served upscaled from its own width on every screen wider than it.
 */
const LARGEST_DEVICE_SIZE = 1920;
/**
 * ~16 characters of a 32px serif fill a 256px column — the `hero` step's
 * floor at 320 (lib/team's NAME_CEILING, the same step, the same column).
 * A slogan word longer than this cannot wrap and would push the stage
 * sideways or hyphenate mid-word at the largest size on the site.
 */
const SLOGAN_CEILING = 16;
/** D-DASH: a spaced dash of any kind, or an em/en dash anywhere, inside a sentence. */
const DASH = /\s[—–-]\s|[—–]/;

const WORD_KEYS = ['alt', 'title'] as const;

/**
 * The pixel size a JPEG declares in its OWN header — the first SOFn marker's
 * height then width (16-bit each) — with no image library in the loop, so the
 * unit project stays pure Node. The team data test carries the same reader
 * (PNG too); this is its second copy, filed with the §15.19 round-3
 * helper-promotion census.
 */
function readJpegSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  if (bytes.readUInt16BE(0) !== 0xffd8) throw new Error(`${path}: not a JPEG`);
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      throw new Error(`${path}: not a JPEG marker at byte ${offset}`);
    }
    const marker = bytes[offset + 1];
    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isSof) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  throw new Error(`${path}: no SOF marker`);
}

describe('lib/hero-slides — the data list', () => {
  it('has the clinic’s three photographs, in the owner’s order (lobby → treatment-room → instruments)', () => {
    // The ring's order is designed here, and the first row is the LCP slide:
    // the lobby, the first thing a visitor sees on the site as at the door.
    expect(heroSlides.map((slide) => slide.id)).toEqual([
      'lobby',
      'treatment-room',
      'instruments',
    ]);
  });

  it('gives every row a unique kebab-case id — the React key and the tab id stem', () => {
    const ids = heroSlides.map((slide) => slide.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(KEBAB_CASE);
  });

  it.each(locales)(
    'carries non-empty, trimmed words in every field for "%s"',
    (locale: Locale) => {
      for (const slide of heroSlides) {
        const words = slide.words[locale];
        for (const key of WORD_KEYS) {
          const value = words[key];
          expect(value, `${slide.id}.${locale}.${key}`).not.toBe('');
          expect(value, `${slide.id}.${locale}.${key}`).toBe(value?.trim());
        }
        // No forced line breaks: the old site's `\n` slogan is gone on
        // purpose — the column decides where a slogan wraps.
        expect(words.title).not.toMatch(/\n/);
      }
    },
  );

  it('keeps a price out of every word — prices belong to lib/prices', () => {
    for (const slide of heroSlides) {
      for (const locale of locales) {
        for (const key of WORD_KEYS) {
          expect(slide.words[locale][key] ?? '').not.toMatch(CURRENCY);
        }
      }
    }
  });

  it('points every picture at a file under public/images/hero/ that exists (§11, the module’s convention)', () => {
    for (const slide of heroSlides) {
      expect(slide.picture.src.startsWith(HERO_FOLDER), slide.picture.src).toBe(
        true,
      );
      expect(
        existsSync(PUBLIC_DIR + slide.picture.src.slice(1)),
        slide.picture.src,
      ).toBe(true);
    }
  });

  it('uses no two pictures twice — a crossfade between identical frames is invisible', () => {
    const paths = heroSlides.map((slide) => slide.picture.src);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('ships every picture at least as wide as the optimizer’s largest variant, and landscape', () => {
    for (const slide of heroSlides) {
      const { width, height } = readJpegSize(
        PUBLIC_DIR + slide.picture.src.slice(1),
      );
      expect(width, `${slide.picture.src}: width`).toBeGreaterThanOrEqual(
        LARGEST_DEVICE_SIZE,
      );
      expect(width, `${slide.picture.src}: landscape`).toBeGreaterThan(height);
    }
  });

  it.each(locales)(
    'keeps every slogan word under the 320px ceiling for "%s"',
    (locale: Locale) => {
      for (const slide of heroSlides) {
        for (const word of slide.words[locale].title.split(/\s+/)) {
          expect(
            word.length,
            `${slide.id}.${locale}.title: „${word}"`,
          ).toBeLessThanOrEqual(SLOGAN_CEILING);
        }
      }
    },
  );

  it.each(locales)(
    'keeps every dash out of every %s sentence (D-DASH, the owner’s wording rule)',
    (locale: Locale) => {
      for (const slide of heroSlides) {
        for (const key of WORD_KEYS) {
          const value = slide.words[locale][key];
          expect(value, `${slide.id}.${locale}.${key}`).not.toMatch(DASH);
        }
      }
    },
  );

  it('the D-DASH scan has teeth', () => {
    expect('Prim-plan, rendez-vous').not.toMatch(DASH);
    expect('o pauză - apoi').toMatch(DASH);
    expect('o pauză — apoi').toMatch(DASH);
  });

  it.each(locales)(
    'describes the picture in the alt and never repeats the slogan there, for "%s"',
    (locale: Locale) => {
      for (const slide of heroSlides) {
        const { alt, title } = slide.words[locale];
        expect(alt.toLowerCase(), `${slide.id}.${locale}`).not.toBe(
          title.toLowerCase(),
        );
      }
    },
  );

  it('types the picture path through lib/image-path, the promoted spelling', () => {
    expectTypeOf<HeroSlideEntry['picture']['src']>().toEqualTypeOf<ImagePath>();
    expectTypeOf<HeroSlideEntry['words']>().toEqualTypeOf<
      Readonly<Record<Locale, HeroSlideWords>>
    >();
  });
});
