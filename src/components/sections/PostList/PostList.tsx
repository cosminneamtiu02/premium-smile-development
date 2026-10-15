import type { ReactElement } from 'react';
import {
  Pagination,
  type PaginationProps,
} from '@/components/sections/Pagination/Pagination';
import {
  PostCard,
  type PostCardContent,
} from '@/components/sections/PostCard/PostCard';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { Heading } from '@/components/ui/Heading/Heading';
import { Text } from '@/components/ui/Text/Text';
import { cx } from '@/lib/cx/cx';

// sections/PostList — the blog list's band: a centred hero (the page's <h1>
// over a lead), the articles as cards three to a row and six a page, and the
// page navigation under the grid's bottom-right corner. The owner, verbatim
// (2026-10-14, the blog list's second round — CLAUDE.md §15.39): "i want 3 per
// row, max 6 items on a page, so 2 rows and refacot also on the scrolling
// between them. so the scrolling through pages has to be blow where the last
// card from the last row finishes in it's bottom right. there below it below
// the last item's bottom right corner i'd wnat the left right button from the
// reviews carrousell … I also want a hero section with like heading and
// eyebrow. 2 rows of ehading with smth like we care about your smile so we
// post latest news info on how to take care of it. and with an eyebrow of
// text below it on 3 lines both centered." His references were two
// screenshots: three white cards in a row, and a big two-line centred heading
// over a small grey three-line sentence. Until that day the band was the
// infiniswiss.com list of 2026-10-11 — a mono „Blog" kicker over the <h1>,
// five cards a page one under another, „Anterior · 1 / 3 · Următor".
//
// ── A DUMB BAND (the PriceList / Hero shape, owner fb-459): every string
// arrives finished and every href built — the blog's pages are the ONE
// populator (they read lib/blog, word each reading time through ICU, build
// the hrefs through localeHref). No message key, no t(), no data import, no
// hook, no 'use client': a Server Component that compiles into the static
// HTML of every blog page and ships no JavaScript of its own (§16) — ui/Image
// brings its optimizer's small island with each picture, as on every page
// with a photograph. It composes two sections through their public components
// only (§4: sections/PostCard, sections/Pagination), three atoms (ui/Container
// and its two band-scale strings, ui/Heading, ui/Text) and lib/cx.
// PostList.test.tsx pins the directive's absence and the import surface from
// the source text, because no runtime assertion can see either.
//
// ── THE BAND: ui/Container's PAGE-BAND RECIPE. The outer is an UNNAMED
// <section> with no paint of its own — the 404 page's and the privacy
// policy's reasoning: the shell's <body> already carries the page ground, the
// page's <main> is the landmark, and a region named by the <h1> would only
// repeat the page's name to a screen reader. Container owns the width and the
// container context; the RHYTHM box inside it owns the band's room above and
// below and its ONE gap, between the hero and the cards (§6.4: the parent
// owns spacing through gap utilities), on the column's own steps. The owner,
// on the first preview (2026-10-14, verbatim): "i want more spacing from top
// and more spacing below text below heading and a little spacing between
// heading and text below heading … there also i a little too much space
// between end of section with articles and map"; and on his second look, the
// same day: "there is smth that bothers me visually wit this text: "Aici
// găsești noutățile clinicii …". try doubling the space between heading and
// this text … below it between above mentioned text and the blog articles
// add then again 20% more space". So:
//   · ABOVE THE HERO, under the sticky header: 4rem on a column under 32rem,
//     6rem from it, 8rem from 48rem — 64 / 96 / 128 (the privacy policy's
//     3 / 4 / 5rem on the first preview);
//   · FROM THE LEAD TO THE CARDS, the box's one gap: 4.8rem, 6rem from a
//     48rem column — 76.8 / 96, a fifth over the 4 / 5rem his first look had
//     asked for (over the first preview's 3rem). The 4.8rem is 19.2 spacing
//     steps, which Tailwind's bare form cannot spell (it takes quarter steps
//     only — a bare 19.2 compiles to nothing), so it is written in brackets
//     as the very expression every bare step compiles to, `--spacing` ×
//     19.2: 4.8rem exactly off the regime. Inside THE BAND SCALE it never
//     shows — the regime starts at a 56rem column, past the 48rem step, so
//     the gap there is always the 6rem step, 96 × s — but spelled in the
//     step it stays a length the remap would reach, like every other the band
//     owns (the price list's lesson, §15.32 round 2: a rem literal keeps its
//     pixels while its band scales);
//   · INSIDE THE HERO, the heading and its lead 3rem apart, 48 — doubled on
//     the second look (THE HERO, CENTRED);
//   · UNDER THE PAGER, 2rem at every step. The bottom room no longer follows
//     the top's steps: the band that follows on every blog page, the map
//     (sections/ClinicLocation, the page's), opens on its own top step — 3rem,
//     4rem from 32rem, 5rem from 48rem — so the pager now stands 80 / 96 / 112
//     (design) pixels above the map's opener, where it stood 96 / 128 / 160.
// The cards and the pager stand in a group of their own, 2rem apart (THE
// PAGER), so the pager sits closer to the grid than the grid to the hero.
//
// ── THE BAND SCALE (ui/Container's paragraph of that name and its recipe rule
// 5; CLAUDE.md §15.32): the RHYTHM box wears `bandColumnClasses` and
// `bandScaleClasses`, imported, so on a laptop or a desktop — a fine pointer,
// an engine that registers custom properties, a column of max(56rem, 896px),
// about a 1140px window beside a classic scrollbar — the whole band is ONE
// design, the owner's 1401 window's, drawn in the design pixel s = min(column,
// 96rem) / 1106 and capped and centred at a 96rem column: the hero, the cards
// (PostCard's frame and its words) and the pager (its discs through the
// `--disc-size` it sets) grow and shrink together, with Home's headings and
// the map under the band. Phones, touch tablets and narrower windows keep the
// theme's rem (§7). The grid's third column needs no class of its own: it
// starts at the Container's `@4xl`, the regime's own step, so every laptop
// and desktop draws three across.
//   THE ONE SIZE THE REMAP CANNOT REDRAW is the <h1>'s: ui/Heading's `hero`
//   step is a VIEWPORT clamp. So inside the scale the title takes its design
//   size by one class, the last on it, behind the band scale's own chain,
//   which reads ui/Container's column as every regime class here does — and
//   that class is sections/DoctorIntro's name's, byte for byte: the `hero`
//   step's value at the owner's 1401 window, 16 + 3.5 × 14.01 = 65.035px, as
//   16.26 spacing steps, 65.04 design pixels. A KEEP-IN-SYNC pair, which
//   tests/unit/design-scale.test.ts holds equal (a third consumer is the
//   trigger for a sibling step in ui/Heading). For a few hours of 2026-10-15
//   the blog's heading wore a size of its own, 56 design pixels: the owner,
//   asked how to make room for the stairway's longer heading (at 65 the
//   German first line needs 1,202 design pixels of a 1,106-pixel column), had
//   chosen "Heading a size smaller". The same day he took it back, verbatim:
//   "tbh i kinda liked it how it looked before. so if it is larger but still
//   fits in page and looks good it should not be constrained by a div so
//   that it has same space left and right as the articles seciton". So the
//   size is the doctor page's again, and the room comes from the width
//   instead (THE HEADING'S REACH, under THE HERO).
//   MEASURED (PostList.scale.test.tsx — Chromium, the real faces, a classic
//   15px scrollbar, the Romanian page), between a 1280 and a 1920 window
//   (s 0.912 → 1.375, × 1.507): the <h1> 59.3 → 89.4px and its box, which
//   hugs its first line, 1081.6 → 1627.7 (1185.6 and 1183.6 design pixels:
//   Source Serif 4's optical size sets smaller type a little wider per em —
//   the same line is 1205.2 at a 1140 window, 1.8 % wider, and 1183.5 to
//   1183.7 at every window from 1401 up),
//   the lead 14.6 → 22px and its box, its first line's, 390.7 → 551.2
//   (428.2 and 400.8 design pixels, 6.4 %), the room above the hero 116.8 →
//   176, the heading to its lead 43.8 → 66 and the lead to the cards 87.6 →
//   132 (both gaps 48.000 and 96.000 × s as the engine computes them, at
//   every window in the scale), a card 316.9 → 477.7px wide, the grid's gap
//   29.2 → 44, the pager 129.4 → 193.4 × 40.1 → 60.5 — each the design × s
//   but the hero's two boxes, the pager within the 0.7 % its counter's
//   optical size costs (Pagination's THE BAND SCALE). A row's
//   HEIGHT is × s while its words wrap alike — from 1140 to the 1401
//   reference here — and past it Source Serif 4's optical sizing (larger
//   type set a little narrower per em) lets a summary or a title lose a
//   line: with the Romanian posts at 1536 the second row stands 4 % short of
//   × s, at 1920 both rows, 4 and 10 % (three of the six cards a line
//   shorter, the fourth two) — §15.25 round 2's trade (d). Past the cap
//   (2560) the band is 1536px wide and centred.
//   The trades — a browser zoom and a reader's default font size inside the
//   regime, the jump at its step — are the regime's own, recorded where they
//   were born (DoctorShowcase's D10, §15.25 round 2), and hold for this band
//   as they do for Home's and the doctor page's (§15.32).
//
// ── THE HERO, CENTRED: the page's <h1> over a lead paragraph, the owner's
// "2 rows of ehading … and with an eyebrow of text below it on 3 lines both
// centered". The "eyebrow" is read as his second screenshot shows it — a
// small grey sentence in the body face under the heading — and not as the
// house's mono micro-label: three lines of uppercased, wide-tracked capitals
// are hard reading for §1's older visitor (the planner's call, told to the
// owner). The <header> centres the two boxes (`items-center`) and the
// heading's lines (display text may inherit centring, §15.15 b), 3rem apart
// — doubled on the owner's second look ("try doubling the space between
// heading and this text") from the 1.5rem his first look had asked for ("a
// little spacing between heading and text below heading", over the first
// preview's 1rem); the lead centres its own lines ON THE ELEMENT, because
// globals.css aligns every <p> to start and a rule that matches the element
// beats an inherited value. DOM ORDER IS VISUAL ORDER: the <h1> first, so a
// screen reader that lands on it reads the lead, then the articles.
//   THE STAIRWAY — the owner, 2026-10-15, verbatim: "add at the end of the
//   heading like a "through our blog" so for german add a wie Sie es pflegen
//   durch unser Blog and move Ihnen, to line above and do geenrally so so
//   that it looks like a stairway downwards from title to text below" (his
//   first preview's rule lives on inside it: "i want first row longer, second
//   one shorter, same for text below it"). So on a laptop or a desktop the
//   COPY breaks its own lines: each message carries a line break where the
//   stairway turns — one in the heading, two in the lead — and both blocks
//   wear the pre-line white-space behind the band scale's chain (STAIRWAY,
//   spelled once), which keeps those breaks and still wraps a line too long
//   for its box. The heading falls in TWO lines and the lead in THREE, each
//   narrower than the one above it — the heading's second line at most nine
//   tenths of its first, the lead's second at most nineteen twentieths of its
//   first and its third at most nine tenths of its second — and the
//   heading's second line is wider than the lead's first, so the steps run
//   on from the heading into the lead. Everywhere else — a phone, a tablet, a
//   touch screen, a window under the regime's step — the normal white-space
//   makes each break a space (CSS's segment-break rule), and both blocks wrap
//   as prose, as they always did (OFF THE SCALE, below).
//   THE HEADING'S REACH — the owner, 2026-10-15, on the heading back at its
//   old size (THE BAND SCALE: "… it should not be constrained by a div so
//   that it has same space left and right as the articles seciton"). On a
//   laptop or a desktop the <h1> is not held to the cards' column: inside THE
//   BAND SCALE alone it is as wide as its longest line (REACH: a max-content
//   width), at most the column's full width plus 50 spacing steps — 100
//   design pixels a side, never more — and the hero's centring places it: a
//   flex column centres an item wider than itself by letting it pass BOTH
//   its edges by the same amount (Chromium, WebKit and Firefox alike,
//   measured on 2026-10-15), so the heading stays on the column's centre
//   line and its box passes the cards' left and right edges equally. Nothing
//   on the way clips it — the band, ui/Container and the page's <main> set
//   no overflow, and a size container does not clip — and the gutter is
//   wider than those 100 design pixels at every window in the scale. At its
//   narrowest, a 1140 window behind a classic scrollbar: 114px against 81.1
//   in the test runner (PostList.scale.test.tsx's), whose 10vw is a tenth of
//   the whole 1140; 112.5px on the built page (G2's reading, 2026-10-15), a
//   tenth of the 1125 beside the scrollbar, against the 81.4 its 900px
//   column makes of 100 design pixels. So the box never reaches the window's
//   edge and the page never scrolls sideways. A line too long even for that
//   box wraps inside it — the pre-line white-space wraps (THE STAIRWAY) —
//   which is what SC 1.4.12's text spacing does to every first line: each
//   outgrows the reach and the box stops at it. The LEAD stays in the column
//   under its own cap (THE LEAD). Off the scale the heading keeps the column
//   and its 6xl cap, as it always did.
//   · MEASURED in the test runner (PostList.scale.test.tsx's Chromium, the
//     real faces, its classic 15px scrollbar), how far the <h1>'s box passes
//     each edge of the column, in design pixels, at a 1140 / 1401 / 1920
//     window: Romanian 49.6 / 38.8 / 38.8, English 30.1 / 19.2 / 19.2, German
//     58.9 / 47.7 / 47.7, French 83.2 / 71.9 / 72.0, Italian 69.0 / 57.8 /
//     57.9 — the box centred on the column to 0.01px everywhere, and the
//     page's edge 46.5px (French) to 89.6px (English) away from it at 1140,
//     68.2 to 120.9 at 1401, 93.0 to 165.5 at 1920: the runner's pixels. On
//     the built page the gutter is 1.5px narrower at 1140 (112.5 against
//     114), so French's box stands about 45px from the edge there (computed
//     from the runner's sweep at the built page's design pixel).
//   · ON A SLOW FIRST LOAD — RECORDED, NOT FIXED (G2 react, 2026-10-15).
//     Until Source Serif 4 arrives, next/font's swap display sets the heading
//     in its fallback face, Arial at 101.16 % (the built stylesheet's own
//     declaration), whose lines run 6 to 13 % wider, with no optical size to
//     narrow them as they grow. Three first lines then outgrow the reach and
//     wrap inside it: in the test runner, with that very declaration,
//     French's (1369.4 design pixels, 131.7 past each edge of the column),
//     Italian's (1341.9, 117.9 past) and Romanian's (1331.3, 112.6 past),
//     while German's fits by 2.1 a side (97.9) and English's by 6.4 (93.6).
//     French's joined them with the copy review's « nous tient à cœur » (THE
//     COPY); G2 react, on the built page and the copy before that review,
//     read German and Italian. The heading is then three lines, 197.8px tall
//     against 131.9 at a 1140 window, 243.8 against 162.6 at 1401 and 335.4
//     against 223.6 at 1920 (the runner's), and when the webfont lands the
//     page below moves up by the difference, 65.9 to 111.8px — about 0.05 by
//     G2's layout-shift arithmetic, under the 0.1 that counts as good. THE
//     LEVER is a reach closer to the gutter: 132 design pixels a side would
//     hold every language's first line in the fallback too, French's
//     included, though only some 6 short of the gutter at its narrowest
//     (138.3 design pixels on the built page at 1140, 139.6 to 140.6 in the
//     runner); 120, the lever before the copy review, holds every first line
//     but French's.
//   ON A PHONE'S OR A TABLET'S COLUMN — under the Container's 48rem step,
//   windows narrower than about 975px on the built page behind a classic
//   scrollbar (979 in the test runner, whose 10vw counts the scrollbar; 960
//   without one) — both wear the CSS `text-wrap: pretty` (`@max-3xl:`),
//   which mends a short last line where it can. Never from the step up:
//   WebKit's `pretty` re-balances a whole block (measured on the first copy,
//   2026-10-14, when it evened the Romanian lead's three lines out at a
//   laptop's widths), and the stairway wants its lines where the copy breaks
//   them. `pretty` is no guarantee either: Chromium weighs a short last line
//   against ragged ones and kept the first Italian draft's lone „cura" at
//   744–900px — hence the no-break spaces below.
//   THE COPY, rewritten for the stairway on 2026-10-15 (Claude's drafts in
//   five languages but the German heading, the owner's own words): every
//   heading gained its last phrase — „prin blogul nostru", "through our
//   blog", „in unserem Blog", « grâce à notre blog », «con il nostro blog»
//   — and is one sentence over two lines, the Romanian „Pentru că ne pasă de
//   zâmbetul tău, îți arătăm / cum să ai grijă de el prin blogul nostru".
//   Every lead kept its words but one clause, its middle item — „ce să
//   întrebi la consultație", "what to ask at your appointment" — because
//   with it no pair of breaks at a phrase's edge descends under the kept
//   492-pixel cap: an intro, then three items too long to share a line two by
//   two (German's and French's leads had no such pair at all, Romanian's and
//   Italian's only by splitting „cum / să" and „cosa / chiedere", English's
//   only inside „what to ask / at your appointment"). One cut, the same in
//   every language, keeps the five saying one thing, and each lead now
//   breaks after its colon and before its „și", "and", „und", « et », «e».
//   French's lead also lost its opening „Retrouvez ici", without which its
//   first line alone measured 536 design pixels, over the cap. The same
//   day's five-language copy review (a11y-architect) then moved four
//   phrases. French's heading went back to the warmer, idiomatic « Votre
//   sourire nous tient à cœur : voici comment / en prendre soin grâce à
//   notre blog »: « nous est cher », chosen while the heading was 56 design
//   pixels and « tient à cœur » measured too wide for the column, can read
//   as "is expensive to us", a clinic weighed on price — and the first line
//   now fits the heading's reach, 1272.4 design pixels at a 1140 window (the
//   test runner's). French's lead lost « soigner », which leans towards
//   "treat": « comment entretenir dents et gencives chez vous ». Italian's
//   heading, whose «prendertene cura» echoed the lead's «prenderti cura»,
//   ends «ti mostriamo come / averne cura con il nostro blog». German's
//   heading ends „wie Sie es pflegen, in unserem Blog", where „wie Sie es
//   pflegen durch unser Blog" stood: the reviewer's fix, the owner's choice.
//   THE NO-BREAK SPACES (U+00A0, in the message files — the copy carries
//   them, never this band). A short word stays with its neighbour where a
//   break between them reads badly: the clitic or the pronoun with its verb
//   — Romanian's „ne pasă", „îți arătăm", „îți îngrijești" and „ne faci",
//   Italian's „ci sta" and „ti mostriamo", French's „nous tient" and „en
//   prendre", German's „Wir zeigen" and „es pflegen" — and the one-letter
//   word with what it introduces: Romanian's „e bine" and „o vizită",
//   Italian's „a cuore", „a casa" and „a trovare", French's „à cœur" and „à
//   notre". Every language also joins the LAST TWO WORDS of each block — the
//   headings' „blogul nostru", "our blog", „unserem Blog", « notre blog »,
//   «nostro blog», the leads' „o vizită.", "visit us.", „sinnvoll ist.",
//   « nous voir. », «a trovare.» — so neither can end on a single word at
//   any width, measured or not (the owner's "no one-word last line
//   anywhere"; the Romanian lead, left to measurement until 2026-10-15,
//   ended on a lone „vizită." from 960 to 1136px once its middle clause had
//   gone). No line break ever stands beside one: a no-break space never
//   collapses, so it would hang at the end of a line or open the next
//   (PostList.scale.test.tsx holds the copy to it).
//   French joins its colons to the word before them with U+202F, the narrow
//   no-break space French typesetting puts there (a plain U+00A0 until the
//   copy review of 2026-10-14): after a plain space Chromium broke before the
//   colon (measured: „…tient à cœur | : voici" at 636–684px windows). A joined
//   unit stays SHORT: a French candidate joined „comment l'entretenir", wider
//   than a 320 phone's column, and the belt below then cut the word itself
//   („l'entreteni | r", measured).
//   THE <h1>: ui/Heading's `hero` step (§15.24's one h1 step) worn through
//   `asChild` by a real <h1>, the page's one (§9), 65.04 design pixels
//   inside the scale, the doctor page's name's size (THE BAND SCALE) —
//   `hyphens-none`, so a word of the title never splits at a syllable
//   (DoctorIntro's name, the numbers band's title); its belt `wrap-anywhere`,
//   which breaks only a word too long for a line by itself (DoctorStats'
//   TITLE paragraph) — and capped at the 6xl container step, 1152px, off the
//   scale; inside it the heading's reach takes the cap's place (THE
//   HEADING'S REACH).
//   THE LEAD: ui/Text, muted — the screenshot's grey sentence — capped at 123
//   spacing steps, 492px, 492 design pixels in the scale, and `hyphens-none`
//   like the heading: the site's `hyphens: auto` (§15.14) lets Chromium's
//   Romanian dictionary on macOS break words where no syllable ends
//   („sfatur-ile", „med-icilor", „îng-rijești" — measured), and a word of
//   the hero is never split. The heading's belt too, `wrap-anywhere` (G2
//   a11y, 2026-10-14): `hyphens-none` alone would leave a word wider than the
//   column — at a very large text size — pushing the page sideways; at an
//   ordinary size it breaks nothing (every line in every language measured
//   the same with and without it), and Chromium's `pretty` mends the same
//   last lines under it.
//   THE CAPS ARE LIMITS NOW. Inside the scale the copy chooses the lines, and
//   each line must fit its box, or it would wrap into a line the stairway
//   does not have: the heading's box reaches at most the column plus 100
//   design pixels a side, 1306 (THE HEADING'S REACH — the 6xl cap, 1152,
//   would be the narrower, so inside the scale the reach takes its place),
//   the lead's its cap, 492. The tightest lines are measured at the regime's
//   narrowest design pixel, a 1140 window, where the smaller type's optical
//   size sets text widest: French's first heading line, 1272.4 of 1306, and
//   English's first lead line, 469.3 of 492 — Chromium's numbers, the test
//   runner's; WebKit and Firefox set every line within 0.23 % of them (each
//   line alone on a page at the runner's 1140 sizes, in all three engines,
//   measured again on 2026-10-15 for the reviewed copy; German's first
//   heading line the widest gap, 2.8 design pixels, and French's the widest
//   line in any engine, 1273.2 in Firefox). Off the scale the caps shape the
//   prose as they always did.
//   · EVERY LANGUAGE inside the scale, the test runner's (its Chromium, its
//     classic scrollbar), in design pixels at the owner's 1401 window — the
//     heading's two lines, then the lead's three: Romanian 1183.5 / 1016.8,
//     421.6 / 307.8 / 236.8; English 1144.4 / 955.3, 454.8 / 332.3 / 152.4;
//     German 1201.4 / 924.5, 421.3 / 356.6 / 249.3; French 1249.9 / 904.2,
//     440.7 / 356.9 / 185.0; Italian 1221.7 / 781.9, 451.0 / 383.8 / 199.1.
//     From 1140 to 2560, every 10px, no heading's second line passes 0.86 of
//     its first (Romanian's, 0.859), no lead's second line 0.86 of its first
//     (Italian's, 0.855) and no lead's third line 0.78 of its second
//     (Romanian's, 0.774); the narrowest step from the heading into the lead
//     is Italian's, 324.7 design pixels at 1290. PostList.scale.test.tsx
//     holds every language's shipped copy to the stairway and to the
//     heading's reach at 1140 / 1280 / 1401 / 1536 / 1920 / 2560.
//   · OFF THE SCALE, the Romanian hero in the test runner, behind its classic
//     scrollbar (PostList.scale.test.tsx's): the heading in five lines at
//     320, four at 390 and three from 768 to the regime's step (1024, 1100)
//     and under a coarse pointer at 1600 and 1920, where it grows to 72px
//     under its 1152 cap (1013.8, 1011.8 and 395.9px) — on one line its words
//     run 6.4 % past two such boxes at the tightest, so three is a margin, not
//     a coin toss. The lead's COUNT is the coin toss: four lines at 320 and
//     390 and three from 768, but at 1024, 1100 and on the coarse pointer
//     three only by a third of a pixel — its lines are 477.95, 430.14 and
//     58.45px there, and the last, „o vizită." (its two words joined), would
//     end the second line at 492.34px, a third of a pixel over the cap;
//     Linux's Chromium, which sets Source Serif 4 a pixel or two apart from
//     this Mac's, may well set two (G2 react and typescript, 2026-10-15).
//     What holds, and what the scale test holds, is that its lines are never
//     the copy's: at 768 `pretty` ends the first exactly at the colon, but the
//     second runs on past „acasă" to „e bine să" (where it ended „să ne"
//     until the copy review joined „ne faci"); from 1024 the first runs past
//     the colon to „cum să". English's lead takes two from 768 to the step
//     and under a coarse pointer, its whole intro on the first. No last line
//     of either block is one word at any window from 320 to 443 (every pixel,
//     no scrollbar) nor from 444 to 1136 (every other pixel, with no scrollbar
//     and from 600 with a classic one), in any language — Chromium's sweep in
//     the test runner, run again on the reviewed copy (2026-10-15);
//     PostList.scale.test.tsx samples eight phones and 768.
//
// ── THE LIST: a <ul role="list"> — the role is load-bearing in WebKit
// (eslint.config.mjs's list-role exception) — of one <li> per post, each
// holding ONE sections/PostCard — its title always an <h2>, under the
// page's <h1>. A GRID, spelled exactly as PostCard's stories frame it, its
// `sizes` derived from it: one column, two from the column's 36rem (`@xl`),
// three from 56rem (`@4xl`), 2rem apart. Every <li> stretches to its row
// (a grid item's default) and the card fills it — `h-full`, placement by the
// parent — so a row's cards are one height and their footer rows one line.
//   · MEASURED (the test runner's six named windows, behind its classic
//     scrollbar — PostList.scale.test.tsx's): one column at 320 and 390
//     (cards 273 and 336px wide), two at 768 (283.7), three from 1280 (316.9,
//     381.2 at 1536, 477.7 at 1920) — and two at a 1024 window on a mouse,
//     under the regime's step (386.1).
//   · THE GAP HOLDS THE JUMP: a card grows to 105 % under a resting pointer
//     (PostCard's THE CARD JUMP), 2.5 % of its height above and below and of
//     its width a side, so the 2rem must stay wider than that growth. The
//     tallest Romanian card measured in the test runner, 672px at 320, grows
//     16.8px into 32; at 1920 the tallest grows 19.6px into 44, and each side
//     of a card 11.9px into 44.
//   · THE FIRST CARD PRELOADS its picture (PostCard's `preload`: no lazy
//     loading, a high fetch priority, a preload link) and every other card
//     stays lazy — the band says which card is first; a card cannot know
//     where it sits. On a phone that picture is larger than the Romanian
//     heading's lines (330 × 220px against 336 × 160 at 390, the test
//     runner's column behind its classic scrollbar); on a laptop the
//     heading's two lines are the larger (1183.3 × 162.6px against 341.3 ×
//     227.5 at 1401), and the picture, the first of the row of three, is
//     still asked for first.
//   · EVERY CARD PROP BY NAME, AND NOTHING ELSE: PostCard spreads every prop
//     it does not know onto its <article>, so the band hands it the content's
//     six fields one by one and never spreads an item (G2 typescript,
//     2026-10-14) — a field the page adds to an item (a `date`, the `slug`)
//     can never print as an attribute. The slug is the React key.
//
// ── THE PAGER, UNDER THE GRID'S CORNER: the owner's "below the last item's
// bottom right corner". sections/Pagination's row hugs its content and places
// nothing itself; the band puts it in a flex column with the grid and hands it
// `self-end` (§6.8 — placement), so its end edge IS the grid's end edge, 0px
// apart at every width measured, one 2rem gap under the last row — the grid's
// own gap, so the pager reads as part of the cards while the hero stands 2.4
// times that far off (three times from a 48rem column). The band ends 2rem
// under it (THE BAND), the same 32 (design) pixels at every width measured.
// ON EVERY PAGE THE SAME PLACE: the grid's END, not the last card's — a last
// page of four cards in three columns leaves its pager under the empty cell,
// so the arrows never move between pages (the planner's D10). The gap holds
// the jump there too (THE LIST). Its eight fields go to sections/Pagination
// BY NAME, as a card's do (THE LIST): Pagination spreads every native prop
// onto its <nav>, so a wider object's extra field never reaches the
// landmark. One page renders no pager at all
// (Pagination returns nothing), and a flex gap opens only between boxes that
// exist, so it leaves no space behind: the band then ends 2rem under the
// grid.
//
// ── THE EMPTY STATE IS THE HERO ALONE. An empty `posts` renders the <h1> and
// the lead and nothing else — no list and no pager: the pager stands under
// the grid's corner, and with no grid there is none (an empty blog has one
// page anyway — lib/blog's pageCount). It is a state the shipped site never
// reaches: tests/unit/blog-data.test.ts ("ships posts") and
// src/lib/blog/blog.test.ts both fail CI on an empty
// src/content/blog/posts.json. It is kept so that the band never crashes on
// an empty list — a story, a test, any caller that hands it none. Not `null`,
// the way the reviews and the staff bands answer an empty list: those are
// bands WITHIN a page, where a titled band over nothing is a promise with
// nothing behind it; this band IS the page, so `null` would leave a page whose
// tab title still names it without its one <h1> (§9) and with nothing between
// the header and the map. No "no articles yet" sentence is invented here: that
// is a word, and a finished `empty` prop from the page is the lever if one is
// ever wanted.

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
  /**
   * The page's <h1>, the hero's heading, finished text with ONE line break
   * where the stairway turns (e.g. „Pentru că ne pasă de zâmbetul tău, îți
   * arătăm" + `\n` + „cum să ai grijă de el prin blogul nostru"): the break
   * holds inside the band scale and is a space everywhere else (the header's
   * THE STAIRWAY). Measured in all five languages (THE CAPS); the copy carries
   * its own no-break spaces (THE NO-BREAK SPACES).
   */
  title: string;
  /**
   * The hero's paragraph under the heading, finished text with TWO line
   * breaks (e.g. „Aici găsești noutățile clinicii și sfaturile medicilor
   * noștri:" + `\n` + „cum să îți îngrijești dinții și gingiile acasă" + `\n`
   * + „și când e bine să ne faci o vizită."), measured like the title in all
   * five languages.
   */
  lead: string;
  /**
   * The posts this page shows, in order, every string finished (§8.1). Empty
   * renders the hero alone (the header's THE EMPTY STATE).
   */
  posts: readonly PostListItem[];
  /** The accessible name of every card's tag list, finished (e.g. „Categorii"). */
  tagsLabel: string;
  /** Every card's read-more label, finished (e.g. „Citește mai mult…"). */
  readMore: string;
  /**
   * The page navigation under the grid's corner — sections/Pagination's own
   * data, hrefs built by the page. One page (`total` 1) renders no pager.
   */
  pagination: PostListPagination;
};

