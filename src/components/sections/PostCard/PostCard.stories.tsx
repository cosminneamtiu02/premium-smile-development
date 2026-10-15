import type { ReactElement, ReactNode } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { createTranslator } from 'next-intl';
import { expect, within } from 'storybook/test';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { postsIn, type BlogPost } from '@/lib/blog/blog';
import { cx } from '@/lib/cx/cx';
import { heroSlides } from '@/lib/hero-slides/hero-slides';
import type { ImagePath } from '@/lib/image-path/image-path';
import de from '@/messages/de.json';
import it from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { PostCard, type PostCardContent } from './PostCard';
import { unitsAcrossLines } from './PostCard.fixtures';

// SIX stories, and the count is the honest one: the everyday card, a post
// with no categories, the long-word stress, the German stress, the Italian
// footer row, and the hover jump the pixel net cannot photograph. The export
// NAMES are load-bearing — each names a baseline file
// (`sections/post-card/default-…`) — so this list IS the section's
// contribution to a lane's visual manifest. `Sections/*` routes every story to
// 390 + 1536 (tests/visual/stories.spec.ts, §13); the 'stress-320' tag adds
// the accessibility width to LongWords, and 'no-visual' keeps Jump out of the
// net — it runs under reduced motion, where the card never moves, so its
// frame would only repeat Default's.
//
// ── THE POSTS ARE THE BLOG'S OWN, in the languages the blog speaks — all
// five since CLAUDE.md §15.39 round 3 (2026-10-14): Romanian with diacritics
// by default (§15.7), German as the house's stress language (§13 — the
// longest of the five, ≈ +30 % over English, §8.4) and Italian for the one
// row it once broke (Italian). READ, NEVER COPIED (the review of 2026-10-15,
// react): the everyday post and the frame's two neighbours are lib/blog's
// `postsIn` in the story's language, found by SLUG (`contentOf`) — the
// placeholder advice src/content/blog/posts.json ships, the very words the
// index shows — so a post edited in the JSON moves these frames with it
// instead of leaving a hand copy behind (the German and Italian copies had
// to be re-synced by hand once). Two posts stay the stories' own, each for a
// shape the JSON does not have — the post with NO categories and the
// long-word stress — written to the CMSR rules every page follows (no
// superlative, no promise, no result, no percentage); and GermanStress keeps
// its category list stretched, on purpose, to the three widest German tags.
// The authors are the clinic's real doctors, as on the index; the pictures
// are the clinic's own three photographs under public/images/hero/ — the
// neighbours' decorative, an empty alt as on the page, and the story card's
// DESCRIBED by lib/hero-slides' alt in its language, read by the picture's
// path (`pictureOf`).
// THE PAGE'S WORDS ARE THE REAL ONES: the tag list's name, the read-more and
// the reading time come out of src/messages/*.json through next-intl's
// createTranslator (the ReviewsCarousel stories' idiom), from the three keys
// the page reads (src/app/[locale]/blog/populate.ts's `blogWordsFrom`) and
// formatted as the page formats them — so a message that grows past the
// card's row fails a play here instead of shipping (it.json's read-more did:
// THE FOOTER ROW in PostCard.tsx).
//
// ── EVERY STORY PINS ITS LANGUAGE (the preview decorator stamps <html lang>
// from it, and the summary's `hyphens: auto` picks its dictionary there —
// §15.14; the title never splits a word, PostCard's THE TITLE NEVER SPLITS A
// WORD, which LongWords and GermanStress lay out), and the
// frame's two neighbours follow it; four pin a VIEWPORT, for the Vitest
// storybook project: NoTags and Italian at the laptop's 1536 — three cards to
// a row, in the band scale — GermanStress at the phone's 390, and LongWords
// at the 320 stress width — one column, the footer row wrapped. The visual
// net ignores the pins (it sets its own page size per project), which is why
// every play DERIVES what it expects from the boxes it measures, never from
// the pinned width.
//
// ── THE FRAME IS THE PAGE'S (sections/PostList — the lane contract's D9 and
// D12): a full-bleed <section> that paints, a ui/Container that measures the
// column, a rhythm box wearing ui/Container's THE BAND SCALE — so on a laptop
// or desktop the card is drawn in the page's design pixel — and the page's
// grid, one column, two from the column's 36rem, three from 56rem, 2rem
// apart. The story's card stands FIRST in that grid, beside two neighbours
// (sample posts of the index, in the story's language), so a desktop frame
// shows a real row of three: the row's one height, its footer rows on one
// line, the gaps the jump grows into. The grid is FRAME_GRID, spelled as
// PostList spells its GRID — KEEP-IN-SYNC, and PostCard.test.tsx holds the two
// equal: a frame that drifted from the page would measure a card the page
// never draws. Not decoration: ui/Card applies inline-size containment, so a
// card must sit in a width-giving parent, and `h-full` (args) is the page's
// placement — the card fills the <li> its row stretches.
// `layout: 'fullscreen'` keeps Storybook's own padding out of the band.
//
// ── WHAT THE PLAYS READ, AND WHAT THEY CANNOT. Every geometry number below is
// a LAYOUT value — a computed size, an offset, or a rectangle taken relative
// to the card and divided by the article's current scale (`layoutOf`) —
// because the card JUMPS under a resting pointer (a 105 % transform on
// :hover), a story cannot park the real pointer (its events are synthetic,
// and :hover answers only the real one), and a transform scales what is
// painted while leaving layout alone. The title's words are read that way
// too: PostCard.fixtures.ts's `unitsAcrossLines`, the one reading
// PostCard.titles.test.tsx lays every title out with, divides its spread by
// the title's paint scale. The real faces are loaded before anything is
// measured (Storybook's fonts are `font-display: block` — the house's
// lesson), and no play waits on a picture: in the Vitest run the
// optimizer's variants do not exist yet, every <img> 404s and falls back to
// its original file, and a play that awaited `decode()` could hang.
// THE CHIPS ARE MEASURED AGAINST THEIR CARD (PostCard's THE CHIPS FOLLOW
// THEIR CARD): every play that shows categories derives the chips' own pixel
// from the card's content box and the list's class — the floor and the
// owner's reference read off the class, its declaration found by NAME and
// never spelled whole here (Tailwind reads stories too, and
// tests/unit/design-scale.test.ts holds every scanned file to its D-LIT
// RULE) — and holds the chips, their inset and their gap to the atom's own
// lengths in that pixel, at whatever width the story is handed. The exact
// reading at the owner's window is PostCard.test.tsx's.
// THE CHIPS ARE TAGS, NOT BUTTONS (PostCard's THE TAGS): the same plays read
// each chip's COMPUTED paint — its four edges and its label the `--accent`
// token, its ground the white `--surface`. A play cannot park the real
// pointer, and need not here: a tag answers no hover, so the reading holds
// wherever the pointer rests. That nothing moves under a real hover is
// PostCard.test.tsx's to prove.

