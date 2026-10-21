import type {
  PostPageBlock,
  PostPageProps,
} from '@/components/sections/PostPage/PostPage';
import type { PostProseItem } from '@/components/sections/PostProse/PostProse';
import type { ShareLink } from '@/components/sections/ShareLinks/ShareLinks';
import { localeHref } from '@/i18n/href';
import { isLocale, locales, type Locale } from '@/i18n/locales';
import { withBasePath } from '@/lib/base-path/base-path';
import {
  articleAuthor,
  articles as SITE_ARTICLES,
  type Article,
  type ArticleBlock,
  type ArticleEntry,
} from '@/lib/blog-article/blog-article';
import {
  articlePath,
  posts as SITE_POSTS,
  postIn,
  type BlogPost,
  type BlogPostEntry,
} from '@/lib/blog/blog';
import type { ImagePath } from '@/lib/image-path/image-path';
import { shareHrefs } from '@/lib/share/share';
import { absoluteUrl } from '@/lib/site-origin/site-origin';

// app/[locale]/blog/[slug]/populate.ts — THE ONE POPULATOR of a blog article's
// page (/{locale}/blog/<slug>/, CLAUDE.md §15.39 round 4 — in every language
// since 2026-10-15): the page's language, lib/blog's post, lib/blog-article's
// body, lib/share's three addresses, lib/team's doctor and the page's
// finished words in, sections/PostPage's props out. PURE — no next-intl, no
// React, the list's ../populate.ts precedent and the team folder's: the route
// page calls it with the language its [locale] segment names and the words
// `getTranslations` gives it in that language (./words.ts), and the
// Pages/BlogArticle twin calls it with the language `useLocale` names and the
// words `useTranslations` gives it, so the twin can never walk an article its
// own way. The band and every section in it are DUMB (sections/PostPage's
// header): somebody has to pick the language, the words, build the addresses,
// group the article's blocks and find the doctor who signs it — this file.
//
// ── ONE LANGUAGE, READ ONCE (the list's ../words.ts, same reason). The page
// hands `populateArticle` ONE language — its [locale] segment, narrowed by
// `articleLocale` below — and the words it built in that same language, so
// the post's words (lib/blog's `postIn`), the article's body (lib/blog-
// article's `languages[locale]`), the doctor's name and specialty, the page's
// address and the words around them can never be in two languages. An
// article is written in all five (lib/blog-article's EVERY LANGUAGE, IN ONE
// FILE), so every language has its page.
//
// ── THE GROUPING. An article file is a flat list of blocks (lib/blog-
// article's THE FILE'S SHAPE); the page reads it as RUNS. Consecutive
// paragraphs and subheadings become ONE `prose` block — sections/PostProse
// owns the spacing inside a run (more room above a subheading than between
// two paragraphs), PostPage the gap between runs — and each gallery, each
// blog photo and each before/after pair stand alone between them, in the
// article's order. Nothing is dropped, nothing reordered, two galleries in a
// row stay two. The demo, „Cum îți alegi periuța de dinți", reads the same
// runs in every language (./populate.test.ts pins them).
//
// ── THE NOTES (the owner, 2026-10-15: "each photo has to have a max 2 row
// grays text … starting with "Note: "" — the lead-in in the page's language,
// „Notă:", "Note:", „Hinweis:", « Note : », «Nota:»). A note's TEXT is the
// article's (lib/blog-article: under a blog photo, or under both halves of a
// before/after); its lead-in is the PAGE's word, the blog's one sentence
// `blog.article.note` („Notă: {note}"), so the owner never types it and no
// note can forget it. This file joins the two — `words.note` — and hands the
// sections the FINISHED sentence (§8.1: sections/PostPhoto and sections/
// BeforeAfter are dumb and never translate). A pair's notes leave as a pair:
// lib/blog-article's THE PAIR IS ONE SHAPE refuses a note under one half
// alone, so both halves are finished or neither is. „At most two lines" is a
// rule on the data, measured where the page draws a note narrowest
// (./notes.test.tsx).
//
// ── THE GALLERY is the owner's carousel (2026-10-14: "for: Galeria foto vine
// în curând — place that caroussell"), sections/PostGallery on sections/
// CardCarousel. A gallery block becomes PostGallery's props: its cards as the
// file holds them (THE CARD IS PROVISIONAL — lib/blog-article's header), its
// `mode` — lib/blog-article spells the union again because lib never imports
// a section (§4), and ./populate.test.ts holds the two spellings EQUAL, this
// route being the one tier that imports both; THREE cards in its window, an
// article's only window since 2026-10-17 (the five-card one is the Home
// page's) — and every word the carousel says: the region's name, its two
// arrows' and its progress dots' group name („Alege fotografia") from the
// blog's own `blog.article.gallery`, the two roledescriptions from the
// site's one carousel vocabulary, `common.carousel` („carusel",
// „diapozitiv" — the reviews deck's and the Hero's), and one name per card,
// „Fotografia 1 din 8", counted within ITS gallery. THE REGION'S NAME IS
// NUMBERED when the page holds more than one gallery — „Galerie foto 2 din 2"
// (`regionNumbered`), the plain „Galerie foto" on a page with one — because
// each gallery is a region landmark and a page's landmarks must not share a
// name (axe's landmark-unique, which every story's check runs): the owner's
// demo article holds two since 2026-10-17, the loop and then the bounded list
// (four from 2026-10-16 — "create instance on 3 and instance of 5 cards … all
// must be instantiated" — until the five-card window moved to Home).
//
// ── THE READING TIME is the POST's `readingMinutes` — lib/blog's fact, the
// very number the post's card prints on the list — through the blog's one
// reading-time sentence, `blog.readingTime`, which the list's cards speak too
// (../populate.ts): ONE source, so a card never promises a time ITS OWN page
// does not keep — while the stand-in is in place, a card whose post has no
// article yet opens the stand-in and prints its own post's placeholder minutes
// (BACKLOG.md entry 7). lib/blog-article's `readingMinutes` counts an article's words;
// it is the MEASURE that field is held to (tests/unit/blog-article-data.
// test.ts), never a second number on the page.
//
// ── THE ADDRESS (`articleUrl`) is the page's PUBLIC address — what the three
// share links hand on and what the copy control copies: the page's path
// through i18n/href's localeHref under the page's own language (the locale
// prefix, the trailing slash, and the interim host's base path when one is
// set — on such a host the base path IS part of the address), resolved
// against lib/site-origin's origin: lib/clinic's `url`, unless the build
// names another (SITE_ORIGIN — a preview on the owner's network does; the
// interim Pages host could, but release.yml does not set it, BACKLOG.md
// entry 7). So a German reader shares the German page. That url is a
// PLACEHOLDER domain until the owner sets the production one (BACKLOG.md
// entry 7, lib/clinic's TODO(owner)), so until then every article shares
// that domain unless its build named another; the day it changes, every
// share link follows with no edit here.
//
// ── THE SHARE TEXT (the owner, 2026-10-17, verbatim: "also on share add i18n
// text for check out this article from bla bla … for email obviusly add a
// subject, all internationalised starting from current page language, this
// is a mandatory feature"). Two sentences of the blog's, in the PAGE'S
// language, each naming the clinic (`common.siteName`) and the post's title:
// the MESSAGE that opens the WhatsApp text and the e-mail's body
// (`blog.article.share.message` — „Citește acest articol de la {site}:
// {title}") and the e-mail's SUBJECT (`blog.article.share.subject` — „Un
// articol de la {site}: {title}"). `articleWordsFrom` finishes both into
// functions of the title; lib/share places them around the address.
//
// ── THE PREVIEW (`articlePreview`) — the same owner's message: "if possible
// on share to also preload the "hero" of the article and to display first
// large picture and also title of it". A messenger or a social network that
// is handed the page's address draws its card from the page's link-preview
// (Open Graph) tags — its title, a description, its picture — so the route's
// metadata (./words.ts' `articleMetadata`) prints them, from these facts: the
// post's title and summary in the page's language, the page's address, its
// cover photograph — the article's FIRST, LARGEST picture, the post's own
// `image` (the list's card shows it too) — by its ABSOLUTE address on the
// same origin as the page, the day it was published (the entry's `date`),
// the doctor who signs it, its tags, and the page's language with the other
// four as alternates, in Open Graph's language_TERRITORY spelling.
//
// ── THE AUTHOR. lib/blog-article's `articleAuthor` finds the doctor the
// post's `author` names — ONE string for every language, spelled as lib/team
// spells the name in Romanian — and refuses at module load an article whose
// author is no doctor, so on the shipped data it never throws here; on a
// list handed in by a test it throws ITS OWN message, unchanged. The page
// then names that doctor as lib/team spells her in the PAGE's language, in
// both places she appears: the by-line under the title („de Dr. Nicu Elena
// Alina") and the conclusion's signature — her name and specialty and her
// cutout, the photograph the doctor cards show (the owner: "the circle with
// photo of doctor like in phone mode at the docotr cards in main page and
// next to it the dr name as headinf with eyebrow specailization of the
// doctor"). The two can never disagree on one page: lib/team's French writes
// the honorific with no point („Dr Nicu Elena Alina"), so a by-line printed
// from the post's own string would read „par Dr. …" over a signature „Dr …".
// In the other four languages lib/team's name IS the post's string.
//
// ── THE LISTS ARE ARGUMENTS (the team populator's THE LIST IS AN ARGUMENT):
// `list` (the posts — lib/blog's ENTRIES, every language's words beside the
// facts) and `store` (the articles, every language's body each) default to
// the shipped ones, and the lookups search what they were HANDED, never the
// shipped array (lib/blog-article's `findArticle`, which searched it, had no
// other caller and left on 2026-10-20). That is the test seam:
// ./populate.test.ts hands the walk fixture articles with shapes the shipped
// one need not hold.
//
// ── THE REFUSALS, named. A slug with no post, or a post with no article, is
// a RangeError naming the slug: the route's `generateStaticParams` builds a
// page for every article and nothing else, and `dynamicParams = false`
// refuses any other slug before the page renders (./page.tsx), so neither is
// reachable on the built site — they exist so a story or a test that invents
// a slug fails by name instead of rendering half a page. A language the site
// does not route is an Error naming it (`articleLocale`), unreachable on the
// built site too: the [locale] layout generates the five and no other.

