import type { CSSProperties } from 'react';
import { cleanup, render, within } from '@testing-library/react';
import { createTranslator } from 'next-intl';
import { userEvent as realUser } from 'vitest/browser';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
// The REAL stylesheet and, below, the REAL faces: a miniature is a COMPUTED
// thing — every length a variable's value one element down, every line break
// the typeface's — so nothing a class string holds can answer for it.
import '@/styles/globals.css';
import { localeHref } from '@/i18n/href';
import { locales, type Locale } from '@/i18n/locales';
import { articleAuthor, articleSlugFor } from '@/lib/blog-article/blog-article';
import { articlePath, postsIn, type BlogPost } from '@/lib/blog/blog';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { PostCard, type PostCardProps } from './PostCard';
import { unitsAcrossLines } from './PostCard.fixtures';

// sections/PostCard — THE MINIATURE, MEASURED (PostCard.tsx's paragraph of
// that name; the owner, 2026-10-17: the Home page's cards "65% of the
// height", his pick "Miniature (all 65%)").
//
// ── WHAT IS COMPARED. Two cards IN ONE BOX — so in ONE inherited design
// pixel: the blog list's three-across card in its slot at the owner's 1401
// window, (1106 − 64) / 3 = 347.333 design px (the band's column less two
// 32-design-px gaps, a third — sections/PostList's GRID in THE BAND SCALE),
// and the Home band's miniature in a slot the share of it, 225.767 design px,
// drawn with `miniature={0.65}`. The box is the theme's own (no remap — the
// spacing step 0.25rem), or a design drawn in `design-scale` at a band's
// pixel: 1px (the band at the owner's own window), the band scale's step
// (896 / 1106 = 0.810px, its smallest) and its cap (1536 / 1106 = 1.389px).
// The pixel rides an INLINE style, never an arbitrary class (Tailwind reads
// tests too — tests/unit/design-scale.test.ts's D-LIT RULE).
// THE CHIPS ARE COMPARED WITH THE MINIATURE ITSELF since 2026-10-25
// (PostCard's THE CHIPS FOLLOW THE PIXEL): their floor is twelve of the
// miniature's own pixel, so the label is 12/16 of the miniature's summary at
// every pixel, and its full card's share only where the full card's own,
// absolute floor gives the same number — the theme's pixel and a band's 1px
// at this root. A FIFTH PIXEL, 2.5px, stands past the title's `@md` step — a
// pixel no page drew until the Home band's flat row (PostCard's THE STEPS
// THE MINIATURE CANNOT REDRAW) — in the cases that read the miniature alone:
// there a full card in the same box takes `band`'s 36, so it is no copy to
// compare with.
//
// ── WHAT IS ENGINE-PROOF, AND WHAT IS NOT. Computed sizes and the layout's
// own arithmetic hold on any engine, so they are pinned exactly: every text
// at the share of its full card's size, the frame, ring and inset in CSS px,
// the picture and the card's height to the residuals the px parts leave.
// LINE BREAKS are the typeface's, and CI's Linux advances every glyph by
// whole pixels (CLAUDE.md §15.39's Pagination lesson) where this Mac does
// not — so the lines are held to what holds on both: the miniature's title
// and summary take its full card's lines or one more or one fewer, never two
// more. What this Mac measured — one more, never fewer, in about one reading
// in five, the optical size's doing — is PostCard.tsx's THE OPTICAL SIZE
// MOVES A LINE, RECORDED, and each case annotates the readings it found.
//
// ── THE CARD IS HELD STILL (PostCard.test.tsx's rules, KEEP-IN-SYNC): every
// transition off in the injected sheet, and the real pointer parked off the
// cards before each case, so no card jumps under a reading.

/** The share the Home band asks for (the owner's 65 %). */
const SHARE = 0.65;

/** The full card's slot, in design px: the blog list's three-across card at
 *  the owner's 1401 window — the band's column, 1106, less its two 2rem
 *  gaps, a third. */
const FULL_SLOT = (1106 - 2 * 32) / 3;

/** The design pixel's name — set inline, never as a class (the header). */
const PIXEL = '--scale-px';

/** globals.css's remap — the band scale's own utility. */
const REMAP = 'design-scale';

/** The inherited pixels, in CSS px at the 16px root — `undefined` the
 *  theme's own (no remap: the spacing step 0.25rem). */
const PIXELS = [
  { name: 'in the theme’s own pixel', px: undefined },
  { name: 'in a band’s 1px', px: 1 },
  { name: 'in the band scale’s step, 0.810px', px: 896 / 1106 },
  { name: 'at the band scale’s cap, 1.389px', px: 1536 / 1106 },
] as const;

/** THE FIFTH PIXEL (the header): past the title's `@md` step — a miniature's
 *  content box over 28rem — and past the band scale's cap, as a page that
 *  magnifies the miniature further draws it. */
const PAST = { name: 'past the title’s step, 2.5px', px: 2.5 } as const;

/** ui/Heading's `band` step's ONE container row — the class a full card's
 *  title wears beside `section`'s and a miniature's does not (PostCard's
 *  TITLE_STEP): put back on a miniature's title, it shows what the pin does. */
const BAND_ROW = '@md:text-4xl';

/** ui/Card's framed row, a side, in CSS px at the theme's step: the 3px frame
 *  and six steps less 2px of padding — the frame in px, the padding's px half
 *  the other residual (PostCard's THE MINIATURE). */
const FRAME = 3;

