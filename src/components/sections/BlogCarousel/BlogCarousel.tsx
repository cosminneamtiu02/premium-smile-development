import { useId, type ComponentPropsWithRef, type ReactElement } from 'react';
import {
  CardCarousel,
  type CardCarouselLabels,
} from '@/components/sections/CardCarousel/CardCarousel';
import { PostCard } from '@/components/sections/PostCard/PostCard';
import type { PostListItem } from '@/components/sections/PostList/PostList';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';

// sections/BlogCarousel — the Home band of the blog's ARTICLE CARDS: the
// band's opener at the start, then the blog's own cards (sections/PostCard)
// drawn as MINIATURES — the blog list's card at 65 %, every card one width
// and one height — in the card carousel's FIVE-CARD window
// (sections/CardCarousel), circular, exactly as wide as the clinic's numbers
// band above it. The owner, verbatim (2026-10-17, the band's first word):
// "the fiver option should als look and behave the same but is jsut a wider
// section. maybe as wide as the screen. do not represent it in the article,
// represent it on home page tih cards that reference articles. place it
// below th in numbers category and above "Specialiștii cu care ne mândrim""
// — and, that evening, of the band he had first seen edge to edge of the
// screen: "the carrousell from the main page feels way too large. make it
// the width of the: """ ÎN CIFRE Experiență confirmată în timp """ section,
// while also implementing reactivity for cards and for hte component. i wnat
// the article cards to mentain same ratios as in blog, but while having 65%
// of the height. also the cards seem to vary in height. make them a fixed
// height so that they mentaiin same shape and adapt reactively width wise
// with screen in a sense in which they reduce height accordingley but if it
// narrows down too much width wise, it should adjust maybe from the
// gardeinted sides. these above comments are for the home page component, on
// blog they are already reactive as is." Asked to choose, he picked
// "Miniature (all 65%)": the blog list's card itself at 65 % — photo, title,
// author, summary, reading time, read-more, chips. So on Home the band
// stands between the clinic's numbers (sections/DoctorStats) and the doctors
// (sections/DoctorShowcase), as wide as the first, and every card opens its
// article. The blog list itself is untouched ("on blog they are already
// reactive as is").
//
// ── A DUMB BAND (the PriceList / Hero / PostList shape): every string arrives
// FINISHED and every href built — the Home page is the ONE populator
// (app/[locale]/(home)/populate.ts: lib/blog's posts in the page's language,
// each through the blog list's own `postCard`, so a card reads the same on
// both pages, and one name per card, „Articolul 3 din 12"). No message key,
// no t(), no data import, no locale, no 'use client': a Server Component that
// compiles into Home's static HTML (§16). It composes three sections through
// their PUBLIC components (§4: sections/SectionHeading, sections/CardCarousel,
// sections/PostCard — and sections/PostList's `PostListItem`, a card and its
// key, as a TYPE), one atom (ui/Container and its two band-scale strings) and
// lib/cx. The ONE island is CardCarousel's: the cards are server-rendered and
// handed THROUGH it (its THE SLOT — the ui/Ribbon / DoctorShowcase pattern),
// so it moves their boxes and never renders inside them; ui/Image brings its
// optimizer's small island with each picture, as on every page with one.
// BlogCarousel.test.tsx pins the directive's absence and the import surface
// from the source text, because no runtime assertion can see either.
//
// ── THE CAROUSEL, AS THE OWNER NAMED IT: `visible={5}` — "the fiver option",
// the centre card, its two neighbours whole and the next pair 60 % past the
// window's edges, fading; `mode="loop"` — circular: after the last card the
// first comes in from the right, the cards moving on by themselves one every
// 5.5 s until any press stops them for good (CardCarousel's THE CONSUMPTION
// LAW, the owner's OPTION 1); `cardWidth={CARD}` and `cardHeight="tallest"` —
// THE FIXED SHAPE, below: one width (CardCarousel's THE FIXED CARD) and one
// height (its THE CARDS' HEIGHT) for every card. With a fixed card NOTHING
// SWITCHES: the five-card window stands at every width — the three-card
// fallback is the column's share's, and a fixed card never changes size — and
// a column too narrow for it is cut from the faded sides (THE SIDES). The two
// clocks, the arrows, the progress dots and the hand are the carousel's; this
// band passes no clock option, so it runs the carousel's default rhythm, the
// Hero's and the reviews deck's 5.5 s. Whether that suits THESE cards is an
// OPEN question, the owner's call: a card's title and summary take 18 to 20 s
// to read (BACKLOG.md entry 2, its dwell question — the levers are the
// carousel's interval constant or a dwell per card from its own words).
//
// ── THE CARDS: sections/PostCard, the blog list's card — its frame, its
// photograph with the categories over it, its title, author, summary, reading
// time and „Citește mai mult…", and its ONE link, the whole card (PostCard's
// THE LINK). EVERY CARD PROP BY NAME (sections/PostList's THE LIST, G2
// typescript 2026-10-14): PostCard spreads every prop it does not know onto
// its <article>, so a field the page adds to an item (the `slug`) would print
// as an attribute if an item were spread. The slug is the React key. Four of
// PostCard's props are this band's own answers: `miniature={MINIATURE}` (THE
// MINIATURE), `className="h-full"` (THE FIXED SHAPE — placement, §6.8: the
// card fills the height of the box the carousel gives it), `headingLevel={3}`
// (THE OUTLINE) and `sizes`, the picture hint derived for this band's card
// (THE `sizes`, DERIVED). NEVER `preload`: the band stands under the Hero and
// the numbers, below the first screen at every window (PostCard's `preload`
// is a page's LCP card). The side cards are previews — CardCarousel makes
// every card but the centre one `inert` and aria-hidden — so ONE card's link
// is in the Tab order at a time, and a press on a side card stops the
// carousel instead of following its link (CardCarousel's tap).
//
// ── THE BAND: ui/Container's PAGE-BAND RECIPE. The outer is the semantic,
// full-bleed <section> owning the paint, `bg-page` — the ground of every band
// under the Hero — and nothing else (THE BELT LEFT WITH THE BLEED, below);
// ui/Container owns the width and the container context; the RHYTHM box
// inside it owns the band's room above and below — `py-12 @lg:py-16
// @3xl:py-20`, the rhythm of the Home bands around it (DoctorStats',
// ClinicLocation's) — and its ONE gap, from the opener to the carousel: 32 /
// 40 / 48 on the column's `@lg` and `@3xl` steps, the space ClinicLocation
// keeps between its opener and its map (§6.4: the band owns its children's
// spacing; neither child brings a margin). Inside the rhythm box the opener,
// then THE CAROUSEL'S OWN PIXEL — a box round the carousel alone (THE FLOOR).
// No outer margin: the page owns the rhythm between bands.
//
// ── THE BAND SCALE, THE OPENER (ui/Container's paragraph and its recipe rule
// 5; CLAUDE.md §15.32 — "EVERY band under the Hero draws in ONE scale"): the
// rhythm box wears `bandColumnClasses` and `bandScaleClasses`, imported, so on
// a laptop or desktop — a fine pointer, an engine that registers custom
// properties, a column of max(56rem, 896px) — the opener's eyebrow and <h2>
// are every Home band's size and stand on their left edge, the band's room and
// its gap with them, and past a 96rem column the rhythm box caps and centres
// like every scaled band's. The CAROUSEL inside draws in a pixel of its own,
// floored (THE FLOOR) — NOT the reviews deck's exception
// (sections/ReviewsCarousel's THE OPENER'S SCALE: there the deck draws
// unscaled; here the carousel scales from the owner's window up). Phones,
// touch tablets and narrower windows keep the theme's rem (§7). The regime's
// trades — a browser zoom and the default font size inside it, the jump at
// its step — are DoctorShowcase's D10 and §15.32's, and hold for this band's
// opener as for every band of Home; its carousel's are THE FLOOR's.
//
// ── THE WIDTH — "make it the width of the ÎN CIFRE section". The carousel
// sits IN the rhythm box, so it is the column ui/Container gives every Home
// band, capped at 96rem and centred past it inside the band scale: exactly
// sections/DoctorStats' rhythm box on Home, which wears the same two strings
// (it is `scaled` there). No `vw`, no gutter copied (ui/Container stays the
// ONE definition, §15.15 a): the two bands share their column by
// construction, and BlogCarousel.scale.test.tsx renders the two together and
// holds the carousel's box, its stage and its arrows to the numbers band's
// column — its left edge and its width, to the hundredth — at every window
// it samples.
// THE BLEED, HISTORY (the band's first shape, the morning of 2026-10-17 — "on
// main screen make it as wide as the screen"): the carousel's root ran out to
// the screen's edges through `margin-inline: calc(50% − 50vw)`, its card the
// carousel's share (CardCarousel's THE CARD CAP lifted), 0.5rem in from each
// edge on a fine pointer so a classic scrollbar's overshoot never cut an
// arrow's ring, and the band wore an `overflow-x-clip` belt (with its Safari
// ≤ 15 twin) to swallow that overshoot. The owner's "way too large" retired
// all of it the same evening.
// THE BELT LEFT WITH THE BLEED: it existed for the overshoot, and with the
// carousel in the column nothing in the band reaches past it — the stage clips
// its own sides (CardCarousel's THE FADE), the arrows stand inside the stage,
// the progress dots wrap. MEASURED with the belt taken off (Chromium in the
// test runner, the real stylesheet and faces): the page's and the band's
// scroll width equal their box at every window from 280 to 2560, in Romanian
// and German, and from 280 to 390 in Romanian, German and French under SC
// 1.4.12's text spacing as well. So the outer is `bg-page` alone (the owner's
// standing rule: no dead code).
//
// ── THE MINIATURE — PostCard's paragraph of that name, which this band asks
// for: every card is the blog list's card drawn as a copy of itself at
// MINIATURE, 0.65 — every theme length inside it (its padding, its corner,
// every gap, every type step, the read-more's box, the chips) at 0.65 × the
// design pixel the card inherits, the frame, the ring and the chips' edge
// staying CSS px — so in a slot 0.65 of the list's card it lays out exactly
// as the list's card does. MINIATURE is ONE constant, read by the slot (CARD)
// and by every card (`miniature`), so the two can never disagree: a share
// changed here changes both.
//
// ── THE FIXED SHAPE — "the cards seem to vary in height. make them a fixed
// height so that they mentaiin same shape". Every card one width and one
// height:
//   · ONE WIDTH (CardCarousel's THE FIXED CARD): the list's three-across card
//     at the owner's 1401 window — the band scale's REFERENCE column, 1106
//     design pixels, less sections/PostList's two `gap-8` gaps of 32, a third:
//     347.333 design pixels — at MINIATURE: 225.767 design pixels, CARD. It is
//     spelled in the design pixel the carousel inherits, `var(--spacing)/4`
//     (the step over four, the spelling PostCard's THE CAPTURE uses), so THE
//     FLOOR's pixel draws it with every other length of the carousel, and it
//     travels as an inline style on the carousel's root (its `--card-fixed`),
//     so no rule ships for it. KEEP-IN-SYNC with ui/Container's REFERENCE and
//     PostList's GRID, checked three ways: BlogCarousel.scale.test.tsx reads
//     the REFERENCE, the GRID's base gap and its widest row's count where
//     they live and holds the band's three numbers to them; since 2026-10-20
//     it RENDERS sections/PostList at the owner's window and holds its card,
//     measured in design pixels, to the band's — the one check that sees a
//     gap or a count only the three-across row would wear; and it measures
//     every card of the carousel against CARD in the carousel's pixel
//     (BlogCarousel.test.tsx pins the root's `--card-fixed` to CARD's
//     spelling).
//   · ONE HEIGHT (CardCarousel's THE CARDS' HEIGHT): `cardHeight="tallest"`
//     stretches every card's box to the stage's one row — which every card of
//     the ring is laid out in, so it is as tall as the TALLEST of the twelve —
//     and each card's `h-full` fills its box: the ring's cards are one height
//     whichever is centred, and their footer rows stand on one line
//     (PostCard's THE LAYOUT: the words grow to the card's floor). No measuring
//     and no script — the layout does it — so a longer translation or a
//     reader's text spacing (SC 1.4.12) makes every card taller together, and
//     no text leaves its card.
//   · ONE SHAPE AT EVERY WIDTH — "adapt reactively width wise with screen in
//     a sense in which they reduce height accordingley": the width is CARD in
//     the carousel's pixel and the height is the card's own layout in that
//     same pixel, so they scale together — 225.77 × 392.88px at the owner's
//     window, 310.47 × 540.92 at 1920 (Romanian, MEASURED below), the height
//     1.740 to 1.742 times the width at every window — and where the pixel
//     holds (THE FLOOR), the card holds its size and its shape.
//
// ── THE FLOOR — the carousel's own pixel. The rhythm box's pixel is the
// column ÷ 1106 inside the regime: 0.811 at a 1140 window. In that pixel CARD
// would draw 183px wide at a 1140 window where, a pixel narrower and off the
// regime, it is the theme's 225.8 — a card that GROWS as the window narrows
// past the step, and the miniature's small type smaller still on a laptop. So
// a box round the carousel alone wears ui/Container's `bandScaleClasses`
// AGAIN with sections/PriceList's floor class beside it,
// `[--band-floor:0.0625rem]` (ui/Container's THE FLOOR — its second wearer):
// that box's pixel is max(1rem / 16, min(column, 96rem) / 1106). Under the
// owner's 1401 window the carousel is the theme's, pixel for pixel — the size
// he chose the miniature at — at every width from a phone to the reference,
// with no jump at the regime's step; from his window up every length of the
// carousel grows with the screen — the cards, the arrows, the progress dots,
// the room — and it stops at the 96rem cap with the rest of the band.
//   · THE OPENER KEEPS THE BAND'S PIXEL: the floor rides the box round the
//     carousel, never the rhythm box, so the eyebrow and the <h2> stay every
//     Home band's size and edge (§15.32) — 29.2px at 1140, beside the numbers
//     band's 29.2 — while the cards under them hold the theme's.
//   · THE ZOOM'S PRECONDITION HOLDS (ui/Container's THE ZOOM: `100cqw` and the
//     `@4xl` gate read the NEAREST size container): the box's parent, the
//     rhythm box, is no container, so the box reads ui/Container's column like
//     the rhythm box does — MEASURED, its pixel max(1, column / 1106) at every
//     window sampled.
//   · A BROWSER ZOOM AND THE DEFAULT FONT SIZE, the PriceList record's
//     (§15.32 round 2): under the reference the floor is 1rem / 16, so the
//     carousel follows a zoom and a larger default font as rem does — never
//     smaller than the theme at any zoom or root; past the reference the
//     regime's trade stands (a zoom narrows the CSS window and the pixel
//     falls back towards the floor rather than growing).
//
// ── THE SIDES — "if it narrows down too much width wise, it should adjust
// maybe from the gardeinted sides": CardCarousel's THE FIXED CARD. The stage
// IS the column at every width and the five-card window is CARD × 3.2995 —
// 744.9px in the theme's pixel. A column wider than the window keeps plain
// page ground between each arrow, which stands at the column's edge, and the
// faded outermost card — 180.5px a side at the owner's window; a narrower one
// — every phone and most tablets held upright, up to a ≈ 931px window (950
// behind a classic scrollbar) — keeps no room, and the stage's edges cut the
// window's sides out of the faded outermost cards, the fade starting at the
// edge, so whatever the edge cuts fades out.
//   · THE CENTRE CARD, WHOLE AND FULLY OPAQUE at every width (CardCarousel's
//     fixed card, the same evening: its fade is the outermost card's 40 % but
//     never more than the column leaves beside the centre card, past the
//     room): on a 390 phone the fade keeps its 54.1px, on a 360 one it is the
//     49.1px beside the card and on a 320 one the 31.1px, so the mask is
//     opaque by the centre card's edge however narrow the screen.
//   · THE ARROWS BESIDE IT: each strip is nine steps (36px) where the column
//     leaves that much beside the card and narrows to what it leaves — never
//     under 24px, SC 2.5.8's target — its chevron never wider than the strip
//     less a step: 36px strips 26.6px clear of the card on a 390 phone and
//     13.1px on a 360 one, 31.1px strips ending on its edge on a 320 one. Only
//     a column leaving under 24px beside the card puts a strip over it
//     (RECORDED, below).
//
// ── THE LANDMARKS — TWO NAMED REGIONS, the reviews band's shape. The band's
// <section> is a `region` named by its own <h2> (`aria-labelledby` → the
// heading's useId, through SectionHeading's `id`, never on the section — so
// the name is the title's text alone, without the eyebrow), like every Home
// band, so a screen reader's landmark list names this band as it names its
// neighbours. Inside it the carousel is a region of its own, named by
// `labels.region` and announced by its roledescription („carusel") — its
// part of lib/rotation's law, which the carousel owns. Two names for two
// things: the band's title says what the band offers („Sfaturi de la medicii
// noștri"), the carousel's what it holds („Articole din blog"). The naming
// attributes are Omitted from the props, and `{...rest}` rides FIRST — the
// belt behind the Omit, because TypeScript exempts a hyphenated attribute
// WRITTEN IN JSX from its excess-property check — then a smuggled
// `aria-label` and `role` are reset (sections/TeamRoster's belt; PostCard's
// for `role`), so nothing a caller passes can rename the region or unmake it.
// The box round the carousel is a plain <div>: no role, no name. RECORDED
// (the card carousel's round-3 review), a gap in those resets: they match the
// EXACT names only, while HTML reads an attribute's name in any case, so a
// smuggled `Role` or `Aria-Labelledby` reaches the band's <section> (Home's
// populator passes neither) — the gap sections/CardCarousel closed for its
// own <section> with a case-insensitive drop (its OWN_ATTRIBUTES), which this
// band cannot import: a value exported from a 'use client' module reaches a
// server component as a client reference, and §4 bars a section's internals.
// The lever: a shared case-insensitive drop helper in ui/ or lib/, read by
// both.
//
// ── THE OUTLINE: the band's title is its one <h2> (SectionHeading's
// default) and every card's title an <h3> under it — `headingLevel={3}`,
// sections/PostCard's THE TITLE'S LEVEL, which came back for this band
// ("a page that nests the cards a level deeper brings it back with it"): the
// element follows the level, the look never does, so a card here reads
// exactly as on the blog list. Home's outline then runs page <h1> → this
// band's <h2> → the centred card's <h3> — the one card the accessibility tree
// exposes, the side cards being aria-hidden previews — one level at a time
// (§9). BlogCarousel.test.tsx counts it: one <h2>, an <h3> per post.
//
// ── THE `sizes`, DERIVED — sections/PostGallery's method (its paragraph of
// that name): how wide the card's PICTURE is drawn, from the numbers the
// engine uses, every clause rounded UP — the browser may fetch a file a step
// larger, never a smaller one. The picture spans the card less its two 3px
// frames (PostCard's THE MINIATURE: the frame stays CSS px), and the card is
// CARD in the carousel's floored pixel, never wider than the column:
//   · 14rem — the card at the theme's pixel less 6px: 219.8px at a 16px root
//     (13.74rem), 276.2 at a 20px one (13.81rem) — on every touch screen at
//     every width, on a fine pointer up to a little past the owner's window,
//     and in an engine that cannot run the band scale.
//   · 17vw from 87.5rem, on a fine pointer: past the reference the pixel is
//     the column ÷ 1106 and the picture 225.767 × column / 1106 − 6px, the
//     column 0.8 of the window less any scrollbar — under 16.4 % of the
//     window, so 17vw holds it up to the cap. 87.5rem is the first quarter-rem
//     under both roots' crossing of 14rem — the picture outgrows 14rem at a
//     1408.4px window at a 16px root (88.03rem) and 1751.3 at a 20px one
//     (87.57rem), with no scrollbar — so the switch always comes first.
//   · 19.5rem from 115rem, on a fine pointer: past the cap (a 96rem column)
//     the picture holds at 225.767 × 96rem / 1106 − 6px — 307.5px at a 16px
//     root (19.22rem), 385.9 at a 20px one (19.30rem) — so 19.5rem, the first
//     half-rem over both, from 115rem, where 17vw outgrows it (19.5 / 0.17 =
//     114.7rem).
// MEASURED by BlogCarousel.scale.test.tsx, which builds the picture's model
// out of the numbers where they live, pins it to the engine — on a fine
// pointer at fifteen windows from 280 to 3000, on a touch screen through
// the CSSOM at six, at a 20px root at six — to a thirty-second of a pixel,
// and sweeps the shipped hint against it every 2px from 280 to 3840: both
// pointers, a classic scrollbar and none, a 16px root and a 20px one. Never
// narrower than the picture; at most 1.084 times it at a 16px root (a fine
// pointer just past the 87.5rem switch: 17vw of a 1402px window over its
// 219.9px picture, the carousel's pixel a hair over its floor) and 1.019 on
// a touch screen; at a 20px root 1.075 (17vw of a 1750px window over its
// 276.7px picture) and 1.014 on a touch screen, but 1.28 on a window under
// ≈ 322px, where the card is the column's and the picture shrinks with it
// while 14rem holds — a file a step larger at most; the test holds each
// root to its own bound. An engine that cannot run the band scale draws the
// theme's picture at every width and is told up to 19.5rem — a step
// larger, never a step smaller. THE SPACE BEFORE THE `vw` IS LOAD-BEARING,
// and so is the whole number: next/image reads only `(^|\s)(1?\d?\d)vw`,
// takes 17vw as the smallest share and keeps the candidates from 640 × 0.17
// = 108.8px up — the picture's smallest, 219.8px, asks for the 256px file at
// one device pixel.
//
// ── EMPTY RENDERS NOTHING — `null`: no region, no heading, no carousel. A
// titled band over no card is a promise with nothing behind it (the reviews
// and the doctors bands' rule). The early return sits AFTER useId(): hooks
// run in the same order on every render. It also comes BEFORE the carousel
// could count `slideLabels`: names handed over with no card are never read,
// so they raise no RangeError (BlogCarousel.test.tsx).
//
// ── MEASURED (2026-10-17, Chromium in the test runner, the real stylesheet
// and faces, the blog's twelve Romanian posts, on a FINE pointer beside the
// runner's classic 15px scrollbar; BlogCarousel.scale.test.tsx holds every
// row to its model) — the window, the column (the carousel's box, its stage and the
// numbers band's rhythm box: one left edge, one width, to the hundredth), the
// carousel's pixel (the opener's beside it where they differ), a card in CSS
// pixels, then the room a side and the fade:
//   320 · 273 · 1 · 225.77 × 392.88 · none, the sides cut · 23.62 (the room
//     beside the card behind this scrollbar; the strips at their 24px floor)
//   390 · 336 · 1 · 225.77 × 392.88 · none · 54.11
//   768 · 599.41 · 1 · 225.77 × 392.88 · none · 54.11
//   1024 · 804.22 · 1 · 225.77 × 392.88 · 29.65 · 54.11
//   1140 · 897 · 1 (the opener 0.811) · 225.77 × 392.88 · 76.04 · 54.11
//   1280 · 1009 · 1 (0.912) · 225.77 × 392.88 · 132.04 · 54.11
//   1401 · 1105.81 · 1 (0.99983) · 225.77 × 392.88 · 180.45 · 54.11
//   1536 · 1213.81 · 1.0975 · 247.77 × 431.25 · 198.14 · 59.38
//   1920 · 1521 · 1.3752 · 310.47 × 540.92 · 248.28 · 74.41
//   2560 · 1536, centred at x 504.5 · 1.3888 · 313.53 × 546.31 · 250.73 · 75.15
// At every one: the arrows' outer edges on the column's; all twelve cards one
// width and one height; the opener's <h2> and eyebrow the numbers band's size
// and left edge (29.2 / 11.35px at 1140, 35.99 / 14 at 1401, 49.51 / 19.25 at
// 1920, 50 / 19.44 at 2560); the centre card inside the stage, centred and
// fully opaque; each arrow's strip and chevron the model's, beside the card
// wherever the column leaves 24px; no sideways scroll. On a TOUCH screen — the stylesheet's `(pointer: fine)`
// rules switched off through the CSSOM and the scrollbar with them: the
// column 288 at 320, 324 at 360, 351 at 390, 614.41 at 768 and 944 at an 1180
// tablet (the room 99.54), the card 225.77 × 392.88 at all five, the opener
// unscaled; on the three phones the centre card 31.11, 49.11 and 62.61px in
// from each edge, the mask opaque by then (the fade 31.11, 49.11, 54.11) and
// the strips 31.11, 36 and 36px wide, beside it. The TALLEST CARD
// at the owner's window, each language under its own <html lang> (`hyphens:
// auto` reads it): Romanian 392.88, English 408.48, German 439.70, French
// 424.09, Italian 408.48 — against the list's own tallest card at the theme's
// pixel (605.55, 605.55, 677.55, 653.55 and 629.55 design px) the share less
// the 0.70px the frame's px leave (PostCard's THE MINIATURE), 0.6488 to
// 0.6490, but English's 0.6746 (RECORDED). Under SC
// 1.4.12's four overrides (line height 1.5, letter spacing 0.12em, word
// spacing 0.16em, paragraph spacing 2em) at 390 and 1401 every card grows
// with the others — 546.97, 533.98, 580.16, 593.80 and 562.58px — no text
// leaves its card, and the progress dots keep their 40px under the cards.
//
// ── RECORDED, NOT THIS FILE'S TO CHANGE — each a lever in another folder:
//   · THE SMALLEST TEXT, for the owner: on every card at every window up to
//     his 1401 one, phones included, the title sets 19.5px, the author 9.1,
//     the summary 10.4, the reading time 10.4, the read-more 11.7 and a
//     chip's label 7.8 (on a 19.06px chip); at 1920, 26.82, 12.51, 14.3,
//     14.3, 16.09 and 9.31 — the words 1.375 times as large, the carousel's
//     pixel there, but the chips' labels only 1.19 times (9.31 ÷ 7.8: they
//     keep PostCard's own chip pixel). No criterion of WCAG 2.2 AA sets a
//     smallest size, but 7.8 to 10.4px is under anything this site sets for
//     an older reader elsewhere. A ZOOM (corrected 2026-10-20, the review's
//     arithmetic) enlarges each one on a phone (pinch) and on a laptop up to
//     the owner's window, where THE FLOOR holds the theme's pixel and the
//     carousel grows with a zoom as rem does — but NOT
//     on a desktop past the reference, the band scale's trade the owner
//     accepted (THE FLOOR's last point; §15.32): on a 1920 screen 110 and
//     125 % leave all five sizes as they are, 150 % makes them 1.09 times as
//     large, 200 % 1.45 times, and they double only near 275 % (1.44 times at
//     200 % on a 2560 screen) — the SC 1.4.4 record BACKLOG.md entry 2
//     carries. MINIATURE is the owner's lever, one number here; THE FLOOR
//     keeps every size from shrinking further on a laptop.
//   · WHAT STAYS CSS PX (PostCard's THE MINIATURE): the card's 3px frame, the
//     focus ring's 2px and its 2px offset, the chips' 2px edge, and the
//     carousel's 40px floor under its cards (CardCarousel's THE ROOM).
//   · THE NARROWEST SCREENS — a strip at its 24px floor, over the card's
//     edge. The centre card is fully opaque at every width and the arrows
//     stand beside it while the column leaves 24px beside the card (THE SIDES,
//     CardCarousel's fixed card since the evening of 2026-10-17 — until then
//     the fade reached 22.9px into the centre card on a 320 phone, its edges
//     at 57 %, and the 36px strips 4.9px over it). Under 24px the strip keeps
//     its floor, SC 2.5.8's minimum target, and covers the card's edge:
//     MEASURED, a 280px phone (a 248px column, 11.1px beside the card) has its
//     strips 12.9px over the card — a press on the card's outermost 12.9px is
//     an arrow's — and a desktop window behind a classic 15px scrollbar 20.4px
//     at 280 (3.6px beside it) and 0.4px at 320 (23.6px beside it), the
//     chevron there 20px wide, its strip less a step. Recorded in
//     CardCarousel, its lever.
//   · A TOUCH SCREEN WIDER THAN THE CAP: the band scale's 96rem cap is a fine
//     pointer's (`scalable:`), so on a 2560 touch screen the column is 2160px
//     and the room 707.5px a side — the numbers band is as wide there too.
//   · ENGLISH'S EXTRA LINE AND GERMAN'S TITLE. English's tallest miniature is
//     0.6746 of its list card: the optical size gives it one more summary line
//     (PostCard's THE OPTICAL SIZE MOVES A LINE). German's tallest,
//     „cum-iti-alegi-periuta-de-dinti", is 0.65 of the list's card in the
//     theme's exact pixel, 677.55, where its title „Wie Sie Ihre Zahnbürste
//     auswählen" takes three lines; at the real 1401 window's 0.99983 the
//     list draws it on two, 641.5 — the title sits on its line's edge.
//   · THE LIFT, ON THIS BAND'S CARDS (CardCarousel's THE LIFT): the hovered
//     centre card, grown to 105 %, stays 9.46px inside the stage's mask box at
//     1401 and 390 in Romanian (German 7.90, French 8.68) and 12.99 at 1920;
//     under SC 1.4.12's overrides, where the cards are 2.37 to 2.63 times as
//     tall as wide, 4.44 (French) to 5.93px — the stage's two steps of
//     padding beside the lift cover a card up to ≈ 3.4 times as tall as wide
//     at every width (both are lengths of the carousel's pixel). Only a fine
//     pointer jumps (`hover:` answers only
//     `(hover: hover)`).
//   · TWELVE PROGRESS DOTS: one per post, so the Tab order holds fourteen
//     stops before the centre card's link — CardCarousel's recorded trigger
//     ("if a picker ever exceeds about six dots") for a roving tablist.

