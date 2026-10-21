'use client';

import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  focusManners,
  handNavigation,
  useRotation,
  type FocusManners,
  type RotationRing,
} from '@/components/ui/use-rotation';
import type { ClockEnv } from '@/lib/clock/clock';
import { cx } from '@/lib/cx/cx';
import {
  liveRegion,
  signedOffset,
  type RotationStatus,
} from '@/lib/rotation/rotation';
import {
  ARRANGEMENTS,
  FIVE_FALLBACK,
  PERSPECTIVE,
  STEP,
  jumpedSince,
  poseAt,
  stackOrder,
} from './conveyor';
import { judgeAxis, releaseSteps, resist, type DragAxis } from './drag';
import { handOnTrack, placeOnTrack, trackLength } from './track';

// sections/CardCarousel — a carousel of CARDS on ONE LINE: the centre card
// straight and largest, the cards beside it smaller and turned away in 3D,
// every card's centre on one horizontal line and every card upright, the
// outermost pair fading out at the stage's edges, the whole of it moving on by
// itself until a press stops it, draggable, with a tall previous and next
// chevron at the stage's two edges and a row of beads under the cards. Built
// 2026-10-14 for the blog article's gallery; mounted on the article page
// through sections/PostGallery (which replaced the dashed „Galerie foto · în
// curând" placeholder the same day).
//
// Owner, verbatim (2026-10-14): "i want to create a new carrousell section for
// cards, with content i'll fill up letr … to have just left right buttons, to
// be a circular list, to be reactive and to have most left and most right card
// like appear/disappear into a gradient … like 60% disappeard in width, rest
// appeared and obviously gradient disappearing. i want one option with 3 cards
// … and 5 cards 3 intact … left right button as in other carrousell with
// reviews no stop button no speed . must be dragable and a smooth thransition
// form one to the other auto rotating" — then: "or actually they should have
// 2 modes, one rotating carousell, one with iamges left and right with full
// stop. and not to hold pure image, alwas hold a card and i'll decide later on
// card" — and, of the motion: "not same behavior as review cards, they should
// always rotate like in a line while bringin center one a bit up front, no up
// and down as reviews carrousell".
// On 2026-10-16: "they must have circular list as they have now. i also want
// them to have a simple list of articles with max left and max right. once an
// end i reached, it goes in the other direction. you can still controll them
// through swiping left right like now" — "create instance on 3 and instance
// of 5 cards … all must be instantiated. both with 3 and 5 iteration *and
// must also have 8 instances*".
// On 2026-10-17, the controls brought back as two tall arrows ("reimagine them
// as a like tall as the section and just the bigger smaller") and, of a mouse
// or a finger having no way to stop the automatic movement, "OPTION 1" — a
// press stops it for good (which presses, and what that leaves open: SC
// 2.2.2, below). Then, later that day, four messages: "give me the
// progress dots like on home hero with the "Ne facem timp să îți explicăm
// fiecare pas" which accounts for the "slides"." — "Imagine there is a
// horizontal line in the center of the central card. all cards centers must
// sit on that line and all must stand up right as the central one … i want 0
// designs that look like "Când o schimbi". i want all of them to look like
// "Pentru copii" as a frontal aspect, but circular or liniar alternative means
// for circular that it just restarts directly coming from the right with
// first option and linear that it just ends on last or first and starts going
// in that direction. the fiver option should als look and behave the same but
// is jsut a wider section" — "the left and right have to look and behave like
// this. the they should be on a transparent background or button, so no
// border to it, jsut a hovering smaller/larger. at rest it should be black
// the smaller larger sign(do the left right ones). on hover it gets a bit
// larger and lilla and it should be a distorted smaller larger sign on the y
// axis. it should be this sign but rather larger, like 600% taller" — "on main
// screen make it as wide as the screen". („Când o schimbi" headed the demo
// article's five-card RING, „Pentru copii" its three-card LINE: the ring is
// gone, ./conveyor's HISTORY.)
//
// ── THE TWO AXES, BOTH REQUIRED (no default hides a choice the owner makes
// per gallery):
//   · `visible: 3 | 5` — the window, both on ./conveyor's LINE (one conveyor:
//     the window decides only how much of it the stage shows). THREE shows the
//     centre and its two neighbours, the neighbours 60 % past the stage's
//     edges and fading — unchanged since 2026-10-14, to the bit (the geometry
//     test holds every card's drawn matrix to that day's function list). FIVE
//     shows the centre, its neighbours whole, and the NEXT PAIR as the
//     outermost cards, 60 % past the edges and fading — "just a wider
//     section". Below a column where a five-card card would be narrower than
//     12rem, five shows the three-card window (THE FIVE-CARD FALLBACK) — a
//     card of a fixed width never does (THE FIXED CARD). With
//     fewer cards than the window has places, the places with no card stay
//     empty;
//   · `mode: 'loop' | 'bounded'` — BOTH MOVE BY THEMSELVES since 2026-10-16,
//     one card every 5.5 s, until an activation stops them for good (THE
//     CONSUMPTION LAW, SC 2.2.2). 'loop' is the circular carousel: the ring
//     wraps, and after the last card the first comes in from the right.
//     'bounded' is the owner's "simple list … with max left and max right":
//     out to the last card, then back the other way to the first, never
//     wrapping (./track — a ring of 2(N − 1) steps on the same clock,
//     lib/rotation untouched); the places beyond its ends stay empty, and a
//     drag past an end resists and springs back.
//
// ── THE CARD CAP: without a fixed width (THE FIXED CARD, below) a card is
// the column's share — for five, the column less the two bars' room ÷ 3.2995;
// for three, the column ÷ 1.7521 — held at 20rem at most, so in a wide column
// the stage stops growing and centres: the article's gallery. The cap is ONE
// custom property, `--cap`, read by the share alone. `cardCap`, optional,
// has one value, 'capped' — the default, which sections/PostGallery spells
// because its picture hint is derived for exactly that card. Its second
// value, 'none' (2026-10-17, "on main screen make it as wide as the screen":
// the cap lifted, the card the whole column's share), lost its one consumer
// when the Home band took THE FIXED CARD the same day, and left with its rule
// on 2026-10-20 (the owner's "no dead code"; the lane's G2 review).
//   · WHY A PROP WITH ONE VALUE STAYS — THE BACKSTOP (the round-2 review,
//     MEASURED by PostGallery's): it draws nothing the default does not, and
//     it has one job — a consumer that spells it turns a fixed width leaked
//     into its spread into the "both given" RangeError at build, where the
//     width alone would draw a fixed card without a word (a 400px card in
//     the gallery's measured case). And it is held at run time: any value
//     but 'capped' — a JavaScript caller's 'none' among them, which until
//     then drew the capped card in silence — is a RangeError.
//
// ── THE FIXED CARD (2026-10-17 — the Home band's miniatures: "the blog card
// at 65 %, every card the same shape … reactive width wise with screen … but
// if it narrows down too much width wise, it should adjust maybe from the
// gradiented sides", the carousel "the width of the ÎN CIFRE section"):
// `cardWidth`, the OTHER answer to how wide a card is — never beside
// `cardCap` (the types refuse the pair, CardCarouselCardSize; a JavaScript
// caller that sends both meets a RangeError). A CSS length the consumer writes
// in the theme's step, `calc(var(--spacing)*56.45)`, set as the root's
// `--card-fixed`, so THE BAND SCALE redraws it — and a length that never
// names `var(--spacing)` meets a RangeError (2026-10-20, the lane's G2
// review): a px or rem width would keep its size inside a scaled band while
// everything round it scales, without a word. Checked at run time — at build,
// for a server-rendered page — rather than by a template-literal type, which
// the Home band's width could not satisfy: it is built from that band's own
// constants, a string to TypeScript. With it (FIXED, below):
//   · every card is exactly that wide — never the column's share, never
//     capped — and never wider than the column itself, so the centre card is
//     always whole (a guard that binds only in a column narrower than one
//     card: a 225.8px card under a 320px screen at 150 % zoom);
//   · NOTHING SWITCHES: the window asked for (`visible`) stands at every
//     width — THE FIVE-CARD FALLBACK is the share's, and a fixed card never
//     changes size;
//   · the STAGE IS THE COLUMN, always (`100cqw`), the arrows at its edges —
//     the column's — and the beads centred under it;
//   · the room a side (`--inset`) is what the column leaves beside the
//     window, `max(0, (column − card × ratio) ÷ 2)` — on a wide column wider
//     than a strip, plain page ground between each arrow and the faded
//     outermost card, the mask transparent across all of it;
//   · the fade is the outermost card's 40 %, `card × fade`, from the room's
//     inner edge in; and where the column is narrower than the window the
//     room is none and the stage's edges cut the sides — the fade starting at
//     the edge, so whatever the edge cuts always fades out, never a hard cut —
//     the arrows over the fade (the phone case THE HALO is for). The cards
//     keep their size and their poses, so the lift, the drag's step (STEP ×
//     the card, measured) and the no-fly rule hold at any width;
//   · THE CENTRE CARD STAYS WHOLE on the narrowest phones (2026-10-17, found
//     on the built Home band: at a 320 phone its edges showed at 57 %, and an
//     arrow's strip reached 4.9px over it): the fade ends no further in than
//     the centre card's edge, `min(card × fade, max(0, (column − card) ÷ 2 −
//     room))` — never binding on a wide column, where five's
//     `card × (ratio − 1) ÷ 2` dwarfs it; and an arrow's strip is the whole
//     bar where the column leaves that much beside the card, what it leaves
//     down to 24px — SC 2.5.8's minimum target — and 24px below that,
//     `max(24px, min(bar, (column − card) ÷ 2))` — the floor outside, so it
//     binds where nine theme steps are themselves under 24px too (a 9px
//     default font size: 20.25px; until the round-2 review it sat inside the
//     `min()`, where the nine steps won) — its chevron narrowing with it
//     (THE CHEVRON's box) so the drawing never leaves its strip.
//   MEASURED by the geometry test, a 225.8px card and five (a window of
//   3.299523 × 225.8 = 745.0px): the room 180.5px a side in a 1106px column,
//   77.5 at 900, 36.0 at 817 and none from 745.0 down, where the cut begins;
//   the stage the column at every width; the fade 54.1px down to a 334.0px
//   column. On phones (ui/Container's column, overlay scrollbars): a 390
//   window — column 351 — 62.6px beside the card, the fade 54.1, the strips
//   36; 375 — 337.5 — the same; 360 — 324 — 49.1 beside it, the fade 49.1,
//   the strips 36; 320 — 288 — 31.1 beside it, the fade and the strips 31.1;
//   280, a Galaxy Fold's cover screen — 248 — 11.1 beside it, the fade 11.1,
//   and the strips at their 24px floor, OVER the card's edge by 12.9px (a tap
//   there is the arrow's), the chevron 20px wide. The whole bar from a 297.8px
//   column — a 331px window. At 768 and 1401, and in the article's three-card
//   capped galleries at every width, nothing moved.
//
// ── THE CARDS' HEIGHT (2026-10-17 — the Home band's cards: "the cards seem to
// vary in height. make them a fixed height so that they maintain same
// shape"): `cardHeight`, optional, 'own' by default — each card at its own
// height, centred on the line (the article's galleries). 'tallest' stretches
// every card's box to the stage's one row (`self-stretch`, in place of the
// stage's centring) — the row as tall as the TALLEST card, since the stage
// lays every card out in that one cell — so a consumer's card that says
// `h-full` fills it: one height, one shape. No measuring and no script: the
// layout does it, so a longer translation or a reader's text-spacing override
// (SC 1.4.12) makes every card taller together, and nothing overflows. The
// line is the cards' common centre, and with one height they share it
// exactly; the arrows' overlay is the row whatever its height, the room under
// the cards is the shadow's, and THE LIFT reads the card's width.
//
// ── WHY ONE FILE AND FOUR PIECES. The two modes share every pixel, every
// gesture, the clock and its holds (useCarouselClock), and differ only in the
// ring they run — the list itself for 'loop', the track for 'bounded' — and in
// what a hand does to it. So the exported CardCarousel DISPATCHES, LoopCarousel
// and BoundedCarousel each own their ring's arithmetic, and CarouselView draws
// both. Switching `mode` between renders remounts (two component types), the
// honest answer for a prop that changes what the component IS.
//
// ── THE SLOT (§6.2, "slots over modes"): `slides` are server-rendered CARDS
// passed THROUGH this island (the ui/Ribbon / sections/DoctorShowcase
// pattern): the island moves their boxes and never renders inside them. What a
// card holds is the owner's to decide later; the stories' portrait photo card
// is a stand-in. Every word arrives FINISHED (§8.1) — the region's name, the
// two roledescriptions, previous, next, the beads' group name, and one label
// per card („3 din 8") — because a formatter is a function and a function
// cannot cross the server → client boundary. Zero message keys, zero t(), zero
// site data.
//
// ── THE ARROWS (2026-10-17 — the owner's "on a transparent background … no
// border … on hover it gets a bit larger … a distorted smaller larger sign on
// the y axis … like 600% taller", and, later the same day, "always lilla even
// at rest and grey in case of disable … like 15% thinner … a very very little
// moved to the sides"). Previous and next are two plain <button>s, always
// visible, in both windows and both modes, FIRST in the DOM (THE CONSUMPTION
// LAW's order).
//   · WHERE: one overlay, absolutely placed in the root's first grid row —
//     the stage's own (the root says `relative` itself: `container-type`
//     makes a box neither a positioning scope nor a stacking context in
//     current engines, CLAUDE.md §15.20 round 4) — as wide as the stage and
//     centred like it, from the cards' top down to the start of its room, so
//     each button is AS TALL AS THE CARDS' ROW and reaches neither into the
//     lift above them nor into the shadow's room; one step above the cards
//     inside the root's own stacking context. The overlay lets every pointer
//     through to the cards but the two buttons', which stand at its two ends,
//     their outer edges on the stage's edges — in THE BARS' ROOM below: a
//     strip `--bar` wide (nine theme steps, 2.25rem, never under 24px — BAR),
//     the one spelling of the strip's width, read by the buttons and by the
//     room the stage keeps for them. It adds nothing to the root's box, so
//     the stage never moves.
//   · THE LOOK: NOTHING PAINTED BUT THE CHEVRON — and its halo, the page's
//     own colour (THE HALO, below) — no ground, no border (the stylesheet's
//     preflight leaves a <button> transparent and borderless, and this one
//     adds neither). One single chevron each, pointing out ("the smaller
//     larger sign"), in the lavender `--accent` at rest AND under a mouse
//     (4.81:1 on the page ground, 5.06:1 on white — a graphic's 3:1 met with
//     room), only a little larger there, scale 1.1; pressed the deep
//     `--accent-strong` (8.88:1 on the page, 9.34:1 on white) and back to its
//     own size; disabled, GREY (DISABLED, below). The colour no longer
//     changes under the mouse, so it no longer glides: the press and the
//     disabling snap it.
//   · THE JUMP, ui/Button's `motion="jump"` (CLAUDE.md §15.30 round 3) on its
//     size clock — `--jump`, 200ms ease-out, the press snapping it — with
//     one difference: THE CHEVRON GROWS, NOT THE BOX. The button is a strip as
//     tall as the cards' row (427px beside a 320px card); scaled, its
//     transparent box would reach 21px over whatever stands above and below
//     the carousel, and 1.8px past the stage's edge — a sideways scroll on
//     every hover wherever the stage meets the screen's. The chevron grows
//     inside its strip:
//     24 × 144px → 26.4 × 158.4px in a 36px strip. So the size's glide is the
//     chevron's own (`transition-[scale] duration-(--jump) ease-[ease-out]`,
//     the spelling of sections/PostCard's CARD_JUMP, on Button's numbers), and
//     the button says WHEN, through its child: `enabled:hover:*:scale-110`,
//     `enabled:active:*:scale-100`, `motion-reduce:enabled:hover:*:scale-100`
//     and `active:*:duration-0` — the press's snap — each one rule the same
//     weight as the one it overrides and later in the sheet (Tailwind sorts
//     the active state after the hover state and reduced motion after both;
//     the geometry test reads the order off the stylesheet). Reduced motion
//     keeps the size still. Tailwind's `hover:` answers only a pointer that
//     can hover, so a touch screen never keeps the larger size after a tap.
//   · THE CHEVRON (2026-10-17): drawn HERE, an `aria-hidden` inline SVG — not
//     the glyph folder's ChevronLeft and ChevronRight, whose 24-unit grid
//     draws a 6 × 12-unit sign in a square box: stretched to the owner's
//     "600% taller", that sign would be a 6px sliver. The folder's README asks
//     a glyph for a square 24-unit grid and keeps behaviour out of the folder
//     (its rule 7: a control's artwork is its feature's — the Header burger's
//     precedent); this drawing is neither square nor inert. Its box is 1.5rem
//     wide and 9rem tall (six theme steps by `h-36`: 24 × 144px, six times
//     taller than wide), never taller than its strip (`max-h-full`) and never
//     wider than its strip less a theme step — a strip only a fixed card
//     narrows (THE FIXED CARD); its viewBox is the
//     same 24 × 144 units and `preserveAspectRatio="none"` lets the box's
//     shape decide the drawing's; the sign spans the box less a unit (an arm
//     from a corner to the opposite edge's middle and back), and its stroke
//     keeps its thinness — `vector-effect: non-scaling-stroke` on the path,
//     the width 0.425 of a theme step (1.7px at the default root, the owner's
//     "15% thinner" than the 2px it was, so THE BAND SCALE thickens it with
//     the box) — however the box is stretched. It stands against its strip's
//     OUTER edge, half a theme step (2px) in from it — 4px further out than
//     the strip's centre, the owner's "a very very little moved to the sides":
//     at rest the line's outer edge lies 2.15px and the halo's 0.15px inside
//     the strip; grown 1.1× under the mouse, the box still 0.8px inside it and
//     the line 1.05px, only the halo's page-coloured rim reaching 0.95px past
//     the strip onto the page ground beyond the stage — paint, never a box, so
//     never a scroll, and invisible there.
//   · THE HALO (2026-10-17, the planner's answer to the phone below): under
//     the line the same path is drawn first in the page ground, the line's
//     width and half a theme step more a side — 5.7px round the 1.7px line,
//     round and non-scaling like the line — so the line ALWAYS lies on the
//     page colour: 4.81:1 lilac, 8.88:1 pressed, 3.02:1 grey disabled,
//     whatever passes under it. The halo's stroke is the `--page` token,
//     never currentColor, so it never takes the arrow's colour; it is inside
//     the chevron, so it grows with it; on the page ground it is page on page
//     and draws nothing (the geometry test compares the strip's pixels with
//     and without it: a few levels of 255 at most, along the line's
//     anti-aliased edge — the same colour, rounded once more — never a
//     visible rim); in forced colours it is not drawn — the system colours own
//     that mode, and a page-coloured rim round a system-coloured line would be
//     the one colour the user did not choose.
//   · ON A PHONE the three-card window keeps no room (THE BARS' ROOM), and a
//     chevron stands over the outermost 36px of a neighbour's fade — the case
//     the halo exists for, more so for a lilac line, which a grey photograph
//     swallows. Computed over a BLACK photograph, the worst ground, at the arm
//     ends, where the photograph shows most: WITHOUT the halo the line's edge
//     read 1.23:1 in a 288px column (the photograph at 50 % there) and 1.65:1
//     in a 351px one (41 %) — far under SC 1.4.11's 3:1; WITH it the line
//     reads 4.81:1 against its own surround everywhere, and the halo's edge,
//     2px further out, stands out from that black photograph at 4.45:1
//     (288px, the photograph at 54 %) and 3.23:1 (351px, 44 %). At the tip,
//     beside the stage's edge, the photograph is gone (0–4 %) and the halo
//     melts into a ground already the page's — the line is on light ground
//     there either way. RENDERED at a phone's density — three device pixels
//     to the CSS pixel, over black cards by the arm ends, in Chromium, WebKit
//     and Firefox alike — the line's core is the lilac itself, rgb(116 104
//     148), and its halo's middle the page itself, rgb(250 249 247): 4.81:1;
//     a disabled line rgb(145–147 143–144 140–141), 3.02–3.07:1; no sideways
//     scroll at 320 or 390. The geometry test reads the runner's screenshots,
//     0.81 of a CSS pixel, where a 1.7px line and its 2px of halo blur into
//     each other, and pins only the halo's presence: with it the line's worse
//     side light (0.57–0.84 in luminance), without it the photograph's grey
//     (0.21–0.34).
//   · DISABLED (the bounded list at an end): GREY — the ink, its line alone at
//     half strength over its whole halo (LINE), so the same rgb(147 144 142)
//     on the page and over a photograph: 3.02:1 on the page (an inactive
//     control, outside SC 1.4.11), and 1.60:1 lighter than the lilac, so the
//     state shows without colour vision too (the faint ink, 4.70:1, would sit
//     at the lilac's own lightness — 1.02:1 — told from it by hue alone). It
//     is never lilac or larger: every press and size rule answers an ENABLED
//     button only. A disabled button keeps its pointer events — what looks
//     like a control is never a hole a press falls through to the card under
//     it — and the press that disables the button it was made with hands
//     focus to the other (THE FULL STOP'S FOCUS).
//   · THE FOCUS RING: the house's 2px of `--focus` (16.96:1 on the page), for
//     the keyboard only (`:focus-visible`), drawn INSIDE the strip — its
//     outermost 2px, ui/Modal's and the dropdown ⌄'s negative offset — so its
//     outer edge, on the stage's edge, lies where the mask shows the page
//     ground. The chevron's box starts where the ring ends: the ring frames
//     the chevron and never crosses its line.
//
// ── THE BEADS (2026-10-17 — "the progress dots like on home hero"). One bead
// per card in a row centred UNDER the stage, in flow — below the stage's room,
// so never over a card or its shadow — copying sections/Hero's beads (its THE
// BEADS ARE BUTTONS paragraph): BUTTONS with aria-current="true" on the
// current one, NOT a tablist (lib/rotation's law), each named by the SAME
// string as its card (`slideLabels[i]`), in a role="group" named
// `labels.picker` („Alege fotografia"); a hit box round an 8px dot — 24 × 44
// at the default root, two theme steps a side and eleven tall — the current a
// 28px pill, only the width and the colour moving (200ms, none under reduced
// motion), the Hero's focus ring — here the house's ink `--focus` on the page.
// KEEP-IN-SYNC with sections/Hero's bead markup (the hit box, the dot, the
// pill, their timing): CardCarousel.test.tsx reads both sources and holds the
// shared classes equal.
//   · THE HIT BOX NEVER UNDER 24 CSS PIXELS WIDE (2026-10-20, SC 2.5.8 — the
//     lane's G2 review, MEASURED): an idle box is six theme steps, 1.5rem,
//     so it is 24px only at a 16px root, outside a band scale. Inside a band
//     scale with no floor — an article's page — every theme step shrinks with
//     the design pixel, and the box was 24 × s under the 1401 reference
//     window (s = column ÷ 1106), the beads touching: 19.45 × 35.7px at a
//     1140 window, 21.9px wide at 1280, 23.3 at 1366, under the criterion's
//     24 (axe's target-size rule, off by default, counted 14 beads short at
//     1140 and 1280); and wherever the rem steps rule — phones, tablets, an
//     unscaled page — a default font size under 16px shrank it the same way,
//     18px wide at Chrome's „Small" (12px). So the box has an UNSCALED floor,
//     `min-w-[24px]` — the px floor the arrows' strips keep too (BAR,
//     FIXED_BAR) — and the dot is centred in it, `justify-center`; its
//     height, eleven steps, stays over 24px at the band scale's smallest
//     (35.6px at s 0.81). The Hero wears the same string and is never scaled:
//     there the floor binds only when the default font size is under 16px.
//   · IN FORCED COLOURS the dot's ground is the system's own, Canvas on
//     Canvas: a bead's dot draws nothing to rely on. The hit box wears a
//     border in that mode alone (`forced-colors:border`), so each bead shows
//     as a box, the current one the wider, and the Hero's beads the same.
// RECOLOURED for the page ground (the
// Hero's white beads sit on a dark veil): the idle dot `--ink-faint` (4.70:1
// on the page, 4.94:1 on white — SC 1.4.11's 3:1 kept on both grounds the
// carousel may stand on), one step darker under the mouse, `--ink-muted`
// (6.99:1), and the current pill the lavender `--accent` (4.81:1, 5.06:1).
// Nothing but WIDTH tells the current pill from an idle dot by lightness
// (`--accent` and `--ink-faint` are 1.02:1 apart): shape carries the state,
// colour only seconds it (SC 1.4.1), and aria-current says it. The shadow the
// Hero's beads wear (a white dot over a pale photograph) has no ground to
// answer here and is not copied. A bead press goes to its card — in 'bounded'
// through the track (./track's A HAND ON THE TRACK), so the walk would go on
// the way the hand went — and, like every activation (OPTION 1), stops the
// automatic movement for good. In the DOM the beads come after the two
// arrows and before the cards (the APG order the Hero follows: the controls
// first); in the picture they sit under the cards, the root's second grid
// row. RECORDED, two things:
//   · THE BEADS STAY BUTTONS, like the Hero's — the owner asked for "the
//     progress dots like on home hero" — although lib/rotation's law names a
//     re-open trigger for its buttons-not-a-tablist choice "if a picker ever
//     exceeds about six dots": eight in an article's gallery and twelve in
//     the Home band mean 10 to 14 Tab stops per carousel, the two arrows
//     included. The lever, NOT TAKEN: one Tab stop for the whole row — a
//     roving-tabindex toolbar, the arrow keys moving between beads.
//   · THE IDLE DOT'S `--ink-faint` IS A GRAPHIC USE — 4.70:1 on the page,
//     4.94:1 on white, against SC 1.4.11's 3:1 for a graphic — outside that
//     token's washed-prose charter in globals.css; the planner records the
//     use there.
//   · THE ROW (2026-10-17, the built Home page at a 320 phone: twelve beads
//     need 308px — eleven 24px hit boxes and the current pill's 44 — and the
//     288px column wrapped the twelfth onto a line of its own): the row is as
//     wide as its beads (`w-max`), up to the column and 1rem a side — ui/
//     Container's gutter floor, so the row reaches into the page's gutter and
//     never past it — and never wider than the screen
//     (`min(100vw, 100cqw + 2rem)`), centred on the column, spilling into the
//     gutter equally on both sides when the column is the narrower; it wraps
//     only past that. The root's ONE column is `minmax(0, 1fr)`: as an `auto`
//     track it would grow to a row that wide and pin it to its start
//     (MEASURED in Chromium, WebKit and Firefox — the centred row stood at the
//     column's start, 32px past its end; with the fixed column it spills 16px a
//     side in all three). MEASURED, twelve beads under the Home band's fixed
//     cards (overlay scrollbars, ui/Container's column): ONE line at 320 (the
//     row 308px in a 288px column, 10px into each gutter), 360, 390 and 440,
//     centred under the centre card; at 280 — a 248px column, the row capped
//     at the 280px screen — ten beads over two, both lines centred. The
//     article's galleries — eight beads, 212px — stand where they stood.
//
// ── THE CONSUMPTION LAW (lib/rotation's header), and where this follows the
// owner's own manners instead (sections/Hero's and the reviews deck's — Hero
// rounds 3–6, CLAUDE.md §15.21):
//   · a named <section> with a localized aria-roledescription; in the DOM the
//     controls come FIRST — previous, next, the beads — then the cards;
//   · every card a role="group" with the slide roledescription and its own
//     label, and every card but the centre one `inert` — the side cards are
//     previews — with aria-hidden as the belt for engines before `inert`
//     (Safari < 15.5, the deck's G2 item D). RECORDED (2026-10-20, the lane's
//     G2 review), not changed: the belt hides a side card from the
//     accessibility tree, not from Tab — in an engine without `inert`
//     (Safari before 15.5, Firefox before 112, both inside Next 16's default
//     browser targets) a side card's link on Home stays a Tab stop while
//     aria-hidden, focus landing on something no screen reader names;
//   · the cards' container is the live region, liveRegion(status) in both
//     modes: 'off' while it moves by itself, 'polite' once anything holds or
//     stops it (and under reduced motion, where it never moves by itself) —
//     and A PRESS'S OWN MOVE IS ANNOUNCED: the stop is committed on its own
//     BEFORE the move (ui/use-rotation's handNavigation, since 2026-10-21, the
//     round-3 review), so the region says 'polite' before any card turns
//     inert. Only CLICKS were in question: a click while the ring ran — a
//     mouse's, whose press let go of its hold at the release, or an assistive
//     technology's, which has no press — landed the stop and the move in ONE
//     commit, where React applies the cards' `inert` and `aria-hidden` before
//     the stage's `aria-live` (MEASURED: inert → inert → aria-live), the move
//     made while the region still said 'off' — the worst order for an engine
//     that judges politeness at the moment of a mutation. A drag never was:
//     its release lands while its press still holds the ring, the region
//     polite since the press. Now neither is;
//   · NO ROTATION CONTROL and no speed control, on the owner's word ("no stop
//     button no speed") — the reviews deck's exception, taken a third time —
//     and since 2026-10-17 the owner's OPTION 1 in its place: EVERY
//     ACTIVATION STOPS THE AUTOMATIC MOVEMENT FOR GOOD (SC 2.2.2, below). A
//     press on an enabled arrow or a bead pauses the ring and then moves it —
//     lib/clock's STICKY pause, through ui/use-rotation's handNavigation, the
//     law's stop-for-good for a rotator with no control (this island its
//     first consumer), the pause committed first (the live region, above); a
//     DRAG lands, stops the ring the same way, and only then lets go of its
//     hold (the pause outlives it); a TAP — a press on the stage that did not
//     become a drag: on a card's link, or on a side card, whose `inert` lets
//     the click through to the stage — stops it too;
//   · what only HOLDS it, and lets it go on a full interval later: a PRESS
//     anywhere in the region while it lasts — on the stage, an arrow or a
//     bead (THE HAND — since 2026-10-20 from the press itself: until then the
//     hold began only once a press became a drag, and a step could land
//     mid-tap — the G2 review MEASURED 4–7 % of 200–400 ms taps — turning the
//     card under the finger inert, its link not followed; and since the
//     round-2 review on the arrows and the beads too, which until then took
//     no hold, so a step could land between a press and its click, MEASURED
//     with fake timers: in 'loop' one press on next moved two cards, 1 → 3
//     of 7; in 'bounded' at „6 din 7" the step moved the list to 7 and
//     DISABLED the pressed next, whose click never fired — nothing stopped,
//     and the walk went on. A press that ends without a click, let go off the
//     carousel or taken by the browser for a scroll, stops nothing), and
//     keyboard focus inside the region (focusManners with keyboardEntry
//     'suspend', pointerEntry 'none') while it stays — until a key presses a
//     control, or a card's link (its click reaches the stage, a tap like any
//     other). THE WINDOW LEFT, NOT THE FOCUS (2026-10-20, the same review): a
//     focusout with no new target is also what the WINDOW losing focus sends
//     — another app, the find bar, a screen reader's list of elements — with
//     the page's focus where it was; lib/rotation's leavesRegion reads it as
//     leaving, so the ring went on, and 5.5 s later the focused card turned
//     inert and the browser threw its focus to the page. So the hold stays
//     while the document's active element is still inside the region. NO
//     pointer at rest holds it (a resting cursor is not a request, Hero round
//     3); reduced motion declines the automatic start (lib/clock), and a
//     press then has nothing to stop;
//   · and two holds of its own: OFF SCREEN (lib/clock's 'offscreen' cause, an
//     IntersectionObserver on the stage — CourseTimeline's way: the ring keeps
//     its card while nobody can see it, and a full interval passes after it
//     comes back) and A PRESS (lib/clock's 'drag' cause, added for this
//     island — named for the drag it was first taken for): no step lands
//     under a PRIMARY press, from its pointerdown anywhere in the region to
//     its end — its release, a cancel, or the press dropped (THE HAND); a
//     resting pointer, a mouse's other buttons and a second finger hold
//     nothing;
//   · fewer than two cards is not a carousel: no controls, no beads, no
//     roledescription, no groups, no live region, no drag, no clock (the
//     deck's G2 item E) — and no cards renders nothing.
// SC 2.2.2 — THE OWNER'S OPTION 1 (2026-10-17): EVERY ACTIVATION, by hand or
// by key, stops the movement for good — an ENABLED arrow, a bead, a drag, a
// tap on the stage or on a card: that is the way to stop the moving content.
// What stops NOTHING: a bounded list's DISABLED end arrow (a disabled button
// runs no click handler, and the arrows stand outside the hand's box whose
// click capture makes a tap), a mouse's other buttons and a pen's barrel, a
// press that ends without a click — let go off the stage, taken by the
// browser for a scroll or a pinch — which only HOLDS the ring while it lasts,
// and keyboard focus inside, which holds it while it stays. RECORDED, THE
// OWNER'S CALL, its limits: nothing VISIBLE says that a press stops it, and
// only the beads' group name can say it aloud — `labels.picker`, the page's
// own words: „(oprește derularea)", the words the Hero's beads carried until
// 2026-10-20, are true here (BACKLOG.md entry 2) — so an auditor may still
// ask for an explicit pause, lib/rotation's rotationControl the way to a
// visible one; and a screen reader's READING CURSOR is not a press — NVDA's
// browse mode and VoiceOver's swipe move no DOM focus, so the card being
// read turns inert under the cursor every 5.5 s, silently, `aria-live` being
// off while the ring runs. Its dwell is an OPEN question
// (CARD_CAROUSEL_INTERVAL_MS's READING TIME, BACKLOG.md entry 2).
// lib/rotation's law and ui/use-rotation cite this paragraph for these
// limits.
//
// ── THE GEOMETRY lives in ./conveyor (its header: the line, the slots, the
// windows, all solved in card widths). This file writes it into custom
// properties ON THE ROOT — the stage and the arrows' overlay both read the
// stage's width and its room — and into a handful of class strings:
//   · THE STAGE — ONE grid cell in which every card is laid out, centred, so
//     the tallest card sets the height and every card's layout centre is the
//     stage's (which is what the perspective is centred on). Its width is
//     `ratio` card widths and the bars' room (below), and a card is
//     `min(cap, column / ratio)` — for five, the column less the two bars —
//     where the column is the ROOT's `100cqw` (the root is the one query
//     container; the stage is not one, and an unregistered custom property's
//     `100cqw` resolves where it is USED, so the cards, the stage and the
//     overlay all measure against the root). THE CAP is 20rem spelled
//     `var(--spacing) * 80` — a 3:4 card then stands at most 320 × 427 px at
//     the default root, and inside THE BAND SCALE (ui/Container, §15.32) the
//     cap follows the design pixel like every other theme length, so a scaled
//     page draws a scaled carousel. A capped stage centres in the column
//     (THE CARD CAP).
//   · THE BARS' ROOM — ONE RULE: the stage keeps one strip, `--bar` (36px at
//     the default root), at each edge for the two arrows.
//       · The FIVE-card window ALWAYS keeps it, its cards shrinking to make
//         room: the card is `min(cap, (column − 2 bars) ÷ 3.2995)`, the stage
//         the card × 3.2995 + 2 bars. Just over THE FIVE-CARD FALLBACK's
//         switch the card is 192px and its outermost pair shows 46px — its
//         whole 40 % — beside each strip; in a 64rem column (1024px) the card
//         is 288.5px; the cap binds from a 1127.8px column, and the stage
//         centres from there.
//       · A THREE-card window (and five's fallback) never shrinks its card for
//         the arrows — `min(cap, column ÷ 1.7521)` — and its stage TAKES the
//         column's white margin beside it, up to a strip's width a side:
//         `min(column, card × 1.7521 + 2 bars)`. At the article's 42rem
//         measure the capped 320px cards leave 55.7px a side, so the stage is
//         632.7px and the arrows stand beside the neighbours' whole 40 %
//         (101.1px); on a phone the column has no margin, the stage is the
//         column, and the arrows stand over the fade's outermost 36px (THE
//         ARROWS records what that costs).
//       · `--inset` is the room a side actually keeps, (stage − card ×
//         ratio) ÷ 2 — one strip's width for five, between none and one for
//         three — and the mask's fade starts there (THE FADE).
//   · THE FIVE-CARD FALLBACK is CSS arithmetic, not a container query: the
//     five-card card is used only while it is at least THE FLOOR, else the
//     three-card window — each length chosen by one clamp() (spelled out
//     beside GEOMETRY below). A query would compare the column in CSS pixels;
//     this compares it in the design pixel too. THE FLOOR IS 12rem
//     (`var(--spacing) * 48`) — the line's own, which the five-card window had
//     before its wheel (11rem under the ring, 10rem under the wheel). The
//     switch is at a 705.5px column at the default root (192 × 3.2995 + 72,
//     measured by the geometry test), so the article's 42rem (672px) measure
//     shows THREE cards for `visible: 5` — at the default root and inside
//     THE BAND SCALE alike, where the measure, the arrows and the floor scale
//     together — and a 64rem column shows five. The fallback is the
//     three-card window itself (./conveyor's FIVE_FALLBACK): the poses are the
//     line's in both, so only the stage's width, its fade and its room
//     switch, and nothing the script writes can disagree with the stylesheet.
//   · THE FADE — a mask over the stage: transparent across the bars' room
//     (`--inset` in from each edge), then opaque `fade` card widths further
//     in, exactly the outermost card's 40 % (./conveyor's THE STAGE) — so the
//     outermost card shows its 40 % fading INTO the strip, the owner's 60/40,
//     its 60 % hidden under the room and clipped past the stage; with no room
//     to keep (a phone, `--inset` 0) it is the mask it always was. The clip
//     is the belt where a mask is unsupported (the outermost cards are then
//     cut, unfaded) and keeps the 60 % from ever widening the page (§7) —
//     sideways only (`overflow-x-clip`): the line never draws a card above or
//     below the centre card. `overflow: clip` never makes a scroll container.
//   · THE ROOM — the mask clips at the stage's border box, so the stage keeps
//     room under the cards for a card's drop shadow (the line itself never
//     draws a card lower than the centre card's bottom — ./conveyor's THE
//     STAGE): the house's deepest, `shadow-xl`, reaches 40px below its card
//     (its offset 20 + blur 25 − spread 5), 40 CSS PIXELS at every scale,
//     because a shadow token is px and THE BAND SCALE redraws no shadow. So
//     the room is ten theme steps but never under 40px,
//     `max(var(--spacing) * 10, 40px)`: at the default root exactly 2.5rem;
//     at the band scale's smallest design pixel (≈ 0.81) ten steps would be
//     32.4px and the mask would cut the shadow's last 7.6px — about two levels
//     of 255 on the page ground, a faint hard edge (MEASURED by the geometry
//     test, which reads the shadow's reach off the engine); past the reference
//     the steps are the larger and the room grows with the design.
//   · THE LIFT (2026-10-17 — the Home band's hovered blog card, which jumps to
//     105 %, was cut flat at the stage's top). A mask clips its element at the
//     border box — `mask-clip`'s initial value — whatever `overflow-x: clip`
//     leaves open, and `mask-clip: no-clip` is no way out: MEASURED on a card
//     grown to 105 %, Chromium 151 and Firefox paint past the box under it,
//     WebKit 26.5 accepts the value and still paints nothing there. So the
//     stage reaches `--lift` above its cards — a twentieth of a card's width:
//     the half of a 105 % jump on a card up to twice as tall as wide — as top
//     padding handed back by an equal negative margin. Nothing at rest moves
//     (the cards, the arrows' overlay and the root's box stay put — MEASURED
//     pixel-identical in Chromium and Firefox, within one level of 255 in
//     WebKit, the mask sampled over a taller box), the box the mask clips at
//     grows, and the mask, a horizontal gradient, fades that strip exactly as
//     it fades every other row: a 372px card grown to 105 % paints its whole
//     12.4px above its resting top, where the old two steps of padding cut it
//     at 8px; on the Home band — its cards the fixed miniatures, one height —
//     a hovered card rises 1.8px above the old top at a 1401 window and
//     2.5px at 1920, under lifts of 11.3 and 15.5px, all of it painted where
//     the old box cut it flat (MEASURED 2026-10-20 in Chromium on the built
//     page; 7.1 and 10.6px under 19.9 and 27.3 while that band's cards were
//     the lifted cap's share, an option gone since). Under the cards the
//     shadow's room already holds a 105 % card's growth (the Home band's
//     cards cast no shadow; a card that both jumped and wore the house's
//     deepest shadow would lose the shadow's last pixels). THE STRIP TAKES NO
//     POINTER: it lies over whatever stands `--lift` above the carousel — a
//     twentieth of a card, so at most about 22px, a capped card at the band
//     scale's largest design pixel (444px wide), 16px unscaled — and a box
//     takes the pointer wherever it lies (MEASURED: a button standing right
//     above the carousel lost its clicks to it), so the stage takes none
//     (`pointer-events: none`), its cards take theirs back, and the drag's
//     handlers live on THE HAND'S BOX — the stage's box as it stood before
//     the lift. A press on a side card, which `inert` lets through, lands on
//     the hand's box as it landed on the stage; a grown card takes the
//     pointer wherever it is painted.
//   · A CARD — its pose (./conveyor's poseAt) as `--tx` / `--ry` / `--sc` on
//     its own box, drawn as ONE transform: perspective(2.5 card widths) ·
//     translateX · rotateY · scale. One `transform`, not the separate
//     translate/rotate/scale properties, because those compose with
//     `transform` in a fixed order that would apply the perspective FIRST,
//     before the turn it exists to show. The perspective is the card's own,
//     centred on its layout box — the stage's centre — so it is the stage's
//     vanishing point, and it can never move a card's centre point up or down
//     or lean its vertical edges (./conveyor's THE LINE).
//
// ── THE MOVE: 700ms on easeOutQuad, cubic-bezier(0.25, 0.46, 0.45, 0.94) — a
// gentle start (an automatic move must not lurch) and a long settle (a hand
// let go glides out of its own movement). The browser's glide interpolates
// the transform's functions one by one, so a card passing through the centre
// grows and straightens WHILE it slides — never a jump — and passes through
// exactly the poses a dragging hand would show it in.
// `motion-reduce:transition-none` snaps every move instead (§9); lib/clock
// already declines the automatic start under the same preference.
//   · THE NO-FLY RULE (the reviews deck's THE WRAP-AROUND SWEEP, on continuous
//     positions): a card whose position changes by more than JUMP_LIMIT (1.5)
//     is CROSSING the ring — from one end to the other, off the stage — and is
//     drawn with no glide for that render, so it appears in its new place
//     instead of flying across the stage. The comparison needs the last
//     arrangement, kept as state adjusted during render (React's documented
//     pattern; the deck's `painted`), so the flags and the new poses reach the
//     browser in ONE commit. A ring of TWO has no far side to cross by: its
//     two cards trade places, gliding past each other. The bounded list never
//     wraps, so none of its cards crosses — but a BEAD pressed two or more
//     cards away moves every card that far, and every card then lands at once,
//     in either mode: the carousel jumps to the card, it never streams the
//     cards between past the visitor.
//     RECORDED (2026-10-20, the lane's G2 review, MEASURED), the motion not
//     changed: "off the stage" holds only from FIVE cards up. A loop of N puts
//     its far side at ±N/2 (lib/rotation's signedOffset: half a ring away, the
//     tie going right), so with fewer cards a card flips from one end to the
//     other where it can be SEEN: two cards at the neighbour's place itself,
//     three and four in the five-card window at ±1.5 and ±2, 96 % and 40 % of
//     the card on the stage. Under a hand that flip shows — a backward drag of
//     0.05 of a step on a loop of two moves the other card from +1 to −0.95 at
//     once, and a forward flick of 0.2 glides the departing card back across
//     the centre to +1, against the hand. So "trade places, gliding past each
//     other" holds for the arrows' and the clock's whole steps alone.
//   · A grab MID-GLIDE ends the glide: the drag's no-transition sends every
//     card to where the ring was going, moved by the hand — at most the rest
//     of one step, for a hand that grabs within the 700ms of a move. The
//     honest limit of a carousel that never reads the browser's in-flight
//     transforms.
//
// ── THE HAND (./drag's header has the rules): a mouse, a pen and a finger
// alike — a PRIMARY press only: the first finger, the pen's tip, the mouse's
// main button (a second finger, a pen's barrel or a mouse's other buttons
// press nothing). A press ANYWHERE IN THE REGION — on the stage, an arrow, a
// bead — HOLDS the ring from the moment it lands (lib/clock's 'drag' cause;
// THE CONSUMPTION LAW) until it ends: the <section> hears its pointerdown in
// the CAPTURE phase, before any control's own handler. The hold ends at the
// RELEASE, before the click — and no step lands between the two either,
// because letting go of a hold re-arms a FULL interval (lib/clock's resume):
// the click that follows its release finds the next move 5.5 s away. Only a
// press on the hand's box (the stage under THE LIFT, THE GEOMETRY) may become
// a drag. The axis is judged once, at 10px; a drag then CAPTURES the pointer
// (never at the press: a capture taken at pointerdown sends the click to the
// hand's box and a card's own link would never get it), clears any text
// selection the first pixels started, and moves the ring under the hand —
// every card at its continuous position,
// the centre one under the finger (a step is ./conveyor's STEP, the line's
// drawn centre-to-neighbour distance, in both windows).
//   · A FINGER IS CAPTURED AT ITS PRESS ALREADY — by the browser, to the
//     element it landed on (a card's link or title, a gallery photograph): a
//     touch's implicit capture. The drag's own capture takes the pointer from
//     that element, and the browser says so with a `lostpointercapture` on
//     it that BUBBLES to the hand's box — so only the box's OWN lost capture
//     ends a drag, as a cancel; a child's is the drag beginning. Until
//     2026-10-20 the box read the bubbled event as its own, and every touch
//     drag that began on the centre card died one event in, the cards
//     snapping back and the ring stopped for good (MEASURED by the lane's G2
//     review with a Chromium CDP touch on the built pages: gotpointercapture
//     on the link, lostpointercapture on the link, gotpointercapture on the
//     box — tests/e2e/card-carousel-touch.spec.ts drives that touch).
//   · THE END OF A PRESS IS HEARD ON THE WINDOW, in its capture phase: before
//     a press is a drag nothing has captured it, so a mouse let go off the
//     hand's box releases over whatever is under it, and no stopPropagation on
//     the way can hide that release from the window. A release lets go, a
//     `pointercancel` cancels — a press that never became a drag only letting
//     go of its hold, the ring on a full interval later — and only the
//     press's OWN pointer ends it: a second finger lifted mid-drag ends
//     nothing.
//   · A PRESS THAT NEVER GETS ITS RELEASE (the round-2 review): a context
//     menu takes the release of the press that opened it — a ctrl-click on
//     macOS — and the window left mid-press takes it elsewhere — an app
//     switch with the button down. A press still WAITING is dropped at the
//     `contextmenu` the window hears (its capture phase) or at the window's
//     own `blur`, its hold let go, nothing stopped; until then it held the
//     ring until the next mouse release anywhere — as one still does when
//     neither event comes (A BUTTON THAT IS UP, below). A drag keeps its own
//     ends.
//   · A BUTTON THAT IS UP: a mouse or a pen moving over the hand's box with
//     its main button up is no press, whatever this island last heard — a
//     release the page never received (let go outside the browser's window,
//     a context menu opened) — so the press is dropped, a drag as a cancel.
//     Until 2026-10-20 such a press stayed pending for good: a later
//     buttonless hover was judged a drag — the cards following the cursor,
//     the hold on — and the next click on a card's link was swallowed. The
//     rule is heard on the hand's box ALONE, in its pointermove (the round-3
//     review), so `contextmenu` and the window's `blur` (above) do not cover
//     every lost release: a press on an arrow or a bead whose release is lost
//     with neither, its pointer never coming back over the cards, holds the
//     ring until the next release anywhere — harmless, a hold never moves the
//     ring; it only waits.
//   · `touch-action: pan-y pinch-zoom` leaves vertical page scrolls and a
//     pinch to the browser. RECORDED (the G2 review), not measured: a reader
//     who has pinch-zoomed the page on a phone likely cannot pan it SIDEWAYS
//     from a finger on the carousel, which takes every sideways pan.
//   · THE CLICK RESPONDER (2026-10-21, the round-3 review, from reading —
//     UNMEASURED on a device, owed on a real iPhone): iOS's WebKit sends a
//     tap's click only to an element that responds to a click below <body>,
//     or one with `cursor: pointer`; React listens on the document, and sets
//     its Mobile Safari trap — an empty `onclick` — only for an `onClick`
//     prop, never for the `onClickCapture` the hand's box wears. So a tap on
//     a gallery photograph (no link), on a side card (whose `inert` passes it
//     to the box) or on the bare ground would hold the ring and let it go
//     without stopping it, where the arrows, the beads and a drag still
//     stopped it. The box sets that very trap itself while it is a carousel —
//     in an effect (RESPOND_TO_CLICK), never as a JSX `onClick` on a
//     non-interactive <div>, which jsx-a11y bars — and it brings no tap flash
//     with it: the page's preflight (Tailwind's) turns the tap highlight off
//     on <html>, and the property is inherited — MEASURED, the geometry test
//     reads it off the engine for the box and for every card.
//   · A FLICK THAT IS ALSO A TAP (the round-3 review, from reading — owed on
//     a real iPhone): iOS's WebKit may still call a touch a tap after it has
//     travelled farther than DRAG_DECIDE_PX (10px) — its tap slop is its own
//     — so a quick flick on a card could both move the ring (a drag from 10px
//     on) and leave a click that follows the card's link, no swallow being
//     armed for a finger (below). The lever, if the iPhone shows it: arm the
//     swallow for a touch too, bounded to about 500 ms or the next press.
// Let go, the ring lands (./drag's THE RELEASE) — the bounded list through
// ./track's A HAND ON THE TRACK — and stops for good; a `pointercancel` — the
// browser taking the pan, a second finger's pinch — snaps a drag back, and
// stops it as well. Two more manners: THE CLICK A DRAG LEAVES BEHIND — the
// one a mouse's or a pen's drag release may produce, in the release's own
// task — is swallowed once (a keyboard's click, `detail` 0, never is); it is
// armed for that release alone, never for a finger, whose drag leaves no
// click, nor for a cancel, after which none follows, and it is disarmed on
// the NEXT task, and by any new press — so a click that comes later with no
// press of its own, an assistive technology's activation, is never taken
// for it (the round-2 review: armed after every drag and kept until the
// next press, it went stale and could swallow such a click). MEASURED with a
// REAL mouse on the built Home band (tests/e2e/card-carousel-touch.spec.ts,
// the round-3 review): Chromium sends exactly one click after the drag, to
// the element that captured the pointer — the hand's box, never the card's
// link — inside the release's task, and the swallow takes it; with the
// disarm forced into a microtask, the same click goes through as a tap. And a
// `dragstart` is prevented, so a photograph never ghost-drags off its card.
// Every click the hand's box does not swallow is a TAP, and stops the ring for
// good — it still reaches its card, so a tap on a card's link follows the
// link.