// The REAL faces, as PostCard.titles.test.tsx loads them (the declarations
// .storybook/preview-fonts.css makes, served from the repo's root,
// `font-display: block` so a fallback is never measured) — the mono one too,
// for the author's line — and PostCard.test.tsx's THE STILLNESS RULE.
const SERIF = 'Source Serif 4 SB';
const MONO = 'JetBrains Mono SB';
const INJECTED_CSS = `
@font-face {
  font-family: '${SERIF}';
  src: url('/src/fonts/SourceSerif4Variable-subset.woff2') format('woff2');
  font-weight: 200 900;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: '${MONO}';
  src: url('/src/fonts/JetBrainsMonoVariable-subset.woff2') format('woff2');
  font-weight: 100 800;
  font-style: normal;
  font-display: block;
}
:root { --font-source-serif: '${SERIF}'; --font-jetbrains-mono: '${MONO}'; }
*, *::before, *::after { transition: none !important; animation: none !important; }
`;
let injected: HTMLStyleElement | null = null;
let lang0: string | null = null;
/** The parking box of the running case, once taken. */
let unpark: (() => void) | undefined;

beforeAll(async () => {
  lang0 = document.documentElement.getAttribute('lang');
  injected = document.createElement('style');
  injected.textContent = INJECTED_CSS;
  document.head.append(injected);
  // load(), not just ready: nothing has rendered yet — and a 404 on a subset
  // REJECTS here, loudly.
  await document.fonts.load(`1rem "${SERIF}"`);
  await document.fonts.load(`1rem "${MONO}"`);
  await document.fonts.ready;
});

// THE POINTER, PARKED off the cards (PostCard.test.tsx's parkPointer,
// KEEP-IN-SYNC): a 2rem box prepended to the body and the REAL pointer on it.
beforeEach(async () => {
  const parking = document.createElement('div');
  parking.style.cssText = 'width: 2rem; height: 2rem';
  document.body.prepend(parking);
  await realUser.hover(parking);
  unpark = () => parking.remove();
});

afterEach(() => {
  cleanup();
  unpark?.();
  unpark = undefined;
});

afterAll(() => {
  injected?.remove();
  injected = null;
  if (lang0 === null) document.documentElement.removeAttribute('lang');
  else document.documentElement.lang = lang0;
});

/** The root's font size, in px. */
const rootPx = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** A length, as the engine computes it. */
const px = (value: string): number => parseFloat(value);

/** The `blog` namespace of each language's REAL message file — the words
 *  the page finishes a card with (src/app/[locale]/blog/populate.ts). */
const BLOG = {
  ro: createTranslator({ locale: 'ro', messages: ro, namespace: 'blog' }),
  en: createTranslator({ locale: 'en', messages: en, namespace: 'blog' }),
  de: createTranslator({ locale: 'de', messages: de, namespace: 'blog' }),
  fr: createTranslator({ locale: 'fr', messages: fr, namespace: 'blog' }),
  it: createTranslator({ locale: 'it', messages: it_, namespace: 'blog' }),
} satisfies Record<Locale, unknown>;

/** A post as the page hands it to the card, in `locale` — the mapping of
 *  src/app/[locale]/blog/populate.ts's `postCard`, which the list and Home's
 *  band both print through, spelled here as the stories' `contentOf` spells
 *  it (a section's test never imports the app): the article it opens —
 *  lib/blog-article's stand-in while the post has none — its words, its
 *  author as lib/team names the doctor in that language (French „Dr" with no
 *  full stop), its reading time and the page's two labels as the message
 *  file finishes them. */
const cardOf = (locale: Locale, post: BlogPost): PostCardProps => ({
  href: localeHref(locale, articlePath(articleSlugFor(post.slug))),
  title: post.title,
  summary: post.summary,
  author: articleAuthor(post).words[locale].name,
  readingTime: BLOG[locale]('readingTime', { minutes: post.readingMinutes }),
  image: post.image,
  tags: post.tags,
  tagsLabel: BLOG[locale]('tags'),
  readMore: BLOG[locale]('card.readMore'),
});

/**
 * THE PAIRS (the header): for each card, its full card in FULL_SLOT and its
 * miniature in the share of it, side by side in ONE box drawn in `px` (the
 * theme's own when `undefined`) — under `locale`'s `lang`, once the faces
 * have their text. Returns the articles in pairs.
 */
const renderPairs = async (
  locale: Locale,
  cards: readonly PostCardProps[],
  pixel: number | undefined,
): Promise<{ full: HTMLElement; mini: HTMLElement }[]> => {
  document.documentElement.lang = locale;
  const design = pixel ?? rootPx() / 16;
  const box =
    pixel === undefined
      ? undefined
      : ({ [PIXEL]: `${pixel}px` } as CSSProperties);
  const { container } = render(
    <div className={pixel === undefined ? undefined : REMAP} style={box}>
      {cards.map((card) => (
        <div key={card.title}>
          <div style={{ width: `${FULL_SLOT * design}px` }}>
            <PostCard {...card} />
          </div>
          <div style={{ width: `${FULL_SLOT * SHARE * design}px` }}>
            <PostCard {...card} miniature={SHARE} />
          </div>
        </div>
      ))}
    </div>,
  );
  for (const element of container.querySelectorAll('h2, p, li, span')) {
    const style = getComputedStyle(element);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      element.textContent ?? '',
    );
  }
  await document.fonts.ready;
  const articles = [...container.querySelectorAll('article')];
  expect(articles).toHaveLength(2 * cards.length);
  return cards.map((_, index) => {
    const full = articles[2 * index];
    const mini = articles[2 * index + 1];
    if (!(full instanceof HTMLElement) || !(mini instanceof HTMLElement)) {
      throw new Error('PostCard.miniature: a pair is missing a card.');
    }
    return { full, mini };
  });
};

