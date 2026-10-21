import {
  useId,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactElement,
} from 'react';
import { Card } from '@/components/ui/Card/Card';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
import { Heading } from '@/components/ui/Heading/Heading';
import { Image } from '@/components/ui/Image/Image';
import { PillButton } from '@/components/ui/PillButton/PillButton';
import { Text } from '@/components/ui/Text/Text';
import {
  TEXT_BUTTON_HOVER_AREA,
  TextButton,
} from '@/components/ui/TextButton/TextButton';
import { cx } from '@/lib/cx/cx';
import type { ImagePath } from '@/lib/image-path/image-path';

// sections/PostCard — ONE blog post as a card on the blog index, one of a
// grid of them, and in the Home page's carousel of the blog's articles: a
// photograph across the top, out to the frame, with the post's categories
// floating over its top-right corner; under it the title, the author, a
// summary and a last line — the reading time and a read-more.
// The owner, verbatim (2026-10-14, the blog list's second round — CLAUDE.md
// §15.39): "they will have this card border, style that i already have awit a
// border in the doctor cards from instance from the main page under
// "Specialiștii cu care ne mândrim" … then i need per card at top the image
// like here. then hovering aobve the image on the z axis the current items so
// buttons used for instance in the current cards for articles for "igienă",
// "sfaturi". they will hover in a line one next to eacother startign in the
// top right corner of the article expanding more to the left … the title as
// it is now top left oriented. then under it as the eyebrow the doctor that
// wrote the article, so the autor. then below it there is the text … and then
// below the description where there is a separate section as a single line.
// on the left writes how long it takes to read and on the right ther eis a
// read more button. that is just text with 3 dots at the end whhich when
// hovered gets underlined, so basivally the top bar button, but always lilla,
// the lilla from hover" — and, mid-lane: "the animation for "jump at you" on
// hover must remain". His reference was a screenshot of three white cards in
// a row, a landscape photograph flush across the top of each, one lifted on
// hover. Until that day the card was the infiniswiss.com row of 2026-10-11 —
// a square thumbnail beside the words, the day and the author on one line.
//
// ── TIER: THE SHARED-COMPOSITION SUB-KIND (§4), sections/ReviewCard's row.
// It composes seven atoms — ui/Card, ui/Image, ui/Heading, ui/Eyebrow,
// ui/PillButton, ui/Text, ui/TextButton — binds no site data and calls no
// t(): every string arrives FINISHED (§8.1), the reading time's words
// included (`readingTime`, the page's own ICU sentence) and the names of the
// tag list and the read-more (`tagsLabel`, `readMore`). Two consumers, each
// handed its cards by its page, which maps the posts to PostCardContent: the
// blog index (sections/PostList) and, since 2026-10-17, the Home band of the
// blog's articles (sections/BlogCarousel), which draws it as a 65 % copy of
// the index's own (THE MINIATURE), heads it with its own <h2> (THE TITLE'S
// LEVEL) and names its own picture hint (THE `sizes`, OVERRIDDEN); reuse never
// promotes a composite (§4).
//
// ── THE FRAME: ui/Card `tone="framed" corners="soft"` — exactly what
// sections/PersonnelCard asks for its doctor cards, the owner's "same border
// and corners": the 3px `--card-tint` frame on white and the old site's 1rem
// corner (§15.29). No glow — he named the border. The Card's className is
// placement alone (§6.8): `relative`, the containing block of TWO absolute
// boxes — the chips' list (THE TAGS) and the link's layer over the card (THE
// LINK) — and `h-full`, so the card fills an article its list stretches.
//
// ── THE ROOT IS THE SECTION'S OWN <article>, AND IT JUMPS. The owner's "just
// react on hover like a button" (2026-10-11), kept on his word of 2026-10-14
// above, is the house's button jump — ui/Button's `motion` axis, its THE JUMP
// paragraph: the box grows to 105 % on hover over its own 200ms clock, and
// holds still under reduced motion. CARD_JUMP below is that cell's SCALE
// HALF, spelled for an element that is not a button: no colour list to share
// a clock with and no press state — there is nothing to press. It rides the
// <article> and NOT ui/Card, for two reasons: a Card's className is placement
// only (§6.8, its header's className paragraph), and the card paints its
// frame on its own `--fade` transition — on the element inside this one, so
// the two `transition` declarations never meet on one element and neither
// can stretch the other. KEEP IN SYNC with ui/Button's `motionClasses` jump
// cell — the 200ms, the curve, the 105 % and the reduced-motion reset;
// tests/unit/jump-census.test.ts holds this constant, and reads it as string
// literals alone. So the article's OTHER class — ui/TextButton's
// TEXT_BUTTON_HOVER_AREA, which makes the whole card the read-more's hover
// area (THE FOOTER ROW) — rides BESIDE the constant in the class list, never
// inside it: the jump stays byte for byte what it was.
// THE CURVE IS THE CSS KEYWORD, spelled `ease-[ease-out]`: the jump cell's
// timing list carries the keyword, cubic-bezier(0, 0, 0.58, 1), while
// Tailwind's own utility of that name is its theme's curve, cubic-bezier(0, 0,
// 0.2, 1) — the arbitrary value is what makes "the same jump" true to the
// curve as well as to the clock. `hover:` answers only `(hover: hover)`
// devices (Tailwind v4), so a tap on a phone never leaves a card grown, and
// under `prefers-reduced-motion` the card never moves (§9). No shadow grows
// with it — the old pop's other half, which the jump census refuses
// everywhere.
// THE PROMISE, HALF KEPT — the owner, verbatim (2026-10-15): "on click of card
// anywhere it should take you to article. but for now it should be a dummy
// article and all should point to same article". From 2026-10-11 to that day
// the jump was a FALSE AFFORDANCE, recorded and the owner's own ("the pages
// should not be clickable yet. so just react on hover like a button"): a card
// that answered a hover and opened nothing, inert in every other way. Now the
// card is ONE link — the read-more's, whose layer lies over the whole card
// (THE FOOTER ROW's THE LINK) — so a press anywhere on it opens the article
// the page names, and the jump and the read-more's underline promise exactly
// that, but for a small spot in each corner (THE LINK's WHAT IT COSTS).
// WHICH article is the page's to say (`href`): for now every card opens
// the blog's one article, the owner's "dummy" (lib/blog-article's THE
// STAND-IN) — so the promise is half kept: each card's link is NAMED for its
// own post, and for 11 of the 12 it opens another post's article, on the
// list's pages and in Home's articles band alike — an SC 2.4.4 mismatch until
// every post has its article (ui/TextButton's THE PROMISE, HALF KEPT;
// BACKLOG.md entry 7). Nothing else in the card is interactive: no <button>, no
// tabindex, no role but the tag list's (the props refuse a caller's
// `tabIndex` and `role` — THE NAME), and the chips are labels with no hover of
// their own (THE TAGS).
//
// ── THE NAME. The <article> is named by its title through
// `aria-labelledby`, so an article list reads „<title>, article" (the
// ReviewCard and PersonnelCard pairing). The id comes from React's useId():
// server-safe and hydration-stable (PersonnelCard D4), so a page of cards
// can never collide, and the caller hands no id in — nor for the read-more's
// label, which the link's own name reads by a second one (THE LINK). THE
// SPREAD RIDES FIRST,
// then the pairing and the className (PersonnelCard D10's belt): the props
// Omit `aria-label` and `aria-labelledby`, but TypeScript exempts a
// hyphenated JSX attribute from its excess-property check, so a caller's
// `aria-labelledby="…"` compiles — and then lands BEFORE this one and loses.
// A caller's `aria-label="…"` compiles the same way, and nothing of the
// card's own overwrote it, so it LANDED: a second name in the markup beside
// the title's (`aria-labelledby` wins the name computation, but the stray
// attribute stayed in the DOM). The card therefore resets it to `undefined`
// after the spread (G2 typescript, 2026-10-14 — sections/TeamRoster's belt).
// The props refuse three more native attributes: `role` — the element IS an
// article, the one role its list and its name rely on — `tabIndex`, because
// the card's ONE tab stop is its link (THE LINK) and a focusable article would
// be a second stop that opens nothing, and `dangerouslySetInnerHTML`, because
// its content arrives as named props. None is hyphenated, so the type stops a
// caller who writes one; `role` and `tabIndex` are ALSO reset after the
// spread, as `aria-label` is, because a spread of a wider object could still
// carry either: a stray role would unmake the article itself (the tier-2
// review, 2026-10-14), a stray tabIndex make it a second tab stop that opens
// nothing (the phase-3 review, 2026-10-20).
// THE TITLE'S LEVEL — the page's outline decides it, `headingLevel`, 2 by
// default. The blog index puts its cards straight under its <h1>
// (sections/PostList), so their titles are <h2>s; the Home band of the blog's
// articles (sections/BlogCarousel, 2026-10-17) heads its cards with its own
// <h2>, so it passes 3. The prop came back with that band: a first one,
// offering <h3> titles to a page that grouped the cards under a band's <h2>,
// left as dead API while no page did (the house's D37 rule, §15.23 round 2g;
// the owner's "no dead code"; the tier-2 review, 2026-10-14), on the note
// that a page nesting the cards a level deeper would bring it back. The
// ELEMENT follows the level and nothing else does — §15.24's rule, the level
// is the outline's, never the look's (sections/PersonnelCard's NAME_STEP
// precedent): an <h3> wears the <h2>'s classes byte for byte. A lookup
// (HEADING), so a widened union fails to compile until it names its tag. A
// level that slips past the type throws a RangeError that names it
// (`isHeadingLevel`, `quoted`; the round-3 review, 2026-10-21): 4 or null
// would find no tag and leave React its generic "Element type is invalid",
// and the string '3' would find the key '3' — an object's keys are strings —
// and render an <h3> unasked.
// The title wears ui/Heading's `band` — §15.24's h2 step — answering to
// ui/Card's own `@container`, so it reads the CARD step: 30px on a card under
// 28rem of content, which in the page's grid is every card but the one-column
// band just under two columns (36px there, a 525px content box at a 719px
// window) — and 30 design pixels in the band scale (27.4px at 1280, 32.9 at
// 1536, MEASURED). A miniature draws that very step at its share — 19.5px
// in the theme's pixel at 0.65 — never a smaller one (THE MINIATURE; THE
// NARROW STEPS, REMOVED, below).
// THE TITLE NEVER SPLITS A WORD — the owner, 2026-10-15. The site's
// `hyphens: auto` (§15.14) broke card titles at a syllable: „Zahnbürs-te" on
// a 390 phone, „pe-riuța" in the narrowest two-column card, „copilu-lui" on a
// laptop. This card's record offered the lever — one class, as the author's
// line under the title already wears it (THE AUTHOR), and the doctors' names
// and the numbers band's title elsewhere (DoctorProfile's „Despre {name}",
// DoctorStats' TITLE paragraph) — and the owner's answer was "as you say".
// So the title's own element wears `hyphens-none`, through the slot's
// className merge — a wrapping rule on the section's own heading, never a
// size (§6.8) — and a title breaks only where its words do: at a space, or
// after a hyphen the words themselves carry, which `hyphens: none` leaves
// alone (MEASURED, „Why the six- / monthly check- / up matters" on the
// 222px line) — never at a syllable, in any language, at any width. The
// summary keeps the site's rule: prose may still break a long word.
// IT IS SAFE BECAUSE EVERY WORD FITS. PostCard.titles.test.tsx measures every
// title word the blog ships, in all five languages, against the narrowest
// title line a card draws at its own size — 222px, the two-column card at
// its step; the widest, German „Zahnaufhellung:", is 217.1px — and lays every
// title out on that line and on a 390 phone's (301px, 286 behind a classic
// scrollbar), finding no word on two lines. The Home band's miniature — the
// share of the list's three-across card, a 192.6px line at 0.65 in the
// theme's pixel — holds them with room to spare: PostCard.miniature.test.tsx
// lays every title out on one, at four pixels, and finds none on two lines.
// THE MARGIN IS THE MAC'S, RECORDED (the review of 2026-10-15): 217.1 of 222
// is about 2 % under the line, measured in Chromium on macOS — and CI
// measures on Linux, which sets Source Serif about 1 % wider (the review's
// estimate, not measured here): ≈219.3px, still inside the line by that
// model. So a title word a little wider than today's widest could pass on the
// Mac and fail on CI; the measured test is the gate either way, and its red
// names the word and its width.
// THE NARROW STEPS, REMOVED (2026-10-17, the evening of the day they came).
// That morning the Home band showed these cards in a carousel as wide as the
// screen, narrower than the blog list ever draws them (182.6 to 222.6px on a
// phone), and the title took two smaller steps there — container rules on
// the card's own width, `name`'s 24px under the list's narrowest line, 14rem
// less 2px, and `title`'s 20px under 11.5 of the root's ems — ridden on the
// title's className, a recorded departure from §6.8. That evening the owner
// shrank the band into THE MINIATURE ("Miniature (all 65%)"), and the steps
// left the card: dead for the list — 14rem less 2px IS the list's narrowest
// line at any root, so no card of the list ever matched them — and wrong for
// the miniature, whose container is its slot's CSS width, the share of the
// design: there they WOULD match (a 192.6px line at 0.65, under 222) and set
// the title at 24 or 20 of the design's pixels where the list's card has 30.
// MEASURED before they left (Chromium, the real face, the card as it stood
// and the card without them side by side): at the list's 222, 238 and
// 297.33px title lines, every title in the five languages kept its size, its
// line height, its lines and its line — 180 readings of 180; and under 222px,
// the control, all 180 readings differed, so the steps had been live where
// they were meant to be. Their records — the narrow cards' words, the four
// German words the narrowest of them cut — left with them; the title has one
// size, `band`, at any share.
// THE PRICE, MEASURED (Chromium on macOS, which hyphenates all five
// languages; the real face): a word the dictionary used to split now moves
// whole to the next line. Of the 60 titles on those three lines, 55 of 180
// readings change their breaks and 15 take a line more — the most, Italian
// „Lo sbiancamento dei denti: domande frequenti" on the 222px line, three
// lines to five; German „Wie Sie Ihre Zahnbürste auswählen" keeps two lines
// on a phone („Wie Sie Ihre / Zahnbürste auswählen") and takes three behind
// a classic scrollbar. On a laptop, in THE BAND SCALE behind that scrollbar,
// 16, 17 and 14 of the 60 change at 1280, 1536 and 1920, and 3, 3 and 2 take
// a line more. The everyday post's title keeps its two lines at every width
// THE LAYOUT measures below, so those numbers stand.
// THE TITLE'S BELT STAYS (G2 a11y, 2026-10-14, SC 1.4.12): `wrap-anywhere`
// (overflow-wrap: anywhere) beside the rule, the pair the numbers band's
// title wears and the belt PersonnelCard D20 puts on a doctor's name. It is
// now the ONLY break inside a word, and it breaks only a word too wide for
// its line on its own: a reader's text spacing — 0.12em a letter — or a very
// large default font.
// MEASURED (Chromium, the real face, a 320 window behind a classic 15px
// scrollbar — a 223px line): under SC 1.4.12's spacing with hyphenation off,
// „Parodontopatia" measures 251.5px and, without the belt, runs 28.5px past
// the card's content edge — 3.5px past its frame; with the belt it breaks
// inside. `anywhere` breaks only a word that cannot fit its line by itself —
// spaces and written hyphens come first — so at ordinary spacing it changes
// nothing a measurement could find: no shipped title leans on it.
// WHERE THE BELT BREAKS, RECORDED (the review of 2026-10-15, a11y and react).
// With `hyphens: none` the belt is the ONLY thing that can break a word, and
// it breaks at any letter, with no hyphen drawn. That happens on the narrowest
// two-column card, the 222px line, under SC 1.4.12's 0.12em a letter — 3.6px
// at the title's 30px; MEASURED (Chromium, the real face, the spacing set on
// the title): German „Zahnaufhellung:" 217.1 → 271.1px, French
// „interdentaires" 185.2 → 235.6, Italian „sbiancamento" 184.5 → 227.6,
// Romanian „Sensibilitatea" 176.1 → 226.5 — and with Firefox's "Zoom Text
// Only", Android's text enlargement and a forced wide reading font such as
// OpenDyslexic (not measured here). No content is lost and nothing scrolls
// sideways, so it is no WCAG failure (SC 1.4.12 asks only that no content or
// function be lost) — a word broken where a reader would not expect it,
// nothing more.
// THE LEVER, NAMED, NOT TAKEN: manual hyphenation in place of none. Today the
// two are the same — posts.json carries no soft hyphen (U+00AD) — but under
// manual hyphenation the copy could mark where a long word may break, and the
// engine would break it there, with a hyphen drawn, before the belt broke it
// bare. It will matter for German: common dental words are wider than the
// 222px line at the title's 30px — MEASURED the same way, at ordinary
// spacing, „Zahnfleischbluten" 237.2px, „Wurzelbehandlung" 250.5,
// „Implantatbehandlung" 285.9 — so a future title with one of them fails
// PostCard.titles.test.tsx until its copy marks a soft hyphen and the test's
// unit cutting (PostCard.fixtures.ts's `unitsOf`, THE CUT RULE) learns to cut
// after one.
//
// ── THE LAYOUT: ONE column at every width — the picture, then the words —
// inside ui/Card's own column, so a card is the screenshot's shape on a phone
// and in a grid row alike; the PAGE's grid decides how many stand side by
// side (sections/PostList: one, two from its column's 36rem, three from
// 56rem). The words box grows to the card's floor (`flex-1`) and THE FOOTER
// ROW rides that floor (`mt-auto`), so in a list that stretches its items —
// the page passes `h-full` — every card of a row is one height and their
// footer rows stand on one line. The words stand as far under the picture as
// the frame's padding: ui/Card's own 12px gap plus the words' top padding,
// three spacing steps less 2px — six steps less 2px together, the framed
// row's padding — so the words sit in ONE even inset, under the picture as
// beside it, at the theme's step and in the band scale alike (KEEP-IN-SYNC
// with the framed row and the card's `gap-3`; PostCard.test.tsx measures the
// two equal).
// MEASURED in a frame like the page's (ui/Container, the band scale, the
// grid's tracks and 2rem gaps; Chromium, the real faces, behind the classic
// 15px scrollbar the visual net shoots with), with the everyday post: the card
// 273 × 592 at 320, 336 × 562 at 390, 283.7 × 619.1 at 768 (two columns),
// 316.9 × 541.2 at 1280 and 381.2 × 651.5 at 1536 (three, in the band scale
// at 0.912 and 1.097 design pixels to the CSS pixel); on a phone, with no
// scrollbar, 288 × 602 at 320 and 351 × 572 at 390. The title takes two
// lines in each, three for a longer title at 320; every card of a measured
// row has its row's height, and every footer row of a row the same top.
//
// ── THE MINIATURE (2026-10-17). The owner, verbatim, of the Home band of the
// blog's articles (sections/BlogCarousel): "the carrousell from the main page
// feels way too large. make it the width of the: ÎN CIFRE … section … i wnat
// the article cards to mentain same ratios as in blog, but while having 65%
// of the height. also the cards seem to vary in height. make them a fixed
// height so that they mentaiin same shape … these above comments are for the
// home page component, on blog they are already reactive as is." Asked to
// choose, he picked "Miniature (all 65%)": the blog list's card itself, drawn
// at 65 % — photo, title, author, summary, reading time, read-more, the
// chips — every card one shape. So `miniature`, a share m in (0, 1] — any
// other number a RangeError that names it, at render, so a page that asks for
// 0 or 1.5 fails its build — draws the card as a copy of itself at m: every
// theme length (spacing, type, radius, container: the lengths globals.css's
// `design-scale` remaps) at m × the design pixel the card INHERITS where it
// stands — the theme's, a quarter of the spacing step, or a band's inside
// THE BAND SCALE. In a slot m × a full card's width it lays out as that full
// card does: the Home band's slot is 0.65 of the list's three-across card at
// the owner's 1401 window, (1106 − 64) / 3 = 347.333 design px, so 225.767.
// LAYOUT-NATIVE, never a transform: a miniature's height is real layout, so a
// longer translation or a reader's SC 1.4.12 spacing makes it taller instead
// of spilling out of a scaled box. Unset, the card is the list's byte for
// byte — PostCard.test.tsx holds it from both sides: without a share, a
// caller's own style and `miniature={undefined}` included, the markup carries
// none of the miniature's parts; and a miniature's markup with its parts taken
// out IS the list card's.
// HOW m REACHES THE CSS — ONE NUMBER in the DOM, `--miniature`, inline on the
// <article> (merged over the caller's own style, which can therefore never
// unset it; absent without the prop), and two static rules and one inline
// declaration that carry it down:
//   · THE CAPTURE, on the <article> (MINIATURE_CAPTURE): `--miniature-px`,
//     the spacing step the card inherits over four, times the share.
//     Declared HERE and read one element down because a `var()` in a custom
//     property resolves on the element that declares it: on the wrapper,
//     which redraws the step, `--spacing` would be its own — and a design
//     pixel declared from the step on the element that declares the step
//     from the pixel is a cycle. Never `--scale-px` itself, which outside a band is
//     1px at any root, never the theme's pixel (sections/PostCover's THE
//     TAGS spells the same capture, `--spacing` over four, for its cap).
//   · THE REMAP, on THE MINIATURE'S WRAPPER (MINIATURE_SCALE): ONE plain
//     <div> of the card's own between the <article> and ui/Card, a
//     miniature's alone, wearing the registered `--scale-px` set to the
//     captured pixel, `design-scale` beside it — the band scale's own
//     utility — and `h-full`, so the page's stretch still reaches the card.
//     Every theme length inside — the card's padding, its corner, every gap,
//     every type step, the read-more's 44px box and its underline — is then
//     the share of the full card's, inherited from one element out, the way
//     THE BAND SCALE reaches every card inside a band. ui/Card's className
//     is its placement, `relative h-full`, in both modes. THE DEPARTURE,
//     UNMADE (the planner's review, the same day): the remap rode ui/Card's
//     own className first, which redrew the atom's padding from outside —
//     the restyling §6.8 keeps a className from — and it moved to this
//     wrapper, sections/PersonnelCard's THE INSET precedent: what the card
//     does to an atom's insides it does on an element of its own. Nothing
//     that leans on ui/Card moved with it: the chips' `100cqw` and THE TAGS'
//     placement still answer to the Card (the query container, `relative`),
//     the link's layer to the Card's padding box, the jump to the <article>
//     — PostCard.miniature.test.tsx measures each. No gate: a calc of the
//     inherited step, which every engine computes, registered or not — no
//     `cqw` is in it.
//   · THE CHIPS (MINIATURE_CHIPS): CHIP_SCALE's floor, 0.75rem / 18, is
//     absolute, so a miniature's chips would keep the full card's 12px labels
//     — half again as large, against everything round them. A miniature's
//     tag list carries CHIP_SCALE's formula with the floor × the share,
//     INLINE, where it outranks the list's class: the class stays CHIP_SCALE
//     byte for byte, the cover's KEEP-IN-SYNC (tests/unit/blog-tags-sync.test.ts
//     reads the list's className), and PostCard.test.tsx reads both formulas
//     out of this file and holds the one to the other, its floor × the share.
//     The `cqw` half needs nothing: the card is already the share as wide. An
//     engine without container units never uses the inline value (the
//     list's remap is behind THE GUARD), so its chips inherit the card's own
//     pixel — the share of its full card's chips, which are the theme's there.
// WHAT STAYS CSS PX, ON PURPOSE: the frame's 3px border (ui/Card's THE SUM
// RULE — a border floors to whole device pixels, and 3 × 0.65 = 1.95 would
// draw 1px), the link layer's 3px inset (KEEP-IN-SYNC with that frame), the
// focus ring's 2px and its 2px offset (the ring §9 measured), the chips' 2px
// edge and the aura. They leave the only residuals: border + padding is six
// steps and 1px a side, so a miniature's content box is 2 × (1 − m)px
// narrower than the share of its full card's — 0.70px at 0.65 (192.566
// against 193.263 in the theme's pixel, 0.36 %); its picture spans the card
// less the two 3px frames — a width the share of the full card's less 6 × (1
// − m)px, 2.10px — so at 3:2 its HEIGHT is the share of the full card's less
// 4 × (1 − m)px, 1.40px (146.5 against 227.547, a ratio of 0.6438, in the
// theme's pixel; 205.016 against 317.562, 0.6456, at the band scale's cap);
// and its natural height is the share of its full card's less 2 × (1 − m)px,
// 0.70px, wherever their lines agree.
// MEASURED (PostCard.miniature.test.tsx: Chromium, the real faces, every
// post the blog ships in the five languages, each full card and its
// miniature side by side in one box — the theme's pixel, a band's 1px, the
// band scale's step, 0.810px, and its cap, 1.389px): the title, the author,
// the summary, the reading time and the read-more at exactly 0.65 of their
// full card's; the chips' labels at 0.65 where their floor binds (the theme's
// pixel, 1px, the step) and 0.648 at the cap, where their `cqw` half binds on
// a content box 0.36 % short; the frame, the layer's inset and the ring in
// CSS px; the picture and the height to the residuals above.
// THE SMALLEST TEXT, for the owner: at 0.65 in the theme's pixel the title
// sets 19.5px, the author 9.1, the summary 10.4, the reading time 10.4, the
// read-more 11.7 and a chip's label 7.8 — and that is what Home's band draws on
// every phone and tablet and on laptops up to the 1401 window, because it
// floors its pixel (sections/BlogCarousel's CAROUSEL_FLOOR); at the cap 27.1,
// 12.6, 14.4, 14.4, 16.2 and 9.4. (Unfloored, the band scale's step — a 1140
// window — would draw 15.8, 7.4, 8.4, 8.4, 9.5 and 7.8: the mechanism, which
// no page ships.) No criterion of WCAG 2.2 AA sets a smallest size, and zoom
// enlarges each one on a phone (pinch) and on a laptop up to the owner's
// window, where THE FLOOR (sections/BlogCarousel's CAROUSEL_FLOOR) holds the
// theme's pixel and the CAROUSEL grows with a zoom as rem does — not the
// band's opener, which keeps the band scale's unfloored pixel (at a 1280
// window and 110 % its <h2> stays 32.8 device px) — but NOT on a desktop
// past the 1401 reference. On a 1920 screen 110 and 125 % leave the
// five texts — all but the tags — as they are, 150 % gives ×1.09 and 200 %
// ×1.45; the tags, in a pixel of their own (THE CHIPS FOLLOW THEIR CARD), move
// otherwise: their labels 9.31 / 9.30 / 9.75 / 11.7 / 15.6px at 100 / 110 /
// 125 / 150 / 200 %, ×1.00, ×1.05, ×1.26 and ×1.68 of the first — the band
// scale's owner-accepted trade (CLAUDE.md §15.32; computed by the phase-3
// accessibility review and its re-review, 2026-10-20). 7.8 to 10.4px is far
// under anything this site sets for an older reader elsewhere: the share is
// the owner's lever, one number at the call site (BACKLOG.md entry 2).
// THE OPTICAL SIZE MOVES A LINE, RECORDED. Source Serif 4's optical-size
// axis follows each text's own size (`font-optical-sizing: auto`) and draws
// small text wider per em — MEASURED, the summary's words 5.7 % wider at
// 10.4px than at 16, the title's 2.9 % at 19.5 than at 30, the read-more's
// 6.4 % at 11.7 than at 18 — so a miniature's line holds a little less than
// its full card's. Of the 480 title and summary readings (12 posts × 5
// languages × 4 pixels) 99 take ONE more line in the miniature on this Mac —
// never fewer, never two: 24, 24, 24 and 27 of 120 in the theme's pixel, at
// 1px, the step and the cap; in Romanian and German 2 + 4, 2 + 4, 3 + 7 and
// 8 + 2. Every author line, chip row and footer row is the same in all 240
// pairs. CI's Linux advances every glyph by whole pixels (CLAUDE.md §15.39's
// Pagination lesson), so the test holds what holds there too: one line either
// way at most, the readings annotated. In the Home band's fixed-height cards a
// summary may therefore take a line its list card does not — the card's
// shape is the band's, the text inside it the typeface's.
// THE LEVER, MEASURED, NOT TAKEN: the optical size pinned to the full card's
// — each text's size over the share, set per element — left 3 of the 240
// readings it was tried on (the theme's pixel and the cap), and with the
// 0.70px residual given back as well, none. Not taken: the optical size is
// what keeps 8 to 10px text legible, and a CSS spelling would have to name
// each text's size — an `em` in a font property resolves against the
// PARENT's size (MEASURED: the summary read 'opsz' 18, the card's own, where
// 16 was due).
// THE STEPS THE MINIATURE CANNOT REDRAW: a container query compiles to a
// fixed rem (the title's `@md` is 28rem, never a variable), so it reads the
// slot's CSS width. A miniature is its full card's copy wherever no container
// step lies between the two — true of the list's three-across card, whose
// 297.333-design-px line stays under 28rem up to the band scale's cap (413px)
// — and the reason the title's narrow steps had to go (THE NARROW STEPS,
// REMOVED, above).
//
// ── THE PICTURE, OUT TO THE FRAME. A 3:2 cell — the clinic photographs' own
// ratio, 1920 × 1280 — across the top of the card to the frame's INNER edge
// on three sides: negative margins equal to ui/Card's framed padding,
// `calc(var(--spacing)*6 - 2px)` (22px at the theme's step), spelled byte
// for byte as the atom's `toneClasses.framed` row spells it — KEEP-IN-SYNC:
// PostCard.test.tsx reads that row out of Card.tsx and refuses any other
// bleed — so the bleed is exact at any step, inside the band scale included.
// ui/Card itself is untouched: its D5 refuses per-call padding, and a picture
// that reaches through the padding is this section's own geometry. The cell's
// two top corners are the frame's INNER curve — an outer radius less the
// border is the padding edge's radius (CSS Backgrounds 3) — so
// `calc(var(--radius-soft) - 3px)`: 13px at the theme's step and 16 design
// pixels less 3px in the scale, which redraws `--radius-soft` and never the
// 3px frame. `overflow-clip` cuts the photograph to them, with the house's
// Safari ≤ 15 twin (`overflow-hidden` behind `@supports not (overflow:
// clip)`, sections/Hero's spelling): an engine without `clip` would leave
// the photograph square over the frame's curve. MEASURED at every width
// above: 0px between the picture and the frame's inner edge on top and on
// both sides, the corner 13px (11.6 / 14.6px in the scale at 1280 / 1536),
// and an 8× shot of the corner shows the photograph's curve on the frame's.
// The photograph is ui/Image `plain` + `fill` + `object-cover` — the cell owns
// its corners (ui/Image's rule: a consumer whose geometry differs takes
// `plain`; `framed` would round all four at 12px) — and the cell is `relative`
// because `fill` places the picture against the nearest positioned ancestor.
// Lazy below the fold, unless the page says the card is first (`preload`,
// the PersonnelCard D18 pair: no `loading="lazy"`, a high fetch priority, a
// preload link with the same `sizes`) — the page's likely LCP element.
// THE `sizes`, DERIVED (PICTURE_SIZES): the picture is the card less its 3px
// frame a side, the card one track of the page's grid in ui/Container's
// column — 90 % of a phone's window up to 480px, 80 % from 600, a ramp
// between, less a 15px classic scrollbar where there is one — and, on a
// mouse or trackpad from a 56rem column, in THE BAND SCALE, whose column caps
// at 96rem. MEASURED share of the window:
//   · one column — the column less 6px: under 90vw on every phone, tablet
//     and narrow window (88.1 % at a 320 phone, 79.2 % at 719);
//   · two columns, from a 720px window (738.75 behind a scrollbar) — half
//     the column after the gap, less 6px: under 40vw (36.0 to 38.0 % from
//     720 to 1138);
//   · three columns, from 1120 (1138.75 behind a scrollbar) — in the scale a
//     third of the column after two 32-design-pixel gaps, less 6px: under
//     25vw (24.2 to 24.6 % from 1120 to 1939); unscaled on a touch screen
//     24.4 % at a 1180 tablet, 24.7 at 1366 and 25.0 at 1640;
//   · past the cap — a 96rem column, a 1920px window (1938.75 behind a
//     scrollbar) — the scaled picture holds at 476.4px (1940 and 2560) while
//     25vw grows on, so 30rem there, behind the scale's own `(pointer: fine)`
//     gate (PersonnelCard's CUTOUT_SIZES precedent).
// Each switch sits PAST its step with a scrollbar or without (46.25rem =
// 740px, 71.25rem = 1140, 121.25rem = 1940) — the first quarter-rem past it
// behind the scrollbar, which PostCard.test.tsx MEASURES in a frame held to
// sections/PostList's own GRID (read out of its source), so a grid that
// moves its steps fails there until this list follows — and no window is
// told a share smaller than its picture where the switch decides: the bands
// between cost a file a step larger (two columns told 90vw from 720 to 740
// without a scrollbar, three told 40vw from 1120 to 1140), never a wrong box
// — `sizes` chooses the file, CSS sizes the box. THE BOUNDS, measured and
// accepted: an unscaled picture outgrows 25vw past a 1640px touch screen
// (27.1 % at 2560, a file a step smaller), and an engine that cannot run the
// band scale (Safari before 16.4, Firefox before 128 — `sizes` cannot ask its
// `@supports` gate) draws a 687.7px picture at a 2560 window on a mouse while
// told 30rem. THE SPACE BEFORE EACH `vw` IS LOAD-BEARING (PersonnelCard's
// THE SPACE BEFORE `21vw`): next/image reads the smallest share, 25vw, and
// keeps the candidates from 640 × 0.25 = 160px up — the least this card asks
// for is 25vw of 1140px, 285px.
// THE `sizes`, OVERRIDDEN (2026-10-17): that derivation is the blog list's
// grid's. A page that draws the card at other widths names its own hint —
// `sizes`, optional, PICTURE_SIZES when it is left out (an explicit
// `undefined` included) — derived from its own geometry: the Home band
// stands its miniatures (THE MINIATURE) in slots of its own, which this list
// would mis-tell. The card passes the hint through
// verbatim, to the <img> and, on a first card, to its preload link; it checks
// nothing in it — `sizes` chooses a file, never a box — so the space before
// each `vw` is the page's to keep.
//
// ── THE AUTHOR: ui/Eyebrow — the mono, muted, uppercased micro-label — the
// owner's "as the eyebrow the doctor that wrote the article"; `hyphens-none`,
// because a name never splits at a syllable (PersonnelCard D4, ReviewCard's
// credential) — a long one wraps between its words. A LISTEN OWED: the line's
// capitals are ui/Eyebrow's CSS, and Chromium and WebKit hand assistive
// technology the text as painted (sections/PostHeader's A LISTEN OWED, the
// article's by-line), so a screen reader gets „DR. NICU ELENA ALINA" —
// French „DR NICU …", no full stop — where a voice may spell „DR" letter by
// letter; no test here can hear it (BACKLOG.md entry 2 lists the listen, with
// the touch double-tap case of WHAT IT COSTS). THE DATE LEFT THE CARD:
// the owner's card names none; the post keeps its day in the data, where it
// orders the list, and the article page will print it.
//
// ── THE TAGS, OVER THE PICTURE — LABELS, NOT BUTTONS. The owner, verbatim
// (2026-10-14, his second look at the preview): "the pills with "sfaturi",
// "urgente" shold always have statically, so nothing on hover, the on hold
// aspect. so it should be in this case here not dependent on hove ,s oit
// hsould always have the current hover aspect on it no matter what and houls
// not be dinamic, i do not want to give impression of a button." So each
// category is ui/PillButton's TAG, `kind="tag"`: the price strip's resting
// chip in the face a hover gives it — the lavender edge and label on its
// white ground — held still. It answers NOTHING: no `hover:` rule, so a
// pointer on a chip or anywhere on the card leaves its paint as it was
// (PostCard.test.tsx hovers both with a real pointer) — the card's jump
// scales it with the card, the card's hover draws the read-more's underline
// alone — and no pointer cursor of its own; a tag is never current. A press
// on a chip is a press on the card's link, whose layer lies over the whole
// card (THE LINK): the hand the pointer shows there is the link's, and the
// chip's paint stays as it was. A KIND of the
// atom's, never a className here: §6.8 keeps a caller's className to
// placement. `asChild` puts each tag on an <li> of a real list named by
// `tagsLabel`, so a screen reader hears „Categorii, list, 2 items";
// `role="list"` is load-bearing in WebKit (eslint.config.mjs's list-role
// exception). The list is ABSOLUTELY placed three steps in from the picture's
// top-right corner — `top-3 end-3` against the CARD, whose padding box the
// picture spans to the pixel, and `start-3` so a long list wraps inside the
// picture instead of running off it; three of the CHIPS' OWN steps (THE CHIPS
// FOLLOW THEIR CARD, below), so 0.75rem at the owner's window and less or more
// with the chips — and `flex-row-reverse` puts the FIRST tag at the far right
// and the next to its left (the owner's order). The card says `relative` for
// it: a query container no longer scopes positioning in current engines
// (ui/Card's THE CONTAINER MARK), and the words box between the two stays
// unpositioned on purpose. MEASURED at every width below: the list as far from
// the picture's top as from its right edge, the first tag's right edge on the
// list's.
// DOM ORDER IS NOT PAINT ORDER, deliberately: the list follows the author in
// the markup, so a screen reader's H key lands on the title and reads on —
// title, author, categories, summary — while the eye meets the chips on the
// photograph first. Each chip paints its own white face under the lavender
// label — `--accent` on the white `--surface`, MEASURED 5.06:1, past the
// 4.5:1 every size of it owes, the floor's 12px and a miniature's 7.8px
// included (THE CHIPS FOLLOW THEIR CARD, THE MINIATURE) — so no photograph
// ever stands behind the words; the lavender
// edge and the glow are decoration. No tags, no list (an empty named list
// would be announced as „list, 0 items").
// THE CHIPS FOLLOW THEIR CARD — the owner, verbatim (2026-10-14, on the
// preview): "the buttons with "igiena", "preventie" are not reactive enoug.
// they should adjust in size with screen size. on desktop they are too big.
// the perfiect ratio of photo - menu item category description (those being
// preventie, ortodontie etc) is at 723px x 1123 px". So the list draws in a
// DESIGN PIXEL OF ITS OWN (CHIP_SCALE): globals.css's registered `--scale-px`
// declared on the <ul> as the CARD's content width — `100cqw`, ui/Card being
// the list's nearest container — over 513.40625, beside globals.css's
// `design-scale`, which redraws every theme length in the list in that pixel:
// the inset and the gap between chips (three steps each) and, in each chip,
// ui/PillButton's 44px height, 20px padding and 18px label. The 2px edge and
// the glow stay — neither is a theme length (THE DESIGN SCALE's NOT
// remapped). 513.40625 is the content width MEASURED at the owner's window, a
// 723px Mac window behind the classic 15px scrollbar a mouse brings: one
// column, 563.40625px — 708px less two 10vw margins of 72.3px, each snapped to
// the engine's 1/64px layout unit — less the frame's 3px and the padding's
// 22px a side. There the chips are EXACTLY the atom's own: 44px tall, an 18px
// label, 12px from the picture's corner and from each other
// (PostCard.test.tsx pins it at that window). Everywhere else they keep that
// ratio to the CARD, wherever it stands — a phone's one column, a tablet's two
// or three across inside THE BAND SCALE, whose pixel the list's replaces: the
// band has already drawn the card the list measures. (With overlay scrollbars
// the same window holds two columns, and the chips there sit on the floor.)
// THE GUARD: both classes ride `supports-[width:1cqw]:`, so an engine that
// does not know container units never reads them. Safari 15 — every iPhone
// left on iOS 15 — is that engine: unguarded, the pixel would be invalid
// wherever it is used, the list's inset would fall to `auto` and drop the
// list onto the summary, and the chips would lose their height, padding and
// label size; guarded, it draws today's chips, the theme's 44px with an 18px
// label, 12px into the picture's corner. An engine with container units but
// without registered custom properties — Safari 16.0 to 16.3, Firefox 110 to
// 127 — computes the scaled result: there the pixel is pasted as text and
// evaluated where it is used, and every box that uses it, the list and each
// chip, has the card as its nearest container (MEASURED in Chromium with an
// unregistered copy of the declaration: the chip's height, padding and label
// and the list's inset and gap equal the registered ones to 0.0001px at four
// card widths).
// THE FLOOR, never under 0.75rem / 18: a 12px label on 29.3px chips at the
// default root — two-thirds of the atom — so no FULL card's label shrinks
// past reading (the floor is a full card's: a miniature's is this one × its
// share, a 7.8px label at 0.65 — THE MINIATURE's THE CHIPS, THE SMALLEST
// TEXT). It binds wherever the content box is under two-thirds of 513.40625,
// 342.3px, which is most cards: behind a classic scrollbar a window up to
// ≈453px (one column), ≈739 to ≈1039 (two) and ≈1139 to ≈1609 (three
// across, in the band scale); without one, every phone up to 430px and a 768
// tablet's two columns.
// MEASURED (Chromium, the real face, the 15px scrollbar unless named):
//   · the floor — 29.3px chips, a 12px label, 13.3px of padding, 8px of inset
//     and gap — at 320, 390, 768, 1280, 1401 and 1536, and on a phone with no
//     scrollbar at 320, 390 and 430;
//   · the owner's 723 — a pixel of 1px: the atom's own 44 / 18 / 12px;
//   · 1920 — 0.798px: 35.1px chips, a 14.4px label, a 9.6px inset; past the
//     band's cap, 0.806px (35.5 / 14.5 / 9.7px at 2560);
//   · without a scrollbar, a 440 iPhone Pro Max 0.674px and a 1024 iPad held
//     sideways 0.669px — both just over the floor.
// THE CEILING, measured with the real face: a chip never wraps (PillButton's
// `whitespace-nowrap`, right for a strip that scrolls sideways), and the
// list's line is the picture less two insets. The narrowest picture a card
// draws from a 320 window up is 266.1px, at ≈739 where two columns begin
// (267 at a 320 window behind the scrollbar, 282 on a 320 phone), on the
// floor: a 250px line. There a tag of the data's ceiling, 18 characters, is
// a 138.9px chip in Romanian („stomatologie copii") and 157.7 in German,
// which starts its tags with a capital as it writes its nouns
// („Wurzelbehandlungen", the widest such word measured); the German
// „Kieferorthopädie" — 16 characters, the widest tag the blog ships in any of
// its five languages — 131.5, ahead of the Italian „parodontologia" (120.8),
// the Romanian and French „parodontologie" and the German „Parodontologie"
// (120.6) and the English „prosthodontics" (119.7); and even the
// 23-character „stomatologie pediatrică" 169.6. Three 18-character tags take
// a line each and end 65.4px above the picture's floor (66.0 at 320); the
// three widest German tags take two — „Kieferorthopädie" alone, then
// „Parodontologie" and „Implantologie" — and end 102.8px above it. A
// miniature (THE MINIATURE) draws its chips at the share of its full card's
// on a line the share as wide — the chips' floor × the share — so its full
// card's ceiling is its own: every chip row the same in all 240 pairs
// PostCard.miniature.test.tsx measures. Both ceilings, a tag's length and a
// post's three tags, are the blog's data's to hold, never this card's
// (tests/unit/blog-data.test.ts).
// THE ZOOM — WCAG 2.2 SC 1.4.4, the F94 pattern: THE OWNER'S CALL, OPEN (the
// phase-3 accessibility re-review, 2026-10-20; BACKLOG.md entry 2, THE BLOG'S
// CATEGORY TAGS UNDER BROWSER ZOOM; sections/PostCover's THE ZOOM is the
// cover's). NOT THE BAND SCALE'S TRADE: this one lies where the scale does not
// draw — below its step, and past it wherever its gate stays shut. A chip's
// label is 18 × max(0.75rem / 18, content ÷ 513.41) — the content box the
// card less 50px, its 3px frame and 22px of padding a side, and a one-column
// card the column — so a page zoom, which narrows the window in CSS px by the
// very factor it enlarges them, shrinks the chips' pixel as it enlarges the
// page wherever the zoomed card's content box is over the floor's 342.3px:
// there the tags grow on screen by LESS than the zoom. So does the title in
// its 36px band, for a reason of its own — it crosses ui/Heading's `band`
// step (its 'band' paragraph, UNDER BROWSER ZOOM THE STEP CAN BE CROSSED;
// BACKLOG.md entry 2, THE BAND TITLES' STEP UNDER BROWSER ZOOM); every other
// word of the card grows with the zoom. COMPUTED (the re-review's arithmetic:
// Chromium's page zoom, a 16px root, a classic 15px scrollbar where one is
// named): at the owner's own 723 window an 18px label reads 17.8 / 17.9 /
// 19.6 / 24.0px at 110 / 125 / 150 / 200 % (×0.99, ×1.00, ×1.09, ×1.33),
// doubling only at 300 %. The cards that miss ×2 at 200 % are of two kinds.
// ONE-column cards with a content box over 342.3px — about 453–738px windows
// behind a scrollbar, 436–719 without one: at 200 % half a 1280 laptop (a 640
// window) gives ×1.53, half a 1366 ×1.42, half a 1440 ×1.34, a 600px touch
// tablet ×1.59 and an iPhone SE held sideways (667, Safari's text size)
// ×1.42. And THREE-column cards the band scale never draws, their content box
// over the floor too (the round-3 review, 2026-10-21, and this file's own
// arithmetic the same day): on a touch screen wider than about 1551 CSS px,
// where a coarse pointer keeps the scale's `(pointer: fine)` gate shut — on
// the 1640 touch screen PICTURE_SIZES records, a 12.83px label at 100 % and
// ×1.03 / ×1.17 / ×1.52 / ×1.87 at 110 / 125 / 150 / 200 %; on a 2000px one
// ×1.48 at 200 %, and ×0.98 and ×0.96 at 110 and 125 %, smaller than at
// 100 %; on a 2560px one, past the gutter's 12.5rem cap, ×0.97 / ×0.92 /
// ×0.89 / ×1.06 — or with a mouse in Safari 16.0–16.3 or Firefox 110–127,
// which the gate's `@supports` refuses, from about 1570px behind a
// scrollbar: in a 1920 window ×0.98 at 110 and 125 % and ×1.57 at 200 %.
// Everywhere else the scale does not draw they double at 200 %, or more:
// where the floor binds at 100 % a zoomed label can only stay on it or grow
// off it; and the two-column cards OVER the floor, ≈1040–1138px windows
// behind a scrollbar (≈1021–1119 without), reach ×2.15 or more at 200 % but
// lag the zoom on the way there, down to ×0.99 / ×1.12 / ×1.34 at 110 / 125
// / 150 % (the same arithmetic, 2026-10-20). A pinch zoom, which leaves the
// layout viewport alone, enlarges the tags with the page. A larger DEFAULT
// font size passes them by as well, §15.35's ramp moving the column with the
// root: at the 723 window a 20px default leaves the label at 17.96px (×1.00)
// and a 24px default draws it at 19.6px (×1.09), while the author, the
// summary, the reading time and the read-more grow ×1.25 and ×1.5 (the
// title, crossing its step, ×1.04 and ×1.25). Inside THE BAND SCALE the card
// follows the band's design pixel and the chips follow the card: on the floor
// they double or more, as above, and off it (from ≈1609px windows) they share
// the regime's recorded trade (§15.25 round 2, §15.32). The card-relative
// size is the owner's design — the ratio he picked at his 723 window (THE
// CHIPS FOLLOW THEIR CARD) — so it is recorded, not changed. THE LEVER is the
// cover's: drop the card's own pixel (CHIP_SCALE — on both at once,
// tests/unit/blog-tags-sync.test.ts holding the two equal) so the chips take
// the page's — the theme's wherever the scale does not draw, doubling at
// 200 % like every rem on the page — and it undoes his ratio: the atom's 44px
// chips with an 18px label on every phone, where the card draws 29.3 to
// 29.7px chips with a 12 to 12.1px label today.
//
// ── THE SUMMARY: ui/Text, muted — the screenshot's grey paragraph —
// start-aligned like all site prose (§15.15 b).
//
// ── THE FOOTER ROW: ONE line on the card's floor (`mt-auto`, THE LAYOUT) —
// the reading time on the left (ui/Text muted, FINISHED by the page:
// „5 min de citit") and the read-more on the right: ui/TextButton
// `tone="accent"`, the top bar's text button with its label always the
// hover's lavender (5.06:1 on the card's white) and the 2px underline drawn
// on a hover alone — the owner's "basically the top bar button, but always
// lilla". The placement is the LINK's, the row's flex item (THE LINK, below):
// `ms-auto` keeps it at the end when the row wraps; `-me-2` takes back the
// `px-2` the atom gives the label, so its LABEL ends on the content edge,
// where the summary's lines end. No rule above the row: the screenshot has
// none.
// MEASURED (Chromium, the real face, each language's words as
// src/messages/*.json finish them), the content box the row needs with a
// one-digit reading time and with two: Romanian 271.5 / 279.8px, French
// 255.6 / 263.9, Italian 250.2 / 258.5, German 248.4 / 256.7, English
// 207.1 / 215.4. So on a phone, with no scrollbar, it holds one line from a
// 375px window in Romanian (from 360 with one digit), from 360 in French,
// Italian and German, and at 320 in English; and in every three-column card
// on a laptop or desktop in all five — in the band scale the row and the box
// grow together, so the step's own window is the tightest, 1140 behind a
// scrollbar: 7.0px to spare for Romanian's two digits, 31.9 for Italian's one
// (56.4 at 1536). ITALIAN'S FIRST READ-MORE, „Continua a leggere…", needed
// 307.2px: it wrapped in every three-column card from 1140 to 1536 (it
// fitted at 1920, by 1.8px) and on every phone up to 390. it.json's „Leggi
// di più…" is what keeps that row whole, and PostCard.stories.tsx's Italian
// story holds it at the laptop. Narrower, the read-more takes a second line,
// still at the end — its label on the content edge and the row on the
// content's floor, 0px off each, at a 320 phone and in a 768 tablet's two
// columns (where every language but English wraps) — and so in the UNSCALED
// three-column card of a touch tablet held sideways (the band scale is a
// mouse's — §15.25 round 2): every language but English at 1133, 1180 and
// 1194, all five at 1366.
// THE WHOLE CARD DRAWS THE UNDERLINE — the owner, verbatim (2026-10-14, on
// the preview): "i also want on hover of a card the underline from citeste
// mai mult animation to trigger". The read-more asks ui/TextButton for
// `hoverArea="area"`, and the <article> wears the atom's
// TEXT_BUTTON_HOVER_AREA — Tailwind's NAMED group, so no other `group` on a
// page can trigger it — so a pointer anywhere on the card sweeps the
// underline in on the atom's own 300ms clock while the card jumps on its
// 200ms one, and leaving the card folds it. `group-hover:` answers only
// `(hover: hover)` devices, like the jump, so a tap on a phone leaves nothing
// drawn. MEASURED (PostCard.test.tsx, a real pointer on the title and on the
// picture, never on the read-more): the underline's scale reads 1 and the
// card's 1.05 — and, with the pointer off the card, 0 and 1 again.
// THE LINK (2026-10-15 — THE PROMISE, HALF KEPT, above). The read-more is the
// card's ONE link: a plain <a href> to the article the page names, `href`
// (§15.13: a full document load — no router, no prefetch). It is named
// „Citește mai mult… <title>" — `aria-labelledby="{the label's id} {the
// title's id}"`, the visible label first (SC 2.5.3) — so a links list tells
// a page's six read-mores apart, as sections/PersonnelCard's doctor link
// reads „Mai multe despre mine <name>": the NAMES half of SC 2.4.4, which the
// card keeps; the destination is the stand-in for 11 of 12 cards today (THE
// PROMISE, HALF KEPT). From 2026-10-14 to that day it was an <a> WITHOUT
// href, HTML's placeholder link.
//   THE LABEL, NOT THE LINK, IS ui/TextButton'S. The atom dresses a <span>
//   inside the link (`asChild`), because its box is `relative` — its
//   underline is drawn against it — and a positioned link would keep every
//   absolute box it draws inside itself. The link round the label is not
//   positioned, and neither is anything between it and ui/Card, which says
//   `relative` for the tags (THE TAGS); the link is `flex`, so its box is the
//   label's exactly and the row lays it out as before.
//   THE LAYER: the link's `::before`, EMPTY and transparent, as large as the
//   card's border box — `before:-inset-[3px]` against the card's padding box, the
//   framed border taken back (KEEP-IN-SYNC with ui/Card's framed row, which
//   PostCard.test.tsx reads; the atom's own glow layer spans the same box the
//   same way) — so a press anywhere on the card, the frame included, is a
//   press on the link. Positioned and later in the markup than the picture
//   and the tags, it paints above both, unseen; only the label, inside the
//   same link, paints above it. PostCard.test.tsx asks the engine what lies
//   under the picture, a chip, the title, the summary and the reading time:
//   the link, every time.
//   THE RING IS THE CARD'S. Tab stops ONCE per card, on the link, and its
//   keyboard focus ring is drawn by the layer — the house ring, 2px of
//   `--focus` at a 2px offset, round the card's whole border box at the
//   card's own corner (`--radius-soft`, the token `corners="soft"` asks
//   ui/Card for — KEEP-IN-SYNC) — so the ring shows what Enter opens: the
//   card. The link's own ring is hidden (`outline-hidden`, which forced
//   colours keep, as an outline round the label); a pointer's focus draws
//   none (`:focus-visible`).
//   WHAT IT COSTS, RECORDED: the layer lies over the card's words, so a drag
//   on the card cannot select its text — the price of every stretched link;
//   the card has nothing else to press. A screen reader's TOUCH exploration
//   (VoiceOver, TalkBack) hit-tests the same layer, so a finger on the card's
//   words most likely lands on the link, and the author, the summary and the
//   tags are reached by swiping — inferred from the engine's hit test, not
//   tried on a device (BACKLOG.md entry 2's listens). And a right-click
//   anywhere on the card offers the link's own menu, „open in a new tab"
//   among it. The layer has the card's rounded corner while the hover area,
//   the <article>, is a rectangle, so each of its four corners keeps a spot
//   that answers the hover (the jump, the underline) and presses no link —
//   WHICH spot depends on the motion (measured in Chromium and WebKit,
//   2026-10-20, the react review's reading). With motion, a pointer on a
//   RESTING corner sets the card jumping, and once it has grown (its 200ms)
//   a press there opens the article: the dead spots are the JUMPED card's
//   own corners, about 61 px² each at the theme's step (the 16px radius drawn
//   at 105 %), reached only from inside the card. Under reduced motion the
//   card never grows, and the RESTING corners are the dead spots, about
//   55 px² each at the theme's step. The band scale enlarges them — at its
//   cap about 117 px² jumped and 106 at rest — and a miniature shrinks them,
//   about 26 and 23 px² at 0.65 in the theme's pixel (each a corner's square
//   less its quarter circle, (1 − π/4) r²). The lever is
//   the <article> taking the card's corner — and a miniature's <article>
//   stands OUTSIDE the wrapper that redraws the soft radius (THE MINIATURE'S
//   WRAPPER), so there its corner would be that radius times the share.
//
// ── WHAT THIS SECTION DOES NOT OWN: its width and its margins (§6.4/§6.8 —
// the page's list places it), its height (`h-full` arrives from the page),
// and the gap between cards — which must stay wider than the jump's growth,
// 2.5 % of a card's width a side and of its height above and below. MEASURED:
// ±7.9 / ±13.5px at 1280 against a 29.2px gap, ±9.5 / ±16.3 at 1536 against
// 35.1, ±7.3 / ±15.6 in a 768 tablet's columns against 32, ±7.2 / ±15.1 on a
// 320 phone; the tallest card measured, the long-words post at 320 (840px —
// 804 until 2026-10-15, when its title stopped splitting „recomandări" and
// took a seventh line), grows 21.0px into a 32px gap.
//
// ── ZERO ISLANDS OF ITS OWN (§16): no 'use client', no handler, no state;
// useId is the one hook and it is server-safe, and every atom here renders on
// the server (ui/TextButton's and ui/PillButton's `asChild` are render-time
// clones). ui/Image brings its optimizer's small island with the picture, as
// on every page with a photograph. PostCard.test.tsx pins the directive's
// absence and the import surface from the source text, because no runtime
// assertion can see either.

