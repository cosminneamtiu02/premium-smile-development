import type { ComponentPropsWithRef, ReactElement } from 'react';
import { QuoteMark } from '@/assets/glyphs/QuoteMark';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
import { Heading } from '@/components/ui/Heading/Heading';
import { Image } from '@/components/ui/Image/Image';
import { cx } from '@/lib/cx/cx';
import type { ImagePath } from '@/lib/image-path/image-path';

// sections/PostConclusion — a blog article's closing words, signed by the
// doctor who wrote it: a faint lilac line down the block's left, a large faint
// quote mark at its top, the words, and under them the doctor's round photo
// beside the name and the specialty. ALWAYS THE ARTICLE'S LAST BLOCK
// (sections/PostPage places it). The owner, verbatim (2026-10-14): "i will
// also want a section for some time of conclusion that looks like the second
// attatched screenshot, with that faint quote which will be the color of the
// thread that extends on the page as you scroll the doctor cards, that failt
// liliac to pink. then below it in same section will be the circle with photo
// of doctor like in phone mode at the docotr cards in main page and next to it
// the dr name as headinf with eyebrow specailization of the doctor with that
// line on the left" — and, of the article's sections together, "those pretty
// ,mmuch will be like the sections that will always be reused for the
// articles". His screenshot: a vertical line down the left of the block, a
// large faint quote mark at the top, the quote in bold, then a round avatar
// with the name and the job title. Built to the blog-article run's contract,
// unit B5 (machine-local, .claude/section-runs/2026-10-14_blog-article/).
//
// ── TIER: THE SHARED-COMPOSITION SUB-KIND (§4) — sections/PostCard's row. It
// composes three atoms (ui/Image, ui/Heading, ui/Eyebrow) and one glyph
// (QuoteMark), binds no site data and calls no t(): the words, the name, the
// specialty and the photo arrive FINISHED (§8.1) — the route's populator
// reads the doctor out of lib/team in the page's own language, the `name` and
// the `position` of `words[locale]`, with the `cutout`. DUMB props-in, zero
// message keys; reuse never promotes a composite (§4).
//
// ── THE SEMANTICS: HTML's own shape for a quotation with its attribution — a
// <figure> around a <blockquote> and a <figcaption> (the HTML standard's
// blockquote examples put the attribution in the caption, OUTSIDE the
// quotation, because it is not part of what was said). The <figcaption> is the
// figure's LAST CHILD, the only place HTML lets it stand (its content model:
// the first or the last child of a <figure>), and there it is the figure's
// accessible name — the doctor's name and specialty — by HTML-AAM's rule,
// which Chromium 151 does not apply (measured 2026-10-20: its own
// accessibility tree names such a figure "", while the same probe names a
// <table> by its <caption>; Firefox and WebKit not measured); a screen reader
// still reads the caption inside the figure, after the words.
// The build contract drew a COLUMN instead — the line beside one <div> that
// held the mark, the quote and the caption — which would have put the
// caption one level too deep: an orphan to HTML's content model and to
// HTML-AAM's rule. So the FIGURE ITSELF is the layout (THE LAYOUT); no
// wrapper exists. (Testing Library's name computation, dom-accessibility-api
// 0.5 / 0.6, does not name a figure from its caption either, while
// Playwright's role engine does: so the suite and the stories reach the
// caption by STRUCTURE, never by the figure's name — a naming assertion would
// prove the rule as one test engine implements it, not the browser.)
// The name is a <p> (ui/Heading's default host) on the `title` step, never an
// outline heading: a signature names who spoke, it opens no part of the
// article, and an <h3> here would sit under whatever the article's last <h2>
// happened to be.
//
// ── THE LAYOUT: one GRID on the <figure> — two columns, THE LINE's own width
// and then the words (`minmax(0, 1fr)`, so a long word can never push the
// column open), 24px apart; three rows, 20px apart — the mark, the quote, the
// signature; THE LINE spans all three (`row-span-3`), so it runs from the
// mark's top to the signature's bottom, the screenshot's line down the
// block's left. DOM ORDER = PAINT ORDER, and the two decorations come first
// and are both `aria-hidden`: a screen reader meets the quote, then who said
// it.
// The figure is NO `@container` since 2026-10-20: nothing inside it queries
// one, and THE CIRCLE measures its own caption — a percentage, never a
// container unit (THE SIZE NEEDS NO CONTAINER, below) — so it reads neither a
// container nor the page (§6.5). In a column flex parent (PostPage's measure)
// the figure stretches to the measure's width.
//
// ── THE LINE — KEEP-IN-SYNC with sections/BeforeAfter, which separates its
// two pictures with the same line (the owner: "a before and after separated
// by the same line that will be osed in the section described with the doctor
// conclusion"). What the two share is the colour, the round ends and the
// thickness — `rounded-full bg-(--ribbon)` and one spacing step — and nothing
// else: tests/unit/article-line-sync.test.ts holds exactly that. The forms are
// each file's own. There the line lies down while the pictures stack (`h-1`)
// and stands between them side by side, its `@lg:w-1` and `@lg:self-stretch`
// under the pair's own step; here it always stands — LINE, `w-1 self-stretch`:
// the stretch is a grid item's default, spelled so that no alignment on the
// figure can ever shorten the line — and it stands down all three rows,
// LINE_PLACE (`row-span-3`). (Until 2026-10-20 LINE also carried a flex
// shrink guard, which a grid item never reads, "so the two files spell one
// string" — they never did; it went with the claim.) `--ribbon` is the floss
// ribbon's colour (globals.css, the thread down the doctor cards — the owner's
// "color of the thread", #d4cfdc), read as a variable so the line follows the
// thread when it changes. A decoration: an empty `aria-hidden` <span>, 1.45:1
// on the page ground — SC 1.4.11 asks 3:1 of the graphics a reader NEEDS to
// understand the content, and nobody needs the line: it marks no state and
// labels nothing — the words stand apart by their own size and weight, and
// the signature's own text says who wrote them.
//
// ── THE QUOTE MARK: the QuoteMark glyph (Lucide's `quote`, its README's
// template), decorative by its own default branch (`aria-hidden`), painted
// `text-(--ribbon)` — the thread's lilac, the owner's "faint quote" — and
// shaped from HERE, by the figure's direct-child utilities (the glyph README's
// sizing rule: a parent owns the geometry through a descendant selector,
// never a `size-*` in the glyph's className):
//   · `[&>svg]:size-12` — 3rem, the screenshot's large mark (48 design
//     pixels; the glyph's own `size-6` loses on specificity);
//   · `[&>svg]:fill-current` — Lucide draws the mark as an OUTLINE (stroke 2,
//     `fill="none"`); a CSS `fill` outranks the presentation attribute, so
//     the two shapes fill with the same lilac as their stroke and read as
//     SOLID marks, the screenshot's; the stroke stays, so each shape reaches
//     half its 2-unit stroke — one grid unit — past its path on every side;
//   · `[&>svg]:rotate-180` — Lucide's shapes are the „99" pair, a blob on top
//     and a tail curling down to the left: the CLOSING mark (”). Turned half
//     a turn the blob sits at the bottom and the tail rises to the right: the
//     „66" pair, “, the OPENING mark a pull quote leads with (the
//     screenshot's). A half turn rather than a mirror: mirrored left to right
//     the tail would hang down to the right (‟), mirrored top to bottom it
//     would rise to the LEFT — neither the opening mark. (Romanian running
//     text opens with the low „ and closes with ”; an ornament at the head of
//     a quotation is not running text, and the owner's screenshot leads with
//     “.)
// MEASURED that it reads as “ (PostConclusion.test.tsx, "reads as an
// opening mark"): the glyph is hit-tested on screen, `elementFromPoint` at
// every half pixel of its 48px box, so the reading is what the engine PAINTS
// — the CSS fill and the CSS turn included. Each turned shape's hit map is a
// full-width blob in its lower half and a tail that leaves the blob's LEFT
// side and curls up to a tip at the TOP RIGHT: the bottom fifth 0.90 filled,
// the top fifth 0.71 (the tail's tip), the mass 0.53 of the height down, the
// top fifth's points 0.61 of the width across. The same glyph filled the
// same way but NOT turned — the suite's control — reads as the exact mirror:
// the blob on top (0.90 against 0.71), the mass 0.47 down, the tail hanging
// off the blob's right to a tip at the bottom left (0.39 across): ”.
// IN FORCED COLOURS the mark takes the reader's GrayText (2026-10-20, the
// a11y reviews, both rounds measured): the line goes with every background
// there — forced to Canvas — but an SVG that sets its own colour is not
// forced, so the mark alone kept the thread's lilac, a colour of the page's,
// not of the reader's palette. Round 1 stopped painting it and kept its row,
// which took BOTH "this is a quote" cues away at once and left an empty 68px
// row above the words; since round 2 `forced-colors:text-[color:GrayText]`
// paints it in the palette's own muted colour, so one cue stays, the words
// where they always are. MEASURED in Chromium 151 under emulated forced
// colours: the mark visible, its colour, fill and stroke all GrayText; the
// line's ground Canvas; outside forced colours not a pixel moved (ui/
// PillButton's `forced-colors:` system colours are the precedent). One theme
// makes it loud (round 3, the a11y review's advisory, not measured here):
// Windows 10's High Contrast Black maps GrayText to a lime, #3FF23F, so there
// the 48px solid mark is the brightest thing in the block — CanvasText, the
// words' own colour, is the quieter alternative, not taken, for the reason
// above: the palette's own muted colour for a mark that only decorates.
//
// ── THE WORDS: a <blockquote> holding one <p>, `text-xl` (20px) in the
// medium weight on the strongest ink — the screenshot's bold quote, the
// body's serif one step heavier than reading text, 16.96:1 on the page —
// START-ALIGNED like all prose on the site (§15.15 b; the owner's answer for
// the article's paragraphs). No typographic quotation marks around the words:
// the large mark above them is the quote's mark. THE BELT, `wrap-anywhere`
// (round 2, the a11y review): the article's other text blocks wear it
// (sections/PostProse's THE BELT, PostPhoto's note and heading, PostHeader's
// and PostCard's titles), and the quote is the largest text in the narrowest
// column — 20px on a 245px line in the runner's 320 frame. It breaks a
// run ONLY when the run cannot fit its line by itself, so on words it changes
// nothing; what it catches is the run the article's JSON does not refuse — a
// 26-character e-mail, „programari@premiumsmile.ro", is 278.8px at this size
// in the real face (measured), and would push the page sideways
// (PostConclusion.test.tsx, "keeps a run longer than its line inside the
// quote").
//
// ── THE SIGNATURE: the <figcaption>, a WRAPPING row centred on its own
// height — the circle, 16px of air, then a column with the NAME FIRST in the
// DOM and the specialty PAINTED ABOVE it (`flex-col-reverse`): a screen
// reader hears „Dr. Nicu Elena Alina, Medic specialist în parodontologie" —
// who, then what — while the eye reads the small mono label over the name,
// the doctor card's order (PersonnelCard D7). Where the caption cannot seat
// the names beside the circle, they wrap UNDER it, 16px down, at the
// caption's whole width (THE CIRCLE's UNDER THE FLOOR, THE NAMES WRAP) — the
// DOM, and so the reading order, the same either way. The name on
// ui/Heading's `title` step (20px, the display face), the specialty on
// ui/Eyebrow's one step (14px mono, uppercased by CSS), 4px apart; both
// `hyphens-none` — a name, and a specialty, never split at a syllable
// (PersonnelCard D4 and its eyebrow; CLAUDE.md §15.23 round 3's THE NAME IS
// NEVER SPLIT) — and both wear THE BELT, `wrap-anywhere`: a word wider than
// its whole line breaks where it must instead of running past the figure
// (PersonnelCard D20's THE NAME'S BELT). Beside the circle the names' column
// is never narrower than THE BASIS, 162px, which holds every word of every
// doctor's specialty, in all five languages, whole with SC 1.4.12's spacing
// on — and every word of TODAY'S SIX NAMES: each breaks only between its
// words or after a hyphen it carries („Dr. Ivașcu-" over „Zugravu Cătălina",
// measured: `hyphens: none` refuses the breaks a browser would add, never the
// one a written hyphen offers) — so there the belt engages for no doctor the
// clinic has today. A specialty is HELD to the basis, a name is not (THE
// CIRCLE's TODAY'S NAMES, NOT EVERY NAME). Under the circle the belt engages
// only for a word wider than the whole caption (THE CIRCLE's WHAT IS NEVER
// CUT).
//
// ── THE CIRCLE — the doctor card's phone photo (PersonnelCard D20, its
// CIRCLE): the owner's "the circle with photo of doctor like in phone mode at
// the docotr cards". Not gated here: this is always the circle. THE TINT, the
// CLIP and THE CROP below are PersonnelCard's to the token — KEEP IN SYNC,
// held by PostConclusion.test.tsx, which reads PersonnelCard.tsx's own CIRCLE
// and FIGURE and pins every one of them; ui/Card's ONE TINT names this circle
// as a reader of `--card-tint` (the frame's lavender, ui/Card's colour-mix
// gate, the light `line-subtle` grey without it and as the variable's own
// fallback — never a transparent circle). `relative`: the containing block
// the crop is placed in (a `container-type` no longer is one, §15.20 round 4).
// THE SIZE GIVES WAY, as the doctor card's does — and here the contract's
// fixed 112px was MEASURED to fail: with the real faces, on the Storybook
// runner's 320 frame (a 273px column behind its 15px scrollbar gutter) a
// 112px circle leaves the specialty a 117px column, and the demo doctor's own
// „PARODONTOLOGIE" is 137.2px wide (14 mono capitals at 9.8px) — it ran
// 20.2px past its line (and, by the same arithmetic, 5.2px on a real 320
// phone, a 288px column); Toma's „MICROSCOPICĂ" 117.6px, 0.6px over. So the
// circle is 28 spacing steps — 112 design pixels — down to 18 steps (72,
// PersonnelCard's 4.5rem floor), and the caption less 45 steps in between:
// the figure less the line (1), the two gaps (6 + 4) and THE RESERVE, 41
// steps = 164px for the name column.
// THE RESERVE, WIDENED 2026-10-20 from 36 steps (144px), which held Romanian
// alone (the three reviews of the blog-article lane, measured): an article is
// signed in all five languages, and German „KIEFERORTHOPÄDIE" — Dr.
// Ivașcu-Zugravu's „Fachrichtung Kieferorthopädie" — is 16 mono capitals,
// 156.8px, and 161.3px with SC 1.4.12's letter spacing on; the 144px column
// cut it „KIEFERORTHOPÄD" over „IE" on a real 320 phone. 41 steps is the first
// whole step over 161.3px, and it holds the widest word of every doctor's
// specialty in every language — MEASURED with the real JetBrains Mono on the
// built German article: „KIEFERORTHOPÄDIE" and French „DENTO-ALVÉOLAIRE"
// (which may also break after its hyphen), 16 capitals each, 156.8 / 161.3px;
// Romanian's widest unbreakable run, „PARODONTOLOGIE", 137.2 / 141.1px (its
// widest whole word, „DENTO-ALVEOLARĂ", 15 capitals, breaks after its
// hyphen). tests/unit/blog-article-data.test.ts holds every doctor lib/team
// lists — a post naming them yet or not, since round 3 — in every language,
// to THE BASIS below — 16 characters a word — and the GermanStress story
// measures it in the real face. The circle, MEASURED
// on the built article (Chromium) before → after: on a phone (overlay
// scrollbars) 100 → 80px at a 320 window, the names 144 → 164; 112px,
// unchanged, at 360, 390 and 430; behind a classic 15px scrollbar 85 → 72px
// at 320 (its floor — where, since round 2, the names wrap under it) and 112
// → 101px at 360 (the names 153 → 164); 112px, unchanged, at 390 and 430. So:
// 112px from a 320px figure up (every phone from a ≈ 356px window, ≈ 372
// behind a classic scrollbar), 80px on a real 320 phone (a 288px figure).
// Spelled in SPACING STEPS, never rem (D19's THE STEP, NOT 1.5rem), so inside
// the band scale the circle is still the design's 112 × the design pixel: the
// figure is far over 320 design pixels wherever the band scale applies, so
// there it never gives way.
// UNDER THE FLOOR, THE NAMES WRAP (2026-10-20, round 2 of the reviews — the
// a11y MEDIUM, computed, and the react review's larger default font size,
// measured). The circle stops giving way at 72px, and until round 2 the names
// then took every pixel of the loss — the figure less 116px, with no lower
// bound: 112px at a 228px figure (a 390 phone at 150 % zoom, the real
// gutter), 47 at 163 (390 at 200 %), 12 at 128 (320 at 200 %), the
// specialty's words cut at any letter — the "twenty-five lines" PersonnelCard's
// THE FLOOR was built to stop — and, at a 20px root, a names column 15px wide
// at a 160px figure and the figure scrolling sideways. Since round 2 the
// signature WRAPS (`flex-wrap`) and the names' column GROWS from THE BASIS,
// 40.5 steps — 162px: BESIDE the circle wherever the circle, its gap and the
// basis fit the caption — from a 278px figure (69.5 steps) up, a layout from
// ≈ 310px: a 320 phone zoomed under ≈ 103 %, a 390 one under ≈ 126 % — and
// UNDER it below that, 16px down, at the caption's whole width: 245px in the
// runner's 320 frame (273px), 200 at 390 @150 %, 135 at 390 @200 %, 100 at
// 320 @200 %. WHERE IT SITS BESIDE, NOTHING MOVED: MEASURED (a probe in the
// components runner, the real faces), the circle's box and every line box of
// the name and of the specialty identical to 1/64px against round 1's row at
// every figure where both sit beside — from the threshold to 420px, a half
// pixel apart, and at 599.4, 614.4 and 672 — at 12, 16 and 20px roots, with
// and without SC 1.4.12's overrides, in Romanian, German and French: every
// phone at 100 % (288 to 396px figures), every tablet and, the figure being
// far over 320 design pixels there, THE BAND SCALE.
// THE BASIS IS HALF A STEP UNDER THE RESERVE, measured both ways: a whole
// step under, 160px, left „KIEFERORTHOPÄDIE" BESIDE the circle in a
// 160–161.3px column at 276–277.3px figures and cut it there with SC 1.4.12's
// spacing on (207–208 at a 12px root, 345–346.6 at 20); at THE RESERVE itself
// the circle, its gap and the basis would fill the caption EXACTLY at every
// figure from 280 to 320px — Chromium never wrapped there in a 1/64px sweep,
// but an engine that rounds otherwise could flip the row — so the basis
// keeps 2px of slack and 0.7px over the widest word.
// WHAT IS NEVER CUT: no word of any doctor's specialty, and no word of
// TODAY'S SIX NAMES, is ever cut BESIDE the circle, at any root, with or
// without the overrides (measured); UNDER it only a word wider than the whole
// caption is — „KIEFERORTHOPÄDIE" up to a 184.5px figure
// (189 with the overrides), „PARODONTOLOGIE" up to 165 (169): a 390 phone at
// 200 %, where THE BELT breaks it rather than push the page sideways. The
// thresholds are spacing steps, so a LARGER DEFAULT FONT SIZE reaches them as
// a zoom does (the react review, round 2): at a 20px root the circle sits at
// its 90px floor in figures under 350px and the names wrap under 347.5 — a
// 360 phone's 320px figure and a 320 phone's 280px among them, where round 1
// cut „KIEFERORTHOPÄDIE", and at 280 „FACHRICHTUNG" too, at the page's own
// spacing (measured) — and at a 12px root they wrap under 208.5.
// TODAY'S NAMES, NOT EVERY NAME (round 3, 2026-10-21, the a11y review): a
// specialty is HELD to THE BASIS by tests/unit/blog-article-data.test.ts, a
// name by nothing — tests/unit/team-data.test.ts gives a name no ceiling, on
// purpose (a person cannot be renamed) — and the stories measure two doctors'
// names. Today's widest run, „Cătălina", is 73.7px at the name's 20px and
// 92.9px with SC 1.4.12's 0.12em letter spacing, far inside the basis; a
// longer surname would not be: „Constantinescu" is ≈ 134.9px and ≈ 168.5px
// with the spacing by the review's arithmetic — 137.9 and 171.5px MEASURED in
// the real Source Serif 4 (Chromium, a scratch probe, 2026-10-21) — over the
// 162px basis, so beside the circle THE BELT would cut it at a letter. The
// lever, recorded, not built: a measured name check in a browser test, the
// shape of sections/PostCard's PostCard.titles.test.tsx — every doctor's
// name, in every language, laid out in the real face against THE BASIS with
// the spacing on.
// THE SIZE NEEDS NO CONTAINER (2026-10-20, the react review, measured): the
// width is a share of the CAPTION — `100%`, the figure less 7 steps — never a
// container unit. An engine without container units (Safari and iOS before
// 16) drops a whole declaration that names one, and the circle's only size
// was such a clamp: there it drew 0 × 0 and the portrait vanished. The clamp
// now sets the width alone and the height follows it (`aspect-square`), the
// same box as the container-unit spelling at every width — measured on the
// built article at 273, 288, 309, 324, 336, 351, 372 and 387px figures, the
// two spellings side by side. PostConclusion.test.tsx pins that no rule
// sizing the circle names a container unit.
// THE CIRCLE NEVER PASSES ITS CAPTION (round 3, 2026-10-21, the a11y
// review): the floor, 18 steps, had no cap of its own, so in a caption under
// 72px — a figure under 100px, a layout under about 132 CSS px, roughly a 390
// phone at 300 % zoom — the circle ran past its caption and the page
// scrolled sideways (a 96px figure: a 68px caption, a 72px circle, the
// caption scrolling 72 over 68). Past SC 1.4.10's 320px bar, so no failure;
// but `max-w-full` holds the circle to its caption, and `aspect-square` keeps
// it round: 68 × 68 there. It binds nowhere else, MEASURED (a scratch probe in
// the components runner, the class taken off one render and put back): every
// box of the figure and every line box of the name and the specialty
// identical to 1/64px with it and without it at every figure from 163 to
// 640px, 1/64px apart, at 12, 16 and 20px roots, for a Romanian and a German
// signature, and every 1/8px with SC 1.4.12's overrides on; and in THE BAND
// SCALE at every viewport from 1100 to 2600px, 1462 of them inside the
// regime. The next fixed width a narrower caption meets is the 48px quote
// mark, under a 76px figure — a layout under about 108px, a 390 phone past
// 360 % zoom — recorded, not capped.
//
// ── THE CROP — PersonnelCard's FIGURE, its phone half, unconditional here:
// the 900 × 1200 cutout (lib/team's `cutout`, the doctor from the waist up on
// a transparent ground) drawn 165 % of the circle's width, its left edge
// 32.5 % and its top 18 % of the circle beyond it — the circle shows the
// file's square (177, 98)–(723, 643), head and shoulders (measured in the
// suite). `variant="plain"` with the geometry spelled here (ui/Image's rule
// for a consumer whose geometry differs) and `placeholder="empty"` explicit
// — a blur would smear the transparent ground (Image D4); `h-auto` and
// `object-contain` are the `artwork` row's, `max-w-none` lets the picture
// overrun its cell (no `max-w-full` beside it on the picture — the circle's
// own is another element's: two `max-width` utilities on ONE element would be
// decided by the stylesheet's order).
// `alt=""` IS THE DECISION, not a missing string: the name beside the photo
// IS the identity, so a portrait alt would be read twice in a row
// (PersonnelCard D3's adjacent-name rule, WAI's image-with-an-adjacent-text-
// alternative). Lazy: the conclusion closes the article, never the first
// screen.
//
// ── THE `sizes` (CIRCLE_SIZES): `(min-width: 70rem) and (pointer: fine) 14vw,
// 11.55rem`, the picture's BOX — 165 % of the circle, never the circle:
//   · everywhere but the band scale the circle is 7rem, so the picture is
//     11.55rem, 184.8px at the default root (smaller only where the circle
//     gives way, under a ≈ 356px window, ≈ 372 behind a classic scrollbar — a
//     file a little larger than the box, never a wrong one);
//   · inside THE BAND SCALE (a mouse or trackpad, an engine that registers
//     custom properties, a column of max(56rem, 896px) — ui/Container's
//     bandScaleClasses, worn by PostPage) the circle is 112 design pixels and
//     the picture 184.8 × column / 1106: with ui/Container's 10vw gutters a
//     56rem column is a 70rem window and the column 0.8 × the window, so the
//     picture is 184.8 × 0.8 / 1106 = 13.37 % of the window — `14vw`, the
//     ceiling (PersonnelCard's PORTRAIT_SIZES shape: ceil(100 × 184.8 × 0.8 /
//     1106)); past the band's 96rem cap (a 1920px window) the picture holds
//     at 256.7px while 14vw grows on — 268.8 at 1920, 358.4 at 2560 —
//     a file a step larger, never a wrong box; between the 70rem window and
//     the band's step behind a classic scrollbar (1120–1139px) a mouse is
//     told 14vw of a picture still 184.8px wide, 14 to 15 % under;
//   · THE SPACE BEFORE `14vw` IS LOAD-BEARING (PersonnelCard's THE SPACE
//     BEFORE `21vw`): next/image keeps the candidates from 640 × 0.14 = 89.6px
//     up — the 16 … 64 widths go, which no box here can use (the least this
//     picture is ever drawn at the default root is 118.8px, the 72px
//     circle's; at a 12px root the floor draws it 89.1px, still within the
//     smallest candidate kept, 96w).
// KEEP IN SYNC with ui/Container's THE BAND SCALE (its REFERENCE 1106, its
// 56rem step, its 96rem cap, its `scalable:` pointer gate), with THE CIRCLE's
// 28 steps and with THE CROP's 165 % — tests/unit/design-scale.test.ts derives
// every number of the string from those, read where they live, beside
// PersonnelCard's two.
//
// ── THE BAND SCALE: worn by sections/PostPage on its rhythm box, never here
// (the contract's §2); this figure inherits the remap, so every length above
// that is a theme step — the line's 1, the gaps, the mark's 12, the circle's
// 28, the reserve and the basis, the 20px quote, the name's and the
// specialty's sizes —
// is redrawn in the design pixel on a laptop or desktop. The `100%` in the
// circle's clamp and the one in its `max-w-full` are the only CSS-pixel
// lengths, and both are the caption itself.
//
// ── ZERO ISLANDS OF ITS OWN (§16): no 'use client', no hook, no state, no
// handler. ui/Image brings its optimizer's small island with the photo, as on
// every page with a picture. PostConclusion.test.tsx pins the directive's
// absence and the import surface from the source text.
//
// ── THE NATIVE SURFACE (2026-10-20, the react and typescript reviews; the
// `title` since round 3, 2026-10-21): the figure's native props ride, less
// what would unmake it — `children` and `dangerouslySetInnerHTML` (the
// content is `text` and `doctor`, and React throws on markup set beside
// children, after the types let it through), `role` (a `role="presentation"`
// leaves no figure at all), `aria-label` / `aria-labelledby` (either would
// name the figure in place of its caption — the name HTML-AAM's rule gives
// it, which Chromium 151 does not apply, measured 2026-10-20; Firefox and
// WebKit not measured; a screen reader still reads the caption inside the
// figure) and `title`, which Chromium 151 DOES name a figure by — there its
// only name: the shipped figure is named "", and with `title="Concluzia"` it
// is named „Concluzia" (round 3's three reviews, measured; sections/
// PostPhoto's THE HEADING measured the same, and refuses it there) — and
// which would hang a tooltip over the whole block. The last four are also
// reset after the spread: a wider object can smuggle them past the Omit, and
// TypeScript checks no hyphenated JSX attribute against a props type that
// lacks it, so a WRITTEN `aria-label` compiles too — sections/PageHero's
// belt, every case tested (a written `title`, with no hyphen, is refused by
// the type itself: its own test).
//
// ── RECORDED, the owner's levers, none built: the reserve (41 steps) and the
// floor (18) — one number each in CIRCLE — and the basis (40.5) in NAMES; the
// quote's step and weight (`text-xl font-medium`); the mark's size
// (`size-12`) and its half turn — the glyph is Lucide's `quote`, and a mark
// drawn in the display face's own “ is one glyph file away.