/** One of a card's boxes, or a throw that names it. */
const part = (element: Element | null | undefined, name: string) => {
  if (!(element instanceof HTMLElement)) {
    throw new Error(`PostCard.miniature: no ${name} where the card puts it.`);
  }
  return element;
};

/** Whether a card is a MINIATURE — decided by THE MINIATURE'S WRAPPER, the
 *  one element only a miniature draws: the <article>'s one child wears the
 *  remap (`REMAP`), which ui/Card never does. Never by the share inline on
 *  the <article>, which a caller's own style can set on a full card too; and
 *  never by the share's number either: 1 is a share THE MINIATURE draws, its
 *  wrapper and all. */
const isMiniature = (article: HTMLElement): boolean =>
  article.firstElementChild?.classList.contains(REMAP) ?? false;

/** ui/Card, reached from its <article>: the article's one child on a full
 *  card, the one child of THE MINIATURE'S WRAPPER on a miniature (PostCard's
 *  header) — a plain <div> the article holds in between. */
const frameOf = (article: HTMLElement): HTMLElement => {
  const child = part(article.firstElementChild, 'article’s one child');
  return isMiniature(article)
    ? part(child.firstElementChild, 'card (ui/Card) in the wrapper')
    : child;
};

/** A card's boxes, by structure (PostCard.test.tsx's `partsOf`): ui/Card,
 *  the picture's cell, the words — title, author, the tags, the summary,
 *  the footer row — the read-more's label inside the link. */
const partsOf = (article: HTMLElement) => {
  const card = frameOf(article);
  const words = part(card.children[1], 'words');
  const list = words.querySelector('ul');
  const footer = part(words.lastElementChild, 'footer row');
  return {
    card,
    cell: part(card.children[0], 'picture’s cell'),
    words,
    title: part(words.children[0], 'title'),
    author: part(words.children[1], 'author'),
    list,
    summary: part(words.children[list ? 3 : 2], 'summary'),
    footer,
    time: part(footer.children[0], 'reading time'),
    link: part(footer.children[1], 'link'),
    label: part(footer.children[1]?.firstElementChild, 'read-more’s label'),
    chips: list ? [...list.querySelectorAll('li')] : [],
  };
};

/** How many lines a block of text lays out on — its height over its line,
 *  both computed (layout, never paint). */
const linesOf = (element: HTMLElement): number => {
  const style = getComputedStyle(element);
  return Math.round(px(style.height) / px(style.lineHeight));
};

/** The six texts a card sets, each its computed size in px — the chips' as
 *  their label. */
const textSizesOf = (article: HTMLElement) => {
  const p = partsOf(article);
  const size = (element: Element) => px(getComputedStyle(element).fontSize);
  return {
    title: size(p.title),
    author: size(p.author),
    summary: size(p.summary),
    readingTime: size(p.time),
    readMore: size(p.label),
    chip: p.chips[0] ? size(p.chips[0]) : Number.NaN,
  };
};

/** A card's content width — its border box less the frame and the padding,
 *  the box `100cqw` reads inside it. */
const contentWidthOf = (card: Element): number => {
  const style = getComputedStyle(card);
  return (
    px(style.width) -
    px(style.borderLeftWidth) -
    px(style.borderRightWidth) -
    px(style.paddingLeft) -
    px(style.paddingRight)
  );
};

/** The everyday post — the index's first, two categories — in a language. */
const everyday = (locale: Locale): PostCardProps => {
  const post = postsIn(locale).find(
    (candidate) => candidate.slug === 'cum-iti-alegi-periuta-de-dinti',
  );
  if (!post) throw new Error('posts.json: the everyday post is gone.');
  return cardOf(locale, post);
};

