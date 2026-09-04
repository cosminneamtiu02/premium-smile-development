'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ComponentPropsWithRef,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement,
  ReactNode,
  RefObject,
  SyntheticEvent,
} from 'react';
import { Close } from '@/assets/glyphs/Close';
import { cx } from '@/lib/cx';
import { lockScroll } from '@/lib/scroll-lock';
import { makeAttachRef } from '../attach-ref';
import { GlyphButton } from '../GlyphButton/GlyphButton';

// ui/Modal — THE modal dialog of the design system, built per the
// owner-approved contract board .claude/plans/modal-atom-contract.plan.md
// (fb-261, 2026-08-26). Greenfield: the old repo never had a contact modal,
// only a mobile menu wearing role="dialog", which NavMenu's disclosure already
// replaced. sections/ContactModal composes THIS in its own run.
//
// ── WHAT THE PLATFORM DOES AND WE THEREFORE DO NOT (D1 → native <dialog>).
// `showModal()` buys, for free and correctly on every engine since 2022:
// the TOP LAYER (painted above the entire page — the z-40 corner discs, the
// z-45 menu sheet and the z-50 Header bar all end up UNDER this and its scrim,
// with nothing added to the shell's z-map, D13), everything outside the dialog
// INERT (untappable, untabbable, silent to screen readers — the very freeze
// NavMenu writes by hand), Esc → cancel → close, focus RETURNED to whatever
// opened it, and role="dialog" exposed as modal. So there is no focus trap in
// this file, no inert bookkeeping, and no z-index anywhere: adding a `z-*`
// class here would be a stacking claim the code does not make (§7.9).
// What the platform does NOT give: the page still scrolls behind the scrim
// (→ lockScroll, D7) and there is no light-dismiss we can rely on yet
// (`closedby` is too new for this audience's phones → D11's own backdrop press,
// which D19 simplified from a rectangle check to "the event targeted the
// layer", once the layer became a separate element from the panel).
//
// ── THE ROOT IS A LAYER HOLDING THE BOX (D2 → A′, amended by D17).
// ORIGINALLY (D2 → A′, owner 2026-08-26) the <dialog> element WAS the white
// panel and nothing else: one element, `::backdrop` for the sheet, the caller's
// className on the panel. That reasoning is still why the scrim is
// `backdrop:bg-scrim` — the SAME `--scrim` token NavMenu's sheet uses (D14), no
// second alpha — and why the token layer carries one line for it: `::backdrop`
// sits in the semantic selector list in globals.css, because engines older than
// 2024 do not inherit custom properties into ::backdrop and the dim would
// silently vanish there (tests/unit/backdrop-token-layer.test.ts guards it).
//
// WHAT CHANGED AND WHY (D17–D21, owner 2026-08-28). A panel that is TALLER than
// the screen has to be shown WHOLE — the owner's never-scroll rule for the
// contact dialog: the visitor must see the entire card and move it, not read it
// through a 288px window with a scrollbar down its middle. A single-element
// modal cannot do that. Whatever the <dialog> is, it is the thing the browser
// centres in the viewport, so if it is also the white box, an oversized box
// either gets CAPPED (and scrolls inside, which is the picture we are removing)
// or overflows the viewport with its top edge unreachable.
//
// So the element splits in two, and each half gets exactly one job:
//   · THE LAYER — the <dialog>: transparent, `fixed inset-0`, `p-4`, a flex
//     COLUMN, and `overflow-y-auto`. It is the full-viewport sheet the scrim is
//     painted behind, the element that reports backdrop presses (D19), the
//     element `ref` hands back, and — when the box is taller than the screen —
//     the only thing that scrolls. The box then moves WHOLE under the scrim.
//   · THE BOX — its single child <div>: the white panel. Every size step, the
//     look, the `@container` and the caller's `className` live here (§6.8, D9
//     unchanged in spirit: className still lands on the thing a parent means by
//     "the modal"). `m-auto` centres it in the layer — and auto margins are the
//     load-bearing detail, not decoration: in a flex column they absorb the free
//     space when there IS some (perfect centring) and collapse to ZERO when
//     there is none, so an oversized box starts at the layer's top edge and
//     overflows only downward. `justify-center` or `items-center` would split
//     the overflow across both ends and put the panel's first line above scroll
//     position 0, where no scrollbar can reach it — the classic centred-overlay
//     data loss.
// The pixels are unchanged for every modal that fits: the layer's `p-4` is the
// pair of 1rem phone margins the width steps used to carry inside their own
// `min(100% - 2rem, …)`, so `min(100%, 32rem)` against the layer's content box
// computes what `min(100% - 2rem, 32rem)` against the viewport computed before.
//
// ── §6 contract: content is slots (`header`, `children`), size/tone are typed
// props, semantic tokens only, no outer margins (the top layer positions it),
// parent className merged LAST, native props spread, ref as a regular prop.
// §8.1: locale-agnostic — every string arrives finished, including the ✕'s
// spoken name (`closeLabel`, required, no default, D10 → B). Nothing Romanian
// lives in this file.
// §6.5: the BOX is the `@container` — deliberately not the layer, which is
// always the whole viewport and would make every modal on a 1280 screen read as
// @2xl. On the box the padding still answers to the PANEL's width, never the
// screen's — a `sm` modal on a desktop stays phone-tight — and there is not one
// media query in the atom.
//
// 'use client' is a necessity, not a preference (D12): showModal(), the focus
// move and the scroll lock are browser-time work. The element still
// pre-renders into the static HTML — closed, hidden, costing nothing until the
// island hydrates (§16).