/** Every finished word and card the Home page hands the band (the header's A
 *  DUMB BAND). */
type BlogCarouselOwnProps = Readonly<{
  /** The mono micro-label over the title, finished text (§8.1) — „Blog". */
  eyebrow: string;
  /** The band's <h2> — and, through aria-labelledby, the region's name
   *  („Sfaturi de la medicii noștri"). */
  title: string;
  /** The carousel's own words, finished (sections/CardCarousel's): its
   *  region's name, its two roledescriptions, the two arrows' names and the
   *  progress dots' group name. */
  labels: CardCarouselLabels;
  /** The cards, newest first — each sections/PostCard's content and its
   *  slug, the React key (never an attribute). Empty renders nothing. */
  posts: readonly PostListItem[];
  /** One finished name per card, in the same order — the card's group label
   *  and its progress dot's („Articolul 3 din 12"). Must match `posts` in
   *  length: the carousel throws a RangeError naming both counts otherwise —
   *  but never over an EMPTY `posts`, where the band returns nothing before
   *  the carousel could count them (the header's EMPTY RENDERS NOTHING). */
  slideLabels: readonly string[];
  /** The accessible name of every card's tag list, finished („Categorii"). */
  tagsLabel: string;
  /** Every card's read-more label, finished („Citește mai mult…"). */
  readMore: string;
}>;

