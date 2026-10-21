import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createTranslator } from 'next-intl';
import type { CardCarouselMode } from '@/components/sections/CardCarousel/CardCarousel';
import type { BeforeAfterProps } from '@/components/sections/BeforeAfter/BeforeAfter';
import type { GalleryCard } from '@/components/sections/PostGallery/PostGallery';
import type { PostPageBlock } from '@/components/sections/PostPage/PostPage';
import { DEMO_PAGE } from '@/components/sections/PostPage/PostPage.fixtures';
import type { PostPhotoContent } from '@/components/sections/PostPhoto/PostPhoto';
import { locales, type Locale } from '@/i18n/locales';
import {
  articles,
  readingMinutes,
  type Article,
  type ArticleBlock,
  type ArticleCard,
  type ArticleEntry,
} from '@/lib/blog-article/blog-article';
import {
  posts,
  postsIn,
  type BlogPost,
  type BlogPostEntry,
  type BlogPostWords,
} from '@/lib/blog/blog';
import { withBasePath } from '@/lib/base-path/base-path';
import { shareHrefs } from '@/lib/share/share';
import { siteOrigin } from '@/lib/site-origin/site-origin';
import { doctors, type Doctor } from '@/lib/team/team';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import {
  articleLocale,
  articlePost,
  articlePreview,
  articleUrl,
  articleWordsFrom,
  OG_LOCALES,
  populateArticle,
  type ArticleKey,
  type ArticleTranslate,
  type ArticleWords,
  type CommonTranslate,
} from './populate';

// populate — a blog article's page (CLAUDE.md §15.39 round 4), in every
// language since 2026-10-15, tested without rendering anything: the module
// is pure, JSX-free and next-intl-free (its header), so this suite needs no
// provider and no DOM. The team folder's ../../team/populate.test.ts shape:
//   · the SHAPES pinned where both sides are importable — the gallery's two
//     axes and its card, spelled once by lib/blog-article and once by the
//     carousel's sections;
//   · against the SHIPPED data — the demo article, „Cum îți alegi periuța de
//     dinți": its runs, its gallery, its reading time, its share links, its
//     author — in Romanian, then in EVERY language: each page its post's
//     words, its article's body, its doctor's name and its own address in
//     that language, German through the real messages — and every article
//     lib/blog-article ships populating at all, in every language;
//   · against FIXTURES handed through the `list` and `store` seams — the
//     grouping's every rule, every part of a picture block handed on (the
//     full fixtures, typed `Required<…>`), another doctor's signature, a
//     post whose minutes are not its article's count, and the refusals,
//     shapes the shipped article need not hold. Every fixture language has
//     its own words, tagged with its code, so a walk that read another
//     language's shows.
// The words are a FIXTURE too (`WORDS`, the Romanian of ro.json, copied), so
// the walk is tested apart from the mapping; `articleWordsFrom` has its own
// describe, against recording translators and against the real messages.
//
// It runs in the `components` project — a real Chromium, harmless for a pure
// function — which PINS `process.env.PAGES_BASE_PATH` to '' (vitest.config.ts),
// so the addresses below are the root-served shape.

/** The demo article's slug — lib/blog-article's own test spells it the same. */
const DEMO = 'cum-iti-alegi-periuta-de-dinti';

/** A gallery block of an article file. */
type GalleryBlock = Extract<ArticleBlock, { type: 'gallery' }>;

/** `make` for each of the five languages — a fixture's every language its own. */
function inEach<T>(make: (locale: Locale) => T): Record<Locale, T> {
  return {
    ro: make('ro'),
    en: make('en'),
    de: make('de'),
    fr: make('fr'),
    it: make('it'),
  };
}

/** A doctor of lib/team by id — so a fixture names a real person without
 *  retyping a word of hers. */
const doctorById = (id: string): Doctor => {
  const doctor = doctors.find((row) => row.id === id);
  if (doctor === undefined) throw new Error(`no doctor ${id} in lib/team`);
  return doctor;
};

/** The demo's author, Dr. Nicu Elena Alina, read off lib/team by her id. */
const NICU = doctorById('nicu-elena-alina');

/** Another doctor, for a fixture post he signs. */
const TOMA = doctorById('toma-lucian');

/** The demo's post in a language, read off the shipped data. */
const demoPost = (locale: Locale = 'ro'): BlogPost => articlePost(locale, DEMO);

/** The demo's article in a language, read off the shipped data. */
const demoArticle = (locale: Locale = 'ro'): Article => {
  const entry = articles.find((article) => article.slug === DEMO);
  if (entry === undefined) throw new Error(`no article ${DEMO}`);
  return entry.languages[locale];
};

/** The demo's one gallery in a language, read off the shipped data. */
const demoGalleries = (locale: Locale = 'ro'): readonly GalleryBlock[] => {
  const galleries = demoArticle(locale).blocks.filter(
    (block): block is GalleryBlock => block.type === 'gallery',
  );
  if (galleries.length === 0) throw new Error(`no gallery in ${DEMO}`);
  return galleries;
};

/**
 * The page's words, finished — the Romanian of ro.json's `blog.article.*`,
 * `blog.readingTime`, `blog.tags` and `common.carousel`, COPIED, so the
 * walk's tests read words they can see. The three sentences with an argument
 * are plain functions here.
 */
const WORDS: ArticleWords = {
  byline: (author) => `de ${author}`,
  note: (note) => `Notă: ${note}`,
  readingTime: (minutes) => `${minutes} min de citit`,
  tags: 'Categorii',
  gallery: {
    region: (index, total) =>
      total === 1 ? 'Galerie foto' : `Galerie foto ${index} din ${total}`,
    previous: 'Fotografia anterioară',
    next: 'Fotografia următoare',
    picker: 'Alege fotografia',
    slide: (index, total) => `Fotografia ${index} din ${total}`,
  },
  carousel: { role: 'carusel', slideRole: 'diapozitiv' },
  share: {
    label: 'Distribuie articolul',
    facebook: { label: 'Facebook', name: 'Facebook, distribuie articolul' },
    whatsapp: { label: 'WhatsApp', name: 'WhatsApp, trimite articolul' },
    email: { label: 'E-mail', name: 'E-mail, trimite articolul' },
    copy: {
      label: 'Copiază linkul',
      copied: 'Link copiat',
      failed: 'Linkul nu a putut fi copiat',
    },
    message: (title) => `Citește acest articol de la Premium Smile: ${title}`,
    subject: (title) => `Un articol de la Premium Smile: ${title}`,
  },
};

/** The carousel's six words as {@link WORDS} gives them to a gallery — the
 *  region's name the one that differs from gallery to gallery, numbered on a
 *  page with more than one („Galerie foto 2 din 2"). */
const labelsNamed = (region: string) => ({
  region,
  role: 'carusel',
  slideRole: 'diapozitiv',
  previous: 'Fotografia anterioară',
  next: 'Fotografia următoare',
  picker: 'Alege fotografia',
});

/** {@link WORDS} with its three sentences spied on, to see what they were asked. */
const spiedWords = () => {
  const byline = vi.fn(WORDS.byline);
  const readingTime = vi.fn(WORDS.readingTime);
  const slide = vi.fn(WORDS.gallery.slide);
  return {
    words: {
      ...WORDS,
      byline,
      readingTime,
      gallery: { ...WORDS.gallery, slide },
    },
    byline,
    readingTime,
    slide,
  };
};

/** The fixture post's words in each language, tagged with its code — so a
 *  page that showed another language's words would show the wrong code. */
