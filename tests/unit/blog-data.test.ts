import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { posts } from '../../src/lib/blog/blog';

// THE BLOG'S SHIPPED POSTS — what src/content/blog/posts.json must hold beyond
// the shape lib/blog's `parsePosts` already refuses at build time. These are
// the rules a card needs to look like a card (CLAUDE.md §15.39, 2026-10-11):
//   · every picture exists under public/ and is wide enough for the widest
//     thumbnail a screen asks for (about 530 CSS px at a 2560 window — twice
//     that on a dense screen is asked of the optimizer's largest variant);
//   · the owner's D-DASH wording rule on every word (no spaced dash, no em or
//     en dash inside a sentence — tests/unit/hero-slides-data.test.ts's DASH);
//   · no title word longer than the heading's narrowest line can hold:
//     sections/PostCard's title wears ui/Heading's `band` step, 30px on a card
//     under 28rem, and the narrowest card (a 320 phone: 320 − 2 × 16 gutter −
//     2 × 25 of card) leaves 238px — about 16 characters of Source Serif 4 at
//     30px, the same ceiling lib/team keeps for a doctor's name at `hero`;
//   · the tags are the reference's short lower-case labels and fit one pill
//     (ui/PillButton never wraps: 18 characters at its 18px label, plus its
//     2 × 20px of padding, stay inside that 238px line);
//   · a summary stays a summary — the reference's longest is about 260
//     characters, and a card is not the article;
//   · no two posts share a title.
// The CMSR scan (tests/unit/cmsr-scan.test.ts) reads every title, summary and
// tag of the same list.

const PUBLIC = fileURLToPath(new URL('../../public', import.meta.url));

/** D-DASH: a spaced dash of any kind, or an em/en dash anywhere, inside a sentence. */
const DASH = /\s[—–-]\s|[—–]/;

const TITLE_WORD_CEILING = 16;
const TAG_CEILING = 18;
const SUMMARY_CEILING = 320;
const MIN_PICTURE_WIDTH = 1080;

describe('the blog posts — what a card needs (src/content/blog/posts.json)', () => {
  it('ships posts', () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  it.each(posts.map((post) => [post.slug, post] as const))(
    '%s: its picture exists and is wide enough',
    async (_slug, post) => {
      const file = `${PUBLIC}${post.image.src}`;
      expect(existsSync(file), file).toBe(true);
      const { width } = await sharp(file).metadata();
      expect(width, file).toBeGreaterThanOrEqual(MIN_PICTURE_WIDTH);
    },
  );

  it.each(posts.map((post) => [post.slug, post] as const))(
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

  it.each(posts.map((post) => [post.slug, post] as const))(
    '%s: fits a phone — title words, tags, summary',
    (_slug, post) => {
      for (const word of post.title.split(/\s+/)) {
        expect(word.length, `„${word}" in „${post.title}"`).toBeLessThanOrEqual(
          TITLE_WORD_CEILING,
        );
      }
      for (const tag of post.tags) {
        expect(tag, 'tags are lower-case, like the reference').toBe(
          tag.toLocaleLowerCase('ro'),
        );
        expect(tag.length, tag).toBeLessThanOrEqual(TAG_CEILING);
      }
      expect(post.summary.length).toBeLessThanOrEqual(SUMMARY_CEILING);
    },
  );

  it('gives every post its own title', () => {
    const titles = posts.map((post) => post.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('the D-DASH scan has teeth', () => {
    for (const bad of ['Un titlu - o idee', 'Un titlu — o idee', 'Un–titlu']) {
      expect(DASH.test(bad), bad).toBe(true);
    }
    for (const good of [
      'Prim-plan cu instrumente',
      's-o schimbi',
      'să-și albească',
    ]) {
      expect(DASH.test(good), good).toBe(false);
    }
  });
});
