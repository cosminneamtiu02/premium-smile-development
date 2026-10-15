import { useId, type ComponentPropsWithRef, type ReactElement } from 'react';
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
// grid of them: a photograph across the top, out to the frame, with the
// post's categories floating over its top-right corner; under it the title,
// the author, a summary and a last line — the reading time and a read-more.
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
// tag list and the read-more (`tagsLabel`, `readMore`). The blog index is its
// one consumer, and the page maps its posts to PostCardContent; reuse never
// promotes a composite (§4).
//
// ── THE FRAME: ui/Card `tone="framed" corners="soft"` — exactly what
// sections/PersonnelCard asks for its doctor cards, the owner's "same border
// and corners": the 3px `--card-tint` frame on white and the old site's 1rem
// corner (§15.29). No glow — he named the border. The Card's className is
// placement alone (§6.8): `relative`, the scope the chips are positioned in
// (THE TAGS), and `h-full`, so the card fills an article its list stretches.
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
// THE FALSE AFFORDANCE, RECORDED, NOT AN ACCIDENT. Until the article pages
// exist — and the read-more becomes their link (THE FOOTER ROW) — a card that
// answers a hover promises a press the page cannot keep. The owner chose that
// knowingly ("the pages should not be clickable yet. so just react on hover
// like a button"), so the card stays INERT in every other way: no working
// link, no <button>, no tabindex, no role but the tag list's, and no pointer
// cursor — a keyboard or screen-reader visitor meets nothing to activate (the
// props refuse a caller's `tabIndex` and `role` as well — THE NAME). The
// read-more's underline — which a hover anywhere on the card draws (THE
// FOOTER ROW), so the promise is plainer still — is the same placeholder; the
// chips promise nothing, labels with no hover of their own (THE TAGS). When
// the link arrives it takes the jump with it.
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
// The props refuse three more native attributes, each one a promise of THE
// FALSE AFFORDANCE: `role` — the element IS an article, the one role its
// list and its name rely on — `tabIndex`, because nothing in the card takes
// focus, and `dangerouslySetInnerHTML`, because its content arrives as named
// props. None is hyphenated, so the type stops a caller who writes one; `role`
// is ALSO reset after the spread, as `aria-label` is, because a spread of a
// wider object could still carry one, and a stray role would unmake the
// article itself (the tier-2 review, 2026-10-14).
// THE TITLE IS THE PAGE'S <h2>, ALWAYS: the blog index — the one page that
// shows these cards — puts them straight under its <h1> (sections/PostList).
// A level prop once offered <h3> titles for a page that grouped the cards
// under a band's <h2>; no page did, and a prop nobody passes is dead API (the
// house's D37 rule, §15.23 round 2g; the owner's "no dead code"), so it left
// with its lookup table (the tier-2 review, 2026-10-14) — a page that nests
// the cards a level deeper brings it back with it. The title wears
// ui/Heading's `band` — §15.24's h2 step — answering to ui/Card's own
// `@container`, so it reads the CARD step: 30px on a card under 28rem of
// content, which in the page's grid is every card but the one-column band
// just under two columns (36px there, a 525px content box at a 719px
// window) — and 30 design pixels in the band scale (27.4px at 1280, 32.9 at
// 1536, MEASURED).
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
// title line a card draws — 222px, the two-column card at its step; the
// widest, German „Zahnaufhellung:", is 217.1px — and lays every title out on
// that line and on a 390 phone's (301px, 286 behind a classic scrollbar),
// finding no word on two lines.
// THE MARGIN IS THE MAC'S, RECORDED (the review of 2026-10-15): 217.1 of 222
// is about 2 % under the line, measured in Chromium on macOS — and CI
// measures on Linux, which sets Source Serif about 1 % wider (the review's
// estimate, not measured here): ≈219.3px, still inside the line by that
// model. So a title word a little wider than today's widest could pass on the
// Mac and fail on CI; the measured test is the gate either way, and its red
// names the word and its width.
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
//
// ── THE AUTHOR: ui/Eyebrow — the mono, muted, uppercased micro-label — the
// owner's "as the eyebrow the doctor that wrote the article"; `hyphens-none`,
// because a name never splits at a syllable (PersonnelCard D4, ReviewCard's
// credential) — a long one wraps between its words. THE DATE LEFT THE CARD:
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
// alone — and no pointer cursor; a tag is never current. A KIND of the
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
// 4.5:1 every size of it owes, the floor's 12px included (THE CHIPS FOLLOW
// THEIR CARD) — so no photograph ever stands behind the words; the lavender
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
// default root — two-thirds of the atom — so no label shrinks past reading. It
// binds wherever the content box is under two-thirds of 513.40625, 342.3px,
// which is most cards: behind a classic scrollbar a window up to ≈453px (one
// column), ≈739 to ≈1039 (two) and ≈1139 to ≈1609 (three across, in the band
// scale); without one, every phone up to 430px and a 768 tablet's two columns.
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
// „Parodontologie" and „Implantologie" — and end 102.8px above it. Both
// ceilings, a tag's length and a post's three tags, are the blog's data's to
// hold, never this card's (tests/unit/blog-data.test.ts).
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
// lilla". `ms-auto` keeps it at the end when the row wraps; `-me-2` takes
// back the atom's `px-2`, so its LABEL ends on the content edge, where the
// summary's lines end. No rule above the row: the screenshot has none.
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
// THE PLACEHOLDER LINK: the read-more is an <a> WITHOUT href — HTML's own
// placeholder link (sections/Wordmark's old D9, which suppressed the same
// lint rule for the same reason): no link role, no tab stop, no pointer
// cursor; a screen reader reads its words as text after the reading time. The
// day the article pages exist it gains its `href` (§15.13: a plain document
// load) and `aria-labelledby="{its own id} {the title's id}"`, so a links list
// reads „Citește mai mult… <title>" — the visible label first (SC 2.5.3).
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
  /** The post's title, the card's heading — finished text. */
  title: string;
  /** One or two sentences under the author — finished text. */
  summary: string;
  /** Who wrote the post, as the post signs it (e.g. „Dr. Nicu Elena Alina"). */
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
};