const FIXTURE_WORDS: Record<Locale, BlogPostWords> = inEach((locale) => ({
  title: `Un articol de probă (${locale})`,
  summary: `Un rezumat scurt, doar pentru teste (${locale}).`,
  tags: [`probă-${locale}`],
  alt: '',
}));

/** A fixture post — lib/blog's entry, its facts once and its words in every
 *  language — signed by Dr. Toma Lucian under his lib/team name, and
 *  announcing SEVEN minutes: its article below counts one, so a page that
 *  printed the count instead of the post's own number would say so. */
const FIXTURE_POST: BlogPostEntry = {
  slug: 'articol-de-proba',
  date: '2026-10-01',
  author: TOMA.words.ro.name,
  image: { src: '/images/hero/treatment-room.jpg' },
  readingMinutes: 7,
  words: FIXTURE_WORDS,
};

/** Three fixture cards in a language — a picture and its caption each, the
 *  provisional card, the caption and the alt in that language. */
const cardsIn = (locale: Locale): readonly ArticleCard[] => [
  {
    image: { src: '/images/hero/lobby.jpg', alt: `Sala (${locale})` },
    caption: `Sala (${locale})`,
  },
  {
    image: {
      src: '/images/hero/treatment-room.jpg',
      alt: `Cabinetul (${locale})`,
    },
    caption: `Cabinetul (${locale})`,
  },
  {
    image: {
      src: '/images/hero/instruments.jpg',
      alt: `Instrumentele (${locale})`,
    },
    caption: `Instrumentele (${locale})`,
  },
];

// THE FULL FIXTURES — the two galleries, `photo` and `beforeAfter` — are
// typed `Required<…>` of the file's block (2026-10-21, round 3 of the Opus
// reviews): each carries EVERY part lib/blog-article's block can hold, so a
// part added to that block does not compile here (TS2741, naming it) until
// the fixture carries it too — and then the walk's key test below ('lays
// every picture block with EXACTLY its file block’s parts …') fails until
// populate.ts' mapper hands it on. The bare ones carry the picture alone.

/** A rotating gallery of two cards. */
const loopGallery = (locale: Locale): Required<GalleryBlock> => ({
  type: 'gallery',
  mode: 'loop',
  cards: cardsIn(locale).slice(0, 2),
});

/** A bounded gallery of three cards. */
const boundedGallery = (locale: Locale): Required<GalleryBlock> => ({
  type: 'gallery',
  mode: 'bounded',
  cards: cardsIn(locale),
});

/** A blog photo of an article file. */
type PhotoBlock = Extract<ArticleBlock, { type: 'photo' }>;

/** A before/after pair of an article file. */
type PairBlock = Extract<ArticleBlock, { type: 'beforeAfter' }>;

/** A fixture blog photo in a language, with EVERY part — its heading and its
 *  note beside the picture. */
const photo = (locale: Locale): Required<PhotoBlock> => ({
  type: 'photo',
  image: { src: '/images/hero/lobby.jpg', alt: `Sala (${locale})` },
  heading: `O fotografie (${locale})`,
  note: `fotografie de probă (${locale}).`,
});

/** A fixture blog photo in a language with neither a heading nor a note. */
const barePhoto = (locale: Locale): PhotoBlock => ({
  type: 'photo',
  image: { src: '/images/demo/hero-calm.jpg', alt: `Cabinetul (${locale})` },
});

/** A fixture before/after pair in a language, with EVERY part — its headings
 *  and its notes beside the pictures. */
const beforeAfter = (locale: Locale): Required<PairBlock> => ({
  type: 'beforeAfter',
  images: {
    before: { src: '/images/hero/lobby.jpg', alt: `Sala (${locale})` },
    after: {
      src: '/images/hero/instruments.jpg',
      alt: `Instrumentele (${locale})`,
    },
  },
  headings: { before: `Înainte (${locale})`, after: `După (${locale})` },
  notes: {
    before: `prima notă (${locale}).`,
    after: `a doua notă (${locale}).`,
  },
});

/** A fixture before/after pair in a language with no heading and no note. */
const barePair = (locale: Locale): PairBlock => ({
  type: 'beforeAfter',
  images: beforeAfter(locale).images,
});

/**
 * Every grouping rule in one article, in a language: a run that OPENS on a
 * subheading, two galleries side by side (two, never merged, each counting
 * its own cards), a subheading alone between two other blocks (a run of
 * one), a blog photo and a before/after each standing alone — one with its
 * heading and its note, one with neither — and a run that CLOSES the
 * article.
 */
const mixedIn = (locale: Locale): Article => ({
  slug: FIXTURE_POST.slug,
  blocks: [
    { type: 'heading', text: `Un subtitlu la început (${locale})` },
    { type: 'paragraph', text: `Primul paragraf (${locale}).` },
    { type: 'paragraph', text: `Al doilea paragraf (${locale}).` },
    loopGallery(locale),
    boundedGallery(locale),
    { type: 'heading', text: `Un subtitlu singur (${locale})` },
    photo(locale),
    beforeAfter(locale),
    barePhoto(locale),
    barePair(locale),
    { type: 'paragraph', text: `Ultimul paragraf (${locale}).` },
  ],
  conclusion: `Încheierea articolului de probă (${locale}).`,
});

/** {@link mixedIn} in every language — the fixture article as the store holds it. */
const MIXED: ArticleEntry = {
  slug: FIXTURE_POST.slug,
  languages: inEach(mixedIn),
};

/** The keys a picture block of the PAGE holds beside its file block's parts:
 *  a gallery's carousel words, the route's — a photo and a pair hold their
 *  file's parts alone. A kind added to the page's blocks does not compile
 *  here until it is listed. */
const ADDED_BY_THE_ROUTE: Readonly<
  Record<Exclude<PostPageBlock['kind'], 'prose'>, readonly string[]>
> = {
  gallery: ['labels', 'slideLabels'],
  photo: [],
  beforeAfter: [],
};

/** The fixture post with its body, in `locale`, as the walk's two seams take them. */
const populateFixture = (
  entry: ArticleEntry,
  words: ArticleWords = WORDS,
  locale: Locale = 'ro',
) => populateArticle(locale, FIXTURE_POST.slug, words, [FIXTURE_POST], [entry]);

/** Every key of {@link ArticleKey}, at runtime — held equal to the union by
 *  the type test below, so a key added to one is missing from the other. */
const ALL_KEYS = [
  'article.byline',
  'article.note',
  'readingTime',
  'article.gallery.region',
  'article.gallery.regionNumbered',
  'article.gallery.previous',
  'article.gallery.next',
  'article.gallery.picker',
  'article.gallery.slide',
  'article.share.label',
  'article.share.facebook',
  'article.share.facebookName',
  'article.share.whatsapp',
  'article.share.whatsappName',
  'article.share.email',
  'article.share.emailName',
  'article.share.copy',
  'article.share.copied',
  'article.share.copyFailed',
  'article.share.message',
  'article.share.subject',
  'tags',
] as const satisfies readonly ArticleKey[];

/** A key of the `common` namespace the page reads. */
type CommonKey = Parameters<CommonTranslate>[0];

/** Every `common` key, at runtime — held equal to {@link CommonKey} below. */
const ALL_COMMON_KEYS = [
  'carousel.role',
  'carousel.slideRole',
  'siteName',
] as const satisfies readonly CommonKey[];

/** The keys whose sentence takes an argument. */
const WITH_ARGUMENT: readonly ArticleKey[] = [
  'article.byline',
  'article.note',
  'readingTime',
  'article.gallery.regionNumbered',
  'article.gallery.slide',
  'article.share.message',
  'article.share.subject',
];

/** One call a recording translator heard: the key, and its argument when one was passed. */
type Call = readonly [ArticleKey, Parameters<ArticleTranslate>[1]?];