export type BlogCarouselProps = BlogCarouselOwnProps &
  // The native <section> surface, minus the band's own names — `title` among
  // them, a real HTML attribute (a tooltip), whose two meanings would
  // otherwise intersect — minus `children` (content arrives as the props
  // above; without the Omit a caller could nest something, type-check and
  // watch it vanish — the SectionHeading precedent), the two ARIA naming
  // attributes (the region's name is its <h2>'s text alone) and `role` (it
  // is a region). React 19 carries `ref` inside these props (§6.8).
  Omit<
    ComponentPropsWithRef<'section'>,
    | keyof BlogCarouselOwnProps
    | 'children'
    | 'aria-label'
    | 'aria-labelledby'
    | 'role'
  >;

/** THE BAND (the header): the page ground, and nothing else — the belt left
 *  with the bleed (THE WIDTH: nothing in the band reaches past its column). */
const BAND = 'bg-page';

/** THE RHYTHM BOX (the header's THE BAND and THE BAND SCALE, THE OPENER): a
 *  flex column, the band's room above and below on the column's steps and its
 *  one gap, then ui/Container's two band-scale strings — imported, never
 *  re-spelled (tests/unit/design-scale.test.ts holds every wearer to an
 *  import). The carousel inside it is the column (THE WIDTH). */
