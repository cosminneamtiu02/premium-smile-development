import type { ComponentPropsWithRef, ReactElement } from 'react';
import { Heading } from '@/components/ui/Heading/Heading';
import { cx } from '@/lib/cx/cx';
import {
  hasVisibleText,
  hasVisibleWord,
  spelled,
} from '@/lib/visible-text/visible-text';

// sections/PostProse — an article's running text: its paragraphs and its
// subheadings, in the article's order. The owner, verbatim (2026-10-14), on
// the blog's article page: "text and subheadings, so smaller headings of the
// articles" — and, asked how the paragraphs align: start-aligned. The example
// he attached (a real-estate blog, the build contract's §1) runs a narrower
// centred column of paragraphs under its wide photograph, broken by small
// bold subheadings; this file is that column's text. sections/PostPage lays
// it into the page's 42rem measure between the cover and the conclusion, one
// PostProse for every run of paragraphs and subheadings that a picture block
// — a blog photo, a gallery or a before/after — does not interrupt (the build
// contract's §2: the route's populator, app/[locale]/blog/[slug]/populate.ts'
// THE GROUPING, groups the article's consecutive paragraph and heading
// blocks). Since the article holds blog photos its runs are short: the demo
// article hands over a paragraph, a photo, a subheading with two paragraphs,
// a photo, a subheading with two paragraphs, a gallery, … — ten runs between
// ten picture blocks, as PostPage.fixtures.ts lists them.
//
// ── A DUMB PROPS-IN PIECE (the contract's §0, §4's shared-composition
// sub-kind): zero message keys, no t(), no data import, no hook. Every string
// arrives FINISHED (§8.1) — the owner's own words, read from the article's
// JSON by the page. It composes ONE atom, ui/Heading, and asks two lib
// MECHANICS — lib/cx, and lib/visible-text for THE REFUSALS;
// PostProse.test.tsx pins the import surface from the source text.
//
// ── THE PARAGRAPH: a plain <p>, `text-lg` — sections/PrivacyPolicy's Prose,
// the site's long-reading text (§15.1's 18px body size, on `text-lg`'s own
// 28px line). Its INK is the body's, inherited — the default ink every prose
// paragraph on the site reads in. START-ALIGNED, the owner's pick, by the
// base tier's fence (globals.css: every <p> aligns to `start`, so no
// wrapper's centring can ever reach the prose — §15.15 b); nothing is spelled
// here for it. And the site-wide `hyphens: auto` (§15.14) is left ON: long
// words break at syllables where the engine has a Romanian dictionary, as on
// every other page's prose.
//
// ── THE SUBHEADING: ui/Heading's `subhead` step — 24px on a 32px line,
// semi-bold, the step built for exactly this (its 'subhead' JOINED
// paragraph) — worn through `asChild` by a real <h2>. AN <h2>, ALWAYS: the
// page's one <h1> is the post's title (sections/PostHeader), so an article's
// subheadings are the first level under it and the outline steps 1 → 2 with
// no level skipped (§9). §15.24's one-size-per-level rule is for BAND titles;
// an article's <h2> is a subheading inside a column of prose, so it reads at
// `subhead`, under the <h1>'s `hero-scaled` (sections/PostHeader) at every
// width (the atom's §15.24 note). Its ink is the atom's, ink-strong. Its own
// three utilities ride the <h2> itself (the slot merges them after the
// step's):
//   · `text-start` — START-ALIGNED, as the paragraphs are, and said ON THE
//     ELEMENT: a heading is display text, outside globals.css's
//     p/li/blockquote fence, so it would INHERIT a centring wrapper's
//     alignment (§15.15 b; logical, never left, §3) — sections/PostPhoto's
//     heading, the same rule.
//   · `hyphens-none` — A SUBHEADING NEVER SPLITS A WORD (2026-10-20, the
//     review's accessibility finding, measured). It is the owner's rule for
//     every title on the blog since 2026-10-15 — PostCard's title,
//     PostHeader's <h1> and PostConclusion's name all wear it — and the
//     site-wide `hyphens: auto` (§15.14) is for PROSE: inheriting it, the
//     German „Weiche, mittlere oder harte Borsten?" broke „har-te" at a
//     syllable on every column from about 284 to 296px wide — every phone
//     from 320 to 329, a 320 phone's 288px among them (Chromium on macOS,
//     which hyphenates German). With it off,
//     a subheading breaks at a space or after a hyphen its words carry,
//     never inside a word: PostProse.subheadings.test.tsx lays out every
//     subheading the articles ship, in the five languages, on the column of
//     every window from 320 to 440 — a phone's, and one behind a classic
//     scrollbar — and finds every word whole. The paragraphs keep the site's
//     rule (THE PARAGRAPH).
//   · `wrap-anywhere` — THE BELT (below), now the one thing that may break a
//     subheading's word: one too wide for a whole line by itself, which SC
//     1.4.12's letter spacing or a large default font can make. WHERE IT
//     BREAKS (PostCard's WHERE THE BELT BREAKS, the same record): under
//     `hyphens: none` the belt breaks such a word at ANY letter, with no
//     hyphen drawn — no content lost and nothing sideways, so no WCAG
//     failure, a word broken where a reader would not expect it — and the
//     property ignores a soft hyphen (U+00AD) too, so the copy cannot mark a
//     better place. THE LEVER, NAMED, NOT TAKEN — PostCard's: manual
//     hyphenation in place of none, a soft hyphen written where a long word
//     may break, and PostCard.fixtures.ts's `unitsOf` — which
//     PostProse.subheadings.test.tsx cuts its units with, through
//     `unitsAcrossLines` — taught to cut after one.
//
// ── THE RHYTHM — the section's own, and only gaps and room inside a box;
// never an outer margin on an atom (§6.4: ui/Heading's host is the <h2>, and
// the house spaces its stacks with gaps — PostList's and PostHeader's "no
// outer margin" tests):
//   · `gap-4` — 16px — between ANY two items: the house's prose step, the
//     privacy policy's paragraphs and the doctor page's biography alike, so an
//     article reads with the same paragraph breaks as every other long text
//     on the site. So a subheading stands 16px above its first paragraph;
//   · `pt-6` — 24px of ROOM ABOVE every subheading that is not the first
//     item, INSIDE its own box: 16 + 24 = 40px from the text above it to the
//     subheading's line. 40 over, 16 under — the subheading binds to the text
//     it introduces, not to the text it closes (proximity), and a run of
//     paragraphs reads as one section of the article.
//   PADDING AND NOT A MARGIN, the dispatch's word ("never an outer margin on
//   an atom") and the house's spacing law. What it costs: the <h2>'s BOX
//   begins at the room's top, so a box-to-box reading says 16px where the eye
//   sees 40 — the stories measure from the heading's LINE (its box's top plus
//   its padding); and a screen reader's highlight round the heading is 24px
//   taller, blank above the words. Should a subheading ever be the target of
//   a fragment link, the room lands under the sticky header — harmless.
//   · A SUBHEADING THAT OPENS THE STACK TAKES NO ROOM: the room above the
//     whole block is the page's (PostPage's measure spaces its blocks), so a
//     PostProse that starts with a subheading — the run after a picture
//     block, a photo, a gallery or a before/after — never stacks the two.
//     Decided by the item's INDEX at render, not by a `:first-child` rule:
//     the markup says which subheading has the room.
//   · A SUBHEADING THAT ENDS ITS RUN BREAKS "40 OVER, 16 UNDER": nothing of
//     this stack stands under it, so the space under it is the page's 40px
//     gap — and whatever room the next block keeps over its own top — never
//     16. The demo article has one — „Pentru copii", alone in its run
//     between a before/after and the second gallery, its paragraph after the
//     gallery: 40px under the pair's notes and 48 over the gallery's cards
//     (the gap, and the 8px the carousel keeps over its cards), so it sits
//     nearer the pair above, which it does not head. Nothing here can close
//     that gap; the lever is sections/PostPage's, a smaller gap after a run
//     that ends on a subheading — 16px, which with the carousel's own 8 sets
//     it 24 over the cards — or the article's own order. Recorded, not built.
//   MEASURED on the stories (Chromium, the real faces, the theme's own
//   sizes, at 320, 390, 1200 and 1536): 16px between every two paragraphs
//   and under every subheading, 40px from a paragraph to the line of the
//   subheading after it, at all four; PostProse.stories.tsx's MEASURED
//   paragraph has the rest. Inside THE BAND SCALE (below) every one of them
//   is × the design pixel.
//
// ── THE BELT, `wrap-anywhere` on every item (SC 1.4.10 and 1.4.12):
// `overflow-wrap: anywhere` breaks a run of letters ONLY when it cannot fit
// its line by itself — after spaces and hyphenation points have had their
// chance — so on ordinary words it changes nothing (the stories lift it and
// find every line of the demo article where it was). What it catches is the
// content an article's JSON does not refuse: a web address, an e-mail, a
// product code — a run longer than a phone's line, which would push the page
// sideways where the engine carries no Romanian dictionary to split it
// (§15.25 records Chromium's own pattern set — Android, Windows, Linux — as
// believed to carry none), or under SC 1.4.12's letter spacing. MEASURED on
// the Narrowest story with hyphenation off: a 42-character e-mail-shaped run
// lays out 390px wide, 9.3px a character, against the 273px line the
// runner's 320 leaves — about 30 characters fill a 320 phone's line — and
// with the belt it breaks inside. The lane's other blog text wears the same
// belt (PostCard's and PostHeader's titles).
//
// ── THE KEYS ARE INDICES — safe here by React's own rule for index keys
// (sections/DoctorProfile's THE KEYS ARE INDICES): the list is static,
// rendered on the server in the article's order, and never reordered,
// filtered or inserted into at runtime — this piece has no state and no
// island. An index names the same item on every render, and two paragraphs
// with the same words — which a text key would collide on — stay two.
//
// ── NOTHING TO SAY RENDERS NOTHING. An empty `items` returns `null`, not an
// empty <div>: the page's measure is a flex column, and a flex gap opens
// between every two boxes that exist — an empty stack, 0px tall, would still
// open the measure's gap on BOTH sides of itself, a double gap where nothing
// is. The page's populator never builds an empty run; this keeps the piece
// from leaving a trace if one ever reaches it.
//
// ── THE REFUSALS, named — never a block of the owner's text dropped, and
// never one drawn as nothing. What escaped the types is a TypeError naming
// it: a KIND (renderItem's `never` line) and, the same split, a TEXT that is
// no string at all (`finishedText`). An item whose text SHOWS NOTHING —
// empty, white space, or characters drawn invisibly: a zero-width space, a
// soft hyphen, a variation selector, a Hangul filler, a control character —
// is a RangeError naming the item: an empty <p> is a 0px box with the
// stack's 16px gap on both sides, a double gap where nothing is, a <p> of
// invisible characters a 28px blank line, and an <h2> of either a heading
// with no name in the page's outline. What SHOWS is lib/visible-text's
// `hasVisibleText` — a character outside its THE UNSEEN SET — the one test
// the blog's words are held to: by its parsers at build, by this piece and
// sections/BeforeAfter at render, by the CMSR scan and lib/share beside
// them. Until the round-2 review (2026-10-20) this file asked only what
// `trim()` leaves, and a text of one zero-width space passed. And a
// SUBHEADING must show a WORD — a letter or a digit, lib/visible-text's
// `hasVisibleWord`, the label rule lib/blog-article holds every subheading
// to at build: an <h2> of marks alone („.", „…") shows, and its name says
// nothing in the page's outline (SC 2.4.6), a RangeError too (round 2 of
// lib/visible-text's review, 2026-10-21; until then a subheading was asked
// `hasVisibleText` alone here). A paragraph keeps the text rule: prose may
// be any character that shows. EVERY REFUSAL
// SAYS WHERE: the item by its place in its run, and the RUN by its first
// words that show — an article hands this piece ten runs (sections/PostPage
// renders one PostProse for each), so „item 2" alone says not which; and the
// value as lib/visible-text's `spelled` writes it — every invisible character
// by its code point (`"\u{200B}"`), a value that is no string by its type
// (`undefined`, `<symbol>`) — where JSON.stringify, until round 1 of that
// module's review (2026-10-21), printed a symbol or a function as „the text
// undefined" and threw on a BigInt. None of them reaches the page from an
// article — lib/blog-article's `parseArticle` refuses such a text at build,
// by the same rule — so the refusals guard a story or a test that hands one
// in.
//
// ── WIDTH IS THE PARENT'S: a block-level flex column with no width, no
// measure and no margins of its own — PostPage's 42rem measure decides how
// wide the text runs, and PostProse fills it (§6.4, §6.8: a caller's
// className places the root, merged last).
//
// ── THE BAND SCALE (§15.32): this piece wears none of its own and must not
// import or re-spell ui/Container's strings (the build contract's §2) —
// PostPage wears them. Every length here is a THEME step (`text-lg`,
// `text-2xl`, `gap-4`, `pt-6`), which the remap redraws in the page's design
// pixel by itself, so on a laptop or a desktop the whole rhythm grows and
// shrinks in proportion, with nothing gated here.
//
// ── ZERO ISLANDS (§16): no 'use client', no hook, no handler, no state —
// the text compiles into the article's static HTML and ships no JavaScript.