/** One post as this card shows it — every string FINISHED (§8.1). */
export type PostCardContent = {
  /** The address of the article the card opens, finished by the page through
   *  i18n/href's localeHref (e.g. „/ro/blog/cum-iti-alegi-periuta-de-dinti/")
   *  — the whole card is its link (THE LINK). ROOT-ABSOLUTE: one leading
   *  slash, never a second or a backslash after it, and no tab, line feed or
   *  carriage return anywhere (`isRootAbsolute`); a value that breaks either
   *  rule throws a RangeError at render. */
  href: string;
  /** The post's title, the card's heading — finished text. */
  title: string;
  /** One or two sentences under the author — finished text. */
  summary: string;
  /** Who wrote the post, as the page's language spells the doctor's name
   *  (e.g. „Dr. Nicu Elena Alina"; „Dr Nicu Elena Alina" in French). */
  author: string;
  /** How long the post takes to read, FINISHED by the page through ICU
   *  (e.g. „5 min de citit"). */
  readingTime: string;
  /** The picture under public/images/ (§11) and its alt — '' when decorative.
   *  READ-ONLY, as lib/blog's own BlogPost holds it: a mutable shape here
   *  would drop that guarantee at the section's boundary (G2 typescript,
   *  2026-10-14) — the card only ever reads it. */
  image: Readonly<{ src: ImagePath; alt: string }>;
  /** The post's categories, one chip each; empty renders no list at all. */
  tags: readonly string[];
};

