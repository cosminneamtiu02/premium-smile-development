import { describe, expect, it } from 'vitest';
import { localeHref } from '@/i18n/href';
import { locales } from '@/i18n/locales';
import { blogPagePath, pageCount, posts, postsOnPage } from '@/lib/blog/blog';
import {
  blogWordsFrom,
  populateBlogPage,
  type BlogPageWords,
  type BlogTranslate,
} from './populate';

// app/[locale]/blog/populate.ts — a list page in EVERY language (CLAUDE.md
// §15.39 round 3, 2026-10-14). The Pages/Blog twin's plays pin Romanian and
// German in the browser; this walks all five languages and every page: each
// post in the page's own language (read off the entry's words here, never
// through the populator's own path), the page's words passed through
// untouched, and the pager's links under the page's own prefix. The class of
// bug it exists for is a language pinned somewhere on the way — a German page
// whose next link points to /ro/blog/page/2/, which the link crawl would pass,
// because that page exists too. The last block holds `blogWordsFrom`, the one
// mapping of keys to words: at run time on a translator that records what it
// is asked, at compile time through `BlogTranslate`'s per-key signatures
// (its `@ts-expect-error` lines are checked by tsc, which reads this file).

/** Words that say which language they were made for — a page passes them on untouched. */
const wordsFor = (locale: string): BlogPageWords => ({
  title: `title:${locale}`,
  lead: `lead:${locale}`,
  tags: `tags:${locale}`,
  readMore: `more:${locale}`,
  readingTime: (minutes) => `${minutes} min:${locale}`,
  pagination: {
    label: `label:${locale}`,
    previous: `previous:${locale}`,
    next: `next:${locale}`,
    status: (page, total) => `${page}/${total}:${locale}`,
  },
});

describe('populateBlogPage — a list page in every language', () => {
  it.each(locales)(
    '%s: every page shows its posts in that language, and its pager stays under that language’s prefix',
    (locale) => {
      const total = pageCount();
      for (let page = 1; page <= total; page += 1) {
        const props = populateBlogPage(locale, page, wordsFor(locale));
        const entries = postsOnPage(page, posts);

        expect(props.posts).toEqual(
          entries.map((entry) => ({
            slug: entry.slug,
            title: entry.words[locale].title,
            summary: entry.words[locale].summary,
            author: entry.author,
            readingTime: `${entry.readingMinutes} min:${locale}`,
            image: { src: entry.image.src, alt: entry.words[locale].alt },
            tags: entry.words[locale].tags,
          })),
        );
        expect([
          props.title,
          props.lead,
          props.tagsLabel,
          props.readMore,
        ]).toEqual([
          `title:${locale}`,
          `lead:${locale}`,
          `tags:${locale}`,
          `more:${locale}`,
        ]);
        expect(props.pagination).toEqual({
          label: `label:${locale}`,
          status: `${page}/${total}:${locale}`,
          current: page,
          total,
          previousLabel: `previous:${locale}`,
          nextLabel: `next:${locale}`,
          ...(page > 1
            ? { previousHref: localeHref(locale, blogPagePath(page - 1)) }
            : {}),
          ...(page < total
            ? { nextHref: localeHref(locale, blogPagePath(page + 1)) }
            : {}),
        });
      }
    },
  );

  it('draws no link on a one-page blog — page 1 of 1, in any language', () => {
    for (const locale of locales) {
      const { pagination } = populateBlogPage(
        locale,
        1,
        wordsFor(locale),
        posts.slice(0, 1),
      );
      expect(pagination.total).toBe(1);
      expect(pagination).not.toHaveProperty('previousHref');
      expect(pagination).not.toHaveProperty('nextHref');
    }
  });

  it('refuses a page the list does not have', () => {
    expect(() =>
      populateBlogPage('it', pageCount() + 1, wordsFor('it')),
    ).toThrow(RangeError);
  });
});

describe('blogWordsFrom — every key with its own values (G2 typescript, 2026-10-14)', () => {
  it('reads each plain word under its own key with no values, and hands the two counted words their own numbers', () => {
    const calls: [key: string, values: unknown][] = [];
    const t: BlogTranslate = (key: string, values?: unknown) => {
      calls.push([key, values]);
      return `«${key}»`;
    };
    const words = blogWordsFrom(t);
    expect([
      words.title,
      words.lead,
      words.tags,
      words.readMore,
      words.pagination.label,
      words.pagination.previous,
      words.pagination.next,
    ]).toEqual([
      '«hero.title»',
      '«hero.lead»',
      '«tags»',
      '«card.readMore»',
      '«pagination.label»',
      '«pagination.previous»',
      '«pagination.next»',
    ]);
    expect(words.readingTime(5)).toBe('«card.readingTime»');
    expect(words.pagination.status(2, 3)).toBe('«pagination.status»');
    expect(calls).toEqual([
      ['hero.title', undefined],
      ['hero.lead', undefined],
      ['tags', undefined],
      ['card.readMore', undefined],
      ['pagination.label', undefined],
      ['pagination.previous', undefined],
      ['pagination.next', undefined],
      ['card.readingTime', { minutes: 5 }],
      ['pagination.status', { page: 2, total: 3 }],
    ]);
  });

  it('refuses a key paired with another key’s values, or without the values it needs — at compile time (tsc reads this file)', () => {
    const t: BlogTranslate = () => '';
    // @ts-expect-error — the reading time needs its minutes
    t('card.readingTime');
    // @ts-expect-error — the counter's numbers are not the reading time's
    t('card.readingTime', { page: 1, total: 2 });
    // @ts-expect-error — the reading time's minutes are not the counter's
    t('pagination.status', { minutes: 5 });
    // @ts-expect-error — a plain word takes no values
    t('hero.title', { minutes: 5 });
    // @ts-expect-error — a key no list page reads (a typo)
    t('card.readMor');
    // …and each key with its own values compiles.
    expect([
      t('hero.title'),
      t('card.readingTime', { minutes: 5 }),
      t('pagination.status', { page: 1, total: 2 }),
    ]).toEqual(['', '', '']);
  });
});