/** Two translators that answer `«key»` (and its arguments, when given) and
 *  write down every call — the fakes the mapping is read against. */
const recordingTranslators = () => {
  const calls: Call[] = [];
  const commonCalls: CommonKey[] = [];
  const t: ArticleTranslate = (key, values) => {
    calls.push(values === undefined ? [key] : [key, values]);
    return values === undefined
      ? `«${key}»`
      : `«${key}»${JSON.stringify(values)}`;
  };
  const common: CommonTranslate = (key) => {
    commonCalls.push(key);
    return `«common.${key}»`;
  };
  return { t, common, calls, commonCalls };
};

/** The page's words through the REAL messages of a language — the page's own
 *  mapping over translators built on that file's TYPED messages. */
const realWords = {
  ro: () =>
    articleWordsFrom(
      createTranslator({ locale: 'ro', messages: ro, namespace: 'blog' }),
      createTranslator({ locale: 'ro', messages: ro, namespace: 'common' }),
    ),
  de: () =>
    articleWordsFrom(
      createTranslator({ locale: 'de', messages: de, namespace: 'blog' }),
      createTranslator({ locale: 'de', messages: de, namespace: 'common' }),
    ),
};

describe('populate — the shapes pinned where both sides are importable', () => {
  it('holds lib/blog-article’s gallery `mode` EQUAL to CardCarousel’s own union — and an article’s gallery names no window', () => {
    // lib/blog-article spells the mode again because lib never imports a
    // section (§4); this route hands one to the other and is the one tier
    // that may import both, so the pair is held here (its header's THE
    // GALLERY). A third mode added to either side alone fails at
    // `tsc --noEmit`, naming it. The window is three cards, an article's only
    // one since 2026-10-17 (the five-card window is the Home page's).
    expectTypeOf<GalleryBlock['mode']>().toEqualTypeOf<CardCarouselMode>();
    expectTypeOf<GalleryBlock>().not.toHaveProperty('visible');
  });

  it('holds lib/blog-article’s card EQUAL to PostGallery’s — the provisional card, one shape on both sides', () => {
    // The card is the owner's to redesign (lib/blog-article's THE CARD IS
    // PROVISIONAL): the day it changes, it changes on both sides at once.
    expectTypeOf<ArticleCard>().toEqualTypeOf<GalleryCard>();
  });

  it('holds lib/blog-article’s photo EQUAL to PostPhoto’s content, and its pair’s three parts EQUAL to BeforeAfter’s props — one shape on both sides', () => {
    // This route hands each on unchanged but for a note's lead-in (a string
    // in and a string out — the header's THE NOTES), so a part added to one
    // side alone — a caption, a credit — fails `tsc --noEmit` here, naming
    // it, instead of being dropped between the file and the page. (Added to
    // BOTH sides at once it passes these, and the MAPPING holds it instead:
    // populate.ts' photoBlock and pairBlock each build their parts in an
    // object that `satisfies` the file's block's parts, so it does not
    // compile there until it is handed on — populate.ts' THE MAPPERS — and
    // the walk's key test below lays the full fixtures and reads every laid
    // block's keys.) The pair's parts grouped by kind are lib/blog-article's
    // THE PAIR IS ONE SHAPE and BeforeAfter's alike: a heading or a note over
    // one half alone cannot be written on either side.
    expectTypeOf<Omit<PhotoBlock, 'type'>>().toEqualTypeOf<PostPhotoContent>();
    expectTypeOf<PairBlock['images']>().toEqualTypeOf<
      BeforeAfterProps['images']
    >();
    expectTypeOf<PairBlock['headings']>().toEqualTypeOf<
      BeforeAfterProps['headings']
    >();
    expectTypeOf<PairBlock['notes']>().toEqualTypeOf<
      BeforeAfterProps['notes']
    >();
  });

  it('names EVERY part of the file’s photo, pair and gallery — the parts populate.ts’ mappers must hand on, listed where a new one shows', () => {
    // A LIST, NOT THE GUARD (2026-10-21, round 3 of the Opus reviews — react
    // and typescript, both measured). These pins fail to compile until a new
    // part is named here, and naming it here mapped nothing: with only them
    // and the pins above, a part added to lib/blog-article's photo AND to
    // PostPhotoContent (and to sections/PostPage's own key pin) passed every
    // one of them and `tsc --noEmit`, and the route dropped it on the way to
    // the page. What holds the mapping now is populate.ts' THE MAPPERS — each
    // mapper's parts object `satisfies` the file block's parts, so a new part
    // does not compile there until it is handed on, and the object leaves
    // whole — and, at runtime, the walk's key test below ('lays every picture
    // block with EXACTLY its file block’s parts …') over the full fixtures,
    // typed `Required<…>`, which must carry the new part to compile. These
    // keep the parts in sight, one line each.
    // The photo — handed on by photoBlock.
    expectTypeOf<keyof PhotoBlock>().toEqualTypeOf<
      'type' | 'image' | 'heading' | 'note'
    >();
    // The pair — handed on by pairBlock.
    expectTypeOf<keyof PairBlock>().toEqualTypeOf<
      'type' | 'images' | 'headings' | 'notes'
    >();
    // The gallery — handed on by galleryBlock (its card is held EQUAL to
    // PostGallery's above).
    expectTypeOf<keyof GalleryBlock>().toEqualTypeOf<
      'type' | 'mode' | 'cards'
    >();
  });
});