const RHYTHM = cx(
  'flex flex-col gap-8 py-12 @lg:gap-10 @lg:py-16 @3xl:gap-12 @3xl:py-20',
  bandColumnClasses,
  bandScaleClasses,
);

/** THE FLOOR (the header): the carousel's design pixel never under the
 *  theme's own, 1rem / 16 at ANY root — sections/PriceList's class, byte for
 *  byte, so the stylesheet ships one rule for both (the census holds the two
 *  setters equal). One whole static string: Tailwind reads class names from
 *  source text. */
const CAROUSEL_FLOOR = '[--band-floor:0.0625rem]';

/** THE CAROUSEL'S OWN PIXEL (the header's THE FLOOR): ui/Container's pixel
 *  declared again on the box round the carousel alone — whose nearest size
 *  container is ui/Container's, as the rhythm box's is — with the floor
 *  beside it, read where that pixel is declared. */
const CAROUSEL_PIXEL = cx(bandScaleClasses, CAROUSEL_FLOOR);

/** THE MINIATURE (the header): the owner's 65 % — the share every card is
 *  drawn at AND the share of the blog list's card its slot is, one number
 *  read by both. */
const MINIATURE = 0.65;

/** THE LIST'S CARD (the header's THE FIXED SHAPE), in design pixels:
 *  sections/PostList's three-across card at the owner's 1401 window — the
 *  band scale's REFERENCE column, 1106, less its GRID's two `gap-8` gaps of
 *  32, a third: 347.333. KEEP-IN-SYNC with ui/Container's REFERENCE and
 *  PostList's GRID: BlogCarousel.scale.test.tsx holds these three to the
 *  numbers it reads there AND to the list's own card, measured at the
 *  owner's window (the header's ONE WIDTH says what is checked, and how). */
