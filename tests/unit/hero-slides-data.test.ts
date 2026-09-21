import { existsSync } from 'node:fs';
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
// languages and four words each; only a test can see that one of them is an
// empty string, that two rows share an id, or that a picture path points at
// nothing on disk — the last one is the check that matters most, because the
// export optimizer would ship a broken LCP picture without a word.
//
// In the node `unit` project rather than beside the module: pure data, no
// DOM, and the existence check reads the file system.

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CURRENCY = /\b(?:RON|lei|EUR)\b|€/iu;
const PUBLIC_DIR = fileURLToPath(new URL('../../public/', import.meta.url));

const WORD_KEYS = ['alt', 'title'] as const;

describe('lib/hero-slides — the data list', () => {
  it('has the old site’s three slides, in its order (calm → team → result)', () => {
    // The ring's order is designed here, and the first row is the LCP slide.
    expect(heroSlides.map((slide) => slide.id)).toEqual([
      'calm',
      'team',
      'result',
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

  it('points every picture at a file that exists under public/ (§11)', () => {
    for (const slide of heroSlides) {
      expect(slide.picture.src.startsWith('/images/')).toBe(true);
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

  it('types the picture path through lib/image-path, the promoted spelling', () => {
    expectTypeOf<HeroSlideEntry['picture']['src']>().toEqualTypeOf<ImagePath>();
    expectTypeOf<HeroSlideEntry['words']>().toEqualTypeOf<
      Readonly<Record<Locale, HeroSlideWords>>
    >();
  });
});