/** One share link's two words: the visible one and the accessible name. */
export type ShareWords = Readonly<{ label: string; name: string }>;

/**
 * Every word of an article page that is not the article's — finished, except
 * the three sentences that take an argument, which are ICU functions here.
 */
export type ArticleWords = Readonly<{
  /** „de {author}" — the by-line under the title. */
  byline: (author: string) => string;
  /** „{minutes} min de citit" — the reading time on the cover's row, the
   *  list's cards' own sentence (`blog.readingTime`). */
  readingTime: (minutes: number) => string;
  /** „Notă: {note}" — the lead-in of every note under a picture, a blog
   *  photo's and each half of a before/after's (the header's THE NOTES). */
  note: (note: string) => string;
  /** „Categorii" — the name of the cover's tag list. */
  tags: string;
  /** A gallery's own words: the region's name — „Galerie foto" on a page
   *  with one gallery, „Galerie foto {index} din {total}" on a page with more
   *  (the header's THE GALLERY) — its two buttons', and each card's name
   *  („Fotografia {index} din {total}"). */
  gallery: Readonly<{
    region: (index: number, total: number) => string;
    previous: string;
    next: string;
    /** The progress dots' group name — „Alege fotografia". */
    picker: string;
    slide: (index: number, total: number) => string;
  }>;
  /** The site's carousel roledescriptions — „carusel" and „diapozitiv". */
  carousel: Readonly<{ role: string; slideRole: string }>;
  /** The four share controls' words and their list's name — and what a share
   *  says around the address (the header's THE SHARE TEXT): the message that
   *  opens the WhatsApp text and the e-mail's body, and the e-mail's subject,
   *  each a function of the post's title. */
  share: Readonly<{
    label: string;
    facebook: ShareWords;
    whatsapp: ShareWords;
    email: ShareWords;
    copy: Readonly<{ label: string; copied: string; failed: string }>;
    message: (title: string) => string;
    subject: (title: string) => string;
  }>;
}>;

