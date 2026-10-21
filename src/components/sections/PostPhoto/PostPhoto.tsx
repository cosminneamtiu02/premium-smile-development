import type { ComponentPropsWithRef, ReactElement } from 'react';
import { Heading } from '@/components/ui/Heading/Heading';
import { Image } from '@/components/ui/Image/Image';
import { cx } from '@/lib/cx/cx';
import type { ImagePath } from '@/lib/image-path/image-path';
import {
  hasVisibleLetter,
  hasVisibleText,
  hasVisibleWord,
  spelled,
} from '@/lib/visible-text/visible-text';

// sections/PostPhoto — THE BLOG PHOTO: one picture inside a blog article, a
// heading over it and a note under it, each optional. The owner, verbatim
// (2026-10-15): "now this section with before and after is to be derived from
// another section which is just like a "blog image section" the blog image
// section has to have optionally a heading or not the image as it is now on
// inaite dupa as shape but wide as the article as it is a single standing
// blog section and the text with note beneath also optionall" — and of the
// note: "each photo has to have a max 2 row grays text (so unemphasised and
// not standard text like here: […]) starting with "Note: ". i want abosultley
// no emphasis here, jsut the gray text on a maximum of 2 rows" — and of the
// instances: "also add an instance of the single blog image with note, with
// heading and no not and without no heading nor not and with note no
// heading." The text he pointed at is a doctor card's quote (sections/
// PersonnelCard's <blockquote>, the credo ink — THE NOTE, below).
//
// ── TIER: THE SHARED-COMPOSITION SUB-KIND (§4) — DUMB PROPS-IN. It composes
// two atoms, ui/Heading and ui/Image, binds no site data and calls no t(): the
// heading, the alt and the note arrive FINISHED (§8.1) — the note with its
// lead-in already written by the route („Notă: …", „Hinweis: …"). Two
// consumers: the article's measure places a photo as a block of its own
// (sections/PostPage), and sections/BeforeAfter is rebuilt on it, two photos
// side by side — a section composing another's PUBLIC component (§4), never
// its internals. Reuse never promotes a composite (§4).
//
// ── THE FOUR INSTANCES the owner listed — heading and note, heading alone,
// note alone, neither — are this ONE component with its props present or
// absent: no mode prop, no variant (§6.2, slots over modes). ABSENT OR EMPTY,
// NOTHING (sections/PriceList's `note` precedent): an empty string prints no
// caption and no paragraph and opens no gap, so a figure never stands named
// by nothing over an empty row. A composer that counts a photo's parts
// (THE SUBGRID) counts a string the same way: present when non-empty. AND
// PRESENT, IT SHOWS: a heading or a note that is there and not empty — any
// value the render prints — must show what it is for, or the render throws
// a RangeError naming the picture and quoting the part by lib/visible-text's
// `spelled`: the heading a letter or a digit (`hasVisibleWord`, the label
// rule lib/blog-article applies to every heading — „2019" names a year, „."
// names nothing, SC 2.4.6), the note any character that shows
// (`hasVisibleText`, so „…" passes). So a space, a zero-width space or a
// soft hyphen never prints an empty row, and a mark alone never stands as a
// caption. REFUSED, NEVER DROPPED — the rule round 3's React review set
// (2026-10-20), built on round 2 of lib/visible-text's accessibility review
// (2026-10-21): such a part read as absent here alone would print fewer rows
// than a composer counted — sections/BeforeAfter counts each part as this
// section prints it — so the condition that prints a part is the one it
// always was, and a part it would print either shows or stops the build.
// The data refuses each first, at build (lib/blog-article).
//
// ── THE LAYOUT: the root <figure> is `grid grid-cols-1 gap-4` — ONE column
// (`minmax(0,1fr)`, so a long word can never push it open, PostCard's reason)
// and DOM ORDER IS READING ORDER, the order the eye meets: the heading, the
// picture, the note. The heading stands 16px over the picture — where the
// before/after captions stood — and the note 16px under it. No `@container`
// here: nothing inside asks this box's width (the picture's 4:3 box takes
// whatever the column gives), and the box a composer places it in decides.
//
// ── THE HEADING (when given): the figure's <figcaption>, dressed as
// ui/Heading's `subhead` step (24px semi-bold — the article's subheadings'
// step) through `asChild`, so the caption element stays the host: sections/
// BeforeAfter's caption recipe, moved here whole. It is THE FIGURE'S CAPTION,
// and HTML-AAM's rule makes a <figcaption> its <figure>'s accessible name — a
// rule Chromium 151 does not apply: its own accessibility tree names such a
// figure "" (measured 2026-10-20 through the DevTools protocol, the same
// probe naming a <table> by its <caption> and a <fieldset> by its <legend>;
// Firefox and WebKit not measured). A screen reader still reads the caption
// inside the figure, in reading order. NOTHING ELSE MAY NAME IT: an
// `aria-label` or an `aria-labelledby` would name the figure in place of its
// caption — the accessible-name computation reads both before it — and a
// `title` names it in Chromium 151, which names a figure by no caption, with
// a caption and without one (measured); under HTML-AAM's rule, which
// Playwright's engine applies, a `title` is only the last fallback, after
// the caption. A `role` would make it something else. AND NOTHING MAY HIDE
// IT: an `aria-hidden` or an `inert` would take the informative picture, its
// alt, the caption and the note out of the accessibility tree while every
// one of them stays drawn — the reason a `role` is refused, and a stronger
// one. So the props refuse all six and the root resets them after the spread
// (THE NATIVE SURFACE, at the root — sections/PageHero's belt; until the G2
// review of 2026-10-20 a caller's name and role reached the figure,
// measured, a `title` until its round 2, and an `aria-hidden` or an `inert`
// until its round 3). It is a figure's LABEL, not an outline slot —
// the atom invents no heading role, so the article's outline stays its <h1>
// and the prose's <h2>s. START-ALIGNED, the owner's "heading left oriented"
// of the before/after: a caption is display text, outside globals.css's
// p/li/blockquote alignment fence, so it would INHERIT a centring wrapper's
// alignment — `text-start` ON THE ELEMENT says it (§15.15 b; logical, never
// left, §3). NEVER HYPHENATED, `hyphens-none` — A CAPTION NEVER SPLITS A WORD
// (the round-2 G2 review, 2026-10-20): the owner's rule for every title on
// the blog since 2026-10-15, worn by PostProse's <h2>, PostCard's title,
// PostHeader's <h1>, PostConclusion's name and GalleryCard's captions — and
// the site-wide `hyphens: auto` (§15.14) is for PROSE. MEASURED before it was
// added — Chromium 151 on macOS, the real face, every caption the articles
// ship under its page's `lang`, on 3342 lines from 100 to 720px wide (a
// quarter pixel apart, and the exact column of every window from 280 to 860
// with and without a classic scrollbar). Inheriting `auto`, captions split a
// word at a syllable only on lines of 222px or less — the French „atten-dons"
// from 143 to 222px, the English „wait-ing" from 143.75 to 170.25 — under
// every line a caption is drawn on at a phone's default zoom (a 280 window's
// 248px column, a 320 one's 273px behind a classic scrollbar, a before/after
// half's 230px), but a 390 window zoomed to 200 % draws a 163px column and
// split both. Turned off, no shipped caption changes its line count at any
// width from 100 to 720px but two, both a lone photo's: the German „Hier
// erwarten wir Sie" from 125.5 to 152.75px of line and the Italian „Ti
// aspettiamo qui" from 102.75 to 146.75px set on three lines with their
// words whole where hyphenated they took two (measured again 2026-10-21, a
// quarter pixel apart, Chromium 151: on either side of each band the caption
// takes as many lines either way). A phone draws those lines only zoomed —
// and in a BAND of zoom, never past a threshold: a window W at a zoom z has
// a column of W/z − 32 (the gutter's 1rem floor a side), so the zoom is W ÷
// (line + 32), and the German caption takes its third line from about 173 to
// 203 % on a 320 phone and 152 to 178 % on the 280 Fold cover screen, the
// Italian one from about 179 to 237 % and 157 to 208 % (a 320 window at 200 %
// draws a 128px column, inside both). No before/after half's caption
// changes at any width, so the pair's frozen phone look (sections/
// BeforeAfter's THE PHONE, AS IT WAS) moves by no pixel.
// PostPhoto.headings.test.tsx lays out every caption the articles ship on
// the column of every window from 280 to 440 — every phone held upright, the
// 280 Fold cover screen first, with and without a classic scrollbar — and
// on every side-by-side half, and finds each word whole. THE BELT,
// `wrap-anywhere` (SC 1.4.12, PostCard's THE TITLE'S BELT), now the one
// thing that may break a caption's word: one wider than its whole line by
// itself — at 24px under text spacing's 0.12em a letter, a large default
// font or a high zoom — would otherwise run out of its box; `overflow-wrap:
// anywhere` breaks only such a word, after spaces have had their chance, and
// breaks it at any letter with NO hyphen drawn (measured, it breaks a
// shipped caption's word only on a line of 153px or less: the German
// „Untersuchung" needs 153). A MARKED break is not the belt's to give: under
// `hyphens: none` the engine ignores a soft hyphen (U+00AD) written into the
// copy (CSS Text 3), so a break the copy marks needs the property's manual
// value — `hyphens: manual` — with the soft hyphen in the caption
// (PostCard's THE LEVER, NAMED, NOT TAKEN). AND `self-end` —
// THE SUBGRID's: alone it changes nothing (the heading's row is the
// heading's own height).
//
// ── THE CAPTION'S LOOK — AN OPEN QUESTION FOR THE OWNER (the G2 review,
// 2026-10-20; no class here changes until he answers). The heading wears the
// look of the article's <h2>s — ui/Heading's `subhead` step on the same ink,
// and their `text-start`, their belt and, since the review's round 2, their
// `hyphens-none` (THE HEADING); its one class of its own, THE SUBGRID's
// `self-end`, changes nothing alone — and stands where one stands: 40px under
// the block before it (sections/PostPage's gap between blocks) — 24px under
// THE LINE for the after half of a pair stacked on a phone (sections/
// BeforeAfter's air) — and 16px over what it heads, sections/PostProse's 40
// over and 16 under a subheading. The demo article as shipped shows TWELVE
// LINES OF ONE LOOK: six are <h2>s in the outline, six are figure captions
// outside it (two photos' and two before/after pairs' halves) — the H key
// and VoiceOver's headings rotor skip those six, but a screen reader still
// meets each one inside its figure, in reading order. The four findings that
// raised it split two and two: two read it as an SC 1.3.1 failure, the F2
// pattern — a presentation that says "heading" with no markup that says it —
// and two as correct markup that passes, a <figcaption> being the figure's
// own caption, read inside it. The shared step is a recorded decision
// (CLAUDE.md §15.24's amendment of 2026-10-14: "The before/after captions
// wear the same step on their <figcaption>s") and the look is the owner's
// article, so the lane's lead puts THREE roads to him — (a), (b) and the two
// together, (c) — each a change in this file. Every footprint below was
// MEASURED on 2026-10-21 by making the change in a probe and running the
// suites; a line number is where to look that day, never an anchor (§17.7):
//   (a) RECOMMENDED — a caption's own look: ui/Heading's `title` step, 20px
//       at the regular weight on its 28px line, PostConclusion's signature
//       (the doctor's name under the closing words) — a label, no longer a
//       subheading's twin. It restyles sections/BeforeAfter's captions with
//       these, the one recipe they share, and so it CROSSES THE OWNER'S PHONE
//       FREEZE (BeforeAfter's THE PHONE, AS IT WAS — "do not rework nothing
//       yet on phone"): BeforeAfter.scale.test.tsx's TODAY table holds every
//       heading box 32px tall, and on the `title` step's 28px line every box
//       under a heading moves up 4px for each heading above it — MEASURED on
//       the stacked pair at the table's four widths, the after picture 8px
//       higher and the pair 8px shorter. Its footprint beside the class here,
//       RED: PostPhoto.test.tsx's HEADING_TOKENS (l. 121) and its computed
//       24px / 32px / 600 test (l. 357), PostPhoto.headings.test.tsx's first
//       case, 'lays them out as the page does …', at its 24px and 600 checks
//       (l. 271–272), and the 24px both scale suites expect — PostPhoto's
//       and BeforeAfter's HEADING_FONT: every window case of the first, 31
//       cases of the second, its TODAY table among them — 50 tests in four
//       files. STALE, still green: that headings case's title (l. 239) and
//       its `600 1.5rem` font load and `document.fonts.check` (l. 192, 244 —
//       one variable file serves every weight, so both pass with a wrong
//       size and weight), PostPhoto.stories.tsx's `heading` control
//       description and GermanStress docstring (l. 274, 366),
//       BeforeAfter.stories.tsx's GermanStress docstring (l. 592),
//       ui/Heading.test.tsx's figcaption test (l. 609), ui/Heading.tsx's
//       'subhead' JOINED list, which names this heading a wearer, and
//       CLAUDE.md §15.24's caption sentence. AND IT MOVES PIXELS: every
//       captioned cell of Sections/PostPhoto, Sections/BeforeAfter,
//       Sections/PostPage and Pages/BlogArticle. The subgrid and the 16px
//       over the picture stand as they are.
//   (b) the look kept, the markup raised: a real heading inside the
//       <figcaption> — it MOVES NO PIXEL (measured on the same four widths:
//       Tailwind's preflight zeroes a heading's margins and gives it its
//       parent's size and weight; BeforeAfter.scale.test.tsx's TODAY table
//       stays green at either level) — so every line that looks like a
//       subheading is one to the H key and the rotor. ITS LEVEL is a question
//       of its own. AS AN <h2>, read on the demo article: each caption
//       becomes a section of the article beside the prose subheadings — six
//       more. Five of them hold nothing but their own picture, the next
//       heading straight after it („La consultație", and the pairs' halves
//       „La sosire" and „În cabinet", „Înainte" and „După"); the sixth, „Aici
//       te așteptăm", the article's last caption, takes the closing words
//       under it — the conclusion, which has no heading of its own, falls
//       under „Aici te așteptăm" in the outline; and in a headings list
//       „Înainte" and „După" read with no subject — before and after what? —
//       weak under SC 2.4.6, headings that describe their topic, which
//       argues for <h3>, where „Când o schimbi" above them gives it. AS AN
//       <h3> it needs ONE of two things: a `headingLevel` prop, or a fixed
//       <h3> and a rule on the data — lib/blog-article refusing a captioned
//       photo or pair before the article's first <h2> — or a photo placed
//       before the first subheading would skip from the <h1> to an <h3> (the
//       demo's first photo stands there, today with no heading). Its
//       footprint, RED AT EITHER LEVEL: the "invents no heading role" tests
//       of PostPhoto.test.tsx (l. 331) and BeforeAfter.test.tsx,
//       PostPage.test.tsx's outline test (it reads every heading role: the
//       <h1> and the prose's <h2>s, nothing else), and
//       PostPhoto.headings.test.tsx's five language cases and its teeth case
//       — their reader, PostCard.fixtures' `unitsAcrossLines`, wants the
//       caption's one text node and meets the heading element, so they would
//       read the heading inside the caption. RED AT <h2> ONLY: the article
//       route's two page stories, Article.stories.tsx in
//       app/[locale]/blog/[slug]/, which hold the article's only <h2>s to the
//       prose subheadings (l. 223–234 — twelve found against six); at <h3>
//       they stay green. TURNED FALSE AT EITHER LEVEL: the comment there ("a
//       photo's heading is its figure's caption, never an outline heading"),
//       THE HEADING's "a figure's LABEL, not an outline slot" above, and the
//       same in BeforeAfter.tsx's WHAT THIS SECTION DOES NOT OWN. The
//       caption stays the figure's name only under HTML-AAM's rule, which
//       Chromium 151 does not apply (THE HEADING); a screen reader still
//       reads it inside the figure.
//   (c) THE TWO TOGETHER, (a)+(b): a real <h3> on ui/Heading's `title` step
//       — the one <h3> road on which the look and the level agree: CLAUDE.md
//       §15.24 sets `<h3>` = `title`, while (b) kept at <h3> gives an <h3>
//       the <h2>s' exact `subhead` look (at <h2>, (b)'s look and level agree
//       as the article's own subheadings do, at the outline's cost above).
//       Its footprint is (a)'s and (b)'s together — the level's question
//       with it — and on a phone it costs (a)'s 4px a caption, the 28px line
//       in place of the 32px.
//   THE LEVER BEHIND ALL THREE — recorded, NOT built unasked: an
//   `aria-labelledby` on the figure pointing at its caption, the id from
//   React's `useId()`, would name the figure by its heading in Chromium 151
//   too — measured: the same probe names a <figure> by an `aria-labelledby`
//   (Firefox and WebKit not measured), the accessible-name computation
//   reading it first. The section's own id would take the place of the
//   root's reset of a caller's `aria-labelledby` (THE NATIVE SURFACE).
//   sections/PostPage already calls `useId()` in a server component; this
//   section's ZERO ISLANDS test, which refuses every hook, would have to
//   allow that one.
//
// ── THE PICTURE: a `relative aspect-[4/3]` box holding ui/Image's `framed`
// situation on `fill` — the photo covers the box, crops the overflow and wears
// its own 12px corner (Image D2, D3) — the before/after's shape exactly: the
// owner's "the image as it is now on inaite dupa as shape but wide as the
// article". The box is `relative` because `fill` places the picture against
// the nearest positioned ancestor; a grid item with an aspect ratio is sized
// like a block in the inline axis, so the box spans the figure's column and
// takes three quarters of that as its height. The ALT arrives as given and
// DESCRIBES THE PICTURE (the data's rule, lib/blog-article's: a blog photo is
// informative). THE HOLE the type leaves is an alt that describes nothing —
// a `string` is all it asks — so the alt must hold A VISIBLE LETTER, of any
// script: lib/visible-text's `hasVisibleLetter`, the letter rule
// lib/blog-article's `parseAlt` applies too, never a narrower one (since the
// round-3 review, 2026-10-20 — until then a copy of the section's own,
// `\p{L}` alone, which counts the four Hangul fillers, U+115F, U+1160,
// U+3164 and U+FFA0: letters drawn as nothing, so an alt of a filler and a
// dot passed as words). THE SECTION APPLIES THE LETTER RULE ALONE, never the
// data's whole check — `parseAlt` also asks for a TRIMMED text — so it is
// WIDER than the data by exactly the alts with white space at either end:
// for any one letter, the 50 two-character alts that set it beside one of
// the 25 characters `trim()` removes, before it or after it, are refused by
// the data and let through here — and never the other way round, the data
// asking for the letter too (counted over every code point, 2026-10-21). An
// empty alt, spaces alone, an invisible character (a zero-width space, a
// soft hyphen, a word joiner, a Hangul filler), a mark or a number alone
// describe nothing — and so does an alt that is no string at all, which a
// pattern would read as the word "undefined" or "null" (refused by its type
// first, and here at render for a value that slipped past it). MEASURED in
// Chromium 151's own accessibility tree (2026-10-20), only the empty one,
// alt="", takes the photo OUT of the tree, as decoration; every other one
// measured — spaces, a zero-width space, a soft hyphen, a dot — keeps it IN
// as an image whose name says nothing about the picture.
// So to a screen reader the photo is unnamed or decoration while the
// article still shows it.
// Refused at render — which on this site is `next build` — with a RangeError
// that quotes the picture's path and its alt by lib/visible-text's `spelled`,
// the site's one speller for an error message: every character a reader
// would not see by its code point — `"\u{200B}"`, a line feed `"\u{000A}"`,
// never a quote that looks empty — and an alt that is no string named by its
// type, „not a string: <object>", never by running its own code, as `String()`
// would run an object's own `toString` (the G2 review, 2026-10-20, its round
// 2, which widened the check from a blank alt to the data's letter, and its
// round 3, the shared rule and the quoting; the speller shared since round 1
// of lib/visible-text's review, 2026-10-21 — until then this section kept a
// copy of sections/BeforeAfter's, in sync by hand, which wrote a line feed as
// JSON's two-letter escape and left NEL (U+0085) and the braille blank
// (U+2800) raw). No caller needs a decorative photo: the data refuses such an
// alt for every photo and every before/after half, and the article's one
// picture that may be decoration, a stand-in cover, is sections/PostCover's.
// LAZY, always (ui/Image's default): a blog photo sits below the article's
// cover, never its LCP.
//
// ── THE NOTE (when given): a plain <p>, the owner's "gray text" with
// "abosultley no emphasis". Its INK is the credo ink of the quote he pointed
// at — `text-ink-faint`, `--ink-faint` #766f69, §15.1's 19th role: 4.70:1 on
// the article's page ground (`--page` #faf9f7), body text's 4.5:1 met, and
// barred from sections/TintedBand's 30 % lilac (3.24:1), where no article
// stands (tests/unit/ink-faint-census.test.ts names this file a wearer on the
// page ground). `contrast-more:text-ink` is sections/DoctorProfile's
// high-contrast lift — the full ink, 14.07:1, for a visitor whose system asks
// for more contrast (`prefers-contrast: more`); the default look is the
// owner's grey, untouched. NO EMPHASIS, so nothing but the ink and the size:
// the body's face, its regular weight, upright, no key word, no quotation
// marks, no underline — and start-aligned by the site's base rule, never
// justified (the doctor card's quote is justified; a note is no quote). ITS
// SIZE is the base step, 16px, ONE STEP UNDER the article's 18px reading text
// (sections/PostProse): a note is secondary to the prose around it. THE
// LEVER: the quote he pointed at reads one step up, 18px — one token. THE
// BELT is the heading's again, `wrap-anywhere`. A <p>, NEVER A FIGCAPTION: a
// figure has one caption, the heading's place; a note is part of what the
// figure shows, read after its picture — and it would make a poor caption,
// under HTML-AAM's rule the figure's name („Notă: …"), on the instances
// without a heading. ui/Text does not carry it: its ink axis has no faint
// tone, and restyling an atom through
// its className is barred (§6.8) — a faint tone there is the lever the day a
// second note-like text appears, an atom change outside this section.
//
// ── TWO LINES AT MOST is a rule on the DATA, not on this box, and it holds AT
// THE DEFAULT TEXT SIZE: a test of the blog's own (every note it ships, in
// every language, laid out at the narrowest line it is drawn on, at the 16px
// root) holds it. A reader's larger default takes more lines and loses
// nothing: a 20px root draws the note at 20px in a 265px column at a 320
// window behind a classic scrollbar, where a note that fills two lines at the
// default takes three (the G2 review, 2026-10-20). This section clamps
// nothing on purpose. A CSS line clamp would hide the end of a longer note
// from sighted readers while a screen reader still reads all of it, and under
// a reader's text spacing (WCAG 2.2 SC 1.4.12 — no loss of content) it would
// cut a note that fits on two lines at ordinary spacing.
//
// ── THE SUBGRID — what sections/BeforeAfter, rebuilt on this section, relies
// on. It places two photos side by side and hands each, through `className`
// (placement only, §6.8), a row span of as many rows as the photo has parts
// (the picture, plus the heading, plus the note) and the subgrid's row tracks
// (`grid-template-rows: subgrid`), from the pair's own side-by-side step. Both
// figures then lay their parts on the PAIR's row tracks: one row holds the two
// headings, one the two pictures, one the two notes — so the two pictures are
// level whatever each heading's and each note's line count. In that shared
// row the heading's `self-end` seats the SHORTER heading on its own picture,
// 16px above it, as the taller one is; the notes' first lines stand level
// under the pictures. Nothing here fights it: the figure declares no row
// template of its own and places none of its parts, so each lands in the next
// row in DOM order. The rows are shared only part for part: a heading on one
// side only would put the other side's picture in the heading row. THE GAP,
// MEASURED in Chromium: inside the subgrid the figure keeps its own 1rem
// between its parts whatever the pair's row gap — 0, 16 or 24px — the engine
// spreading the difference over the parts' inner edges; where the two photos
// span DIFFERENT rows (a note on one side only) that note keeps the 1rem
// while the pair's row gap is no wider than it — 16px under its picture at a
// 0, 4, 8, 12 or 16px gap — and a wider gap adds half its excess: 18px at 20,
// 20px at 24, 24px at 32 (measured again 2026-10-20, in the real face; the
// pictures level throughout). PostPhoto.test.tsx holds the equal spans at all
// three gaps and the different spans at 0 and 1rem.
//
// ── THE `sizes` (POST_PHOTO_SIZES), DERIVED — four answers, the first that
// matches wins (`sizes` chooses the FILE; CSS sizes the box). The photo spans
// THE MEASURE (sections/PostPage: `max-w-2xl`, 42rem, centred in ui/
// Container's column), so it is min(column, 42rem) wide — and inside THE BAND
// SCALE the measure's 672 design pixels:
//   · `(min-width: 70rem) and (pointer: fine) 49vw` — THE BAND SCALE
//     (ui/Container's paragraph of that name; sections/PostPage wears it and
//     this section inherits it): on a mouse or trackpad from the window whose
//     column is the scale's 56rem step — 56 / 0.8 = 70rem, the gate
//     PersonnelCard's CUTOUT_SIZES and sections/BeforeAfter ask with — every
//     length of the article is drawn in a design pixel s = min(column, 96rem)
//     / 1106, so the photo is 672s = 672 × 0.8W / 1106 = 48.61 % of the
//     window: ceil(100 × 672 × 0.8 / 1106) = `49vw`;
//   · `(min-width: 52.5rem) 42rem` — THE MEASURE'S CAP outside the scale
//     (every touch screen at any width, a mouse under 70rem): the column is
//     80 % of the window from 37.5rem (ui/Container's THE PHONE GUTTER) and
//     reaches 42rem at a 52.5rem window (42 / 0.8) — in rem, so it follows
//     the root as the measure does;
//   · `(min-width: 37.5rem) 80vw` — the column under the cap, 10vw a side;
//   · `90vw` — a phone's column, 5vw a side up to 30rem.
// THE BOUNDS, each a file a little larger or smaller than the box could use,
// never a wrong box: (1) past THE BAND SCALE's cap — the 1920 window's 1536px
// column, ≈ 1939px behind a classic scrollbar — the photo holds at 933px while
// `49vw` grows on (1254px at a 2560 window, × 1.34); (2) a classic scrollbar
// moves the scale's step to a ≈ 1139px window, so between 1120 and 1139 a
// mouse is told 49vw of a photo still 672px wide — at most 18.3 % under, at
// 1120 (548.8px), where the files a 1× and a 2× screen pick, 640 and 1200,
// are 5 % and 11 % under the box; (3) `sizes` cannot ask the scale's
// `@supports` gate, so in an engine that refuses it (Safari before 16.4,
// Firefox before 128, Chrome before 119) the photo stays 672px while a mouse
// from 70rem is told 49vw — under it to a ≈ 1371px window (672 / 0.49), over
// it beyond; (4) a classic scrollbar narrows the column by its 15px under
// every other answer, so the 42rem and 80vw answers over-ask by at most those
// 15px, and on the gutter's ramp, 30rem to 37.5rem, `90vw` over-asks a column
// sliding from 90 % to 80 % of the window by at most 12.5 %, those 15px
// aside (16 % at a 599px window behind one, measured); (5) a DEFAULT TEXT
// SIZE UNDER 16px — the reader's own setting, which a media query's rem
// follows — moves the 70rem answer to a narrower window while the scale's
// 896px floor holds its step where it was: at a 12px default the answer
// matches from an 840px window, where the photo is the measure's 504px
// (42rem) and 49vw asks 411.6px — the same 18.3 % under as (2), shrinking to
// nothing by a ≈ 1029px window (504 / 0.49) and over-asking from there to the
// step at 1120 (the G2 review's arithmetic, 2026-10-20: this runner cannot
// set a browser's default size). And AT THE SCALE'S STEP the photo shrinks
// from 672px to ≈ 544px in one pixel of window — the band scale's recorded
// jump (CLAUDE.md §15.25 round 2 (c)), every theme length with it.
// THE SPACE BEFORE `49vw` IS LOAD-BEARING (PersonnelCard's THE SPACE BEFORE
// `21vw`): next/image (get-img-props, getWidths) reads the smallest
// WHOLE-NUMBER `vw` share that opens the string or follows a space — 49 here
// — and keeps only the candidates of at least 640 × 0.49 = 313.6px: 384, 640
// and up, every width a photo of 288px or more can use (the narrowest a phone
// draws, a 320 window's column). Glued to its bracket `49vw` would not be
// read, the smallest share would be 80, and the 384 file a 1× screen asks for
// would be dropped. A composer that draws the photo narrower (sections/
// BeforeAfter's halves) passes its own `sizes` through the prop — and AN EMPTY
// ONE COUNTS AS NONE (ABSENT OR EMPTY, NOTHING): handed on, next/image reads
// it as no `sizes` at all and asks `100vw` of a `fill` picture, every
// candidate from 640px — the 384 file dropped again (the G2 review,
// 2026-10-20, measured: `sizes=""` printed `sizes="100vw"`). AND SO DOES A
// BLANK ONE, white space alone (its round 2): handed on, it would print as
// given, and a browser reads a `sizes` that lists nothing as `100vw`.
// NOT CAUGHT, RECORDED (its round 3): a `sizes` of a lone comma, or of a
// zero-width space, a word joiner or a soft hyphen alone, is no blank to
// `trim()` and passes through as given — and Chromium 151 reads each as
// `100vw`, the same as a blank one (HTML's rule: a `sizes` with no valid
// entry is `100vw`; measured 2026-10-21 at a 414px window, each picks the
// file `100vw` picks, where `10px` and `300px` pick others). Every caller
// passes a constant — POST_PHOTO_SIZES and sections/BeforeAfter's
// PICTURE_SIZES — so the check stays `trim()`.
//
// ── WHAT THIS SECTION DOES NOT OWN: its width and every margin (§6.4/§6.8 —
// the article's measure or a composer's half places it), the air above and
// below it (the measure's own gap), the note's lead-in and its length (the
// route's words, the data's test), and THE BAND SCALE: sections/PostPage
// wears ui/Container's band strings (§15.32), and every theme length here —
// the gaps, the heading's 24px, the note's 16px, the picture's corner — is
// redrawn in the design pixel on a laptop or desktop with a mouse, without
// this file spelling a byte of it.
//
// ── ZERO ISLANDS (§16): no 'use client', no hook, no handler, no state.
// ui/Image brings its optimizer's small island with the picture, as on every
// page with a photograph. PostPhoto.test.tsx pins the directive's absence and
// the import surface from the source text.