/** One item of an article's running text, in the article's order — every
 *  string FINISHED (§8.1). */
export type PostProseItem =
  | Readonly<{ kind: 'paragraph'; text: string }>
  | Readonly<{ kind: 'heading'; text: string }>;

export type PostProseProps = {
  /**
   * The run's paragraphs and subheadings, in order: a paragraph prints as a
   * <p>, a subheading as an <h2> on ui/Heading's `subhead` step. Empty
   * renders nothing at all (NOTHING TO SAY RENDERS NOTHING); an item with no
   * text is refused by name (THE REFUSALS).
   */
  items: readonly PostProseItem[];
} &
  // The native <div> surface, minus the content's two ways in — `children`
  // and `dangerouslySetInnerHTML` (the content arrives as the items, and React
  // throws on markup set beside children) — minus a name, `aria-label` /
  // `aria-labelledby`: the stack is a GENERIC element, which ARIA forbids to
  // name (axe's aria-prohibited-attr), and the text speaks through its own
  // <h2>s — and minus a `role`, which would make the stack something it is
  // not: a "region" a landmark that needs the very name the stack refuses (a
  // written one reached the DOM with its name stripped — the round-2 review,
  // measured), an "img" or a "presentation" a run of text hidden or flattened.
  // All three are reset after the spread too (THE NATIVE SURFACE, in the
  // component): a spread of a wider object can carry any of them, and
  // TypeScript checks no hyphenated JSX attribute against a props type that
  // lacks it, so a written name still compiles — sections/PageHero's belt,
  // the same refusal. React 19 carries `ref` inside these props (§6.8).
  Omit<
    ComponentPropsWithRef<'div'>,
    | 'items'
    | 'children'
    | 'dangerouslySetInnerHTML'
    | 'role'
    | 'aria-label'
    | 'aria-labelledby'
  >;

