import { useId, type ComponentPropsWithRef, type ReactElement } from 'react';
import { Card } from '@/components/ui/Card/Card';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
import { Heading } from '@/components/ui/Heading/Heading';
import { Image } from '@/components/ui/Image/Image';
import { PillButton } from '@/components/ui/PillButton/PillButton';
import { Text } from '@/components/ui/Text/Text';
import { cx } from '@/lib/cx/cx';
import type { ImagePath } from '@/lib/image-path/image-path';
import type { IsoDate } from '@/lib/time-ago/time-ago';

// sections/PostCard — ONE blog post as a card on the blog index: a square
// picture and, beside it, the post's title, a small line with the day it
// appeared and who wrote it, its categories as chips, and a summary; on a
// narrow card the same pieces stack, the picture on top at the card's full
// width. The owner, verbatim (2026-10-11): "create a page very much alike this
// one: https://www.infiniswiss.com/blog with navigation of pages and cards
// with an image, title, a summary and date and creator. the pages should not
// be clickable yet. so just react on hover like a button … article title is
// heading, image you have ui atom, text you have, keep "ai" "software"
// dependent stuff, these should be the buttons from menu at rest (so not
// current one) the assets from the menu item from phone navigation on
// services, the rounded left right edge pill with border". The reference card,
// as the planner measured it: a full-width white card, a square thumbnail on
// the left — a quarter of the card — and, top to bottom beside it, the title,
// a muted line with the date and the author, the category labels, the
// summary. ui/Card's own header named this consumer before it existed (its
// promotion paragraph: "PostCard on the blog index").
//
// ── TIER: THE SHARED-COMPOSITION SUB-KIND (§4), sections/ReviewCard's row.
// It composes six atoms — ui/Card, ui/Image, ui/Heading, ui/Eyebrow,
// ui/PillButton, ui/Text — binds no site data and calls no t(): every string
// arrives FINISHED (§8.1), the date's words included (`date.label`, the
// page's own Intl.DateTimeFormat output, §8.3) and the tag list's name
// (`tagsLabel`). The blog index is its one consumer, and the page maps its
// posts to PostCardContent; reuse never promotes a composite (§4).
//
// ── THE ROOT IS THE SECTION'S OWN <article>, AND IT JUMPS. The owner's "just
// react on hover like a button" is the house's button jump — ui/Button's
// `motion` axis, its THE JUMP paragraph: the box grows to 105 % on hover over
// its own 200ms clock, and holds still under reduced motion. CARD_JUMP below is
// that cell's SCALE HALF, spelled for an element that is not a button: no
// colour list to share a clock with and no press state — there is nothing to
// press. It rides the <article> and NOT ui/Card, for two reasons: a Card's
// className is placement only (§6.8, its header's className paragraph), and
// the card paints its frame on its own `--fade` transition — on the element
// inside this one, so the two `transition` declarations never meet on one
// element and neither can stretch the other. KEEP IN SYNC with ui/Button's
// `motionClasses` jump cell — the 200ms, the curve, the 105 % and the
// reduced-motion reset; tests/unit/jump-census.test.ts holds this constant.
// THE CURVE IS THE CSS KEYWORD, spelled `ease-[ease-out]`: the jump cell's
// timing list carries the keyword, cubic-bezier(0, 0, 0.58, 1), while
// Tailwind's own utility of that name is its theme's curve, cubic-bezier(0, 0,
// 0.2, 1) — the arbitrary value is what makes "the same jump" true to the
// curve as well as to the clock. `hover:` answers only `(hover: hover)`
// devices (Tailwind v4), so a tap on a phone never leaves a card grown, and
// under `prefers-reduced-motion` the card never moves (§9). No shadow grows
// with it — the old pop's other half, which the jump census refuses
// everywhere.
// THE FALSE AFFORDANCE, RECORDED, NOT AN ACCIDENT. Until the article link
// lands — a real <a> on the title, stretched over the card (§15.13: a plain
// href, a full document load) — a card that answers a hover promises a press
// the page cannot keep. The owner chose that knowingly ("the pages should not
// be clickable yet. so just react on hover like a button"), so the card stays
// INERT in every other way: no <a>, no <button>, no tabindex, no role, and no
// pointer cursor — a keyboard or screen-reader visitor meets nothing to
// activate. The chips' own hover (below) is the same placeholder. When the
// link arrives it takes the jump with it; nothing else here moves.
//
// ── THE NAME. The <article> is named by its title through
// `aria-labelledby`, so an article list reads „<title>, article" (the
// ReviewCard and PersonnelCard pairing). The id comes from React's useId():
// server-safe and hydration-stable (PersonnelCard D4), so a page of cards
// can never collide, and the caller hands no id in — the content has no
// natural one until the slug arrives with the link. THE SPREAD RIDES FIRST,
// then the pairing and the className (PersonnelCard D10's belt): the props
// Omit `aria-label` and `aria-labelledby`, but TypeScript exempts a
// hyphenated JSX attribute from its excess-property check, so a caller's
// `aria-labelledby="…"` compiles — and then lands BEFORE this one and loses.
// A caller's `aria-label="…"` compiles the same way, and nothing of the
// card's own overwrote it, so it LANDED: a second name in the markup beside
// the title's (`aria-labelledby` wins the name computation, but the stray
// attribute stayed in the DOM). The card therefore resets it to `undefined`
// after the spread (G2 typescript, 2026-10-14 — sections/TeamRoster's belt).
// The level DEFAULTS to 2: the blog index puts its cards straight under the
// page's <h1>. A page that groups them under a band's <h2> passes 3; the
// TITLE_ELEMENT table is the growth gate (SectionHeading's ELEMENT
// precedent). The title wears ui/Heading's `band` — §15.24's h2 step —
// answering to ui/Card's own `@container`: 30px on a card under 28rem of
// content (every phone), 36px from it.
// THE TITLE'S BELT (G2 a11y, 2026-10-14, SC 1.4.12): `wrap-anywhere`
// (overflow-wrap: anywhere) on the title's own element, through the slot's
// className merge — a wrapping rule on the section's own heading, never a
// size (§6.8), as the numbers band wears it on its title (DoctorStats' TITLE
// paragraph) and PersonnelCard D20 on a doctor's name. Text spacing widens a
// word — 0.12em a letter — and the site's `hyphens: auto` breaks one only
// where the engine has a Romanian dictionary (§15.25 records Chromium's own
// pattern set, on Android, Windows and Linux, as believed to carry none).
// MEASURED on the built Storybook (Chromium, the real face, LongWords at 320
// behind a classic scrollbar — a 223px line): under SC 1.4.12's spacing with
// hyphenation off, „Parodontopatia" measured 251.5px and, without the belt,
// ran 28.5px past the card's content edge — 3.5px past its frame; with the
// belt it breaks inside.
// `anywhere` breaks only a word that cannot fit its line by itself — spaces
// and hyphenation points come first — so in every other case measured (with
// the dictionary or without, at ordinary spacing or SC 1.4.12's, LongWords at
// 320, 390 and 1536 and Default at 390) the title's lines and height were
// identical with and without it.
//
// ── THE LAYOUT, CARD-RELATIVE (§6.5). ONE grid, one column below the card's
// `@lg` — 32rem of ui/Card's CONTENT box, the 25px of border and padding per
// side (ui/Card's SUM RULE) already spent — and the reference's quarter /
// three quarters from it, 2rem apart, both cells at the top. With the card
// filling ui/Container's column (90vw on a phone, 80vw from a 600px window,
// its THE PHONE GUTTER) the row starts where 0.8 × W − 50 ≥ 512: at a 702.5px
// window, or 721.25 behind a classic 15px scrollbar, which the column loses
// as well. Below it everything stacks, picture first, 1.5rem apart — the
// picture is a block, not a line of text, so it stands one step further off
// than the words' own 12px rhythm. MEASURED on the stories (Chromium, the
// real faces, the band recipe): one column at a 721px window and two at 722
// behind the scrollbar, two from 703 without it; on the net's widths the
// picture is 223 and 286px square stacked at 320 and 390, and 129, 232, 283
// and 360px beside the words at 768, 1280, 1536 and 1920 — the title 30px
// stacked and 36px in the row.
// DOM ORDER = VISUAL ORDER in both shapes: picture, title, date line, tags,
// summary. `grid-cols-1` is `minmax(0, 1fr)`, so a long word can never push
// the single column open; the row's two tracks carry the same zero floor.
//
// ── THE PICTURE: a square cell (`aspect-square`, both shapes — the
// reference's thumbnail) holding ui/Image's `framed` situation on `fill`: the
// photo covers the cell, crops the overflow and wears its own 12px corner
// (Image D2, D3). The cell is `relative` because `fill` places the picture
// against the nearest positioned ancestor (next/image warns without one). Lazy
// below the fold, unless the page says the card is first (`preload`, the
// PersonnelCard D18 pair: no `loading="lazy"`, a high fetch priority, a
// preload link with the same `sizes`) — the page's likely LCP element.
// THE `sizes`, DERIVED: stacked, the picture is the card's content box — the
// column less 50px, under 90vw at every phone and tablet width; in the row it
// is a quarter of the content after the gap, (0.8 × W − 50 − 32) / 4 =
// 0.2 × W − 20.5px, under 20vw. The switch sits at 46rem (736px), past the
// row's start with or without a scrollbar, so no window is told 20vw while
// the picture still spans the card; the price is a 90vw file for a quarter-
// width picture between 702.5 and 736px with no scrollbar. Past a 2000px
// window, where ui/Container's gutter stops at 12.5rem, the quarter outgrows
// 20vw by a little — 1.5 % at 2560px, 9 % at 3840 — a file a step smaller,
// never a wrong box. The space before each `vw` is load-bearing
// (PersonnelCard's THE SPACE BEFORE `21vw`): next/image reads the smallest
// share, 20vw, and keeps the candidates from 640 × 0.2 = 128px up — the
// least this card ever asks for is 20vw of 736px, 147px.
//
// ── THE DATE LINE: ui/Eyebrow — the mono, muted, uppercased micro-label —
// holding a <time> whose `dateTime` is the ISO day (machines read it; the eye
// reads the page's words), then the author. THE SEPARATOR IS A MIDDLE DOT,
// never a dash (the owner's D-DASH rule — the team-role precedent keeps `·`):
// `aria-hidden`, so a screen reader never names the glyph, and a comma only a
// screen reader reads (`sr-only`), so it pauses between the day and the name.
// A no-break space glues the dot to the date, so a wrapping line ends on
// „2026 ·" instead of opening on the dot. The date and the name are each
// an `inline-block`, so on a phone the line breaks BETWEEN them rather than
// inside a name — and a name longer than the whole line still wraps inside
// its own box instead of overflowing it; `hyphens-none` because a name never
// splits at a syllable (PersonnelCard D4, ReviewCard's credential).
//
// ── THE TAGS: the price strip's chips AT REST — ui/PillButton with no
// `active`, `asChild` onto each <li> of a real list named by `tagsLabel`, so
// a screen reader hears „Categorii, list, 2 items". `role="list"` is
// load-bearing in WebKit (eslint.config.mjs's list-role exception). The chips
// keep the atom's own hover — the edge and the label turn lavender — the same
// placeholder as the card's jump: today a tag goes nowhere. No tags, no list
// (an empty named list would be announced as „list, 0 items"). THE KNOWN
// CEILING: a chip never wraps (PillButton's `whitespace-nowrap`, right for a
// strip that scrolls sideways), so a tag wider than the card's line runs past
// it — the line is 238px at a 320 phone, 223px behind a classic scrollbar.
// MEASURED there with the real face: „estetică dentară" (16 characters) is a
// 175px chip and fits both, „urgențe stomatologice" (21) is 228px and fits
// the phone's line only, „stomatologie pediatrică" (23) is 239px and fits
// neither — about 20 characters is the safe length, a ceiling the blog's
// data is the place to hold, never this card.
//
// ── THE SUMMARY: ui/Text, muted — the reference's grey paragraph — last,
// start-aligned like all site prose (§15.15 b).
//
// ── WHAT THIS SECTION DOES NOT OWN: its width and its margins (§6.4/§6.8 —
// the page's list places it), the gap between cards — which must exceed the
// jump's growth, 2.5 % of a card's height above and below: 8 to 10px for the
// row's 333–410px cards at 1536 and 1920, 16px for a 648px stacked one in a
// narrow window with a mouse (sideways the growth, 2.5 % of the column a side,
// always stays inside ui/Container's 5–10vw gutter) — and any height (ui/Card's
// `h-full` is placement, for a parent that stretches the article).
//
// ── ZERO ISLANDS OF ITS OWN (§16): no 'use client', no handler, no state;
// useId is the one hook and it is server-safe. ui/Image brings its optimizer's
// small island with the picture, as on every page with a photograph.
// PostCard.test.tsx pins the directive's absence and the import surface from
// the source text, because no runtime assertion can see either.