describe('PostCard — the miniature draws every text at the share of its full card’s, in the pixel it inherits (THE MINIATURE, the real stylesheet)', () => {
  it.each(PIXELS)(
    'sets the five texts at 0.65 of its full card’s, the chips’ label at twelve of its own pixel — $name',
    async ({ px: pixel }) => {
      // The pixel the pair inherits, in CSS px.
      const design = pixel ?? rootPx() / 16;
      for (const locale of ['ro', 'de'] as const) {
        const [pair] = await renderPairs(locale, [everyday(locale)], pixel);
        if (!pair) throw new Error('no pair rendered');
        const full = textSizesOf(pair.full);
        const mini = textSizesOf(pair.mini);
        // The type the remap draws in one pixel, EXACTLY: the full card's
        // 30 / 14 / 16 / 16 / 18 design px, × 0.65.
        for (const name of [
          'title',
          'author',
          'summary',
          'readingTime',
          'readMore',
        ] as const) {
          expect(mini[name], `${locale}: the ${name}`).toBeCloseTo(
            SHARE * full[name],
            3,
          );
        }
        // The chips' label: twelve of the miniature's own pixel — the share
        // of the one it inherits — so 12/16 of its summary at every pixel
        // (PostCard's THE CHIPS FOLLOW THE PIXEL)…
        expect(mini.chip, `${locale}: the chips’ label`).toBeCloseTo(
          12 * SHARE * design,
          3,
        );
        expect(mini.chip / mini.summary).toBeCloseTo(12 / 16, 4);
        // …the share of its full card's exactly where the full card's own,
        // absolute floor is the same number — the theme's pixel and a band's
        // 1px at this root — and another wherever the full card keeps its
        // own chip pixel (0.527 of it at the step, 0.747 at the cap).
        if (design === rootPx() / 16) {
          expect(mini.chip, `${locale}: the chips’ share`).toBeCloseTo(
            SHARE * full.chip,
            3,
          );
        } else {
          expect(Math.abs(mini.chip / full.chip - SHARE)).toBeGreaterThan(0.05);
        }
        cleanup();
      }
    },
  );

  it('captures the pixel the card INHERITS — at a 20px root the theme’s pixel is 1.25px, and the miniature draws in 0.65 of it', async () => {
    const html = document.documentElement;
    const before = html.style.fontSize;
    html.style.fontSize = '20px';
    try {
      expect(rootPx()).toBe(20);
      const [pair] = await renderPairs('ro', [everyday('ro')], undefined);
      if (!pair) throw new Error('no pair rendered');
      const full = textSizesOf(pair.full);
      const mini = textSizesOf(pair.mini);
      // The full card's title is `band`'s 30 of the theme's 1.25px — and the
      // miniature's 0.65 of it, never 0.65 of a 16px root's.
      expect(full.title).toBeCloseTo(37.5, 3);
      expect(mini.title).toBeCloseTo(SHARE * 37.5, 3);
      expect(mini.summary).toBeCloseTo(SHARE * 20, 3);
      // The chips' floor rides the root too: the full card's 0.75rem over
      // 18, and the miniature's twelve of its captured pixel over 18 — in
      // the theme's pixel that very floor × the share, at this root too.
      expect(full.chip).toBeCloseTo(15, 2);
      expect(mini.chip).toBeCloseTo(SHARE * 15, 2);
    } finally {
      html.style.fontSize = before;
    }
  });

  it.each([...PIXELS, PAST])(
    'draws the chips in their own pixel, the miniature’s floor twelve of its captured pixel over 18, binding — $name',
    async ({ px: pixel }) => {
      const [pair] = await renderPairs('ro', [everyday('ro')], pixel);
      if (!pair) throw new Error('no pair rendered');
      // The pixel the miniature draws in: THE MINIATURE'S WRAPPER's
      // registered pixel, the share of the one the pair inherits.
      const design = pixel ?? rootPx() / 16;
      const wrapper = part(pair.mini.firstElementChild, 'wrapper');
      const captured = px(getComputedStyle(wrapper).getPropertyValue(PIXEL));
      expect(captured).toBeCloseTo(SHARE * design, 5);
      for (const [article, floor] of [
        [pair.full, (0.75 * rootPx()) / 18],
        [pair.mini, (12 * captured) / 18],
      ] as const) {
        const { card, list, chips } = partsOf(article);
        if (!list) throw new Error('the everyday post lists two tags');
        const expected = Math.max(floor, contentWidthOf(card) / 513.40625);
        const style = getComputedStyle(list);
        expect(
          px(style.getPropertyValue(PIXEL)),
          article === pair.mini ? 'the miniature' : 'the full card',
        ).toBeCloseTo(expected, 4);
        for (const chip of chips) {
          const chipStyle = getComputedStyle(chip);
          expect(px(chipStyle.fontSize)).toBeCloseTo(18 * expected, 2);
          expect(px(chipStyle.height)).toBeCloseTo(44 * expected, 1);
          expect(px(chipStyle.paddingInlineStart)).toBeCloseTo(
            20 * expected,
            2,
          );
          // The chips' 2px edge is no theme length: it stays.
          expect(chipStyle.borderTopWidth).toBe('2px');
        }
        // The list three of the chips' own steps in, and apart.
        expect(px(style.columnGap)).toBeCloseTo(12 * expected, 2);
      }
      // The miniature's floor ALWAYS binds: its content box over the
      // reference — 0.379 × the pixel less 0.004px — stays under its floor's
      // 0.433 × the pixel at every pixel (PostCard's THE CHIPS)…
      const mini = partsOf(pair.mini);
      expect(contentWidthOf(mini.card) / 513.40625).toBeLessThan(
        (12 * captured) / 18,
      );
      // …and in the theme's own pixel that floor is the one it replaced,
      // 0.75rem / 18 × the share, to the last digit.
      if (pixel === undefined) {
        expect((12 * captured) / 18).toBeCloseTo(
          (SHARE * 0.75 * rootPx()) / 18,
          6,
        );
      }
    },
  );
});

