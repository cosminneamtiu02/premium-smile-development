import type { ReactElement } from 'react';
import {
  Pagination,
  type PaginationProps,
} from '@/components/sections/Pagination/Pagination';
import {
  PostCard,
  type PostCardContent,
} from '@/components/sections/PostCard/PostCard';
import { Container } from '@/components/ui/Container/Container';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
import { Heading } from '@/components/ui/Heading/Heading';

// sections/PostList — the blog index's band: the page's opener (an eyebrow
// over the page's <h1>), the articles as cards one under another, and the
// page navigation under them. The owner, verbatim (2026-10-11): "create a page
// very much alike this one: https://www.infiniswiss.com/blog with navigation
// of pages and cards with an image, title, a summary and date and creator …
// each element should be a list that is populated by a json". The reference,
// as the planner measured it: a centred heading at the top; under it the
// cards one under another at the column's full width, about 48px apart, five
// a page; under them „Previous · 1 / 7 · Next".
//
// ── A DUMB BAND (the PriceList / Hero shape, owner fb-459): every string
// arrives finished and every href built — the blog's pages are the ONE
// populator (they read lib/blog, word each day through Intl.DateTimeFormat,
// build the hrefs through localeHref). No message key, no t(), no data
// import, no hook, no 'use client': a Server Component that compiles into the
// static HTML of every blog page and ships no JavaScript of its own (§16) —
// ui/Image brings its optimizer's small island with each picture, as on every
// page with a photograph. It composes two sections through their public
// components only (§4: sections/PostCard, sections/Pagination) and three
// atoms (ui/Container, ui/Eyebrow, ui/Heading). PostList.test.tsx pins the
// directive's absence and the import surface from the source text, because
// no runtime assertion can see either.
//
// ── THE BAND: ui/Container's PAGE-BAND RECIPE. The outer is an UNNAMED
// <section> with no paint of its own — the 404 page's and the privacy
// policy's reasoning: the shell's <body> already carries the page ground,
// the page's <main> is the landmark, and a region named by the <h1> would
// only repeat the page's name to a screen reader. Container owns the width
// and the container context; the RHYTHM box inside it is the privacy
// policy's, to the class: 3rem between its blocks, and its top step under the
// sticky header — 3rem on a column under 32rem, 4rem from it, 5rem from 48rem.
// That one gap is the band's ONE spacing rule (§6.4: the parent owns spacing
// through gap utilities): opener → list → navigation, each 3rem apart. So the
// navigation is placed by the band without a className of its own and keeps
// no margin — and since a flex gap opens only between boxes that exist, the
// navigation leaves no space behind on a one-page blog, where it renders
// nothing. MEASURED on the stories at the six named widths: 48px from the
// opener to the first card, between every two cards and from the last card
// to the navigation; the top step 48px at 320 and 390, 64 at 768, 80 from
// 1280; nothing scrolls sideways at any of them.
//
// ── THE OPENER, CENTRED like the reference's heading: ui/Eyebrow over
// ui/Heading's `hero` step — §15.24's ONE h1 step — worn through `asChild` by
// a real <h1>, the page's one (§9), 8px apart (SectionHeading's `gap-2`, the
// house's eyebrow-to-title gap, which DoctorIntro keeps at this same step).
// The wrapper centres the two boxes and the heading's lines — display text
// may inherit centring (§15.15 b) — while the eyebrow's <p> takes
// `text-center` ON THE ELEMENT, because globals.css aligns every <p> to start
// at the base tier and a rule that matches the element beats an inherited
// value. DOM ORDER IS VISUAL ORDER, the eyebrow first (SectionHeading's
// order). DoctorIntro puts its <h1> first because its eyebrow is a
// qualification that needs the doctor's name before it; here the eyebrow is a
// kicker („Blog"), and with it first a screen reader that lands on the <h1>
// reads the articles next. MEASURED on the stories (Chromium, the real faces,
// behind a classic 15px scrollbar): „Articole și noutăți" holds ONE line at
// every named width — 32px at 320 and 390 (247px of a 273px column), 42.9 at
// 768, 60.8 at 1280, 69.8 at 1536, 72 at 1920 — centred on the column to a
// hundredth of a pixel, no word split.
//
// ── THE LIST: a <ul role="list"> — the role is load-bearing in WebKit
// (eslint.config.mjs's list-role exception) — of one <li> per post, each
// holding ONE sections/PostCard at its default level, an <h2> under the
// page's <h1>. The cards fill the column, the reference's full width and the
// width PostCard's `sizes` is derived from.
//   · 3rem APART (`gap-12`) — the reference's ~48px — AND THE GAP HOLDS THE
//     JUMP: a card grows to 105 % under a resting pointer (PostCard's THE
//     CARD JUMP), 2.5 % of its height above and below, so the gap must stay
//     wider than that growth from both neighbours. MEASURED on the stories:
//     the stacked cards run 657–793px at 320 and 672–728 at 390, the rows
//     326–370 at 768, 282 at 1280, 333 at 1536 and 410 at 1920 — the
//     tallest grows 19.8px a side, 28px less than the gap.
//   · THE FIRST CARD PRELOADS its picture (PostCard's `preload`: no lazy
//     loading, a high fetch priority, a preload link) and every other card
//     stays lazy. The band says which card is first; a card cannot know where
//     it sits. MEASURED on the stories, that picture is 223 and 286px square
//     at 320 and 390 and 232 to 360px beside the words from 1280 up, and it
//     ends inside the first screen even below the site's header (its 6rem
//     and 2px of border) — the page's likely LCP. On a 768 tablet the row's
//     picture is 129px and a card's summary may outweigh it; the preload then
//     costs one small file.
//   · THE SLUG IS THE REACT KEY AND NEVER AN ATTRIBUTE: it is destructured off
//     before the spread, because PostCard spreads every prop it does not know
//     onto its <article>, where a `slug` would print as an attribute.
//
// ── THE EMPTY STATE IS THE OPENER ALONE. An empty `posts` renders the
// eyebrow and the <h1> and no list — and an empty blog still has its one
// page (lib/blog's pageCount), so the navigation renders nothing either. It
// is a state the shipped site never reaches: the data tests refuse to SHIP an
// empty src/content/blog/posts.json — tests/unit/blog-data.test.ts ("ships
// posts") and src/lib/blog/blog.test.ts both fail CI on one (G2 typescript,
// 2026-10-14, which found this paragraph saying an empty blog could ship). It
// is kept so that the band never crashes on an empty list — a story, a test,
// any caller that hands it none. Not `null`, the way the reviews and the staff
// bands answer an empty list: those are bands WITHIN a page, where a titled
// band over nothing is a promise with nothing behind it; this band IS the
// page, so `null` would leave a page whose tab title still names it without
// its one <h1> (§9) and with nothing between the header and the footer. No
// "no articles yet" sentence is invented here: that is a word, and a finished
// `empty` prop from the page is the lever if one is ever wanted.