/** The levels the title may take in a page's outline (THE TITLE'S LEVEL). */
export type PostCardHeadingLevel = 2 | 3;

type PostCardOwnProps = PostCardContent & {
  /** The accessible name of the tag list, finished text (e.g. „Categorii"). */
  tagsLabel: string;
  /** The read-more's label, finished text (e.g. „Citește mai mult…"). */
  readMore: string;
  /**
   * The picture is likely its page's LCP element — the first card of a page:
   * load it at once, at high fetch priority, with a preload link. The PAGE
   * says so; a card cannot know where it sits. @default false
   */
  preload?: boolean;
  /**
   * The title's level in the page's outline (THE TITLE'S LEVEL): 2 straight
   * under a page's <h1> (the blog list), 3 under a band's own <h2> (the Home
   * band). The ELEMENT follows it; the look never does. Any other value — one
   * that slipped past the type — throws a RangeError at render. @default 2
   */
  headingLevel?: PostCardHeadingLevel;
  /**
   * The picture's `sizes` hint, for a page that draws the card at other
   * widths than the blog list's grid (THE PICTURE's THE `sizes`, OVERRIDDEN):
   * the page derives it from its own geometry. @default PICTURE_SIZES, the
   * blog list's
   */
  sizes?: string;
  /**
   * THE MINIATURE (the header): the card drawn as a copy of itself at this
   * share of its size — every theme length (spacing, type, radius,
   * container) at `miniature` × the design pixel the card inherits where it
   * stands, the chips with it — so in a slot that share of a full card's
   * width it lays out exactly as that full card does. A share in (0, 1]; any
   * other number throws a RangeError. Unset, the card is the blog list's,
   * byte for byte.
   */
  miniature?: number;
};

