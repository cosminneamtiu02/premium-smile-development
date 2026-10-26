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
// and one height — in the card carousel (sections/CardCarousel), circular, in
// TWO presentations: on a phone THE LINE, the five-card window exactly as
// wide as the clinic's numbers band above it; from a tablet up THE FLAT ROW
// (below), flat, as wide as the screen, the centre card highlighted. The
// owner, verbatim (2026-10-17, the band's first word): "the fiver option
// should als look and behave the same but is jsut a wider section. maybe as
// wide as the screen. do not represent it in the article, represent it on
// home page tih cards that reference articles. place it below th in numbers
// category and above "Specialiștii cu care ne mândrim"" — and, that evening,
// of the band he had first seen edge to edge of the screen: "the carrousell
// from the main page feels way too large. make it the width of the: """ ÎN
// CIFRE Experiență confirmată în timp """ section, while also implementing
// reactivity for cards and for hte component. i wnat the article cards to
// mentain same ratios as in blog, but while having 65% of the height. also
// the cards seem to vary in height. make them a fixed height so that they
// mentaiin same shape and adapt reactively width wise with screen in a sense
// in which they reduce height accordingley but if it narrows down too much
// width wise, it should adjust maybe from the gardeinted sides. these above
// comments are for the home page component, on blog they are already
// reactive as is." Asked to choose, he picked "Miniature (all 65%)": the blog
// list's card itself at 65 % — photo, title, author, summary, reading time,
// read-more, chips. So on Home the band stands between the clinic's numbers
// (sections/DoctorStats) and the doctors (sections/DoctorShowcase), and every
// card opens its article. The blog list itself is untouched ("on blog they
// are already reactive as is"). On 2026-10-25 the owner kept the phone and
// laid the rest flat (THE FLAT ROW), its cards cut to two lines of each title
// and summary that evening (THE CLAMP IN THE ROW).
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
// the phone's window: the centre card, its two neighbours whole and the next
// pair 60 % past the window's edges, fading; `flatFrom="tablet"` — THE FLAT
// ROW from the carousel's query up, where the window gives way to a row as
// wide as the screen; `mode="loop"` — circular in both: after the last card
// the first comes in from the right, the cards moving on by themselves one
// every 5.5 s until any press stops them for good (CardCarousel's THE
// CONSUMPTION LAW, the owner's OPTION 1); `cardWidth={CARD}` and
// `cardHeight="tallest"` — THE FIXED SHAPE, below: one width (CardCarousel's
// THE FIXED CARD) and one height (its THE CARDS' HEIGHT) for every card. With
// a fixed card NOTHING SWITCHES on the phone: the five-card window stands at
// every width there — the three-card fallback is the column's share's, and a
// fixed card never changes size — and a column too narrow for it is cut from
// the faded sides (THE SIDES). The two clocks, the arrows, the progress dots
// and the hand are the carousel's; this band passes no clock option, so it
// runs the carousel's default rhythm, the Hero's and the reviews deck's 5.5
// s. Whether that suits THESE cards is an OPEN question, the owner's call: a
// card's title and summary take 18 to 20 s to read (BACKLOG.md entry 2, its
// dwell question — the levers are the carousel's interval constant or a
// dwell per card from its own words); in the row a sighted reader is shown
// two lines of each (THE CLAMP IN THE ROW), a screen reader all of them.
//
// ── THE CARDS: sections/PostCard, the blog list's card — its frame, its
// photograph with the categories over it, its title, author, summary, reading
// time and „Citește mai mult…", and its ONE link, the whole card (PostCard's
// THE LINK). EVERY CARD PROP BY NAME (sections/PostList's THE LIST, G2
// typescript 2026-10-14): PostCard spreads every prop it does not know onto
// its <article>, so a field the page adds to an item (the `slug`) would print
// as an attribute if an item were spread. The slug is the React key. Six of
// PostCard's props are this band's own answers: `miniature={MINIATURE}` (THE
// MINIATURE), `jump={false}` (THE FLAT ROW's THE HOVER: the carousel grows
// the card's box, so the card must not grow too), `clampable` (THE CLAMP IN
// THE ROW: the row's box switches the clamp on, nothing below its query),
// `className="h-full"` (THE FIXED SHAPE — placement, §6.8: the card fills
// the height of the box the carousel gives it), `headingLevel={3}` (THE
// OUTLINE) and `sizes`, the picture hint derived for this band's card (THE
// `sizes`, DERIVED). NEVER `preload`: the band stands under the Hero and the
// numbers, below the first screen at every window (PostCard's `preload` is a
// page's LCP card). On the line the side cards are previews — CardCarousel
// makes every card but the centre one `inert` and aria-hidden — so ONE card's
// link is in the Tab order at a time, and a press on a side card stops the
// carousel instead of following its link (CardCarousel's tap); in the row
// every card its reach frees is LIVE (THE FLAT ROW's THE COUNT).
//
// ── THE BAND: ui/Container's PAGE-BAND RECIPE. The outer is the semantic,
// full-bleed <section> owning the paint, `bg-page` — the ground of every band
// under the Hero — and THE BELT under the row's bleed (THE FLAT ROW's THE
// BLEED); ui/Container owns the width and the container context; the RHYTHM
// box inside it owns the band's room above and below — `py-12 @lg:py-16
// @3xl:py-20`, the rhythm of the Home bands around it (DoctorStats',
// ClinicLocation's) — and its ONE gap, from the opener to the carousel: 32 /
// 40 / 48 on the column's `@lg` and `@3xl` steps, the space ClinicLocation
// keeps between its opener and its map (§6.4: the band owns its children's
// spacing; neither child brings a margin). Inside the rhythm box the opener,
// then two boxes round the carousel alone — THE ROW'S BOX (the row's pixel
// and THE CLAMP IN THE ROW), and inside it THE CAROUSEL'S OWN PIXEL (the
// theme's on the line, THE TEXT RULE in the row). No outer margin: the page
// owns the rhythm between bands.
//
// ── THE BAND SCALE, THE OPENER (ui/Container's paragraph and its recipe rule
// 5; CLAUDE.md §15.32 — "EVERY band under the Hero draws in ONE scale"): the
// rhythm box wears `bandColumnClasses` and `bandScaleClasses`, imported, so on
// a laptop or desktop — a fine pointer, an engine that registers custom
// properties, a column of max(56rem, 896px) — the opener's eyebrow and <h2>
// are every Home band's size and stand on their left edge, the band's room and
// its gap with them, and past a 96rem column the rhythm box caps and centres
// like every scaled band's. The CAROUSEL inside draws in a pixel of its own:
// the theme's on the line, which never meets the band scale (THE CAROUSEL'S
// OWN PIXEL), the tile sentence's in the row (THE TEXT RULE) — NOT the reviews
// deck's exception (sections/ReviewsCarousel's THE OPENER'S SCALE: there the
// deck draws unscaled; here the carousel scales). Phones, touch tablets and
// narrower windows keep the theme's rem (§7) — the row its theme pixel over
// the share. The regime's trades — a browser zoom and the default font size
// inside it, the jump at its step — are DoctorShowcase's D10 and §15.32's,
// and hold for this band's opener as for every band of Home; its carousel's
// are THE FLAT ROW's (RECORDED, THE ZOOM), the line following a zoom as rem
// does.
//
// ── THE WIDTH — "make it the width of the ÎN CIFRE section", THE LINE's. On
// the line the carousel sits IN the rhythm box, so it is the column
// ui/Container gives every Home band, capped at 96rem and centred past it
// inside the band scale: exactly sections/DoctorStats' rhythm box on Home,
// which wears the same two strings (it is `scaled` there). No `vw`, no gutter
// copied (ui/Container stays the ONE definition, §15.15 a): the two bands
// share their column by construction, and BlogCarousel.scale.test.tsx renders
// the two together and holds the carousel's box, its stage and its arrows to
// the numbers band's column — its left edge and its width, to the hundredth —
// at every window it samples on the line. From a tablet up the carousel is
// the SCREEN (THE FLAT ROW's THE BLEED): the owner's "as wide as the screen
// like the carrousell for reviews" (2026-10-25), his own first shape come
// back for the row alone.
// THE BLEED, HISTORY (the band's first shape, the morning of 2026-10-17 — "on
// main screen make it as wide as the screen"): the carousel's root ran out to
// the screen's edges through `margin-inline: calc(50% − 50vw)`, its card the
// carousel's share (CardCarousel's THE CARD CAP lifted), 0.5rem in from each
// edge on a fine pointer so a classic scrollbar's overshoot never cut an
// arrow's ring, and the band wore an `overflow-x-clip` belt (with its Safari
// ≤ 15 twin) to swallow that overshoot. The owner's "way too large" retired
// all of it the same evening; THE FLAT ROW brought the bleed and the belt
// back on 2026-10-25, with a fixed card, from a tablet up only.
//
// ── THE MINIATURE — PostCard's paragraph of that name, which this band asks
// for: every card is the blog list's card drawn as a copy of itself at
// MINIATURE, 0.65 — every theme length inside it (its padding, its corner,
// every gap, every type step, the read-more's box, the chips) at 0.65 × the
// design pixel the card inherits, the frame, the ring and the chips' edge
// staying CSS px — so in a slot 0.65 of the list's card it lays out exactly
// as the list's card does. MINIATURE is ONE constant, read by the slot (CARD)
// and by every card (`miniature`), so the two can never disagree: a share
// changed here changes both — and it is spelled twice more, as a number, in
// the row's two classes (THE TEXT RULE), which BlogCarousel.test.tsx holds to
// this constant. IN THE ROW it is the same 0.65 miniature drawn in a larger
// pixel: at the row's theme pixel, 1rem / 16 ÷ 0.65, it is the blog list's own
// card to the pixel, 347.33px wide — a miniature in a pixel P IS its full card
// in the pixel 0.65 × P, every theme length the same and the frame the same
// CSS px (BlogCarousel.scale.test.tsx holds the row's tallest card to the
// list's own, clamped as the row clamps it — THE CLAMP IN THE ROW — and
// drawn in that pixel, to half a pixel, and with the clamp lifted to the
// list's whole card).
//
// ── THE FIXED SHAPE — "the cards seem to vary in height. make them a fixed
// height so that they mentaiin same shape". Every card one width and one
// height, in both presentations:
//   · ONE WIDTH (CardCarousel's THE FIXED CARD): the list's three-across card
//     at the owner's 1401 window — the band scale's REFERENCE column, 1106
//     design pixels, less sections/PostList's two `gap-8` gaps of 32, a third:
//     347.333 design pixels — at MINIATURE: 225.767 design pixels, CARD. It is
//     spelled in the design pixel the carousel inherits, `var(--spacing)/4`
//     (the step over four, the spelling PostCard's THE CAPTURE uses), so the
//     carousel's own pixel draws it with every other length of the carousel
//     — the theme's on the line, the row's in the row — and it travels as an
//     inline style on the carousel's root (its `--card-fixed`), so no rule
//     ships for it. KEEP-IN-SYNC with ui/Container's REFERENCE and PostList's
//     GRID, checked three ways: BlogCarousel.scale.test.tsx reads the
//     REFERENCE, the GRID's base gap and its widest row's count where they
//     live and holds the band's three numbers to them; since 2026-10-20 it
//     RENDERS sections/PostList at the owner's window and holds its card,
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
//     no text leaves its card. In the row ONE row still: every card its height,
//     the side cards drawn at 0.9 of it — and since THE CLAMP IN THE ROW every
//     card there stands that tall by itself, two lines of each title and
//     summary in every language, so the stretch is its belt.
//   · ONE SHAPE AT EVERY WIDTH — "adapt reactively width wise with screen in
//     a sense in which they reduce height accordingley": the width is CARD in
//     the carousel's pixel and the height is the card's own layout in that
//     same pixel, so they scale together — on the line 225.77 × 392.88px
//     wherever it stands (Romanian, MEASURED below), its pixel the theme's,
//     the height 1.740 times the width (310.47 × 540.92 at a 1920 window under
//     32rem tall on a mouse until 2026-10-26, a window the row draws since);
//     in the row, clamped (THE CLAMP IN THE ROW), 347.33 × 497.44 on a tablet,
//     390.67 × 559.83 at the owner's window, 537.36 × 770.8 at 1920, 1.432 to
//     1.434 times (1.743 to 1.745 before the clamp) — and where the pixel
//     holds (the line's, the row's theme pixel), the card holds its size and
//     its shape.
//
// ── THE CAROUSEL'S OWN PIXEL. The box round the carousel wears
// ui/Container's `bandScaleClasses` AGAIN, so the carousel's design pixel is
// declared apart from the opener's: on the line the theme's, 1rem / 16,
// wherever it is drawn — a mouse meets the line only under 37.5rem, a column
// far under the band scale's max(56rem, 896px) step, and a touch screen never
// meets the band scale at all (`scalable:` asks for a fine pointer) — and in
// the row the tile sentence's, the column's pixel × 1.731 wherever the regime
// holds (THE TEXT RULE).
//   · THE FLOOR, REMOVED (2026-10-26) — a record. From 2026-10-17 this box
//     also wore sections/PriceList's floor class, the line's pixel never
//     under the theme's inside the regime, and from 2026-10-25 a class of the
//     row's reset that floor to 0px. Both became no-ops when THE FLAT ROW's
//     query took a fine pointer at any height (THE QUERY, below): the band
//     scale can never reach the line now; the floor variable is read nowhere
//     but inside the band scale's pixel; the row's reset wrote 0px, the
//     read's own default; no ancestor sets it (tests/unit/design-scale.test.ts
//     fences its setters); and the page sets no root font size, so a media
//     query's rem and a container query's rem agree. So both left, on the
//     owner's no-dead-code rule. MEASURED: no pixel moved — before and after,
//     at twelve windows (seven on a mouse, 1120 × 800 to 2560 × 1440; three
//     tablets and two phones on a touch screen, the line among them), the
//     carousel's pixel and the first card's title, summary and height
//     identical to 0.001px. The band sets no floor at all:
//     BlogCarousel.test.tsx pins no class of it naming the floor variable,
//     BlogCarousel.scale.test.tsx the box round the carousel computing none.
//   · THE OPENER KEEPS THE BAND'S PIXEL: the carousel's own pixel rides the
//     box round the carousel, never the rhythm box, so the eyebrow and the
//     <h2> stay every Home band's size and edge (§15.32) — 29.2px at 1140,
//     beside the numbers band's 29.2 — whatever pixel the cards draw in.
//   · THE ZOOM'S PRECONDITION HOLDS (ui/Container's THE ZOOM: `100cqw` and the
//     `@4xl` gate read the NEAREST size container): the box's parents, the
//     row's box and the rhythm box, are no containers, so the box reads
//     ui/Container's column like the rhythm box does — MEASURED, its pixel
//     the theme's at every window sampled on the line and, in the row, the
//     column ÷ 1106 × 1.731 wherever the regime holds.
//   · A BROWSER ZOOM AND THE DEFAULT FONT SIZE on the line: its pixel the
//     theme's at every width, it follows a zoom and a larger default font as
//     rem does — never smaller than the theme at any zoom or root. The row's
//     are THE FLAT ROW's (RECORDED, THE ZOOM).
//
// ── THE SIDES — "if it narrows down too much width wise, it should adjust
// maybe from the gardeinted sides": CardCarousel's THE FIXED CARD, THE LINE's.
// The stage IS the column at every width and the five-card window is CARD ×
// 3.2995 — 744.9px in the theme's pixel. A column wider than the window keeps
// plain page ground between each arrow, which stands at the column's edge,
// and the faded outermost card — on a touch screen under 32rem tall, 37.2px a
// side at 1024 and 187.9 at the owner's width; a narrower one — every phone,
// and a phone held sideways — keeps no room, and
// the stage's edges cut the window's sides out of the faded outermost cards,
// the fade starting at the edge, so whatever the edge cuts fades out.
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
// ── THE FLAT ROW (2026-10-25). The owner, verbatim: "refactorization
// required, on the component with the articles. On phone it looks perfect, it
// must reamin like that, but on tablet and above, i do not want it to be
// circular anymore. i just want it to be like flat, a circular list as now
// but central, currrent card one is highlighted and reactivity wise the text
// must remain the same as any other text on the page adnd for the
// title/eyebrow on the card it must mentain same raport as now between the,
// so adjust while mentaining raports but still while also the notmal text on
// card like "cat timp tine efectul..." must also always mentain text wise the
// size of "Peste 8000 de zâmbete îngrijite cu dedicare și profesionalism."
// while raports from article card, heading, eyebrow, etc must also always
// mentain the same raport as now of the card." — "I repeat, on phone you
// mentain current aspect. … the list must be flat, not curved at is now. it
// must be wider and it must fit a nr of article in function of screen width
// … I also want this section to be as wide as the screen like the
// carrousell for reviews". His "not circular anymore" is the curved, turned
// line, never the loop: the row still wraps. `flatFrom="tablet"` asks
// sections/CardCarousel for its THE FLAT ROW; this band brings the rest:
//   · THE QUERY — the carousel's CARD_CAROUSEL_FLAT_QUERY, a window at least
//     37.5rem wide AND either 32rem tall or driven by a fine pointer — two
//     media queries in one list, the width clause in each: every tablet held
//     either way and every laptop and desktop window AT ANY HEIGHT get the
//     row; every phone held upright and a phone held sideways (844 × 390,
//     932 × 430: a coarse pointer and a short window) keep the line, byte for
//     byte the band they had. The pointer clause is 2026-10-26's, the
//     carousel's a11y review (SC 1.4.4): a zoom shrinks the window in CSS
//     pixels, and under the height clause alone a 1366 × 633 laptop at 125 %
//     (1093 × 506) or 150 % (911 × 422) handed the band back to the line,
//     its card text shrinking as the reader enlarged it; on a mouse those
//     windows are the row now, the summary 16px in them (MEASURED below).
//     The band's nine row classes wear the query as Tailwind's arbitrary media
//     variant — which Tailwind compiles to that same media list — spelled
//     here: a value exported from a 'use client' module reaches this server
//     component as a client reference, never as the string, and
//     BlogCarousel.test.tsx holds every spelling to the carousel's constant,
//     read off its source.
//   · THE BLEED — the carousel's root runs across the screen, the reviews
//     deck's full-bleed idiom, `calc(50% − 50vw)`, half a rem in from each
//     edge (ROW_BLEED): an arrow's strip stands at the root's edge, and the
//     inset keeps it clear of a classic scrollbar's overshoot (`100vw` counts
//     the bar) and of a phone's edge gesture; the mask is transparent at the
//     stage's edge, so the inset shows nothing. The root's own `100cqw` is the
//     stage (CardCarousel's THE STAGE IS THE SCREEN), so as many cards show as
//     fit — the count follows the width by construction. THE BELT on the
//     band's <section> — `overflow-x-clip` and its Safari ≤ 15 twin,
//     sections/ReviewsCarousel's spelling — swallows the fraction of a pixel a
//     scrollbar thicker than 16px still leaves past the page (half of it a
//     side past the inset). MEASURED behind this runner's 15px scrollbar: the
//     root 0.5px in from either edge of the page, the page and the band their
//     own width, at every window from 600 to 3000.
//   · THE TEXT RULE — "the notmal text on card … must also always mentain
//     text wise the size of „Peste 8000 de zâmbete…"": that sentence is
//     sections/DoctorStats' tile sentence on Home, ui/Text's text-base drawn
//     at 9/8 of the band scale's pixel (its TILE_ZOOM) — 16px wherever the
//     scale does not hold (every touch screen, every window under the
//     regime's step), 18 of the column's design pixels wherever it does. A
//     card's summary is text-base at MINIATURE of the pixel the card stands
//     in, so the row's pixel is the tile sentence's over the share, spelled on
//     TWO nested boxes so that no rule order between them can matter:
//       · THE ROW'S PIXEL (the outer box): from the query up, `--scale-px` =
//         1rem / 16 / 0.65 and `design-scale` — the theme's pixel over the
//         share, inherited by everything inside wherever the regime does not
//         hold: the summary 16px, the card the blog list's own, 347.33px.
//       · THE ROW'S ZOOM (on the box round the carousel, beside the band
//         scale's pixel — THE CAROUSEL'S OWN PIXEL): from the query up
//         `--band-zoom` = 1.125 / 0.65, so wherever the regime's gates hold
//         the box declares the column's pixel × 1.731 and redraws its subtree
//         in it — the summary 18 design pixels, the card 390.75 of them — over
//         the outer box's.
//     Every other length of the card is a theme length of the same pixel, so
//     every ratio inside it — title : author : summary : picture : card — is
//     today's miniature's: the six words the miniature's 19.5 / 9.1 / 10.4 /
//     10.4 / 11.7 / 7.8 × the pixel (BlogCarousel.scale.test.tsx, at every
//     row window it samples). The 0.65 is MINIATURE, the 1.125 DoctorStats'
//     TILE_ZOOM and the 16 text-base's theme pixels: Tailwind needs each class
//     whole and literal, so the numbers are spelled in them, and
//     BlogCarousel.test.tsx holds each to its owner.
//   · THE COUNT — "it must fit a nr of article in function of screen width":
//     every card within CardCarousel's THE REACH is LIVE — hovered, pressed
//     and tabbed to like the centre card, its <h3> in the accessibility
//     tree — the side cards wholly between the two arrows' strips even grown
//     to the centre card's size, measured after mount; the rest are previews.
//     MEASURED (Romanian, this runner's fine pointer; THE TOUCH SCREEN of the
//     scale test for a touch screen): live / at least partly shown between
//     the strips — 768 × 1024 · 1 / 3; 1024 × 768 · 1 / 3; 1180 × 820 · 3 / 5
//     (a touch screen 3 / 3); 1280 × 800 · 3 / 5; 1401 × 1063 · 3 / 5; 1920 ×
//     1080 · 3 / 5; 2560 × 1440 · 3 / 5 (a touch screen 7 / 9); 3000 × 1200 ·
//     5 / 7. THE HONEST CONSEQUENCE: inside the band scale the cards grow with
//     the screen exactly as every text on the page does, so from a laptop to a
//     1920 desktop the row shows the SAME three live cards, magnified — the
//     card is about 0.28 of the window at every width there; more appear only
//     where the screen outgrows the band (past ≈ 1920, where the cards stop
//     growing at the 96rem cap: five live from a ≈ 2870px window) or, outside
//     the regime, on a touch screen as it widens, where the card holds the
//     theme pixel's 347.33px (three live from a ≈ 1176px window, a 1180 iPad
//     held sideways 4.3px past it, five from ≈ 1843, seven at 2560). On a
//     mouse the height asks nothing: 844 × 390, 911 × 422 and 1093 × 506 draw
//     the theme pixel's row, one card live; 1401 × 500 and 1920 × 500 draw
//     1401 × 1063's and 1920 × 1080's rows to the hundredth, three live.
//     While side cards are live the carousel's one status line says the
//     centred card („Articolul 4 din 12"), the stage silent, and the centred
//     card is `aria-current` (CardCarousel's THE ANNOUNCEMENT and THE CURRENT
//     CARD); Tab walks the live cards left to right where the engine reads
//     `reading-flow` (its THE TAB ORDER FOLLOWS THE ROW — RECORDED below).
//   · THE HIGHLIGHT — "currrent card one is highlighted": the centre card in
//     the house's aura (CardCarousel's THE HIGHLIGHT), the row's alone; no
//     card glows on the line.
//   · THE HOVER — on the card's BOX, never the card (CardCarousel's THE
//     HOVER: the centre card to 1.05, a live side card to the centre card's
//     own size), so every card here says `jump={false}` (PostCard's THE JUMP,
//     A PAGE'S TO TURN OFF) — a card that jumped inside a box that grows would
//     grow twice — and that is also the cure of the owner's hover bug,
//     verbatim: "on max hover all. contents of card are all of a sudden going
//     down": the <article> is no compositing layer at rest, so the engine
//     promoted it for the jump's 200ms and folded it back at the end,
//     redrawing its text; the carousel's box is a layer of its own at rest
//     where that fold-back is known — the line's 3D boxes in every engine,
//     the row's in WebKit alone, Chromium and Firefox promoting a row's box
//     for its glides only (CardCarousel's THE HOVER and THE LAYER, BY ENGINE,
//     its trade recorded there).
//   · THE JUMP AT THE STEP — THE TEXT RULE's consequence, recorded: the tile
//     sentence jumps where the band scale starts (the regime's step, §15.25
//     round 2 (c)), and the row's cards with it — MEASURED a pixel either side
//     of the step's window behind the runner's measured scrollbar (1138 and
//     1140 behind a classic 15px one): the card 347.33 → 316.91px, the summary
//     16 → 14.6, the live cards 1 → 3. The line never jumps: it never meets
//     the regime (THE CAROUSEL'S OWN PIXEL).
//
// ── THE CLAMP IN THE ROW (2026-10-25). The owner, verbatim, of THE FLAT ROW
// the same evening: "almost perfect. one thing i'd have to comment on is the
// size. i just realised it's too big. try by cutting like 24% of the text and
// if the text is loger, place three dots." Asked to choose, he picked "Card
// 24% shorter, same text size": in the row ALONE ("on phone you mentain
// current aspect"), every card's title on two lines at most and its summary
// on two, each ending in „…" where its text is longer, and every word its
// size — the summary still the tile sentence (THE TEXT RULE).
//   · HOW — sections/PostCard's THE CLAMP, A PAGE'S TO SWITCH ON: every card
//     says `clampable`, and THE ROW'S BOX sets, behind the row's query, the
//     four variables the card reads (ROW_CLAMP) — `--clamp-box` -webkit-box,
//     `--clamp-clip` clip (hidden where the engine has no `overflow: clip`:
//     THE CLIP, NOT A SCROLLER, below), `--title-lines` 2 and
//     `--summary-lines` 2 — unregistered custom properties, inherited by
//     every card under it.
//   · THE CLIP, NOT A SCROLLER (2026-10-26, the lane's a11y review): under
//     `overflow: hidden` every clamped title and summary was a scroll
//     container, so a find-in-page match, a screen reader's caret or a script
//     could scroll its hidden lines into the box, where they stayed until a
//     reload; `overflow: clip` clips the same lines and scrolls nothing.
//     MEASURED with Playwright before the switch — a clamped 18px paragraph
//     and a 30px semibold title, the room's padding and margins as PostCard
//     spells them, one and two device pixels a CSS pixel: the „…" drawn under
//     `clip` exactly as under `hidden`, 0 pixels apart in Chromium 151,
//     WebKit 26.5 and Firefox 153 (the ellipsis itself — `hidden` against the
//     same lines cut plain at two — 37 to 277 device pixels at the second
//     line's end); a script's scroll moved the `hidden` box 40px and the
//     `clip` box none, a `scrollIntoView` of a fourth-line word 26 to 111px
//     and none. In the band, nothing moved: the row's heights, its clamp and
//     every SC 1.4.12 number below are the ones `hidden` drew, to the
//     hundredth (BlogCarousel.scale.test.tsx, which also scrolls every
//     clamped box by script and finds it unmoved). Safari ≤ 15 has no
//     `overflow: clip`, and a custom property is valid whatever it holds, so
//     `clip` alone would compute the card's overflow `visible` there and
//     paint the hidden lines over what follows (PostCard's A VALUE THE PAGE
//     MISSPELLS) — on an iPad stuck at iPadOS 15 among others: the clip is
//     two classes, `clip` behind `@supports (overflow: clip)` and `hidden`
//     behind its `not`, so every engine meets exactly ONE and no rule order
//     decides (the scale test reads both conditions off the stylesheet).
//     RECORDED for sections/PostCard, whose THE CLAMP still names `hidden` as
//     the page's value — its header's to say `clip`.
//   · THE PHONE, UNTOUCHED BY CONSTRUCTION: below the query nothing is set,
//     and a `clampable` card with none of the four is the card without the
//     prop, to the pixel (PostCard's INERT BY CONSTRUCTION). MEASURED at
//     390 × 844 on a mouse and, on a touch screen, at 844 × 390 and at a 1401
//     window under 32rem tall, in all five languages: every title and summary
//     computes a block, nothing clipped, no clamp and no room, the four
//     variables unset — and the ring with the clamp lifted is the ring as
//     drawn, to the hundredth.
//   · THE TEXT STAYS WHOLE in the DOM: the article's name is its whole title
//     (PostCard's THE NAME), the read-more's is „Citește mai mult…" and the
//     whole title, and a screen reader reads both texts to their end; the
//     lines past the two are laid out under each box and clipped (PostCard's
//     WHAT A SET CLAMP DOES), and the article the card opens holds every
//     word. The blog list draws the same posts unclamped.
//   · WHAT IT CUTS (MEASURED, the blog's twelve posts in the row): every
//     summary — four to eight lines whole — and the titles longer than two
//     lines: at the owner's window 2 of the 12 Romanian (English 3, German
//     6, French 7, Italian 3), on a tablet 2 (4, 6, 7, 4). No title takes a
//     single line there, so every card shows exactly two lines of each and
//     the twelve stand one height by themselves in every language; the
//     stretch (THE FIXED SHAPE's ONE HEIGHT) is the belt, which still evens
//     them under SC 1.4.12's overrides (the Romanian cards 712.09 to 735.72px
//     tall by themselves at the owner's window).
//   · THE CARD IT LEAVES — the row's height, its tallest card's: at the
//     owner's window 559.83px in all five languages, where it was 681.33 in
//     Romanian, English and Italian (17.8 % shorter), 721.83 in German
//     (22.4 %) and 735.33 in French (23.9 %); on a tablet, on every touch
//     screen in the row and in every window under the regime's step 497.44,
//     where it was 605.44 in Romanian and English (17.8 %), 641.44 in German
//     (22.4 %), 653.44 in French (23.9 %) and 629.44 in Italian (21.0 %); at
//     1920 770.8, where it was 937.86 in Romanian, English and Italian
//     (17.8 %), 993.55 in German (22.4 %) and 974.98 in French (20.9 %). The
//     card 1.432 to 1.434 times as tall as wide, where it was 1.743 to 1.745.
//     So the owner's 24 % is reached in French alone; the lines are the
//     lever, one number each in ROW_CLAMP — a summary line is 24px of a
//     tablet's card and 27 of the owner's window's, a title line 36 and 40.5.
//   · UNDER SC 1.4.12's overrides the clamp still shows two lines of each
//     and no text leaves its card: at the owner's window the row 735.72px in
//     Romanian, German and Italian, 686.23 in English and 712.09 in French,
//     where it was 847.80 to 1001.91.
//   · …AND CUTS MOST TITLES THERE — RECORDED, THE OWNER'S CALL (2026-10-26,
//     the lane's a11y review, MEDIUM): the overrides widen every line, so a
//     title that sets two lines takes three or four, and the clamp keeps two.
//     MEASURED in the row, the titles cut behind „…" under the overrides —
//     and without them — at the owner's window: Romanian 10 of the 12 (2),
//     English 7 (3), German 11 (6), French 12 (7), Italian 11 (3); on a
//     tablet 10 (2), 7 (4), 11 (6), 12 (7), 11 (4). The whole title stays the
//     card's name and its link's (PostCard's THE NAME) and the article's own
//     heading, and a screen reader reads it whole; but a sighted reader who
//     needs the spacing loses the end of most titles, where SC 1.4.12 asks
//     for no loss of content. The owner picked "title at most 2 lines"; the
//     levers are one number each in ROW_CLAMP: clamp the summary only
//     (`--title-lines` unset — the row as tall as its longest title, a title
//     line 40.5px at the owner's window), or three title lines (`--title-lines`
//     3 — under the overrides still cutting the four-line titles at the
//     owner's window: German 5, French 6, Italian 4, none in Romanian or
//     English).
//   · THE HYPHEN BEFORE THE ELLIPSIS, RECORDED — the owner's call: the
//     summary keeps the site's `hyphens: auto` (§15.14), so where its second
//     line ends inside a word the dictionary splits, the engine draws „…"
//     after the hyphen — „pentru du-…", the toothache post's (PostCard's
//     record of that name). MEASURED in this band's row: 5 of the 12
//     Romanian summaries on a tablet and 6 at the owner's window (German 4
//     and 6, French 4 and 4, Italian 4 and 3, English 1 and 0). The cure
//     needs a fifth page variable, the clamped summary's hyphenation —
//     PostCard's to read — NOT built.
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
// The two boxes round the carousel are plain <div>s: no role, no name.
// RECORDED (the card carousel's round-3 review), a gap in those resets: they
// match the EXACT names only, while HTML reads an attribute's name in any
// case, so a smuggled `Role` or `Aria-Labelledby` reaches the band's
// <section> (Home's populator passes neither) — the gap sections/CardCarousel
// closed for its own <section> with a case-insensitive drop (its
// OWN_ATTRIBUTES), which this band cannot import: a value exported from a
// 'use client' module reaches a server component as a client reference, and
// §4 bars a section's internals. The lever: a shared case-insensitive drop
// helper in ui/ or lib/, read by both.
//
// ── THE OUTLINE: the band's title is its one <h2> (SectionHeading's
// default) and every card's title an <h3> under it — `headingLevel={3}`,
// sections/PostCard's THE TITLE'S LEVEL, which came back for this band
// ("a page that nests the cards a level deeper brings it back with it"): the
// element follows the level, the look never does, so a card here reads
// exactly as on the blog list. Home's outline then runs page <h1> → this
// band's <h2> → the live cards' <h3>s — on the line the centred card's alone,
// the side cards being aria-hidden previews; in the row every live card's,
// three at most widths (THE COUNT), in the list's order (the row's, left to
// right, where the engine reads `reading-flow` — Chromium from 137, by its
// own account) — one level at a time (§9). BlogCarousel.test.tsx counts it:
// one <h2>, an <h3> per post.
//
// ── THE `sizes`, DERIVED — sections/PostGallery's method (its paragraph of
// that name): how wide the card's PICTURE is drawn, from the numbers the
// engine uses, every clause rounded UP — the browser may fetch a file a step
// larger, never a smaller one. The picture spans the card less its two 3px
// frames (PostCard's THE MINIATURE: the frame stays CSS px), and the card is
// CARD in the carousel's pixel, never wider than the carousel. THE FLAT ROW's
// four clauses come first, and since 2026-10-26 they spell its query's two
// clauses apart — a `sizes` entry takes ONE media condition, never a list:
// on a fine pointer the row at any height, `(min-width: …) and (pointer:
// fine)`, three widths; on any pointer its height clause, `(min-width:
// 37.5rem) and (min-height: 32rem)`, the fine pointer's last length again —
// so THE LINE's one length after them serves only a window under the query:
//   · 34rem from 117.5rem on a fine pointer: past the cap the picture holds
//     at 390.75 × 96rem / 1106 − 6px — 536.68px at a 16px root (33.54rem),
//     672.3 at a 20px one (33.62rem) — so 34rem, from where 29vw outgrows it
//     (34 / 0.29 = 117.24rem).
//   · 29vw from 74rem on a fine pointer: inside the regime the picture is
//     390.75 × column / 1106 − 6px, the column at most 0.8 of the window —
//     under 28.27 % of it, so 29vw holds it up to the cap. 74rem is the first
//     half-rem where 29vw also covers the theme pixel's picture an engine
//     without the regime draws, at both roots — 343.4px over 341.33 at a 16px
//     root, 429.2 over 428.17 at a 20px one — and between the regime's start
//     and 74rem the 21.5rem clause covers the regime's smaller picture.
//   · 21.5rem from 37.5rem on a fine pointer, and — its twin — from 37.5rem
//     wide and 32rem tall on any pointer: the card at the row's theme pixel
//     less 6px, 341.33px at a 16px root (21.33rem), 428.17 at a 20px one
//     (21.41rem) — on every touch screen in the row, on a fine pointer up to
//     74rem, and in an engine that cannot run the band scale.
//   · 14rem on the line — the card at the theme's pixel less 6px: 219.8px at
//     a 16px root (13.74rem), 276.2 at a 20px one (13.81rem) — at every width
//     it stands at, on either pointer: it never meets the band scale (THE
//     CAROUSEL'S OWN PIXEL). Its two fine-pointer lengths of before — 17vw from
//     87.5rem and 19.5rem from 115rem, the line grown past the owner's window
//     in a laptop window under 32rem tall — left with those windows, the
//     row's since the query's pointer clause.
// MEASURED by BlogCarousel.scale.test.tsx, which builds the picture's model
// out of the numbers where they live, pins it to the engine — on a fine
// pointer, on a touch screen through the CSSOM and at a 20px root, on the line
// and in the row — to a thirty-second of a pixel, and sweeps the shipped hint
// against it every 2px from 280 to 3840: both pointers, a classic scrollbar
// and none, a 16px root and a 20px one, heights of 400, 600 and 1000px. Never
// narrower than the picture. THE WORST OVER-ASK is THE ROW's, on a fine
// pointer: 1.108 times the picture at a 16px root (21.5rem over the 310.6px
// picture of a 1120px window, the regime's first, where 29vw cannot yet serve
// an engine without it) and 1.104 at a 20px one (430px over 389.7 at 1400px);
// 1.008 and 1.005 on a touch screen. THE LINE at most 1.019 at a 16px root on
// either pointer (14rem over its 219.77px picture) and 1.014 at a 20px one
// (over 276.21) — a mouse's 1.084 and 1.075 under 17vw left with it — but
// 1.28 on a window under ≈ 322px at a 20px root, where the card is the
// column's and the picture shrinks with it while 14rem holds — a file a step
// larger at most; the test holds each to its own bound. An engine that cannot
// run the band scale draws the theme pixel's picture at every width and is
// told up to 34rem in the row, 14rem on the line — a step larger, never a
// step smaller. THE SPACE BEFORE THE `vw` IS LOAD-BEARING, and so is the
// whole number: next/image reads only `(^|\s)(1?\d?\d)vw`, takes the
// smallest such share — 29vw, the only one since 2026-10-26 (17vw until
// then) — and keeps the candidates from 640 × 0.29 = 185.6px up: the
// picture's smallest, 219px, still asks for the 256px file at one device
// pixel, and the 128px file leaves the srcset.
//
// ── EMPTY RENDERS NOTHING — `null`: no region, no heading, no carousel. A
// titled band over no card is a promise with nothing behind it (the reviews
// and the doctors bands' rule). The early return sits AFTER useId(): hooks
// run in the same order on every render. It also comes BEFORE the carousel
// could count `slideLabels`: names handed over with no card are never read,
// so they raise no RangeError (BlogCarousel.test.tsx).
//
// ── MEASURED (2026-10-25, again 2026-10-26 under the query's pointer clause;
// Chromium in the test runner, the real stylesheet and faces, the blog's
// twelve Romanian posts — on a FINE pointer beside the runner's classic 15px
// scrollbar, and on a TOUCH screen through the CSSOM, its `(pointer: fine)`
// queries dropped and the scrollbar with them; BlogCarousel.scale.test.tsx
// holds every row to its model).
// THE LINE — the window, the column (the carousel's box, its stage and the
// numbers band's rhythm box: one left edge, one width, to the hundredth), a
// card in CSS pixels, then the room a side and the fade; wherever it still
// stands, its pixel and the opener's the theme's, every number the one it was
// before THE FLAT ROW. On a mouse, under 37.5rem alone:
//   280 · 233 · 225.77 × 392.88 · none, the sides cut · 3.62 (the room
//     beside the card behind this scrollbar; the strips at their 24px floor)
//   320 · 273 · 225.77 × 392.88 · none · 23.62 (likewise)
//   390 · 336 · 225.77 × 392.88 · none · 54.11
//   599, at any height · 464.63 · 225.77 × 392.88 · none · 54.11
// On a touch screen, every phone and every window under 32rem tall:
//   320 · 288 · 225.77 × 392.88 · none · 31.12 (the strips 31.11px)
//   360 · 324 · 225.77 × 392.88 · none · 49.12
//   390 · 351 · 225.77 × 392.88 · none · 54.11
//   844 × 390 (a phone held sideways) · 675.22 · 225.77 × 392.88 · none ·
//     54.11
//   932 × 430 · 745.63 · 225.77 × 392.88 · 0.35 · 54.11
//   1024 × 500 · 819.22 · 225.77 × 392.88 · 37.15 · 54.11
//   1401 × 500 · 1120.81 · 225.77 × 392.88 · 187.94 · 54.11
//   2560 × 500 · 2160, never capped · 225.77 × 392.88 · 707.54 · 54.11
// At every one: the arrows' outer edges on the column's; all twelve cards one
// width and one height; the opener's <h2> and eyebrow the numbers band's size
// and left edge, both unscaled; the centre card inside the stage, centred and
// fully opaque — 31.11, 49.11 and 62.61px in from each edge of a 320, 360 and
// 390 touch screen, the mask opaque by then; each arrow's strip and chevron
// the model's, beside the card wherever the column leaves 24px; no card
// glowing, the centre card alone live; no sideways scroll. The line a mouse
// drew under 32rem of height past a phone's width until 2026-10-26 — the
// theme's pixel up to the owner's window, then its growth past it, 247.77 ×
// 431.25 at 1536 to 313.53 × 546.31 at 2560 — is the row's since. The TALLEST
// CARD at the owner's width, each language under its own <html lang>
// (`hyphens: auto` reads it): Romanian 392.88, English 408.48, German
// 439.70, French 424.09, Italian 408.48 — against the list's own tallest card
// at the theme's pixel (605.55, 605.55, 677.55, 653.55 and 629.55 design px)
// the share less the 0.70px the frame's px leave (PostCard's THE MINIATURE),
// 0.6488 to 0.6490, but English's 0.6746 (RECORDED). Under SC 1.4.12's four
// overrides (line height 1.5, letter spacing 0.12em, word spacing 0.16em,
// paragraph spacing 2em) at 390 every card grows with the others — 546.97,
// 533.98, 580.16, 593.80 and 562.58px — no text leaves its card, and the
// progress dots keep their 40px under the cards.
// THE FLAT ROW — the window, the carousel's root (the screen less half a rem
// a side: its left edge 0.5px in from the page's behind this scrollbar, 8px
// in on a touch screen), the carousel's pixel, a card — clamped (THE CLAMP IN
// THE ROW) — its summary — the numbers band's tile sentence beside it, to the
// hundredth at every one — and the live cards:
//   600 × 1000 · 584 · 1.5385 · 347.33 × 497.44 · 16 · 1
//   768 × 1024 · 752 · 1.5385 · 347.33 × 497.44 · 16 · 1
//   1024 × 768 · 1008 · 1.5385 · 347.33 × 497.44 · 16 · 1
//   1138 × 900 · 1122 · 1.5385 · 347.33 × 497.44 · 16 · 1
//   1140 × 900 · 1124 · 1.4037 · 316.91 × 453.7 · 14.6 · 3
//   1180 × 820 · 1164 · 1.4538 · 328.2 × 469.95 · 15.12 · 3
//   1280 × 800 · 1264 · 1.5790 · 356.47 × 510.67 · 16.42 · 3
//   1401 × 1063 · 1385 · 1.7305 · 390.67 × 559.83 · 18 · 3
//   1536 × 864 · 1520 · 1.8995 · 428.83 × 614.72 · 19.75 · 3
//   1920 × 1080 · 1904 · 2.3802 · 537.36 × 770.8 · 24.75 · 3
//   2560 × 1440 · 2544 · 2.4037 · 542.66 × 778.41 · 25 · 3
//   3000 × 1200 · 2984 · 2.4037 · 542.66 × 778.41 · 25 · 5
// — at every one 17.8 % shorter than the card was before the clamp: 605.44
// tall up to 1138, then 552.22, 572.02, 621.5, 681.33, 748.05, 937.86 and
// 947.16. And on a mouse at any height (THE QUERY's pointer clause):
//   844 × 390 · 828 · 1.5385 · 347.33 × 497.44 · 16 · 1
//   911 × 422 (a 1366 × 633 laptop at 150 %) · 895 · the same · 1
//   1093 × 506 (the same laptop at 125 %) · 1077 · the same · 1
//   1401 × 500 · 1385 · 1.7305 · 390.67 × 559.83 · 18 · 3
//   1920 × 500 · 1904 · 2.3802 · 537.36 × 770.8 · 24.75 · 3
// — every one its width's row at full height, to the hundredth.
// On a TOUCH screen the row keeps its theme pixel, 1.5385 — the card 347.33 ×
// 497.44 and the summary 16px at 600 × 960, 768 × 1024, 1024 × 768, 1180 ×
// 820, 1366 × 1024 and 2560 × 1440, the live cards 1, 1, 1, 3, 3 and 7. At
// every one: the stage the root and the arrows on its edges, the mask clear
// at the stage's edge and opaque at the strip's inner edge; the title, the
// author, the summary, the reading time, the read-more and a chip's label the
// miniature's 19.5 / 9.1 / 10.4 / 10.4 / 11.7 / 7.8 × the pixel; every title
// and summary two lines at most, its text whole; the centre card in its aura
// and no other; the opener the numbers band's size and edge (29.2 / 11.35px
// at 1140, 35.99 / 14 at 1401, 49.51 / 19.25 at 1920, 50 / 19.44 at 2560,
// unscaled on a touch screen); no sideways scroll. The TALLEST CARD at the
// owner's window: 559.83 in all five languages, two lines of each in every
// card — the blog list's own tallest card clamped the same way and drawn in
// the row's card pixel, 0.65 × 1.7305, to half a pixel; with the clamp
// lifted the list's whole card again, Romanian 681.33, English 681.33,
// German 721.83, French 735.33, Italian 681.33. Under SC 1.4.12's overrides
// there: 735.72, 686.23, 735.72, 712.09 and 735.72px, 1.76 to 1.88 times as
// tall as wide (920.91, 847.80, 978.28, 1001.91 and 947.91 before the clamp),
// every title and summary still two lines at most — most titles cut there
// (THE CLAMP IN THE ROW's record) — no text leaving its card, the dots under
// the cards.
//
// ── RECORDED, NOT THIS FILE'S TO CHANGE — each a lever in another folder:
//   · THE SMALLEST TEXT, for the owner: ON THE LINE — every phone, and on a
//     touch screen every window under 32rem tall — at every width, the title
//     sets 19.5px, the author 9.1, the summary 10.4, the reading time 10.4,
//     the read-more 11.7 and a chip's label 7.8 (on a 19.06px chip), its
//     pixel the theme's (THE CAROUSEL'S OWN PIXEL; the 1.375-times sizes a
//     mouse drew in a 1920 window under 32rem tall until 2026-10-26 are the
//     row's since). IN THE ROW the summary is the numbers band's tile
//     sentence (THE TEXT RULE): 16px on every tablet and touch screen and on
//     a narrow laptop window — the title 30, the author 14, the reading time
//     16, the read-more 18, a chip's label 12 — and 18 design pixels inside
//     the band scale: 14.6px at a 1140 window, 18 at 1401, 24.75 at 1920, 25
//     past the cap. No criterion of WCAG 2.2 AA sets a smallest size, but the
//     line's 7.8 to 10.4px is under anything this site sets for an older
//     reader elsewhere: MINIATURE is the owner's lever, one number here.
//   · THE ZOOM, in the row (COMPUTED from the model, Chromium's page zoom: the
//     CSS window shrinks by the zoom, a 15px scrollbar with it). Outside the
//     regime the row's pixel is 1rem / 16 ÷ 0.65 and follows a zoom and a
//     larger default font as rem does; inside it the band scale's trade the
//     owner accepted for Home (§15.32) — the tile sentence's own: on a 1920 ×
//     1080 screen the summary is 24.75 device px at 100, 110, 125 and 150 %,
//     28 at 175 % and 32 at 200 %; on a 2560 × 1440 one 25, 27.5, 31.25, then
//     33.09 from 150 to 200 % and 40 at 250 %. THE FALL, CLOSED ON A MOUSE
//     (2026-10-26): under the height clause alone a zoom that took the CSS
//     window under 32rem handed the band back to the line — a 1440 × 900
//     laptop drew the summary at 18.5 device px up to 125 %, 24 at 150 % and
//     28 at 175 % in the row, then 20.8 at 200 % on the line (its 10.4 × 2)
//     beside a tile sentence of 32 — and the query's pointer clause keeps the
//     row at any height on a fine pointer: there 32 at 200 %, the tile
//     sentence's, and a 1920 × 1080 screen 40 at 250 %, where it fell to 26.
//     ON A TOUCH SCREEN THE FALL STANDS (COMPUTED, not measured on a device):
//     a tablet browser's page zoom — iPadOS Safari's — narrows the CSS window
//     too, and a 1024 × 768 iPad held sideways, about 700px of page, falls
//     under 32rem between 125 and 150 %: the summary 16 × 1.25 = 20 device px
//     at 125 % in the row, 10.4 × 1.5 = 15.6 at 150 % on the line, under its
//     16 at 100 %, then 18.2 and 20.8 at 175 and 200 % beside a tile
//     sentence of 28 and 32. The lever is CardCarousel's: the line drawn in
//     the row's pixel — a media query's every length shrinks under a page
//     zoom, so no height clause escapes it.
//   · THE CHROME SCALES WITH THE ROW'S PIXEL: the arrows, the progress dots
//     and the room under the cards are theme lengths of the carousel's pixel,
//     so the row draws them 1.54 times the line's on a tablet and 2.38 times
//     at 1920 — the strips 55.38 and 85.67px wide, the chevrons 36.92 × 221.53
//     and 57.11 × 342.73, an idle dot 12.3 and 19.03px across in a hit box
//     67.69 and 104.72px tall, 61.53 and 95.2px of room under the cards —
//     every one in proportion to the card's width. Against the cards' row the
//     chevron is 0.365 to 0.367 of it on the line, and 0.445 to 0.446 in the
//     row, whose cards THE CLAMP IN THE ROW shortened (0.365 to 0.366 before
//     it). The lever is CardCarousel's: its chrome spelled against a pixel of
//     its own.
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
//     pointer's (`scalable:`), so a 2560 touch screen draws the row at its
//     theme pixel, 347.33px cards, seven of them live.
//   · ENGLISH'S EXTRA LINE AND GERMAN'S TITLE, ON THE LINE. English's
//     tallest miniature is 0.6746 of its list card: the optical size gives it
//     one more summary line (PostCard's THE OPTICAL SIZE MOVES A LINE).
//     German's tallest, „cum-iti-alegi-periuta-de-dinti", is 0.65 of the
//     list's card in the theme's exact pixel, 677.55, where its title „Wie Sie
//     Ihre Zahnbürste auswählen" takes three lines; at the real 1401 window's
//     0.99983 the list draws it on two, 641.5 — the title sits on its line's
//     edge. In the row neither: the row's miniatures ARE the list's cards in
//     their pixel (THE MINIATURE), and every one shows two lines of each title
//     and summary (THE CLAMP IN THE ROW), so every language's tallest is
//     559.83 at the owner's window.
//   · THE LIFT, ON THIS BAND'S CARD BOXES (CardCarousel's THE LIFT and THE
//     HOVER): the hovered centre card's box, grown to 105 %, stays 9.46px
//     inside the stage's mask box at 390 in Romanian on the line (English and
//     Italian 9.07, German 8.29, French 8.68) — at every width a mouse meets
//     the line, its card and its pixel being one (the scale test samples 599
//     too) — and in the row, where THE CLAMP IN THE ROW makes every card one
//     height, 19.38 at 1401 and 26.64 at 1920 in every language (16.34 and
//     22.46 before the clamp), at any height (the scale test samples 1401 ×
//     500); under SC 1.4.12's overrides 4.44
//     (French) to 5.93px at 390, 14.98 (Romanian, German, Italian) to 16.22
//     (English) at 1401 (8.33 to 12.18 before the clamp) — the stage's two
//     steps of padding beside the lift cover a card up to ≈ 3.4 times as tall
//     as wide at every width (both are lengths of the carousel's pixel). A
//     live side card grown to the centre card's size stays 40.28px clear of
//     the arrows' strips at 1401 and 54.91 at 1920. Only a fine pointer grows
//     a box (`hover:` answers only `(hover: hover)`).
//   · TWELVE PROGRESS DOTS: one per post, so the Tab order holds fourteen
//     stops before the first card's link — the live cards' links after them
//     (THE TAB ORDER, below) — CardCarousel's recorded trigger ("if a picker
//     ever exceeds about six dots") for a roving tablist.
//   · THE TAB ORDER FOLLOWS THE PICTURE ONLY WHERE `reading-flow` IS READ
//     (CardCarousel's THE TAB ORDER FOLLOWS THE ROW): in the row the live
//     cards' links are tabbed left to right — the left neighbour, the centre,
//     the right — in Chromium from 137 (the runner's 151); WebKit 26.5 and
//     Firefox 153 know neither `reading-flow` nor `reading-order` and keep
//     the DOM's order, the list's, so where the loop wraps a Tab can go from
//     the right neighbour to the far left one („2 din 12" → „12 din 12").
//     Each card's name says which one it is; the lever is the carousel's.
//   · THE ROW ASSUMES MORE POSTS THAN PLACES (CardCarousel's record of that
//     name): the row shows as many cards as the screen fits — at most nine
//     at least partly, measured (a 2560 touch screen) — so the twelve posts
//     keep the loop's far end off the stage; a blog of ten posts or fewer
//     would show it there, the card that crosses the ring on a step snapping
//     from one end to the other in plain view, and of four or fewer that
//     card is a LIVE neighbour (CardCarousel's THE REACH: the cap does not
//     keep a crossing card out of reach). Today's list is twelve.

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

