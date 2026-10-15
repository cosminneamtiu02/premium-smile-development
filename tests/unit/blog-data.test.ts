import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { locales, type Locale } from '../../src/i18n/locales';
import { posts, postsIn } from '../../src/lib/blog/blog';
import { doctors } from '../../src/lib/team/team';

// THE BLOG'S SHIPPED POSTS — what src/content/blog/posts.json must hold beyond
// the shape lib/blog's `parsePosts` already refuses at build time (a missing
// language, a fourth tag, a stray space …). These are the rules a card needs
// to look like a card (CLAUDE.md §15.39, 2026-10-11), read in EVERY language
// since round 3 (2026-10-14), when the posts gained their English, German,
// French and Italian words:
//   · every picture exists under public/ and is wide enough for the largest
//     file a phone asks of it — THE PICTURE FLOOR, derived below from
//     sections/PostCard's own `sizes` (its PICTURE_SIZES, read out of its
//     source): under a 46.25rem window every card is told `90vw`, which on
//     the widest phone held upright — 440 CSS px at 3×, an iPhone Pro Max
//     (§15.35) — asks for 1188 device pixels, and the browser fetches the
//     optimizer's next width, 1200 (next.config's `deviceSizes`, read too).
//     The optimizer copies a picture for every width past its own and never
//     enlarges it, so a narrower picture would hand every large phone a
//     softer file. A 2× window just under 46.25rem asks for 1332 — the 1920
//     file, which a 1200px picture serves at 1200: a tenth soft there,
//     accepted (the tier-3 review, 2026-10-14). The clinic's own photographs
//     are 1920 wide;
//   · the owner's D-DASH wording rule on every word (no spaced dash, no em or
//     en dash inside a sentence — tests/unit/hero-slides-data.test.ts's DASH);
//   · every post is signed by one of the clinic's doctors: its `author` is a
//     doctor's name exactly as lib/team spells it in Romanian, so renaming a
//     doctor there fails here until the posts follow;
//   · a post describes its picture in every language or in none — an empty
//     alt is a decorative picture (lib/blog's PLACEHOLDERS), and one language
//     cannot be the only one to hear about it;
//   · the tags are short labels in each language's own case: German starts
//     each with a capital, as German writes its nouns („Mundhygiene"); the
//     four others are lower case, the reference's look. They float over the
//     card's picture and scale with the card, down to a 12px label at their
//     floor (sections/PostCard's THE CHIPS FOLLOW THEIR CARD), and a chip
//     never wraps, so a tag must fit the narrowest picture's line on that
//     floor, 250px: 18 characters of real words do, with room — the German
//     compound „Wurzelbehandlungen", capitalised, is a 157.7px chip and the
//     Romanian „stomatologie copii" 138.9 (PostCard's THE CEILING); the cap of
//     three a post is `parsePosts`' own (lib/blog's MAX_TAGS);
//   · a summary stays a summary — the reference's longest is about 260
//     characters, and a card is not the article;
//   · no two posts share a title in one language;
//   · and two rules ACROSS the languages, so a translation cannot drift from
//     the Romanian it was made from: every language lists a post's categories
//     as the Romanian does, as many and in the same order, each Romanian
//     category worded ONE way on every card of a language (and no two of them
//     the same way) — so a German reader never meets „Mundhygiene" on one card
//     and „Hygiene" on the next; and no title or summary is another
//     language's, which is what an untranslated copy-paste looks like.
// A TITLE'S WORDS are held where they can be MEASURED, never here: a character
// count cannot bound a width — „Wurzelbehandlung", 16 characters, sets 250.5px
// at the card title's 30px, while the 15-character „Zahnaufhellung:" the blog
// ships sets 217.1 (the tier-3 review, 2026-10-14) — so
// src/components/sections/PostCard/PostCard.titles.test.tsx sets every title
// of every language in the real face on the narrowest title line a card
// draws, 222px, and refuses a word wider than it.
// The CMSR scan (tests/unit/cmsr-scan.test.ts) reads every title, summary,
// tag and non-empty alt of the same list, in all five languages.

const PUBLIC = fileURLToPath(new URL('../../public', import.meta.url));

/** A file of the repository, as text. */
const sourceOf = (path: string): string =>
  readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

/** D-DASH: a spaced dash of any kind, or an em/en dash anywhere, inside a sentence. */
const DASH = /\s[—–-]\s|[—–]/;