describe('articleWordsFrom — the ONE mapping of keys to words', () => {
  it('knows exactly the keys ArticleKey and CommonTranslate spell — the runtime lists and the unions agree', () => {
    expectTypeOf<(typeof ALL_KEYS)[number]>().toEqualTypeOf<ArticleKey>();
    expectTypeOf<(typeof ALL_COMMON_KEYS)[number]>().toEqualTypeOf<CommonKey>();
    expect(new Set(ALL_KEYS).size).toBe(ALL_KEYS.length);
  });

  it('reads every key ONCE — the four sentences when they are asked, each with its own argument', () => {
    const { t, common, calls, commonCalls } = recordingTranslators();
    const words = articleWordsFrom(t, common);
    // Nothing with an argument is read before it is asked for.
    for (const key of WITH_ARGUMENT) {
      expect(calls.map(([read]) => read)).not.toContain(key);
    }

    words.byline('Dr. Nicu Elena Alina');
    words.note('fotografie de prezentare.');
    words.readingTime(4);
    words.gallery.region(1, 1);
    words.gallery.region(2, 4);
    words.gallery.slide(1, 4);
    words.share.message('Titlu');
    words.share.subject('Titlu');

    expect(calls.map(([key]) => key).toSorted()).toEqual(
      [...ALL_KEYS].toSorted(),
    );
    expect(commonCalls.toSorted()).toEqual([...ALL_COMMON_KEYS].toSorted());
    expect(calls).toContainEqual([
      'article.byline',
      { author: 'Dr. Nicu Elena Alina' },
    ]);
    expect(calls).toContainEqual([
      'article.note',
      { note: 'fotografie de prezentare.' },
    ]);
    expect(calls).toContainEqual(['readingTime', { minutes: 4 }]);
    expect(calls).toContainEqual([
      'article.gallery.slide',
      { index: 1, total: 4 },
    ]);
    // The two share sentences each take the clinic's name — read ONCE, from
    // `common` — and the post's title.
    for (const key of [
      'article.share.message',
      'article.share.subject',
    ] as const) {
      expect(calls).toContainEqual([
        key,
        { site: '«common.siteName»', title: 'Titlu' },
      ]);
    }
    // Every other key is read with no argument at all.
    for (const [key, values] of calls) {
      if (!WITH_ARGUMENT.includes(key)) {
        expect(values, key).toBeUndefined();
      }
    }
  });

  it('puts every word in its own place — no word swapped for another', () => {
    const { t, common } = recordingTranslators();
    const {
      byline,
      note,
      readingTime,
      gallery: { slide, region, ...gallery },
      share: { message, subject, ...share },
      ...rest
    } = articleWordsFrom(t, common);

    expect({ ...rest, gallery, share }).toEqual({
      tags: '«tags»',
      gallery: {
        previous: '«article.gallery.previous»',
        picker: '«article.gallery.picker»',
        next: '«article.gallery.next»',
      },
      carousel: {
        role: '«common.carousel.role»',
        slideRole: '«common.carousel.slideRole»',
      },
      share: {
        label: '«article.share.label»',
        facebook: {
          label: '«article.share.facebook»',
          name: '«article.share.facebookName»',
        },
        whatsapp: {
          label: '«article.share.whatsapp»',
          name: '«article.share.whatsappName»',
        },
        email: {
          label: '«article.share.email»',
          name: '«article.share.emailName»',
        },
        copy: {
          label: '«article.share.copy»',
          copied: '«article.share.copied»',
          failed: '«article.share.copyFailed»',
        },
      },
    });
    expect(byline('Dr. Ana')).toBe('«article.byline»{"author":"Dr. Ana"}');
    expect(note('o notă.')).toBe('«article.note»{"note":"o notă."}');
    expect(readingTime(7)).toBe('«readingTime»{"minutes":7}');
    expect(slide(2, 5)).toBe('«article.gallery.slide»{"index":2,"total":5}');
    // The region's name: plain on a page with one gallery, numbered on one
    // with more — the number its own key's, never the plain name's.
    expect(region(1, 1)).toBe('«article.gallery.region»');
    expect(region(2, 4)).toBe(
      '«article.gallery.regionNumbered»{"index":2,"total":4}',
    );
    // The share sentences: the message and the subject, each its own key.
    expect(message('Titlu')).toBe(
      '«article.share.message»{"site":"«common.siteName»","title":"Titlu"}',
    );
    expect(subject('Titlu')).toBe(
      '«article.share.subject»{"site":"«common.siteName»","title":"Titlu"}',
    );
  });

  it('speaks the blog’s Romanian through the REAL messages — each sentence’s argument is the one its message names', () => {
    // A mapping that passed `{ min }` where the message reads `{minutes}`
    // would pass the recording translators and fail HERE: next-intl reports a
    // formatting error and prints the key's path instead of the sentence. And
    // these translators' messages are TYPED (ro.json's own type), so handing
    // them to `articleWordsFrom` is a compile-time check too: a key ro.json
    // lacks does not type-check (populate.ts' ArticleTranslate).
    const words = realWords.ro();

    expect(words.byline(NICU.words.ro.name)).toBe('de Dr. Nicu Elena Alina');
    // The note's lead-in, the owner's "Note: " in the page's language.
    expect(words.note('fotografie de prezentare.')).toBe(
      'Notă: fotografie de prezentare.',
    );
    expect(words.readingTime(4)).toBe('4 min de citit');
    expect(words.gallery.slide(1, 4)).toBe('Fotografia 1 din 4');
    expect(words.tags).toBe(ro.blog.tags);
    expect(words.gallery.region(1, 1)).toBe(ro.blog.article.gallery.region);
    expect(words.gallery.region(2, 4)).toBe('Galerie foto 2 din 4');
    expect(words.gallery.previous).toBe(ro.blog.article.gallery.previous);
    expect(words.gallery.next).toBe(ro.blog.article.gallery.next);
    expect(words.gallery.picker).toBe(ro.blog.article.gallery.picker);
    expect(words.carousel).toEqual({
      role: ro.common.carousel.role,
      slideRole: ro.common.carousel.slideRole,
    });
    const { message, subject, ...share } = words.share;
    expect(share).toEqual({
      label: ro.blog.article.share.label,
      facebook: {
        label: ro.blog.article.share.facebook,
        name: ro.blog.article.share.facebookName,
      },
      whatsapp: {
        label: ro.blog.article.share.whatsapp,
        name: ro.blog.article.share.whatsappName,
      },
      email: {
        label: ro.blog.article.share.email,
        name: ro.blog.article.share.emailName,
      },
      copy: {
        label: ro.blog.article.share.copy,
        copied: ro.blog.article.share.copied,
        failed: ro.blog.article.share.copyFailed,
      },
    });
    // The owner's "check out this article from …" and the e-mail's subject,
    // in Romanian, the clinic's name and the title in them.
    expect(message('Cum îți alegi periuța de dinți')).toBe(
      'Citește acest articol de la Premium Smile: Cum îți alegi periuța de dinți',
    );
    expect(subject('Cum îți alegi periuța de dinți')).toBe(
      'Un articol de la Premium Smile: Cum îți alegi periuța de dinți',
    );
  });

  it('speaks German through the REAL messages too — the longest language, every sentence its own', () => {
    const words = realWords.de();

    expect(words.byline(NICU.words.de.name)).toBe('von Dr. Nicu Elena Alina');
    expect(words.note('Aufnahme der Praxis.')).toBe(
      'Hinweis: Aufnahme der Praxis.',
    );
    expect(words.readingTime(4)).toBe('4 Min. Lesezeit');
    expect(words.gallery.slide(1, 4)).toBe('Foto 1 von 4');
    expect(words.tags).toBe(de.blog.tags);
    expect(words.gallery.region(1, 1)).toBe(de.blog.article.gallery.region);
    expect(words.gallery.region(3, 4)).toBe('Fotogalerie 3 von 4');
    expect(words.carousel).toEqual({
      role: de.common.carousel.role,
      slideRole: de.common.carousel.slideRole,
    });
    expect(words.share.label).toBe(de.blog.article.share.label);
    expect(words.share.copy.failed).toBe(de.blog.article.share.copyFailed);
    expect(words.share.message('Die richtige Zahnbürste')).toBe(
      'Lesetipp von Premium Smile: Die richtige Zahnbürste',
    );
    expect(words.share.subject('Die richtige Zahnbürste')).toBe(
      'Ein Artikel von Premium Smile: Die richtige Zahnbürste',
    );
  });

  it('reads the reading time from the blog’s ONE sentence — the very message the list’s cards speak', () => {
    // `blog.readingTime` is the list's card's sentence and the article page's
    // alike (../populate.ts reads the same key): one message, so a card and
    // its page can never word a reading time two ways.
    expect(realWords.ro().readingTime(12)).toBe(
      ro.blog.readingTime.replace('{minutes, number}', '12'),
    );
    expect(realWords.de().readingTime(12)).toBe(
      de.blog.readingTime.replace('{minutes, number}', '12'),
    );
  });
});

describe('articleLocale — the page’s language, narrowed once', () => {
  it.each(locales)('hands %s back as a Locale', (locale) => {
    expect(articleLocale(locale)).toBe(locale);
    expectTypeOf(articleLocale).returns.toEqualTypeOf<Locale>();
  });

  it.each(['es', '', 'RO', 'ro-RO', 'romanian'])(
    'refuses „%s", naming it — no language the site routes',
    (value) => {
      expect(() => articleLocale(value)).toThrow(
        `blog article: unknown locale "${value}"`,
      );
    },
  );
});