/** THE BAND (the header): the page ground, and THE BELT under the row's bleed
 *  — `overflow-x-clip` with its Safari ≤ 15 twin, sections/ReviewsCarousel's
 *  spelling byte for byte, so the stylesheet ships no rule of its own for it:
 *  the row's root overshoots the page by half the scrollbar a side less its
 *  half-rem inset, so a scrollbar thicker than a rem leaves a fraction of a
 *  pixel past it, and the band swallows it (THE FLAT ROW's THE BLEED). */
const BAND =
  'overflow-x-clip supports-[not_(overflow:clip)]:overflow-x-hidden bg-page';

/** THE RHYTHM BOX (the header's THE BAND and THE BAND SCALE, THE OPENER): a
 *  flex column, the band's room above and below on the column's steps and its
 *  one gap, then ui/Container's two band-scale strings — imported, never
 *  re-spelled (tests/unit/design-scale.test.ts holds every wearer to an
 *  import). On the line the carousel inside it is the column (THE WIDTH). */
const RHYTHM = cx(
  'flex flex-col gap-8 py-12 @lg:gap-10 @lg:py-16 @3xl:gap-12 @3xl:py-20',
  bandColumnClasses,
  bandScaleClasses,
);

/**
 * THE ROW'S ZOOM (the header's THE FLAT ROW, THE TEXT RULE): from the flat
 * row's query up, the box round the carousel declares the band scale's pixel
 * at 1.125 ÷ 0.65 of the column's — `--band-zoom` — so wherever the regime's
 * gates hold, a miniature's summary (text-base at MINIATURE of that pixel) is
 * 18 of the column's design pixels: the numbers band's tile sentence
 * (sections/DoctorStats' TILE_ZOOM, 9/8, on its text-base), size for size at
 * every width. The query is sections/CardCarousel's CARD_CAROUSEL_FLAT_QUERY,
 * its spaces as underscores — a value of a 'use client' module reaches this
 * server component as a client reference, so it is spelled here and
 * BlogCarousel.test.tsx holds every spelling to it; the 1.125 is DoctorStats'
 * TILE_ZOOM and the 0.65 MINIATURE, held there too. One whole static string:
 * Tailwind reads class names from source text.
 */