/** THE RHYTHM BOX (the header's THE BAND and THE BAND SCALE): the band's one
 *  gap — 4.8rem from the lead to the cards (19.2 spacing steps, bracketed:
 *  Tailwind's bare steps are quarters), 6rem from a 48rem column — its room
 *  above the hero, 4 / 6 / 8rem on the column's steps, and under the pager,
 *  2rem at every step; then ui/Container's two band-scale strings — imported,
 *  never re-spelled. */
const RHYTHM = cx(
  'flex flex-col gap-[calc(var(--spacing)*19.2)] @3xl:gap-24 pt-16 @lg:pt-24 @3xl:pt-32 pb-8',
  bandColumnClasses,
  bandScaleClasses,
);

/** THE HERO (the header's paragraph): both boxes centred, 3rem apart, and
 *  the heading's lines centred with them — the centring that also places a
 *  heading wider than the column on its centre line (THE HEADING'S REACH). */
const HERO = 'flex flex-col items-center gap-12 text-center';

/** THE STAIRWAY (the header's paragraph): inside THE BAND SCALE alone, the
 *  copy's own line breaks hold — the pre-line white-space, behind the band
 *  scale's own chain — so the heading's two lines and the lead's three fall
 *  where the message files break them. One spelling, worn by both blocks. */