export type PostCardProps = PostCardOwnProps &
  // The card's own names leave the native half — `title` is HTML's tooltip
  // attribute, and an intersection would leave it meaning two things at the
  // call site — and so do `children` and `dangerouslySetInnerHTML` (content
  // arrives as named props), the two ARIA naming attributes (the article's
  // name is its title's alone), `role` (it is an article) and `tabIndex`
  // (the card's one tab stop is its link) — THE NAME.
  Omit<
    ComponentPropsWithRef<'article'>,
    | keyof PostCardOwnProps
    | 'children'
    | 'dangerouslySetInnerHTML'
    | 'aria-label'
    | 'aria-labelledby'
    | 'role'
    | 'tabIndex'
  >;

/** THE CARD JUMP (the header): ui/Button's jump, the scale alone. KEEP IN
 *  SYNC with ui/Button's `motionClasses` jump cell — 200ms, the keyword
 *  ease-out, 105 %, still under reduced motion. One static string: Tailwind
 *  reads class names from source text. */
const CARD_JUMP =
  '[--jump:200ms] transition-[scale] duration-(--jump) ease-[ease-out] ' +
  'hover:scale-105 motion-reduce:hover:scale-100';

/** THE PICTURE'S CELL (the header): 3:2, out to the frame's inner edge on
 *  three sides — ui/Card's framed padding taken back, KEEP-IN-SYNC with its
 *  `toneClasses.framed` — its top corners on the frame's inner curve, and the
 *  photograph clipped to them (with the Safari ≤ 15 twin). */