const ROW_ZOOM =
  '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:[--band-zoom:calc(1.125/0.65)]';

/** THE CAROUSEL'S OWN PIXEL (the header): ui/Container's pixel declared
 *  again on the box round the carousel alone — whose nearest size container
 *  is ui/Container's, as the rhythm box's is — and from the row's query up
 *  the row's zoom beside it, read where that pixel is declared. No floor (the
 *  header's THE FLOOR, REMOVED). */
const CAROUSEL_PIXEL = cx(bandScaleClasses, ROW_ZOOM);

/**
 * THE ROW'S PIXEL (the header's THE TEXT RULE): from the flat row's query up,
 * a box round the box above declares the THEME's pixel over MINIATURE — 1rem
 * ÷ 16 ÷ 0.65 — and redraws every theme length inside it in that pixel, so
 * wherever the regime's gates do not hold (every touch screen, a window
 * narrower than the regime's step, an engine that cannot register custom
 * properties) a miniature's summary is 16 of the theme's pixels, 1rem — the
 * tile sentence's size there — and the card the blog list's own card, 347.33
 * of them. Inside the regime the box within declares a pixel of its own, so
 * no rule order between the two boxes can matter. The registered
 * `--scale-px` (globals.css), `design-scale` beside it; neither box is a
 * container, so the box within still reads ui/Container's column.
 */
