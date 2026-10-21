import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { Image } from '@/components/ui/Image/Image';
import { PillButton } from '@/components/ui/PillButton/PillButton';
import { Text } from '@/components/ui/Text/Text';
import { cx } from '@/lib/cx/cx';
import type { ImagePath } from '@/lib/image-path/image-path';

// sections/PostCover — the article page's COVER: one line with how long the
// article takes to read and, at its other end, the share controls; under it
// the article's big picture, with the post's categories floating over its
// top-right corner. The owner, verbatim (2026-10-14): "the 4 share buttons
// above the image in the top right as in example … the base article image
// bibg as in example … use current "igienă", "sfaturi" items from current
// individual cards from blog above the top image at top right as described in
// other session for refactoring blog. / where the current share this article
// button is in the example i'd want displayed how long it takes to read the
// article in same shape as it is on card refactoring on the other
// conversation about refactoirng blog menu". The example, as the planner read
// it: a row with "Share this article" on the left and four small share
// buttons on the right, then a wide photograph across the content width.
//
// ── TIER: a PAGE BAND'S PART, props-in (§4's shared-composition sub-kind).
// It composes three atoms — ui/Text, ui/Image, ui/PillButton — binds no site
// data and calls no t(): every string arrives FINISHED (§8.1), the reading
// time's words included („4 min de citit" — the route's own ICU sentence,
// `blog.readingTime`, its one argument the minutes as a formatted number, no
// plural) and the tag list's name (`tagsLabel`). sections/PostPage is its one
// consumer.
// The share controls arrive as a SLOT, `share` — the page drops
// sections/ShareLinks in; this file never imports it, so the cover stays a
// server component with no island of its own whatever the slot holds.
//
// ── THE ROW. `flex flex-wrap items-center justify-between gap-x-6 gap-y-2`:
// the reading time at the line's start, in a box of its own (THE READING
// TIME'S BOX, below), the slot at its end, centred on the line. THE READING
// TIME is ui/Text's muted body copy — "in same shape as it is on card
// refactoring": the blog-cards lane he meant, on develop since #166, prints
// the card's reading time as that same plain muted line (sections/PostCard's
// THE FOOTER ROW).
// THE SLOT'S AUTO START MARGIN. On one line with the reading time the slot
// would take the line's end by `justify-between` alone; but when the line is
// too short for both, flex-wrap moves the slot to a line of its own, where
// `justify-between` with a single item puts it at the START. The wrapper's
// `ms-auto` keeps it at the END on either line — the owner's "top right". It
// is the cover laying out its own child, never an outer margin: the root
// carries none (§6.4). The wrapper is CONTENT-SIZED (no grow), which is why
// ShareLinks reads the COVER's container for its labels and declares none of
// its own (its build contract: a content-sized flex child that is a container
// would collapse to nothing).
// WHERE IT WRAPS, MEASURED on the stories (Chromium, the real face) with
// their stand-in slot — four 44px targets 8px apart, ShareLinks' icons-only
// shape, 200px: „4 min de citit" is 97.2px at the 16px step, so the line
// needs 97.2 + 24 + 200 = 321.2px — one line from a ~357px window (~374px
// behind a classic 15px scrollbar), two at the 320 stress width, where the
// slot drops one 8px gap under the reading time and stays at the right. The
// real controls' width is ShareLinks' lane's to measure. The reading time's
// box is exactly as wide as its paragraph, so it moved none of these
// numbers (MEASURED, below: one line or two in every case as before).
// THE READING TIME'S BOX (2026-10-21) — `grid` + one row track,
// `minmax(min-content, min(100%, calc(var(--spacing)*11)))` in its arbitrary
// class, `items-center self-stretch`. WHY: the slot grows taller than its
// controls. sections/ShareLinks prints a status line under its four 44px
// controls, empty and 0px tall at rest, which opens at the first press of
// „Copiază linkul" and keeps its height until the page is
// left (ShareLinks.tsx's THE LINE): 32px at a 390 window, 56 in German (two
// lines), 29.2 at a 1280 window in THE BAND SCALE. Centred by this row alone,
// the reading time re-centred on the taller line and dropped by half of it —
// 16 or 28px at 390, 14.59 at 1280, 22 at 1920 (MEASURED, Chromium; 14.81 at
// 1280 in WebKit): text jumping because of a press somewhere else, which
// ShareLinks.tsx's THE ONE SHIFT recorded as this file's lever. HOW: the box
// is stretched to its line; its track is the line's height but never taller
// than the theme's 44px step — the controls' MINIMUM height, ui/TextButton's
// `min-h-11` (ShareLinks' THE HIT AREA) — nor shorter than the reading time;
// the track sits at the line's top, where the controls are, by the grid's
// own default — a grid's `align-content` is `normal`, which acts as
// `stretch` (CSS Box Alignment §5.1.4), and `stretch` grows only a track
// whose maximum is `auto` (CSS Grid 1 §11.8), which this one's `min(100%, …)`
// is not, so the track keeps its size and falls back to the start (Box
// Alignment §4.3); and the reading time is centred in the track:
//   · at rest the line IS the controls, so the track is the line and the
//     reading time sits where this row's centring alone put it;
//   · with the line open under the controls the track keeps the controls'
//     height, so the reading time stays level with them;
//   · wrapped — the slot on a line of its own — the box's line is the
//     reading time's own height, and nothing stretches;
//   · a reading time taller than the cap — two lines at a large text size,
//     or SC 1.4.12's paragraph spacing, 2em under every paragraph — sets
//     the track by itself (a track's max smaller than its min is ignored):
//     the box grows, never overflows.
//   Each term is load-bearing, MEASURED in Chromium, WebKit and Firefox:
//   the FLOOR is `min-content`, never `auto` — an `auto` minimum is an
//   automatic minimum size, which grid clamps to a track's fixed max, so the
//   paragraph's 2em spacing overflowed the 44px track by 6px above and below;
//   the cap is inside `min(100%, …)` because while the row sizes its lines
//   the box's height is indefinite, where a percentage track size counts as
//   auto, so the wrapped line stays the reading time's own (with a bare 44px
//   cap, either floor, it was 44 and the slot sat 20px lower); and it is a
//   grid TRACK, not a flex box with a minimum height over a maximum one,
//   because WebKit lets a 44px maximum beat `min-height: min-content`, and
//   Firefox `fit-content` as well — the box clamped, and under text spacing
//   the slot rose 12px at 320 — while a track's rule is the same in all
//   three. And no alignment of the track's own: the default keeps it at the
//   line's top (MEASURED, below, against an explicit start: every box the
//   same), and where an engine refuses `min()` in a track list — the
//   declaration invalid at computed-value time (it holds a `var()`), the
//   row an implicit `auto` track — the default stretches
//   that track to the line and centres the words as this row alone did,
//   where an explicit start would leave the reading time 10px high at rest.
//   The cap is the theme step THE BAND SCALE redraws, exactly like the
//   controls' own `min-h-11`: inside the scale both are 44 design pixels.
//   KEEP-IN-SYNC: the cap is the controls' MINIMUM height — should
//   ShareLinks' controls change it, the cap follows, and so does the
//   stories' stand-in (four 44px targets). sections/ShareLinks' suite holds
//   the two together: ShareLinks.test.tsx's THE STAND-INS' PIN reads this
//   file's row and requires every share control to carry the cap's
//   minimum-height step, and its two copies of this row to be this file's, letter for
//   letter; ShareLinks.tsx's THE HIT AREA names this record back.
//   MEASURED, before against after (2026-10-21, a probe of the real sheet
//   and the real face, PostCover beside the stand-in slot AND beside the
//   real ShareLinks with the route's words, in all five languages, at 16
//   windows from 280 to 2560 with and without a classic scrollbar, for the
//   post's reading time and the data's longest, 60 minutes): AT REST every
//   box — the reading time, the slot, the controls, the row — and the
//   picture's top were identical in Chromium and WebKit, and under SC
//   1.4.12's text spacing at 320; Firefox identical at 320, 390, 768, 1280,
//   1536 and 1920, and 1/60px apart (one of its layout units) at a 1140
//   window. AFTER A FAILED PRESS of the copy button (640 presses an engine)
//   the reading time moved by 0 in all three, where it had moved by the
//   figures above, and the
//   controls by 0; the picture moved down by the line, to the very place it
//   had before — the press's own shift (ShareLinks.tsx's THE ONE SHIFT).
//   MEASURED AGAIN when the box's own alignment left (2026-10-21, the same
//   kind of probe in Chromium, WebKit and Firefox: 18 windows from 280 to
//   2560 with and without a classic scrollbar, all five languages, 4 and 60
//   minutes, the stand-in slot and the real ShareLinks, at rest, with the
//   line opened 32 and 56px under the controls, and under SC 1.4.12's
//   overrides — 2,880 layouts an engine): every box identical to the file's
//   before, and to an explicit start written on the box.
//   RECORDED, the cases that move AT REST. In the matrix measured — sampled
//   windows, never a sweep — one:
//   · SC 1.4.12's paragraph spacing, on a ONE-LINE row beside the real
//     ShareLinks — at each sampled window from 600 up, and on phones from
//     375 to 430 where the words fit one line — puts the reading time at
//     the row's top, 10 design pixels above where it sat (8.11 to 13.88px in
//     the band scale). Until now it sat level with the controls by
//     coincidence: ShareLinks' empty status line is a paragraph too, so the
//     same override gave the slot the same 2em under it as the reading time;
//     now the reading time's 2em hangs inside its own box while the track
//     keeps the controls' height. It no longer drops 16px when the copy
//     button is pressed there. Between the sampled 820 and 1024 lies a band
//     where, under those overrides, the labelled row wraps under the reading
//     time and nothing moves (at the page's own spacing it never wraps
//     there): computed by the accessibility review at ≈840–947px windows,
//     MEASURED since window by window — 840 to 946 in Romanian with the
//     post's reading time (947 in Firefox), as far as 986 in French with the
//     data's 60 minutes, and from 859 to as far as 1000 behind a classic
//     scrollbar.
//     PostCover.scale.test.tsx's THE ROW pins the 10 pixels with a stand-in
//     slot whose line is an empty paragraph; with no line at all, as the
//     stories' stand-in has, nothing moves there.
//   Outside the matrix, two more, both the controls grown past their MINIMUM
//   height, which is what the cap holds — the reading time stays centred on
//   the cap (at the row's top, where its own line is taller than the cap),
//   above the controls' centre:
//   · a minimum font size — Firefox with a 24px minimum (the React review's
//     measurement, reproduced in this lane's probe): 4.67px above on a cover
//     outside the band scale wide enough for the labelled row to keep to the
//     reading time's line (sampled from 819 to 1093px, the width of an iPad
//     held sideways),
//     5.92 at 1009 in the band (0.912) and 7.15 at 896 (0.81). Under the
//     words' 42rem step the controls are glyphs alone, which a minimum font
//     does not grow, and at the sampled 672 to 760 the labelled row wraps:
//     nothing
//     moves on those covers. Any controls taller than the cap do the same —
//     beside a 60px stand-in the reading time's centre sits 8px above the
//     controls' on a bare cover, in all three engines;
//   · a text-only zoom — Firefox's or Safari's "Zoom Text Only" inside the
//     band scale grows the labelled controls' words past the cap, a spacing
//     step, which stays: at 200 % the reading time's centre sits 12 design
//     pixels high where the row keeps one line, and only where the band
//     scale still holds: its 56rem step grows with the text, so at a zoom z
//     the band needs 0.8 × the window − 15 ≥ 56rem × z — about 1250px at
//     110 %, 1700 at 150 % and 2260 at 200 % (a 1280 laptop is in the band
//     at 110 % only, about 1.4 design pixels high, and level from 120 %)
//     (COMPUTED, the accessibility reviews; one Firefox "Zoom Text Only"
//     look at 1280 and 1920 would settle it).
//   No WCAG failure in any of them: nothing overlaps or is cut. And no CSS
//   lever: a cap in `em` would stay 44px in Firefox, which measures `em`
//   against the unclamped font size (MEASURED, the React review, and again
//   here: 44em / 18 on an 18px box draws 44px under a 24px minimum).
//
// ── THE PICTURE: `relative aspect-[3/2] @2xl:aspect-[2/1]` holding ui/Image's
// `framed` situation on `fill` — the photograph covers the box, crops the
// overflow and wears its own 12px corner on all four sides (Image D2, D3):
// the owner's "nice round cornrs as it is now on the current blog page". The
// recipe is ROUND 1's card picture (#165, the blog's first list page —
// develop's blog page on 2026-10-14, the day of his brief). Develop's
// PostCard has since (#166) drawn its picture `plain`, out to the card's
// frame, with only its two top corners rounded, 13px on the frame's inner
// curve: the geometry of a picture inside a frame, which the cover's —
// standing alone on the page — is not, so it keeps the atom's four corners.
// The box is `relative` because `fill` places the picture against the
// nearest positioned ancestor — and it is the chips' anchor too, and the box
// that hands them the page's own pixel (THE TAGS' THE CAP).
// THE RATIO answers the COVER's own width (its `@container`): 2:1 from its
// `@2xl` — the example's wide band, the photograph's middle — and 3:2 under
// it, the clinic photographs' own ratio (1920 × 1280), so a phone shows the
// whole photograph instead of a 175px strip (a 2:1 box at 390 would be
// 351 × 175.5). Tailwind writes the step into the query as 42rem, so it reads
// CSS rem, never THE BAND SCALE's design pixel; inside the scale the cover is
// at least 896px wide and always 2:1. The switch: a 840px window without a
// classic scrollbar (0.8 × 840 = 672), 858.75px behind a 15px one. MEASURED
// on the stories behind that scrollbar: 273 × 182 at 320, 336 × 224 at 390,
// 599.4 × 399.6 at 768 (all 3:2), then 1009 × 504.5 at 1280, 1213.8 × 606.9
// at 1536 and 1521 × 760.5 at 1920 (2:1).
// LAZY BELOW THE FOLD by ui/Image's default, unless the page says the cover is
// its LCP element (`preload` — the PersonnelCard D18 pair PostCard uses: no
// `loading="lazy"`, a high fetch priority, a preload link with the same
// `sizes`). The article page passes it: the cover is the first picture there.
//
// ── THE TAGS: sections/PostCard's, reused whole. The owner, verbatim
// (2026-10-15): "reuse all component from it that have been patched on the
// other branch" — the blog-cards lane, on develop since #166, which patched
// the card's categories twice: what a chip IS (A TAG, NOT A BUTTON, below)
// and how big it is over a picture (THE CHIPS FOLLOW THEIR COVER, below). The
// cover takes both, and the card's placement byte for byte — TAGS, `absolute
// start-3 end-3 top-3 flex flex-row-reverse flex-wrap gap-3` — on a real list
// (`role="list"`, named by `tagsLabel`, so a screen reader hears „Categorii,
// list, 2 items"; the role is load-bearing in WebKit — eslint.config.mjs's
// list-role exception), each <li> dressed as ui/PillButton through `asChild`.
// KEEP-IN-SYNC, NEVER AN IMPORT: a section never reaches into another
// section's internals (§4's second sharing row), so the two files spell the
// same strings — this file's TAGS is PostCard's TAGS, its CHIP_SCALE
// PostCard's CHIP_SCALE under one more term, the cap — and
// tests/unit/blog-tags-sync.test.ts holds them together: the placement
// byte-equal, the chips' pixel the card's formula verbatim inside the cover's
// cap, behind the card's guard. PostCard.tsx names this file back in its
// CHIP_SCALE note (its KEEP IN SYNC sentence).
// `flex-row-reverse` sets the FIRST tag at the far right — the owner's "top
// right" — the next one to its left, and a second line starts at the right
// again; `start-3 end-3` give the list the picture's width less three of the
// chips' own steps a side, so a line wraps before it reaches the left edge.
// The list is positioned against the PICTURE's box, which says `relative` —
// the card's against the card, whose padding box its picture spans: the same
// corner either way. DOM ORDER = row, picture, chips: the list follows the
// picture, so it is painted over it and read after it. No tags, no list (an
// empty named list would be announced as „list, 0 items").
// A TAG, NOT A BUTTON (owner, 2026-10-14, verbatim: "the pills with
// "sfaturi", "urgente" shold always have statically, so nothing on hover, the
// on hold aspect … so it should always have the current hover aspect on it no
// matter what and houls not be dinamic, i do not want to give impression of a
// button"): every chip is `kind="tag"` — ui/PillButton's THE TAG, the resting
// control's hover face held still: the lavender edge and label on the chip's
// own white face (5.06:1 whatever photograph lies behind it), not one `hover:`
// utility, so a pointer changes nothing, and never current — the atom's types
// refuse `active` and `aria-current` beside the kind, and it emits neither.
// The `<li>` takes no focus, so a tag is read as an item of a named list,
// never as a button. The `kind` is develop's own, the one the list's cards
// wear: one face for the blog's categories on both pages.
// THE CHIPS FOLLOW THEIR COVER — the card's pixel, capped at the page's. The
// card draws its tag list in a DESIGN PIXEL OF ITS OWN (PostCard's THE CHIPS
// FOLLOW THEIR CARD): globals.css's registered `--scale-px`, declared on the
// <ul> as `100cqw` over 513.40625 — the card's content width at the owner's
// 723 × 1123 window, where the chips are exactly the atom's own, 44px tall
// with an 18px label — never under 0.75rem / 18, a 12px label; and
// `design-scale` beside it, which redraws every theme length of the list and
// its chips in that pixel: the inset and the gap (three steps each) and each
// chip's 44px height, 20px of padding and 18px label. The 2px edge and the
// glow stay px (globals.css's THE DESIGN SCALE, NOT remapped). The cover wears
// the SAME two classes behind the SAME guard (CHIP_SCALE): the card's formula
// verbatim, measured against the COVER — the list's nearest container is the
// cover's root, `@container`, as wide as the picture — inside one more term,
// `min(var(--tags-cap), …)`.
// WHY A CAP. A card is a few hundred pixels wide — on a laptop a third of the
// page's column; the cover spans the whole column, and uncapped the card's
// ratio grows a label into a banner — MEASURED (Chromium, behind a classic
// 15px scrollbar): 86.5px chips with a 35.4px label at a 1280 window, 94.8 /
// 38.8px at the owner's 1401 and 130.3 / 53.3px at 1920. Capped at the
// PAGE'S OWN pixel, the chips are the card's proportional size wherever the
// cover is narrower than the card's reference — every phone held upright,
// and a window under ≈642px (≈661 behind a classic scrollbar) — and the
// atom's own 44 design pixels wherever it is wider: a tablet, a laptop, a
// desktop, × THE BAND SCALE's design pixel where the page is drawn in it
// (sections/PostPage wears ui/Container's band strings, so a laptop's cover
// is always the cap's).
// THE CAP (TAGS_CAP), captured on the picture's box BEFORE THE LIST
// RE-DECLARES THE PIXEL: `--tags-cap` = a quarter of the page's spacing step,
// `calc(var(--spacing)/4)` — unregistered, so the list inherits the value its
// parent computed. Two reasons it is read there and read that way. On the
// <ul> itself the page's pixel cannot be read: `design-scale` re-declares
// `--spacing` there from the list's own `--scale-px`, so either name read
// inside that declaration is a cycle — the parent's value, inherited, is the
// page's. And it reads the page's SPACING STEP, not `--scale-px` itself:
// inside the band scale the two say the same (the rhythm box's remap makes
// the step four design pixels — 0.912px a pixel at a 1280 window), but
// outside it `--scale-px` is its registered initial value, 1px at ANY root,
// while every theme length on the page is rem. A 1px cap would hold the chips
// under the atom at a larger default font and, above a 24px root, cut UNDER
// the card's own 0.75rem floor; a quarter of the spacing step never does —
// the floor is 0.0417rem, the cap 0.0625rem outside the scale (the theme's own
// pixel at any root, sections/PriceList's THE FLOOR) and at least 0.0506rem
// inside it (56rem over 1106). MEASURED (Chromium, a 614px cover): at a 20px
// root a cap read off `--scale-px` draws 44px chips with an 18px label where
// this draws the cover's ratio, 52.6 / 21.5px; at a 30px root 44 / 18px, under
// the floor's 22.5px label, where this draws the floor, 55 / 22.5px. At the
// default 16px root the two spellings draw the same pixels at every width.
// THE GUARD is the card's: both classes ride `supports-[width:1cqw]:`, so an
// engine without container units — Safari 15, every iPhone left on iOS 15 —
// never reads them and draws the page's own chips: the theme's 44px with an
// 18px label, 12px into the picture's corner. The capture rides no guard: the
// guarded declaration is its one reader, so where that is dropped it is
// computed and never read. An engine with container units but without
// registered custom properties — Safari 16.0 to 16.3, Firefox 110 to 127 —
// draws the same chips: the pixel is pasted as text and evaluated where it is
// used, on the list and on each chip, whose nearest container is the cover's
// root either way, and the cap arrives as the page's step over 4 (MEASURED in
// Chromium with an unregistered copy of the declaration and the remap written
// out by hand: the chip's height, padding and label and the list's gap equal
// the registered ones at a 288, a 351 and a 614px cover).
// MEASURED (Chromium, the real face, the page's structure — ui/Container and
// a rhythm box wearing the band strings, as the stories' band):
//   · a phone, no scrollbar — the floor at 320, 360 and 375: 29.3px chips, a
//     12px label, 13.3px of padding, 8px of inset and gap; the cover's ratio
//     above it: 30.1px with a 12.3px label at 390 (a 351px cover), 31.8 /
//     13.0px at 412, 33.2 / 13.6px at 430, 33.9 / 13.9px at 440;
//   · a 600px tablet 41.1 / 16.8px; the atom's own 44 / 18px from a 642px
//     window — 768 and 1024 among them;
//   · behind a classic 15px scrollbar — the floor at 320 and 390 (273 and
//     336px covers), 39.8 / 16.3px at 600, the atom's own from 661;
//   · in THE BAND SCALE, behind the same scrollbar — 44 × the band's pixel:
//     35.7 / 14.6px at 1140, 40.1 / 16.4px at 1280, 44.0 / 18.0px at the
//     owner's 1401, 48.3 / 19.8px at 1536, 60.5 / 24.8px at 1920 and 61.1 /
//     25.0px past the cap (2560).
// THE CEILINGS, recorded rather than guarded here (PostCard's argument: the
// blog's data is the place to hold them — tests/unit/blog-data.test.ts holds
// every tag to 18 characters, lib/blog's MAX_TAGS a post to three). At
// 100 %, down to a 320 window, the narrowest cover is that window's — 288 ×
// 192px on a phone, 273 × 182 behind a classic scrollbar — and on the chips'
// floor its list's line is the picture less two 8px insets: 272px, and 257. A
// chip never wraps (PillButton's `whitespace-nowrap`, right for a strip that
// scrolls sideways), and a tag wider than that line would overflow towards
// its END, which `flex-row-reverse` puts on the LEFT, past the picture's left
// edge. MEASURED with the real face, the 34-character „stomatologie pediatrică
// preventivă" is a 235.4px chip, inside both lines; the data's 18 characters
// are a 138.9px chip in Romanian („stomatologie copii") and 157.7px in German,
// which starts its tags with a capital („Wurzelbehandlungen"); the widest tag
// the blog ships, the German „Kieferorthopädie", is a 131.5px chip. And the
// list is absolutely placed, so too many lines of chips would run past the
// picture's BOTTOM: three 18-character tags take a line each and end 80px
// above it on the phone (70 behind the scrollbar); three long Romanian
// categories (14, 13 and 9 letters: „parodontologie", „implantologie",
// „prevenție") take two lines and end 117.3px above it (107.3); the three
// widest German ones („Kieferorthopädie", „Parodontologie", „Implantologie")
// take two and end 107.3px above it behind the scrollbar; the stories'
// GermanStress, with „Wurzelbehandlungen" in the middle, takes three — no two
// of its chips fit the line — and ends 70px above it there. Down to a 280px
// window, a Galaxy Fold's cover screen — a 248 × 165.3px cover, a 232px line
// — every chip named here stays inside the picture: the 34-character one
// passes its line by 3.4px and stays 4.6px inside the picture's left edge,
// and GermanStress's three end 53.3px above its bottom (MEASURED,
// 2026-10-20, on covers of these widths). UNDER PAGE ZOOM a phone draws
// narrower covers still — 163px at 390 and 128px at 320, both at 200 % (a 160
// CSS px layout at 320) — still on the floor: the shipped tags stay on the
// screen, the widest, „Kieferorthopädie", crossing the 128px picture's left
// edge by 11.5px and ending 4.5px inside the screen; the 18-character
// ceiling's 157.7px chip does not: it runs 21.7px past the screen's edge at
// 320 / 200 % — under SC 1.4.10's 320, so not a failure (MEASURED on covers of
// those widths, 2026-10-20).
// THE GLOW: each chip wears the header pill's `shadow-aura` (`0 8px 22px`),
// which reaches 14px above a chip, 22px beside it and 30px below — px, so the
// chips' pixel leaves it whole. Three of the chips' own steps in from the
// picture's edges, it spills over the top edge and past the right one onto
// the page — a box-shadow, never a scroll: on the floor's 8px inset, a
// phone's, 6px over the top and 14px past the right edge; on the atom's 12px,
// a tablet's, 2 and 10px; in the band scale less — 0.8 and 8.8px at 1536
// (a 13.2px inset), none over the top and 5.5px past the right at 1920
// (16.5px).
// THE ZOOM — WCAG 2.2 SC 1.4.4, the F94 pattern: THE OWNER'S CALL, OPEN
// (the a11y review, 2026-10-20; BACKLOG.md entry 2, THE BLOG'S CATEGORY TAGS
// UNDER BROWSER ZOOM). The chips are sized by the cover's CSS
// width, and a page zoom, which narrows the window in CSS px by the very
// factor it enlarges them, shrinks the chips' pixel as it enlarges the page
// wherever the zoomed cover is narrower than 513.4 CSS px (outside THE BAND
// SCALE) — so there the tags grow on screen by LESS than the zoom and every
// other word of the page. COMPUTED (the formula PostCover.scale.test.tsx
// measures, at the zoomed window's CSS width through ui/Container's gutter, a
// 16px root): an 18px label at 100 % reads, at 200 %, 24.0px on an upright
// iPad mini (744, Safari's page zoom: the floor's 12px label doubled, ×1.33),
// 24.2 on a 768 iPad (×1.35 — now smaller than the reading time, 32px, in the
// row above the picture, where at 100 % the tags were the larger, 18 against
// 16), 24.7 in an 800 window and 30.7 in a 1024 window behind a
// classic scrollbar (15 screen px; ×1.37 and ×1.70), 25.9 on an 820 iPad
// (×1.44) and 33.4 on an iPad Air held sideways (1180, ×1.85). Of the iPads
// only the 13-inch ones held sideways (1366) double at 200 %: their zoomed
// cover, 546.4 CSS px, is past 513.4, where the cap holds; the upright ones
// reach twice their 100 % size only at 300 %, Safari's largest step — 36px,
// the floor's label tripled. Phones up to about 380px wide are already on
// the floor at 100 % and double exactly; ×1.95 at 390 and ×1.77 at 430. A
// pinch zoom, which leaves the layout viewport alone, enlarges the tags with
// the page. A larger default font size is the same trade in narrow desktop
// windows — under the cap the chips follow the cover's width, not the root —
// so a 768 window behind a classic scrollbar at a 24px default font draws the
// tags ×1.27 where the page grows ×1.5. Inside THE BAND SCALE the chips are
// the band's design pixel and share the regime's recorded trade (§15.25 round
// 2, §15.32). The card-relative size is the owner's design — the ratio he
// picked at his 723 window (THE CHIPS FOLLOW THEIR COVER) — so it is
// recorded, not changed; BACKLOG.md entry 2 lists it for the launch
// accessibility pass. THE LEVER: drop the cover's own pixel (CHIP_SCALE and
// TAGS_CAP) so the chips take the page's — rem outside the band scale,
// doubling at 200 % like every rem on the page. Its cost, MEASURED (Chromium,
// the real face): the atom's 44px chips with an 18px label on every phone,
// where the ratio draws 29.3 to 33.9px today; at 320 three long Romanian
// categories (14, 13 and 9 letters) one to a line, ending 168px down the
// 192px picture (the 182px one behind a classic scrollbar); and UNDER A
// PHONE'S 200 % PAGE ZOOM it does WORSE than today (the chip MEASURED, the
// rest its arithmetic, 2026-10-20). On 375 and 390 phones at 200 % the cover
// is 155.5 or 163px wide and the lever's tag line 131.5 or 139px, and the
// shipped German „Kieferorthopädie" — a 186.2px chip at 18px — overflows that
// line to the LEFT (the list is right-aligned, `flex-row-reverse`), 26.7 or
// 19.2px past the screen's edge: 4.7px of its label cut on the 375; on the
// 390 its 2px edge and 17.2 of its 20px of padding; and two tags take two
// 44px lines ending at 112px on a 103.7 or 108.7px picture. Today's floor
// keeps both inside: that chip is 131.5px on a 139.5 or 147px line, and two
// lines end at 74.7px.
//
// ── THE `sizes` (COVER_SIZES), DERIVED. The cover spans ui/Container's column
// (PostPage's rhythm box stretches it), so its width is that column's, read
// off ui/Container's THE PHONE GUTTER: 90vw up to a 30rem window (the gutter
// 5vw a side), `calc(40vw + 15rem)` on the ramp to 37.5rem (the gutter
// 30vw − 7.5rem a side: exactly 90vw at its start, 80vw at its end), 80vw
// from 37.5rem (10vw a side). THE BAND SCALE caps the column at 96rem on a
// mouse or trackpad (`bandColumnClasses`' `scalable:` cap), which a 0.8 ×
// window reaches at a 120rem (1920px) window: `96rem` from there on a fine
// pointer. Every rem here is the browser's default font size, as the gutter's
// and the cap's are (globals.css sets no root size), so the four entries move
// together at any default font size. tests/unit/design-scale.test.ts derives
// every number of the four from where it lives — the gutter's three regimes
// off ui/Container's clamp, the cap off THE BAND SCALE, the pointer off the
// `scalable` gate in globals.css — so a change to any of them fails there
// until this string follows (PersonnelCard's CUTOUT_SIZES, its precedent).
// THE BOUNDS — each a file a little larger or smaller than the box could use,
// never a wrong box (`sizes` picks the file; CSS sizes the box): a classic
// 15px scrollbar narrows the column by 15px under every `vw` entry; below a
// 320px window ui/Container's 1rem floor holds, and 90vw over-asks by at most
// 4px down to a 280px window (a Galaxy Fold's cover screen: a 248px cover,
// asked as 252); past a 2000px window the gutter stops at 12.5rem, so on a
// touch screen the column outgrows 80vw (5 % at 2560); and `sizes` cannot ask
// the band's `@supports` gate, so in an engine that cannot register custom
// properties a mouse past 1920 is told 96rem of a column that is not capped.
// The last two cost nothing: the photographs are 1920px wide, so is the
// largest candidate, and every box wider than 1200px already takes it at any
// pixel ratio. tests/unit/design-scale.test.ts derives these bounds too, off
// the gutter's outer floor and cap.
// THE SPACE BEFORE `80vw` AND `90vw` IS LOAD-BEARING (PersonnelCard's THE
// SPACE BEFORE `21vw`): next/image reads the smallest bare `vw` share it finds
// at the start or after a space and keeps the candidates of at least 640 ×
// that share — here 80vw, so 640, 750, 828, 1080, 1200 and 1920. No phone
// draws the cover narrower than 288px down to a 320 window (576 device pixels
// at 2×), nor than 248px down to a 280px window (a Galaxy Fold's cover
// screen: 496 at 2×, still more than the 384w file holds), so no smaller file
// is wanted. The ramp's `40vw` sits inside `calc()` on purpose: the filter
// does not read it, and it would admit the 256w and 384w files.
// The preload link carries the same `sizes` — next/image hands one value to
// both.
//
// ── WHAT THIS SECTION DOES NOT OWN: its width (the root is a container —
// inline-size containment — so its parent must give it one: PostPage's rhythm
// box stretches it), its margins and the space around it (§6.4/§6.8 — the
// page's rhythm), the share controls (the slot), and THE BAND SCALE: PostPage
// wears ui/Container's band strings (§15.32), and every theme length here —
// the gaps, the reading time's size and its box's 44px cap (read through
// `var(--spacing)`), the picture's 12px corner — is redrawn in the design
// pixel on a laptop or desktop with a mouse, without this file spelling a
// byte of it; the chips reach the same pixel through THE CAP (THE TAGS), the
// one design pixel this file declares. MEASURED on the stories'
// stand-in band (behind a classic scrollbar): a design pixel of 0.912px at a
// 1280 window — the reading time 14.6px, the chips 40.1px tall with 16.4px
// labels, their inset 10.9px — 1.097px at 1536 and 1.375px at 1920.
//
// ── ZERO ISLANDS OF ITS OWN (§16): no 'use client', no hook, no handler, no
// state. ui/Image brings its optimizer's small island with the picture, as on
// every page with a photograph; the slot brings whatever the page puts in it.
// PostCover.test.tsx pins the directive's absence and the import surface from
// the source text, because no runtime assertion can see either.