/** The article's closing words and who said them — every string FINISHED
 *  (§8.1). Exported for sections/PostPage, which takes them whole. */
export type PostConclusionOwnProps = {
  /** The doctor's closing words — finished text, one paragraph. */
  text: string;
  /**
   * Who said them: the name (the caption's first line for a screen reader,
   * painted under the specialty), the specialty, and the photo — the doctor's
   * transparent cutout under public/images/ (lib/image-path's `ImagePath`)
   * with its INTRINSIC pixel size, the optimizer's srcset input (§11). No alt:
   * the name beside it is the identity (THE CROP's last paragraph).
   */
  doctor: Readonly<{
    name: string;
    position: string;
    photo: Readonly<{ src: ImagePath; width: number; height: number }>;
  }>;
};

export type PostConclusionProps = PostConclusionOwnProps &
  // THE NATIVE SURFACE (the header): `children` is Omitted (the
  // SectionHeading precedent) — content arrives as `text` and `doctor`, and
  // without the Omit a caller could nest something, type-check, and watch it
  // vanish — and so are `dangerouslySetInnerHTML`, `role`, the two ARIA names
  // that would name the figure in place of its caption, and the `title` that
  // Chromium 151 names it by; the last four are reset after the spread too.
  Omit<
    ComponentPropsWithRef<'figure'>,
    | keyof PostConclusionOwnProps
    | 'children'
    | 'dangerouslySetInnerHTML'
    | 'role'
    | 'title'
    | 'aria-label'
    | 'aria-labelledby'
  >;

