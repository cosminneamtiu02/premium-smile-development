import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { useLocale, useTranslations } from 'next-intl';
import { PostPage } from '@/components/sections/PostPage/PostPage';
import type { Locale } from '@/i18n/locales';
import {
  articleAuthor,
  articles,
  type ArticleBlock,
  type ArticleEntry,
} from '@/lib/blog-article/blog-article';
import { shareHrefs } from '@/lib/share/share';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import {
  articleLocale,
  articlePost,
  articleUrl,
  articleWordsFrom,
  populateArticle,
} from './populate';

// Pages/BlogArticle — one article of the blog (CLAUDE.md §15.39 round 4):
// /{locale}/blog/<slug>/. KEEP-IN-SYNC with ./page.tsx: it is an async Server
// Component the browser runner cannot render, so the twin below mounts the
// SAME band — the article through the SAME ./populate.ts (its body through
// `populateArticle`, in the story's language narrowed by the same
// `articleLocale` from the isomorphic `useLocale`, the words through
// `articleWordsFrom`, the one mapping ./words.ts also calls, here with
// `useTranslations`' translators — `blog` and `common`, the carousel's
// roledescriptions coming from the latter). No map under it since 2026-10-15
// (the owner: "drop the map"). ../../page-twins.test.ts holds the band and
// that call together.
// The band's own workbench is Sections/PostPage, over a fixture; this twin is
// the page's WIRING over the shipped data.
//
// ── ROMANIAN AND GERMAN (§13: pages in RO + DE, German the longest
// language). Every article is written in all five languages since 2026-10-15
// (lib/blog-article's EVERY LANGUAGE, IN ONE FILE), so the twin renders it in
// both, and every play reads the story's OWN language: the title and the
// categories from that language's post (lib/blog's `postIn`), the body from
// that language's article, the doctor's name and specialty as lib/team spells
// them in it, the share links to that language's own address, every label
// from that language's message file. A German page that showed a Romanian
// paragraph, or shared its Romanian address, fails here. The article shown is
// lib/blog-article's first — the newest post's — read off the data and never
// spelled, so the twin follows whatever the owner ships; every expectation
// below is read off the same data (the post, the article, its doctor, the
// message file), never retyped. The visual matrix photographs Pages/* at all
// six widths (§13), and the play asserts nothing tied to one width.

/** KEEP-IN-SYNC twin of the route page: the article page for `slug` in the story's language. */
function ArticleBand({ slug }: { slug: string }): ReactElement {
  const words = articleWordsFrom(
    useTranslations('blog'),
    useTranslations('common'),
  );
  const locale = articleLocale(useLocale());
  return <PostPage {...populateArticle(locale, slug, words)} />;
}

/** Each story language's own messages — what its plays read the page against. */
const MESSAGES = { ro, de } as const satisfies Partial<
  Record<Locale, typeof ro>
>;
type StoryLocale = keyof typeof MESSAGES;

/** A gallery block of an article file. */
type GalleryBlock = Extract<ArticleBlock, { type: 'gallery' }>;

/** One picture of a blog photo or of a before/after's half, with the words
 *  beside it — each optional, as the article file holds them. */
type Figure = Readonly<{
  image: Readonly<{ alt: string }>;
  heading?: string;
  note?: string;
}>;

/** A before/after's two halves, in the order the page reads them. */
const HALVES = ['before', 'after'] as const;

/** The article the twin shows: lib/blog-article's first — it keeps lib/blog's
 *  order, newest first — or a throw naming why there is nothing to show. */
const firstArticle = (): ArticleEntry => {
  const first = articles.at(0);
  if (first === undefined) {
    throw new Error(
      'Pages/BlogArticle: lib/blog-article ships no article — there is no page to twin',
    );
  }
  return first;
};

/** The real face first — Source Serif 4 is `font-display: block` (PR #125's lesson). */
async function loadFace(root: HTMLElement): Promise<void> {
  const h1 = root.querySelector('h1');
  if (h1) {
    const style = getComputedStyle(h1);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      h1.textContent ?? '',
    );
  }
  await document.fonts.ready;
}