/**
 * The rhythm of both modes, in ms: the owner's rotators' 5.5 s (sections/
 * Hero's HERO_INTERVAL_MS, the reviews deck's REVIEWS_INTERVAL_MS) — this
 * island's own clock all the same, independent of theirs (§15.18).
 *
 * READING TIME (lib/rotation's rider, about 150 words a minute) — RECORDED
 * 2026-10-20, an OPEN question for the owner (BACKLOG.md entry 2): on Home a
 * slide is a whole blog card, and the newest post's title and summary alone
 * are 45 words in Romanian — 18 s at the rider's pace — and 51 in German,
 * 20.4 s, against these 5.5; an article gallery's captions, two to four
 * words, fit (1.6 s at most). The 5.5 s is the owner's word for the Hero
 * (Hero.tsx's ROTATION), but no record shows him choosing it for these cards
 * with these numbers in front of him. The levers: this constant, or a dwell
 * per card from its own word count.
 */
export const CARD_CAROUSEL_INTERVAL_MS = 5_500;

/** The FIRST dwell, in ms: 1.5 s, the same rotators' — the first move is seen
 *  at once. */
export const CARD_CAROUSEL_FIRST_DWELL_MS = 1_500;

export type CardCarouselMode = 'loop' | 'bounded';
export type CardCarouselVisible = 3 | 5;