/** THE LAYOUT: the figure's grid — THE LINE's track, then the words; the
 *  quote mark sized, filled and turned from here (THE QUOTE MARK). No
 *  container: nothing inside it queries one (THE SIZE NEEDS NO CONTAINER). */
const FIGURE =
  'grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-5 [&>svg]:size-12 [&>svg]:fill-current [&>svg]:rotate-180';

/** THE LINE — its colour, round ends and one-step thickness KEEP-IN-SYNC with
 *  sections/BeforeAfter's (tests/unit/article-line-sync.test.ts); standing
 *  the figure's whole height, its form this file's own. */
const LINE = 'w-1 self-stretch rounded-full bg-(--ribbon)';

/** Where THE LINE stands: down the three rows. */
const LINE_PLACE = 'row-span-3';

/** THE QUOTE MARK's paint — the thread's lilac, and the reader's GrayText in
 *  forced colours (its size, fill and turn ride FIGURE). */
const MARK = 'text-(--ribbon) forced-colors:text-[color:GrayText]';

/** THE WORDS, with THE BELT. */
const QUOTE = 'text-xl font-medium text-ink-strong wrap-anywhere';

/** THE SIGNATURE: the photo and the names, side by side — and the names under
 *  the photo where the caption cannot seat THE BASIS beside it (THE CIRCLE's
 *  UNDER THE FLOOR, THE NAMES WRAP). */