/** The `blog` keys an article page reads — the one place they are spelled. */
export type ArticleKey =
  | 'article.byline'
  | 'article.note'
  | 'readingTime'
  | 'article.gallery.region'
  | 'article.gallery.regionNumbered'
  | 'article.gallery.previous'
  | 'article.gallery.next'
  | 'article.gallery.picker'
  | 'article.gallery.slide'
  | 'article.share.label'
  | 'article.share.facebook'
  | 'article.share.facebookName'
  | 'article.share.whatsapp'
  | 'article.share.whatsappName'
  | 'article.share.email'
  | 'article.share.emailName'
  | 'article.share.copy'
  | 'article.share.copied'
  | 'article.share.copyFailed'
  | 'article.share.message'
  | 'article.share.subject'
  | 'tags';

/**
 * A translator for the `blog` namespace — `getTranslations`' and
 * `useTranslations`' both fit, and so does one built over a message file's
 * TYPED messages, which then refuses at compile time a key that file lacks
 * (./populate.test.ts builds them). ONE call shape, not the list's
 * per-key overloads: an overload per sentence was tried — no by-line without
 * its author — and TypeScript cannot relate next-intl's generic translator
 * to an overload set once its messages are typed, so it would have failed
 * the day the project registers them. Which argument each sentence takes is
 * pinned against the real messages instead (./populate.test.ts).
 */