/** The languages these stories speak (the header's THE POSTS ARE THE BLOG'S
 *  OWN). */
type Language = 'ro' | 'de' | 'it';

/** The `blog` namespace in each language, through the REAL message files. */
const BLOG = {
  ro: createTranslator({ locale: 'ro', messages: ro, namespace: 'blog' }),
  de: createTranslator({ locale: 'de', messages: de, namespace: 'blog' }),
  it: createTranslator({ locale: 'it', messages: it, namespace: 'blog' }),
};

/** The page's two finished labels in a language (§8.1) — the tag list's
 *  name and the read-more — from the keys the page reads. */
const labelsOf = (
  language: Language,
): { tagsLabel: string; readMore: string } => ({
  tagsLabel: BLOG[language]('tags'),
  readMore: BLOG[language]('card.readMore'),
});

/** A reading time, finished as the page finishes it: the language's ICU
 *  sentence with the number formatted in it. */
const readingTime = (language: Language, minutes: number): string =>
  BLOG[language]('card.readingTime', { minutes });

/** A picture of the clinic's own three — its path, and the alt lib/hero-slides
 *  gives it in `language`, the opener's own words for it: a story card's
 *  DESCRIBED picture (the header's THE POSTS ARE THE BLOG'S OWN). Throws by
 *  name for a path the opener does not show. */
const pictureOf = (
  language: Language,
  src: ImagePath,
): PostCardContent['image'] => {
  const slide = heroSlides.find((candidate) => candidate.picture.src === src);
  if (!slide) {
    throw new Error(`PostCard stories: lib/hero-slides has no picture ${src}.`);
  }
  return { src, alt: slide.words[language].alt };
};

/** A post of the blog's own list in `language` — lib/blog's `postsIn`, found
 *  by its slug — or a throw that names the slug the JSON no longer has. */
const postOf = (language: Language, slug: string): BlogPost => {
  const post = postsIn(language).find((candidate) => candidate.slug === slug);
  if (!post) {
    throw new Error(
      `PostCard stories: src/content/blog/posts.json has no post „${slug}".`,
    );
  }
  return post;
};

/** A post as the page hands it to the card (src/app/[locale]/blog/
 *  populate.ts): its words in `language` and its reading time worded by the
 *  page's ICU sentence — its picture as the JSON gives it, decorative (every
 *  post's alt is empty, lib/blog's PLACEHOLDERS), unless `described`, when the
 *  opener's alt describes it (`pictureOf`). */
const contentOf = (
  language: Language,
  slug: string,
  { described = false }: { described?: boolean } = {},
): PostCardContent => {
  const post = postOf(language, slug);
  return {
    title: post.title,
    summary: post.summary,
    author: post.author,
    readingTime: readingTime(language, post.readingMinutes),
    image: described ? pictureOf(language, post.image.src) : post.image,
    tags: post.tags,
  };
};

/** The everyday post's slug — the index's own first post, „Cum îți alegi
 *  periuța de dinți": two categories. */
const EVERYDAY = 'cum-iti-alegi-periuta-de-dinti';

/** The everyday post, in Romanian, its picture described. */
const TOOTHBRUSH = contentOf('ro', EVERYDAY, { described: true });

/** A post with NO categories — the card renders no list at all. The stories'
 *  own words: every post in the JSON lists at least one category. */
const FIRST_VISIT = {
  title: 'Ce se întâmplă la prima consultație',
  summary:
    'Pe scurt, cum decurge prima vizită: discuția despre ce te supără, examinarea, radiografia, dacă e nevoie, și planul pe care îl stabilim împreună.',
  author: 'Dr. Nicu Elena Alina',
  readingTime: readingTime('ro', 5),
  image: pictureOf('ro', '/images/hero/treatment-room.jpg'),
  tags: [],
} as const satisfies PostCardContent;