const SIGNATURE = 'flex flex-wrap items-center gap-4';

/** THE CIRCLE: PersonnelCard D20's tint and clip, 28 steps giving way to 18
 *  so the names keep THE RESERVE, 41 — the caption's width less the reserve
 *  and the signature's gap, a percentage and never a container unit — and
 *  never wider than the caption itself (`max-w-full`), the height following
 *  the width (THE CIRCLE's size paragraphs). KEEP IN SYNC with
 *  PersonnelCard's CIRCLE. */
const CIRCLE =
  'relative aspect-square w-[clamp(calc(var(--spacing)*18),calc(100%_-_var(--spacing)*45),calc(var(--spacing)*28))] max-w-full shrink-0 overflow-hidden rounded-full bg-line-subtle supports-[color:color-mix(in_lab,red,red)]:bg-[var(--card-tint,var(--color-line-subtle))]';

/** THE CROP: PersonnelCard's FIGURE, its phone half — 165 % of the circle,
 *  32.5 % out to the left and 18 % above. KEEP IN SYNC with its FIGURE. */
const CROP =
  'absolute left-[-32.5%] top-[-18%] h-auto w-[165%] max-w-none object-contain';

/** The names: the name first in the DOM, the specialty painted above it — a
 *  column GROWING from THE BASIS, 40.5 steps (162px), half a step under THE
 *  RESERVE: beside the circle while the circle, its gap and the basis fit the
 *  caption, under it at the caption's whole width below that (THE CIRCLE). */