export type PostCardProps = PostCardOwnProps &
  // The card's own names leave the native half — `title` is HTML's tooltip
  // attribute, and an intersection would leave it meaning two things at the
  // call site — and so do `children` and `dangerouslySetInnerHTML` (content
  // arrives as named props), the two ARIA naming attributes (the article's
  // name is its title's alone), `role` (it is an article) and `tabIndex`
  // (nothing in the card takes focus) — THE NAME.
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
 *  class: Tailwind reads class names from source text. */
const CHIP_SCALE =
  'supports-[width:1cqw]:[--scale-px:max(calc(0.75rem/18),calc(100cqw/513.40625))] ' +
  'supports-[width:1cqw]:design-scale';

/** One line on the card's floor: the reading time, then the read-more at the
 *  end — on a line of its own, still at the end, where the two do not fit
 *  (THE FOOTER ROW). */
const FOOTER = 'mt-auto flex flex-wrap items-center gap-x-4';

/** The read-more's placement (THE FOOTER ROW): at the row's end, its LABEL on
 *  the content edge — ui/TextButton's `px-2` taken back. */
const READ_MORE = 'ms-auto -me-2';

/** The picture's `sizes` (THE PICTURE's derivation): 30rem past the band
 *  scale's cap on a mouse, a third of the column from 71.25rem, half from
 *  46.25rem, the column under it. The space before each `vw` is
 *  load-bearing. */
const PICTURE_SIZES =
  '(min-width: 121.25rem) and (pointer: fine) 30rem, (min-width: 71.25rem) 25vw, (min-width: 46.25rem) 40vw, 90vw';

/** The eager pair the page asks for on its first card (THE PICTURE). Spread
 *  only when asked, so a lazy card hands ui/Image nothing extra at all. */
const EAGER = { preload: true, fetchPriority: 'high' } as const;

export function PostCard({
  title,
  summary,
  author,
  readingTime,
  image,
  tags,
  tagsLabel,
  readMore,
  preload = false,
  className,
  ...rest
}: PostCardProps): ReactElement {
  const titleId = useId();

  return (
    // The spread FIRST, then the name pair and the className (THE NAME's
    // belt): native props reach the <article>, nothing that slipped past the
    // Omit can rename it, a smuggled `aria-label` is reset so it never
    // stands in the markup beside the title's name, and a smuggled `role` so
    // the article stays one.
    <article
      {...rest}
      aria-label={undefined}
      role={undefined}
      aria-labelledby={titleId}
      className={cx(CARD_JUMP, TEXT_BUTTON_HOVER_AREA, className)}
    >
      {/* THE FRAME: the doctor card's frame and corner, no glow; `relative`
          and `h-full` are placement — the chips' scope, a stretched list. */}
      <Card tone="framed" corners="soft" className="relative h-full">
        <div className={PICTURE}>
          <Image
            variant="plain"
            fill
            src={image.src}
            alt={image.alt}
            sizes={PICTURE_SIZES}
            className="object-cover"
            {...(preload ? EAGER : {})}
          />
        </div>
        <div className={WORDS}>
          {/* The page's <h2>, always (THE NAME). It never splits a word at a
              syllable (THE TITLE NEVER SPLITS A WORD, `hyphens-none`), and
              its belt, `wrap-anywhere`, breaks only a word that cannot fit
              its line by itself. */}
          <Heading size="band" asChild>
            <h2 id={titleId} className="hyphens-none wrap-anywhere">
              {title}
            </h2>
          </Heading>
          <Eyebrow className="hyphens-none">{author}</Eyebrow>
          {tags.length > 0 ? (
            <ul
              role="list"
              aria-label={tagsLabel}
              className={cx(TAGS, CHIP_SCALE)}
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
            <TextButton
              tone="accent"
              hoverArea="area"
              asChild
              className={READ_MORE}
            >
              {/* THE PLACEHOLDER LINK (THE FOOTER ROW): jsx-a11y is right
                  that an <a> without href is no working link — it is HTML's
                  placeholder, and gains its href with the article pages. */}
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a>{readMore}</a>
            </TextButton>
          </div>
        </div>
      </Card>
    </article>
  );
}