/** The picture: a path under public/images/ (§11) and its alt — words, at
 *  least one visible letter (lib/visible-text's `hasVisibleLetter`): an alt
 *  with none is refused at render with a RangeError (THE PICTURE). */
export type PostPhotoImage = Readonly<{ src: ImagePath; alt: string }>;

/** What a blog photo shows — the picture, and the words beside it, each
 *  optional. Every string FINISHED (§8.1). */
export type PostPhotoContent = Readonly<{
  /** Over the picture — the figure's caption, start-aligned, never
   *  hyphenated; its one name under HTML-AAM's rule, which Chromium 151 does
   *  not apply (THE HEADING). Absent or empty, nothing; present, a letter or
   *  a digit that shows, or the render throws (ABSENT OR EMPTY, NOTHING). */
  heading?: string;
  /** The picture, in a 4:3 box as wide as the figure. */
  image: PostPhotoImage;
  /** Under the picture, in the faint ink — FINISHED with its lead-in
   *  („Notă: …") by the route; two lines at most, at the default text size,
   *  is the data's rule (TWO LINES AT MOST). Absent or empty, nothing;
   *  present, text that shows, or the render throws (ABSENT OR EMPTY,
   *  NOTHING). */
  note?: string;
}>;

export type PostPhotoProps = PostPhotoContent & {
  /** The picture's `sizes` — the article measure's by default
   *  (POST_PHOTO_SIZES); a composer that draws the photo narrower
   *  (sections/BeforeAfter's halves) passes its own. An empty or blank string
   *  counts as none (THE `sizes`, DERIVED). */
  sizes?: string;
} & Omit<
    ComponentPropsWithRef<'figure'>,
    // The native <figure> surface, minus `children` and
    // `dangerouslySetInnerHTML` (the content is the three named parts, and
    // React throws on markup set beside children — the figure always holds
    // its picture — so one smuggled in through a spread still fails the
    // build, loudly: no reset of its own, sections/BeforeAfter's precedent),
    // the content's own names and `sizes` (the picture's), THE FIGURE'S
    // NAME — `aria-label` and `aria-labelledby` would each name it in place
    // of its caption, the accessible-name computation reading the two ARIA
    // ones first, and a `title` names it in Chromium 151, which names a
    // figure by no caption, with a caption or without, though HTML-AAM's rule
    // reads it only after the caption (THE HEADING) — and a `role`, which
    // would make it something else: a "presentation" would take its name and
    // its grouping away. And THE FIGURE'S PRESENCE: an `aria-hidden` or an
    // `inert` would take the picture, its alt, the caption and the note out
    // of the accessibility tree while all of them stay drawn. The six are
    // reset after the spread too: TypeScript checks no hyphenated JSX
    // attribute against a props type that lacks it, so a written
    // `aria-label` or `aria-hidden` compiles whatever this says, and a spread
    // of a wider object can carry any of them (sections/PageHero's belt).
    | 'children'
    | 'dangerouslySetInnerHTML'
    | keyof PostPhotoContent
    | 'sizes'
    | 'role'
    | 'title'
    | 'aria-label'
    | 'aria-labelledby'
    | 'aria-hidden'
    | 'inert'
  >;