describe('articleUrl — the page’s public address, in its own language', () => {
  it.each(locales)(
    '%s: is the article’s path under that language’s prefix on the site’s origin, with the site’s trailing slash',
    (locale) => {
      expect(articleUrl(locale, DEMO)).toBe(
        new URL(`/${locale}/blog/${DEMO}/`, `${siteOrigin()}/`).href,
      );
      expect(articleUrl(locale, DEMO)).toMatch(
        new RegExp(`^https://[^/]+/${locale}/blog/${DEMO}/$`),
      );
    },
  );

  it('is an address lib/share takes — absolute, http(s)', () => {
    for (const locale of locales) {
      expect(() =>
        shareHrefs(articleUrl(locale, DEMO), {
          subject: 'Titlu',
          message: 'Titlu',
        }),
      ).not.toThrow();
    }
  });
});

describe('articlePreview — what a shared link’s card says, in the page’s language', () => {
  it.each(locales)(
    '%s: the post’s title and summary, the page’s address, the cover by its absolute address, the day, the doctor, the tags and the language',
    (locale) => {
      const preview = articlePreview(locale, DEMO);
      const post = demoPost(locale);
      const entry = posts.find((candidate) => candidate.slug === DEMO);
      if (entry === undefined) throw new Error(`no post ${DEMO}`);

      expect(preview).toEqual({
        title: post.title,
        description: post.summary,
        url: articleUrl(locale, DEMO),
        image: {
          src: post.image.src,
          url: new URL(withBasePath(post.image.src), `${siteOrigin()}/`).href,
          alt: post.image.alt,
        },
        publishedTime: entry.date,
        author: NICU.words[locale].name,
        tags: post.tags,
        locale: OG_LOCALES[locale],
        alternateLocales: locales
          .filter((other) => other !== locale)
          .map((other) => OG_LOCALES[other]),
      });
      // The picture's address is ABSOLUTE and on the page's own origin, so a
      // card drawn for the shared link fetches it from where the link points.
      expect(new URL(preview.image.url).origin).toBe(
        new URL(preview.url).origin,
      );
    },
  );

  it('spells every page language the Open Graph way — language_TERRITORY, the language first', () => {
    expect(Object.keys(OG_LOCALES).toSorted()).toEqual([...locales].toSorted());
    for (const locale of locales) {
      expect(OG_LOCALES[locale]).toMatch(new RegExp(`^${locale}_[A-Z]{2}$`));
    }
    expect(OG_LOCALES.en).toBe('en_GB');
  });

  it('refuses a slug no post has with THE one refusal — articlePost’s own, word for word', () => {
    // articlePreview and articlePost find the entry through ONE function
    // (populate.ts' postEntry), so they refuse in one sentence, pinned whole
    // here — a check for the slug alone would let a second, drifting
    // sentence through (2026-10-21, round 3 of the Opus reviews).
    const refusal =
      'blog article „nu-exista": no post has this slug — an article page is built for a post of src/content/blog/posts.json';
    const thrown = (call: () => unknown): unknown => {
      try {
        call();
      } catch (error) {
        return error instanceof RangeError ? error.message : error;
      }
      throw new Error('no refusal: the call returned');
    };

    expect(thrown(() => articlePreview('ro', 'nu-exista'))).toBe(refusal);
    expect(thrown(() => articlePost('ro', 'nu-exista'))).toBe(refusal);
  });
});