/** One post as this card shows it — every string FINISHED (§8.1). */
export type PostCardContent = {
  /** The post's title, the card's heading — finished text. */
  title: string;
  /** One or two sentences under the title — finished text. */
  summary: string;
  /**
   * The day the post appeared: `iso` is the machine half, printed as the
   * `dateTime` of a <time>; `label` is the page's own words for it (the
   * page's Intl.DateTimeFormat output, §8.3), uppercased in CSS. READ-ONLY,
   * like the picture below (G2 typescript, 2026-10-14): lib/blog hands its
   * posts over as a `Readonly` BlogPost, and a mutable shape here would drop
   * that guarantee at the section's boundary — the card only ever reads it.
   */
  date: Readonly<{ iso: IsoDate; label: string }>;
  /** Who wrote the post, as the post signs it. */
  author: string;
  /** The picture under public/images/ (§11) and its alt — '' when decorative.
   *  Read-only, as lib/blog's own BlogPost holds it (see `date`). */
  image: Readonly<{ src: ImagePath; alt: string }>;
  /** The post's categories, one chip each; empty renders no list at all. */
  tags: readonly string[];
};

/** The title's heading level (THE NAME): 2 under the page's <h1>, 3 under a
 *  band's <h2>. The ELEMENT follows it; the step does not. */