const ROW_PIXEL =
  '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:[--scale-px:calc(1rem/16/0.65)] ' +
  '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:design-scale';

/**
 * THE CLAMP IN THE ROW (the header): from the flat row's query up, the same
 * box sets the four variables sections/PostCard's THE CLAMP reads on every
 * `clampable` card under it — the box the engine's line clamp builds, the
 * clip that hides the lines past it, and two lines of the title and two of
 * the summary — so each ends in „…" where its text is longer. The clip is
 * `clip`, never a scroll container (the header's THE CLIP, NOT A SCROLLER),
 * in two classes each engine meets ONE of: `clip` where `@supports (overflow:
 * clip)` holds, `hidden` where it does not (Safari ≤ 15 — a custom property
 * is valid there whatever it holds, so `clip` alone would compute the card's
 * overflow `visible` and paint the hidden lines). Below the query none is
 * set, and the phone's cards are today's to the pixel. Unregistered custom
 * properties, inherited by every card. Whole static strings: Tailwind reads
 * class names from source text.
 */
const ROW_CLAMP =
  '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:[--clamp-box:-webkit-box] ' +
  '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:supports-[overflow:clip]:[--clamp-clip:clip] ' +
  '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:supports-[not_(overflow:clip)]:[--clamp-clip:hidden] ' +
  '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:[--title-lines:2] ' +
  '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:[--summary-lines:2]';