/** THE LAYOUT: one column, the heading, the picture and the note 1rem
 *  apart, each in its own row in DOM order — no row template, no placement
 *  (THE SUBGRID). One static string: Tailwind reads class names from source
 *  text. */
const FIGURE = 'grid grid-cols-1 gap-4';

/** The heading's own four utilities, after ui/Heading's step (THE HEADING):
 *  start-aligned on the element, never hyphenated, the SC 1.4.12 belt, and
 *  THE SUBGRID's seat. */
const HEADING = 'text-start hyphens-none wrap-anywhere self-end';

/** The picture's 4:3 box — positioned, for `fill` (THE PICTURE). */
const PICTURE_BOX = 'relative aspect-[4/3]';

/** THE NOTE: the base step in the credo ink, the full ink on a request for
 *  more contrast, and the belt — no weight, no slant, nothing else. */
const NOTE = 'text-base text-ink-faint contrast-more:text-ink wrap-anywhere';

/** The picture's `sizes` by default (THE `sizes`, DERIVED): THE BAND SCALE's
 *  share for a mouse from 70rem, the measure's 42rem, the column. The space
 *  before each `vw` is load-bearing. */
export const POST_PHOTO_SIZES =
  '(min-width: 70rem) and (pointer: fine) 49vw, (min-width: 52.5rem) 42rem, (min-width: 37.5rem) 80vw, 90vw';