const PICTURE =
  'relative aspect-[3/2] -mx-[calc(var(--spacing)*6_-_2px)] -mt-[calc(var(--spacing)*6_-_2px)] ' +
  'rounded-t-[calc(var(--radius-soft)_-_3px)] overflow-clip supports-[not_(overflow:clip)]:overflow-hidden';

/** The element behind `headingLevel` (THE TITLE'S LEVEL) — a lookup, so a
 *  widened union fails to compile until this table names its tag
 *  (sections/PersonnelCard's HEADING precedent). */
const HEADING: Readonly<Record<PostCardHeadingLevel, 'h2' | 'h3'>> = {
  2: 'h2',
  3: 'h3',
};

/** The words under the picture, on the card's own 12px rhythm: growing to the
 *  card's floor, and as far under the picture as the frame's padding — the
 *  card's `gap-3` plus three steps less 2px (THE LAYOUT). */
const WORDS = 'flex flex-1 flex-col gap-3 pt-[calc(var(--spacing)*3_-_2px)]';

/** The categories over the picture's top-right corner, three of the chips'
 *  own steps in, the first tag at the far right (THE TAGS) — positioned
 *  against the CARD, which says `relative`. */
const TAGS =
  'absolute start-3 end-3 top-3 flex flex-row-reverse flex-wrap gap-3';