/**
 * A message's sentence with its arguments filled in — `values` maps each
 * placeholder, spelled as the message spells it, to its text — as ICU prints
 * these values: a name as it is; a count of minutes or cards under a thousand,
 * which takes no digit grouping in either story language. It throws when the
 * message no longer holds a placeholder, so a reworded sentence fails here by
 * name, never as a silent mismatch. (No translator of the twin's own: the
 * words reach the page through `articleWordsFrom` alone.)
 */
function fill(
  message: string,
  values: Readonly<Record<string, string>>,
): string {
  return Object.entries(values).reduce((filled, [placeholder, value]) => {
    if (!filled.includes(placeholder)) {
      throw new Error(
        `Pages/BlogArticle: „${message}" no longer holds ${placeholder}`,
      );
    }
    return filled.replace(placeholder, value);
  }, message);
}

/** No width may make the page scroll sideways (§7: reflow at 320px). */
async function expectNoSidewaysScroll(): Promise<void> {
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
}

/**
 * THE PAGE, READ BACK in `locale` — every part the route wires, each against
 * the data it came from: the opener, the cover's row and categories, the
 * share controls, the article's body in its order, the gallery's carousel,
 * every blog photo and before/after with its headings and its notes, the
 * doctor who signs the conclusion — and no map after it.
 */