/** THE RHYTHM's stack: every item 16px from the next. One static string —
 *  Tailwind reads class names from source text. */
const STACK = 'flex flex-col gap-4';

/** THE PARAGRAPH: the site's 18px reading text, with THE BELT. */
const PARAGRAPH = 'text-lg wrap-anywhere';

/** THE SUBHEADING's own utilities on its <h2> (the header's three bullets):
 *  start-aligned on the element, A SUBHEADING NEVER SPLITS A WORD, and THE
 *  BELT. The step is the atom's (`subhead`). */
const SUBHEADING = 'text-start hyphens-none wrap-anywhere';

/** THE ROOM ABOVE a subheading that is not the first item — inside its box,
 *  so 16 + 24 = 40px from the text above it to its line. */
const ROOM_ABOVE = 'pt-6';

/** How many of a run's first words name it in a refusal. */
const RUN_WORDS = 6;

/** The run an item stands in, as a refusal names it — by its first words that
 *  show, `spelled` (THE REFUSALS: an article hands this piece ten runs). */
function runOf(items: readonly PostProseItem[]): string {
  const count = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;
  const opening = items.find((item) => hasVisibleText(item.text));
  if (opening === undefined) {
    return `a run of ${count}, none of which shows text`;
  }
  const words = opening.text.trim().split(/\s+/u);
  const more = words.length > RUN_WORDS ? ' …' : '';
  return `the run of ${count} whose first words are ${spelled(words.slice(0, RUN_WORDS).join(' '))}${more}`;
}