/** THE CARD CAP (the header): 'capped' holds the column's share at 20rem —
 *  the default, and since 2026-10-20 the one value ('none' left with its last
 *  consumer; any other value is a RangeError at run time). It stays as THE
 *  BACKSTOP: spelled beside a leaked `cardWidth`, it makes the pair throw. */
export type CardCarouselCardCap = 'capped';

/** THE CARDS' HEIGHT (the header): each card its own, centred on the line —
 *  the default — or every card the tallest one's. */
export type CardCarouselCardHeight = 'own' | 'tallest';

/**
 * HOW WIDE A CARD IS — ONE of two answers, never both (the header's THE CARD
 * CAP and THE FIXED CARD): the column's share under the cap, or one fixed
 * width, `cardWidth`. The types refuse the pair; a JavaScript caller that
 * sends both meets a RangeError.
 */
export type CardCarouselCardSize =
  | Readonly<{
      /** THE CARD CAP (the header): 'capped', the default, holds a card at
       *  20rem and centres the stage in a wider column — spelled by a
       *  consumer whose picture hint is derived for exactly that card. */
      cardCap?: CardCarouselCardCap;
      cardWidth?: never;
    }>
  | Readonly<{
      /** THE FIXED CARD (the header): every card exactly this wide — a CSS
       *  length the consumer writes in the theme's step,
       *  `calc(var(--spacing)*56.45)`, so THE BAND SCALE redraws it (one that
       *  never names `var(--spacing)` throws a RangeError) — the stage the
       *  column, the window `visible` at every width, a column too narrow for
       *  it cut from the faded sides. */
      cardWidth: string;
      cardCap?: never;
    }>;

