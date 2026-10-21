import { useId, type ComponentPropsWithRef, type ReactElement } from 'react';
import {
  BeforeAfter,
  type BeforeAfterProps,
} from '@/components/sections/BeforeAfter/BeforeAfter';
import {
  PostConclusion,
  type PostConclusionOwnProps,
} from '@/components/sections/PostConclusion/PostConclusion';
import {
  PostCover,
  type PostCoverOwnProps,
} from '@/components/sections/PostCover/PostCover';
import {
  PostGallery,
  type PostGalleryProps,
} from '@/components/sections/PostGallery/PostGallery';
import { PostHeader } from '@/components/sections/PostHeader/PostHeader';
import {
  PostPhoto,
  type PostPhotoContent,
} from '@/components/sections/PostPhoto/PostPhoto';
import {
  PostProse,
  type PostProseItem,
} from '@/components/sections/PostProse/PostProse';
import {
  ShareLinks,
  type ShareLinksProps,
} from '@/components/sections/ShareLinks/ShareLinks';
import {
  bandColumnClasses,
  bandScaleClasses,
  Container,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';

// sections/PostPage — the blog article's page band: ONE <article> that holds
// the post's opener, its cover, the article's own blocks in the article's
// order, and the doctor's closing words. The owner, verbatim (2026-10-14):
// "now i want also to have the individual blog page. the one with the
// articles. i have attatched an example of what i want aproximatloey" — and,
// of the pieces this band lays out: "those pretty ,mmuch will be like the
// sections that will always be reused for the articles". His example (a
// real-estate blog): a centred title over its by-line; a row with the share
// controls above a wide photograph across the content width; then a NARROWER
// centred column of text — paragraphs, small subheadings, a photo inside it —
// and, in his second screenshot, the closing quote and its author. The opener
// left the example's centring the same day, on his word: the title and its
// by-line are start-aligned since 2026-10-14 (PostHeader's START-ALIGNED).
//
// ── THE SHAPE (the build contract's §2) — every box below a section of this
// lane, composed through its PUBLIC component (§4: a section may compose
// another section's public component, never its internals):
//   <article aria-labelledby={the <h1>'s id}>
//     ui/Container                 — the gutter and the size container
//       THE RHYTHM BOX             — THE BAND SCALE, the stack, the band's py
//         sections/PostHeader      — the <h1> over the by-line, both on the
//                                    column's start edge (START-ALIGNED)
//         sections/PostCover       — reading time ⟷ sections/ShareLinks (the
//                                    cover's `share` slot), then the picture
//                                    with the categories over its top right
//         THE MEASURE              — 42rem, centred
//           sections/PostProse | PostPhoto | PostGallery | BeforeAfter …
//                                  (the blocks: a run of prose, a blog photo,
//                                   a card carousel, a before/after — two
//                                   blog photos side by side)
//           sections/PostConclusion                            (always last)
// DOM ORDER IS READING ORDER, and the order the eye meets: who wrote what,
// how long it reads, the picture, the text, the doctor's last word. The
// article ENDS THE PAGE: the shell's Footer is the next box under it (THE
// RHYTHM BOX).
//
// ── A DUMB PROPS-IN BAND (the PriceList / Hero / PostList shape; the build
// contract's §0): zero message keys, no t(), no data import — every string
// arrives FINISHED (§8.1) and every href built, from the article route's one
// populator (src/app/[locale]/blog/[slug]/populate.ts: lib/blog's post,
// lib/blog-article's blocks, lib/share's hrefs, lib/team's doctor — and every
// note under a picture with its lead-in, „Notă: …", already written). The props
// are grouped by the section each part feeds, so the page's wiring reads like
// the page: `header` → PostHeader, `cover` → PostCover (its slot and its
// preload are this band's), `share` → ShareLinks, `blocks` → the measure,
// `conclusion` → PostConclusion.
//
// ── THE NAME. The <article> is named by its <h1> through `aria-labelledby`,
// so a screen reader meets „Cum îți alegi periuța de dinți, article". The id
// is React's useId — server-safe and hydration-stable, the one hook here —
// handed to PostHeader as `titleId` (its header: the page owns the article and
// the id). THE BELT (PostCard's THE NAME, sections/TeamRoster's): the two ARIA
// naming attributes are Omitted from the props, and the Omit alone refuses
// nothing — TypeScript exempts a hyphenated attribute written in JSX from its
// excess-property check — so the native props ride FIRST, then the article's
// own `aria-labelledby`, which a caller's can never replace, and a smuggled
// `aria-label` reset to `undefined`, so no second name stands in the markup.
// `role` is Omitted and reset the same way (2026-10-20, the Opus react
// review — PostCard's and sections/BlogCarousel's belt): the element IS an
// article, the one role its name relies on; the type refuses a `role`
// written in JSX, but a spread of a wider object could still carry one, and
// a stray role would unmake the article itself.
// `dangerouslySetInnerHTML` is Omitted too (2026-10-20, round 2 of the Opus
// reviews) and NOT reset — sections/BeforeAfter's reasoning: the <article>
// always holds its content, and React throws on markup set beside children,
// so one smuggled in through a spread still fails the build, loudly.
// No class of its own: the article paints nothing (the shell's <body> carries
// the page ground — the privacy policy's and PostList's reasoning), so a
// caller's className, placement only (§6.8), is the article's whole class
// list and arrives with the spread.
//
// ── THE BAND SCALE (§15.32, ui/Container's recipe rule 5). The rhythm box —
// the first box inside ui/Container, the one that carries the band's py —
// wears BOTH of ui/Container's band strings, IMPORTED, never re-spelled
// (tests/unit/design-scale.test.ts holds every wearer to an import): on a
// laptop or a desktop with a mouse or trackpad, from a column of max(56rem,
// 896px), every theme length on the box and inside it — every gap, every
// padding, every text step, the measure's 42rem, the pictures' corners — is
// redrawn in ONE design pixel, the column ÷ 1106 (the owner's 1401 window),
// capped at a 96rem column and centred past it — the scale every band of
// Home under its hero, of Team, of a doctor's page and of the blog's list is
// drawn in, and, like their rhythm boxes, NOT FLOORED: two boxes on the site
// wear ui/Container's THE FLOOR, the price list's rhythm box and the box round
// the Home articles band's carousel, so that they never draw under the theme
// below the 1401 reference, and this band wears none (THE ZOOM TRADE, below).
// On every phone, every touch tablet and every narrower window nothing is
// declared and the page is its rem self (§7). The blocks inside inherit the
// remap and wear none of their own (the build contract's §2) — with TWO
// exceptions. PostHeader's <h1>, whose `hero` size reads the VIEWPORT, so it
// asks ui/Heading for the `hero-scaled` step, which carries the regime's
// gated size (its THE BAND SCALE paragraph). And PostCover's tag list, which
// declares a design pixel of its own — the blog card's, read off the cover's
// width — capped at this band's, so its chips never draw larger than the page
// they stand on (PostCover's THE CHIPS FOLLOW THEIR COVER).
//   NO `@container` ON THE RHYTHM BOX — load-bearing: that step's gate reads
//   the NEAREST size container above the <h1>, which must
//   be ui/Container's column, the very box the band's own gate reads; a
//   container here would put the title's gate on the band's capped box
//   (PostHeader's NO `@container` HERE). PostPage.test.tsx pins the absence.
//
// ── THE ZOOM TRADE — OPEN, AND THE OWNER'S (BACKLOG.md entry 2's THE BLOG'S
// ARTICLE PAGE; CLAUDE.md §7 names the page). Drawn whole in the band's
// pixel, unfloored, the article — the site's longest reading — carries
// §15.25 round 2's trade under a browser zoom and under a reader's default
// font size. The accessibility reviews' arithmetic (2026-10-20): at a 1140
// window behind a classic 15px scrollbar, under the 1401 reference, its
// paragraphs read 14.6px, its notes 13.0 and its by-line 11.4, where the
// theme's are 18, 16 and 14 (14.8px for the paragraphs with overlay
// scrollbars); on a 1440 laptop behind a classic scrollbar its paragraphs
// hold 18.5 device px at 100, 110 and 125 % zoom, the notes 16.45 and the
// by-line 14.4 (with overlay scrollbars, a MacBook's default, 18.75 / 16.67 /
// 14.58); on a 1920 screen behind a classic scrollbar 200 % gives ×1.45
// (×1.44 with overlay scrollbars), where text in rem doubles (WCAG 2.2 SC
// 1.4.4, the F94 pattern). THE WORST CASE is a 24″ iMac at its default
// 2240px width, with macOS's overlay scrollbars: the article's paragraphs
// read 25.0 / 27.5 / 29.2 / 29.2 / 29.2 / 29.2 / 45 device px at 100 / 110 /
// 125 / 150 / 175 / 200 / 250 % — ×1.17 at 200 % (a 2560 screen ×1.33 with
// overlay scrollbars, ×1.32 behind a classic one). A 20px default font: the
// 1440 laptop's paragraphs, behind a classic scrollbar, read 18.5px where
// rem would draw 22.5. And the article's TITLE carries a trade of its own,
// separate and open — the `hero-scaled` titles', BACKLOG.md entry 2, item
// (a): on a 1920 screen behind a classic scrollbar, 89.4 device px from 100
// to 150 % and ×1.11 at 200 %.
// The owner took the band's trade for Home and Team (§15.32), answered
// "Accept, like Home" for the doctor pages (§15.32 rounds 3 and 4) and „1 a"
// for the blog's list (CLAUDE.md §15.39 round 3 (7)(1)); it has NOT been put
// to him for this page.
// THE LEVER, not taken: ui/Container's THE FLOOR on this rhythm box — the
// price list's floor class beside the two strings, `--band-floor` at
// 0.0625rem — so the article never draws under the theme below the
// reference, and a zoom or a larger default font enlarges it there as rem
// does. THE FLOOR mends every figure UNDER the reference — 18 / 16 / 14px at
// a 1140 window, the 1440 laptop's paragraphs behind a classic scrollbar
// 18.5 → 19.8 → 22.5 device px at 100 / 110 / 125 %, the 20px default font
// (22.5, rem's own) — and raises the iMac's 200 % from 29.2 to 36, rem's own
// size there (×1.44; its 175 % 29.2 → 31.5, and the 1920's 150 %, behind a
// classic scrollbar, 24.75 → 27); but neither screen doubles by 200 %, each
// starting above the reference (×1.389 at 100 % for the iMac, ×1.375 for the
// 1920 behind a classic scrollbar; twice the 100 % size near 278 and 275 %):
// only §15.25 round 2's other lever, a cap at the reference, would double
// them. The TITLE: the floor LIFTS it under the reference (on the 1440 laptop
// behind a classic scrollbar 66.9 → 71.5 → 81.3px at 100 / 110 / 125 %) but
// leaves its ×1.11 on a 1920 screen. Its cost: the title would then read 65px
// at a 1140 window, against the 52.7 of every other `hero-scaled` title
// there (a doctor's name, the blog list's and the Team page's headings).
//
// ── THE RHYTHM BOX: the privacy policy's, top AND bottom — a flex column
// (`flex-col`, so the cover and the measure stretch across the column: the
// cover's root is an inline-size container and must be GIVEN its width) and
// the band's steps, 3rem on a column under 32rem, 4rem from it, 5rem from
// 48rem, the same above and below (`py-12 @lg:py-16 @3xl:py-20` —
// sections/PrivacyPolicy's three, token for token). At the top they stand the
// opener clear of the sticky header; at the bottom they are the page's last
// room, because THE ARTICLE ENDS THE PAGE. The owner, verbatim (2026-10-15):
// "ok, refactor on the blog post page. drop the map. … the map at the bottom
// is to be completley dropped." The map that had closed the article earlier
// that day — sections/ClinicLocation, placed by the page as it closes every
// page of the list — left the route on that word, and with it the 2rem room
// this box kept above it (the list's room under its pager, sections/PostList's
// UNDER THE PAGER); so the bottom is again what this band wore before the map
// came, the top's own steps.
// THE FOOTER IS THE NEXT BOX: the [locale] layout's <main> holds this band
// alone and the shell's Footer follows <main> — main's `flex-1` grows only a
// page shorter than the window, never an article — and ui/Container adds no
// padding of its own, so the conclusion's foot stands EXACTLY the bottom step
// above the Footer's top edge, its 1px rule over its white ground: 48px on a
// phone (a column under 32rem), 64 on an upright tablet, 80 from a 48rem
// column — and, inside THE BAND SCALE, 80 design pixels: 73.0 / 80.0 / 87.8 /
// 110.0px at 1280 / 1401 / 1536 / 1920 behind a classic scrollbar (the design
// pixel 0.912 / 1.000 / 1.097 / 1.375). MEASURED on the built privacy page,
// which wears the same three steps outside the scale (Chromium, 2026-10-15):
// from its last box's foot to the Footer's top edge 48px at 320 and 390, 64
// at 768, 80 at 1024, 1280, 1536 and 1920 — each its bottom padding to the
// pixel, nothing between <main> and the Footer, the <article>'s foot on the
// Footer's edge. PostPage.stories.tsx's plays hold the bottom step, × the
// design pixel inside the scale.
// THE STACK — the one gap between the opener, the cover and the measure — is
// 3rem (`gap-12`), the privacy policy's band rhythm, chosen
// by measuring against the spacings round it: the title to its by-line is
// 16px (PostHeader), the reading time's row to the picture 16px (PostCover),
// two blocks of the article 40px (the measure, below). 3rem is three times the
// two inner gaps — so the by-line binds to the title and the reading time to
// the picture, never to each other across the stack — and a step past the
// measure's 40px, so the picture's foot and the first paragraph are further
// apart than any two blocks of the text: the page reads in three parts (who
// and what · the picture · the text) and the text's own blocks as one run.
// FOUR STACKS WERE PHOTOGRAPHED, at 390 and 1536 — 32, 40, 48 and 64 design
// pixels: at 32 the by-line and the reading time read as one cluster of small
// print; at 40 the first paragraph sits exactly as far under the picture as a
// subheading under its paragraph, so the text seems to run on from the
// picture; at 64 the opener floats off its picture on a phone. 48 holds the
// three parts apart and each part together.
// MEASURED on the stories (Chromium, the real faces, behind the runner's
// classic 15px scrollbar): the stack is 48px at 320, 390 and 768 — outside
// the scale, the theme's own 3rem — and 43.8 / 48.0 / 52.7 / 66.0px at 1280 /
// 1401 / 1536 / 1920, inside it (the design pixel 0.912 / 1.000 / 1.097 /
// 1.375); PostPage.stories.tsx's MEASURED has the rest.
//
// ── THE MEASURE: `mx-auto flex w-full max-w-2xl flex-col gap-10`. The
// example's narrower centred column of text, under the cover that spans the
// whole column. `w-full` with `max-w-2xl`: the column's own width on a phone
// and an upright tablet (every column under 42rem), 42rem from there;
// `mx-auto` centres it (an auto margin on a flex item in the cross axis takes
// the free space on both sides). Inside THE BAND SCALE the 42rem is 672
// design pixels, so the text column keeps its share of the page at every
// laptop and desktop width.
// ITS LINE LENGTH, MEASURED (the stories, the real faces — full lines of the
// demo's paragraphs): about 83 characters of the 18px reading text a line at
// the owner's 1401 window, 81 to 87 inside THE BAND SCALE — at the stories'
// 1200, 1280, 1401, 1536 and 1920 (the text and the measure grow together,
// and the face's optical sizing sets a larger size a little narrower per
// em) — 74 on a 768 tablet, where the column is narrower than the measure,
// 41 on a 390 phone and 33 at 320 (PostPage.stories.tsx's MEASURED, the same
// range). The long end of comfortable reading, a little over the 80 that
// SC 1.4.8 names (AAA, outside the site's AA bar); Tailwind's next container
// step down, 36rem, would hold about 71 by proportion (not measured) — the
// build contract's 42rem stands, and that one token is the lever.
// THE GAP BETWEEN BLOCKS, 40px (`gap-10`) — PostProse's builder's measured
// recommendation: a run that OPENS on a subheading takes no room of its own
// (PostProse's A SUBHEADING THAT OPENS THE STACK TAKES NO ROOM), so the
// measure's gap is the room above it, and 40px is exactly what an inner
// subheading stands from the paragraph above it (16px of gap and 24px of
// room) — every subheading on the page the same distance from the text it
// closes, whether a block boundary falls between them or not. A blog photo,
// a before/after and the conclusion stand the same 40px off, the measure's
// gap their whole room above and below (a blog photo's own 16px stand
// between its heading, its picture and its note, sections/PostPhoto's THE
// LAYOUT; a pair's box ends on its notes). A GALLERY KEEPS ROOM OF ITS OWN,
// inside its box (sections/CardCarousel's THE LIFT, THE ROOM and THE BEADS):
// 8px over its cards — the stage's two theme steps of padding over the lift
// its negative margin hands back — and under them a 40px room for a card's
// shadow and the 44px row of its beads, so its cards stand 48px under the
// block above, and the beads' row ends 40px over the block below. MEASURED
// (2026-10-21, the components runner, Chromium, the real stylesheet, behind
// a classic 15px scrollbar): 8 over and 84 under the centre card at 320, 390
// and 1401, and × the design pixel inside THE BAND SCALE — 11 and 115.5 at
// 1920.
// A RUN THAT ENDS ON A SUBHEADING — RECORDED, NOT BUILT (2026-10-20, round 2
// of the Opus accessibility review; its distances re-measured 2026-10-21,
// round 3): nothing of its own run stands under that subheading, so the room
// under it is this gap and whatever room the next block keeps over its own
// top, where every other subheading has 16 under it. The demo has one:
// „Pentru copii", alone in its run, its paragraph coming after the second
// gallery, stands 40px under the before/after pair's notes and 48 over the
// gallery's cards — the gap and the gallery's own 8 — so it sits NEARER the
// pair above, which it does not head (40 / 48 at 320, 390 and 1401; 55 / 66
// at 1920, the same × the design pixel).
// PostProse names this band's gap as the lever (its A SUBHEADING THAT ENDS
// ITS RUN BREAKS "40 OVER, 16 UNDER"): a smaller gap after a prose block
// whose last item is a heading — 16px, the room under every other
// subheading, which with the gallery's own 8 would set „Pentru copii" 24 over
// its cards — or the article's own order.
//
// ── THE BLOCKS, in the article's order, each by its `kind` — FOUR KINDS, each
// its section: `prose` → sections/PostProse (a run of paragraphs and
// subheadings), `photo` → sections/PostPhoto (THE BLOG PHOTO: one picture as
// wide as the measure, a heading over it and a note under it, each
// optional), `gallery` → sections/PostGallery (the card carousel — three
// cards in its window, always: PostGallery fixes the window, so a gallery
// block names its cards, its `mode` and its words, and no window),
// `beforeAfter` → sections/BeforeAfter (two blog photos side by side, THE
// LINE between them, the pair ONE SHAPE). The owner, verbatim (2026-10-15):
// "now this section with before and after is to be derived from another
// section which is just like a "blog image section" … now i want you t
// refactor it as 2 section as the blog photo and then blog photo turns into a
// before and after section." A photo block IS PostPhoto's content
// (PostPhotoContent) and a pair block BeforeAfter's three parts (`images`,
// `headings`, `notes`), every note already FINISHED by the route („Notă:
// …") — so the band hands each on as it came and adds no word to it.
// BY NAME, NEVER THE BLOCK SPREAD: each case names its block's parts one by
// one in a HAND-OFF object and spreads that, because a block spread would
// hand the section the block's `kind` too, and each of these sections passes
// its unknown props through to its root (§6.8) — `kind="photo"` would land on
// the <figure>, `kind="beforeAfter"` on the pair's box. A photo is handed no
// `sizes`: PostPhoto's default (POST_PHOTO_SIZES) is derived for exactly this
// place, a picture as wide as the measure; the pair's halves carry their own
// (BeforeAfter's THE HALVES' `sizes`).
// EVERY PART HANDED ON (2026-10-20, round 2 of the Opus reviews): parts named
// by hand would drop a NEW part in silence — a credit added to
// PostPhotoContent would type-check at every call site and never reach the
// <figure>. So each hand-off object `satisfies` a Record of its block's parts
// (`PartsOf`: every key of the block but its `kind`, in every shape of that
// kind, each REQUIRED there — for a photo, PostPhotoContent's keys): a new
// part stops renderBlock compiling until its case names it, and a key that
// is no part — a className — WRITTEN in the object stops it too, since
// `satisfies` checks an object literal's own keys for excess ones. A key
// that arrives through a SPREAD is not checked: `{ ...block } satisfies …`
// compiles wherever the block's parts are all required — a gallery's — and
// carries the block's `kind` with it. What holds the hand-offs to their
// parts alone is PostPage.test.tsx: its source test reads each object key by
// key and refuses a block spread anywhere in this file, and its render tests
// find no `kind` attribute anywhere in the DOM — nor a pair's or a
// gallery's part names — and every photo's and pair's root carrying its
// class alone (2026-10-21, round 3 of the reviews).
// The route's mapping, the step before this one, is held the same way (its
// THE MAPPERS): src/app/[locale]/blog/[slug]/populate.ts' galleryBlock,
// photoBlock and pairBlock each build their block's parts in an object that
// `satisfies` the article file's block's parts — so a part added to
// lib/blog-article's file shape does not compile there until it is handed
// on — and hand that object on whole, an absent part an absent key; its
// suite lays fixtures that carry every part (typed `Required<…>`) and reads
// every laid block's keys against them.
// An EXHAUSTIVE switch: the `never` line after it stops a fifth kind
// compiling until it is placed here, and a kind that escaped the types (a
// cast, a JSON the route mis-read) fails the BUILD by name — never a block of
// the owner's article dropped in silence (PostProse's renderItem, the same
// rule). THE KEYS ARE INDICES — safe by React's own rule (PostProse's THE
// KEYS ARE INDICES): the list is static, rendered on the server in the
// article's order, never reordered, filtered or inserted into, and two blocks
// with the same words stay two. A `prose` block with no items renders nothing
// (PostProse's NOTHING TO SAY RENDERS NOTHING), and a `gallery` with no cards
// nothing either (sections/CardCarousel renders nothing for an empty list),
// so neither opens a double gap in the measure; a photo and a pair always
// draw their pictures — the one part neither goes without.
// THE CONCLUSION IS ALWAYS LAST, after the blocks, inside the measure — not a
// block of the list, a prop of its own: an article without it does not
// compile, and no JSON order can move it up.
// NO BLOCKS STILL MAKES A PAGE: the opener, the cover and the conclusion
// (the NoBlocks story) — the route never builds one, the band never crashes
// on one.
//
// ── THE COVER IS THE PAGE'S LCP: PostCover's `preload` is set HERE, always
// (no `loading="lazy"`, a high fetch priority, a preload link with the
// cover's `sizes`) — it is the first picture of every article, under the
// opener on every screen; every other picture of the page — every gallery's
// cards, the blog photos, the before/after pairs, the doctor's circle — stays
// lazy, their own sections' default (a blog photo is never the page's LCP:
// it stands in the text, under the cover). The share controls drop into the
// cover's `share` slot as sections/ShareLinks, so the cover itself imports no
// share code and stays a server component.
//
// ── ZERO ISLANDS OF ITS OWN (§16): no 'use client', no state, no effect, no
// handler — `useId` is server-safe. The page's script rides in with two of
// its sections: ShareLinks' copy button, through the cover's slot
// (sections/ShareLinks/CopyLinkButton), and each gallery's carousel
// (sections/CardCarousel, which sections/PostGallery composes — the cards it
// moves are server-rendered and pass through it); ui/Image brings its
// optimizer's small island with each picture, as on every page with a
// photograph. The blog photos and the before/after pairs add NONE:
// sections/PostPhoto and sections/BeforeAfter (built on it) are server
// components — no directive, no hook, no handler — so a photo or a pair
// reaches the browser as markup alone, its picture's optimizer island aside.
// PostPage.test.tsx pins the directive's absence and the import surface from
// the source text, because no runtime assertion can see either.
//
// ── WHAT THIS BAND DOES NOT OWN: any word (the route's), any colour or
// paint (the sections' own; the body paints the ground), the band scale's
// numbers (ui/Container's), the cover's and the blocks' inner spacing (each
// section's own — §6.4: the parent owns spacing BETWEEN its children, through
// gaps, and here no child carries an outer margin), the page's other bands —
// a band of the article's related posts, should one ever come, is the page's
// to place after this one (and the room above it the page's question: this
// band's bottom step is the room it leaves the Footer, THE RHYTHM BOX).

/** One block of an article's body, in the article's order — every string
 *  FINISHED (§8.1), every note with its lead-in. The route groups the
 *  article's consecutive paragraphs and subheadings into one `prose` block;
 *  a blog photo is PostPhoto's content and a before/after BeforeAfter's three
 *  parts, as the sections take them (THE BLOCKS). */
export type PostPageBlock =
  | Readonly<{ kind: 'prose'; items: readonly PostProseItem[] }>
  | Readonly<
      { kind: 'gallery' } & Pick<
        PostGalleryProps,
        'cards' | 'mode' | 'labels' | 'slideLabels'
      >
    >
  | Readonly<{ kind: 'photo' } & PostPhotoContent>
  | Readonly<
      { kind: 'beforeAfter' } & Pick<
        BeforeAfterProps,
        'images' | 'headings' | 'notes'
      >
    >;

type PostPageOwnProps = {
  /** The opener: the post's title — the page's <h1> and the article's name
   *  — and the whole finished by-line („de Dr. …"). */
  header: Readonly<{ title: string; byline: string }>;
  /** The cover's content — the reading time, the picture, the categories and
   *  their list's name. Its share slot and its preload are this band's. */
  cover: Readonly<Omit<PostCoverOwnProps, 'share' | 'preload'>>;
  /** The four share controls — sections/ShareLinks' own five props: the
   *  list's name, the three links and the copy control — dropped into the
   *  cover's slot as given. Never ShareLinks' native props, which ride its
   *  ROOT — the generic box round the list and its status line since
   *  2026-10-20 (ShareLinks' THE ROOT AND THE BELT) — as no other part takes
   *  its section's: that box's place is the cover's slot's (PostCover's THE
   *  ROW), never the page's (narrowed 2026-10-20, on a review's note). */
  share: Readonly<
    Pick<ShareLinksProps, 'label' | 'facebook' | 'whatsapp' | 'email' | 'copy'>
  >;
  /** The article's body, in order: runs of prose, blog photos (one picture
   *  as wide as the measure, a heading over it and a note under it, each
   *  optional), galleries (a card carousel each) and before/after pairs (two
   *  blog photos side by side, one shape). Empty is a page all the same (THE
   *  BLOCKS). */
  blocks: readonly PostPageBlock[];
  /** The doctor's closing words and who said them — always the last block. */
  conclusion: PostConclusionOwnProps;
};

export type PostPageProps = PostPageOwnProps &
  // The native <article> surface minus this band's own names, minus
  // `children` and `dangerouslySetInnerHTML` (the content arrives as the
  // five named parts; markup set beside them would compile and then throw
  // at render — React refuses both on one element — so it is refused where
  // it is written, as PostHeader, PostProse, PostConclusion, ShareLinks and
  // BeforeAfter refuse it), minus the two ARIA naming attributes — the
  // article's name is its <h1>'s alone — and minus `role`: it is an article
  // (THE NAME's belt). React 19 carries `ref` inside these props (§6.8).
  Omit<
    ComponentPropsWithRef<'article'>,
    | keyof PostPageOwnProps
    | 'children'
    | 'dangerouslySetInnerHTML'
    | 'aria-label'
    | 'aria-labelledby'
    | 'role'
  >;

/** THE RHYTHM BOX (the header's paragraph): the stack and the band's steps —
 *  the privacy policy's, the same above the opener and below the conclusion,
 *  where the shell's Footer follows — with ui/Container's two band strings,
 *  imported, never re-spelled. No `@container` (THE BAND SCALE). One static
 *  string per class: Tailwind reads class names from source text. */
const RHYTHM = cx(
  'flex flex-col gap-12 py-12 @lg:py-16 @3xl:py-20',
  bandColumnClasses,
  bandScaleClasses,
);

/** THE MEASURE (the header's paragraph): 42rem at most, centred, its blocks
 *  40px apart. */
const MEASURE = 'mx-auto flex w-full max-w-2xl flex-col gap-10';

/** Every key of `T` — of EVERY shape when `T` is a union: a conditional type
 *  over a bare parameter distributes, where `keyof` of a union keeps only the
 *  keys every shape shares, and a part one shape alone carries would never
 *  be asked for (2026-10-21, round 3 of the Opus reviews). */
type KeysOf<T> = T extends unknown ? keyof T : never;

/** A block's PARTS — every key it carries but its `kind`, in every shape its
 *  kind takes — each of which its case in renderBlock must hand on (THE
 *  BLOCKS' EVERY PART HANDED ON). NEVER VACUOUS: a kind no block carries (a
 *  `kind` widened to `string` Extracts nothing) and a kind with no part
 *  would each leave a Record over no key, which every object satisfies,
 *  excess keys and all — so each is a key no object has instead, naming the
 *  problem in the error. */
type PartsOf<Kind extends PostPageBlock['kind']> = [
  Exclude<KeysOf<Extract<PostPageBlock, { kind: Kind }>>, 'kind'>,
] extends [never]
  ? `PartsOf<'${Kind}'>: no block of this kind has a part to hand on`
  : Exclude<KeysOf<Extract<PostPageBlock, { kind: Kind }>>, 'kind'>;

/** One block as its section. TOTAL over PostPageBlock: the `never` line stops
 *  a fifth kind compiling until it is placed here, and a kind that escaped
 *  the types fails the build by name (THE BLOCKS). Each case names its
 *  block's parts in a HAND-OFF object and spreads that, never the block: the
 *  object `satisfies` a Record of the block's parts, every key required, so
 *  a part added to a block's type does not compile here until its case
 *  hands it on, and a key that is no part WRITTEN in the object (a
 *  `className`) does not compile either — one arriving through a spread is
 *  PostPage.test.tsx's to refuse (THE BLOCKS' EVERY PART HANDED ON). */
function renderBlock(block: PostPageBlock, index: number): ReactElement {
  switch (block.kind) {
    case 'prose': {
      const prose = {
        items: block.items,
      } satisfies Record<PartsOf<'prose'>, unknown>;
      return <PostProse key={index} {...prose} />;
    }
    case 'gallery': {
      // The four props, and no window: PostGallery fixes it. The block
      // itself is never spread: its `kind` would ride CardCarousel's native
      // spread onto the <section> as an attribute.
      const gallery = {
        cards: block.cards,
        mode: block.mode,
        labels: block.labels,
        slideLabels: block.slideLabels,
      } satisfies Record<PartsOf<'gallery'>, unknown>;
      return <PostGallery key={index} {...gallery} />;
    }
    case 'photo': {
      // The three parts — PostPhotoContent's, the photo block's own — and no
      // `sizes`: PostPhoto's default is the measure's (THE BLOCKS). The block
      // spread would put its `kind` on the <figure> through PostPhoto's
      // native spread.
      const photo = {
        image: block.image,
        heading: block.heading,
        note: block.note,
      } satisfies Record<PartsOf<'photo'>, unknown>;
      return <PostPhoto key={index} {...photo} />;
    }
    case 'beforeAfter': {
      // The three parts — the block spread's `kind` would land on the pair's
      // box the same way.
      const pair = {
        images: block.images,
        headings: block.headings,
        notes: block.notes,
      } satisfies Record<PartsOf<'beforeAfter'>, unknown>;
      return <BeforeAfter key={index} {...pair} />;
    }
  }
  const unclassified: never = block;
  throw new TypeError(
    `PostPage: block ${index + 1} has the kind ${JSON.stringify(
      (unclassified as { kind?: unknown }).kind,
    )}, which is none of prose, gallery, photo and beforeAfter`,
  );
}

export function PostPage({
  header,
  cover,
  share,
  blocks,
  conclusion,
  ...rest
}: PostPageProps): ReactElement {
  const titleId = useId();

  return (
    // THE NAME's belt: the native props FIRST — the caller's className among
    // them, placement only (§6.8) — then a smuggled `aria-label` and a
    // smuggled `role` reset, then the article's own name.
    <article
      {...rest}
      aria-label={undefined}
      role={undefined}
      aria-labelledby={titleId}
    >
      <Container>
        <div className={RHYTHM}>
          <PostHeader {...header} titleId={titleId} />
          <PostCover {...cover} preload share={<ShareLinks {...share} />} />
          <div className={MEASURE}>
            {blocks.map(renderBlock)}
            <PostConclusion {...conclusion} />
          </div>
        </div>
      </Container>
    </article>
  );
}