export type ModalWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalHeight = 'auto' | 'sm' | 'md' | 'lg' | 'full';

/**
 * The dialog's accessible name — REQUIRED, exactly one of the two (§6.3 one
 * level up: a nameless dialog is an axe `aria-dialog-name` violation; here it
 * is a compile error). `aria-labelledby` points at the consumer's own heading
 * inside the `header` slot; `aria-label` serves headingless modals.
 */
type ModalName =
  | { 'aria-labelledby': string; 'aria-label'?: never }
  | { 'aria-label': string; 'aria-labelledby'?: never };

type ModalOwnProps = {
  /** Controlled visibility. true → showModal(); false → close(). */
  open: boolean;
  /**
   * Fires EXACTLY ONCE per close, whichever path took it — the ✕, Esc, or a
   * press on the backdrop. The atom never flips its own state: the parent
   * sets `open` to false in response. If the parent ignores onClose after Esc,
   * the element is closed while `open` stays true and the scroll lock stays
   * held until the parent flips `open` — inherent to the controlled contract.
   */
  onClose: () => void;
  /**
   * The top bar's populable region, left of the ✕: any aligned elements — a
   * heading, a glyph + heading, a secondary control. Omitted → the bar still
   * renders, ✕ only. Rendered as a plain <div> (never <header>: inside a
   * dialog that maps to a second `banner` landmark).
   */
  header?: ReactNode;
  /**
   * The content container. When `scrollable` (the default) it scrolls
   * internally once the panel hits its height cap; when `scrollable={false}`
   * it never scrolls — the box grows with it and the layer takes the overflow.
   */
  children: ReactNode;
  /**
   * Panel width cap, rem-based; fluid below it (viewport minus 1rem margins).
   * sm 24rem · md 32rem · lg 42rem · xl 56rem · full = the whole viewport minus margins.
   * @default 'md'
   */
  width?: ModalWidth;
  /**
   * Panel height: `auto` fits the content; the steps are sm 20rem · md 28rem ·
   * lg 36rem · full = the viewport minus margins.
   *
   * What a step MEANS depends on `scrollable`. When `scrollable` (the default)
   * they are FIXED heights, each still capped by the viewport, and the body
   * scrolls inside them. When `scrollable={false}` they are MINIMUM heights:
   * the box is at least that tall and grows past them with its content, since a
   * fixed height there would clip whatever did not fit with no scroll container
   * anywhere to reach it.
   * @default 'auto'
   */
  height?: ModalHeight;
  /** Paint the LOCKED scrim (`--color-scrim`, black 0.55) behind the panel. @default true */
  dimBackdrop?: boolean;
  /**
   * A pointer press that starts AND ends on the backdrop closes the modal.
   * Esc closes regardless of this flag — the keyboard exit is never optional.
   * @default true
   */
  closeOnBackdropClick?: boolean;
  /**
   * (D16, owner 2026-08-28) Which box gives way when the content is taller
   * than the screen.
   *
   * `true` (default) — the box is capped at the viewport minus 2rem and its
   * BODY scrolls inside it; the top bar and the ✕ never move, and the body
   * becomes a named `region` with a tab stop for as long as it really
   * overflows (SC 2.1.1).
   *
   * `false` — the box takes its FULL content height: its body never scrolls
   * and never becomes a region or a tab stop. A box taller than the viewport
   * makes the dialog's full-viewport LAYER scroll instead, so the panel moves
   * whole under the scrim — the never-scroll picture, where the visitor sees
   * one card and slides it rather than reading it through a window. The
   * `height` steps follow: they become MINIMUMS here, because a fixed height
   * plus a box that may not scroll is a content trap (see `height`).
   * @default true
   */
  scrollable?: boolean;
  /**
   * REQUIRED — the ✕'s spoken name (§6.3, the same rule as GlyphButton's own
   * aria-label): already-translated text from whoever renders the modal — a
   * section passes t('close') (`contact.close` exists in all five files), a
   * story passes its fixture. No default: nothing Romanian lives in the atom
   * (D10 → B, owner 2026-08-26).
   */
  closeLabel: string;
  /**
   * (D3 → C, owner 2026-08-26) The element that receives focus when the
   * modal opens — e.g. the phone link in ContactModal. Absent → the dialog
   * itself is focused (the name is announced, no control shows a ring).
   */
  initialFocusRef?: RefObject<HTMLElement | null>;
};

