import { describe, expect, it } from 'vitest';
import { PRIMARY_ROUTES } from '../routes/routes';
import {
  BLOG_LOCALE,
  POSTS_PER_PAGE,
  blogPagePath,
  newestFirst,
  numberedPages,
  pageCount,
  parsePageParam,
  parsePosts,
  posts,
  postsOnPage,
  type BlogPost,
} from './blog';

// lib/blog — the reader of src/content/blog/posts.json and the arithmetic that
// cuts the list into pages. The header of blog.ts argues every rule pinned here.

/** A valid raw post; each test breaks exactly one thing in a copy of it. */
function rawPost(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    slug: 'exemplu-de-articol',
    title: 'Un titlu',
    summary: 'Un rezumat scurt.',
    date: '2026-01-15',
    author: 'Dr. Exemplu',
    image: { src: '/images/hero/lobby.jpg', alt: 'O fotografie' },
    tags: ['igienă'],
    ...overrides,
  };
}

function post(slug: string, date: string): BlogPost {
  return parsePosts([rawPost({ slug, date })])[0]!;
}

describe('parsePosts — the build-time check of the JSON', () => {
  it('returns a valid post with every field', () => {
    expect(parsePosts([rawPost()])).toEqual([
      {
        slug: 'exemplu-de-articol',
        title: 'Un titlu',
        summary: 'Un rezumat scurt.',
        date: '2026-01-15',
        author: 'Dr. Exemplu',
        image: { src: '/images/hero/lobby.jpg', alt: 'O fotografie' },
        tags: ['igienă'],
      },
    ]);
  });

  it('accepts an empty alt (a decorative picture) and no tags', () => {
    const [only] = parsePosts([
      rawPost({ image: { src: '/images/hero/lobby.jpg', alt: '' }, tags: [] }),
    ]);
    expect(only?.image.alt).toBe('');
    expect(only?.tags).toEqual([]);
  });

  it('refuses a file that is not an array, and an entry that is not an object', () => {
    expect(() => parsePosts({ posts: [] })).toThrow(/expected an array/);
    expect(() => parsePosts(['text'])).toThrow(/post 1: expected an object/);
  });

  it.each([
    [
      'an unknown key (a typo)',
      rawPost({ sumary: 'x' }),
      /unknown key\(s\) sumary/,
    ],
    [
      'a missing key',
      (() => {
        const p = rawPost();
        delete p.author;
        return p;
      })(),
      /missing key\(s\) author/,
    ],
    ['an upper-case slug', rawPost({ slug: 'Exemplu' }), /"slug" must be/],
    [
      'a slug with a double dash',
      rawPost({ slug: 'un--slug' }),
      /"slug" must be/,
    ],
    ['a slug with a space', rawPost({ slug: 'un slug' }), /"slug" must be/],
    ['the reserved slug "page"', rawPost({ slug: 'page' }), /reserved/],
    ['an empty title', rawPost({ title: '' }), /"title"/],
    [
      'a summary with a stray space',
      rawPost({ summary: 'Text ' }),
      /"summary"/,
    ],
    ['an author that is not text', rawPost({ author: 7 }), /"author"/],
    ['a day that does not exist', rawPost({ date: '2026-02-30' }), /"date"/],
    ['a day without its zeros', rawPost({ date: '2026-2-3' }), /"date"/],
    ['a day written first', rawPost({ date: '15-01-2026' }), /"date"/],
    [
      'an image that is a string',
      rawPost({ image: '/images/x.jpg' }),
      /"image" must be an object/,
    ],
    [
      'an image with an extra key',
      rawPost({ image: { src: '/images/x.jpg', alt: '', width: 3 } }),
      /"image": unknown key/,
    ],
    [
      'a picture outside /images/',
      rawPost({ image: { src: '/photos/x.jpg', alt: '' } }),
      /"image.src"/,
    ],
    [
      'an alt with a stray space',
      rawPost({ image: { src: '/images/x.jpg', alt: ' a' } }),
      /"image.alt"/,
    ],
    [
      'tags that are not a list',
      rawPost({ tags: 'igienă' }),
      /"tags" must be an array/,
    ],
    ['an empty tag', rawPost({ tags: [''] }), /every tag/],
    [
      'a tag listed twice',
      rawPost({ tags: ['igienă', 'igienă'] }),
      /listed twice/,
    ],
  ])('refuses %s', (_case, entry, message) => {
    expect(() => parsePosts([entry])).toThrow(message);
  });

  it('refuses a slug used twice, naming the later post', () => {
    expect(() =>
      parsePosts([rawPost(), rawPost({ date: '2026-02-01' })]),
    ).toThrow(
      /post 2 \(„exemplu-de-articol"\): "slug" exemplu-de-articol is used by an earlier post/,
    );
  });

  it('names the post by its number and slug in every message', () => {
    expect(() =>
      parsePosts([rawPost(), rawPost({ slug: 'al-doilea', title: '' })]),
    ).toThrow(/posts\.json, post 2 \(„al-doilea"\): "title"/);
  });

  it('names the slug even when the post fails on its keys — the typo case', () => {
    expect(() => parsePosts([rawPost({ sumary: 'x' })])).toThrow(
      /post 1 \(„exemplu-de-articol"\): unknown key\(s\) sumary/,
    );
  });
});

describe('newestFirst — the order the pages show', () => {
  it('puts the newest day first and orders a shared day by slug', () => {
    const sorted = newestFirst([
      post('b-mijloc', '2026-05-01'),
      post('vechi', '2025-12-31'),
      post('a-mijloc', '2026-05-01'),
      post('nou', '2026-09-01'),
    ]);
    expect(sorted.map((p) => p.slug)).toEqual([
      'nou',
      'a-mijloc',
      'b-mijloc',
      'vechi',
    ]);
  });

  it('leaves the list it was given untouched', () => {
    const list = [post('vechi', '2025-01-01'), post('nou', '2026-01-01')];
    newestFirst(list);
    expect(list.map((p) => p.slug)).toEqual(['vechi', 'nou']);
  });
});

describe('the pages — counting, cutting and spelling them', () => {
  it('counts pages of five, and never fewer than one', () => {
    expect(POSTS_PER_PAGE).toBe(5);
    expect([0, 1, 5, 6, 10, 11, 12].map((n) => pageCount(n))).toEqual([
      1, 1, 1, 2, 2, 3, 3,
    ]);
    expect(() => pageCount(-1)).toThrow(RangeError);
    expect(() => pageCount(2.5)).toThrow(RangeError);
    expect(() => pageCount(10, 0)).toThrow(RangeError);
  });

  it('cuts the list into its pages and refuses a page it does not have', () => {
    const list = Array.from({ length: 12 }, (_, i) =>
      post(
        `articol-${String(i).padStart(2, '0')}`,
        `2026-01-${String(i + 1).padStart(2, '0')}`,
      ),
    );
    expect(postsOnPage(1, list).map((p) => p.slug)).toEqual(
      list.slice(0, 5).map((p) => p.slug),
    );
    expect(postsOnPage(3, list)).toHaveLength(2);
    for (const page of [0, 4, 1.5, Number.NaN]) {
      expect(() => postsOnPage(page, list)).toThrow(RangeError);
    }
    expect(postsOnPage(1, [])).toEqual([]);
  });

  it('generates pages 2 to the last — or page 1 again when there is only one page (never an empty list)', () => {
    expect(numberedPages(12)).toEqual([2, 3]);
    expect(numberedPages(6)).toEqual([2]);
    expect(numberedPages(5)).toEqual([1]);
    expect(numberedPages(0)).toEqual([1]);
  });

  it('spells page 1 as /blog and page n as /blog/page/n', () => {
    expect(blogPagePath(1)).toBe('/blog');
    expect(blogPagePath(2)).toBe('/blog/page/2');
    expect(blogPagePath(12)).toBe('/blog/page/12');
    for (const page of [0, -1, 1.5]) {
      expect(() => blogPagePath(page)).toThrow(RangeError);
    }
  });

  it('reads the route segment back as a number, and only a canonical one', () => {
    expect(parsePageParam('2')).toBe(2);
    expect(parsePageParam('1')).toBe(1);
    expect(parsePageParam('10')).toBe(10);
    for (const value of ['', '0', '02', '2.0', ' 2', 'x', '-2']) {
      expect(() => parsePageParam(value), value).toThrow(RangeError);
    }
  });
});

describe('the shipped list', () => {
  it('parses, has posts, and is ordered newest first', () => {
    expect(posts.length).toBeGreaterThan(0);
    expect(newestFirst(posts)).toEqual(posts);
  });

  it('is written in the language lib/routes offers the blog in (§5)', () => {
    const row = PRIMARY_ROUTES.find((route) => route.path === '/blog');
    expect(row?.locale).toBe(BLOG_LOCALE);
  });
});
