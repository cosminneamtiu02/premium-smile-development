import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type {
  BeforeAfterPair,
  BeforeAfterProps,
} from '@/components/sections/BeforeAfter/BeforeAfter';
import type {
  CardCarouselLabels,
  CardCarouselMode,
} from '@/components/sections/CardCarousel/CardCarousel';
import type { PostConclusionOwnProps } from '@/components/sections/PostConclusion/PostConclusion';
import type { PostCoverOwnProps } from '@/components/sections/PostCover/PostCover';
import type {
  GalleryCard,
  PostGalleryProps,
} from '@/components/sections/PostGallery/PostGallery';
import {
  POST_PHOTO_SIZES,
  type PostPhotoContent,
  type PostPhotoImage,
} from '@/components/sections/PostPhoto/PostPhoto';
import type { PostProseItem } from '@/components/sections/PostProse/PostProse';
import type { ShareLinksProps } from '@/components/sections/ShareLinks/ShareLinks';
import {
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { PostPage, type PostPageBlock, type PostPageProps } from './PostPage';
import { DEMO_ADDRESS, DEMO_PAGE } from './PostPage.fixtures';
import source from './PostPage.tsx?raw';

// sections/PostPage — the interaction suite. Role-based queries wherever a
// role exists (§9, §13): the band is found as the `article` named by its
// title, the title as the page's one level-1 heading, the share controls as
// the `list` named by its label, each gallery as the carousel's `region`
// named by its own numbered label („Galerie foto 2 din 2") and its beads as
// the `group` named by the page's picker word, the blog photos, the
// before/after halves and the conclusion as `figure`s. The boxes that carry
// no role — the rhythm box, the measure, the cover, a pair's box — are
// reached by STRUCTURE from the <h1>, the way the stories reach them. A
// figure is never looked up BY NAME here:
// Testing Library's accessibility engine (dom-accessibility-api 0.5) reads a
// <figure> as nameless — and so, measured on 2026-10-20, does Chromium 151's
// own accessibility tree; HTML-AAM's rule names it by its <figcaption>, and
// Playwright's role engine applies that rule (sections/PostPhoto's THE
// HEADING) — so a figure's heading is read here as its caption's text.
//
// ── HARNESS NOTE — there is NO NextIntlClientProvider in this file, and the
// absence is itself an assertion (the PostList and PostCard precedent):
// next-intl's hooks throw without one, so a green render proves the band and
// everything it composes call no t(). NOTHING IS MOCKED: a dumb band needs no
// router, no clock and no data.
//
// ── STYLES ARE NOT LOADED in this project (tests/setup/components.ts imports
// no stylesheet), so the utility TOKENS are the layout's contract here —
// written OUT below rather than imported (the ui/Eyebrow RECIPE convention),
// so a silent edit fails HERE. ui/Container's two band strings are the one
// exception, imported on purpose: what this suite holds is that the band
// wears THOSE strings, whatever their bytes (tests/unit/design-scale.test.ts
// holds the bytes). What the real stylesheet does with the tokens — the
// stack's 3rem, the measure's 42rem, the design pixel — is
// PostPage.stories.tsx's business.
//
// ── THE PICTURES IN THIS RUNNER: the optimizer's width variants do not exist
// here, so every <img> 404s and the optimizer swaps to the original file on
// the error event, at a macrotask boundary. Every picture assertion is
// therefore SYNCHRONOUS — render, read, assert (the PostCard suite's rule).
//
// ── THE DATA is the band's own fixture (./PostPage.fixtures.ts): the demo
// article whole, copied — never the route's populator. Its twenty runs hold
// every block kind the band knows, EVERY INSTANCE of the two picture blocks
// the owner listed (2026-10-15) — four blog photos and four pairs, with a
// heading and a note, a heading alone, a note alone, neither — and both
// instances of the carousel since 2026-10-17: TWO galleries, the ring
// („loop") and then the end-to-end list („bounded"), each with three cards
// in its window — a gallery's only one, which no block names — eight cards
// in each, every region named by its own number.

// THE RECIPES, written out.
/** The rhythm box's own classes (the header's THE RHYTHM BOX): the stack and
 *  the privacy policy's three steps, top and bottom alike. */
const RHYTHM = [
  'flex',
  'flex-col',
  'gap-12',
  'py-12',
  '@lg:py-16',
  '@3xl:py-20',
];
/** The measure (the header's THE MEASURE). */
const MEASURE = [
  'mx-auto',
  'flex',
  'w-full',
  'max-w-2xl',
  'flex-col',
  'gap-10',
];

/** Read through the ATTRIBUTE, the same bytes on HTML and SVG elements. */
const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/** A class string's tokens. */
const split = (classes: string): string[] =>
  classes.split(/\s+/).filter(Boolean);

const renderPage = (overrides: Partial<PostPageProps> = {}) =>
  render(<PostPage {...DEMO_PAGE} {...overrides} />);

const pageTitle = (): HTMLElement =>
  screen.getByRole('heading', { level: 1, name: DEMO_PAGE.header.title });

/** The band's boxes, reached from the <h1> by structure: the opener
 *  (PostHeader's <header>), the rhythm box, ui/Container's column, the
 *  <article>; and the rhythm box's other two children, the cover and the
 *  measure. */
const partsOf = (h1: HTMLElement) => {
  const header = h1.parentElement as HTMLElement;
  const rhythm = header.parentElement as HTMLElement;
  const column = rhythm.parentElement as HTMLElement;
  return {
    header,
    rhythm,
    column,
    article: column.parentElement as HTMLElement,
    cover: rhythm.children[1] as HTMLElement,
    measure: rhythm.children[2] as HTMLElement,
  };
};

/** The demo's blocks, read as the band's own type — so a switch on `kind`
 *  narrows to a block's whole shape, its optional parts optional. */
const BLOCKS: readonly PostPageBlock[] = DEMO_PAGE.blocks;

/** Every block of a kind the demo holds, in the article's order — the
 *  fixture's own, never retyped. */
const blocksOf = <K extends PostPageBlock['kind']>(
  kind: K,
): Extract<PostPageBlock, { kind: K }>[] =>
  BLOCKS.filter(
    (entry): entry is Extract<PostPageBlock, { kind: K }> =>
      entry.kind === kind,
  );

/** The demo's first block of a kind. */
const blockOf = <K extends PostPageBlock['kind']>(
  kind: K,
): Extract<PostPageBlock, { kind: K }> => {
  const [block] = blocksOf(kind);
  if (!block) throw new Error(`the demo has no ${kind} block`);
  return block;
};

const PROSE = blockOf('prose');
/** The two galleries, in the article's order — and the first of them, the
 *  ring, for the suites that need one. */
const GALLERIES = blocksOf('gallery');
const GALLERY = blockOf('gallery');
/** Every card the galleries hold, both galleries counted (two since
 *  2026-10-17). */
const GALLERY_CARDS = GALLERIES.reduce(
  (sum, gallery) => sum + gallery.cards.length,
  0,
);
/** The four blog photos and the four pairs, in the article's order. */
const PHOTOS = blocksOf('photo');
const PAIRS = blocksOf('beforeAfter');
/** The article's first pair — its headings alone, „La sosire" / „În
 *  cabinet". */
const BEFORE_AFTER = blockOf('beforeAfter');

type PairBlock = Extract<PostPageBlock, { kind: 'beforeAfter' }>;

/** A pair's two halves, the before first. */
const HALVES = ['before', 'after'] as const;

/** A pair's halves as the blog photos it draws (sections/BeforeAfter's EACH
 *  HALF IS A BLOG PHOTO): each half its picture, and the pair's heading and
 *  note for that half when the pair has them. */
const halvesOf = (pair: PairBlock): PostPhotoContent[] =>
  HALVES.map((half) => ({
    image: pair.images[half],
    heading: pair.headings?.[half],
    note: pair.notes?.[half],
  }));

/** A picture block's instance, the route suite's spelling: `H` for a heading
 *  (both of a pair's), `N` for a note (both of a pair's), `-` for each it
 *  lacks. */
const shapeOf = (heading: unknown, note: unknown): string =>
  `${heading === undefined ? '-' : 'H'}${note === undefined ? '-' : 'N'}`;

/** One part of a blog photo's <figure>: its tag and its words — a caption's
 *  or a note's text, and for the picture's box its picture's alt. */
type Part = readonly [tag: string, words: string];

/** The parts a blog photo's <figure> must hold, in DOM order — sections/
 *  PostPhoto's THE LAYOUT: its heading as the caption when it has one, the
 *  picture's box, its FINISHED note as a <p> when it has one; nothing else. */
const partsWanted = (photo: PostPhotoContent): Part[] => [
  ...(photo.heading === undefined
    ? []
    : [['FIGCAPTION', photo.heading] as const]),
  ['DIV', photo.image.alt],
  ...(photo.note === undefined ? [] : [['P', photo.note] as const]),
];

/** The parts a <figure> holds, read in DOM order. */
const partsShown = (figure: Element): Part[] =>
  [...figure.children].map((child): Part => [
    child.tagName,
    child.tagName === 'DIV'
      ? (child.querySelector('img')?.getAttribute('alt') ?? '')
      : (child.textContent ?? ''),
  ]);

/** Every subheading the blocks carry, in order. */
const subheadingsOf = (blocks: readonly PostPageBlock[]): string[] =>
  blocks.flatMap((block) =>
    block.kind === 'prose'
      ? block.items
          .filter((item) => item.kind === 'heading')
          .map((item) => item.text)
      : [],
  );

/**
 * The band's source with its PROSE removed — what the zero-island and
 * exhaustiveness guards run against (the PostList suite's mechanism): the
 * header names `'use client'`, t() and the cases by name.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);

describe('PostPage — the article and its name', () => {
  it('renders ONE <article> named by the page’s one <h1>, the post’s title', () => {
    renderPage();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const h1 = pageTitle();
    expect(h1.tagName).toBe('H1');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    const article = screen.getByRole('article', {
      name: DEMO_PAGE.header.title,
    });
    expect(article.tagName).toBe('ARTICLE');
    expect(article).toContainElement(h1);
    expect(partsOf(h1).article).toBe(article);
  });

  it('ties the name by id — `aria-labelledby` on the <article> is the <h1>’s own id', () => {
    renderPage();

    const h1 = pageTitle();
    const { article } = partsOf(h1);
    expect(h1.id).not.toBe('');
    expect(article).toHaveAttribute('aria-labelledby', h1.id);
  });

  it('gives every article its own id — two pages never share one', () => {
    render(
      <>
        <PostPage {...DEMO_PAGE} />
        <PostPage {...DEMO_PAGE} />
      </>,
    );

    const [first, second] = screen.getAllByRole('article');
    if (!first || !second) throw new Error('two articles expected');
    expect(first.getAttribute('aria-labelledby')).not.toBe(
      second.getAttribute('aria-labelledby'),
    );
    for (const article of [first, second]) {
      const h1 = within(article).getByRole('heading', { level: 1 });
      expect(article).toHaveAttribute('aria-labelledby', h1.id);
    }
  });

  it('keeps its own name against a caller’s — THE BELT: a smuggled `aria-labelledby` never lands, an `aria-label` and a `role` are reset', () => {
    // TypeScript exempts a hyphenated JSX attribute from its excess-property
    // check, so the Omit alone refuses neither ARIA name; a `role` the type
    // does refuse in JSX, but a spread of a wider object still carries one —
    // the spread is how all three come.
    const smuggled = {
      'aria-labelledby': 'alt-titlu',
      'aria-label': 'Alt nume',
      role: 'presentation',
    } as unknown as Partial<PostPageProps>;
    renderPage(smuggled);

    const h1 = pageTitle();
    const { article } = partsOf(h1);
    expect(article).toHaveAttribute('aria-labelledby', h1.id);
    expect(article).not.toHaveAttribute('aria-label');
    // The element stays an article: no role of a caller's stands on it.
    expect(article).not.toHaveAttribute('role');
    expect(screen.getByRole('article', { name: DEMO_PAGE.header.title })).toBe(
      article,
    );
  });
});

describe('PostPage — the composition, in the page’s order', () => {
  it('stacks the opener, the cover and the measure — in that order, alone — in the one rhythm box', () => {
    renderPage();

    const h1 = pageTitle();
    const { header, rhythm, column, article, cover, measure } = partsOf(h1);
    expect(header.tagName).toBe('HEADER');
    expect([...rhythm.children]).toEqual([header, cover, measure]);
    // ui/Container's column is the rhythm box's only parent, the <article>'s
    // only child: no stray box between the band and its column.
    expect([...column.children]).toEqual([rhythm]);
    expect([...article.children]).toEqual([column]);
    // The by-line right under the title (PostHeader's own order).
    expect(h1.nextElementSibling).toHaveTextContent(DEMO_PAGE.header.byline);
  });

  it('builds the cover from its content — the reading time, the share controls in its slot, the picture, the categories', () => {
    renderPage();

    const { cover } = partsOf(pageTitle());
    expect(within(cover).getByText(DEMO_PAGE.cover.readingTime).tagName).toBe(
      'P',
    );
    const shareList = within(cover).getByRole('list', {
      name: DEMO_PAGE.share.label,
    });
    expect(shareList).toBeInTheDocument();
    const tags = within(cover).getByRole('list', {
      name: DEMO_PAGE.cover.tagsLabel,
    });
    expect(
      within(tags)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([...DEMO_PAGE.cover.tags]);
    expect(cover.querySelectorAll('img')).toHaveLength(1);
  });

  it('hands the share controls their addresses and their words as given — three links and the copy button', () => {
    renderPage();

    const list = screen.getByRole('list', { name: DEMO_PAGE.share.label });
    const { facebook, whatsapp, email, copy } = DEMO_PAGE.share;
    for (const link of [facebook, whatsapp, email]) {
      expect(
        within(list).getByRole('link', { name: link.name }),
      ).toHaveAttribute('href', link.href);
    }
    expect(
      within(list).getByRole('button', { name: copy.label }),
    ).toBeInTheDocument();
    // The addresses share the article's own address, encoded.
    expect(facebook.href).toContain(encodeURIComponent(DEMO_ADDRESS));
  });

  it('lays the blocks into the measure BY KIND, in the article’s order — and the conclusion LAST', () => {
    renderPage();

    const { measure } = partsOf(pageTitle());
    const children = [...measure.children] as HTMLElement[];
    expect(children).toHaveLength(BLOCKS.length + 1);

    BLOCKS.forEach((block, index) => {
      const box = children[index] as HTMLElement;
      switch (block.kind) {
        case 'prose':
          // PostProse: one <p> per paragraph, one <h2> per subheading.
          expect(
            [...box.children].map((child) => [
              child.tagName,
              child.textContent,
            ]),
          ).toEqual(
            block.items.map((item) => [
              item.kind === 'heading' ? 'H2' : 'P',
              item.text,
            ]),
          );
          break;
        case 'gallery': {
          // PostGallery: sections/CardCarousel's <section>, a region named by
          // the page's words — its own number, so the page's one region of
          // that name IS this box — with its roledescription, prev and next,
          // its beads, and one labelled card group per card — the side cards
          // inert previews (aria-hidden), so the groups are read hidden or
          // not.
          expect(box.tagName).toBe('SECTION');
          expect(
            screen.getByRole('region', { name: block.labels.region }),
          ).toBe(box);
          expect(box).toHaveAttribute(
            'aria-roledescription',
            block.labels.role,
          );
          // prev and next, each named by the page's words, whatever the
          // carousel shows of them: the ring's two are always live, and the
          // end-to-end list, on its first card at the first render, has
          // somewhere to go next. (At that end the list's previous is
          // disabled — the witness of the MODE the band hands on, the test
          // 'hands every gallery its MODE' below.)
          const previous = within(box).getByRole('button', {
            name: block.labels.previous,
          });
          const next = within(box).getByRole('button', {
            name: block.labels.next,
          });
          expect(next).toBeEnabled();
          if (block.mode === 'loop') expect(previous).toBeEnabled();
          // THE BEADS: a group named by the page's picker word, one bead per
          // card named as its card — and the region's buttons in the DOM's
          // order: previous, next, then the beads.
          const beads = within(box).getByRole('group', {
            name: block.labels.picker,
          });
          expect(
            within(beads)
              .getAllByRole('button')
              .map((bead) => bead.getAttribute('aria-label')),
          ).toEqual([...block.slideLabels]);
          expect(
            within(box)
              .getAllByRole('button')
              .map((button) => button.getAttribute('aria-label')),
          ).toEqual([
            block.labels.previous,
            block.labels.next,
            ...block.slideLabels,
          ]);
          // The card groups — the slide's roledescription tells them from
          // the beads' group.
          const groups = within(box)
            .getAllByRole('group', { hidden: true })
            .filter(
              (group) =>
                group.getAttribute('aria-roledescription') ===
                block.labels.slideRole,
            );
          expect(
            groups.map((group) => group.getAttribute('aria-label')),
          ).toEqual([...block.slideLabels]);
          // The beads come before every card in the DOM.
          for (const group of groups) {
            expect(
              beads.compareDocumentPosition(group) &
                Node.DOCUMENT_POSITION_FOLLOWING,
            ).not.toBe(0);
          }
          expect(
            groups.map(
              (group) => group.querySelector('figcaption')?.textContent,
            ),
          ).toEqual(block.cards.map((card) => card.caption));
          expect(
            groups.map((group) =>
              group.querySelector('img')?.getAttribute('alt'),
            ),
          ).toEqual(block.cards.map((card) => card.image.alt));
          break;
        }
        case 'photo':
          // PostPhoto: ONE <figure>, a child of the measure itself — its
          // heading as its caption when it has one, the picture, its finished
          // note as a <p> under it when it has one, and nothing else.
          expect(box.tagName).toBe('FIGURE');
          expect(partsShown(box)).toEqual(partsWanted(block));
          break;
        case 'beforeAfter': {
          // BeforeAfter: the pair's box, two blog photos in it — the before
          // first — each holding exactly the pair's parts, THE LINE between
          // them (a decoration, no figure).
          expect(box.tagName).toBe('DIV');
          const figures = within(box).getAllByRole('figure');
          expect(figures.map(partsShown)).toEqual(
            halvesOf(block).map(partsWanted),
          );
          break;
        }
        default: {
          // TOTAL over the band's kinds, like renderBlock (2026-10-20, round
          // 2 of the Opus typescript review): a fifth kind does not compile
          // here until this suite reads it.
          const unread: never = block;
          throw new Error(
            `PostPage suite: block ${index + 1} has the kind ${JSON.stringify(
              (unread as { kind?: unknown }).kind,
            )}, which this suite does not read`,
          );
        }
      }
    });
    // No block's `kind` rode into the markup (THE BLOCKS' BY NAME).
    expect(document.querySelector('[kind]')).toBeNull();

    // PostConclusion: a <figure> — the quote, then who said it.
    const last = children.at(-1) as HTMLElement;
    expect(last.tagName).toBe('FIGURE');
    expect(last.querySelector('blockquote')).toHaveTextContent(
      DEMO_PAGE.conclusion.text,
    );
    expect(last.querySelector('figcaption')).toHaveTextContent(
      DEMO_PAGE.conclusion.doctor.name,
    );
  });

  it('renders ONE opener, ONE cover and ONE conclusion, the TWO galleries — each its own region — and a <figure> for every picture of the text', () => {
    const { container } = renderPage();

    expect(container.querySelectorAll('header')).toHaveLength(1);
    expect(
      screen.getAllByRole('list', { name: DEMO_PAGE.share.label }),
    ).toHaveLength(1);
    expect(screen.getAllByText(DEMO_PAGE.cover.readingTime)).toHaveLength(1);
    // The two galleries: one carousel region each, found by its own name —
    // and they are the page's ONLY regions, in the article's order. No two
    // share a name: each is a landmark, and a page's landmarks never do
    // (axe's landmark-unique, which every story's check runs).
    expect(GALLERIES).toHaveLength(2);
    const regions = GALLERIES.map((gallery) =>
      screen.getByRole('region', { name: gallery.labels.region }),
    );
    expect(screen.getAllByRole('region')).toEqual(regions);
    expect(
      new Set(GALLERIES.map((gallery) => gallery.labels.region)).size,
    ).toBe(GALLERIES.length);
    // A figure per card of every gallery, per blog photo, per half of every
    // pair, and the conclusion's one — counted in the markup, where the inert
    // side cards count too.
    expect(container.querySelectorAll('figure')).toHaveLength(
      GALLERY_CARDS + PHOTOS.length + 2 * PAIRS.length + 1,
    );
    expect(container.querySelectorAll('blockquote')).toHaveLength(1);
    // Every kind the band knows is in the demo — so this suite renders each.
    expect(new Set(BLOCKS.map((block) => block.kind))).toEqual(
      new Set(['prose', 'gallery', 'photo', 'beforeAfter']),
    );
  });

  it('holds EVERY instance the owner listed — a blog photo and a pair each with a heading and a note, a heading alone, a note alone and neither', () => {
    // The owner, 2026-10-15: "also add an instance of the single blog image
    // with note, with heading and no not and without no heading nor not and
    // with note no heading. also add every instantiation possible of a
    // inainte and dupa". The demo carries each once, so the band's suite and
    // its stories render each.
    expect(
      PHOTOS.map((photo) => shapeOf(photo.heading, photo.note)).toSorted(),
    ).toEqual(['--', '-N', 'H-', 'HN']);
    expect(
      PAIRS.map((pair) => shapeOf(pair.headings, pair.notes)).toSorted(),
    ).toEqual(['--', '-N', 'H-', 'HN']);
  });

  it('holds BOTH instances of the carousel — the ring, then the end-to-end list, three cards in each window and no window named, eight cards each, the regions numbered 1 and 2 of 2', () => {
    // The owner, 2026-10-16: "create instance on 3 and instance of 5 cards …
    // have simple list with cange direction onc eend reached. all must be
    // instantiated" — and 2026-10-17, of the five-card window: "the fiver
    // option … do not represent it in the article, represent it on home
    // page". So the article holds each MODE once, in this order, on the
    // gallery's one window, three cards (sections/PostGallery's THREE CARDS,
    // ALWAYS) — and the band's suite and its stories render each.
    expect(GALLERIES.map((gallery) => gallery.mode)).toEqual([
      'loop',
      'bounded',
    ]);
    expect(GALLERIES.map((gallery) => gallery.labels.region)).toEqual([
      'Galerie foto 1 din 2',
      'Galerie foto 2 din 2',
    ]);
    for (const gallery of GALLERIES) {
      // No block names a window: the gallery fixes it.
      expect(Object.keys(gallery)).not.toContain('visible');
      expect(gallery.cards).toHaveLength(8);
      // One name per card — CardCarousel throws on any other count.
      expect(gallery.slideLabels).toHaveLength(gallery.cards.length);
      expect(new Set(gallery.slideLabels).size).toBe(gallery.cards.length);
      // The beads' group name, the page's word.
      expect(gallery.labels.picker).toBe('Alege fotografia');
    }
  });

  it('draws each of those instances with EXACTLY its parts — a caption only over a picture that has a heading, a note only under one that has a note', () => {
    renderPage();

    const { measure } = partsOf(pageTitle());
    const children = [...measure.children];
    const at = (block: PostPageBlock): Element => {
      const box = children[BLOCKS.indexOf(block)];
      if (!box) throw new Error('a picture block lost its box');
      return box;
    };
    // The four photos: one figure each, of one to three parts — the picture,
    // plus the heading when there is one, plus the note when there is one.
    expect(PHOTOS.map((photo) => partsShown(at(photo)).length)).toEqual(
      PHOTOS.map(
        (photo) =>
          1 +
          Number(photo.heading !== undefined) +
          Number(photo.note !== undefined),
      ),
    );
    for (const photo of PHOTOS) {
      const figure = at(photo);
      expect(figure.querySelectorAll('figcaption')).toHaveLength(
        photo.heading === undefined ? 0 : 1,
      );
      expect(figure.querySelectorAll('p')).toHaveLength(
        photo.note === undefined ? 0 : 1,
      );
      expect(figure.querySelectorAll('img')).toHaveLength(1);
    }
    // The four pairs: both halves alike, ALWAYS — never a caption over one
    // half alone, never a note under one half alone.
    for (const pair of PAIRS) {
      const halves = within(at(pair) as HTMLElement).getAllByRole('figure');
      expect(halves).toHaveLength(2);
      for (const half of halves) {
        expect(half.querySelectorAll('figcaption')).toHaveLength(
          pair.headings === undefined ? 0 : 1,
        );
        expect(half.querySelectorAll('p')).toHaveLength(
          pair.notes === undefined ? 0 : 1,
        );
        expect(half.querySelectorAll('img')).toHaveLength(1);
      }
    }
    // Every note the page prints, in the article's order, is the route's
    // FINISHED sentence as given — its lead-in already written („Notă: …"):
    // the band adds no word to it and drops none.
    const printed = BLOCKS.flatMap((block) =>
      block.kind === 'photo' || block.kind === 'beforeAfter'
        ? [...at(block).querySelectorAll('figure > p')].map(
            (note) => note.textContent,
          )
        : [],
    );
    expect(printed).toEqual(
      BLOCKS.flatMap((block) =>
        block.kind === 'photo'
          ? block.note === undefined
            ? []
            : [block.note]
          : block.kind === 'beforeAfter' && block.notes !== undefined
            ? [block.notes.before, block.notes.after]
            : [],
      ),
    );
    expect(printed).not.toHaveLength(0);
    for (const note of printed) expect(note).toMatch(/^Notă: /);
  });

  it('outlines the page as its <h1> and the article’s subheadings, <h2>s under it, in order (§9)', () => {
    renderPage();

    const headings = screen.getAllByRole('heading');
    expect(headings.map((heading) => heading.tagName)).toEqual([
      'H1',
      ...subheadingsOf(DEMO_PAGE.blocks).map(() => 'H2'),
    ]);
    expect(headings.slice(1).map((heading) => heading.textContent)).toEqual(
      subheadingsOf(DEMO_PAGE.blocks),
    );
  });

  it('preloads the COVER at high priority — the page’s LCP — and leaves every other picture lazy', () => {
    renderPage();

    const { cover } = partsOf(pageTitle());
    const [coverPicture, ...others] = [
      ...document.querySelectorAll('img'),
    ] as HTMLImageElement[];
    expect(cover).toContainElement(coverPicture ?? null);
    expect(coverPicture).toHaveAttribute('fetchpriority', 'high');
    expect(coverPicture).not.toHaveAttribute('loading', 'lazy');
    // Every gallery's cards, the blog photos, both halves of every pair and
    // the doctor's circle.
    expect(others).toHaveLength(
      GALLERY_CARDS + PHOTOS.length + 2 * PAIRS.length + 1,
    );
    for (const picture of others) {
      expect(picture).toHaveAttribute('loading', 'lazy');
      expect(picture).not.toHaveAttribute('fetchpriority');
    }
  });

  it('still makes a page with NO blocks — the opener, the cover and the conclusion', () => {
    renderPage({ blocks: [] });

    const h1 = pageTitle();
    const { rhythm, header, cover, measure } = partsOf(h1);
    expect([...rhythm.children]).toEqual([header, cover, measure]);
    expect(measure.children).toHaveLength(1);
    expect(measure.firstElementChild?.tagName).toBe('FIGURE');
    expect(measure.querySelector('blockquote')).toHaveTextContent(
      DEMO_PAGE.conclusion.text,
    );
    expect(screen.getAllByRole('heading')).toEqual([h1]);
  });

  it('leaves no box for a prose run with nothing in it — no double gap in the measure', () => {
    renderPage({ blocks: [{ kind: 'prose', items: [] }, BEFORE_AFTER] });

    const { measure } = partsOf(pageTitle());
    expect(measure.children).toHaveLength(2);
    expect(
      within(measure.firstElementChild as HTMLElement).getAllByRole('figure'),
    ).toHaveLength(2);
    expect(measure.lastElementChild?.tagName).toBe('FIGURE');
  });

  it('leaves no box for a gallery with no cards — the carousel renders nothing', () => {
    renderPage({
      blocks: [{ ...GALLERY, cards: [], slideLabels: [] }, BEFORE_AFTER],
    });

    const { measure } = partsOf(pageTitle());
    expect(measure.children).toHaveLength(2);
    expect(
      screen.queryByRole('region', { name: GALLERY.labels.region }),
    ).toBeNull();
  });

  it('hands every gallery its four props by name — no `kind` or `mode` rides onto a carousel’s <section>, and no window does', () => {
    renderPage({ blocks: GALLERIES });

    const { measure } = partsOf(pageTitle());
    expect(measure.children).toHaveLength(GALLERIES.length + 1);
    for (const gallery of GALLERIES) {
      const region = screen.getByRole('region', {
        name: gallery.labels.region,
      });
      expect(region.parentElement).toBe(measure);
      expect(region).not.toHaveAttribute('kind');
      expect(region).not.toHaveAttribute('mode');
      expect(region).not.toHaveAttribute('visible');
    }
    expect(document.querySelector('[kind], [mode], [visible]')).toBeNull();
  });

  it('hands every gallery its MODE — at the first render the ring’s two arrows are live, and the end-to-end list, on its first card, has no previous', () => {
    // THE MODE, BY BEHAVIOUR (2026-10-20, the Opus typescript review): the
    // source test below ('… with EXACTLY its own parts …') reads that `mode`
    // is passed, this reads what it does — a mode lost on the way, or one
    // value written for every gallery,
    // turns one of the two galleries red here. sections/CardCarousel's ring
    // wraps, so its previous is always live; the end-to-end list ('bounded')
    // stands on its first card at the first render and disables its previous
    // there (its header's DISABLED). Read synchronously, before the carousel's
    // first dwell can move either.
    renderPage({ blocks: GALLERIES });

    expect(GALLERIES.map((gallery) => gallery.mode)).toEqual([
      'loop',
      'bounded',
    ]);
    for (const gallery of GALLERIES) {
      const region = screen.getByRole('region', {
        name: gallery.labels.region,
      });
      const previous = within(region).getByRole('button', {
        name: gallery.labels.previous,
      });
      const next = within(region).getByRole('button', {
        name: gallery.labels.next,
      });
      expect(next, gallery.labels.region).toBeEnabled();
      if (gallery.mode === 'loop') {
        expect(previous, gallery.labels.region).toBeEnabled();
      } else {
        expect(previous, gallery.labels.region).toBeDisabled();
      }
    }
  });

  it('hands every blog photo its three parts BY NAME — its <figure> carries its own class alone — and no `sizes`, so the picture asks PostPhoto’s own, the measure’s', () => {
    renderPage({ blocks: PHOTOS });

    const { measure } = partsOf(pageTitle());
    const figures = [...measure.children].slice(0, -1);
    expect(figures).toHaveLength(PHOTOS.length);
    for (const figure of figures) {
      expect(figure.tagName).toBe('FIGURE');
      // A spread block would have put its `kind` here, beside the class.
      expect(figure.getAttributeNames()).toEqual(['class']);
      expect(figure.querySelector('img')).toHaveAttribute(
        'sizes',
        POST_PHOTO_SIZES,
      );
    }
    expect(document.querySelector('[kind]')).toBeNull();
  });

  it('hands every pair its three parts BY NAME — the pair’s box carries its own class alone, and no `kind` lands anywhere in the DOM', () => {
    renderPage({ blocks: PAIRS });

    const { measure } = partsOf(pageTitle());
    const boxes = [...measure.children].slice(0, -1) as HTMLElement[];
    expect(boxes).toHaveLength(PAIRS.length);
    for (const box of boxes) {
      expect(box.tagName).toBe('DIV');
      expect(box.getAttributeNames()).toEqual(['class']);
      expect(within(box).getAllByRole('figure')).toHaveLength(2);
    }
    expect(
      document.querySelector('[kind], [images], [headings], [notes]'),
    ).toBeNull();
  });

  it('renders every block through its section with EXACTLY its own parts — named in a hand-off object that satisfies the block’s parts, never the block spread, no window, no `sizes`', () => {
    // The source is the one witness of what is NOT passed: a `sizes` spelled
    // as PostPhoto's own default would render exactly as no `sizes` does
    // today, and drift from the measure the day either moved — so each
    // case's HAND-OFF object is read (PostPage.tsx's EVERY PART HANDED ON):
    // its parts, named one by one; the Record of the block's parts it
    // `satisfies`, which stops renderBlock compiling the day a part is added
    // to the block and not named here (a plain object would compile and
    // drop it in silence — the reason this test holds the clause); and the
    // call, the key and that object spread, nothing else. The gallery's four,
    // and no window: PostGallery fixes it.
    expect(CODE).toMatch(
      /const prose = \{\s*items: block\.items,\s*\} satisfies Record<PartsOf<'prose'>, unknown>;\s*return <PostProse key=\{index\} \{\.\.\.prose\} \/>;/,
    );
    expect(CODE).toMatch(
      /const gallery = \{\s*cards: block\.cards,\s*mode: block\.mode,\s*labels: block\.labels,\s*slideLabels: block\.slideLabels,\s*\} satisfies Record<PartsOf<'gallery'>, unknown>;\s*return <PostGallery key=\{index\} \{\.\.\.gallery\} \/>;/,
    );
    expect(CODE).toMatch(
      /const photo = \{\s*image: block\.image,\s*heading: block\.heading,\s*note: block\.note,\s*\} satisfies Record<PartsOf<'photo'>, unknown>;\s*return <PostPhoto key=\{index\} \{\.\.\.photo\} \/>;/,
    );
    expect(CODE).toMatch(
      /const pair = \{\s*images: block\.images,\s*headings: block\.headings,\s*notes: block\.notes,\s*\} satisfies Record<PartsOf<'beforeAfter'>, unknown>;\s*return <BeforeAfter key=\{index\} \{\.\.\.pair\} \/>;/,
    );
    // …and the parts that Record names are the BLOCK's own — every key of it
    // but its `kind`, in every shape of its kind (KeysOf distributes over a
    // union, where `keyof` keeps the keys every shape shares), and never a
    // Record over no key (a kind with no part, or none Extracted, names a
    // key no object has) — never a list retyped beside the names above
    // (2026-10-21, round 3 of the Opus reviews).
    expect(CODE).toMatch(
      /type KeysOf<T> = T extends unknown \? keyof T : never;/,
    );
    expect(CODE).toMatch(
      /type PartsOf<Kind extends PostPageBlock\['kind'\]> = \[\s*Exclude<KeysOf<Extract<PostPageBlock, \{ kind: Kind \}>>, 'kind'>,\s*\] extends \[never\]\s*\? `[^`]+`\s*: Exclude<KeysOf<Extract<PostPageBlock, \{ kind: Kind \}>>, 'kind'>;/,
    );
    // No spread of a block ANYWHERE — a JSX one onto a section, or one in an
    // object: `satisfies` checks no key a spread brings, so
    // `{ ...block } satisfies …` compiles for a block whose parts are all
    // required (a gallery's) and carries its `kind` along (2026-10-21, round
    // 3 of the Opus reviews — until then only the JSX form was refused).
    expect(CODE).not.toMatch(/\.\.\.block\b/);
  });

  it('keeps two blocks with the same words as TWO — the keys are indices, and React warns of no duplicate', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      renderPage({ blocks: [BEFORE_AFTER, BEFORE_AFTER] });

      const { measure } = partsOf(pageTitle());
      expect(measure.children).toHaveLength(3);
      expect(errors).not.toHaveBeenCalled();
    } finally {
      errors.mockRestore();
    }
  });
});

describe('PostPage — THE BAND SCALE and the boxes', () => {
  it('wears ui/Container’s TWO band strings on the rhythm box — imported, whole — beside its own stack and step', () => {
    renderPage();

    const tokens = tokensOf(partsOf(pageTitle()).rhythm);
    for (const token of [
      ...split(bandScaleClasses),
      ...split(bandColumnClasses),
      ...RHYTHM,
    ]) {
      expect(tokens).toContain(token);
    }
    expect(tokens).toHaveLength(
      split(bandScaleClasses).length +
        split(bandColumnClasses).length +
        RHYTHM.length,
    );
  });

  it('ends the article on the privacy policy’s steps — the same room under the conclusion as over the opener, none kept for a map', () => {
    renderPage();

    // Every padding the rhythm box wears, at every step: EXACTLY the three
    // `py` steps. A top-only step, or a bottom room of its own — the 2rem
    // this box kept over the map until the map left (2026-10-15) — shows
    // here, beside them.
    expect(
      tokensOf(partsOf(pageTitle()).rhythm).filter((token) =>
        /(^|:)p[trblxyse]?-/.test(token),
      ),
    ).toEqual(['py-12', '@lg:py-16', '@3xl:py-20']);
  });

  it('declares NO size container between the <h1> and ui/Container’s column — the title’s band-scale class reads the column', () => {
    renderPage();

    const h1 = pageTitle();
    const { column } = partsOf(h1);
    // The nearest container above the <h1> is ui/Container's column itself.
    let box = h1.parentElement;
    while (
      box &&
      !tokensOf(box).some((token) => token.startsWith('@container'))
    ) {
      box = box.parentElement;
    }
    expect(box).toBe(column);
    expect(tokensOf(column)).toContain('@container');
  });

  it('caps the text at 42rem and centres it — THE MEASURE', () => {
    renderPage();

    expect(tokensOf(partsOf(pageTitle()).measure)).toEqual(MEASURE);
  });

  it('owns no outer margin on any box of its own, and hands its sections none — nor any class at all — gaps space them (§6.4)', () => {
    renderPage();

    const h1 = pageTitle();
    const { article, rhythm, measure, header, cover } = partsOf(h1);
    // `mx-auto` is centring, never spacing: the band column's and the
    // measure's. Everything else that reads as a margin fails.
    const margin = /(^|:)-?m[trblxyse]?-/;
    for (const box of [article, rhythm, measure]) {
      for (const token of tokensOf(box).filter((t) => t !== 'mx-auto')) {
        expect(token).not.toMatch(margin);
      }
    }
    // The sections' roots wear no margin either: their own classes have
    // none, and the band hands them none.
    for (const box of [header, cover, ...measure.children]) {
      for (const token of tokensOf(box)) {
        expect(token).not.toMatch(margin);
      }
    }
    // …nor ANY class of the band's — which no rendered token can tell from a
    // section's own, so the SOURCE is read (2026-10-20, round 2 of the Opus
    // typescript review: a placement class written on PostHeader, PostCover,
    // ShareLinks, PostProse or PostConclusion passed every assertion above).
    // The band writes `className` on its own two boxes, the rhythm box and
    // the measure, and nowhere else: on no section's call, and in no hand-off
    // object — which could not compile with one (each `satisfies` its block's
    // parts, THE BLOCKS' EVERY PART HANDED ON).
    expect(CODE.match(/\bclassName\b/g)).toEqual(['className', 'className']);
    expect(
      [...CODE.matchAll(/<div className=\{(\w+)\}>/g)].map((match) => match[1]),
    ).toEqual(['RHYTHM', 'MEASURE']);
  });
});

describe('PostPage — the exhaustive mapping by kind', () => {
  it('knows exactly four kinds — and a fifth does not compile', () => {
    // Erased at runtime; they fail at `tsc --noEmit`, naming the type.
    expectTypeOf<PostPageBlock['kind']>().toEqualTypeOf<
      'prose' | 'gallery' | 'photo' | 'beforeAfter'
    >();
    expectTypeOf<Extract<PostPageBlock, { kind: 'prose' }>>().toEqualTypeOf<
      Readonly<{ kind: 'prose'; items: readonly PostProseItem[] }>
    >();
    expectTypeOf<Extract<PostPageBlock, { kind: 'gallery' }>>().toEqualTypeOf<
      Readonly<
        { kind: 'gallery' } & Pick<
          PostGalleryProps,
          'cards' | 'mode' | 'labels' | 'slideLabels'
        >
      >
    >();
    // …which is the carousel's four, as PostGallery takes them — and no
    // window: an article's gallery is three cards, always. A prop added to
    // that Pick must be named here AND handed on in renderBlock, whose
    // hand-off object `satisfies` the block's parts, so it does not compile
    // until its case names it — and an article file carries it only once the
    // route's galleryBlock maps it (src/app/[locale]/blog/[slug]/populate.ts,
    // whose parts object `satisfies` the file's gallery's parts, THE
    // MAPPERS; its suite reads every laid gallery's keys against a fixture
    // carrying every part, the carousel's words beside them).
    type Gallery = Extract<PostPageBlock, { kind: 'gallery' }>;
    expectTypeOf<Gallery['cards']>().toEqualTypeOf<readonly GalleryCard[]>();
    expectTypeOf<Gallery['mode']>().toEqualTypeOf<CardCarouselMode>();
    expectTypeOf<Gallery['labels']>().toEqualTypeOf<CardCarouselLabels>();
    expectTypeOf<Gallery['slideLabels']>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<Gallery>().not.toHaveProperty('visible');
    // A blog photo IS sections/PostPhoto's content — the picture, and a
    // heading and a note, each optional — nothing more (no `sizes`: the
    // measure's is PostPhoto's default).
    expectTypeOf<Extract<PostPageBlock, { kind: 'photo' }>>().toEqualTypeOf<
      Readonly<{ kind: 'photo' } & PostPhotoContent>
    >();
    type Photo = Extract<PostPageBlock, { kind: 'photo' }>;
    // …and EXACTLY these four keys (2026-10-20, the Opus typescript review).
    // The pin above holds the block to PostPhotoContent WHOLE, and a photo's
    // parts are handed on BY NAME — so a part added to PostPhotoContent (a
    // credit, say) would pass that pin, type-check at every call site and be
    // dropped in silence. This one fails to compile until the new part is
    // named here, and the part must then be handed on in the TWO places that
    // name a photo's parts, each held at `tsc --noEmit` (since 2026-10-21,
    // round 3 of the same reviews, for the second): renderBlock, whose
    // hand-off object `satisfies` the block's parts (the test '… with
    // EXACTLY its own parts …' holds that clause in the source), and the
    // route's mapping from an article file —
    // src/app/[locale]/blog/[slug]/populate.ts' photoBlock. There
    // lib/blog-article's photo shape must gain the part first (populate.test.ts
    // holds it EQUAL to PostPhotoContent), and photoBlock's parts object
    // `satisfies` that shape's parts, so it does not compile until it hands
    // the part on (populate.ts' THE MAPPERS); populate.test.ts' full fixtures,
    // typed `Required<…>`, must carry it too, and its key test then reads
    // the part on the page's block.
    expectTypeOf<keyof Photo>().toEqualTypeOf<
      'kind' | 'image' | 'heading' | 'note'
    >();
    expectTypeOf<Photo['image']>().toEqualTypeOf<PostPhotoImage>();
    expectTypeOf<Photo['heading']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<Photo['note']>().toEqualTypeOf<string | undefined>();
    // A pair IS sections/BeforeAfter's three parts — grouped BY PART, the
    // before first in each, so a heading or a note on one half alone cannot
    // even be written. A part added to that Pick must be named here AND
    // handed on in renderBlock, whose hand-off object `satisfies` the block's
    // parts, so it does not compile until its case names it — and an article
    // file carries it only once the route's pairBlock maps it
    // (src/app/[locale]/blog/[slug]/populate.ts, whose parts object
    // `satisfies` the file's pair's parts, THE MAPPERS; its suite reads every
    // laid pair's keys against a fixture carrying every part).
    expectTypeOf<
      Extract<PostPageBlock, { kind: 'beforeAfter' }>
    >().toEqualTypeOf<
      Readonly<
        { kind: 'beforeAfter' } & Pick<
          BeforeAfterProps,
          'images' | 'headings' | 'notes'
        >
      >
    >();
    expectTypeOf<PairBlock['images']>().toEqualTypeOf<
      BeforeAfterPair<PostPhotoImage>
    >();
    expectTypeOf<PairBlock['headings']>().toEqualTypeOf<
      BeforeAfterPair<string> | undefined
    >();
    expectTypeOf<PairBlock['notes']>().toEqualTypeOf<
      BeforeAfterPair<string> | undefined
    >();
    const image: PostPhotoImage = {
      src: '/images/hero/lobby.jpg',
      alt: 'Sala de așteptare a clinicii',
    };
    const h = { image, heading: 'Înainte' };
    // @ts-expect-error — no fifth kind: the union refuses it at the call site.
    const stray: PostPageBlock = { kind: 'quote', text: 'Citat' };
    // @ts-expect-error — no `sizes`: PostPhoto's own default is the measure's.
    const sized: PostPageBlock = { kind: 'photo', image, sizes: '90vw' };
    // @ts-expect-error — a pair is grouped by part, never by half.
    const byHalf: PostPageBlock = { kind: 'beforeAfter', before: h, after: h };
    // @ts-expect-error — no window: PostGallery fixes it at three cards.
    const windowed: PostPageBlock = { ...GALLERY, visible: 5 };
    expect([stray, sized, byHalf, windowed]).toHaveLength(4);
  });

  it('names every kind in its switch and closes on the `never` line — so a fifth kind cannot compile until it is placed', () => {
    expect(CODE).toMatch(
      /switch \(block\.kind\) \{\s*case 'prose':[\s\S]*?case 'gallery':[\s\S]*?case 'photo':[\s\S]*?case 'beforeAfter':[\s\S]*?\}\s*const unclassified: never = block;/,
    );
  });

  it('fails by name on a kind that escaped the types — never a block of the article dropped in silence', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const stray = {
        kind: 'quote',
        text: 'Citat',
      } as unknown as PostPageBlock;
      expect(() => renderPage({ blocks: [PROSE, stray] })).toThrow(
        'PostPage: block 2 has the kind "quote", which is none of prose, gallery, photo and beforeAfter',
      );
    } finally {
      silence.mockRestore();
    }
  });
});

describe('PostPage — §6 fidelity: placement in, nothing out', () => {
  it('spreads native props onto the <article> — and a caller’s className is its whole class list', () => {
    renderPage({
      id: 'articol',
      className: 'w-full',
      ...({ 'data-pagina': 'articol' } as Partial<PostPageProps>),
    });

    const { article } = partsOf(pageTitle());
    expect(article).toHaveAttribute('id', 'articol');
    expect(article).toHaveAttribute('data-pagina', 'articol');
    expect(tokensOf(article)).toEqual(['w-full']);
  });

  it('carries no class of its own on the <article> — it paints nothing', () => {
    renderPage();

    expect(partsOf(pageTitle()).article).not.toHaveAttribute('class');
  });

  it('accepts `ref` as a plain prop and lands it on the <article> (§6.8)', () => {
    const ref = createRef<HTMLElement>();
    renderPage({ ref });

    expect(ref.current).toBe(partsOf(pageTitle()).article);
  });
});

describe('PostPage — zero islands, zero message keys, zero data', () => {
  it('ships NO client directive, calls no hook but `useId`, no t() and no handler (§16)', () => {
    expect(CODE).not.toMatch(
      /^\s*['"]use client['"]\s*;?\s*(\/\/.*|\/\*.*)?$/m,
    );
    expect(CODE.match(/\buse[A-Z]\w*\(/g)).toEqual(['useId(']);
    expect(CODE).not.toMatch(/\buseTranslations\b/);
    expect(CODE).not.toMatch(/\bt\(/);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
  });

  it('imports EXACTLY the eight sections it composes, ui/Container, lib/cx and react — no data, no fixture', () => {
    // The import surface is the guard a regex on directives cannot be: an
    // import of lib/blog-article would make the band its own populator.
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/sections/BeforeAfter/BeforeAfter',
      '@/components/sections/PostConclusion/PostConclusion',
      '@/components/sections/PostCover/PostCover',
      '@/components/sections/PostGallery/PostGallery',
      '@/components/sections/PostHeader/PostHeader',
      '@/components/sections/PostPhoto/PostPhoto',
      '@/components/sections/PostProse/PostProse',
      '@/components/sections/ShareLinks/ShareLinks',
      '@/components/ui/Container/Container',
      '@/lib/cx/cx',
      'react',
    ]);
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/\.fixtures/);
  });
});

describe('PostPage — type-level pins', () => {
  it('pins the contract so a refactor cannot quietly widen it', () => {
    type Own = 'header' | 'cover' | 'share' | 'blocks' | 'conclusion';
    expectTypeOf<PostPageProps['header']>().toEqualTypeOf<
      Readonly<{ title: string; byline: string }>
    >();
    expectTypeOf<PostPageProps['cover']>().toEqualTypeOf<
      Readonly<Omit<PostCoverOwnProps, 'share' | 'preload'>>
    >();
    // ShareLinks' own five props, never its root's native ones (a class, an
    // id, a `ref` to its <div>): that root — the box round the list and its
    // status line since 2026-10-20 (ShareLinks' THE ROOT AND THE BELT) — is
    // placed by the cover's slot, never by the page.
    expectTypeOf<PostPageProps['share']>().toEqualTypeOf<
      Readonly<
        Pick<
          ShareLinksProps,
          'label' | 'facebook' | 'whatsapp' | 'email' | 'copy'
        >
      >
    >();
    expectTypeOf<PostPageProps['share']>().not.toHaveProperty('className');
    expectTypeOf<PostPageProps['blocks']>().toEqualTypeOf<
      readonly PostPageBlock[]
    >();
    expectTypeOf<
      PostPageProps['conclusion']
    >().toEqualTypeOf<PostConclusionOwnProps>();
    // The native half: the <article>'s own props, minus the five parts,
    // `children`, the two naming attributes and `role` (THE NAME's belt) —
    // and `dangerouslySetInnerHTML` (2026-10-20, round 2 of the reviews: it
    // compiled, then threw at render, React refusing markup beside the
    // article's children — PostHeader, PostProse, PostConclusion, ShareLinks
    // and BeforeAfter refuse it in their types the same way).
    expectTypeOf<'children'>().not.toExtend<keyof PostPageProps>();
    expectTypeOf<'dangerouslySetInnerHTML'>().not.toExtend<
      keyof PostPageProps
    >();
    expectTypeOf<'aria-label'>().not.toExtend<keyof PostPageProps>();
    expectTypeOf<'aria-labelledby'>().not.toExtend<keyof PostPageProps>();
    expectTypeOf<'role'>().not.toExtend<keyof PostPageProps>();
    expectTypeOf<'id' | 'className' | 'ref'>().toExtend<keyof PostPageProps>();
    expectTypeOf<Own>().toExtend<keyof PostPageProps>();
    // The fixture is a whole page.
    expectTypeOf(DEMO_PAGE).toExtend<PostPageProps>();
  });
});