/** THE ROW'S BOX (the header's THE FLAT ROW): the row's pixel and the row's
 *  clamp — every class behind the row's query, none below it. */
const ROW_BOX = cx(ROW_PIXEL, ROW_CLAMP);

/**
 * THE BLEED (the header's THE FLAT ROW — "as wide as the screen like the
 * carrousell for reviews"): from the row's query up the carousel's root runs
 * across the screen, the reviews deck's full-bleed idiom (`calc(50% − 50vw)`)
 * half a rem in from each edge — so an arrow's strip, at the root's edge,
 * stays clear of a classic scrollbar's overshoot (`100vw` counts the bar)
 * and of a phone's edge gesture; the mask is transparent at the stage's
 * edge, so the inset shows nothing. Below the query the carousel is the
 * column (THE WIDTH). Placement through the carousel's className (§6.8).
 */
const ROW_BLEED =
  '[@media(min-width:37.5rem)_and_(min-height:32rem),(min-width:37.5rem)_and_(pointer:fine)]:mx-[calc(50%_-_50vw_+_0.5rem)]';

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
 *  spacing step over four, so the carousel's own pixel draws it with every
 *  other length of the carousel. It travels as CardCarousel's `--card-fixed`, an
 *  INLINE style, so no rule ships for it; the spaces round the `-` are
 *  load-bearing (CSS reads `1106-2` as two numbers). */