const TAG_CEILING = 18;
const SUMMARY_CEILING = 320;

/** sections/PostCard's PICTURE_SIZES, read out of its source — KEEP-IN-SYNC:
 *  the floor below follows the card's own `sizes`. */
function pictureSizes(): string {
  const match = /\bconst PICTURE_SIZES =\s*'([^']*)'/.exec(
    sourceOf('src/components/sections/PostCard/PostCard.tsx'),
  );
  if (!match?.[1]) {
    throw new Error('PostCard.tsx: no `PICTURE_SIZES` constant — it moved.');
  }
  return match[1];
}

/** The share of the window every phone is told: the list's LAST entry, the
 *  one with no media condition (a bare `90vw`). */
function phoneShare(sizes: string): number {
  const match = /,\s*(\d+(?:\.\d+)?)vw$/.exec(sizes);
  if (!match?.[1]) {
    throw new Error(`PICTURE_SIZES ends on no bare vw share: ${sizes}`);
  }
  return Number(match[1]) / 100;
}

/** The widths the optimizer writes for a full-width picture — next.config's
 *  `deviceSizes`, read out of its source. */
function deviceSizes(): number[] {
  const match = /\bdeviceSizes:\s*\[([^\]]*)\]/.exec(
    sourceOf('next.config.ts'),
  );
  if (!match?.[1]) {
    throw new Error('next.config.ts: no `deviceSizes` — it moved.');
  }
  return match[1].split(',').map((size) => Number(size.trim()));
}

/** The widest phone held upright and its density: an iPhone Pro Max, 440 CSS
 *  px at 3× (§15.35's phone gutter names it the largest). */
const WIDEST_PHONE = { width: 440, density: 3 } as const;

/** THE PICTURE FLOOR (the header): the optimizer's file the widest phone
 *  fetches for the share it is told. */
function pictureFloor(): number {
  const asked =
    phoneShare(pictureSizes()) * WIDEST_PHONE.width * WIDEST_PHONE.density;
  const file = deviceSizes()
    .toSorted((a, b) => a - b)
    .find((size) => size >= asked);
  if (file === undefined) {
    throw new Error(`no optimizer width reaches ${asked}`);
  }
  return file;
}

const PICTURE_FLOOR = pictureFloor();

/** A tag in its language's case (the header): German starts it with a
 *  capital letter, as German writes its nouns; the four others write it
 *  lower case. */
function inItsCase(locale: Locale, tag: string): boolean {
  if (locale !== 'de') return tag === tag.toLocaleLowerCase(locale);
  const first = tag.charAt(0);
  return first !== first.toLocaleLowerCase('de');
}

/** The clinic's doctors, each by the name lib/team gives them in Romanian. */
const DOCTOR_NAMES: ReadonlySet<string> = new Set(
  doctors.map((doctor) => doctor.words.ro.name),
);