/** THE CHIPS FOLLOW THEIR CARD (the header): the list draws in its OWN design
 *  pixel — the card's content width over 513.40625, that width at the owner's
 *  723 × 1123 window, never under 0.75rem / 18 — and `design-scale` redraws
 *  every theme length in it, the list's inset and gap and the chips' height,
 *  padding and label. Both behind THE GUARD, an engine that knows container
 *  units: without them the theme's own chips stay. One static string per
 *  class: Tailwind reads class names from source text.
 *  KEEP IN SYNC — the blog ARTICLE's cover (sections/PostCover) floats the
 *  same tags over its picture and reuses this formula and TAGS above, its
 *  pixel capped at its page's own; tests/unit/blog-tags-sync.test.ts holds
 *  the two equal. */
const CHIP_SCALE =
  'supports-[width:1cqw]:[--scale-px:max(calc(0.75rem/18),calc(100cqw/513.40625))] ' +
  'supports-[width:1cqw]:design-scale';

/** THE MINIATURE'S SHARE (the header): the one number a miniature puts in
 *  the DOM, inline on the <article> — a CSS number, never a length. */
const MINIATURE_SHARE = '--miniature';

/** THE MINIATURE'S PIXEL, captured on the <article> (the header): the design
 *  pixel the card inherits — the spacing step over four, the theme's or a
 *  band's — times the share. Declared HERE and read one element down,
 *  because `var()` in a custom property is resolved on the element that
 *  declares it: on the card, which redraws the step, it would read its own.
 *  One static string: Tailwind reads class names from source text. */