/** Every word the island says, finished by the page (§8.1). */
export type CardCarouselLabels = Readonly<{
  /** The region's accessible NAME — without it a <section> is no region. */
  region: string;
  /** What the region's aria-roledescription announces („carusel"). */
  role: string;
  /** What each card's aria-roledescription announces („diapozitiv"). */
  slideRole: string;
  /** The previous arrow's name — its whole accessible name: the arrow shows
   *  a chevron and no word. */
  previous: string;
  /** The next arrow's name, likewise. */
  next: string;
  /** The beads' group name („Alege fotografia" — the Hero's „Alege
   *  imaginea" idea): what the row of beads is for. */
  picker: string;
}>;

type CardCarouselCommonProps = Readonly<{
  /**
   * The cards, in order — server-rendered, passed THROUGH (the header's THE
   * SLOT). Always cards, never bare images: what a card holds is the owner's
   * to decide. Fewer than two and nothing moves; none and nothing renders.
   */
  slides: readonly ReactNode[];
  /**
   * One finished name per card, in the same order — „1 din 8" — each card
   * group's aria-label AND its bead's (one sentence, two uses — lib/rotation's
   * law). Must match `slides` in length: anything else throws a RangeError
   * naming both counts (at build, for a server-rendered page).
   */
  slideLabels: readonly string[];
  /** The window: three cards, or five — both on the line (THE TWO AXES). */
  visible: CardCarouselVisible;
  labels: CardCarouselLabels;
  /** THE CARDS' HEIGHT (the header): 'own' (the default) — each card at its
   *  own height, centred on the line; 'tallest' — every card's box the
   *  tallest card's height, which a card that says `h-full` fills. */
  cardHeight?: CardCarouselCardHeight;
}>;