export type PostCardHeadingLevel = 2 | 3;

type PostCardOwnProps = PostCardContent & {
  /** The accessible name of the tag list, finished text (e.g. „Categorii"). */
  tagsLabel: string;
  /** The title's heading level (THE NAME). @default 2 */
  headingLevel?: PostCardHeadingLevel;
  /**
   * The picture is likely its page's LCP element — the first card of a page:
   * load it at once, at high fetch priority, with a preload link. The PAGE
   * says so; a card cannot know where it sits. @default false
   */
  preload?: boolean;
};

export type PostCardProps = PostCardOwnProps &
  // The card's own names leave the native half — `title` is HTML's tooltip
  // attribute, and an intersection would leave it meaning two things at the
  // call site — and so do `children` (content arrives as named props) and the
  // two ARIA naming attributes: the article's name is its title's alone.
  Omit<
    ComponentPropsWithRef<'article'>,
    keyof PostCardOwnProps | 'children' | 'aria-label' | 'aria-labelledby'
  >;

/** The element behind `headingLevel` — a lookup, so a widened union cannot
 *  compile until this table names its tag. */
const TITLE_ELEMENT: Record<PostCardHeadingLevel, 'h2' | 'h3'> = {
  2: 'h2',
  3: 'h3',
};

/** THE CARD JUMP (the header): ui/Button's jump, the scale alone. KEEP IN
 *  SYNC with ui/Button's `motionClasses` jump cell — 200ms, the keyword
 *  ease-out, 105 %, still under reduced motion. One static string: Tailwind
 *  reads class names from source text. */