export type ArticleTranslate = (
  key: ArticleKey,
  values?:
    | Readonly<{ author: string }>
    | Readonly<{ note: string }>
    | Readonly<{ minutes: number }>
    | Readonly<{ index: number; total: number }>
    | Readonly<{ site: string; title: string }>,
) => string;

/** A translator for the `common` namespace, narrowed to the three keys read
 *  here — the carousel's roledescriptions and the site's name the share text
 *  speaks (the list's `CommonTranslate` shape, other keys). */
export type CommonTranslate = (
  key: 'carousel.role' | 'carousel.slideRole' | 'siteName',
) => string;

/**
 * The page's words from two translators — the ONE mapping of keys to words
 * (the list's `blogWordsFrom`, same reason and same two namespaces). The
 * route page calls it with `getTranslations`' translators in the page's
 * language (./words.ts), the Pages/BlogArticle twin with `useTranslations`',
 * so a swapped word („Link copiat" on the idle button) turns the twin's plays
 * red instead of shipping past them.
 */
export function articleWordsFrom(
  t: ArticleTranslate,
  common: CommonTranslate,
): ArticleWords {
  const site = common('siteName');
  return {
    byline: (author) => t('article.byline', { author }),
    note: (note) => t('article.note', { note }),
    readingTime: (minutes) => t('readingTime', { minutes }),
    tags: t('tags'),
    gallery: {
      region: (index, total) =>
        total === 1
          ? t('article.gallery.region')
          : t('article.gallery.regionNumbered', { index, total }),
      previous: t('article.gallery.previous'),
      next: t('article.gallery.next'),
      picker: t('article.gallery.picker'),
      slide: (index, total) => t('article.gallery.slide', { index, total }),
    },
    carousel: {
      role: common('carousel.role'),
      slideRole: common('carousel.slideRole'),
    },
    share: {
      label: t('article.share.label'),
      facebook: {
        label: t('article.share.facebook'),
        name: t('article.share.facebookName'),
      },
      whatsapp: {
        label: t('article.share.whatsapp'),
        name: t('article.share.whatsappName'),
      },
      email: {
        label: t('article.share.email'),
        name: t('article.share.emailName'),
      },
      copy: {
        label: t('article.share.copy'),
        copied: t('article.share.copied'),
        failed: t('article.share.copyFailed'),
      },
      message: (title) => t('article.share.message', { site, title }),
      subject: (title) => t('article.share.subject', { site, title }),
    },
  };
}