describe('PostCard — a miniature in any pixel is its theme-pixel self magnified (the real stylesheet)', () => {
  /** Each text of a miniature as a share of its summary — the theme's own
   *  steps: the title 30 / 16, the author 14 / 16, the reading time 1, the
   *  read-more 18 / 16 and the chips' label 12 / 16. */
  const RATIOS = {
    title: 30 / 16,
    author: 14 / 16,
    readingTime: 1,
    readMore: 18 / 16,
    chip: 12 / 16,
  } as const;

  it.each([...PIXELS, PAST])(
    'keeps every text, the chips’ label among them, in its theme ratio to the summary — $name',
    async ({ px: pixel }) => {
      const design = pixel ?? rootPx() / 16;
      for (const locale of ['ro', 'de'] as const) {
        const [pair] = await renderPairs(locale, [everyday(locale)], pixel);
        if (!pair) throw new Error('no pair rendered');
        const mini = textSizesOf(pair.mini);
        expect(mini.summary, `${locale}: the summary`).toBeCloseTo(
          16 * SHARE * design,
          3,
        );
        for (const name of Object.keys(RATIOS) as (keyof typeof RATIOS)[]) {
          expect(
            mini[name] / mini.summary,
            `${locale}: the ${name}, ${mini[name]} beside ${mini.summary}`,
          ).toBeCloseTo(RATIOS[name], 4);
        }
        cleanup();
      }
    },
  );

  it('holds the title on 30 design pixels past `band`’s step, where a full card steps up — 2.5px', async () => {
    const [pair] = await renderPairs('ro', [everyday('ro')], PAST.px);
    if (!pair) throw new Error('no pair rendered');
    const full = partsOf(pair.full);
    const mini = partsOf(pair.mini);
    // THE PREMISE: both content boxes past the title's `@md` step, 28rem.
    expect(contentWidthOf(mini.card)).toBeGreaterThanOrEqual(28 * rootPx());
    expect(contentWidthOf(full.card)).toBeGreaterThanOrEqual(28 * rootPx());
    const size = (element: Element): number =>
      px(getComputedStyle(element).fontSize);
    // The full card steps up: `band`'s 36 of its design pixels.
    expect(size(full.title)).toBeCloseTo(36 * PAST.px, 3);
    // The miniature holds `section`'s 30 of its own — 48.75px at 2.5.
    expect(size(mini.title)).toBeCloseTo(30 * SHARE * PAST.px, 3);
    expect(size(mini.title) / size(mini.summary)).toBeCloseTo(30 / 16, 4);
    // THE PIN IS LOAD-BEARING: `band`'s container row put back on the
    // miniature's title takes it to 36 of its pixels — 58.5px at 2.5.
    mini.title.classList.add(BAND_ROW);
    try {
      expect(size(mini.title)).toBeCloseTo(36 * SHARE * PAST.px, 3);
    } finally {
      mini.title.classList.remove(BAND_ROW);
    }
  });

  it.each(PIXELS)(
    'moved no title a page drew: under 28rem up to the cap, `band`’s row put back changes nothing — $name',
    async ({ px: pixel }) => {
      const [pair] = await renderPairs('ro', [everyday('ro')], pixel);
      if (!pair) throw new Error('no pair rendered');
      const mini = partsOf(pair.mini);
      expect(contentWidthOf(mini.card)).toBeLessThan(28 * rootPx());
      const before = getComputedStyle(mini.title);
      const [size, line] = [before.fontSize, before.lineHeight];
      mini.title.classList.add(BAND_ROW);
      try {
        const after = getComputedStyle(mini.title);
        expect(after.fontSize).toBe(size);
        expect(after.lineHeight).toBe(line);
      } finally {
        mini.title.classList.remove(BAND_ROW);
      }
    },
  );
});

describe('PostCard — the miniature keeps the px parts in px, and its geometry to the residuals they leave (THE MINIATURE, the real stylesheet)', () => {
  it.each(PIXELS)(
    'keeps the 3px frame and the link layer’s 3px inset; draws the padding, the corner and the gaps at the share — $name',
    async ({ px: pixel }) => {
      const [pair] = await renderPairs('ro', [everyday('ro')], pixel);
      if (!pair) throw new Error('no pair rendered');
      const full = partsOf(pair.full);
      const mini = partsOf(pair.mini);
      const fullCard = getComputedStyle(full.card);
      const miniCard = getComputedStyle(mini.card);
      // The frame, in CSS px on both (ui/Card's THE SUM RULE: a border
      // floors to whole device pixels).
      expect(fullCard.borderTopWidth).toBe(`${FRAME}px`);
      expect(miniCard.borderTopWidth).toBe(`${FRAME}px`);
      // The padding is six steps less 2px: the steps at the share, the 2px
      // not — so (padding + 2) is exactly the share of the full card's.
      expect(px(miniCard.paddingTop) + 2).toBeCloseTo(
        SHARE * (px(fullCard.paddingTop) + 2),
        3,
      );
      // The soft corner, the words' gap and the read-more's box: theme
      // lengths, at the share.
      expect(px(miniCard.borderTopLeftRadius)).toBeCloseTo(
        SHARE * px(fullCard.borderTopLeftRadius),
        3,
      );
      expect(px(getComputedStyle(mini.words).rowGap)).toBeCloseTo(
        SHARE * px(getComputedStyle(full.words).rowGap),
        3,
      );
      expect(px(getComputedStyle(mini.label).minHeight)).toBeCloseTo(
        SHARE * px(getComputedStyle(full.label).minHeight),
        3,
      );
      // The picture's top corners: the card's corner less the 3px frame, on
      // both.
      expect(px(getComputedStyle(mini.cell).borderTopLeftRadius)).toBeCloseTo(
        px(miniCard.borderTopLeftRadius) - FRAME,
        3,
      );
      // The link's layer: the frame taken back, 3px, on both.
      for (const link of [full.link, mini.link]) {
        expect(getComputedStyle(link, '::before').top).toBe(`-${FRAME}px`);
      }
    },
  );

  it('draws the keyboard’s ring round the miniature in CSS px — 2px of `--focus` at a 2px offset, as on the full card', async () => {
    const [pair] = await renderPairs('ro', [everyday('ro')], undefined);
    if (!pair) throw new Error('no pair rendered');
    const { link } = partsOf(pair.mini);
    // A REAL Tab: the full card's link first, then the miniature's.
    await realUser.tab();
    await realUser.tab();
    expect(document.activeElement).toBe(link);
    expect(link.matches(':focus-visible')).toBe(true);
    const ring = getComputedStyle(link, '::before');
    expect(ring.outlineStyle).toBe('solid');
    expect(ring.outlineWidth).toBe('2px');
    expect(ring.outlineOffset).toBe('2px');
    link.blur();
  });

  it.each(PIXELS)(
    'draws the picture 3:2 of the card less its frames — the share of the full card’s less 4 × (1 − share) px — and the content box the share less 2 × (1 − share) px — $name',
    async ({ px: pixel }) => {
      const [pair] = await renderPairs('ro', [everyday('ro')], pixel);
      if (!pair) throw new Error('no pair rendered');
      const full = partsOf(pair.full);
      const mini = partsOf(pair.mini);
      const picture = (cell: HTMLElement) => px(getComputedStyle(cell).height);
      // The cell spans the card less its two 3px frames, at 3:2: so the
      // miniature's is the share of the full card's less (1 − share) × 6 /
      // 1.5 — 1.4px at 0.65.
      expect(picture(mini.cell)).toBeCloseTo(
        SHARE * picture(full.cell) - 4 * (1 - SHARE),
        1,
      );
      // The content box: border + padding is six steps and 1px a side, so
      // the miniature's is the share of the full card's less 2 × (1 −
      // share) px — 0.70px at 0.65 — to the engine's 1/64px layout unit.
      expect(contentWidthOf(mini.card)).toBeCloseTo(
        SHARE * contentWidthOf(full.card) - 2 * (1 - SHARE),
        1,
      );
    },
  );
});