describe('articlePost — the post an article page is for, in the page’s language', () => {
  it('finds the post by its slug, in the page’s language', () => {
    expect(articlePost('ro', DEMO).title).toBe(
      'Cum îți alegi periuța de dinți',
    );
    for (const locale of locales) {
      expect(articlePost(locale, DEMO), locale).toEqual(
        postsIn(locale).find((post) => post.slug === DEMO),
      );
      expect(
        articlePost(locale, FIXTURE_POST.slug, [FIXTURE_POST]).title,
        locale,
      ).toBe(FIXTURE_WORDS[locale].title);
    }
  });

  it('refuses a slug no post has, with a RangeError naming it', () => {
    expect(() => articlePost('de', 'nu-exista')).toThrow(RangeError);
    expect(() => articlePost('de', 'nu-exista')).toThrow(/„nu-exista"/);
  });
});

describe('populateArticle — the demo article in Romanian, from the shipped data', () => {
  it('opens on the post’s title over the by-line of its doctor', () => {
    const { words, byline } = spiedWords();
    const page = populateArticle('ro', DEMO, words);

    expect(page.header).toEqual({
      title: demoPost().title,
      byline: 'de Dr. Nicu Elena Alina',
    });
    expect(byline).toHaveBeenCalledTimes(1);
    expect(byline).toHaveBeenCalledWith(NICU.words.ro.name);
    // In Romanian lib/team's name IS the post's own `author` string.
    expect(NICU.words.ro.name).toBe(demoPost().author);
  });

  it('announces its POST’s reading time — the number the post’s card prints on the list', () => {
    const { words, readingTime } = spiedWords();
    const page = populateArticle('ro', DEMO, words);

    expect(demoPost().readingMinutes).toBe(4);
    expect(readingTime).toHaveBeenCalledTimes(1);
    expect(readingTime).toHaveBeenCalledWith(demoPost().readingMinutes);
    expect(page.cover.readingTime).toBe('4 min de citit');
    // …which the article's own count keeps (tests/unit/blog-article-data.
    // test.ts holds the two EQUAL in Romanian).
    expect(readingMinutes(demoArticle())).toBe(demoPost().readingMinutes);
  });

  it('covers the page with the post’s own picture and categories', () => {
    const page = populateArticle('ro', DEMO, WORDS);

    expect(page.cover).toEqual({
      readingTime: '4 min de citit',
      image: demoPost().image,
      tags: ['igienă', 'sfaturi'],
      tagsLabel: 'Categorii',
    });
  });

  it('groups the demo into its runs — its four photos, its two galleries and its four pairs standing alone between them, never two pictures side by side', () => {
    const { blocks } = populateArticle('ro', DEMO, WORDS);

    expect(blocks.map((block) => block.kind)).toEqual([
      'prose',
      'photo',
      'prose',
      'photo',
      'prose',
      'gallery',
      'prose',
      'photo',
      'prose',
      'beforeAfter',
      'prose',
      'beforeAfter',
      'prose',
      'gallery',
      'prose',
      'beforeAfter',
      'prose',
      'beforeAfter',
      'prose',
      'photo',
    ]);
    // …every picture block between two prose runs: no gallery, photo or pair
    // ever stands against another.
    for (const [at, block] of blocks.entries()) {
      if (block.kind !== 'prose') {
        expect(blocks[at + 1]?.kind ?? 'prose', String(at)).toBe('prose');
      }
    }
    // The file's own order, run by run (p = a paragraph, h = a subheading):
    // the opening paragraph, then each of the article's sections, every one
    // closed by its picture.
    expect(
      blocks.flatMap((block) =>
        block.kind === 'prose'
          ? [block.items.map((item) => item.kind.charAt(0)).join('')]
          : [],
      ),
    ).toEqual(['p', 'hpp', 'hpp', 'hp', 'p', 'hp', 'h', 'p', 'hp', 'p']);
  });

  it('loses no paragraph or subheading and reorders none — the runs, read in order, ARE the article’s text', () => {
    const { blocks } = populateArticle('ro', DEMO, WORDS);
    const runs = blocks.flatMap((block) =>
      block.kind === 'prose' ? block.items : [],
    );
    const text = demoArticle().blocks.flatMap((block) =>
      block.type === 'paragraph' || block.type === 'heading'
        ? [{ kind: block.type, text: block.text }]
        : [],
    );

    expect(runs).toEqual(text);
  });

  it('hands the demo’s TWO galleries to their carousels — circular, then end to end, eight cards each — their mode, their numbered names and one name per card', () => {
    // The owner, 2026-10-16: "create instance on 3 and instance of 5 cards on
    // ciruclar one … have simple list with cange direction onc eend reached";
    // on 2026-10-17 the five-card window left the article for the Home page
    // ("the fiver option … do not represent it in the article") — so two
    // galleries of three, circular then end to end, the same eight cards.
    const { words, slide } = spiedWords();
    const { blocks } = populateArticle('ro', DEMO, words);
    const galleries = demoGalleries();

    expect(galleries.map((gallery) => gallery.mode)).toEqual([
      'loop',
      'bounded',
    ]);
    for (const gallery of galleries) {
      expect(gallery.cards).toHaveLength(8);
      expect(gallery.cards).toEqual(galleries[0]?.cards);
    }
    // Each one handed over whole, its region numbered among the two — a
    // page's landmarks never share a name (populate.ts' THE GALLERY) — and
    // its cards named within ITS gallery, „Fotografia 1 din 8" …
    expect(blocks.filter((block) => block.kind === 'gallery')).toEqual(
      galleries.map((gallery, at) => ({
        kind: 'gallery',
        cards: gallery.cards,
        mode: gallery.mode,
        labels: labelsNamed(`Galerie foto ${at + 1} din 2`),
        slideLabels: gallery.cards.map(
          (_, card) => `Fotografia ${card + 1} din 8`,
        ),
      })),
    );
    expect(slide.mock.calls).toEqual(
      galleries.flatMap((gallery) =>
        gallery.cards.map((_, card) => [card + 1, 8]),
      ),
    );
  });

  it('shows EVERY instance the owner asked for — a photo and a pair each with a heading and a note, with a heading alone, with a note alone and with neither', () => {
    // The owner, 2026-10-15: "also add an instance of the single blog image
    // with note, with heading and no not and without no heading nor not and
    // with note no heading. also add every instantiation possible of a
    // inainte and dupa". H = a heading (or both of a pair's), N = a note
    // (or both), - = none.
    const { blocks } = populateArticle('ro', DEMO, WORDS);
    const shape = (heading: unknown, note: unknown): string =>
      `${heading === undefined ? '-' : 'H'}${note === undefined ? '-' : 'N'}`;

    expect(
      blocks
        .flatMap((block) =>
          block.kind === 'photo' ? [shape(block.heading, block.note)] : [],
        )
        .toSorted(),
    ).toEqual(['--', '-N', 'H-', 'HN']);
    expect(
      blocks
        .flatMap((block) =>
          block.kind === 'beforeAfter'
            ? [shape(block.headings, block.notes)]
            : [],
        )
        .toSorted(),
    ).toEqual(['--', '-N', 'H-', 'HN']);
    // The article's first pair keeps its „Înainte" / „După"; the headings
    // are any words (the owner: "headings sould be replaceble"), so another
    // pair says something else over its two pictures.
    const headed = blocks.flatMap((block) =>
      block.kind === 'beforeAfter' && block.headings !== undefined
        ? [block.headings]
        : [],
    );
    expect(headed).toContainEqual({ before: 'Înainte', after: 'După' });
    expect(
      headed.some(
        ({ before, after }) => before !== 'Înainte' || after !== 'După',
      ),
    ).toBe(true);
  });

  it('lays every photo and pair of the demo as its file holds it — pictures and headings passed through, every note finished with the page’s lead-in', () => {
    const { blocks } = populateArticle('ro', DEMO, WORDS);
    const held = demoArticle().blocks.filter(
      (block) => block.type === 'photo' || block.type === 'beforeAfter',
    );
    const laid = blocks.filter(
      (block) => block.kind === 'photo' || block.kind === 'beforeAfter',
    );
    const finished = (note: string): string => `Notă: ${note}`;

    expect(laid).toHaveLength(held.length);
    for (const [index, block] of laid.entries()) {
      const source = held[index];
      if (block.kind === 'photo' && source?.type === 'photo') {
        expect(block.image).toBe(source.image);
        expect(block.heading).toBe(source.heading);
        expect(block.note).toBe(
          source.note === undefined ? undefined : finished(source.note),
        );
      } else if (
        block.kind === 'beforeAfter' &&
        source?.type === 'beforeAfter'
      ) {
        expect(block.images).toBe(source.images);
        expect(block.headings).toBe(source.headings);
        expect(block.notes).toEqual(
          source.notes === undefined
            ? undefined
            : {
                before: finished(source.notes.before),
                after: finished(source.notes.after),
              },
        );
      } else {
        throw new Error(
          `picture block ${index + 1}: the page laid a ${block.kind} where the file holds a ${source?.type ?? 'nothing'}`,
        );
      }
    }
  });

  it('hands every share link its address — lib/share’s, for the page’s own — and its two words', () => {
    const { share } = populateArticle('ro', DEMO, WORDS);
    const hrefs = shareHrefs(articleUrl('ro', DEMO), {
      subject: `Un articol de la Premium Smile: ${demoPost().title}`,
      message: `Citește acest articol de la Premium Smile: ${demoPost().title}`,
    });

    expect(share.label).toBe('Distribuie articolul');
    expect(share.facebook).toEqual({
      href: hrefs.facebook,
      label: 'Facebook',
      name: 'Facebook, distribuie articolul',
    });
    expect(share.whatsapp).toEqual({
      href: hrefs.whatsapp,
      label: 'WhatsApp',
      name: 'WhatsApp, trimite articolul',
    });
    expect(share.email).toEqual({
      href: hrefs.email,
      label: 'E-mail',
      name: 'E-mail, trimite articolul',
    });
  });

  it('copies the VERY address the three links share', () => {
    const { share } = populateArticle('ro', DEMO, WORDS);
    const encoded = encodeURIComponent(articleUrl('ro', DEMO));

    expect(share.copy).toEqual({
      url: articleUrl('ro', DEMO),
      label: 'Copiază linkul',
      copied: 'Link copiat',
      failed: 'Linkul nu a putut fi copiat',
    });
    expect(share.facebook.href).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    );
    expect(share.whatsapp.href).toContain(encoded);
    // The e-mail's body ends on the address, after the message and a blank
    // line (CR LF CR LF — lib/share's THE LINE BREAKS).
    expect(share.email.href.endsWith(`%0D%0A%0D%0A${encoded}`)).toBe(true);
  });

  it('signs the conclusion with the author’s own doctor — her name, her specialty and her cutout', () => {
    const { conclusion } = populateArticle('ro', DEMO, WORDS);

    expect(conclusion).toEqual({
      text: demoArticle().conclusion,
      doctor: {
        name: NICU.words.ro.name,
        position: NICU.words.ro.position,
        photo: NICU.cutout,
      },
    });
    expect(conclusion.doctor.name).toBe(demoPost().author);
  });

  it('IS sections/PostPage’s demo page, word for word — the band’s fixture copies this very page and is held to it here', () => {
    // PostPage.fixtures.ts copies the shipped article's page word for word
    // (its header: never the route's populator — the band's stories and
    // suite hand the band an object of their own), and nothing else held the
    // copy to the page this walk builds (2026-10-20, the Opus typescript
    // review). Through the REAL Romanian messages, the words the fixture says
    // it copies, on the root-served shape this project pins — no base path,
    // lib/clinic's placeholder origin, the fixture's DEMO_ADDRESS — so a
    // change to the article, to ro.json, to the post or to the walk that the
    // fixture does not follow fails here, naming the part that drifted.
    expect(populateArticle('ro', DEMO, realWords.ro())).toStrictEqual(
      DEMO_PAGE,
    );
  });
});