/** One card's content plus its slug — the React key, and the article's address once articles exist. */
export type PostListItem = PostCardContent & { slug: string };

/** The navigation's data — PaginationProps without the native <nav> props. */
export type PostListPagination = Pick<
  PaginationProps,
  | 'label'
  | 'current'
  | 'total'
  | 'status'
  | 'previousLabel'
  | 'nextLabel'
  | 'previousHref'
  | 'nextHref'
>;

export type PostListProps = {
  /** The mono kicker above the page's <h1>, finished text (e.g. „Blog"). */
  eyebrow: string;
  /** The page's <h1>, finished text (e.g. „Articole și noutăți"). */
  title: string;
  /**
   * The posts this page shows, in order, every string finished (§8.1). Empty
   * renders the opener alone (the header's THE EMPTY STATE).
   */
  posts: readonly PostListItem[];
  /** The accessible name of every card's tag list, finished (e.g. „Categorii"). */
  tagsLabel: string;
  /**
   * The page navigation under the list — sections/Pagination's own data,
   * hrefs built by the page. One page (`total` 1) renders no navigation.
   */
  pagination: PostListPagination;
};

/** THE RHYTHM BOX (the header's THE BAND): the privacy policy's, to the class
 *  — 3rem between the band's blocks, the top step under the sticky header. */
const RHYTHM = 'flex flex-col gap-12 py-12 @lg:py-16 @3xl:py-20';

/** THE OPENER (the header's THE OPENER): the two boxes centred, 8px apart,
 *  and the heading's lines centred with them. */
const OPENER = 'flex flex-col items-center gap-2 text-center';

/** THE LIST (the header's THE LIST): one card a row, 3rem apart. */
const LIST = 'flex flex-col gap-12';

export function PostList({
  eyebrow,
  title,
  posts,
  tagsLabel,
  pagination,
}: PostListProps): ReactElement {
  return (
    <section>
      <Container>
        <div className={RHYTHM}>
          <header className={OPENER}>
            {/* Centred ON THE ELEMENT (§15.15 b): the base tier aligns every
                <p> to start, and that beats the wrapper's inherited value. */}
            <Eyebrow className="text-center">{eyebrow}</Eyebrow>
            <Heading size="hero" asChild>
              <h1>{title}</h1>
            </Heading>
          </header>
          {posts.length > 0 ? (
            <ul role="list" className={LIST}>
              {posts.map(({ slug, ...content }, index) => (
                <li key={slug}>
                  <PostCard
                    {...content}
                    tagsLabel={tagsLabel}
                    preload={index === 0}
                  />
                </li>
              ))}
            </ul>
          ) : null}
          <Pagination {...pagination} />
        </div>
      </Container>
    </section>
  );
}