const MINIATURE_CAPTURE =
  '[--miniature-px:calc(var(--spacing)/4*var(--miniature))]';

/** THE MINIATURE'S REMAP (the header), on the card's OWN wrapper round
 *  ui/Card — a miniature's alone: every theme length inside drawn in the
 *  captured pixel, globals.css's `design-scale`, the band scale's own
 *  utility; `h-full` keeps the page's stretch reaching the card. One static
 *  string: Tailwind reads class names from source text. */
const MINIATURE_SCALE = 'h-full [--scale-px:var(--miniature-px)] design-scale';

/** THE MINIATURE'S CHIPS (the header): CHIP_SCALE's pixel with its floor ×
 *  the share — INLINE on the tag list, where it outranks the list's class,
 *  because that class stays CHIP_SCALE byte for byte (the cover's
 *  KEEP-IN-SYNC). The cqw half is CHIP_SCALE's own: the card is already the
 *  share as wide. */
const MINIATURE_CHIPS = {
  '--scale-px': 'max(calc(0.75rem/18*var(--miniature)),calc(100cqw/513.40625))',
} as CSSProperties;

/** One line on the card's floor: the reading time, then the read-more at the
 *  end — on a line of its own, still at the end, where the two do not fit
 *  (THE FOOTER ROW). */
const FOOTER = 'mt-auto flex flex-wrap items-center gap-x-4';