describe('the blog posts — what a card needs (src/content/blog/posts.json)', () => {
  it('ships posts', () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  it('derives its picture floor from the card’s own `sizes` — 90vw on a 440 CSS px phone at 3×, the optimizer’s 1200 file', () => {
    expect(phoneShare(pictureSizes())).toBe(0.9);
    expect(PICTURE_FLOOR).toBe(1200);
  });

  it.each(posts.map((post) => [post.slug, post] as const))(
    '%s: its picture exists and is wide enough',
    async (_slug, post) => {
      const file = `${PUBLIC}${post.image.src}`;
      expect(existsSync(file), file).toBe(true);
      const { width } = await sharp(file).metadata();
      expect(width, file).toBeGreaterThanOrEqual(PICTURE_FLOOR);
    },
  );

  it.each(posts.map((post) => [post.slug, post] as const))(
    '%s: is signed by one of the clinic’s doctors, as lib/team spells the name',
    (_slug, post) => {
      expect(
        DOCTOR_NAMES.has(post.author),
        `„${post.author}" is no doctor of lib/team`,
      ).toBe(true);
    },
  );

  it.each(posts.map((post) => [post.slug, post] as const))(
    '%s: describes its picture in every language or in none',
    (_slug, post) => {
      const described = locales.filter(
        (locale) => post.words[locale].alt !== '',
      );
      expect(
        [0, locales.length],
        `described in ${described.join(', ')} alone`,
      ).toContain(described.length);
    },
  );

  describe.each(locales)('in %s', (locale) => {
    const list = postsIn(locale);

    it.each(list.map((post) => [post.slug, post] as const))(
      '%s: keeps every dash out of its words (D-DASH)',
      (_slug, post) => {
        for (const words of [
          post.title,
          post.summary,
          post.image.alt,
          post.author,
          ...post.tags,
        ]) {
          expect(DASH.test(words), words).toBe(false);
        }
      },
    );

    it.each(list.map((post) => [post.slug, post] as const))(
      '%s: keeps its tags and its summary short — each tag in its language’s case',
      (_slug, post) => {
        for (const tag of post.tags) {
          expect(
            inItsCase(locale, tag),
            `„${tag}" — ${locale === 'de' ? 'a German tag starts with a capital' : 'lower case, like the reference'}`,
          ).toBe(true);
          expect(tag.length, tag).toBeLessThanOrEqual(TAG_CEILING);
        }
        expect(post.summary.length).toBeLessThanOrEqual(SUMMARY_CEILING);
      },
    );

    it('gives every post its own title', () => {
      const titles = list.map((post) => post.title);
      expect(new Set(titles).size).toBe(titles.length);
    });
  });

  it('lists each post’s categories in every language as the Romanian does — as many, and each category worded one way on every card', () => {
    for (const locale of locales) {
      /** Each Romanian category → its wording in `locale`, and back. */
      const wordingOf = new Map<string, string>();
      const categoryOf = new Map<string, string>();
      for (const post of posts) {
        const romanian = post.words.ro.tags;
        const here = post.words[locale].tags;
        expect(here, `${post.slug}: the tags in ${locale}`).toHaveLength(
          romanian.length,
        );
        romanian.forEach((category, index) => {
          const wording = here[index] ?? '';
          expect(
            wordingOf.get(category) ?? wording,
            `„${category}" in ${locale} (${post.slug})`,
          ).toBe(wording);
          expect(
            categoryOf.get(wording) ?? category,
            `${locale} „${wording}" (${post.slug})`,
          ).toBe(category);
          wordingOf.set(category, wording);
          categoryOf.set(wording, category);
        });
      }
    }
  });

  it('gives every language its own words — no title or summary is another language’s', () => {
    for (const post of posts) {
      for (const field of ['title', 'summary'] as const) {
        const texts = locales.map((locale) => post.words[locale][field]);
        expect(new Set(texts).size, `${post.slug}: ${field}`).toBe(
          texts.length,
        );
      }
    }
  });

  it('the D-DASH scan has teeth', () => {
    for (const bad of ['Un titlu - o idee', 'Un titlu — o idee', 'Un–titlu']) {
      expect(DASH.test(bad), bad).toBe(true);
    }
    for (const good of [
      'Prim-plan cu instrumente',
      's-o schimbi',
      'să-și albească',
      'the six-monthly check-up',
      'le week-end',
    ]) {
      expect(DASH.test(good), good).toBe(false);
    }
  });

  it('the case rule has teeth — a German tag starts with a capital, every other is lower case', () => {
    for (const [locale, tag] of [
      ['de', 'Mundhygiene'],
      ['de', 'Ästhetik'],
      ['ro', 'igienă'],
      ['fr', 'hygiène'],
    ] as const) {
      expect(inItsCase(locale, tag), `${locale} „${tag}"`).toBe(true);
    }
    for (const [locale, tag] of [
      ['de', 'mundhygiene'],
      ['de', 'ästhetik'],
      ['ro', 'Igienă'],
      ['en', 'Hygiene'],
    ] as const) {
      expect(inItsCase(locale, tag), `${locale} „${tag}"`).toBe(false);
    }
  });

  it('the signature rule has teeth — a name lib/team does not spell is refused', () => {
    expect(DOCTOR_NAMES.size, 'one name a doctor').toBe(doctors.length);
    const [first] = doctors;
    if (!first) throw new Error('lib/team ships no doctor');
    const name = first.words.ro.name;
    expect(DOCTOR_NAMES.has(name), name).toBe(true);
    // The French honorific lib/team writes („Dr", no point) is not the
    // Romanian one: a post copied from a French page would sign with it.
    const slip = name.replace(/^Dr\. /, 'Dr ');
    expect(slip, 'the slip differs from the name').not.toBe(name);
    expect(DOCTOR_NAMES.has(slip), slip).toBe(false);
  });
});