async function expectArticlePage(
  canvasElement: HTMLElement,
  slug: string,
  locale: StoryLocale,
): Promise<void> {
  const canvas = within(canvasElement);
  const messages = MESSAGES[locale];
  const post = articlePost(locale, slug);
  const entry = articles.find((candidate) => candidate.slug === slug);
  if (entry === undefined) {
    throw new Error(`Pages/BlogArticle: no article „${slug}"`);
  }
  const article = entry.languages[locale];
  const doctor = articleAuthor(post).words[locale];
  await loadFace(canvasElement);

  // THE OPENER: one <h1>, the post's title in the story's language, naming
  // the <article>; under it the by-line of the doctor who signs it, named as
  // lib/team spells her in that language.
  await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  const h1 = canvas.getByRole('heading', { level: 1, name: post.title });
  const page = canvas.getByRole('article', { name: post.title });
  await expect(page).toContainElement(h1);
  const inPage = within(page);
  await expect(
    inPage.getByText(
      fill(messages.blog.article.byline, { '{author}': doctor.name }),
    ),
  ).toBeInTheDocument();

  // THE COVER: the reading time on its row — the POST's minutes, the number
  // its card on the list prints, through the blog's one reading-time
  // sentence — and the post's categories over the picture, in its order.
  await expect(
    inPage.getByText(
      fill(messages.blog.readingTime, {
        '{minutes, number}': String(post.readingMinutes),
      }),
    ),
  ).toBeInTheDocument();
  if (post.tags.length > 0) {
    const tags = inPage.getByRole('list', { name: messages.blog.tags });
    await expect(
      within(tags)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([...post.tags]);
  }

  // THE SHARE CONTROLS: three links to lib/share's addresses for the page's
  // own public address in its language, each under its accessible name — the
  // WhatsApp text and the e-mail saying the page's own share sentences around
  // it, the clinic's name and the post's title in them — and the copy button.
  const share = inPage.getByRole('list', {
    name: messages.blog.article.share.label,
  });
  const said = { '{site}': messages.common.siteName, '{title}': post.title };
  const hrefs = shareHrefs(articleUrl(locale, slug), {
    subject: fill(messages.blog.article.share.subject, said),
    message: fill(messages.blog.article.share.message, said),
  });
  const links = [
    [messages.blog.article.share.facebookName, hrefs.facebook],
    [messages.blog.article.share.whatsappName, hrefs.whatsapp],
    [messages.blog.article.share.emailName, hrefs.email],
  ] as const;
  await expect(within(share).getAllByRole('link')).toHaveLength(links.length);
  for (const [name, href] of links) {
    await expect(within(share).getByRole('link', { name })).toHaveAttribute(
      'href',
      href,
    );
  }
  await expect(
    within(share).getByRole('button', {
      name: messages.blog.article.share.copy,
    }),
  ).toBeInTheDocument();

  // THE BODY: every subheading an <h2>, in the article's order — the
  // article's only <h2>s (a photo's heading is its figure's caption, never
  // an outline heading) — and every paragraph.
  await expect(
    inPage
      .queryAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent),
  ).toEqual(
    article.blocks.flatMap((block) =>
      block.type === 'heading' ? [block.text] : [],
    ),
  );
  for (const block of article.blocks) {
    if (block.type === 'paragraph') {
      await expect(
        inPage.getAllByText(block.text, { selector: 'p' }),
      ).not.toHaveLength(0);
    }
  }

  // THE GALLERIES: each a carousel region named by the language's „Galerie
  // foto" — numbered, „Galerie foto 2 din 2", on a page with more than one
  // (populate.ts' THE GALLERY: a page's landmarks never share a name) —
  // announced as the site's „carusel", holding one slide per card — a
  // „diapozitiv" named „Fotografia 1 din 8" — every card under its caption,
  // and both arrows, on screen at all times since 2026-10-17 (sections/
  // CardCarousel's THE ARROWS).
  // The side cards are `inert` and aria-hidden (CardCarousel's previews), so
  // the slides are counted with `hidden: true`; a card's name and caption
  // follow the CARD, never its place, so a carousel that has already moved
  // reads the same.
  const galleries = article.blocks.filter(
    (block): block is GalleryBlock => block.type === 'gallery',
  );
  const regionName = (at: number): string =>
    galleries.length === 1
      ? messages.blog.article.gallery.region
      : fill(messages.blog.article.gallery.regionNumbered, {
          '{index}': String(at + 1),
          '{total}': String(galleries.length),
        });
  const regions = galleries.map((_, at) =>
    inPage.getByRole('region', { name: regionName(at) }),
  );
  // …the page's carousels, in the page's order, are exactly those regions.
  await expect(
    inPage
      .getAllByRole('region')
      .filter(
        (region) =>
          region.getAttribute('aria-roledescription') ===
          messages.common.carousel.role,
      ),
  ).toEqual(regions);
  for (const [at, gallery] of galleries.entries()) {
    const region = regions[at];
    if (region === undefined) {
      throw new Error(`Pages/BlogArticle: no carousel for gallery ${at + 1}`);
    }
    await expect(region).toHaveAttribute(
      'aria-roledescription',
      messages.common.carousel.role,
    );
    const total = String(gallery.cards.length);
    // The carousel's cards — every group that says it is a slide; the
    // progress dots' row is a group too (named „Alege fotografia"), and it is
    // checked by name below, never counted as a card.
    const slides = within(region)
      .getAllByRole('group', { hidden: true })
      .filter(
        (group) =>
          group.getAttribute('aria-roledescription') ===
          messages.common.carousel.slideRole,
      );
    await expect(
      within(region).getByRole('group', {
        name: messages.blog.article.gallery.picker,
      }),
    ).toBeInTheDocument();
    await expect(
      slides.map((slide) => slide.getAttribute('aria-label')),
    ).toEqual(
      gallery.cards.map((_, index) =>
        fill(messages.blog.article.gallery.slide, {
          '{index}': String(index + 1),
          '{total}': total,
        }),
      ),
    );
    for (const slide of slides) {
      await expect(slide).toHaveAttribute(
        'aria-roledescription',
        messages.common.carousel.slideRole,
      );
    }
    await expect(
      slides.map((slide) => slide.querySelector('figcaption')?.textContent),
    ).toEqual(gallery.cards.map((card) => card.caption));
    for (const name of [
      messages.blog.article.gallery.previous,
      messages.blog.article.gallery.next,
    ]) {
      await expect(
        within(region).getByRole('button', { name }),
      ).toBeInTheDocument();
    }
  }

  // THE PHOTOS AND THE PAIRS: every picture of a blog photo and of each half
  // of a before/after, in the article's order — its <figure> captioned by
  // its heading when it has one and by nothing when it has none, and its
  // note under the picture, FINISHED with the page's lead-in („Notă: …"),
  // when it has one and absent when it has none. The pictures are found in
  // the page's order by their alts, outside the galleries' carousels (their
  // cards may show the same picture) — the cover's and the doctor's pictures
  // carry other alts.
  const figures = article.blocks.flatMap((block): readonly Figure[] => {
    switch (block.type) {
      case 'photo':
        return [block];
      case 'beforeAfter':
        return HALVES.map((half) => ({
          image: block.images[half],
          heading: block.headings?.[half],
          note: block.notes?.[half],
        }));
      case 'paragraph':
      case 'heading':
      case 'gallery':
        // Read above: the body's text, and the galleries' carousels.
        return [];
      default: {
        // TOTAL over lib/blog-article's block types (2026-10-21, round 3 of
        // the Opus reviews): a sixth type, which might draw a figure, does
        // not compile here until the plays read it.
        const unread: never = block;
        throw new Error(
          `Pages/BlogArticle: a block of the type ${JSON.stringify(
            (unread as { type?: unknown }).type,
          )}, which the plays do not read`,
        );
      }
    }
  });
  const pictures = Array.from(page.querySelectorAll('img')).filter(
    (img) => img.closest('[aria-roledescription]') === null,
  );
  let next = 0;
  for (const figure of figures) {
    const at = pictures.findIndex(
      (img, index) => index >= next && img.alt === figure.image.alt,
    );
    if (at < 0) {
      throw new Error(
        `Pages/BlogArticle: no picture „${figure.image.alt}" after the ${next}th`,
      );
    }
    next = at + 1;
    const box = pictures[at]?.closest('figure');
    if (!box) {
      throw new Error(
        `Pages/BlogArticle: the picture „${figure.image.alt}" stands in no <figure>`,
      );
    }
    await expect(box.querySelector('figcaption')?.textContent ?? null).toBe(
      figure.heading ?? null,
    );
    await expect(box.querySelector(':scope > p')?.textContent ?? null).toBe(
      figure.note === undefined
        ? null
        : fill(messages.blog.article.note, { '{note}': figure.note }),
    );
  }

  // THE CONCLUSION: the article's closing words in a quotation, signed in the
  // same <figure> by the doctor the post names — her name and specialty in
  // the story's language.
  const quote = inPage.getByText(article.conclusion);
  const signature = inPage.getByText(doctor.name).closest('figure');
  await expect(quote.closest('blockquote')).not.toBeNull();
  await expect(signature).toContainElement(quote);
  await expect(signature).toContainElement(inPage.getByText(doctor.position));

  // NO MAP: the article is the page's one band (the owner, 2026-10-15: "drop
  // the map"), so the map band's heading is nowhere on it.
  await expect(
    canvas.queryByRole('heading', { name: messages.home.location.title }),
  ).toBeNull();

  await expectNoSidewaysScroll();
}