/**
 * The page's language: the route's [locale] segment (or a story's), narrowed
 * to the five the site routes — the one narrowing the route page, its
 * metadata and the twin share (the header's ONE LANGUAGE, READ ONCE).
 * `isLocale` is the narrowing, not a guard against reality: the segment
 * arrives as a plain `string`, and lib/blog's and lib/blog-article's words are
 * `Record<Locale, …>`s.
 * @throws Error naming the value when it is no locale of the site's.
 */
export function articleLocale(locale: string): Locale {
  if (!isLocale(locale)) {
    throw new Error(`blog article: unknown locale "${locale}"`);
  }
  return locale;
}

/**
 * The article page's public address in `locale` (the header's THE ADDRESS):
 * `https://<the site's origin>/<locale>/blog/<slug>/`, as the URL parser
 * writes it back — the one string the share links carry, the copy control
 * copies and the link-preview tags name.
 */
export function articleUrl(locale: Locale, slug: string): string {
  return absoluteUrl(localeHref(locale, articlePath(slug)));
}

/** Open Graph's language_TERRITORY spelling of each page language — English
 *  British, the site's spelling (and its switcher's flag, §8.5). */
export const OG_LOCALES: Readonly<Record<Locale, string>> = {
  ro: 'ro_RO',
  en: 'en_GB',
  de: 'de_DE',
  fr: 'fr_FR',
  it: 'it_IT',
};

/** What an article page's link-preview card says, in one language (the
 *  header's THE PREVIEW) — the facts ./words.ts' `articleMetadata` prints. */
export type ArticlePreview = Readonly<{
  /** The post's title, alone — the card names the site separately. */
  title: string;
  /** The post's summary, the list card's own sentence. */
  description: string;
  /** The page's absolute address (`articleUrl`). */
  url: string;
  /** The cover photograph: its file (for its size, read at build), its
   *  absolute address, and its alt ("" for a decorative stand-in). */
  image: Readonly<{ src: ImagePath; url: string; alt: string }>;
  /** The day it was published, YYYY-MM-DD (the entry's `date`). */
  publishedTime: string;
  /** The doctor who signs it, as lib/team names them in this language. */
  author: string;
  tags: readonly string[];
  /** This page's language, and the other four, as Open Graph spells them. */
  locale: string;
  alternateLocales: readonly string[];
}>;

/**
 * The link-preview facts of the article page at `slug` in `locale` (the
 * header's THE PREVIEW) — from the post's ENTRY, found once: the date is a
 * fact of the entry's, and the post in `locale` is derived from it.
 * @throws RangeError naming the slug when no post has it (`postEntry`).
 */
export function articlePreview(
  locale: Locale,
  slug: string,
  list: readonly BlogPostEntry[] = SITE_POSTS,
): ArticlePreview {
  const entry = postEntry(slug, list);
  const post = postIn(locale, entry);
  return {
    title: post.title,
    description: post.summary,
    url: articleUrl(locale, slug),
    image: {
      src: post.image.src,
      url: absoluteUrl(withBasePath(post.image.src)),
      alt: post.image.alt,
    },
    publishedTime: entry.date,
    author: articleAuthor(post).words[locale].name,
    tags: post.tags,
    locale: OG_LOCALES[locale],
    alternateLocales: locales
      .filter((other) => other !== locale)
      .map((other) => OG_LOCALES[other]),
  };
}

/**
 * The post an article page is for — its title, cover, author, tags and
 * reading time, in the page's language (lib/blog's `postIn`, the list's own
 * mapping of an entry to its post).
 * @throws RangeError naming the slug when no post has it (`postEntry`).
 */