export type ModalProps = ModalOwnProps &
  ModalName &
  Omit<
    ComponentPropsWithRef<'dialog'>,
    | keyof ModalOwnProps
    | 'aria-label'
    | 'aria-labelledby'
    // the atom owns every dismissal path: the cancel/close event pair (D11)
    // and `closedby`, the new light-dismiss attribute — letting a consumer set
    // it would let the platform close the modal behind our back and make
    // `closeOnBackdropClick={false}` a lie on new engines.
    | 'onCancel'
    | 'closedby'
  >;

// THE LAYER (D17) — the <dialog> itself: invisible, the size of the viewport,
// and the only thing that ever scrolls the whole panel.
//
// THE RESETS (§7.8): a UA `dialog:modal` ships `max-width/max-height:
// calc(100% - 6px - 2em)`, `padding: 1em`, `margin: auto`, a border AND an
// opaque `background: canvas` of its own. Author styles beat the UA origin, so
// `max-w-none max-h-none p-4 m-0 border-0 bg-transparent` are what turn that
// default box into a sheet — and `w-auto h-auto` are what let `inset-0` size it
// to the viewport, since the UA sizes a dialog `fit-content` in both axes.
// `p-4` IS the 1rem phone margin, now paid once by the layer instead of by
// every width step's `min(100% - 2rem, …)`.
//
// `open:flex`, NEVER a bare `flex` (§7.1): `display: flex` unconditionally
// would win over the UA's (and globals') display:none for a CLOSED dialog and
// leave the modal's markup sitting in the page.
//
// `overflow-y-auto` + `overscroll-contain`: the scroll of last resort (D18).
// A box that fits produces no scrollbar at all; a box that does not scrolls
// here, whole, and the gesture never chains through to the frozen page behind.
//
// MOTION (D6): 200ms fade-IN only, on the layer (the box rides along inside it)
// and on the sheet, each with its own transition stack —
// `starting:open:backdrop:opacity-0` is the ordering Tailwind 4.3 compiles into
// the valid selector (`…:is([open])::backdrop`; the mirror-image
// `backdrop:starting:open:*` emits `::backdrop:is([open])`, which no engine can
// match). There is no fade-OUT: that needs the element kept displayed after
// close(), which delays the platform's focus return. motion-reduce switches
// both off (§9) — an instant open loses nothing.
const layerClasses =
  'fixed inset-0 m-0 w-auto h-auto max-w-none max-h-none border-0 ' +
  'bg-transparent p-4 ' +
  'open:flex flex-col overflow-y-auto overscroll-contain outline-none ' +
  'transition-opacity duration-200 starting:open:opacity-0 ' +
  'backdrop:transition-opacity backdrop:duration-200 ' +
  'starting:open:backdrop:opacity-0 ' +
  'motion-reduce:transition-none backdrop:motion-reduce:transition-none';

// THE BOX (D17) — the white panel, the layer's only child.
//
// The look (ex-D4, unchanged by the split): the menu panel's own clothes —
// `rounded-lg border border-line-subtle bg-surface` (NavMenu.tsx) — so the site
// has ONE overlay language, plus `shadow-xl`. The shadow is invisible over the
// scrim and exists for dimBackdrop={false}, where a white panel would otherwise
// sit on the off-white page with a hairline between them.
//
// `shrink-0` is
// load-bearing: the box is a flex item in a column, so the default
// `flex-shrink: 1` would SQUASH an oversized box back to the layer's height
// (its `overflow-hidden` makes its automatic minimum size zero, so it shrinks
// all the way) and then clip the content that no longer fits — the exact
// failure the owner reported inside Storybook's canvas. Refusing to shrink is
// what turns the excess into layer scroll instead of lost content.
const boxClasses =
  '@container m-auto shrink-0 ' +
  'rounded-lg border border-line-subtle bg-surface text-ink shadow-xl ' +
  // `break-words` (overflow-wrap: break-word) is INHERITED by everything the
  // consumer nests, and it is load-bearing, not polish: the panel is a
  // hard-edged overflow-hidden box, so one unbreakable word wider than it —
  // German is full of them ("Behandlungskostenübernahmebestätigung", the
  // GermanLongest story's fixture) — is silently CLIPPED at 288px instead of
  // wrapping (§8.4). Verified in the live Storybook at 320 before and after.
  // break-word, never break-all: ordinary text keeps breaking at spaces.
  'break-words ' +
  'flex flex-col overflow-hidden';