const NAMES =
  'flex min-w-0 grow basis-[calc(var(--spacing)*40.5)] flex-col-reverse gap-1';

/** THE BELT, on both lines of the signature. */
const BELT = 'hyphens-none wrap-anywhere';

/** THE `sizes` (derived in the header). The space before `14vw` is
 *  load-bearing. */
const CIRCLE_SIZES = '(min-width: 70rem) and (pointer: fine) 14vw, 11.55rem';

export function PostConclusion({
  text,
  doctor,
  className,
  ...rest
}: PostConclusionProps): ReactElement {
  return (
    // THE NATIVE SURFACE (§6.8): the spread first; then a `role`, a name or
    // a `title` that slipped past the Omit — written, or in the spread of a
    // wider object — is reset: a figure, its caption the only name HTML-AAM's
    // rule gives it; then the figure's own classes, and the caller's
    // className last — placement only.
    <figure
      {...rest}
      role={undefined}
      title={undefined}
      aria-label={undefined}
      aria-labelledby={undefined}
      className={cx(FIGURE, className)}
    >
      <span aria-hidden="true" className={cx(LINE, LINE_PLACE)} />
      <QuoteMark className={MARK} />
      <blockquote>
        <p className={QUOTE}>{text}</p>
      </blockquote>
      <figcaption className={SIGNATURE}>
        <div className={CIRCLE}>
          <Image
            variant="plain"
            src={doctor.photo.src}
            width={doctor.photo.width}
            height={doctor.photo.height}
            alt=""
            placeholder="empty"
            sizes={CIRCLE_SIZES}
            className={CROP}
          />
        </div>
        <div className={NAMES}>
          <Heading size="title" className={BELT}>
            {doctor.name}
          </Heading>
          <Eyebrow className={BELT}>{doctor.position}</Eyebrow>
        </div>
      </figcaption>
    </figure>
  );
}