describe('populateArticle — the demo article in EVERY language', () => {
  it.each(locales)(
    '%s: the post’s words, the article’s body, the doctor and the page’s own address, all in that language',
    (locale) => {
      const { words, byline, readingTime } = spiedWords();
      const page = populateArticle(locale, DEMO, words);
      const post = demoPost(locale);
      const article = demoArticle(locale);
      const url = articleUrl(locale, DEMO);

      expect(page.header.title).toBe(post.title);
      expect(byline).toHaveBeenCalledWith(NICU.words[locale].name);
      expect(page.cover).toMatchObject({
        image: post.image,
        tags: post.tags,
      });
      expect(readingTime).toHaveBeenCalledWith(post.readingMinutes);
      expect(
        page.blocks.flatMap((block) =>
          block.kind === 'prose' ? block.items.map((item) => item.text) : [],
        ),
      ).toEqual(
        article.blocks.flatMap((block) =>
          block.type === 'paragraph' || block.type === 'heading'
            ? [block.text]
            : [],
        ),
      );
      expect(
        page.blocks.flatMap((block) =>
          block.kind === 'gallery' ? [block.cards] : [],
        ),
      ).toEqual(demoGalleries(locale).map((gallery) => gallery.cards));
      // Every note of this language finished with ITS lead-in, never
      // another language's (the fixture words are Romanian: „Notă: ").
      for (const block of page.blocks) {
        const notes =
          block.kind === 'photo'
            ? [block.note]
            : block.kind === 'beforeAfter'
              ? [block.notes?.before, block.notes?.after]
              : [];
        for (const note of notes) {
          if (note !== undefined) expect(note).toMatch(/^Notă: \S/);
        }
      }
      expect(page.conclusion).toEqual({
        text: article.conclusion,
        doctor: {
          name: NICU.words[locale].name,
          position: NICU.words[locale].position,
          photo: NICU.cutout,
        },
      });
      expect(page.share.copy.url).toBe(url);
      expect(page.share.facebook.href).toBe(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      );
    },
  );

  it('names the doctor ONE way on a page — the by-line and the signature as lib/team spells her in the page’s language', () => {
    // lib/team's French drops the honorific's point („Dr Nicu Elena Alina"),
    // the post's one `author` string keeps it („Dr. …"): a by-line printed
    // from the post would read „par Dr. …" over a signature „Dr …".
    const { words, byline } = spiedWords();
    const page = populateArticle('fr', DEMO, words);

    expect(NICU.words.fr.name).not.toBe(demoPost('fr').author);
    expect(byline).toHaveBeenCalledWith(NICU.words.fr.name);
    expect(page.conclusion.doctor.name).toBe(NICU.words.fr.name);
  });

  it('speaks German through the REAL messages — the words around the article in the article’s language', () => {
    const page = populateArticle('de', DEMO, realWords.de());
    const gallery = page.blocks.find((block) => block.kind === 'gallery');

    expect(page.header.byline).toBe(`von ${NICU.words.de.name}`);
    // Every German note opens on German's lead-in, „Hinweis: ".
    const notes = page.blocks.flatMap((block) =>
      block.kind === 'photo' && block.note !== undefined
        ? [block.note]
        : block.kind === 'beforeAfter' && block.notes !== undefined
          ? [block.notes.before, block.notes.after]
          : [],
    );
    expect(notes).not.toHaveLength(0);
    for (const note of notes) expect(note).toMatch(/^Hinweis: \S/);
    expect(page.cover.readingTime).toBe('4 Min. Lesezeit');
    expect(page.cover.tagsLabel).toBe(de.blog.tags);
    expect(page.share.label).toBe(de.blog.article.share.label);
    expect(gallery?.kind === 'gallery' ? gallery.slideLabels : []).toEqual([
      'Foto 1 von 8',
      'Foto 2 von 8',
      'Foto 3 von 8',
      'Foto 4 von 8',
      'Foto 5 von 8',
      'Foto 6 von 8',
      'Foto 7 von 8',
      'Foto 8 von 8',
    ]);
    expect(gallery?.kind === 'gallery' ? gallery.labels : {}).toEqual({
      region: 'Fotogalerie 1 von 2',
      role: de.common.carousel.role,
      slideRole: de.common.carousel.slideRole,
      previous: de.blog.article.gallery.previous,
      next: de.blog.article.gallery.next,
      picker: de.blog.article.gallery.picker,
    });
  });

  it('populates EVERY article the site ships in EVERY language — the pages `generateStaticParams` and the layout multiply', () => {
    expect(articles.length).toBeGreaterThan(0);
    for (const entry of articles) {
      for (const locale of locales) {
        const article = entry.languages[locale];
        const page = populateArticle(locale, entry.slug, WORDS);
        const where = `${entry.slug} (${locale})`;
        const items = page.blocks.flatMap((block) =>
          block.kind === 'prose' ? block.items : [],
        );
        expect(items, where).toHaveLength(
          article.blocks.filter(
            (block) => block.type === 'paragraph' || block.type === 'heading',
          ).length,
        );
        // One name per card in every gallery: CardCarousel refuses any other
        // count with a RangeError, at build.
        for (const block of page.blocks) {
          if (block.kind === 'gallery') {
            expect(block.slideLabels, where).toHaveLength(block.cards.length);
          }
        }
        expect(page.conclusion.text, where).toBe(article.conclusion);
      }
    }
  });
});