export function PostPhoto({
  heading,
  image,
  note,
  sizes,
  className,
  ...rest
}: PostPhotoProps): ReactElement {
  // THE PICTURE's hole: an alt with no visible letter describes nothing, and
  // the photo would be unnamed or decoration to a screen reader. Read as
  // `unknown`: the type says string, but an alt that is no string at all —
  // `undefined`, `null` — would reach the pattern as the WORD "undefined" or
  // "null" and pass. Refused at render, which on this site is `next build`;
  // every value the refusal prints — the picture's path, the alt — quoted by
  // lib/visible-text's `spelled`, an alt that is no string named by its type
  // and never by running its own code (THE PICTURE).
  const alt: unknown = image.alt;
  if (typeof alt !== 'string' || !hasVisibleLetter(alt)) {
    throw new RangeError(
      `PostPhoto: the picture ${spelled(image.src)} has an alt with no visible letter (${typeof alt === 'string' ? spelled(alt) : `not a string: ${spelled(alt)}`}) — a blog photo is information, never decoration, and an alt that describes nothing leaves it unnamed or decoration`,
    );
  }

  // ABSENT OR EMPTY, NOTHING — AND PRESENT, IT SHOWS: a heading or a note
  // the render prints (the same truthiness that prints it, below) shows a
  // word or text, or the build stops here, the part quoted `spelled` —
  // refused, never read as absent, so a composer's count of the parts holds
  // (the header's record).
  if (heading && !hasVisibleWord(heading)) {
    throw new RangeError(
      `PostPhoto: the picture ${spelled(image.src)} has a heading with no letter or digit that shows (${spelled(heading)}) — a caption names its picture, so it holds a word, or is absent or empty; a blank one prints an empty row over the picture, a mark alone a caption that names nothing`,
    );
  }
  if (note && !hasVisibleText(note)) {
    throw new RangeError(
      `PostPhoto: the picture ${spelled(image.src)} has a note that shows nothing (${spelled(note)}) — a note shows text, or is absent or empty; a blank one prints an empty row under the picture`,
    );
  }

  return (
    // THE NATIVE SURFACE: the caller's native props reach the root FIRST —
    // `ref` among them (React 19); then a `role`, a name, a `title`, an
    // `aria-hidden` or an `inert` that slipped past the Omit — written, if
    // hyphenated, or in the spread of a wider object — is reset, so the
    // figure stays a figure, in the accessibility tree, whose one caption is
    // its heading (THE HEADING); then the caller's className, merged LAST:
    // placement only (§6.8).
    <figure
      {...rest}
      role={undefined}
      title={undefined}
      aria-label={undefined}
      aria-labelledby={undefined}
      aria-hidden={undefined}
      inert={undefined}
      className={cx(FIGURE, className)}
    >
      {heading ? (
        <Heading size="subhead" asChild>
          <figcaption className={HEADING}>{heading}</figcaption>
        </Heading>
      ) : null}
      <div className={PICTURE_BOX}>
        <Image
          variant="framed"
          fill
          src={image.src}
          alt={alt}
          // `?.trim() ||`, not `??`: an EMPTY or BLANK `sizes` counts as none
          // too (THE `sizes`, DERIVED) — either would reach the browser as
          // `100vw`.
          sizes={sizes?.trim() || POST_PHOTO_SIZES}
        />
      </div>
      {note ? <p className={NOTE}>{note}</p> : null}
    </figure>
  );
}