type CardCarouselClockProps = Readonly<{
  /** 'loop' wraps; 'bounded' walks out and back (the header's THE TWO AXES).
   *  Both move by themselves until a press stops them. */
  mode: CardCarouselMode;
  /** The rhythm in ms; CARD_CAROUSEL_INTERVAL_MS unless a story or a test
   *  asks for another. READ ONCE, AT MOUNT — remount with a `key` to change. */
  intervalMs?: number;
  /** The first dwell in ms; CARD_CAROUSEL_FIRST_DWELL_MS by default. READ
   *  ONCE, AT MOUNT. */
  startDelayMs?: number;
  /** TESTS AND STORIES ONLY — lib/clock's environment seam (the reduced-motion
   *  query and the tab's visibility as plain functions). A server page never
   *  passes it: functions do not cross into an island. READ ONCE, AT MOUNT. */
  env?: ClockEnv;
}>;

type OwnKey =
  | keyof CardCarouselCommonProps
  | 'cardCap'
  | 'cardWidth'
  | keyof CardCarouselClockProps;

/**
 * WHAT THE ISLAND OWNS OF THE NATIVE <section> — ONE list, read twice
 * (2026-10-21, the round-3 review; sections/PostGallery's WITHHELD is the
 * shape): by the props' type, which Omits every key on it (NativeSectionProps),
 * and by the component, which drops every key on it from the native spread in
 * ANY case (OWN_ATTRIBUTES). Each entry is a key of the <section>'s own props,
 * so a misspelt one fails to compile. On it: the region's name, its roles, its
 * live-region setting and its content — `role`, `aria-label`,
 * `aria-labelledby`, `aria-roledescription`, `aria-live`, `children`,
 * `dangerouslySetInnerHTML` — and every handler a caller could end the
 * island's manners with before they ran: the focus pair and its capture twins
 * (the keyboard's hold), the region's capture-phase pointerdown (THE HAND's
 * hold), and since the round-3 review the three capture handlers that come
 * before the island's own on their way down: `onClickCapture` — a caller's
 * that stopped propagation made every arrow, bead and tap a dead press while
 * the ring went on rotating (MEASURED by that review) — and
 * `onPointerMoveCapture` and `onLostPointerCaptureCapture`, the drag's and
 * its cancel's (THE HAND). The type alone refuses nothing a spread smuggles
 * in (an object spread into JSX, and a hyphenated attribute, escape
 * TypeScript's excess-property check), so nothing a caller passes can rename
 * the region, make it a live region of its own, replace its cards, or end its
 * holds, its stop or its drag before they begin.
 *   · THREE ENTRIES ARE A BELT, kept because the one list makes them free:
 *     `onFocus`, `onBlur` and `onPointerDownCapture` do nothing at run time —
 *     react-dom binds a handler under its exact camelCase name alone and sets
 *     no attribute for any other `on…` name, and the island sets those three
 *     exact names itself after the spread. The type needs them Omitted, and
 *     the run-time set is built from the same list.
 * A caller's `className` and `style` are no entries — the type keeps both —
 * yet both are dropped from the spread in every OTHER case (OWN_ATTRIBUTES):
 * the island merges its own `className` and sets its own `style`.
 */
const OWN_NATIVE_PROPS = [
  'children',
  'dangerouslySetInnerHTML',
  'role',
  'aria-label',
  'aria-labelledby',
  'aria-roledescription',
  'aria-live',
  'onFocus',
  'onBlur',
  'onFocusCapture',
  'onBlurCapture',
  'onPointerDownCapture',
  'onClickCapture',
  'onPointerMoveCapture',
  'onLostPointerCaptureCapture',
] as const satisfies readonly (keyof ComponentPropsWithRef<'section'>)[];

/**
 * The native <section> props a caller may add: every one but the island's
 * (OWN_NATIVE_PROPS) and its own props' names. A caller's `className` is
 * merged after the island's own. A caller's `style` is merged FIRST, under
 * the geometry's INLINE custom properties — `--k`, `--r3`, `--f3`, `--r5`,
 * `--f5`, `--card-fixed`, which it can never replace — but NOT under the
 * custom properties the geometry's CLASSES set (`--cap`, `--card`, `--bar`,
 * `--stage`, `--fade` …): an inline declaration outranks any class, so a
 * caller's style that names one of those redraws the carousel (a `--cap` at
 * the column's width drew a 584px card where 320 was due — MEASURED by
 * sections/PostGallery's review, which withholds `style` whole for it). Keep
 * the geometry's names out of a caller's style; NOT PROTECTED HERE, the lever
 * recorded rather than built: dropping every custom property from a caller's
 * style would be a fence with a gate beside it, `className` reaching the same
 * names (an arbitrary-property class), which the island merges.
 */
type NativeSectionProps = Omit<
  ComponentPropsWithRef<'section'>,
  OwnKey | (typeof OWN_NATIVE_PROPS)[number]
>;

/**
 * THE ISLAND'S OWN ATTRIBUTES, by their LOWER-CASE names: OWN_NATIVE_PROPS,
 * and `style`, `className` and `class` beside them, dropped from the native
 * spread whatever their case (2026-10-20, the lane's round-2 review,
 * MEASURED). HTML reads an attribute's name in any case, and React passes a
 * prop it does not know through as an attribute of that very name — so a
 * spread's `Style`, `ROLE` or `Aria-Live` IS the island's `style`, `role` or
 * `aria-live`, and a reset after the spread catches only the exact spelling.
 * `Style` lifted the cap in the browser (a 584.4px card where 320 was due)
 * and, in the server's HTML, printed a second style attribute ahead of the
 * island's, which the browser's parser drops — the geometry with it: a 0px
 * card; `ARIA-LABEL` renamed the server's region where the browser's render
 * hid it, its own label coming later. `class` and `classname` go too (the
 * island merges the exact `className`, like `style`, both taken out of the
 * spread before it is filtered), and so do the handlers: a caller's
 * `onFocusCapture` that stopped propagation would end the keyboard's hold
 * before it began (measured, the same review). A DENYLIST, not an allowlist
 * of `id`, `className` and `data-*`: the type promises the rest of the native
 * surface — `lang`, `title`, `aria-describedby`, a caller's own handlers —
 * and an allowlist would drop it without a word.
 */
const OWN_ATTRIBUTES: ReadonlySet<string> = new Set(
  [...OWN_NATIVE_PROPS, 'style', 'className', 'class'].map((name) =>
    name.toLowerCase(),
  ),
);

/** The caller's native props without any OWN_ATTRIBUTES name, in any case —
 *  a copy; the caller's object is never touched. The type stands: every key
 *  it drops is one the type Omits, or one it never named. */
function withoutOwnAttributes<Props extends object>(props: Props): Props {
  return Object.fromEntries(
    Object.entries(props).filter(
      ([name]) => !OWN_ATTRIBUTES.has(name.toLowerCase()),
    ),
  ) as Props;
}

export type CardCarouselProps = CardCarouselCommonProps &
  CardCarouselCardSize &
  CardCarouselClockProps &
  NativeSectionProps;

/** The island's own props as the view reads them: the common ones and the
 *  card's size — a fixed width, or none: the cap's share (its one value). */
type ViewCommonProps = CardCarouselCommonProps &
  Readonly<{
    cardWidth: string | undefined;
  }>;

// ── THE CLASS STRINGS — literal, because Tailwind reads class names from the
// source text.

/** The root: the ONE query container (the header's THE STAGE), the arrows'
 *  overlay's positioning scope, its own stacking context — so the overlay's
 *  one step up stays inside the carousel — and a grid of two rows, the stage
 *  then the beads, in ONE column exactly the root's width (`minmax(0, 1fr)`):
 *  a row as wide as its beads must overflow its area, never widen the track
 *  (the header's THE BEADS, THE ROW). */
const ROOT = 'relative isolate @container grid grid-cols-[minmax(0,1fr)]';

/** THE CARD CAP (the header): the card's ceiling under the column's share —
 *  20rem, spelled in the theme's step. */
const CAP = '[--cap:calc(var(--spacing)*80)]';

/**
 * Shared by every geometry: the room under the cards, the drop shadow's (the
 * header's THE ROOM), and THE LIFT above them, a twentieth of a card (the
 * header's paragraph of that name).
 */
const FRAME =
  '[--room:max(calc(var(--spacing)*10),40px)] [--lift:calc(var(--card)*0.05)]';

/**
 * THE BAR — nine theme steps, the one spelling of the arrows' strip, read by
 * the arrows and by the room the stage keeps for them (the header's THE BARS'
 * ROOM) — under the column's share, and NEVER UNDER 24px, SC 2.5.8's minimum
 * target: nine steps are 36px at the default root, 29.2px at the band scale's
 * smallest design pixel, but 20.25px at a 9px default font size (Chrome's
 * „Very small") outside a band scale — there the px floor binds. A fixed card
 * spells its own (FIXED_BAR).
 */
const BAR = '[--bar:max(24px,calc(var(--spacing)*9))]';

/**
 * The COLUMN'S SHARE (the header's THE CARD CAP) — both windows read it: the
 * three-card window's card, never shrunk for the arrows, and its stage, which
 * takes up to a strip's width of the column's white margin at each side (for
 * five, its fallback).
 */
const SHARE =
  '[--c3:min(var(--cap),calc(100cqw/var(--r3)))] [--s3:min(100cqw,calc(var(--c3)*var(--r3)_+_2*var(--bar)))]';

/**
 * THE GEOMETRY of each window, as the root's custom properties (the header's
 * THE STAGE, THE BARS' ROOM, THE FIVE-CARD FALLBACK): the card, the stage, the
 * fade and the room each side keeps for its arrow (`--inset`). `--r3` / `--f3`
 * (the three-card window) and `--r5` / `--f5` (five) and `--k` arrive as
 * numbers in the root's inline style, from ./conveyor — one source for the
 * geometry.
 *
 * Five: its card makes room for its two strips — the column less two bars,
 * ÷ `--r5` — and every length is the five-card window's WHILE `--c5` is at
 * least the floor `--min5`, else the three-card one, chosen by ONE clamp —
 * `clamp(five − T, three, five + T)` with T = `max(0px, 10⁶·(floor − c5))`:
 * T is 0 while five is allowed, and clamp(five, three, five) is five; under
 * the floor T is huge, and the clamp hands back three. It never asks which of
 * the two is the larger, and the step is a ten-thousandth of a pixel wide.
 */
const GEOMETRY: Readonly<Record<CardCarouselVisible, string>> = {
  3: cx(
    FRAME,
    BAR,
    SHARE,
    '[--card:var(--c3)] [--stage:var(--s3)] [--fade:calc(var(--c3)*var(--f3))] [--inset:calc((var(--s3)_-_var(--c3)*var(--r3))/2)]',
  ),
  5: cx(
    FRAME,
    BAR,
    SHARE,
    '[--min5:calc(var(--spacing)*48)] [--c5:min(var(--cap),calc((100cqw_-_2*var(--bar))/var(--r5)))] [--t5:max(0px,calc(1000000*(var(--min5)-var(--c5))))]',
    '[--card:clamp(calc(var(--c5)-var(--t5)),var(--c3),calc(var(--c5)+var(--t5)))]',
    '[--stage:clamp(calc(var(--c5)*var(--r5)_+_2*var(--bar)_-_var(--t5)),var(--s3),calc(var(--c5)*var(--r5)_+_2*var(--bar)_+_var(--t5)))]',
    '[--fade:clamp(calc(var(--c5)*var(--f5)-var(--t5)),calc(var(--c3)*var(--f3)),calc(var(--c5)*var(--f5)+var(--t5)))]',
    '[--inset:clamp(calc(var(--bar)_-_var(--t5)),calc((var(--s3)_-_var(--c3)*var(--r3))/2),calc(var(--bar)_+_var(--t5)))]',
  ),
};

/**
 * THE FIXED CARD's arrows (the header): a strip of nine theme steps where the
 * column leaves that much beside the centre card, narrower where it leaves
 * less — never over the card — and never under 24px, SC 2.5.8's minimum
 * target, below which it overlaps the card's edge. The floor OUTSIDE the
 * `min()`, so it binds whatever caps the strip — the room beside the card, or
 * nine steps narrower than 24px (a 9px default font size: 20.25px).
 */
const FIXED_BAR =
  '[--bar:max(24px,min(calc(var(--spacing)*9),calc((100cqw_-_var(--card))/2)))]';

/**
 * THE FIXED CARD's geometry (the header): the card the consumer's width
 * (`--card-fixed`, the root's inline style) and never wider than the column;
 * the stage the column, always; the room a side what the column leaves beside
 * the window, `max(0, (column − card × ratio) ÷ 2)`; the fade the outermost
 * card's 40 %, `card × fade`, from the room's inner edge in — and never past
 * the centre card's edge, `(column − card) ÷ 2 − room`, where a narrow column
 * would otherwise fade the centre card itself — the window asked for at every
 * width, no fallback.
 */