// The cap, and ONLY in the scrollable mode (D18): the viewport minus the
// layer's own margins. Without it the box is as tall as its content and the
// layer takes the overflow.
const capClass = 'max-h-[calc(100dvh-2rem)]';

// Named steps, not free values (owner): a finite list keeps every modal on the
// site inside one family, and `className` covers the genuine one-off (§6.8,
// D9). `100%` is the LAYER's content box — the viewport minus its `p-4` — so
// the pair of 1rem phone margins that used to sit inside every `min()` is paid
// once, by the layer, and the computed pixels are unchanged: at 320px the md
// panel is 288px, at 390 it is 358px, and from 512px up it simply stops.
// Tailwind restores the spaces CSS math requires: `min(100%,32rem)` compiles to
// `min(100%, 32rem)` (verified with its own compiler).
const widthClasses: Record<ModalWidth, string> = {
  sm: 'w-[min(100%,24rem)]',
  md: 'w-[min(100%,32rem)]',
  lg: 'w-[min(100%,42rem)]',
  xl: 'w-[min(100%,56rem)]',
  full: 'w-full',
};

// auto = no height class at all: the panel is as tall as its content until the
// `max-h` cap catches it. The fixed steps are for modals whose content grows
// (a list, a scrolling body) and whose box should not jump between openings.
const heightClasses: Record<ModalHeight, string> = {
  auto: '',
  sm: 'h-[20rem]',
  md: 'h-[28rem]',
  lg: 'h-[36rem]',
  full: 'h-[calc(100dvh-2rem)]',
};

// THE SAME STEPS, AS MINIMUMS — the non-scrollable mode (G2, D16). A FIXED
// height there is a content trap: the box is `overflow-hidden`, the body is
// `overflow-visible` and the layer only scrolls what actually sticks out of the
// box, so `h-[28rem]` + more than 28rem of content clips the remainder with no
// scroll container anywhere to reach it (measured: box scrollHeight 1499 vs
// clientHeight 446, layer 896/896). Worse than invisible — Tab into a clipped
// link scrolls the overflow-hidden box programmatically and the ✕ leaves the
// screen with no way back.
// `min-h-*` keeps everything the steps were FOR — a box that does not jump
// between openings, a floor under a short panel — while letting content push
// past the floor, which is exactly D16's promise: the box takes its full
// content height and the LAYER takes the overflow. A second map rather than
// rewriting the strings, so both lists stay greppable and neither can drift
// into the other's mode.
const minHeightClasses: Record<ModalHeight, string> = {
  auto: '',
  sm: 'min-h-[20rem]',
  md: 'min-h-[28rem]',
  lg: 'min-h-[36rem]',
  full: 'min-h-[calc(100dvh-2rem)]',
};

// P (padding) and G (gap) as CONTAINER steps, measured on the panel (D5):
// P = 1rem → 1.5rem at @md (28rem) → 2rem at @2xl (42rem); G = 0.75rem → 1rem
// at @md. A `sm` panel never reaches 28rem, so it stays phone-tight everywhere
// — which is the whole reason these are container queries and not breakpoints.
// min-h-11 on the slot is the ✕'s own height: one-line header content sits on
// the ✕'s midline, two-line content grows DOWNWARD, and the ✕ never moves off
// its (P, P) corner — `ms-auto shrink-0` holds it there whether the slot is
// empty, one line or wrapped.
const barClasses =
  'flex items-start gap-3 pt-4 px-4 @md:pt-6 @md:px-6 @2xl:pt-8 @2xl:px-8';
// `[&>*]:min-w-0` is the a11y-G2 fix for a long title word, and it is NOT
// decoration: the slot is a flex container, so whatever the consumer drops in
// is a flex ITEM whose automatic minimum width is its min-content — and
// `break-words` (the root's overflow-wrap: break-word) does NOT count in
// min-content. Measured in Chromium with a 45-character compound in a 277px
// slot: without this, the heading lays out 460px wide, slides under the ✕ and
// is clipped by the panel; with it, it wraps to two lines and nothing
// overflows.
// The reviewer's own suggestion — the utility for `overflow-wrap: anywhere`,
// which DOES count in min-content — fixes the same case, but it additionally
// turns intra-word breaks into ordinary line-breaking opportunities for every
// string in the slot. This class buys the identical protection and leaves
// ordinary text alone, still breaking at spaces.
// (Naming that utility in full here would also emit it into the site's CSS:
// Tailwind's scanner reads class names out of comments too.)
const slotClasses =
  'flex min-h-11 min-w-0 flex-1 flex-wrap items-center gap-3 [&>*]:min-w-0';