/** The cover's own props — exported for the page band that composes it
 *  (sections/PostPage hands the cover its content through this shape). */
export type PostCoverOwnProps = {
  /** How long the article takes to read — finished text („4 min de citit"). */
  readingTime: string;
  /**
   * SLOT — the share controls, rendered as given at the row's END, on the
   * reading time's line or on one of its own when the line is too short. The
   * page passes sections/ShareLinks.
   */
  share: ReactNode;
  /** The article's picture under public/images/ (§11) and its alt — '' when
   *  decorative. Read-only, as lib/blog's own BlogPost holds it. */
  image: Readonly<{ src: ImagePath; alt: string }>;
  /** The post's categories, one chip each over the picture's top-right
   *  corner, the first at the far right; empty renders no list at all. */
  tags: readonly string[];
  /** The accessible name of the tag list, finished text („Categorii"). */
  tagsLabel: string;
  /**
   * The picture is its page's LCP element: load it at once, at high fetch
   * priority, with a preload link. The PAGE says so. @default false
   */
  preload?: boolean;
};

export type PostCoverProps = PostCoverOwnProps &
  // The native <div> surface minus the cover's own names, and minus
  // `children` and `dangerouslySetInnerHTML`: the content arrives as the named
  // props, and React throws on markup set beside children, which the root
  // always has. Minus `role`, `aria-label` and `aria-labelledby` too: the
  // root is a layout box, a GENERIC <div>, which ARIA forbids to name (axe's
  // aria-prohibited-attr), and a role would make the box something it is not
  // (an `img` would flatten the picture and the tag list inside it into one
  // unnamed image). Those three are reset after the spread as well (THE
  // NATIVE SURFACE, at the render), since TypeScript checks no hyphenated
  // attribute written in JSX against this type, and the spread of a wider
  // object can carry a `role` — sections/PostHeader's and sections/PageHero's
  // belt, the same refusal. A `dangerouslySetInnerHTML` meets no reset
  // (sections/ShareLinks' way): React refuses it at render, loudly. React 19
  // carries `ref` inside these props (§6.8).
  Omit<
    ComponentPropsWithRef<'div'>,
    | keyof PostCoverOwnProps
    | 'children'
    | 'dangerouslySetInnerHTML'
    | 'role'
    | 'aria-label'
    | 'aria-labelledby'
  >;