describe('PostCard — every miniature of every post the blog ships, against its full card (THE MINIATURE, the real faces)', () => {
  /** A card's height and its four in-flow blocks' — layout values. */
  const heightsOf = (article: HTMLElement) => {
    const p = partsOf(article);
    const height = (element: Element) => px(getComputedStyle(element).height);
    return {
      card: height(p.card),
      blocks: [p.title, p.author, p.summary, p.footer].map(height),
    };
  };

  it.each(PIXELS)(
    'lays every post out in the five languages with its full card’s height arithmetic — the share of it less 2 × (1 − share) px, plus whatever its blocks gained — $name',
    async ({ px: pixel }) => {
      for (const locale of locales) {
        const pairs = await renderPairs(
          locale,
          postsIn(locale).map((post) => cardOf(locale, post)),
          pixel,
        );
        expect(pairs.length).toBeGreaterThan(0);
        for (const { full, mini } of pairs) {
          const a = heightsOf(full);
          const b = heightsOf(mini);
          // What the blocks gained over the share — 0 where every block's
          // lines agree: a line the optical size moved, and only that.
          const gained = b.blocks.reduce(
            (sum, block, index) => sum + block - SHARE * (a.blocks[index] ?? 0),
            0,
          );
          // The residual of the px parts (THE MINIATURE): border + padding is
          // six steps and 1px a side, the picture the card less its 3px
          // frames — together 2 × (1 − share) px, 0.70px at 0.65 — to a
          // quarter pixel of the engine's 1/64px rounding.
          expect(
            Math.abs(b.card - SHARE * a.card - gained + 2 * (1 - SHARE)),
            `${locale} „${partsOf(full).title.textContent ?? ''}"`,
          ).toBeLessThan(0.25);
        }
        cleanup();
      }
    },
  );

  /** The rows a card's chips stand on, and whether its footer row wrapped —
   *  layout offsets, which no jump moves. */
  const rowsOf = (article: HTMLElement) => {
    const p = partsOf(article);
    return {
      chips: new Set(p.chips.map((chip) => chip.offsetTop)).size,
      footer: p.link.offsetTop > p.time.offsetTop + 1 ? 'wrapped' : 'one line',
    };
  };

  it.for(PIXELS)(
    'sets every title and summary on its full card’s lines or one off — never two — and every title word whole; the readings that differ, and any author, chip or footer row that moved, are annotated — $name',
    async ({ px: pixel }, { annotate }) => {
      const moved: string[] = [];
      const others: string[] = [];
      let readings = 0;
      for (const locale of locales) {
        const pairs = await renderPairs(
          locale,
          postsIn(locale).map((post) => cardOf(locale, post)),
          pixel,
        );
        for (const { full, mini } of pairs) {
          const a = partsOf(full);
          const b = partsOf(mini);
          const name = `${locale} „${a.title.textContent ?? ''}"`;
          for (const block of ['title', 'summary'] as const) {
            readings += 1;
            const delta = linesOf(b[block]) - linesOf(a[block]);
            // The bound that holds on any engine (the header): one line
            // either way at most — the measured readings are one MORE.
            expect(Math.abs(delta), `${name} ${block}`).toBeLessThanOrEqual(1);
            if (delta !== 0) {
              moved.push(
                `${name} ${block} ${linesOf(a[block])} → ${linesOf(b[block])}`,
              );
            }
          }
          // THE TITLE NEVER SPLITS A WORD — on the miniature's line too: its
          // words at the share, its line the share less 0.7px.
          expect(unitsAcrossLines(b.title), name).toEqual([]);
          // The author's lines, the chips' rows and the footer row: the same
          // on both in every pair this Mac measured — recorded here, never
          // failed on, since each is a line the typeface decides.
          const [rowsA, rowsB] = [rowsOf(full), rowsOf(mini)];
          if (linesOf(a.author) !== linesOf(b.author)) {
            others.push(
              `${name} author ${linesOf(a.author)} → ${linesOf(b.author)}`,
            );
          }
          if (rowsA.chips !== rowsB.chips) {
            others.push(`${name} chip rows ${rowsA.chips} → ${rowsB.chips}`);
          }
          if (rowsA.footer !== rowsB.footer) {
            others.push(`${name} footer ${rowsA.footer} → ${rowsB.footer}`);
          }
        }
        cleanup();
      }
      await annotate(
        `${moved.length} of ${readings} title and summary readings took another number of lines${moved.length === 0 ? '' : `: ${moved.join(' · ')}`}`,
      );
      await annotate(
        others.length === 0
          ? 'every author line, chip row and footer row the same'
          : `moved besides: ${others.join(' · ')}`,
      );
    },
  );
});