const FIXED: Readonly<Record<CardCarouselVisible, string>> = {
  3: cx(
    FRAME,
    FIXED_BAR,
    '[--card:min(var(--card-fixed),100cqw)] [--stage:100cqw] [--inset:max(0px,calc((100cqw_-_var(--card)*var(--r3))/2))] [--fade:min(calc(var(--card)*var(--f3)),max(0px,calc((100cqw_-_var(--card))/2_-_var(--inset))))]',
  ),
  5: cx(
    FRAME,
    FIXED_BAR,
    '[--card:min(var(--card-fixed),100cqw)] [--stage:100cqw] [--inset:max(0px,calc((100cqw_-_var(--card)*var(--r5))/2))] [--fade:min(calc(var(--card)*var(--f5)),max(0px,calc((100cqw_-_var(--card))/2_-_var(--inset))))]',
  ),
};

/** The geometry's numbers, from ./conveyor, as the root's inline style: the
 *  three-card window for three; for five, its own window and its fallback —
 *  the three-card window — in the `3` slots. */
const GEOMETRY_STYLE: Readonly<Record<CardCarouselVisible, CSSProperties>> = {
  3: {
    '--k': PERSPECTIVE,
    '--r3': ARRANGEMENTS[3].ratio,
    '--f3': ARRANGEMENTS[3].fade,
  } as CSSProperties,
  5: {
    '--k': PERSPECTIVE,
    '--r3': FIVE_FALLBACK.ratio,
    '--f3': FIVE_FALLBACK.fade,
    '--r5': ARRANGEMENTS[5].ratio,
    '--f5': ARRANGEMENTS[5].fade,
  } as CSSProperties,
};

/**
 * THE ARROWS' OVERLAY (the header's THE ARROWS): absolutely placed in the
 * root's first grid row — the stage's — as wide as the stage and centred like
 * it, from the cards' top (`top-2`: the stage's two steps of padding above
 * them, its lift handed back by its negative margin) to the start of its room
 * — the cards' row — one step above the cards. BOTH row lines are
 * named (`row-start-1 row-end-2`): for an absolutely placed grid child an
 * `auto` line is the container's padding edge, so a start line alone would
 * stretch the overlay over the beads' row too (measured: 44px too tall). It
 * takes no pointer events itself; its two arrows, stretched to its height,
 * stand at its two ends: in the room the stage keeps for them (the header's
 * THE BARS' ROOM).
 */
const CONTROLS =
  'pointer-events-none absolute inset-x-0 top-2 bottom-(--room) z-1 col-start-1 row-start-1 row-end-2 mx-auto flex w-(--stage) max-w-full items-stretch justify-between';

/**
 * AN ARROW (the header's THE ARROWS): its pointer events taken back from the
 * overlay; a `--bar`-wide strip as tall as the overlay, NOTHING PAINTED but
 * its chevron — the lavender at rest and under a mouse, the deep lavender
 * pressed, and on the jump's clock the chevron (its one child) a little
 * larger under the mouse — an ENABLED arrow's alone; a disabled one is grey:
 * the ink, its LINE at half strength (LINE), its halo whole. The colour no
 * longer changes under the mouse, so it no longer glides: every change of it
 * snaps. Reduced motion keeps the size. The ring is the keyboard's, inside
 * the strip. A named group (`group/arrow`), so the line can answer the
 * arrow's `:disabled`.
 */
const ARROW = cx(
  'pointer-events-auto group/arrow flex w-(--bar) items-center text-accent',
  'enabled:active:text-accent-strong disabled:text-ink',
  'enabled:hover:*:scale-110 enabled:active:*:scale-100 motion-reduce:enabled:hover:*:scale-100 active:*:duration-0',
  'focus-visible:outline-2 focus-visible:outline-focus focus-visible:-outline-offset-2',
);

/**
 * WHERE AN ARROW'S CHEVRON STANDS in its strip (the header's THE ARROWS):
 * against the strip's OUTER edge, half a theme step in from it — 4px further
 * out than the strip's centre, the owner's "a very very little moved to the
 * sides" — so the chevron's box, grown 1.1× under the mouse, stays inside.
 */
const ARROW_SIDE = {
  previous: 'justify-start ps-0.5',
  next: 'justify-end pe-0.5',
} as const;

/**
 * THE CHEVRON's box (the header's THE ARROWS): 1.5rem × 9rem — the owner's
 * "600% taller" — never taller than its strip, and never wider than its strip
 * less a theme step (its 2px from the outer edge and its halo's reach past the
 * box), so the drawing stays inside a strip a fixed card narrowed (THE FIXED
 * CARD) — 6 theme steps wherever the strip is the whole bar; the drawing
 * stretched to the box, its stroke 0.425 of a theme step at any stretch
 * (1.7px, the owner's "15% thinner" than 2px); the size's own glide on the
 * jump's clock, none under reduced motion.
 */
const CHEVRON =
  'h-36 max-h-full w-[min(calc(var(--spacing)*6),calc(var(--bar)_-_var(--spacing)))] shrink-0 overflow-visible [stroke-width:calc(var(--spacing)*0.425)] [--jump:200ms] transition-[scale] duration-(--jump) ease-[ease-out] motion-reduce:transition-none';

/** The chevron's drawing in its 24 × 144-unit box: each arm from a corner to
 *  the middle of the opposite edge, a unit in from the box — the line's half
 *  stroke — pointing out of the stage. */
const CHEVRON_PATH = {
  previous: 'M23 1 1 72 23 143',
  next: 'M1 1 23 72 1 143',
} as const;

/**
 * THE HALO (the header's THE ARROWS): the chevron's own path drawn FIRST, in
 * the page ground, the line's width and half a theme step more a side (5.7px
 * round a 1.7px line), round at its joins and caps (the svg's), non-scaling
 * like the line — so the line always lies on the page colour, whatever
 * photograph is under it. It never changes colour (its stroke is the token,
 * never currentColor), it scales with the chevron, and in forced colours the
 * system colours own the drawing, so it is not drawn.
 */
const HALO =
  'stroke-page [stroke-width:calc(var(--spacing)*1.425)] forced-colors:hidden';

/**
 * THE LINE of a DISABLED arrow at half strength — the line alone, over its
 * whole halo, so a grey arrow is the same grey on the page and over a
 * photograph: the ink at 50 % over the page's colour, rgb(147 144 142), 3.02:1
 * on the page (the header's DISABLED). Opacity rather than the ink with an
 * alpha, which Tailwind writes as a `color-mix()` that an engine before 2023
 * skips for its solid fallback — the full ink, a disabled arrow darker than
 * the lilac.
 */
const LINE = 'group-disabled/arrow:opacity-50';

/** One arrow's chevron (the header's THE ARROWS) — decorative: the button's
 *  name is its label. The halo first, the line on top. */
function Chevron({ towards }: { towards: 'previous' | 'next' }): ReactElement {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 144"
      preserveAspectRatio="none"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={CHEVRON}
    >
      <path
        d={CHEVRON_PATH[towards]}
        vectorEffect="non-scaling-stroke"
        className={HALO}
      />
      <path
        d={CHEVRON_PATH[towards]}
        vectorEffect="non-scaling-stroke"
        className={LINE}
      />
    </svg>
  );
}

/**
 * THE HAND'S BOX (the header's THE LIFT): the stage's box as it stood before
 * the lift — one centred cell in the root's first row, `--stage` wide — and
 * the one that takes the pointer: the drag's handlers live here, so a press
 * on the stage's empty ground, or on a side card (which `inert` lets
 * through), lands here, and nothing above the carousel is ever covered. A
 * grid, so the stage's negative margin never collapses through it.
 */
const HAND = 'row-start-1 mx-auto grid w-(--stage) max-w-full';

/**
 * THE STAGE (the header): the hand's box filled, its mask clear across the
 * bars' room (`--inset` from each edge) and fading the outermost card's 40 %
 * (`--fade`) in from there, the 60 % hidden past the room's inner edge and
 * clipped past the stage's, `--room` kept under the cards and THE LIFT over
 * them — two theme steps of padding and `--lift` more, the `--lift` handed
 * back by a negative margin, so the box the mask clips at reaches over a card
 * that grows while nothing at rest moves. It takes NO pointer events itself:
 * its lifted strip lies over whatever stands above the carousel, which keeps
 * its pointer; the cards take theirs back (SLIDE). Clipped sideways only: the
 * line draws no card above or below the centre card.
 */
const STAGE = cx(
  'pointer-events-none -mt-(--lift) grid items-center justify-items-center pt-[calc(var(--spacing)*2_+_var(--lift))] pb-(--room)',
  '[mask-image:linear-gradient(to_right,transparent_var(--inset),#000_calc(var(--inset)_+_var(--fade)),#000_calc(100%_-_var(--inset)_-_var(--fade)),transparent_calc(100%_-_var(--inset)))]',
  '[-webkit-mask-image:linear-gradient(to_right,transparent_var(--inset),#000_calc(var(--inset)_+_var(--fade)),#000_calc(100%_-_var(--inset)_-_var(--fade)),transparent_calc(100%_-_var(--inset)))]',
  'overflow-x-clip supports-[not_(overflow:clip)]:overflow-x-hidden',
);

/** The hand's box while it can be dragged, and while it is. A finger's vertical
 *  pan and its pinch stay the browser's (`touch-action: pan-y pinch-zoom`):
 *  only a sideways pan comes to the carousel, and zoom is never taken away. */
const GRAB = 'cursor-grab touch-pan-y touch-pinch-zoom';
const GRABBING = 'cursor-grabbing select-none';

/** One card's box: laid out in the stage's one cell, `--card` wide, posed by
 *  ONE transform (the header's A CARD), and the pointer's again — the stage
 *  around it takes none (THE STAGE). */
const SLIDE =
  'pointer-events-auto col-start-1 row-start-1 w-(--card) [transform:perspective(calc(var(--card)*var(--k)))_translateX(calc(var(--card)*var(--tx)))_rotateY(calc(var(--ry)*1deg))_scale(var(--sc))]';

/**
 * THE CARDS' HEIGHT (the header): a card's box in the stage's one row —
 * centred at its own height (the stage's `items-center`), or stretched to
 * the row, which is the tallest card's height.
 */
const HEIGHT: Readonly<Record<CardCarouselCardHeight, string | undefined>> = {
  own: undefined,
  tallest: 'self-stretch',
};

/** A card that MOVES along the conveyor (the header's THE MOVE). */
const SLIDE_MOVE =
  'transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] motion-reduce:transition-none';

/** A card under a dragging hand, or one crossing the ring: it lands at once.
 *  A separate string, never `transition-none` beside the other, so which one
 *  wins never depends on Tailwind's emission order (the deck's slideSnap). */
const SLIDE_SNAP = 'transition-none motion-reduce:transition-none';

/** THE BEADS' row (the header's THE BEADS, THE ROW): the root's second row,
 *  under the stage's room — as wide as its beads, up to the column and a page
 *  gutter's floor a side and never wider than the screen, centred on the
 *  column (spilling into the gutter on both sides when the column is the
 *  narrower) — and wrapping only past that, rather than widen the page (§7). */
const BEADS =
  'row-start-2 flex w-max max-w-[min(100vw,calc(100cqw_+_2rem))] flex-wrap justify-center justify-self-center';

/**
 * ONE BEAD's hit box (the header's THE BEADS): 24 × 44 round an 8px dot at the
 * default root — two theme steps a side, eleven tall, 1.5rem wide in all — and
 * NEVER UNDER 24 CSS PIXELS WIDE, the dot centred in it: an UNSCALED floor (SC
 * 2.5.8), because the theme's steps shrink under a default font size below
 * 16px, and inside a band scale with the design pixel (under the 1401
 * reference); the ring outside it; and in forced colours a border, the one
 * thing of a bead that mode draws. KEEP-IN-SYNC with sections/Hero's bead
 * button (its THE BEADS ARE BUTTONS), which CardCarousel.test.tsx reads and
 * holds equal.
 */
const BEAD =
  'group/bead flex h-11 min-w-[24px] items-center justify-center rounded-md px-2 outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus forced-colors:border';

/** The dot: only its width and its colour move. KEEP-IN-SYNC with
 *  sections/Hero's dot (its shape and its timing; the colours and the
 *  Hero's shadow are each band's own). */
const DOT =
  'block h-2 rounded-full transition-[width,background-color] duration-200 ease-out motion-reduce:transition-none';

/** The current card's pill, and an idle dot one step darker under the mouse
 *  (the header's THE BEADS: the colours for the page ground). */
const DOT_CURRENT = 'w-7 bg-accent';
const DOT_IDLE = 'w-2 bg-ink-faint group-hover/bead:bg-ink-muted';

/** The arrangement last drawn, and which cards jumped INTO it. */
type Painted = Readonly<{
  positions: readonly number[];
  jumped: readonly boolean[];
}>;

/** Same positions, card for card — the guard that keeps the render-time
 *  adjustment from running twice for one arrangement. */
function samePositions(a: readonly number[], b: readonly number[]): boolean {
  return (
    a.length === b.length && a.every((position, index) => position === b[index])
  );
}

/** A primary press inside the region — on the stage, an arrow or a bead —
 *  from its pointerdown to its end (the header's THE HAND). */
type Press = {
  id: number;
  /** 'mouse', 'pen' or 'touch': whether a drag's release may leave a click
   *  behind (THE HAND's swallowed click). */
  pointerType: string;
  x: number;
  y: number;
  /** event.timeStamp of the press. */
  at: number;
  /** Pressed on the hand's box: the one place a press may become a drag. */
  onStage: boolean;
  axis: DragAxis;
  /** CSS pixels per step, measured when the press became a drag. */
  pitch: number;
};

/** THE CLICK A DRAG LEAVES BEHIND (the header's THE HAND): armed by a mouse's
 *  or a pen's drag release, and the task that disarms it. */
type Swallow = {
  armed: boolean;
  disarm: ReturnType<typeof setTimeout> | undefined;
};