/** THE STRESS: long Romanian words in the title and the summary, the longest
 *  name the clinic's authors carry, a two-digit reading time, and three long
 *  single-word categories — so the chips wrap over the picture. The stories'
 *  own words, written for the stress. */
const LONG_WORDS = {
  title:
    'Parodontopatia și întreținerea gingiilor după detartraj: recomandări pentru îngrijirea zilnică',
  summary:
    'Detartrajul ultrasonic, periajul interdentar și controalele periodice fac parte din îngrijirea parodontală. Află ce întrebări să pregătești pentru următoarea programare și cum îți organizezi igienizarea interdentară acasă, între două vizite.',
  author: 'Dr. Malea (Sabău) Oana Bianca',
  readingTime: readingTime('ro', 12),
  image: pictureOf('ro', '/images/hero/instruments.jpg'),
  tags: ['parodontologie', 'implantologie', 'prevenție'],
} as const satisfies PostCardContent;

/** THE GERMAN STRESS: the everyday post's own German words, read from the
 *  JSON by its slug, so its frames set beside Default's show the language
 *  alone — and, ON PURPOSE, its category list stretched to the three widest
 *  German tags, „Kieferorthopädie" first: the widest chip the blog ships, in
 *  any of its five languages (PostCard's THE CEILING). German writes its tags
 *  with a capital, as it writes every noun (tests/unit/blog-data.test.ts
 *  holds each language's casing). */
const GERMAN_STRESS = {
  ...contentOf('de', EVERYDAY, { described: true }),
  tags: ['Kieferorthopädie', 'Parodontologie', 'Implantologie'],
} satisfies PostCardContent;

/** The everyday post in Italian, read from the JSON by its slug — the
 *  language whose footer row once wrapped in a laptop's three-across card
 *  (PostCard's THE FOOTER ROW). */
const ITALIAN = contentOf('it', EVERYDAY, { described: true });

/** The frame's two neighbours (THE FRAME IS THE PAGE'S), by slug: two more
 *  of the index's posts, in the story's language, their pictures decorative
 *  as on the page. */
const NEIGHBOUR_SLUGS = [
  'ce-este-tartrul',
  'implantul-dentar-pas-cu-pas',
] as const;

/** The two neighbours in `language` (NEIGHBOUR_SLUGS). */
const neighboursIn = (language: Language): readonly PostCardContent[] =>
  NEIGHBOUR_SLUGS.map((slug) => contentOf(language, slug));

/** The neighbours in each of the stories' languages. */
const NEIGHBOURS = {
  ro: neighboursIn('ro'),
  de: neighboursIn('de'),
  it: neighboursIn('it'),
} satisfies Record<Language, readonly PostCardContent[]>;

/** THE FRAME'S GRID (the header's THE FRAME IS THE PAGE'S): PostList's GRID,
 *  spelled out — PostCard.test.tsx reads both and holds them equal. */
const FRAME_GRID = 'grid grid-cols-1 gap-8 @xl:grid-cols-2 @4xl:grid-cols-3';

/** THE FRAME (the header): the page's band, its scale and its grid, the
 *  story's card first, its neighbours in `language`. */
const Frame = ({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}): ReactElement => (
  <section className="bg-page">
    <Container>
      <div className={cx(bandColumnClasses, bandScaleClasses, 'py-10')}>
        <ul role="list" className={FRAME_GRID}>
          <li>{children}</li>
          {NEIGHBOURS[language].map((post) => (
            <li key={post.title}>
              <PostCard {...post} {...labelsOf(language)} className="h-full" />
            </li>
          ))}
        </ul>
      </div>
    </Container>
  </section>
);

/** The story's pinned language, for its neighbours — Romanian for any other
 *  the toolbar may flip to (the frame's languages are the stories'). */
const languageOf = (locale: unknown): Language =>
  locale === 'de' || locale === 'it' ? locale : 'ro';

const withFrame: Decorator = (Story, { globals }) => (
  <Frame language={languageOf(globals.locale)}>
    <Story />
  </Frame>
);

const px = (value: string): number => parseFloat(value);

/** The root's font size, in px — what a rem is on this page. */
const rem = (): number =>
  px(getComputedStyle(document.documentElement).fontSize);

/** A semantic token's hex, read off the live sheet, as the engine serializes
 *  a computed colour — `rgb(r, g, b)` (PostCard.test.tsx's `tokenRgb`). */
const tokenRgb = (name: string): string => {
  const hex = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim();
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
};

/** The design pixel's NAME (PostCard's CHIP_SCALE declares it on the list),
 *  and the guard both of CHIP_SCALE's classes ride (its THE GUARD). */
const PIXEL = '--scale-px';
const GUARD = 'supports-[width:1cqw]:';

/**
 * THE CHIPS' OWN PIXEL, as the stylesheet computes it: the larger of the
 * floor — FLOOR rem over DIVISOR — and the card's content width over the
 * owner's reference, the three numbers read off the list's own class (its
 * declaration behind the guard). The pattern is built from strings, so no
 * bracketed declaration stands in this file's text (the header's THE CHIPS
 * ARE MEASURED AGAINST THEIR CARD). Throws by name when the declaration is
 * missing or its shape moved.
 */