export function articlePost(
  locale: Locale,
  slug: string,
  list: readonly BlogPostEntry[] = SITE_POSTS,
): BlogPost {
  return postIn(locale, postEntry(slug, list));
}

/**
 * The ENTRY of the post at `slug` in `list` — its facts once, its words in
 * every language — and THE one refusal of a slug no post has, which
 * `articlePost` and `articlePreview` share (the header's THE REFUSALS).
 * @throws RangeError naming the slug when no post has it.
 */
function postEntry(
  slug: string,
  list: readonly BlogPostEntry[],
): BlogPostEntry {
  const entry = list.find((candidate) => candidate.slug === slug);
  if (entry === undefined) {
    throw new RangeError(
      `blog article „${slug}": no post has this slug — an article page is built for a post of src/content/blog/posts.json`,
    );
  }
  return entry;
}

/** One share link: its address and its two words. */
const shareLink = (href: string, words: ShareWords): ShareLink => ({
  href,
  label: words.label,
  name: words.name,
});

/** A gallery block of an article file (lib/blog-article's THE GALLERY). */
type GalleryBlock = Extract<ArticleBlock, { type: 'gallery' }>;

// ── THE MAPPERS: EVERY PART HANDED ON, AN ABSENT ONE ABSENT (2026-10-21,
// round 3 of the Opus reviews — react and typescript, both MEASURED). A
// mapper that named its parts by hand, in the returned block, dropped a NEW
// part in silence: a `credit` added to lib/blog-article's photo and to
// PostPhotoContent, with every error tsc then raised followed — renderBlock's
// hand-off, the key pins — left tsc clean and the route suite green while
// photoBlock never handed the credit on; and its conditional spreads were
// checked for no excess key either, so a part spelt wrong passed. So each
// mapper builds its block's parts in ONE object that `satisfies`
// `FileParts` of the file's block — every key of it but its `type`, each
// REQUIRED there — and hands that object on WHOLE (`present`): a part added
// to the file's block does not compile here until its mapper names it, and a
// key written in the object that is no part (a misspelt one) does not compile
// either. A key a SPREAD brought into the parts object would not be checked —
// none is spread there — and ./populate.test.ts reads every laid block's keys
// against a fixture that carries every part (typed `Required<…>`), the
// runtime half of the guard, which a spread-borne key fails.

/** The PARTS of an article file's block — every key it carries but its
 *  `type`, in every shape the block takes (a conditional type over a bare
 *  parameter distributes, where `keyof` of a union keeps only the keys every
 *  shape shares) — each REQUIRED in the Record its mapper's parts object
 *  `satisfies` (THE MAPPERS). */
type FileParts<Block extends ArticleBlock> = Record<
  Exclude<Block extends unknown ? keyof Block : never, 'type'>,
  unknown
>;

/** `T` as `present` returns it: a part whose type cannot be `undefined`
 *  stays REQUIRED, and a part whose type can is an OPTIONAL key that holds a
 *  value whenever it is there. */
type Present<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<
    T[K],
    undefined
  >;
};

/**
 * A mapper's parts object with every key that holds `undefined` LEFT OUT, so
 * an absent part of the file's block is an ABSENT key on the page's block —
 * lib/blog-article's own rule for a photo's and a pair's optional parts —
 * never a key holding `undefined`. Every other key passes through with its
 * value as it is — the file's own objects (a picture, a pair of headings),
 * never copies. The one cast is the type of what `Object.fromEntries`
 * builds, which TypeScript cannot follow through a filter: exactly `T`'s
 * keys whose values are not `undefined`.
 */
function present<T extends object>(parts: T): Present<T> {
  return Object.fromEntries(
    Object.entries(parts).filter(([, value]) => value !== undefined),
  ) as Present<T>;
}

/** Where a gallery stands among its article's galleries: the nth (from 1)
 *  of how many. */
type GalleryPlace = Readonly<{ index: number; total: number }>;