// The body's padding is the same in both modes — P left/right/bottom, G on top
// (D5). `rounded-b-lg` matches the panel's own corners, since this container
// reaches the bottom edge of the box.
//
// The focus ring lives here, in BOTH modes (G2). It is obviously needed in the
// scrollable one, where this container really is a tab stop; the reason it is
// unconditional is the HANDOVER between the modes. `scrollable` is a prop, so a
// consumer can flip it while the modal is open — and if it flips to false while
// the body holds focus, the measuring effect deliberately keeps the tab stop
// until the next blur (never yank focus out from under someone: removing
// tabindex from the focused element drops focus to <body>, i.e. outside the
// modal). For those few moments a focused element would otherwise have only the
// browser/globals default ring, which the box's `overflow-hidden` clips.
// Costing: `focus-visible:` is inert on an element that cannot be focused, so
// carrying it in the static mode buys the handover and changes nothing else.
// The ring is drawn INSIDE the container (`-outline-offset-2`) on purpose: the
// panel is `overflow-hidden`, so an outline at the default +2px offset is
// clipped on three of its four edges and reads as a stray 2px line under the
// title.
const contentBase =
  'rounded-b-lg px-4 pb-4 pt-3 @md:px-6 @md:pb-6 @md:pt-4 @2xl:px-8 @2xl:pb-8 ' +
  'focus-visible:outline-2 focus-visible:outline-focus ' +
  'focus-visible:-outline-offset-2';

// SCROLLABLE MODE (D21): this container is the scroll port. `min-h-0 flex-1`
// let it take the leftover height of a capped box and shrink below its content
// — without them a flex item's automatic minimum size pins it to its content
// and the box, not the body, overflows.
const contentScrollingClasses =
  'min-h-0 flex-1 overflow-y-auto overscroll-contain';

// NON-SCROLLABLE MODE (D21): every class whose only job was to scroll is gone.
// `overflow-visible` is written out rather than left to the default so the
// intent is legible at the call site and in the test: this container must never
// clip, never scroll and never become a region — the box grows instead, and the
// layer scrolls it.
const contentStaticClasses = 'overflow-visible';