/** What an item prints — its text, refused by name (THE REFUSALS): a TypeError
 *  when it is no string at all (a text that escaped the types, the split a
 *  kind takes), a RangeError when it shows nothing — empty, white space, or
 *  characters drawn invisibly (lib/visible-text) — and a RangeError for a
 *  subheading that shows no WORD, marks alone (lib/visible-text's
 *  `hasVisibleWord`), each naming the item, its run and its text `spelled`. */
function finishedText(
  item: PostProseItem,
  index: number,
  items: readonly PostProseItem[],
): string {
  if (typeof item.text !== 'string') {
    throw new TypeError(
      `PostProse: item ${index + 1}, a ${item.kind}, has the text ${spelled(item.text)}, which is not a string; it stands in ${runOf(items)}`,
    );
  }
  if (!hasVisibleText(item.text)) {
    throw new RangeError(
      `PostProse: item ${index + 1}, a ${item.kind}, has the text ${spelled(item.text)}, which shows nothing — ${
        item.kind === 'heading'
          ? 'an empty <h2>, or one of invisible characters, would put a heading with no name in the page’s outline'
          : 'an empty <p> would be a 0px box with the stack’s gap on both sides of it, and one of invisible characters a blank line'
      }; it stands in ${runOf(items)}`,
    );
  }
  if (item.kind === 'heading' && !hasVisibleWord(item.text)) {
    throw new RangeError(
      `PostProse: item ${index + 1}, a heading, has the text ${spelled(item.text)}, which names nothing — no letter or digit shows in it, and an <h2> of marks alone is a heading whose name says nothing in the page’s outline (SC 2.4.6); it stands in ${runOf(items)}`,
    );
  }
  return item.text;
}