describe('populateArticle — the walk, against fixtures', () => {
  it('groups every rule: a run opening on a subheading, two galleries kept two and counted each on its own, a run of one, a photo and a pair standing alone, a run closing the article', () => {
    expect(populateFixture(MIXED).blocks).toEqual([
      {
        kind: 'prose',
        items: [
          { kind: 'heading', text: 'Un subtitlu la început (ro)' },
          { kind: 'paragraph', text: 'Primul paragraf (ro).' },
          { kind: 'paragraph', text: 'Al doilea paragraf (ro).' },
        ],
      },
      {
        kind: 'gallery',
        cards: loopGallery('ro').cards,
        mode: 'loop',
        labels: labelsNamed('Galerie foto 1 din 2'),
        slideLabels: ['Fotografia 1 din 2', 'Fotografia 2 din 2'],
      },
      {
        kind: 'gallery',
        cards: boundedGallery('ro').cards,
        mode: 'bounded',
        labels: labelsNamed('Galerie foto 2 din 2'),
        slideLabels: [
          'Fotografia 1 din 3',
          'Fotografia 2 din 3',
          'Fotografia 3 din 3',
        ],
      },
      {
        kind: 'prose',
        items: [{ kind: 'heading', text: 'Un subtitlu singur (ro)' }],
      },
      {
        kind: 'photo',
        image: photo('ro').image,
        heading: 'O fotografie (ro)',
        note: 'Notă: fotografie de probă (ro).',
      },
      {
        kind: 'beforeAfter',
        images: beforeAfter('ro').images,
        headings: { before: 'Înainte (ro)', after: 'După (ro)' },
        notes: {
          before: 'Notă: prima notă (ro).',
          after: 'Notă: a doua notă (ro).',
        },
      },
      { kind: 'photo', image: barePhoto('ro').image },
      { kind: 'beforeAfter', images: barePair('ro').images },
      {
        kind: 'prose',
        items: [{ kind: 'paragraph', text: 'Ultimul paragraf (ro).' }],
      },
    ]);
  });

  it('gives a photo or a pair NO key for a part it lacks — never a key holding `undefined` — and finishes each note with the page’s lead-in', () => {
    // `toStrictEqual`, not `toEqual`: the latter ignores a key that holds
    // `undefined`, and the page's block keeps the article file's own rule —
    // a part the photo or the pair lacks is an ABSENT key, never a key
    // holding `undefined` (lib/blog-article's THE PHOTO and THE PAIR IS ONE
    // SHAPE; populate.ts' `present`). The rule is the DATA's: sections/
    // PostPage's renderBlock names every part in its hand-off objects, so
    // the section it renders is handed a key holding `undefined` all the
    // same, and reads it as absent.
    const { blocks } = populateFixture(MIXED);
    const photos = blocks.filter((block) => block.kind === 'photo');
    const pairs = blocks.filter((block) => block.kind === 'beforeAfter');

    expect(photos).toStrictEqual([
      {
        kind: 'photo',
        image: photo('ro').image,
        heading: 'O fotografie (ro)',
        note: 'Notă: fotografie de probă (ro).',
      },
      { kind: 'photo', image: barePhoto('ro').image },
    ]);
    expect(pairs).toStrictEqual([
      {
        kind: 'beforeAfter',
        images: beforeAfter('ro').images,
        headings: { before: 'Înainte (ro)', after: 'După (ro)' },
        notes: {
          before: 'Notă: prima notă (ro).',
          after: 'Notă: a doua notă (ro).',
        },
      },
      { kind: 'beforeAfter', images: barePair('ro').images },
    ]);
  });

  it('lays every picture block with EXACTLY its file block’s parts — none dropped and none added on the way, the full fixtures carrying every part there is', () => {
    // THE MAPPING, READ BY ITS KEYS — the runtime half of populate.ts' THE
    // MAPPERS (2026-10-21, round 3 of the Opus reviews). The full fixtures
    // are `Required<…>` of their blocks (THE FULL FIXTURES, above), so every
    // part lib/blog-article's block can hold is in them, and the page's block
    // laid for each must hold exactly the same keys — the file's `type` the
    // page's `kind` — and, for a gallery, the carousel's words beside them
    // (ADDED_BY_THE_ROUTE). A mapper that dropped a part, or let a key of
    // its own ride along (the file's `type` through a spread), fails here
    // naming the block. The bare fixtures ride along: a part they lack is
    // absent from their page's block too.
    const held = mixedIn('ro').blocks.filter(
      (block) => block.type !== 'paragraph' && block.type !== 'heading',
    );
    const laid = populateFixture(MIXED).blocks.filter(
      (block) => block.kind !== 'prose',
    );

    expect(laid.map((block) => block.kind)).toEqual(
      held.map((block) => block.type),
    );
    for (const [at, block] of laid.entries()) {
      const source = held[at];
      if (source === undefined) {
        throw new Error(`picture block ${at + 1}: no file block beside it`);
      }
      expect(Object.keys(block).toSorted(), `${block.kind} ${at + 1}`).toEqual(
        [
          ...Object.keys(source).map((key) => (key === 'type' ? 'kind' : key)),
          ...ADDED_BY_THE_ROUTE[block.kind],
        ].toSorted(),
      );
    }
  });

  it('asks the lead-in once per note — the photo’s one and both of a pair’s — and never for a part with no note', () => {
    const note = vi.fn(WORDS.note);
    populateFixture(MIXED, { ...WORDS, note });

    expect(note.mock.calls).toEqual([
      ['fotografie de probă (ro).'],
      ['prima notă (ro).'],
      ['a doua notă (ro).'],
    ]);
  });

  it('makes one run of a one-paragraph article', () => {
    const lone: ArticleEntry = {
      slug: FIXTURE_POST.slug,
      languages: inEach((locale) => ({
        slug: FIXTURE_POST.slug,
        blocks: [
          { type: 'paragraph', text: `Un singur paragraf (${locale}).` },
        ],
        conclusion: `Atât (${locale}).`,
      })),
    };

    expect(populateFixture(lone).blocks).toEqual([
      {
        kind: 'prose',
        items: [{ kind: 'paragraph', text: 'Un singur paragraf (ro).' }],
      },
    ]);
  });

  it.each(locales)(
    '%s: reads the post’s words AND the article’s body in that language — never another language’s',
    (locale) => {
      const page = populateFixture(MIXED, WORDS, locale);

      expect(page.header.title).toBe(FIXTURE_WORDS[locale].title);
      expect(page.cover.tags).toEqual(FIXTURE_WORDS[locale].tags);
      expect(page.cover.image).toEqual({
        src: FIXTURE_POST.image.src,
        alt: FIXTURE_WORDS[locale].alt,
      });
      const first = page.blocks[0];
      expect(first?.kind === 'prose' ? first.items[0]?.text : '').toBe(
        `Un subtitlu la început (${locale})`,
      );
      expect(page.blocks[1]).toMatchObject({
        cards: loopGallery(locale).cards,
      });
      expect(page.conclusion.text).toBe(
        `Încheierea articolului de probă (${locale}).`,
      );
      expect(page.share.copy.url).toBe(articleUrl(locale, FIXTURE_POST.slug));
      expect(page.share.facebook.href).toBe(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl(locale, FIXTURE_POST.slug))}`,
      );
    },
  );

  it('announces the POST’s minutes — never the count of the article’s own words', () => {
    // The fixture article is a few dozen words, one minute by lib/blog-
    // article's count; its post says seven. The page prints the post's.
    const { words, readingTime } = spiedWords();
    const page = populateFixture(MIXED, words);

    expect(readingMinutes(MIXED.languages.ro)).toBe(1);
    expect(readingTime).toHaveBeenCalledTimes(1);
    expect(readingTime).toHaveBeenCalledWith(7);
    expect(page.cover.readingTime).toBe('7 min de citit');
  });

  it('signs with WHICHEVER doctor the post names — here Dr. Toma Lucian, in the page’s language', () => {
    for (const locale of locales) {
      const { words, byline } = spiedWords();
      const page = populateFixture(MIXED, words, locale);

      expect(byline, locale).toHaveBeenCalledWith(TOMA.words[locale].name);
      expect(page.conclusion.doctor, locale).toEqual({
        name: TOMA.words[locale].name,
        position: TOMA.words[locale].position,
        photo: TOMA.cutout,
      });
    }
  });

  it('refuses a slug no post has — a RangeError naming it', () => {
    expect(() => populateArticle('ro', 'nu-exista', WORDS)).toThrow(RangeError);
    expect(() => populateArticle('de', 'nu-exista', WORDS)).toThrow(
      /„nu-exista": no post has this slug/,
    );
  });

  it('refuses a post with no article — a RangeError naming it', () => {
    const call = () =>
      populateArticle('it', FIXTURE_POST.slug, WORDS, [FIXTURE_POST], []);

    expect(call).toThrow(RangeError);
    expect(call).toThrow(/„articol-de-proba": its post has no article/);
    // …and so for a real post the owner has not written yet.
    const unwritten = posts.find(
      (post) => !articles.some((article) => article.slug === post.slug),
    );
    expect(unwritten).toBeDefined();
    if (unwritten !== undefined) {
      expect(() => populateArticle('ro', unwritten.slug, WORDS)).toThrow(
        RangeError,
      );
    }
  });

  it('lets lib/blog-article’s refusal of an author who is no doctor surface unchanged', () => {
    const nobody: BlogPostEntry = { ...FIXTURE_POST, author: 'Dr. Nimeni' };

    expect(() =>
      populateArticle('ro', nobody.slug, WORDS, [nobody], [MIXED]),
    ).toThrow(TypeError);
    expect(() =>
      populateArticle('en', nobody.slug, WORDS, [nobody], [MIXED]),
    ).toThrow(
      /^post „articol-de-proba": "author" "Dr\. Nimeni" is no doctor of lib\/team/,
    );
  });
});