const STAIRWAY = 'scalable:@4xl:@min-[896px]:whitespace-pre-line';

/** THE HEADING'S REACH (the header's paragraph): inside THE BAND SCALE alone,
 *  the <h1> is as wide as its longest line, up to the column's full width
 *  plus 50 spacing steps — 100 design pixels a side, never more; the hero's
 *  centring passes both of the column's edges by the same amount. Behind the
 *  band scale's own chain, like the stairway beside it. */
const REACH =
  'scalable:@4xl:@min-[896px]:w-max scalable:@4xl:@min-[896px]:max-w-[calc(100%+var(--spacing)*50)]';

/** THE <h1> (the header's THE HERO): capped at the 6xl step (THE CAPS),
 *  never split at a syllable, a belt for a word too long for a line, the
 *  `pretty` wrap on a phone's or a tablet's column, the stairway's line
 *  breaks and the heading's reach inside the band scale — and, LAST, its
 *  size there, behind the band scale's own chain: sections/DoctorIntro's
 *  name's class byte for byte, 16.26 spacing steps, 65.04 design pixels
 *  (THE BAND SCALE — KEEP IN SYNC, held by tests/unit/design-scale.test.ts). */
const TITLE = cx(
  'max-w-6xl hyphens-none wrap-anywhere @max-3xl:text-pretty',
  STAIRWAY,
  REACH,
  'scalable:@4xl:@min-[896px]:text-[length:calc(var(--spacing)*16.26)]',
);