/** One item as its element — `items.map` hands it the run as well, for a
 *  refusal to name. TOTAL over PostProseItem: the `never` line stops a third
 *  kind compiling until it is placed here, and a kind that escaped the types
 *  fails the build by name — never a block of the owner's text dropped in
 *  silence (THE REFUSALS). */
function renderItem(
  item: PostProseItem,
  index: number,
  items: readonly PostProseItem[],
): ReactElement {
  switch (item.kind) {
    case 'paragraph':
      return (
        <p key={index} className={PARAGRAPH}>
          {finishedText(item, index, items)}
        </p>
      );
    case 'heading':
      return (
        <Heading key={index} size="subhead" asChild>
          <h2 className={cx(SUBHEADING, index > 0 && ROOM_ABOVE)}>
            {finishedText(item, index, items)}
          </h2>
        </Heading>
      );
  }
  const unclassified: never = item;
  throw new TypeError(
    `PostProse: item ${index + 1} has the kind ${spelled(
      (unclassified as { kind?: unknown }).kind,
    )}, which is neither a paragraph nor a heading; it stands in ${runOf(items)}`,
  );
}

export function PostProse({
  items,
  className,
  ...rest
}: PostProseProps): ReactElement | null {
  if (items.length === 0) return null;
  return (
    // THE NATIVE SURFACE: the caller's native props ride FIRST; then a role
    // or a name that slipped past the Omit — written as an attribute, or in
    // the spread of a wider object — is reset, so the generic stack stays a
    // generic stack named by nothing (the props' Omit says why); then the
    // stack's own classes, merged with a caller's className LAST (§6.8), so a
    // page's placement utility lands on the stack itself.
    <div
      {...rest}
      role={undefined}
      aria-label={undefined}
      aria-labelledby={undefined}
      className={cx(STACK, className)}
    >
      {items.map(renderItem)}
    </div>
  );
}