/** The cover's root: its own container, the row over the picture (THE ROW,
 *  THE PICTURE). One static string per box: Tailwind reads class names from
 *  source text. */
const ROOT = '@container flex flex-col gap-4';

/** The reading time at the start, the slot at the end (THE ROW). */
const ROW = 'flex flex-wrap items-center justify-between gap-x-6 gap-y-2';

/** THE READING TIME'S BOX (THE ROW): stretched to its line, its one row track
 *  as tall as the line but never taller than the share controls' minimum
 *  height, the theme's 44px step, nor shorter than the reading time — which
 *  is centred in that track, so a slot that grows under its controls never
 *  moves it. The track keeps to the line's top by the grid's own default. */
const TIME =
  'grid grid-rows-[minmax(min-content,min(100%,calc(var(--spacing)*11)))] items-center self-stretch';

/** THE SLOT'S AUTO START MARGIN: at the line's end, wrapped or not. */
const SLOT = 'ms-auto';

/** 3:2 under the cover's `@2xl`, 2:1 from it — positioned, for `fill` and
 *  for the chips (THE PICTURE). */
const PICTURE = 'relative aspect-[3/2] @2xl:aspect-[2/1]';

/** THE CAP (THE TAGS): the page's own pixel — a quarter of its spacing step,
 *  the band's design pixel inside THE BAND SCALE and 0.0625rem outside it —
 *  captured on the picture's box, the tag list's parent, before the list
 *  re-declares the pixel. */