/** What the two ring owners hand the view. */
type ViewProps = Readonly<{
  common: ViewCommonProps;
  native: NativeSectionProps;
  /** The card at the centre — already on the list. */
  index: number;
  /** The cards container's aria-live (when there is a carousel at all). */
  live: 'off' | 'polite';
  /** 'loop' wraps; 'bounded' does not. */
  ring: boolean;
  canPrevious: boolean;
  canNext: boolean;
  /** A press on an arrow: the stop for good, then the step. */
  onPrevious: () => void;
  onNext: () => void;
  /** A press on a bead: the stop for good, then to its card. */
  onPick: (card: number) => void;
  /** A primary press inside the region has begun — on the stage, an arrow or
   *  a bead, a drag or not: the clock's hold (the header's THE HAND). */
  onHold: () => void;
  /** That press has ended — let go, cancelled, or dropped: the hold let go.
   *  After a drag, it comes after the drag's stop (onRelease), and finds a
   *  stopped ring that it starts nothing on. */
  onHoldEnd: () => void;
  /** A drag has ended: move by `steps` (0 = spring back) and stop for good —
   *  while the press still holds the ring, so no instant of 'running' comes
   *  between the hold and the stop. */
  onRelease: (steps: number) => void;
  /** A tap on the stage — a press that did not become a drag: the stop for
   *  good. */
  onTap: () => void;
  /** The clock's focus hold. */
  focus: FocusManners;
  stageRef: RefObject<HTMLDivElement | null>;
}>;

/**
 * THE CLICK RESPONDER (the header's THE HAND): a click listener that does
 * nothing, set as the hand's box's own `onclick` — React's own trap for Mobile
 * Safari, which React sets for an `onClick` prop and never for the
 * `onClickCapture` the box wears — so that iOS sends a tap's click at all.
 */
const RESPOND_TO_CLICK = (): void => {};

/**
 * The stage's px per step: ./conveyor's STEP in card widths, a card being any
 * card box's LAYOUT width — its computed width, which ignores the transforms
 * and, unlike offsetWidth, is not rounded to a whole pixel. Read once per drag.
 */
function measurePitch(stage: HTMLDivElement | null): number {
  const card = stage?.firstElementChild;
  const width =
    card instanceof HTMLElement ? parseFloat(getComputedStyle(card).width) : 0;
  return Math.max(1, (Number.isFinite(width) ? width : 0) * STEP);
}