/** THE LEAD (the header's THE HERO): capped at 123 spacing steps, the limit
 *  every one of its lines fits (THE CAPS), never split at a syllable, a belt
 *  for a word too long for a line (the heading's own), centred ON THE
 *  ELEMENT (§15.15 b), the `pretty` wrap on a phone's or a tablet's column,
 *  and the stairway's line breaks inside the band scale. */
const LEAD = cx(
  'max-w-123 hyphens-none wrap-anywhere text-center @max-3xl:text-pretty',
  STAIRWAY,
);

/** The cards and the pager under them (the header's THE PAGER): one 2rem gap
 *  — the grid's own — and the pager placed at the end edge by the band. */
const GROUP = 'flex flex-col gap-8';

/** THE LIST (the header's paragraph): one column, two from 36rem, three from
 *  56rem, 2rem apart — spelled exactly as PostCard's stories frame it. */
const GRID = 'grid grid-cols-1 gap-8 @xl:grid-cols-2 @4xl:grid-cols-3';

export function PostList({
  title,
  lead,
  posts,
  tagsLabel,
  readMore,
  pagination,
}: PostListProps): ReactElement {
  return (
    <section>
      <Container>
        <div className={RHYTHM}>
          <header className={HERO}>
            <Heading size="hero" asChild>
              <h1 className={TITLE}>{title}</h1>
            </Heading>
            <Text tone="muted" className={LEAD}>
              {lead}
            </Text>
          </header>
          {posts.length > 0 ? (
            <div className={GROUP}>
              <ul role="list" className={GRID}>
                {/* Each card's six props BY NAME (THE LIST: nothing else of
                    an item reaches the card's <article>). */}
                {posts.map((post, index) => (
                  <li key={post.slug}>
                    <PostCard
                      title={post.title}
                      summary={post.summary}
                      author={post.author}
                      readingTime={post.readingTime}
                      image={post.image}
                      tags={post.tags}
                      tagsLabel={tagsLabel}
                      readMore={readMore}
                      preload={index === 0}
                      className="h-full"
                    />
                  </li>
                ))}
              </ul>
              {/* Under the grid's bottom-right corner (THE PAGER), its eight
                  fields by name; `self-end` is placement, the parent's
                  (§6.8). */}
              <Pagination
                label={pagination.label}
                current={pagination.current}
                total={pagination.total}
                status={pagination.status}
                previousLabel={pagination.previousLabel}
                nextLabel={pagination.nextLabel}
                previousHref={pagination.previousHref}
                nextHref={pagination.nextHref}
                className="self-end"
              />
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