const TAGS_CAP = '[--tags-cap:calc(var(--spacing)/4)]';

/** The categories over the picture's top-right corner, three of the chips'
 *  own steps in, the first tag at the far right (THE TAGS) — positioned
 *  against the picture's box, which says `relative`. KEEP-IN-SYNC: byte for
 *  byte sections/PostCard's TAGS (tests/unit/blog-tags-sync.test.ts). */
const TAGS =
  'absolute start-3 end-3 top-3 flex flex-row-reverse flex-wrap gap-3';

/** THE CHIPS FOLLOW THEIR COVER (THE TAGS): the list draws in its OWN design
 *  pixel — sections/PostCard's CHIP_SCALE formula verbatim, the cover's width
 *  over 513.40625 never under 0.75rem / 18, inside THE CAP: never over the
 *  page's own pixel — and `design-scale` redraws every theme length in it.
 *  Both behind the card's guard, an engine that knows container units.
 *  KEEP-IN-SYNC with PostCard's CHIP_SCALE (tests/unit/blog-tags-sync.test.ts).
 *  One static string per class: Tailwind reads class names from source text. */
const CHIP_SCALE =
  'supports-[width:1cqw]:[--scale-px:min(var(--tags-cap),max(calc(0.75rem/18),calc(100cqw/513.40625)))] ' +
  'supports-[width:1cqw]:design-scale';