const CARD = `calc(var(--spacing)/4*(${LIST_COLUMN} - 2*${LIST_GAP})/${LIST_COLUMNS}*${MINIATURE})`;

/** THE `sizes`, DERIVED (the header): the miniature's picture — the card less
 *  its two 3px frames. THE FLAT ROW's four first, one media condition each
 *  (a `sizes` entry takes no list): on a fine pointer, the row at any height,
 *  34rem past the band scale's cap from 117.5rem, 29vw while the scale grows
 *  it from 74rem, 21.5rem at the row's theme pixel from 37.5rem; on any
 *  pointer, the row's height clause, 21.5rem from 37.5rem wide and 32rem
 *  tall. Then THE LINE, at the theme's pixel wherever it stands: 14rem.
 *  Whole `vw` shares after a space: next/image reads only those. */
const SIZES =
  '(min-width: 117.5rem) and (pointer: fine) 34rem, ' +
  '(min-width: 74rem) and (pointer: fine) 29vw, ' +
  '(min-width: 37.5rem) and (pointer: fine) 21.5rem, ' +
  '(min-width: 37.5rem) and (min-height: 32rem) 21.5rem, 14rem';

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
          {/* THE ROW'S BOX — from the flat row's query up, the theme's
              pixel over the miniature's share, so a summary is the numbers
              band's tile sentence (THE TEXT RULE), and the clamp's four
              variables, two lines of each title and summary (THE CLAMP IN
              THE ROW); nothing below it. */}
          <div className={ROW_BOX}>
            {/* THE CAROUSEL'S OWN PIXEL — the band scale's pixel declared
                again round the carousel alone: the theme's on the line, which
                never meets the regime, the tile sentence's in the row (THE
                TEXT RULE), so the opener above keeps every Home band's. */}
            <div className={CAROUSEL_PIXEL}>
              {/* THE CAROUSEL — the five-card window on a phone, THE FLAT ROW
                  from a tablet up, bled to the screen there (THE BLEED);
                  circular, every card one fixed width and the tallest card's
                  height (THE FIXED SHAPE); its slides the blog's own cards at
                  the owner's 65 %, every prop by name (THE MINIATURE), none
                  growing on a hover — the carousel grows its slot (THE
                  HOVER). */}
              <CardCarousel
                visible={5}
                mode="loop"
                cardWidth={CARD}
                cardHeight="tallest"
                flatFrom="tablet"
                labels={labels}
                slideLabels={slideLabels}
                className={ROW_BLEED}
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
                    jump={false}
                    clampable
                    headingLevel={3}
                    sizes={SIZES}
                    className="h-full"
                  />
                ))}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