function CarouselView({
  common,
  native,
  index,
  live,
  ring,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  onPick,
  onHold,
  onHoldEnd,
  onRelease,
  onTap,
  focus,
  stageRef,
}: ViewProps): ReactElement {
  const {
    slides,
    slideLabels,
    visible,
    labels,
    cardWidth,
    cardHeight = 'own',
  } = common;
  const { className, style, ...rest } = native;
  // Every other native prop, less the attributes the island owns in ANY case
  // (OWN_ATTRIBUTES): the island sets its own after the spread.
  const attributes = withoutOwnAttributes(rest);
  const count = slides.length;
  // Derived from COUNT (the deck's G2 item E): one card is not a carousel.
  const isCarousel = count >= 2;

  // THE HAND — the press in a ref (its bookkeeping changes on every pointer
  // event and renders nothing), the drag's travel in state (it moves the
  // cards). `drag` is the travel in STEPS, positive towards the next card,
  // null while no drag is in progress.
  const press = useRef<Press | null>(null);
  const swallow = useRef<Swallow>({ armed: false, disarm: undefined });
  const [drag, setDrag] = useState<number | null>(null);

  // THE POSITIONS — every card's continuous place on the conveyor: the loop's
  // signed offset from where the ring stands (fractional under a hand), the
  // bounded list's plain distance, resisted past its ends.
  const place = index + (drag ?? 0);
  const positions = slides.map((_, card) =>
    ring ? signedOffset(card, place, count) : card - resist(place, count),
  );

  // THE NO-FLY RULE (the header) — state adjusted during render, so the
  // flags and the poses they guard reach the browser in one commit.
  const [painted, setPainted] = useState<Painted>(() => ({
    positions,
    jumped: positions.map(() => false),
  }));
  if (!samePositions(painted.positions, positions)) {
    setPainted({
      positions,
      jumped: jumpedSince(painted.positions, positions),
    });
  }

  // THE FULL STOP'S FOCUS: a bounded list disables previous on its first card
  // and next on its last, and a disabled button cannot keep focus — so the
  // press that disables the control it was made with hands focus to the other
  // one, before the browser can drop it on the page.
  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const pressed = useRef<'previous' | 'next' | null>(null);
  useLayoutEffect(() => {
    const active = document.activeElement;
    const dropped = active === null || active === document.body;
    if (
      !canNext &&
      (active === nextRef.current || (dropped && pressed.current === 'next'))
    ) {
      previousRef.current?.focus();
    }
    if (
      !canPrevious &&
      (active === previousRef.current ||
        (dropped && pressed.current === 'previous'))
    ) {
      nextRef.current?.focus();
    }
    pressed.current = null;
  }, [canPrevious, canNext]);

  const pressPrevious = (): void => {
    if (!ring && index - 1 <= 0) pressed.current = 'previous';
    onPrevious();
  };
  const pressNext = (): void => {
    if (!ring && index + 1 >= count - 1) pressed.current = 'next';
    onNext();
  };

  /**
   * A PRESS INSIDE THE REGION (the header's THE HAND) — on the stage, an
   * arrow or a bead — heard in the capture phase, before any of their own
   * handlers: it HOLDS THE RING from the moment it lands until it ends — its
   * release, before its click — and the release re-arms a full interval
   * (lib/clock's resume), so no step lands between a press and its click:
   * none turning the card under a finger inert before its tap is a click,
   * none moving the ring a second card under a press on an arrow, none
   * disabling the bounded list's end arrow under the press that was about to
   * stop it.
   */
  const onPress = (event: ReactPointerEvent<HTMLElement>): void => {
    // A drag in progress keeps its pointer, and its hold: another press — a
    // pen's beside the mouse's — takes nothing over. (A press still waiting —
    // one whose release this island never heard — is simply replaced.)
    if (press.current?.axis === 'across') return;
    // THE PRIMARY PRESS: the first finger, the pen's tip, the mouse's main
    // button. A second finger, a pen's barrel or a mouse's other buttons
    // press nothing here.
    if (!event.isPrimary || event.button !== 0) return;
    // A new press: whatever click comes now is its own.
    swallow.current.armed = false;
    press.current = {
      id: event.pointerId,
      pointerType: event.pointerType,
      x: event.clientX,
      y: event.clientY,
      at: event.timeStamp,
      onStage: false,
      axis: 'pending',
      pitch: 1,
    };
    onHold();
  };

  /** The press landed on the hand's box — its pointerdown bubbling there
   *  after the region's capture made it: the one place it may become a
   *  drag. */
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const current = press.current;
    if (current !== null && current.id === event.pointerId) {
      current.onStage = true;
    }
  };

  /**
   * THE CLICK A DRAG LEAVES BEHIND (the header's THE HAND): a mouse's or a
   * pen's drag release may leave a click — dispatched in the release's own
   * task — and it is no press on a card. Disarmed on the NEXT task, so a
   * click that comes later with no press of its own (an assistive
   * technology's activation) is never taken for it.
   */
  const armSwallow = (): void => {
    const state = swallow.current;
    state.armed = true;
    clearTimeout(state.disarm);
    state.disarm = setTimeout(() => {
      state.armed = false;
      state.disarm = undefined;
    }, 0);
  };

  /**
   * THE PRESS ENDS (the header's THE HAND): let go at `x` — or `cancelled`:
   * the browser took the gesture, the hand's box lost its capture, or the
   * press was found with its button up or dropped with no release to read. A
   * drag lands — a cancel springs it back — and stops the ring for good; then
   * every press, a drag or not, lets go of its hold.
   */
  const end = (
    pointerId: number,
    x: number,
    at: number,
    cancelled: boolean,
  ): void => {
    const current = press.current;
    if (current === null || pointerId !== current.id) return;
    press.current = null;
    if (current.axis === 'across') {
      // Measured from where the hand LET GO, never from the last move drawn:
      // a cancel moves nothing, whatever its coordinates.
      const steps = cancelled
        ? 0
        : releaseSteps(-(x - current.x) / current.pitch, at - current.at);
      onRelease(steps);
      setDrag(null);
      // A finger's drag leaves no click behind, and no click follows a
      // cancel: nothing to swallow.
      if (!cancelled && current.pointerType !== 'touch') armSwallow();
    }
    onHoldEnd();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const current = press.current;
    if (current === null || event.pointerId !== current.id) return;
    // A BUTTON THAT IS UP (the header's THE HAND): a mouse or a pen moving
    // with its main button up is no press, whatever this island last heard —
    // the press is dropped, a drag as a cancel. A finger is in contact
    // whenever it moves, whatever its `buttons` say.
    if (event.pointerType !== 'touch' && (event.buttons & 1) === 0) {
      end(event.pointerId, event.clientX, event.timeStamp, true);
      return;
    }
    // Only a press on the hand's box becomes a drag: one on an arrow or a
    // bead, carried over the cards, stays the control's.
    if (!current.onStage) return;
    const dx = event.clientX - current.x;
    if (current.axis === 'pending') {
      current.axis = judgeAxis(dx, event.clientY - current.y);
      if (current.axis !== 'across') return;
      // IT IS A DRAG: measure the step, take the pointer, and drop the
      // selection the first pixels began. (The ring has been held since the
      // press.)
      current.pitch = measurePitch(stageRef.current);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // A pointer the browser no longer tracks (a synthetic one, or one
        // already lifted): the drag simply runs on the events the hand's box
        // receives.
      }
      window.getSelection()?.removeAllRanges();
    }
    if (current.axis !== 'across') return;
    setDrag(-dx / current.pitch);
  };

  /**
   * THE HAND'S BOX LOST ITS OWN CAPTURE — the browser took the pointer, or an
   * element did: a cancel. A child's lost capture BUBBLES here too, and is no
   * cancel: a touch is captured at its press to the element it pressed (a
   * card's link, its photograph), and the drag's own capture takes the
   * pointer from it — the drag beginning, not ending (the header's THE HAND).
   */
  const onLostPointerCapture = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (event.target !== event.currentTarget) return;
    end(event.pointerId, event.clientX, event.timeStamp, true);
  };

  // THE END OF A PRESS IS HEARD ON THE WINDOW (the header's THE HAND), in its
  // capture phase: a press released anywhere — on the carousel, or off it
  // before it was a drag and captured anything — and whatever stops the
  // event's propagation on the way. An Effect Event, so the listener added
  // once calls the latest `end` (it lands the ring from where it stands now).
  const endAnywhere = useEffectEvent((event: PointerEvent): void => {
    end(
      event.pointerId,
      event.clientX,
      event.timeStamp,
      event.type === 'pointercancel',
    );
  });
  // A PRESS THAT NEVER GETS ITS RELEASE (the header's THE HAND): a context
  // menu takes the release of the press that opened it (a ctrl-click on
  // macOS), and the window left mid-press (an app switch, the button still
  // down) takes it elsewhere — so a press still WAITING is dropped there, its
  // hold let go and nothing stopped. A drag keeps its own ends: its capture,
  // its button found up, a cancel.
  const dropWaiting = useEffectEvent((): void => {
    const current = press.current;
    if (current === null || current.axis === 'across') return;
    end(current.id, current.x, current.at, true);
  });
  useEffect(() => {
    if (!isCarousel) return;
    const swallowed = swallow.current;
    const ended = (event: PointerEvent): void => endAnywhere(event);
    const dropped = (): void => dropWaiting();
    window.addEventListener('pointerup', ended, true);
    window.addEventListener('pointercancel', ended, true);
    window.addEventListener('contextmenu', dropped, true);
    // The WINDOW's own blur, never its capture phase: an element's blur does
    // not bubble, so only the window's reaches this listener.
    window.addEventListener('blur', dropped);
    return () => {
      window.removeEventListener('pointerup', ended, true);
      window.removeEventListener('pointercancel', ended, true);
      window.removeEventListener('contextmenu', dropped, true);
      window.removeEventListener('blur', dropped);
      // THE CAROUSEL GONE (the list fallen under two cards, or the island
      // unmounted): nothing it waited for can come — the listeners that would
      // hear it are gone — so it forgets an armed swallow, a press and a drag,
      // and a list that grows back starts clean (the round-3 review: the
      // swallow stayed armed with no timer to disarm it, and a waiting press
      // was judged a drag the moment the cards came back).
      clearTimeout(swallowed.disarm);
      swallowed.disarm = undefined;
      swallowed.armed = false;
      press.current = null;
      setDrag(null);
    };
  }, [isCarousel]);

  // THE CLICK RESPONDER (the header's THE HAND): the hand's box answers a
  // click itself while it is a carousel — React's own Mobile Safari trap,
  // set here because the box wears `onClickCapture`, for which React sets
  // none — so that iOS sends a tap on a photograph, a side card or the bare
  // ground its click, the tap that stops the ring.
  const handRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = handRef.current;
    if (!isCarousel || box === null) return;
    box.onclick = RESPOND_TO_CLICK;
    return () => {
      box.onclick = null;
    };
  }, [isCarousel]);

  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>): void => {
    const state = swallow.current;
    if (state.armed) {
      state.armed = false;
      // `detail` 0 is a keyboard's click (Enter on a card's link): never a
      // drag's, never swallowed — a press like any other, below.
      if (event.detail !== 0) {
        // The click a mouse's or a pen's drag release leaves behind: not a
        // press on a card, and the release has already stopped the ring.
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    // A TAP — a press on the stage that did not become a drag (the header's
    // THE CONSUMPTION LAW): it stops the ring for good, and goes on to its
    // card.
    onTap();
  };

  const dragging = drag !== null;

  return (
    <section
      {...attributes}
      className={cx(
        ROOT,
        cardWidth === undefined ? cx(CAP, GEOMETRY[visible]) : FIXED[visible],
        className,
      )}
      style={{
        ...style,
        ...GEOMETRY_STYLE[visible],
        ...(cardWidth === undefined
          ? {}
          : ({ '--card-fixed': cardWidth } as CSSProperties)),
      }}
      // The island's own, AFTER the spread — which OWN_ATTRIBUTES has already
      // cleared of every spelling of them: the region named by its label
      // alone, no role of a caller's, no live region of its own, no inner
      // HTML in place of its cards.
      aria-label={labels.region}
      aria-roledescription={isCarousel ? labels.role : undefined}
      // THE PRESS (the header's THE HAND): a primary press anywhere in the
      // region holds the ring — heard in the capture phase, before an arrow's,
      // a bead's or a card's own handler.
      onPointerDownCapture={isCarousel ? onPress : undefined}
      // The clock's focus hold (the header's THE CONSUMPTION LAW): a keyboard
      // entry holds the ring while focus stays inside, a click-focused
      // control holds nothing.
      onFocus={focus.onFocus}
      onBlur={(event) => {
        // THE WINDOW LEFT, NOT THE FOCUS (the header's THE CONSUMPTION LAW):
        // a focusout with no new target is also what the WINDOW losing focus
        // sends, the page's focus staying where it was — so while the
        // document's active element is still inside the region, the
        // keyboard's hold stays.
        if (event.currentTarget.contains(document.activeElement)) return;
        focus.onBlur(event);
      }}
    >
      {/* THE ARROWS — FIRST in the DOM (the law's order): two transparent
          strips at the stage's two edges, a tall chevron each (the header's
          THE ARROWS). Named by their labels; a bounded list disables the one
          that has nowhere to go. */}
      {isCarousel && (
        <div className={CONTROLS}>
          <button
            ref={previousRef}
            type="button"
            aria-label={labels.previous}
            disabled={!canPrevious}
            onClick={pressPrevious}
            className={cx(ARROW, ARROW_SIDE.previous)}
          >
            <Chevron towards="previous" />
          </button>
          <button
            ref={nextRef}
            type="button"
            aria-label={labels.next}
            disabled={!canNext}
            onClick={pressNext}
            className={cx(ARROW, ARROW_SIDE.next)}
          >
            <Chevron towards="next" />
          </button>
        </div>
      )}
      {/* THE BEADS — after the arrows and before the cards in the DOM, under
          the cards in the picture (the header's THE BEADS): one per card,
          named as its card, the current one aria-current. */}
      {isCarousel && (
        <div role="group" aria-label={labels.picker} className={BEADS}>
          {slides.map((_, card) => {
            const current = card === index;
            return (
              <button
                // The list is static and never reorders: the index IS the
                // card's identity.
                key={card}
                type="button"
                aria-label={slideLabels[card]}
                aria-current={current ? 'true' : undefined}
                onClick={() => onPick(card)}
                className={BEAD}
              >
                <span
                  aria-hidden="true"
                  className={cx(DOT, current ? DOT_CURRENT : DOT_IDLE)}
                />
              </button>
            );
          })}
        </div>
      )}
      {/* THE HAND'S BOX — the pointer's, around THE STAGE, the cards'
          container and the live region (the header's THE LIFT). Pointer
          handlers only on a carousel: one card has nowhere to go. A press
          ENDS on the window (`endAnywhere`), wherever it is let go. */}
      <div
        ref={handRef}
        className={cx(HAND, isCarousel && GRAB, dragging && GRABBING)}
        onPointerDown={isCarousel ? onPointerDown : undefined}
        onPointerMove={isCarousel ? onPointerMove : undefined}
        onLostPointerCapture={isCarousel ? onLostPointerCapture : undefined}
        onClickCapture={isCarousel ? onClickCapture : undefined}
        onDragStart={(event) => event.preventDefault()}
      >
        <div
          ref={stageRef}
          aria-live={isCarousel ? live : undefined}
          className={STAGE}
        >
          {slides.map((slide, card) => {
            const position = positions[card];
            const pose = poseAt(position);
            const centred = card === index;
            return (
              <div
                // The list is static and never reorders: the index IS the
                // card's identity, and nothing ever remounts.
                key={card}
                role={isCarousel ? 'group' : undefined}
                aria-roledescription={isCarousel ? labels.slideRole : undefined}
                aria-label={isCarousel ? slideLabels[card] : undefined}
                // The side cards are previews: out of the tree and the Tab
                // order, aria-hidden the belt (the header's THE CONSUMPTION LAW).
                inert={!centred || undefined}
                aria-hidden={!centred || undefined}
                style={
                  {
                    '--tx': pose.tx,
                    '--ry': pose.ry,
                    '--sc': pose.sc,
                    zIndex: stackOrder(position),
                  } as CSSProperties
                }
                className={cx(
                  SLIDE,
                  HEIGHT[cardHeight],
                  dragging || painted.jumped[card] ? SLIDE_SNAP : SLIDE_MOVE,
                )}
              >
                {slide}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** The clock options, as the dispatcher hands them on. */
type ClockOptions = Readonly<{
  intervalMs: number | undefined;
  startDelayMs: number | undefined;
  env: ClockEnv | undefined;
}>;

/** What the dispatcher hands a mode's ring owner: the island's own props, the
 *  native rest, already split, and the clock options. */
type ModeProps = Readonly<{
  common: ViewCommonProps;
  native: NativeSectionProps;
  clock: ClockOptions;
}>;

/** The clock both modes run, as a view needs it. */
type CarouselClock = Readonly<{
  rotation: RotationRing;
  shown: number;
  status: RotationStatus;
  focus: FocusManners;
  stageRef: RefObject<HTMLDivElement | null>;
}>;

/**
 * The ring of `length` steps on lib/rotation's clock, with the island's holds
 * (the header's THE CONSUMPTION LAW): the keyboard's focus, a drag (the view
 * asks for it), and OFF SCREEN — CourseTimeline's way: in view, resume; out of
 * view, hold. The observer is made again when the ring's length changes,
 * because lib/clock's begin() — a ring going idle at one card and running
 * again at two — clears every hold, and an observer reports only CROSSINGS.
 * An engine without IntersectionObserver gets no hold: the ring simply runs.
 */
function useCarouselClock(length: number, clock: ClockOptions): CarouselClock {
  const { rotation, shown, status } = useRotation({
    count: length,
    intervalMs: clock.intervalMs ?? CARD_CAROUSEL_INTERVAL_MS,
    startDelayMs: clock.startDelayMs ?? CARD_CAROUSEL_FIRST_DWELL_MS,
    env: clock.env,
  });
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (stage === null || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) rotation.resume('offscreen');
        else rotation.suspend('offscreen');
      }
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [rotation, length]);

  return {
    rotation,
    shown,
    status,
    focus: focusManners(rotation, {
      keyboardEntry: 'suspend',
      pointerEntry: 'none',
    }),
    stageRef,
  };
}

/** A tap's step: none — the press only stops the ring (the header's THE
 *  CONSUMPTION LAW). */
const STAY = (): void => {};

/** 'loop': the list itself is the ring (the header's THE TWO AXES). */
function LoopCarousel({ common, native, clock }: ModeProps): ReactElement {
  const count = common.slides.length;
  const { rotation, shown, status, focus, stageRef } = useCarouselClock(
    count,
    clock,
  );
  return (
    <CarouselView
      common={common}
      native={native}
      index={shown}
      live={liveRegion(status)}
      ring
      canPrevious
      canNext
      onPrevious={handNavigation(rotation, rotation.prev)}
      onNext={handNavigation(rotation, rotation.next)}
      onPick={(card) => handNavigation(rotation, () => rotation.goto(card))()}
      onHold={() => rotation.suspend('drag')}
      onHoldEnd={() => rotation.resume('drag')}
      onRelease={(steps) =>
        handNavigation(rotation, () => {
          if (steps !== 0) rotation.goto(shown + steps);
        })()
      }
      onTap={handNavigation(rotation, STAY)}
      focus={focus}
      stageRef={stageRef}
    />
  );
}

/** 'bounded': the list walked out and back — ./track's ring of 2(N − 1)
 *  steps (the header's THE TWO AXES). */
function BoundedCarousel({ common, native, clock }: ModeProps): ReactElement {
  const count = common.slides.length;
  const { rotation, shown, status, focus, stageRef } = useCarouselClock(
    trackLength(count),
    clock,
  );
  const index = placeOnTrack(shown, count);
  /** A hand moves the list by `steps` (./track's A HAND ON THE TRACK). */
  const move = (steps: number): void =>
    rotation.goto(handOnTrack(shown, steps, count));
  return (
    <CarouselView
      common={common}
      native={native}
      index={index}
      live={liveRegion(status)}
      ring={false}
      canPrevious={index > 0}
      canNext={index < count - 1}
      onPrevious={handNavigation(rotation, () => move(-1))}
      onNext={handNavigation(rotation, () => move(1))}
      onPick={(card) => handNavigation(rotation, () => move(card - index))()}
      onHold={() => rotation.suspend('drag')}
      onHoldEnd={() => rotation.resume('drag')}
      onRelease={(steps) =>
        handNavigation(rotation, () => {
          if (steps !== 0) move(steps);
        })()
      }
      onTap={handNavigation(rotation, STAY)}
      focus={focus}
      stageRef={stageRef}
    />
  );
}

/**
 * The card carousel (the header). Splits the island's own props from the
 * native rest — so that neither `mode`, `cardCap` nor a clock option ever
 * lands on the <section> as an attribute — and dispatches to the mode's own
 * ring owner; renders nothing for an empty list.
 *
 * @throws RangeError when `slideLabels` and `slides` differ in length — two
 * lists that must name the same cards in the same order — when `visible` is
 * neither 3 nor 5 (THE TWO AXES, held at run time), and when the card's size
 * is not one answer in the theme's step: a cap AND a fixed width, a cap other
 * than 'capped' (THE CARD CAP's one value, held at run time), a width that is
 * no string, an empty width, a width that never names `var(--spacing)` (THE
 * FIXED CARD: a px length would skip THE BAND SCALE without a word), or one
 * holding an underscore (a class's value pasted as it is: no CSS length
 * inline).
 */
export function CardCarousel({
  slides,
  slideLabels,
  visible,
  labels,
  cardHeight,
  cardCap,
  cardWidth,
  mode,
  intervalMs,
  startDelayMs,
  env,
  ...native
}: CardCarouselProps): ReactElement | null {
  if (slideLabels.length !== slides.length) {
    throw new RangeError(
      `CardCarousel: ${slides.length} cards but ${slideLabels.length} labels — every card needs exactly one finished label („1 din ${slides.length}"), in the same order.`,
    );
  }
  // THE WINDOW (THE TWO AXES), held at run time: a JavaScript caller is held
  // by no type, and any other value leaves the geometry undefined — no
  // GEOMETRY string and no GEOMETRY_STYLE numbers: no card width, no stage, no
  // fade — without a word.
  const shown: unknown = visible;
  if (shown !== 3 && shown !== 5) {
    throw new RangeError(
      `CardCarousel: \`visible\` „${String(shown)}" is no window — a carousel shows 3 cards or 5.`,
    );
  }
  // THE FIXED CARD's width is a string — a CSS length — or nothing: anything
  // else would meet a TypeError deep inside the checks below.
  const width: unknown = cardWidth;
  if (width !== undefined && typeof width !== 'string') {
    throw new RangeError(
      `CardCarousel: \`cardWidth\` is ${width === null ? 'null' : `a ${typeof width}`}, not a CSS length — give a string in the theme’s step, e.g. calc(var(--spacing)*56.45).`,
    );
  }
  if (cardWidth !== undefined && cardCap !== undefined) {
    throw new RangeError(
      'CardCarousel: `cardWidth` and `cardCap` both given — a card is either the column’s share under a cap or one fixed width, never both.',
    );
  }
  // THE CARD CAP's one value (the header), held at run time: a JavaScript
  // caller is held by no type, and its 'none' — the lifted cap, gone — would
  // otherwise draw the capped card without a word.
  const cap: unknown = cardCap;
  if (cap !== undefined && cap !== 'capped') {
    throw new RangeError(
      `CardCarousel: \`cardCap\` „${String(cap)}" is no cap — its one value is 'capped' (its second, 'none', left on 2026-10-20); a card of another width is \`cardWidth\`’s.`,
    );
  }
  if (cardWidth !== undefined && cardWidth.trim() === '') {
    throw new RangeError(
      'CardCarousel: `cardWidth` is empty — give a CSS length in the theme’s step, e.g. calc(var(--spacing)*56.45).',
    );
  }
  if (cardWidth !== undefined && !cardWidth.includes('var(--spacing)')) {
    throw new RangeError(
      `CardCarousel: \`cardWidth\` „${cardWidth}" is not in the theme’s step — write it with var(--spacing), e.g. calc(var(--spacing)*56.45), so the band scale redraws the card.`,
    );
  }
  if (cardWidth !== undefined && cardWidth.includes('_')) {
    throw new RangeError(
      `CardCarousel: \`cardWidth\` „${cardWidth}" holds an underscore — a class’s value pasted as it is, Tailwind’s underscores standing for its spaces. Inline it is no CSS length at all: the property would be dropped, and the card’s width with it, without a word. Write the spaces, e.g. calc(var(--spacing) * 56.45).`,
    );
  }
  if (slides.length === 0) return null;
  const common = {
    slides,
    slideLabels,
    visible,
    labels,
    cardHeight,
    cardWidth,
  };
  const clock = { intervalMs, startDelayMs, env };
  return mode === 'bounded' ? (
    <BoundedCarousel common={common} native={native} clock={clock} />
  ) : (
    <LoopCarousel common={common} native={native} clock={clock} />
  );
}