const chipPixelOf = (list: Element, contentWidth: number): number => {
  const open = '[';
  const declaration = (list.getAttribute('class') ?? '')
    .split(/\s+/)
    .find((token) => token.startsWith(`${GUARD}${open}${PIXEL}:`))
    ?.slice(GUARD.length);
  const number = '(\\d+(?:\\.\\d+)?)';
  const shape = new RegExp(
    `^\\${open}${PIXEL}:max\\(calc\\(${number}rem/${number}\\),calc\\(100cqw/${number}\\)\\)\\]$`,
  ).exec(declaration ?? '');
  if (!shape?.[1] || !shape[2] || !shape[3]) {
    throw new Error(
      `PostCard stories: the list's pixel moved — ${declaration ?? 'none'}`,
    );
  }
  return Math.max(
    (Number(shape[1]) * rem()) / Number(shape[2]),
    contentWidth / Number(shape[3]),
  );
};

/** The face an element's text is laid out in, loaded before anything is
 *  measured (the DoctorIntro / Hero / PersonnelCard idiom). */
const loadFace = async (element: Element): Promise<void> => {
  const style = getComputedStyle(element);
  await document.fonts.load(
    `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    element.textContent ?? '',
  );
  await document.fonts.ready;
};

/** One of the frame's boxes — or a throw that NAMES the part it expected
 *  where the card puts it (never a bare cast, whose miss surfaces lines later
 *  as a TypeError about `undefined`). */
const part = (
  element: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(element instanceof HTMLElement)) {
    throw new Error(
      `PostCard stories: the ${name} is not where the card puts it (found ${element?.tagName ?? 'nothing'}).`,
    );
  }
  return element;
};

/** The card's boxes, reached from the <article> by structure — none of them
 *  carries a role: ui/Card, the picture's cell and the words inside it, the
 *  author second in the words, the footer row last. */
const partsOf = (article: HTMLElement) => {
  const card = part(article.firstElementChild, 'card (ui/Card)');
  const cell = part(card.children[0], 'picture’s cell');
  const words = part(card.children[1], 'words');
  const footer = part(words.lastElementChild, 'footer row');
  return {
    card,
    cell,
    words,
    footer,
    author: part(words.children[1], 'author'),
    readingTime: part(footer.children[0], 'reading time'),
    readMore: part(footer.children[1], 'read-more'),
  };
};

/** The grid an article stands in — the frame's list. */
const gridOf = (article: HTMLElement): HTMLElement =>
  part(article.closest('ul'), 'grid');

/**
 * A rectangle IN LAYOUT PIXELS, relative to the card's border box — the
 * jump's transform taken out (the header's WHAT THE PLAYS READ): the engine
 * reports PAINTED rectangles, and under a resting real pointer the article is
 * painted at 105 %, so each rectangle is read relative to the card and divided
 * by the article's current scale — its painted width over its computed width,
 * which no transform touches. At rest the factor is 1.
 */
const layoutOf = (card: HTMLElement) => {
  const article = part(card.parentElement, 'article');
  const factor =
    article.getBoundingClientRect().width / px(getComputedStyle(article).width);
  const origin = card.getBoundingClientRect();
  return (element: Element) => {
    const box = element.getBoundingClientRect();
    return {
      top: (box.top - origin.top) / factor,
      left: (box.left - origin.left) / factor,
      right: (box.right - origin.left) / factor,
      bottom: (box.bottom - origin.top) / factor,
      width: box.width / factor,
      height: box.height / factor,
    };
  };
};

/** The card's inner edges from its computed style alone — layout, never
 *  paint — relative to its border box: the frame's inside (the padding box)
 *  and the content box. */
const edgesOf = (card: HTMLElement) => {
  const style = getComputedStyle(card);
  const width = px(style.width);
  const height = px(style.height);
  const frame = px(style.borderTopWidth);
  const padding = px(style.paddingTop);
  return {
    frame,
    padding,
    radius: px(style.borderTopLeftRadius),
    inner: { top: frame, left: frame, right: width - frame },
    content: {
      left: frame + padding,
      right: width - frame - padding,
      bottom: height - frame - padding,
      width: width - 2 * (frame + padding),
    },
  };
};

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9) —
 *  not the card (a chip never wraps) and not the page. */
const expectNoSidewaysScroll = async (article: HTMLElement): Promise<void> => {
  await expect(article.scrollWidth).toBeLessThanOrEqual(article.clientWidth);
  const page = document.documentElement;
  await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
};

/** The facts every card owes whatever its width: named by its title, the
 *  author on the eyebrow line and no date, the tags a named list — or none —
 *  the footer row's two ends, and the read-more no link. Loads the faces. */
const expectNamedParts = async (
  canvasElement: HTMLElement,
  args: PostCardContent & { tagsLabel: string; readMore: string },
): Promise<HTMLElement> => {
  const canvas = within(canvasElement);
  const article = canvas.getByRole('article', { name: args.title });
  for (const element of article.querySelectorAll('h2, p, li, a')) {
    await loadFace(element);
  }
  const { words, author, readingTime, readMore } = partsOf(article);
  await expect(words.firstElementChild).toBe(
    within(article).getByRole('heading', { level: 2, name: args.title }),
  );
  await expect(author.textContent).toBe(args.author);
  await expect(getComputedStyle(author).textTransform).toBe('uppercase');
  await expect(article.querySelector('time')).toBeNull();
  if (args.tags.length === 0) {
    await expect(within(article).queryByRole('list')).toBeNull();
  } else {
    const list = within(article).getByRole('list', { name: args.tagsLabel });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(
      args.tags.length,
    );
  }
  await expect(readingTime.textContent).toBe(args.readingTime);
  await expect(readMore.textContent).toBe(args.readMore);
  await expect(readMore).not.toHaveAttribute('href');
  await expect(within(article).queryByRole('link')).toBeNull();
  return article;
};

/**
 * THE PICTURE, MEASURED: out to the frame's inner edge on top and on both
 * sides (0px, to the engine's layout unit), 3:2, its top corners the card's
 * radius less the frame — the frame's inner curve — and the photograph clipped
 * to them. The 0.5px bound is half a CSS pixel: a bleed that missed its
 * padding by a step or a pixel fails it.
 */
const expectPictureFlush = async (article: HTMLElement): Promise<void> => {
  const { card, cell } = partsOf(article);
  const { frame, radius, inner } = edgesOf(card);
  const box = layoutOf(card)(cell);
  const style = getComputedStyle(cell);
  await expect(Math.abs(box.top - inner.top)).toBeLessThan(0.5);
  await expect(Math.abs(box.left - inner.left)).toBeLessThan(0.5);
  await expect(Math.abs(inner.right - box.right)).toBeLessThan(0.5);
  await expect(box.width / box.height).toBeCloseTo(1.5, 1);
  await expect(px(style.borderTopLeftRadius)).toBeCloseTo(radius - frame, 1);
  await expect(px(style.borderTopRightRadius)).toBeCloseTo(radius - frame, 1);
  await expect(style.borderBottomLeftRadius).toBe('0px');
  await expect(style.overflow).toBe('clip');
};

/**
 * THE TAGS, MEASURED AGAINST THEIR CARD: the list draws in its own pixel —
 * the larger of the floor and the card's content width over the owner's
 * reference (`chipPixelOf`), checked against the pixel the engine computed —
 * and in it every chip is the atom's own: 44 tall, 20 of padding, an 18
 * label; the list three steps (12) in from the picture's top-right corner,
 * its chips three steps apart. The FIRST tag at the far right of the first
 * line, every next tag to the left of the one before it or, where it no
 * longer fits, at the right end of a new line below; every chip on the
 * picture, and every chip in the TAG face — its edges and its label the
 * `--accent` token on the white `--surface` (the header's THE CHIPS ARE
 * TAGS). The content box is read off the card, never assumed.
 */
const expectChipsOverPicture = async (article: HTMLElement): Promise<void> => {
  const list = within(article).queryByRole('list');
  if (!list) return;
  const accent = tokenRgb('accent');
  const surface = tokenRgb('surface');
  const { card, cell } = partsOf(article);
  const pixel = chipPixelOf(list, edgesOf(card).content.width);
  const listStyle = getComputedStyle(list);
  await expect(px(listStyle.getPropertyValue(PIXEL))).toBeCloseTo(pixel, 4);
  await expect(px(listStyle.columnGap)).toBeCloseTo(12 * pixel, 2);
  const layout = layoutOf(card);
  const picture = layout(cell);
  const box = layout(list);
  await expect(Math.abs(box.top - picture.top - 12 * pixel)).toBeLessThan(0.5);
  await expect(Math.abs(picture.right - box.right - 12 * pixel)).toBeLessThan(
    0.5,
  );
  let before: ReturnType<typeof layout> | undefined;
  for (const item of within(list).getAllByRole('listitem')) {
    const chip = layout(item);
    const chipStyle = getComputedStyle(item);
    await expect(Math.abs(chip.height - 44 * pixel)).toBeLessThan(0.5);
    await expect(px(chipStyle.paddingInlineStart)).toBeCloseTo(20 * pixel, 2);
    await expect(px(chipStyle.fontSize)).toBeCloseTo(18 * pixel, 2);
    // The TAG face — a label, never a control's resting ink.
    for (const edge of [
      chipStyle.borderTopColor,
      chipStyle.borderRightColor,
      chipStyle.borderBottomColor,
      chipStyle.borderLeftColor,
    ]) {
      await expect(edge).toBe(accent);
    }
    await expect(chipStyle.color).toBe(accent);
    await expect(chipStyle.backgroundColor).toBe(surface);
    await expect(chip.left).toBeGreaterThanOrEqual(picture.left);
    await expect(chip.bottom).toBeLessThanOrEqual(picture.bottom);
    if (!before || chip.top > before.bottom) {
      // A line's first chip stands at the list's right end.
      await expect(Math.abs(chip.right - box.right)).toBeLessThan(0.5);
    } else {
      // The next chip on the same line, to the left of the one before.
      await expect(chip.right).toBeLessThan(before.left);
      await expect(Math.abs(chip.top - before.top)).toBeLessThan(0.5);
    }
    before = chip;
  }
};

/**
 * THE FOOTER ROW, MEASURED: on the content's floor; the read-more's LABEL on
 * the content's right edge (its `px-2` box handed back); the reading time on
 * the left edge — and ONE line exactly when the two fit the content box side
 * by side, else the read-more on a line of its own below, still at the end.
 * Returns which it was, so a story can say what it pinned.
 */
const expectFooterRow = async (
  article: HTMLElement,
): Promise<'one line' | 'wrapped'> => {
  const { card, footer, readingTime, readMore } = partsOf(article);
  const { content } = edgesOf(card);
  const layout = layoutOf(card);
  const time = layout(readingTime);
  const more = layout(readMore);
  const moreStyle = getComputedStyle(readMore);
  await expect(Math.abs(layout(footer).bottom - content.bottom)).toBeLessThan(
    0.5,
  );
  await expect(
    Math.abs(more.right - px(moreStyle.paddingRight) - content.right),
  ).toBeLessThan(0.5);
  await expect(Math.abs(time.left - content.left)).toBeLessThan(0.5);
  const need =
    time.width +
    px(getComputedStyle(footer).columnGap) +
    more.width +
    px(moreStyle.marginInlineEnd);
  if (need <= content.width) {
    await expect(
      Math.abs(time.top + time.height / 2 - (more.top + more.height / 2)),
    ).toBeLessThan(1);
    return 'one line';
  }
  await expect(more.top).toBeGreaterThanOrEqual(time.bottom - 0.5);
  return 'wrapped';
};

/** THE ROW, MEASURED: every card whose <li> starts the story card's grid row
 *  is its height, and its footer row stands at the same height in it — the
 *  page's `h-full` placement and the footer's `mt-auto` together. Layout
 *  values throughout: the items' offsets, the articles' computed heights. */
const expectRowAligned = async (
  canvasElement: HTMLElement,
  article: HTMLElement,
): Promise<void> => {
  const item = part(article.parentElement, 'grid item');
  const row = [...canvasElement.querySelectorAll('article')].filter(
    (other) =>
      part(other.parentElement, 'grid item').offsetTop === item.offsetTop,
  );
  const height = px(getComputedStyle(article).height);
  const { card, footer } = partsOf(article);
  const footerTop = layoutOf(card)(footer).top;
  for (const other of row) {
    await expect(
      Math.abs(px(getComputedStyle(other).height) - height),
    ).toBeLessThan(0.5);
    const parts = partsOf(other);
    await expect(
      Math.abs(layoutOf(parts.card)(parts.footer).top - footerTop),
    ).toBeLessThan(0.5);
  }
};

/** The page's language reached the document: the preview decorator stamps
 *  <html lang> from the story's pin, and `hyphens: auto` picks its dictionary
 *  there (§15.14) — if the pin stopped arriving, a frame would go on looking
 *  plausible while proving nothing (ReviewCard's GermanStress). */
const expectLanguage = async (language: Language): Promise<void> => {
  await expect(document.documentElement.lang).toBe(language);
};

/** THE TITLE NEVER SPLITS A WORD (PostCard's header — the owner, 2026-10-15):
 *  the title computes `hyphens: none`, and every word of it stands on ONE
 *  line — no syllable break, and the belt idle. The words and the reading
 *  are PostCard.fixtures.ts's, the very ones PostCard.titles.test.tsx lays
 *  every title out with: its `unitsOf` cuts the units (at a space, and after
 *  a written hyphen), and its `unitsAcrossLines` finds a unit whose
 *  fragments stand more than half a line apart, in LAYOUT pixels — so the
 *  jump a resting pointer draws changes nothing it compares. ONE reading of
 *  both, so a failure shows each: the words split where the engine
 *  hyphenates the language, the computed value wherever the class is gone. */
const expectTitleWordsWhole = async (article: HTMLElement): Promise<void> => {
  const title = within(article).getByRole('heading', { level: 2 });
  await expect({
    hyphens: getComputedStyle(title).hyphens,
    split: unitsAcrossLines(title),
  }).toEqual({ hyphens: 'none', split: [] });
};

const meta = {
  title: 'Sections/PostCard',
  component: PostCard,
  parameters: { layout: 'fullscreen' },
  decorators: [withFrame],
  args: {
    ...TOOTHBRUSH,
    ...labelsOf('ro'),
    className: 'h-full',
  },
  argTypes: {
    title: {
      control: 'text',
      description:
        'The post’s title — the card’s heading (always the page’s <h2>) and the article’s accessible name',
    },
    summary: {
      control: 'text',
      description: 'One or two sentences under the author, in the muted ink',
    },
    author: {
      control: 'text',
      description:
        'Who wrote the post — the eyebrow under the title, uppercased in CSS',
    },
    readingTime: {
      control: 'text',
      description:
        'How long the post takes to read, finished by the page (e.g. „5 min de citit”) — the footer row’s left end',
    },
    image: {
      control: false,
      description:
        'The picture under public/images/ and its alt (empty when decorative) — a 3:2 cell out to the frame',
    },
    tags: {
      control: 'object',
      description:
        'The categories — ui/PillButton’s tag kind: labels in the lavender that answer no hover — over the picture’s top-right corner, the first at the far right; an empty list renders no list',
    },
    tagsLabel: {
      control: 'text',
      description: 'The accessible name of the tag list, e.g. „Categorii”',
    },
    readMore: {
      control: 'text',
      description:
        'The read-more’s label, e.g. „Citește mai mult…” — ui/TextButton’s accent tone on a placeholder <a> without href',
    },
    preload: {
      control: 'boolean',
      description:
        'The page’s FIRST card: load the picture at once, at high priority, with a preload link (a likely LCP)',
    },
    className: {
      control: false,
      description:
        'Placement only, merged last onto the <article> (§6.8) — the frame passes `h-full`, as the page does',
    },
  },
} satisfies Meta<typeof PostCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE EVERYDAY CARD — the owner's screenshot: the photograph flush across the
 * top of the frame with the two categories over its top-right corner —
 * lavender labels, never buttons (THE TAGS) — the first at the far right,
 * drawn in the card's own pixel (THE CHIPS FOLLOW THEIR CARD); the title,
 * the author on the eyebrow line, the summary; the reading time and
 * „Citește mai mult…" on the card's floor. In the page's grid: one card to a
 * row on a phone, three on a laptop, beside its two neighbours. Unpinned —
 * the play proves whatever width it is handed.
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ args, canvasElement }) => {
    const article = await expectNamedParts(canvasElement, args);
    await expectPictureFlush(article);
    await expectChipsOverPicture(article);
    await expectFooterRow(article);
    await expectRowAligned(canvasElement, article);
    await expectNoSidewaysScroll(article);
  },
};

/**
 * A POST WITHOUT CATEGORIES: no list at all — an empty named list would be
 * announced as „list, 0 items" — and the photograph bare. Pinned to the
 * laptop (1536px) so the Vitest run proves THE ROW OF THREE in the band
 * scale: one height, one footer line.
 */
export const NoTags: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { ...FIRST_VISIT },
  play: async ({ args, canvasElement }) => {
    const article = await expectNamedParts(canvasElement, args);
    await expectPictureFlush(article);
    const shape = await expectFooterRow(article);
    await expectRowAligned(canvasElement, article);
    if (window.innerWidth === 1536) {
      await expect(
        getComputedStyle(gridOf(article)).gridTemplateColumns.split(' '),
      ).toHaveLength(3);
      await expect(shape).toBe('one line');
    }
    await expectNoSidewaysScroll(article);
  },
};

/**
 * THE STRESS, at the 320px accessibility width (§7) as well as the net's two
 * — the 'stress-320' tag — and pinned there, so the Vitest run proves the
 * narrowest card: a title of long words in the 30px `band` step, every word
 * whole on its line — since 2026-10-15 the title never splits a word at a
 * syllable (PostCard's THE TITLE NEVER SPLITS A WORD: where the Romanian
 * dictionary split „recomandări", the word moves whole and the title takes a
 * seventh line), and its widest word, „Parodontopatia" at 201.1px, fits the
 * 223px line, so THE TITLE'S BELT stays idle, there for a word too wide for
 * its line on its own (PostCard's THE NAME, G2 a11y, 2026-10-14); the
 * longest author's name the clinic signs,
 * wrapping between its words; three single-word chips that cannot wrap, on
 * the floor of their own pixel (a 12px label — THE CHIPS FOLLOW THEIR CARD),
 * so the LIST wraps instead, two chips and then one, still on the picture;
 * the footer row wrapped, the read-more alone at the end. Nothing may push
 * the page sideways.
 */
export const LongWords: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  args: { ...LONG_WORDS },
  play: async ({ args, canvasElement }) => {
    const article = await expectNamedParts(canvasElement, args);
    await expectPictureFlush(article);
    await expectChipsOverPicture(article);
    const shape = await expectFooterRow(article);
    if (window.innerWidth === 320) {
      await expect(shape).toBe('wrapped');
      // THE FLOOR binds on the narrowest card: every label 0.75rem.
      for (const chip of within(article).getAllByRole('listitem')) {
        await expect(px(getComputedStyle(chip).fontSize)).toBeCloseTo(
          0.75 * rem(),
          2,
        );
      }
    }
    // THE TITLE'S BELT reached the real sheet: the title's own element
    // computes `overflow-wrap: anywhere` (the unit suite pins the token)…
    await expect(
      getComputedStyle(within(article).getByRole('heading', { level: 2 }))
        .overflowWrap,
    ).toBe('anywhere');
    // …and so did its rule: `hyphens: none`, every long word whole.
    await expectTitleWordsWhole(article);
    await expectNoSidewaysScroll(article);
  },
};

/**
 * GERMAN, THE HOUSE'S STRESS LANGUAGE (§13), on the phone width: the
 * everyday post in German beside two German neighbours, the page's own
 * German words — „Kategorien", „Weiterlesen…", „4 Min. Lesezeit" — and the
 * three widest German tags, „Kieferorthopädie" first, at the far right: on
 * the floor of their pixel the list wraps over the picture, two chips and
 * then one, and stays on it. The footer row holds ONE line here — German's
 * needs 248.4px, one line on every phone from 360 (PostCard's THE FOOTER
 * ROW). Its title is the owner's own example (2026-10-15): the dictionary
 * split „Zahnbürs-te" on a phone, and the word stands whole now — „Wie Sie
 * Ihre / Zahnbürste auswählen" on a 390 phone, three lines behind a classic
 * scrollbar (PostCard's THE TITLE NEVER SPLITS A WORD). Nothing may push the
 * page sideways.
 */
export const GermanStress: Story = {
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  args: { ...GERMAN_STRESS, ...labelsOf('de') },
  play: async ({ args, canvasElement }) => {
    await expectLanguage('de');
    const article = await expectNamedParts(canvasElement, args);
    await expectTitleWordsWhole(article);
    await expectPictureFlush(article);
    await expectChipsOverPicture(article);
    const shape = await expectFooterRow(article);
    if (window.innerWidth === 390) {
      await expect(shape).toBe('one line');
      // The three widest German tags: two chips on the first line, the
      // third alone under them — still on the picture (checked above).
      const [first, second, third] = within(article)
        .getAllByRole('listitem')
        .map(layoutOf(partsOf(article).card));
      if (!first || !second || !third) throw new Error('three chips expected');
      await expect(Math.abs(second.top - first.top)).toBeLessThan(0.5);
      await expect(third.top).toBeGreaterThan(first.bottom);
    }
    await expectRowAligned(canvasElement, article);
    await expectNoSidewaysScroll(article);
  },
};

/**
 * ITALIAN, THE ROW IT ONCE BROKE — pinned to the laptop (1536px), so the
 * Vitest run holds the footer row on ONE line in a three-across card in the
 * band scale: „4 min di lettura" and it.json's „Leggi di più…" (the first
 * read-more, „Continua a leggere…", wrapped there at every laptop width —
 * PostCard's THE FOOTER ROW: 56.4px to spare at 1536, 31.9 at 1140, the
 * scale's first three-across window). The words come from the message file
 * itself, so a longer read-more turns this play red before it ships.
 */
export const Italian: Story = {
  globals: { locale: 'it', viewport: { value: 'laptop' } },
  args: { ...ITALIAN, ...labelsOf('it') },
  play: async ({ args, canvasElement }) => {
    await expectLanguage('it');
    const article = await expectNamedParts(canvasElement, args);
    await expectPictureFlush(article);
    await expectChipsOverPicture(article);
    const shape = await expectFooterRow(article);
    await expectRowAligned(canvasElement, article);
    if (window.innerWidth === 1536) {
      await expect(
        getComputedStyle(gridOf(article)).gridTemplateColumns.split(' '),
      ).toHaveLength(3);
      await expect(shape).toBe('one line');
    }
    await expectNoSidewaysScroll(article);
  },
};

/** One CSS rule as the stylesheet holds it, with the at-rules around it. */
type RuleTrail = { trail: readonly string[]; style: CSSStyleDeclaration };

/** Every style rule the document's sheets hold, each with its `@media`
 *  conditions — layers and other groupings are walked through, nested rules
 *  included. A sheet the page may not read is skipped. */
const styleRules = (): RuleTrail[] => {
  const found: RuleTrail[] = [];
  const walk = (rules: CSSRuleList, trail: readonly string[]): void => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        const next = [...trail, rule.selectorText];
        found.push({ trail: next, style: rule.style });
        walk(rule.cssRules, next);
      } else if (rule instanceof CSSMediaRule) {
        walk(rule.cssRules, [...trail, `@media ${rule.conditionText}`]);
      } else if (rule instanceof CSSGroupingRule) {
        walk(rule.cssRules, trail);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    walk(rules, []);
  }
  return found;
};

/** The index of the ONE rule whose selector is `selector`, named on failure. */
const ruleIndex = (rules: RuleTrail[], selector: string): number => {
  const index = rules.findIndex(({ trail }) => trail.at(-1) === selector);
  if (index === -1) {
    throw new Error(`PostCard stories: no stylesheet rule for ${selector}.`);
  }
  return index;
};

/**
 * THE CARD JUMP — the owner's "react on hover like a button", kept on his
 * word of 2026-10-14 ("the animation for "jump at you" on hover must
 * remain"): hover the card and it grows to 105 % over 200ms, the house
 * button's jump (ui/Button's THE JUMP), and settles back when the pointer
 * leaves. Not photographed ('no-visual'): the net runs under reduced motion,
 * where the card never moves, and synthetic events cannot hover anything. So
 * the play reads what a picture could not: the clock on the <article> —
 * `scale` alone, 0.2s, the keyword ease-out — ui/Card's own paint clock left
 * on the element inside it, and, in the real stylesheet, the two rules that
 * move it: the 105 % behind `(hover: hover)`, and the reduced-motion reset
 * after it in the sheet, so the reset wins.
 */
export const Jump: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro' },
  play: async ({ args, canvasElement }) => {
    const article = within(canvasElement).getByRole('article', {
      name: args.title,
    });
    const clock = getComputedStyle(article);
    await expect(clock.transitionProperty).toBe('scale');
    await expect(clock.transitionDuration).toBe('0.2s');
    await expect(clock.transitionTimingFunction).toBe('ease-out');
    // Two clocks, two elements: the frame's paint fades on ui/Card's own.
    await expect(
      getComputedStyle(partsOf(article).card).transitionProperty,
    ).toBe('background-color, border-color');
    // The gaps the jump grows into: 2.5 % of the card a side and above and
    // below, inside the page's 2rem gap (in the design pixel) at this width.
    const grid = gridOf(article);
    const size = getComputedStyle(article);
    await expect(0.025 * px(size.width)).toBeLessThan(
      px(getComputedStyle(grid).columnGap),
    );
    await expect(0.025 * px(size.height)).toBeLessThan(
      px(getComputedStyle(grid).rowGap),
    );

    const rules = styleRules();
    const grow = ruleIndex(rules, '.hover\\:scale-105:hover');
    const reset = ruleIndex(rules, '.motion-reduce\\:hover\\:scale-100:hover');
    await expect(rules[grow]?.trail).toContain('@media (hover: hover)');
    await expect(
      rules[grow]?.style.getPropertyValue('--tw-scale-x').trim(),
    ).toBe('105%');
    await expect(rules[reset]?.trail).toContain(
      '@media (prefers-reduced-motion: reduce)',
    );
    await expect(
      rules[reset]?.style.getPropertyValue('--tw-scale-x').trim(),
    ).toBe('100%');
    // Same specificity, so the sheet's order decides: the reset comes later.
    await expect(reset).toBeGreaterThan(grow);
  },
};