/** The picture's `sizes` — ui/Container's column, capped by THE BAND SCALE on
 *  a fine pointer (THE `sizes`, DERIVED). The space before `80vw` and `90vw`
 *  is load-bearing; the ramp's share stays inside `calc()`. */
const COVER_SIZES =
  '(min-width: 120rem) and (pointer: fine) 96rem, ' +
  '(min-width: 37.5rem) 80vw, ' +
  '(min-width: 30rem) calc(40vw + 15rem), ' +
  '90vw';

/** The eager pair the page asks for on its LCP picture (THE PICTURE).
 *  Spread only when asked, so a lazy cover hands ui/Image nothing extra. */
const EAGER = { preload: true, fetchPriority: 'high' } as const;

export function PostCover({
  readingTime,
  share,
  image,
  tags,
  tagsLabel,
  preload = false,
  className,
  ...rest
}: PostCoverProps): ReactElement {
  return (
    // THE NATIVE SURFACE: the caller's native props ride FIRST; then a `role`
    // or a name that slipped past the Omit — written in JSX, or in the spread
    // of a wider object — is reset, since the cover is a layout box that
    // nothing names; then the cover's own classes, merged with a caller's
    // className LAST (§6.8 — placement only).
    <div
      {...rest}
      role={undefined}
      aria-label={undefined}
      aria-labelledby={undefined}
      className={cx(ROOT, className)}
    >
      <div className={ROW}>
        <div className={TIME}>
          <Text tone="muted">{readingTime}</Text>
        </div>
        <div className={SLOT}>{share}</div>
      </div>
      {/* The picture's box hands the tags THE CAP — the page's own pixel,
          read here, above the list that re-declares the pixel (THE TAGS). */}
      <div className={cx(PICTURE, TAGS_CAP)}>
        <Image
          variant="framed"
          fill
          src={image.src}
          alt={image.alt}
          sizes={COVER_SIZES}
          {...(preload ? EAGER : {})}
        />
        {tags.length > 0 ? (
          <ul
            role="list"
            aria-label={tagsLabel}
            className={cx(TAGS, CHIP_SCALE)}
          >
            {tags.map((tag) => (
              // A TAG, never a control (THE TAGS): the chip's hover face held
              // still, in the list's own pixel. Keyed by the tag itself — the
              // blog's data refuses a tag listed twice.
              <PillButton key={tag} kind="tag" asChild>
                <li>{tag}</li>
              </PillButton>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