/**
 * One gallery as sections/PostPage's block (the header's THE GALLERY): the
 * cards and the mode as the file holds them — its parts, handed on WHOLE
 * (THE MAPPERS) — beside the carousel's six words, the region's name
 * numbered by its `place` when the page holds more than one gallery, and one
 * name per card in order, „Fotografia 1 din 8", counted within this gallery.
 */
function galleryBlock(
  block: GalleryBlock,
  words: ArticleWords,
  place: GalleryPlace,
): PostPageBlock {
  const total = block.cards.length;
  const parts = {
    cards: block.cards,
    mode: block.mode,
  } satisfies FileParts<GalleryBlock>;
  return {
    kind: 'gallery',
    ...present(parts),
    labels: {
      region: words.gallery.region(place.index, place.total),
      role: words.carousel.role,
      slideRole: words.carousel.slideRole,
      previous: words.gallery.previous,
      next: words.gallery.next,
      picker: words.gallery.picker,
    },
    slideLabels: block.cards.map((_, index) =>
      words.gallery.slide(index + 1, total),
    ),
  };
}

/** A blog photo of an article file (lib/blog-article's THE FILE'S SHAPE). */
type PhotoBlock = Extract<ArticleBlock, { type: 'photo' }>;

/** A before/after pair of an article file — its parts grouped by kind. */
type PairBlock = Extract<ArticleBlock, { type: 'beforeAfter' }>;

/**
 * One blog photo as sections/PostPhoto's content (the header's THE NOTES):
 * the picture as the file holds it, its heading when it has one, and its
 * note when it has one, finished with the page's lead-in („Notă: …") — its
 * parts, handed on WHOLE, an absent one an absent key (THE MAPPERS).
 * PostPhotoContent is held EQUAL to the file's photo (./populate.test.ts), so
 * a part the page's photo gains must be the file's too — and then it does not
 * compile here until it is named.
 */
function photoBlock(block: PhotoBlock, words: ArticleWords): PostPageBlock {
  const parts = {
    image: block.image,
    heading: block.heading,
    note: block.note === undefined ? undefined : words.note(block.note),
  } satisfies FileParts<PhotoBlock>;
  return { kind: 'photo', ...present(parts) };
}

/**
 * One before/after as sections/BeforeAfter's content (the header's THE
 * NOTES): the two pictures, the two headings when the pair has them, and the
 * two notes when it has them, each finished with the page's lead-in — its
 * parts, handed on WHOLE, an absent one an absent key (THE MAPPERS). A pair
 * is ONE SHAPE in the file and stays one here — headings for both halves or
 * neither, notes for both or neither (lib/blog-article's THE PAIR IS ONE
 * SHAPE) — so there is no half to drop or to invent.
 */
function pairBlock(block: PairBlock, words: ArticleWords): PostPageBlock {
  const { notes } = block;
  const parts = {
    images: block.images,
    headings: block.headings,
    notes:
      notes === undefined
        ? undefined
        : {
            before: words.note(notes.before),
            after: words.note(notes.after),
          },
  } satisfies FileParts<PairBlock>;
  return { kind: 'beforeAfter', ...present(parts) };
}

/**
 * The article's blocks as the page's runs (the header's THE GROUPING): each
 * paragraph or subheading joins the prose run before it, or opens one; every
 * other block stands alone. Fresh arrays, every run and its items new; a
 * gallery's cards and a photo's or a pair's pictures pass through as the file
 * holds them, read-only; a note leaves finished with its lead-in. TOTAL over
 * lib/blog-article's block types, like sections/PostPage's renderBlock: the
 * `never` line after the switch stops a sixth type compiling until it is
 * placed here, and a type that escaped the types (a cast, a JSON read past
 * its parser) fails the build by name — never the engine's own TypeError
 * half-way through an article („Cannot read properties of undefined" when a
 * paragraph follows it, „runs is not iterable" when a picture block does),
 * nor, when it ends the article, a page whose blocks are `undefined`.
 */