export function Modal({
  open,
  onClose,
  header,
  children,
  width = 'md',
  height = 'auto',
  dimBackdrop = true,
  closeOnBackdropClick = true,
  scrollable = true,
  closeLabel,
  initialFocusRef,
  className,
  ref,
  onClick,
  onPointerDown,
  // Destructured only so the scrolling region can MIRROR the dialog's own name
  // when it becomes a named region (below). Both are written back onto the
  // <dialog> explicitly — the accessible name belongs to the dialog first.
  'aria-labelledby': ariaLabelledby,
  'aria-label': ariaLabel,
  ...rest
}: ModalProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  // The measuring twin (see the render): the region's own box is pinned by the
  // height step, so only this inner wrapper grows when content arrives late.
  const innerRef = useRef<HTMLDivElement | null>(null);
  // The live `measure` from the effect below, so the region's onBlur can call
  // it without the effect having to be re-created for a handler identity.
  const measureRef = useRef<() => void>(() => {});
  // Whether the body ACTUALLY overflows — measured after mount, never guessed
  // (see the measuring effect below). Named for the measurement, not for the
  // prop: `scrollable` is what the CONSUMER asked for, this is what the DOM
  // reports, and only both together earn the region and its tab stop.
  const [bodyOverflows, setBodyOverflows] = useState(false);
  // The press that a backdrop dismissal must have STARTED with. Kept in a ref,
  // not state: nothing renders from it, and a re-render mid-gesture would be a
  // bug of its own.
  const pressStartedOutside = useRef(false);

  // §6.8 gives the caller a ref to the root; the atom needs the same node for
  // showModal()/close(). One callback feeds both — memoised on the caller's ref
  // so React does not detach and re-attach it on every render.
  // The merge itself — including React 19's callback-ref cleanup protocol —
  // lives in `makeAttachRef` (ui/attach-ref.ts), shared with SpeedDial.
  const attachRef = useCallback(
    (node: HTMLDialogElement | null) => makeAttachRef(dialogRef, ref)(node),
    [ref],
  );

  // THE open/close engine (D11), keyed on `open` and NOTHING else. `open` in,
  // `dialog.showModal()` out; the cleanup — which React runs the moment `open`
  // turns false, and on unmount — unlocks the page and closes the element.
  // Nothing here ever sets state, so the element can never disagree with the
  // prop.
  //
  // WHY THE EFFECT IS SPLIT (G2): initial focus depends on `initialFocusRef`
  // too, and a dependency list carrying it would restart THIS effect whenever a
  // consumer's ref identity changed — close(), then showModal() again, dropping
  // and retaking the scroll lock, and queuing a native `close` event that
  // arrives after the reopen. (handleNativeClose survives that by construction
  // now, but the churn itself is the bug.) Focus therefore lives in its own
  // effect right below; React runs effects in declaration order, so it still
  // happens immediately after showModal().
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    // Engines that never implemented <dialog> (D1b's ~3%, frozen on 2019–2021
    // software): `showModal` is not a function there and `dialog.open` is
    // undefined. Bailing out makes the trigger a NO-OP — an effect that throws
    // takes the entire page down with it in Next's client runtime ("Application
    // error"), which is a far worse outcome than a modal that cannot open. The
    // globals' `dialog:not([open])` rule keeps the closed markup invisible, so
    // the page simply stays as it was.
    if (typeof dialog.showModal !== 'function') return;

    // Who to hand focus back to if this component is UNMOUNTED while open:
    // React runs passive cleanups AFTER the DOM node is gone, so the platform's
    // own focus restoration has nothing left to restore to (§9: focus returns
    // to the trigger). On every ordinary close the element is still connected
    // and the browser does it for us — hence the isConnected check below.
    const opener = document.activeElement;

    if (!dialog.open) dialog.showModal();
    const unlock = lockScroll();

    return () => {
      unlock();
      if (dialog.open) dialog.close();
      if (
        !dialog.isConnected &&
        opener instanceof HTMLElement &&
        opener.isConnected
      ) {
        // `preventScroll` — restoring focus restores the KEYBOARD position; the
        // VIEWPORT position is the visitor's and they did not ask to move
        // (owner-reported close-jump, 2026-09-04). Without it the browser
        // scrolls the opener into view AND tries to honour the shell's
        // `scroll-padding-top`, which for an opener inside the sticky bar is a
        // clearance that moves with the page and can never be satisfied — so
        // the page drifts every time a dialog closes. This path only runs when
        // the dialog was removed while open, i.e. the opener is still where the
        // visitor left it.
        opener.focus({ preventScroll: true });
      }
    };
  }, [open]);

  // Initial focus (D3 → C) — its own effect, so a changing `initialFocusRef`
  // identity can never restart the engine above. Never `autoFocus` (React
  // strips it off non-form elements): the consumer's target if there is one,
  // else the dialog — which `tabIndex={-1}` makes focusable and `outline-none`
  // keeps ring-free, so the modal opens calm and the screen reader still
  // announces its name (§7.6).
  // Unchanged by D17, but worth naming: the element that takes focus is now the
  // LAYER, which is also the scroll container of last resort. So in the
  // non-scrollable mode the arrow keys already scroll the right thing the
  // moment the modal opens, with no tab stop added anywhere (D21) — the
  // scrollable mode is the one that still needs its body to be reachable,
  // because there the box is capped and the layer has nothing to scroll.
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog?.open) return;
    (initialFocusRef?.current ?? dialog).focus();
  }, [open, initialFocusRef]);

  // Does the body ACTUALLY overflow? (a11y G2 — scrollable mode ONLY, D21.)
  // With scrollable={false} there is no scroll port inside the panel at all:
  // nothing is measured, no observer is attached, and the body can never
  // acquire a role or a tab stop. axe's
  // `scrollable-region-focusable` demands focusability only of a region that
  // genuinely scrolls, and a Tab stop on one that does not is a stop every
  // keyboard user pays for and no one needs. So it is measured per open, and
  // re-measured while the panel resizes (rotation, browser zoom, a font swap).
  // HYDRATION-SAFE by construction (§16.2): the pre-rendered HTML carries no
  // tabindex and no role — the decision is made after mount, never during
  // render, so the server and client markup cannot disagree.
  // `measure` is the SINGLE state-writing path — the initial post-layout read
  // and every observer callback go through it, and a close simply measures to
  // false. That is the shape react-hooks/set-state-in-effect asks for
  // ("subscribe to an external system, setState in a callback"): whether a box
  // overflows cannot be derived from props, only read back from the DOM after
  // layout, so the read must live here.
  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const measure = () => {
      const next =
        open && scrollable && element.scrollHeight > element.clientHeight;
      // Never pull the tab stop out from under the person standing on it: while
      // the region HOLDS focus, keep it focusable even if the content shrank —
      // removing tabindex from the focused element drops focus to <body>, i.e.
      // outside the modal. The region's onBlur re-measures, so the downgrade
      // happens the moment focus leaves.
      if (!next && document.activeElement === element) return;
      setBodyOverflows(next);
    };
    measureRef.current = measure;
    measure();

    if (!open || !scrollable || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    // BOTH boxes: the region for panel-driven changes (rotation, zoom), and the
    // inner wrapper for content-driven ones. At a fixed height step the region
    // never resizes, so content that arrives after open — a lazy image, a font
    // swap, an accordion opening — would otherwise never be noticed and the
    // now-scrolling body would keep no tab stop, no role and no name.
    observer.observe(element);
    const inner = innerRef.current;
    if (inner) observer.observe(inner);
    return () => observer.disconnect();
  }, [open, scrollable]);

  // A close the BROWSER performed — Escape, or a <form method="dialog"> submit
  // inside the content. TWO guards, each against a different double-fire:
  //  · `open` — when the ✕ or a backdrop press closed it, the parent has
  //    already re-rendered with open=false by the time this queued event
  //    arrives, so the user's one dismissal produces exactly one onClose.
  //  · `!event.currentTarget.open` — the element must still BE closed when the
  //    event is handled. `close()` only QUEUES its `close` event, so if our own
  //    cleanup closed the dialog and a re-run reopened it before the queue
  //    drained, the stale event would close a modal nobody dismissed. That is
  //    not hypothetical: React StrictMode (which Next's App Router turns on in
  //    development) double-invokes effects, and without this guard the modal
  //    shuts itself the instant it opens.
  // `cancel` is deliberately NOT handled: preventDefault-ing it is how pages
  // trap users, and Chrome ignores it on a second Escape anyway.
  const handleNativeClose = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (open && !event.currentTarget.open) onClose();
  };

  // "Outside" is now simply THE LAYER (D19), and the rectangle arithmetic the
  // one-element shape needed (D11 → §7.10: compare the click point with the
  // panel's rect, because a press on the dialog's own border or on a bare strip
  // between its two containers targeted the dialog while being firmly INSIDE
  // the panel) is gone with it. With the split the DOM answers the question by
  // itself: the layer covers the whole viewport, everything the visitor can
  // press outside the white panel IS the layer, and every press on the panel —
  // its border, its padding, a gap between the bar and the body, a keyboard
  // Enter on the ✕ that browsers report at 0,0 — targets the box or something
  // inside it. A synthetic 0,0 and a panel that overflows its layer are both
  // handled by that identity check alone.
  //
  // ONE PLACE WHERE THE POINT STILL MATTERS (G2, D19): THE LAYER'S OWN
  // SCROLLBAR. With scrollable={false} the layer really scrolls, and a CLASSIC
  // scrollbar — Windows everywhere, macOS with "always show scroll bars" — is
  // part of the element: pressing it dispatches pointerdown/click with
  // `target === dialog`, exactly like a press on the sheet. Without this guard
  // the modal would CLOSE while the visitor is merely dragging it into view,
  // which is the one gesture the never-scroll layout invites. So a backdrop
  // press must also land inside the layer's CLIENT box — the padding box minus
  // whatever the scrollbars occupy:
  //   · `y >= clientHeight` → the horizontal bar's band (block end, any script)
  //   · LTR: `x >= clientWidth` → the vertical bar's band at the inline end
  //   · RTL: the vertical bar sits at the inline START, so the band is the
  //     leading `offsetWidth - clientWidth` strip instead.
  // The layer carries `border-0` and the caller's className lands on the BOX,
  // so `offsetWidth - clientWidth` is the scrollbar width with no border term
  // to subtract. On overlay scrollbars (macOS default, every phone) the two
  // widths are equal and all three tests are unreachable — the guard costs
  // nothing and simply never fires.
  // One parameter type is enough: React's PointerEvent extends MouseEvent, so
  // the pointerdown handler passes its event straight in.
  const isBackdropPress = (
    event: ReactMouseEvent<HTMLDialogElement>,
  ): boolean => {
    if (event.target !== event.currentTarget) return false;
    const layer = event.currentTarget;
    const rect = layer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (y >= layer.clientHeight) return false;
    const rtl = getComputedStyle(layer).direction === 'rtl';
    return rtl
      ? x >= layer.offsetWidth - layer.clientWidth
      : x < layer.clientWidth;
  };

  // Both halves of the gesture are checked (§7.5): selecting text inside the
  // panel and releasing on the layer is a drag, not a dismissal — and the
  // reverse, a press that starts on the layer and ends inside the panel, is not
  // a dismissal either. The flag is cleared on every click, so an abandoned
  // press can never arm a later one.
  // A caller's own handlers run first and are never swallowed — `rest` is
  // spread last for everything else, but these two carry the atom's behaviour.
  const handlePointerDown = (event: ReactPointerEvent<HTMLDialogElement>) => {
    onPointerDown?.(event);
    pressStartedOutside.current = isBackdropPress(event);
  };

  const handleClick = (event: ReactMouseEvent<HTMLDialogElement>) => {
    onClick?.(event);
    const startedOutside = pressStartedOutside.current;
    pressStartedOutside.current = false;
    if (closeOnBackdropClick && startedOutside && isBackdropPress(event)) {
      onClose();
    }
  };

  return (
    // jsx-a11y classifies <dialog> as non-interactive and therefore reads any
    // onClick on it as the div-as-button smell. The rules' real target does not
    // apply here: this IS the platform's dialog element, and the keyboard path
    // out of it is Escape — handled natively, asserted in Modal.test.tsx, and
    // never optional (it ignores closeOnBackdropClick on purpose). A press on
    // the sheet is pointer-only by definition; there is no key that means
    // "click the backdrop", so a keyboard listener here would be theatre.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={attachRef}
      tabIndex={-1}
      aria-labelledby={ariaLabelledby}
      aria-label={ariaLabel}
      className={cx(
        layerClasses,
        // D14: the locked token, or nothing painted at all. The pseudo-element
        // exists either way — an undimmed modal still reports backdrop presses.
        // It stays on the <dialog> because ::backdrop belongs to the element
        // the browser put in the top layer, which is this one.
        dimBackdrop ? 'backdrop:bg-scrim' : 'backdrop:bg-transparent',
      )}
      onClose={handleNativeClose}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      {...rest}
    >
      {/* THE BOX — the layer's ONE child (D17). Sizes, look and the caller's
          className all land here; the layer above it owns nothing but the
          viewport, the scrim and the scroll of last resort. */}
      <div
        className={cx(
          boxClasses,
          widthClasses[width],
          // FIXED when the body scrolls, a MINIMUM when the box grows instead
          // (G2): the same step name, the only meaning each mode can honour.
          scrollable ? heightClasses[height] : minHeightClasses[height],
          // The cap belongs to the scrollable mode alone: without it the box is
          // as tall as its content and the LAYER takes the overflow (D18).
          scrollable && capClass,
          className,
        )}
      >
        <div className={barClasses}>
          <div className={slotClasses}>{header}</div>
          <GlyphButton
            variant="ghost"
            shape="square"
            size="md"
            aria-label={closeLabel}
            onClick={onClose}
            className="ms-auto shrink-0"
          >
            <Close />
          </GlyphButton>
        </div>
        {/* THE BODY — a scrolling region ONLY in the scrollable mode, and even
            then only while it really scrolls.
            Why focusable at all: arrow keys scroll the focused element's
            nearest scrollable ancestor, and focus sits on the layer. In the
            scrollable mode the layer has nothing to scroll (the box fits inside
            it by construction) and the box is `overflow-hidden`, so a body with
            no focusable content inside it would be unreachable by keyboard
            (SC 2.1.1; axe `scrollable-region-focusable`, which the
            FixedHeightScrolling story's own a11y run raised).
            Why only then: axe's rule fires on real overflow, and an
            unconditional tab stop would tax every keyboard user on every
            non-scrolling modal for nothing. `bodyOverflows` is measured after
            mount (effect above), so the pre-rendered HTML stays attribute-free
            and hydration-safe.
            Why NEITHER in the non-scrollable mode (D21): there is no scroll
            port here at all — the scrolling happens one level up, on the layer,
            which already holds focus and therefore already answers to the arrow
            keys. Adding a region would name a box nobody can scroll and cost
            every keyboard user a stop for it.
            Why role + name: a bare focusable div announces nothing. As a
            `region` mirroring the dialog's OWN accessible name, a screen reader
            says "<the modal's title>, region" — no new string, no message key,
            §8.1 and D10 intact.
            Deviation from the board's §3 diagram, reported at hand-off — SC
            2.1.1 outranks a class list.
            NO eslint-disable is needed for the tabIndex any more, and adding
            one back would now FAIL --report-unused-disable-directives: jsx-a11y's
            no-noninteractive-tabindex ships `allowExpressionValues: true`, so a
            computed value like this ternary is outside its reach — the rule
            only polices literal tabindexes on non-interactive elements. */}
        <div
          ref={contentRef}
          className={cx(
            contentBase,
            scrollable ? contentScrollingClasses : contentStaticClasses,
          )}
          tabIndex={bodyOverflows ? 0 : undefined}
          role={bodyOverflows ? 'region' : undefined}
          aria-labelledby={bodyOverflows ? ariaLabelledby : undefined}
          aria-label={bodyOverflows ? ariaLabel : undefined}
          onBlur={() => measureRef.current()}
        >
          {/* An unstyled wrapper whose ONLY job is to be measurable: it hugs
              the content, so the ResizeObserver above sees growth the region's
              own fixed-height box would hide. It emits no classes and no
              semantics — nothing about the rendered picture changes. */}
          <div ref={innerRef}>{children}</div>
        </div>
      </div>
    </dialog>
  );
}