describe('PostCard — THE MINIATURE’S WRAPPER moved nothing that leans on ui/Card (the real stylesheet, a real pointer)', () => {
  /** The centre of a box on screen. */
  const centreOf = (element: Element): readonly [number, number] => {
    const box = element.getBoundingClientRect();
    return [box.left + box.width / 2, box.top + box.height / 2];
  };

  /** What a press at a point lands on — the engine's own hit test — and the
   *  link that holds it, if any. */
  const linkAt = (x: number, y: number): Element | null =>
    document.elementFromPoint(x, y)?.closest('a') ?? null;

  it.each(PIXELS)(
    'stands the wrapper between the <article> and ui/Card, plain and positionless; the Card stays the chips’ query container and their positioning scope — the cqw half and THE TAGS’ inset read off the Card — $name',
    async ({ px: pixel }) => {
      const [pair] = await renderPairs('ro', [everyday('ro')], pixel);
      if (!pair) throw new Error('no pair rendered');
      const wrapper = part(pair.mini.firstElementChild, 'wrapper');
      const { card, cell, list, chips } = partsOf(pair.mini);
      if (!list) throw new Error('the everyday post lists two tags');
      // The wrapper: no position, no container — so nothing inside it can
      // resolve against it; and the Card still both.
      const wrapperStyle = getComputedStyle(wrapper);
      expect(wrapperStyle.position).toBe('static');
      expect(wrapperStyle.containerType).toBe('normal');
      expect(getComputedStyle(card).position).toBe('relative');
      expect(getComputedStyle(card).containerType).toBe('inline-size');
      // The chips' `cqw` half reads off the Card. A miniature's chips sit on
      // their floor at every pixel since 2026-10-25 (PostCard's THE CHIPS),
      // so the half is read ALONE: the list's pixel set to it for one
      // reading — the Card's content width over the owner's reference, which
      // only the Card as the list's nearest container gives — then put back.
      const own = list.style.getPropertyValue(PIXEL);
      list.style.setProperty(PIXEL, 'calc(100cqw / 513.40625)');
      try {
        expect(px(getComputedStyle(list).getPropertyValue(PIXEL))).toBeCloseTo(
          contentWidthOf(card) / 513.40625,
          4,
        );
      } finally {
        list.style.setProperty(PIXEL, own);
      }
      // …and the pixel the chips draw in is at least that half, everywhere.
      const pixelOfChips = px(getComputedStyle(list).getPropertyValue(PIXEL));
      expect(pixelOfChips).toBeGreaterThanOrEqual(
        contentWidthOf(card) / 513.40625 - 1e-4,
      );
      // THE TAGS: three of the chips' own steps in from the picture's
      // top-right corner, the picture spanning the Card's padding box.
      const listBox = list.getBoundingClientRect();
      const pictureBox = cell.getBoundingClientRect();
      expect(listBox.top - pictureBox.top).toBeCloseTo(12 * pixelOfChips, 1);
      expect(pictureBox.right - listBox.right).toBeCloseTo(
        12 * pixelOfChips,
        1,
      );
      expect(chips.length).toBeGreaterThan(0);
    },
  );

  it.each(PIXELS)(
    'lays the link’s layer over the Card’s border box and answers a press anywhere on the miniature with its link — the picture, each chip, the title, the author, the summary, the reading time, the label and the frame — and nowhere past it — $name',
    async ({ px: pixel }) => {
      const [pair] = await renderPairs('ro', [everyday('ro')], pixel);
      if (!pair) throw new Error('no pair rendered');
      const p = partsOf(pair.mini);
      // THE PREMISE: the engine hit-tests the VIEWPORT alone, and the pair
      // stands one card under the other, the miniature below the runner's
      // fold — so the full card's slot leaves the flow (the miniature keeps
      // its box and its pixel) and the miniature must fit the viewport
      // before a point on it is asked.
      part(pair.full.parentElement, 'full card’s slot').style.display = 'none';
      expect(p.card.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
      expect(p.card.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        window.innerHeight,
      );
      const layer = getComputedStyle(p.link, '::before');
      for (const side of ['top', 'right', 'bottom', 'left'] as const) {
        expect(layer[side]).toBe(`-${FRAME}px`);
      }
      for (const target of [
        p.cell,
        ...p.chips,
        p.title,
        p.author,
        p.summary,
        p.time,
        p.label,
      ]) {
        expect(
          linkAt(...centreOf(target)),
          `a press on „${target.textContent || target.tagName}"`,
        ).toBe(p.link);
      }
      const box = p.card.getBoundingClientRect();
      const [midX, midY] = [box.left + box.width / 2, box.top + box.height / 2];
      for (const [x, y] of [
        [box.left + 0.5, midY],
        [box.right - 0.5, midY],
        [midX, box.top + 0.5],
        [midX, box.bottom - 0.5],
      ] as const) {
        expect(linkAt(x, y), `the frame at (${x}, ${y})`).toBe(p.link);
      }
      expect(linkAt(box.right + 2, midY)).not.toBe(p.link);
      expect(linkAt(midX, box.bottom + 2)).not.toBe(p.link);
    },
  );

  it('jumps the <article> on a real hover — 105 %, the wrapper and the Card inside it untransformed — and draws the read-more’s underline', async () => {
    // THE PREMISE: a device that hovers — the jump answers `(hover: hover)`.
    expect(matchMedia('(hover: hover)').matches).toBe(true);
    const [pair] = await renderPairs('ro', [everyday('ro')], undefined);
    if (!pair) throw new Error('no pair rendered');
    const p = partsOf(pair.mini);
    const wrapper = part(pair.mini.firstElementChild, 'wrapper');
    const scaleOf = (element: Element): string =>
      getComputedStyle(element).scale;
    expect(pair.mini.matches(':hover')).toBe(false);
    // FORCED: the link's layer lies over the whole card, so the pointer goes
    // on the title's centre as it stands, where the link takes it.
    await realUser.hover(p.title, { force: true });
    expect(pair.mini.matches(':hover')).toBe(true);
    expect(scaleOf(pair.mini)).toBe('1.05');
    expect(scaleOf(wrapper)).toBe('none');
    expect(scaleOf(p.card)).toBe('none');
    expect(getComputedStyle(p.label, '::after').scale.split(' ')[0]).toBe('1');
    // The painted card is the laid-out one at 105 %, about its centre.
    expect(
      pair.mini.getBoundingClientRect().width /
        px(getComputedStyle(pair.mini).width),
    ).toBeCloseTo(1.05, 3);
  });

  it('holds a miniature with `jump={false}` still under a real hover, the underline drawn', async () => {
    // THE PREMISE: a device that hovers, where the jump would answer.
    expect(matchMedia('(hover: hover)').matches).toBe(true);
    const [pair] = await renderPairs(
      'ro',
      [{ ...everyday('ro'), jump: false }],
      undefined,
    );
    if (!pair) throw new Error('no pair rendered');
    const p = partsOf(pair.mini);
    const wrapper = part(pair.mini.firstElementChild, 'wrapper');
    expect(pair.mini.matches(':hover')).toBe(false);
    // FORCED, as above: the link's layer lies over the whole card.
    await realUser.hover(p.title, { force: true });
    expect(pair.mini.matches(':hover')).toBe(true);
    for (const element of [pair.mini, wrapper, p.card]) {
      expect(getComputedStyle(element).scale).toBe('none');
    }
    expect(getComputedStyle(p.label, '::after').scale.split(' ')[0]).toBe('1');
    // The painted card is the laid-out one: nothing grew.
    expect(
      pair.mini.getBoundingClientRect().width /
        px(getComputedStyle(pair.mini).width),
    ).toBeCloseTo(1, 3);
  });
});

describe('PostCard — the miniature as the DOM carries it', () => {
  it('puts ONE number in the DOM — the share, inline on the <article> — and the chips’ pixel inline on the tag list; the full card carries neither', async () => {
    const [pair] = await renderPairs('ro', [everyday('ro')], undefined);
    if (!pair) throw new Error('no pair rendered');
    expect(pair.mini.style.getPropertyValue('--miniature')).toBe(String(SHARE));
    expect(pair.full.getAttribute('style')).toBeNull();
    // The chips' pixel reads the CAPTURED pixel, never the share itself
    // (PostCard's THE CHIPS).
    const list = partsOf(pair.mini).list;
    expect(list?.style.getPropertyValue(PIXEL)).toMatch(
      /var\(--miniature-px\)/,
    );
    expect(list?.style.getPropertyValue(PIXEL)).not.toMatch(
      /var\(--miniature\)/,
    );
    expect(partsOf(pair.full).list?.getAttribute('style')).toBeNull();
    // The tag list is still named, still a list — the chips' pixel moved,
    // nothing else.
    expect(
      within(pair.mini).getByRole('list', { name: 'Categorii' }),
    ).toBeInstanceOf(HTMLUListElement);
  });

  it('is a miniature at ANY share, 1 included — found by its wrapper, never by a share a caller’s own style sets on a full card', () => {
    // The wrapper is drawn at 1 too, so this suite finds ui/Card by the
    // WRAPPER (`isMiniature`), never by the share's number…
    const { container } = render(
      <PostCard {...everyday('ro')} miniature={1} />,
    );
    const article = part(container.querySelector('article'), 'article');
    const wrapper = part(article.firstElementChild, 'wrapper');
    expect(article.style.getPropertyValue('--miniature')).toBe('1');
    expect(isMiniature(article)).toBe(true);
    // ui/Card is the WRAPPER's one child — the query container, the
    // positioned scope — and the wrapper is neither.
    const card = frameOf(article);
    expect(card).toBe(wrapper.firstElementChild);
    expect(getComputedStyle(card).containerType).toBe('inline-size');
    expect(getComputedStyle(wrapper).containerType).toBe('normal');
    expect(partsOf(article).cell).toBe(card.firstElementChild);
    // …nor by the share's PRESENCE: a full card whose caller's own style
    // sets the variable draws no wrapper, so ui/Card stays its one child.
    const { container: other } = render(
      <PostCard
        {...everyday('ro')}
        style={{ '--miniature': '0.65' } as CSSProperties}
      />,
    );
    const full = part(other.querySelector('article'), 'full card’s article');
    expect(full.style.getPropertyValue('--miniature')).toBe('0.65');
    expect(isMiniature(full)).toBe(false);
    expect(frameOf(full)).toBe(full.firstElementChild);
    expect(getComputedStyle(frameOf(full)).containerType).toBe('inline-size');
  });
});