const CARD_JUMP =
  '[--jump:200ms] transition-[scale] duration-(--jump) ease-[ease-out] ' +
  'hover:scale-105 motion-reduce:hover:scale-100';

/** One column below the card's `@lg`, the reference's 1 : 3 row from it —
 *  both cells at the top, 2rem apart; stacked, 1.5rem apart (THE LAYOUT). */
const GRID =
  'grid grid-cols-1 gap-x-8 gap-y-6 ' +
  '@lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] @lg:items-start';

/** The picture's square cell — positioned, for `fill` (THE PICTURE). */
const PICTURE_CELL = 'relative aspect-square';

/** The words beside — or under — the picture, on the card's own 12px rhythm. */
const WORDS = 'flex flex-col gap-3';

/** The picture's `sizes` (THE PICTURE's derivation): a quarter of the card
 *  from a 46rem window, the card's width under it. */
const PICTURE_SIZES = '(min-width: 46rem) 20vw, 90vw';

/** The eager pair the page asks for on its first card (THE PICTURE). Spread
 *  only when asked, so a lazy card hands ui/Image nothing extra at all. */
const EAGER = { preload: true, fetchPriority: 'high' } as const;

export function PostCard({
  title,
  summary,
  date,
  author,
  image,
  tags,
  tagsLabel,
  headingLevel = 2,
  preload = false,
  className,
  ...rest
}: PostCardProps): ReactElement {
  const titleId = useId();
  const TitleElement = TITLE_ELEMENT[headingLevel];

  return (
    // The spread FIRST, then the name pair and the className (THE NAME's
    // belt): native props reach the <article>, nothing that slipped past the
    // Omit can rename it, and a smuggled `aria-label` is reset so it never
    // stands in the markup beside the title's name.
    <article
      {...rest}
      aria-label={undefined}
      aria-labelledby={titleId}
      className={cx(CARD_JUMP, className)}
    >
      {/* The doctor cards' and the reviews deck's idle frame, with the house
          corner and no glow; `h-full` is placement — it fills an article a
          list stretches (ui/Card D4). */}
      <Card tone="framed" className="h-full">
        <div className={GRID}>
          <div className={PICTURE_CELL}>
            <Image
              variant="framed"
              fill
              src={image.src}
              alt={image.alt}
              sizes={PICTURE_SIZES}
              {...(preload ? EAGER : {})}
            />
          </div>
          <div className={WORDS}>
            {/* THE TITLE'S BELT (THE NAME): `wrap-anywhere` breaks only a
                word that cannot fit its line by itself. */}
            <Heading size="band" asChild>
              <TitleElement id={titleId} className="wrap-anywhere">
                {title}
              </TitleElement>
            </Heading>
            {/* THE DATE LINE (the header): the day, a dot for the eye and a
                comma for the ear, then the name — each part whole. */}
            <Eyebrow className="hyphens-none">
              <time dateTime={date.iso} className="inline-block">
                {date.label}
              </time>
              <span aria-hidden="true">&nbsp;· </span>
              <span className="sr-only">, </span>
              <span className="inline-block">{author}</span>
            </Eyebrow>
            {tags.length > 0 ? (
              <ul
                role="list"
                aria-label={tagsLabel}
                className="flex flex-wrap gap-3"
              >
                {tags.map((tag) => (
                  // The price strip's chip at REST (the header's THE TAGS):
                  // keyed by the tag itself — the blog's data refuses a tag
                  // listed twice.
                  <PillButton key={tag} asChild>
                    <li>{tag}</li>
                  </PillButton>
                ))}
              </ul>
            ) : null}
            <Text tone="muted">{summary}</Text>
          </div>
        </div>
      </Card>
    </article>
  );
}