const meta = {
  title: 'Pages/BlogArticle',
  component: ArticleBand,
  parameters: { layout: 'fullscreen' },
  args: { slug: firstArticle().slug },
  argTypes: {
    slug: {
      control: 'select',
      options: articles.map(({ slug }) => slug),
      description: 'The article — every one lib/blog-article ships',
    },
  },
} satisfies Meta<typeof ArticleBand>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE NEWEST ARTICLE in Romanian — „Cum îți alegi periuța de dinți" today:
 * the title over its by-line, the reading time and the four share controls
 * over the cover with its categories, the article's runs of text with the
 * gallery's carousel, its blog photos and its before/afters between them —
 * every one with and without its heading and its note — and the doctor's
 * closing words.
 */
export const Romanian: Story = {
  globals: { locale: 'ro' },
  play: async ({ args, canvasElement }) => {
    await expectArticlePage(canvasElement, args.slug, 'ro');
  },
};

/**
 * The same article in German — /de/blog/<slug>/, the longest language (§13):
 * the German title, by-line, body, captions and conclusion, the German labels,
 * and every share link to the German page's own address.
 */
export const German: Story = {
  globals: { locale: 'de' },
  play: async ({ args, canvasElement }) => {
    await expectArticlePage(canvasElement, args.slug, 'de');
  },
};