const LIST_COLUMN = 1106;
const LIST_GAP = 32;
const LIST_COLUMNS = 3;

/** CARD (the header's THE FIXED SHAPE): the list's card at MINIATURE —
 *  225.767 design pixels — in the design pixel the carousel inherits, the
 *  spacing step over four, so THE FLOOR's pixel draws it with every other
 *  length of the carousel. It travels as CardCarousel's `--card-fixed`, an
 *  INLINE style, so no rule ships for it; the spaces round the `-` are
 *  load-bearing (CSS reads `1106-2` as two numbers). */
const CARD = `calc(var(--spacing)/4*(${LIST_COLUMN} - 2*${LIST_GAP})/${LIST_COLUMNS}*${MINIATURE})`;

/** THE `sizes`, DERIVED (the header): the miniature's picture — the card less
 *  its two 3px frames — 14rem at the theme's pixel, 17vw while the band scale
 *  grows it on a fine pointer from 87.5rem, 19.5rem past the scale's cap from
 *  115rem. Whole `vw` shares after a space: next/image reads only those. */
const SIZES =
  '(min-width: 115rem) and (pointer: fine) 19.5rem, ' +
  '(min-width: 87.5rem) and (pointer: fine) 17vw, 14rem';

export function BlogCarousel({
  eyebrow,
  title,
  labels,
  posts,
  slideLabels,
  tagsLabel,
  readMore,
  className,
  ...rest
}: BlogCarouselProps): ReactElement | null {
  // Hooks first, the early return after (THE EMPTY STATE in the header).
  const headingId = useId();
  if (posts.length === 0) return null;

  return (
    // BAND OUTER — `{...rest}` rides FIRST, then the belt resets a smuggled
    // `aria-label` and `role`, then the band's own name (THE LANDMARKS);
    // className merges caller-last (§6.8).
    <section
      {...rest}
      aria-label={undefined}
      role={undefined}
      aria-labelledby={headingId}
      className={cx(BAND, className)}
    >
      <Container>
        {/* The rhythm box — the band's rhythm and, wherever the regime's
            gates hold, its design pixel (THE BAND SCALE). */}
        <div className={RHYTHM}>
          {/* THE OPENER — the eyebrow over the band's <h2>, at the start like
              every Home band's; the id lands on the <h2>, the half of the
              aria-labelledby pair the <section> points at. */}
          <SectionHeading eyebrow={eyebrow} title={title} id={headingId} />
          {/* THE CAROUSEL'S OWN PIXEL — the band scale's pixel declared again
              round the carousel alone, floored at the theme's (THE FLOOR), so
              the opener above keeps every Home band's. */}
          <div className={CAROUSEL_PIXEL}>
            {/* THE CAROUSEL — the five-card window, circular, every card one
                fixed width and the tallest card's height (THE FIXED SHAPE),
                in the column (THE WIDTH); its slides the blog's own cards at
                the owner's 65 %, every prop by name (THE MINIATURE). */}
            <CardCarousel
              visible={5}
              mode="loop"
              cardWidth={CARD}
              cardHeight="tallest"
              labels={labels}
              slideLabels={slideLabels}
              slides={posts.map((post) => (
                <PostCard
                  key={post.slug}
                  href={post.href}
                  title={post.title}
                  summary={post.summary}
                  author={post.author}
                  readingTime={post.readingTime}
                  image={post.image}
                  tags={post.tags}
                  tagsLabel={tagsLabel}
                  readMore={readMore}
                  miniature={MINIATURE}
                  headingLevel={3}
                  sizes={SIZES}
                  className="h-full"
                />
              ))}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