/** THE LINK (the header's paragraph): at the footer row's end, its LABEL on
 *  the content edge — ui/TextButton's `px-2` taken back — and a flex box, so
 *  its box is the label's; its own ring hidden; and its EMPTY layer over the
 *  card's border box (the framed border, 3px, taken back), at the card's
 *  corner: a press anywhere on the card is a press on the link, and under
 *  keyboard focus that layer draws the house ring round the whole card. */
const LINK =
  'flex ms-auto -me-2 focus-visible:outline-hidden ' +
  "before:absolute before:-inset-[3px] before:rounded-(--radius-soft) before:content-[''] " +
  'before:outline-offset-2 focus-visible:before:outline-2 focus-visible:before:outline-focus';

/** The picture's `sizes` (THE PICTURE's derivation): 30rem past the band
 *  scale's cap on a mouse, a third of the column from 71.25rem, half from
 *  46.25rem, the column under it. The space before each `vw` is
 *  load-bearing. */
const PICTURE_SIZES =
  '(min-width: 121.25rem) and (pointer: fine) 30rem, (min-width: 71.25rem) 25vw, (min-width: 46.25rem) 40vw, 90vw';

/** The eager pair the page asks for on its first card (THE PICTURE). Spread
 *  only when asked, so a lazy card hands ui/Image nothing extra at all. */
const EAGER = { preload: true, fetchPriority: 'high' } as const;

/** A share THE MINIATURE can draw: a finite number over 0, never over 1.
 *  Typed `unknown`, as the two guards below are: what it refuses is a value
 *  that slipped past the props' type, and the `typeof` is what lets the
 *  comparisons compile at all. */
const isShare = (value: unknown): boolean =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value > 0 &&
  value <= 1;

/** A level THE TITLE'S LEVEL can draw: one of HEADING's keys, as a NUMBER —
 *  the string '3' finds the key '3' too (an object's keys are strings), and
 *  4 or null finds none. Typed `unknown`, like its neighbours. */
const isHeadingLevel = (value: unknown): boolean =>
  typeof value === 'number' && Object.hasOwn(HEADING, value);

/** An address THE LINK can lead to: ROOT-ABSOLUTE, as i18n/href's localeHref
 *  builds every internal link (§15.13) — a string that starts with ONE slash,
 *  never with two or with a slash and a backslash, which a URL parser reads
 *  as the start of ANOTHER SITE's address — and that holds no ASCII tab, line
 *  feed or carriage return ANYWHERE: the URL parser deletes those three
 *  wherever they stand, so a slash, a tab and „/evil.example/x" resolve to
 *  „//evil.example/x", another site (the round-3 review, 2026-10-21, measured:
 *  React's server renderer keeps the raw tab in the href, and Chromium and
 *  WebKit follow it there on a click). Refused anywhere, not only after the
 *  first slash: a real address never holds one. Typed `unknown`, because
 *  what it guards against is a value that slipped past the props' type. */
const isRootAbsolute = (value: unknown): boolean =>
  typeof value === 'string' && /^\/(?![/\\])[^\t\n\r]*$/.test(value);

/** A refused value, as an error names it — BY ITS TYPE, never by running its
 *  own code: a number as written, a string in quotes (so „0.65" never reads
 *  as the number it spells, and an empty one still shows), null as written
 *  (its `typeof` would say „object"), anything else as its type alone — a
 *  BigInt's or a boxed number's own text would read as a valid value (`1n`
 *  prints „1"), and an object's may throw or not exist. */
const quoted = (value: unknown): string =>
  typeof value === 'number'
    ? String(value)
    : typeof value === 'string'
      ? JSON.stringify(value)
      : value === null
        ? 'null'
        : `<${typeof value}>`;

export function PostCard({
  href,
  title,
  summary,
  author,
  readingTime,
  image,
  tags,
  tagsLabel,
  readMore,
  preload = false,
  headingLevel = 2,
  sizes = PICTURE_SIZES,
  miniature,
  className,
  ...rest
}: PostCardProps): ReactElement {
  const titleId = useId();
  const readMoreId = useId();
  if (!isHeadingLevel(headingLevel)) {
    // THE TITLE'S LEVEL, past the type: named by its type (`quoted`), before
    // the lookup could hand React no element, or an <h3> for the string '3'.
    throw new RangeError(
      `PostCard: \`headingLevel\` is the title’s level in the page’s outline, ${Object.keys(HEADING).join(' or ')} — got ${quoted(headingLevel)}.`,
    );
  }
  const TitleElement = HEADING[headingLevel];
  const mini = miniature !== undefined;
  if (mini && !isShare(miniature)) {
    // Whatever slipped past the type is named by its type (`quoted`).
    throw new RangeError(
      `PostCard: \`miniature\` is a share of the card in (0, 1] — got ${quoted(miniature)}.`,
    );
  }
  // THE LINK leads to an article, so its address is ROOT-ABSOLUTE
  // (`isRootAbsolute`): '' or '.' or '#' or '?' would open the page the card
  // stands on, a relative path one under it, a leading '//' another site —
  // and so can a tab, a line feed or a carriage return, which a URL parser
  // deletes. A value that is no string at all slipped past the type, so the
  // guard takes `unknown`, and `quoted` names it by its type. The pages
  // build every href through localeHref and lib/blog's articlePath
  // (lib/blog-article's articleSlugFor picks the slug), so only a broken
  // caller reaches this.
  if (!isRootAbsolute(href)) {
    throw new RangeError(
      `PostCard: \`href\` is no root-absolute address — the card’s one link must lead to an article; got ${quoted(href)}.`,
    );
  }
  // THE MINIATURE'S SHARE, merged over the caller's own style — a NEW object
  // for a miniature alone, so a card without one hands React the caller's
  // `style` inside the spread, where it always stood (byte for byte).
  const share = mini
    ? {
        style: {
          ...rest.style,
          [MINIATURE_SHARE]: miniature,
        } as CSSProperties,
      }
    : undefined;

  // THE FRAME: the doctor card's frame and corner, no glow; `relative` and
  // `h-full` are placement — the containing block of the chips' list and of
  // the link's layer, a stretched list. A miniature
  // stands it in THE MINIATURE'S wrapper, below; the Card itself is the same
  // element, with the same className, either way.
  const card = (
    <Card tone="framed" corners="soft" className="relative h-full">
      <div className={PICTURE}>
        <Image
          variant="plain"
          fill
          src={image.src}
          alt={image.alt}
          sizes={sizes}
          className="object-cover"
          {...(preload ? EAGER : {})}
        />
      </div>
      <div className={WORDS}>
        {/* The title, at the level the page's outline gives it, in the one
            look every level wears (THE TITLE'S LEVEL): ui/Heading's
            `band`. It never splits a word at a syllable (THE TITLE NEVER
            SPLITS A WORD, `hyphens-none`), and its belt, `wrap-anywhere`,
            breaks only a word that cannot fit its line by itself. */}
        <Heading size="band" asChild>
          <TitleElement id={titleId} className="hyphens-none wrap-anywhere">
            {title}
          </TitleElement>
        </Heading>
        <Eyebrow className="hyphens-none">{author}</Eyebrow>
        {tags.length > 0 ? (
          <ul
            role="list"
            aria-label={tagsLabel}
            className={cx(TAGS, CHIP_SCALE)}
            style={mini ? MINIATURE_CHIPS : undefined}
          >
            {tags.map((tag) => (
              // A TAG, not a control (THE TAGS): the lavender face held
              // still. Keyed by the tag itself — the blog's data refuses a
              // tag listed twice.
              <PillButton key={tag} kind="tag" asChild>
                <li>{tag}</li>
              </PillButton>
            ))}
          </ul>
        ) : null}
        <Text tone="muted">{summary}</Text>
        <div className={FOOTER}>
          <Text tone="muted">{readingTime}</Text>
          {/* THE LINK: the card's one link, named by its label and the
              title; its layer lies over the whole card. */}
          <a
            href={href}
            aria-labelledby={`${readMoreId} ${titleId}`}
            className={LINK}
          >
            {/* ui/TextButton dresses the LABEL, never the link: the atom's
                box is positioned, and the layer must reach the card. */}
            <TextButton tone="accent" hoverArea="area" asChild>
              <span id={readMoreId}>{readMore}</span>
            </TextButton>
          </a>
        </div>
      </div>
    </Card>
  );

  return (
    // The spread FIRST, then the name pair and the className (THE NAME's
    // belt): native props reach the <article>, nothing that slipped past the
    // Omit can rename it, a smuggled `aria-label` is reset so it never
    // stands in the markup beside the title's name, a smuggled `role` so
    // the article stays one, and a smuggled `tabIndex` so the card keeps
    // one tab stop, its link. A miniature's share rides LAST, over the
    // caller's style, which can therefore never unset it (THE MINIATURE).
    <article
      {...rest}
      aria-label={undefined}
      role={undefined}
      tabIndex={undefined}
      aria-labelledby={titleId}
      className={cx(
        CARD_JUMP,
        TEXT_BUTTON_HOVER_AREA,
        mini ? MINIATURE_CAPTURE : undefined,
        className,
      )}
      {...share}
    >
      {/* THE MINIATURE'S WRAPPER — a miniature's alone: ONE plain <div> of
          the card's own between the <article> and ui/Card, drawing every
          theme length inside in the captured pixel, so ui/Card's className
          stays its placement (§6.8). A full card has none: its markup is
          the list's, byte for byte. */}
      {mini ? <div className={MINIATURE_SCALE}>{card}</div> : card}
    </article>
  );
}