function pageBlocks(
  article: Article,
  words: ArticleWords,
): readonly PostPageBlock[] {
  // How many galleries the page holds — their region names are numbered only
  // when it is more than one (the header's THE GALLERY).
  const galleries = article.blocks.filter(
    (block) => block.type === 'gallery',
  ).length;
  return article.blocks.reduce<readonly PostPageBlock[]>(
    (runs, block, index) => {
      switch (block.type) {
        case 'paragraph':
        case 'heading': {
          const item: PostProseItem = { kind: block.type, text: block.text };
          const last = runs.at(-1);
          return last?.kind === 'prose'
            ? [
                ...runs.slice(0, -1),
                { kind: 'prose', items: [...last.items, item] },
              ]
            : [...runs, { kind: 'prose', items: [item] }];
        }
        case 'gallery':
          return [
            ...runs,
            galleryBlock(block, words, {
              index: runs.filter((run) => run.kind === 'gallery').length + 1,
              total: galleries,
            }),
          ];
        case 'photo':
          return [...runs, photoBlock(block, words)];
        case 'beforeAfter':
          return [...runs, pairBlock(block, words)];
      }
      const unclassified: never = block;
      throw new TypeError(
        `blog article „${article.slug}": block ${index + 1} has the type ${JSON.stringify(
          (unclassified as { type?: unknown }).type,
        )}, which is none of paragraph, heading, gallery, photo and beforeAfter`,
      );
    },
    [],
  );
}

/**
 * The article page for `slug` in `locale`, ready for sections/PostPage.
 *
 * @param locale the page's language — its [locale] segment, narrowed
 *   (`articleLocale`). `words` must be in it too.
 * @param slug the route's [slug] segment — a post's slug, which IS the
 *   article file's name and the page's address.
 * @param words the page's finished words in `locale` (`articleWordsFrom`).
 * @param list the posts to look in, as lib/blog's entries. Defaults to
 *   lib/blog's own.
 * @param store the articles to look in, every language each. Defaults to
 *   lib/blog-article's own.
 * @throws RangeError naming the slug when no post has it, or its post has no
 *   article (the header's THE REFUSALS); lib/blog-article's TypeError,
 *   unchanged, when the post's author is no doctor (THE AUTHOR).
 */
export function populateArticle(
  locale: Locale,
  slug: string,
  words: ArticleWords,
  list: readonly BlogPostEntry[] = SITE_POSTS,
  store: readonly ArticleEntry[] = SITE_ARTICLES,
): PostPageProps {
  const post = articlePost(locale, slug, list);
  const entry = store.find((candidate) => candidate.slug === slug);
  if (entry === undefined) {
    throw new RangeError(
      `blog article „${slug}": its post has no article — add src/content/blog/articles/${slug}.json and register it in lib/blog-article`,
    );
  }
  const article = entry.languages[locale];
  const doctor = articleAuthor(post);
  const signed = doctor.words[locale];
  const url = articleUrl(locale, slug);
  const hrefs = shareHrefs(url, {
    subject: words.share.subject(post.title),
    message: words.share.message(post.title),
  });

  return {
    header: { title: post.title, byline: words.byline(signed.name) },
    cover: {
      readingTime: words.readingTime(post.readingMinutes),
      image: post.image,
      tags: post.tags,
      tagsLabel: words.tags,
    },
    share: {
      label: words.share.label,
      facebook: shareLink(hrefs.facebook, words.share.facebook),
      whatsapp: shareLink(hrefs.whatsapp, words.share.whatsapp),
      email: shareLink(hrefs.email, words.share.email),
      copy: {
        url,
        label: words.share.copy.label,
        copied: words.share.copy.copied,
        failed: words.share.copy.failed,
      },
    },
    blocks: pageBlocks(article, words),
    conclusion: {
      text: article.conclusion,
      doctor: {
        name: signed.name,
        position: signed.position,
        photo: doctor.cutout,
      },
    },
  };
}
