'use client';

import { type ComponentPropsWithRef, type ReactElement, useState } from 'react';
import { cx } from '@/lib/cx/cx';
import { assertTwoLetters, type Initials } from '@/lib/initials/initials';
import { Image } from '../Image/Image';

// ui/Avatar — the reviewer's disc: a picture when the review carries one,
// two capital letters when it does not. Built to the owner-approved contract
// board .claude/plans/avatar-atom.plan.md (fb-432…448, 2026-09-10) out of the
// reviews-carousel breakdown's Avatar dossier; the old repo had no component
// here at all — its review card inlined a 48px <img> beside an `Initials`
// span, two spellings of one idea that drifted apart (the picture wore a
// border, the letters wore a lavender ground).
//
// ── ONE SHAPE, TWO FACES. The disc is the SAME 3rem circle whichever face is
// showing: `avatarDisc` is spelled once and both branches wear it, so a card
// whose reviewer has no photograph lines up pixel-for-pixel with the one next
// to it and the header row never moves when a picture 404s mid-list. That is
// the whole reason this is one atom with a fallback rather than two atoms a
// section chooses between — a chooser at the call site would let the two
// shapes drift the way the old repo's did.
//
// ── WHY THE GREEN GROUND (owner D3). The letters sit on `bg-cta` +
// `text-ink-inverse`, the site's CTA pair, NOT the old site's lavender
// `bg-accent`: in this vocabulary `--accent-decorative` is licensed for large
// display text and graphics at ≥3:1 only (§15.1), and two 16px letters are
// neither. The cta pair is measured — white over #008854 is 4.52:1, the same
// number Button.tsx records for its outline rest face (contrast is symmetric),
// which clears §9's 4.5:1 for normal text with nothing to spare. Read that as
// a fence: this face may not be lightened, and a smaller letter step would
// need a re-measure, not an opinion.
//
// ── THE LETTERS ARE DECORATION (D-A1, §9). The reviewer's name is printed by
// the card two lines below, so a disc that announced it again would make every
// testimonial read its author twice. The letters face therefore carries
// `aria-hidden="true"` and the picture face defaults to the consumer passing
// `alt=""` — the same decision, spelled in the two vocabularies. A consumer
// with a genuinely informative picture still passes a real alt and the type
// takes it. §6.3's typed-required aria-label does not bind here: it binds to
// INTERACTIVE components, and this one never is — no handler, no focus, no
// role. A disc that must be clickable is a GlyphButton/asChild job at the
// section tier, not a mode inside this atom.
//
// ── TIER: THIS COMPOSES ui/Image AND IS STILL AN ATOM (ledger D9, the Modal
// carve-out). /classify-component's import-graph rubric sends a composer to
// sections/ — the carve-out is for generic CHROME that composes only ui/,
// reads no site data (lib/clinic, lib/routes), holds no message key and fills
// no §14 content slot. Modal is the precedent; Avatar matches it on every
// clause: `initials`, `src` and `alt` all arrive finished from the consumer
// (§8.1 — this file never calls t()), and the thing it composes is the ONE
// image wrapper §11 makes mandatory. sections/ReviewCard is the consumer that
// owns the data.
//
// ── TWO BELTS ON "EXACTLY TWO LETTERS", by design (D2 + D-A2). The TYPE
// (`Initials`, from lib/initials) is the one that pays: `initials="AND"` is a
// red squiggle in the owner's own list before anything runs. The RUNTIME throw
// (`assertTwoLetters`, the same module) is the belt under it, for the letters
// that arrive from outside TypeScript's reach — a JSON file, a cast at a data
// seam. It follows the `createClock` precedent in lib/clock/clock.ts: bad
// input dies loudly at the call site instead of rendering a three-letter disc
// that silently overflows its circle. The guard is about COUNT and accepts any
// script and any case on purpose; the type is what asks for capitals, and the
// shouting is CSS's job either way (see `uppercase` below).
//
// ── THE 'use client' COST, paid deliberately (D-A3). This file carries the
// directive because the picture→letters fallback is client STATE: a broken
// image is a per-visitor event, not a build-time fact, so §16's decision rule
// puts it in the browser. The bill is honest and small — ui/Image is already
// an island (next-image-export-optimizer ships its own directive, which is why
// ui/Image itself deliberately has none), and this atom's first consumer, the
// reviews deck, is an island in its entirety. What the directive buys back is
// the invariant above: a dead photo degrades to the letters instead of leaving
// a hole where a face was. Hydration-safe by §16 rule 2 — the build HTML
// always renders the PICTURE branch whenever `src` is given, identically on
// server and client; only a verdict reached AFTER mount flips it: the error
// event, or — for a photograph that had already failed while the script was
// still downloading, which fires no event a late listener can hear — the
// ref's read of the element at commit (`complete` with no pixels; G3 react
// L1, the same idiom next/image uses for a pre-hydration `onLoad`).
// The failure is remembered as the SRC that failed, not as a boolean. The
// reviews deck never re-uses an instance (every slide is keyed by its review
// id), but a future consumer that swaps `src` on one mounted Avatar — a
// picker, a profile editor — would otherwise keep every later picture on the
// letters because one earlier photograph was missing; keying the state by src
// also stops a re-render with the same failed `src` from retrying in a loop.
//
// ── NOTHING TO KEEP IN SYNC WITH ui/disc.ts, and that is a decision (§4's
// sharing table). The two files' first row LOOKS identical — `inline-flex
// shrink-0 items-center justify-center` — but disc.ts is CONTROL-box geometry:
// it ships a focus ring and the shared --fade clock because everything that
// imports it is a button. An Avatar has nothing to focus and nothing to
// animate, so importing that string would hand this atom two behaviours it
// must not have, and the sizes are independent besides (discBox's 2.75/3.5rem
// steps answer §9 touch targets; 3rem here is the old card's photo). The
// values must be free to move apart — no pointers, no KEEP-IN-SYNC pair.
//
// ── WHAT THIS ATOM DOES NOT OWN: no outer margin (§6.4 — the card's own flex
// row owns the gap to the stars), no size axis (v1 ships ONE step, the
// Heading/Eyebrow rule: never invent a step without a measured consumer; a
// second one joins additively with 3rem pinned as the default), no container
// queries (§6.5 — an atom cannot see its container), and no locale awareness
// (§8.1).

// THE VALUE TYPE AND ITS GUARD LIVE IN lib/initials, NOT HERE (board D2, the
// merge-time decision of the reviews-deck run — the same move as
// ui/StarRating ↔ lib/rating): the owner's data list in lib/reviews must mean
// the same two capitals this prop means, an atom may not import lib DATA (§4 —
// atoms are site-agnostic) and the foundation ring may not depend on the
// spine, so the meaning sits one level below both as React-free MECHANICS
// (the lib/scroll-lock precedent). Consumers import `Initials` from
// '@/lib/initials/initials' by full path — no re-export here (the lib-foldering
// law: no barrels).

// The picture and its alt travel TOGETHER or not at all. Modelling them as a
// pair rather than as two optional props is what makes `src` without `alt` —
// a §11 violation — unspellable instead of merely reviewable.
type Picture =
  | {
      /**
       * Under `public/images/` — the folder next-image-export-optimizer scans,
       * so anything outside it silently ships unoptimized (§11, §15.5).
       */
      src: `/images/${string}`;
      /**
       * Finished, already-translated text (§11, §8.1). `''` is the DEFAULT the
       * reviews deck passes and is a decision, not a missing string: the disc
       * repeats a name the card already prints (D-A1).
       */
      alt: string;
    }
  | { src?: never; alt?: never };

type AvatarOwnProps = {
  /**
   * Exactly two letters, e.g. `'AP'` for Andreea Popescu. Enforced twice — by
   * this type at compile time and by a RangeError at render for values that
   * crossed a data seam.
   */
  initials: Initials;
} & Picture;

// Host is a <span>: an inline box that drops into the card's flex row without
// opening a block context. `children` is Omitted — the disc's content IS its
// two faces, and a slot would be a second way to fill a fixed circle (§6.2 is
// about slots replacing MODES, not about every atom taking children).
export type AvatarProps = AvatarOwnProps &
  Omit<ComponentPropsWithRef<'span'>, keyof AvatarOwnProps | 'children'>;

// THE circle, worn by both faces — one spelling, so the two can never drift.
// `size-12` = 3rem = the old card's 48px, in rem so browser zoom scales it
// (§7); `shrink-0` keeps it round in a flex row that runs out of space;
// `overflow-hidden` + `rounded-full` clip the photograph to the circle.
const avatarDisc =
  'inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full';

// The letters face. `uppercase` is a CLASS, never a toUpperCase() call — the
// ui/Eyebrow invariant, and it matters more here: Romanian Ș/Ț have their own
// comma-below capitals (U+0218/U+021A) and case mapping is the browser's job,
// not JavaScript's (the Turkish dotted-i is the classic burn). `select-none`
// keeps a drag across the card from selecting two letters that are not text.
const avatarLetters =
  'bg-cta text-base font-semibold text-ink-inverse uppercase select-none';

// The photograph. `size-full` fills the circle the host already measured;
// `object-cover` crops the overflow instead of distorting a face;
// `rounded-full` re-rounds the img itself so the 1px ring follows the circle
// rather than a square hidden under it. The ring is on the PICTURE only
// (owner D-A4, the old site's split): it separates a light photo edge from a
// light card, which a solid green disc does not need.
const avatarPicture =
  'size-full rounded-full border border-line-subtle object-cover';

export function Avatar({
  initials,
  src,
  alt,
  className,
  ...rest
}: AvatarProps): ReactElement {
  // The hook runs FIRST, unconditionally, before the guard below can throw —
  // rules of hooks, and the throw is a render-time crash either way.
  const [failedSrc, setFailedSrc] = useState<string>();

  // COUNT, not case and not script — `assertTwoLetters` (lib/initials) accepts
  // any two Unicode letters, so Ș, Ä and a lowercase pair all pass the belt;
  // asking for capitals is the type's job, and the shared guard is the same
  // one lib/reviews' integrity test runs over the owner's list.
  assertTwoLetters(initials, 'Avatar');

  // ONE named condition rather than two inline checks, and the name is
  // load-bearing: TypeScript narrows an ALIASED const through the ternary
  // below, and with `src` it narrows the DEPENDENT `alt` too — which is why
  // the picture branch passes `alt={alt}` with no cast and no `?? ''`
  // papering over a hole the union already closed. Inline the condition and
  // both narrowings are lost.
  const showsPicture = src !== undefined && src !== failedSrc;

  return (
    <span
      // §6.8 merge order: the atom's own classes first, the caller's className
      // LAST. A deterministic convention the tests pin, NOT a cascade
      // mechanism — attribute order never decides CSS specificity, and §6.8
      // limits caller utilities to positioning/spacing, so the disc's own
      // geometry is never up for renegotiation from outside.
      className={cx(avatarDisc, !showsPicture && avatarLetters, className)}
      // Only the LETTERS face is decoration (D-A1). The picture face stays
      // visible to assistive tech so that a consumer who passes a real alt is
      // heard; a decorative picture removes itself through `alt=""` instead,
      // one layer down where the a11y contract for images lives.
      // Before the spread on purpose: a consumer with a stranger case may
      // still say otherwise (§6.8 native fidelity).
      aria-hidden={showsPicture ? undefined : true}
      {...rest}
    >
      {showsPicture ? (
        <Image
          variant="plain"
          src={src}
          alt={alt}
          // The intrinsic box in CSS pixels — 3rem at the browser's default
          // root size. It reserves the space (§11, zero layout shift) and
          // tells the optimizer which width variants to bake into the srcset;
          // `sizes` then tells the browser the box never grows, so it may
          // download the small file instead of assuming 100vw (§10.6).
          width={48}
          height={48}
          sizes="3rem"
          className={avatarPicture}
          // D-A3, the fallback: a dead photograph becomes the letters. The
          // handler reaches the real <img> — ui/Image passes it to
          // ExportedImage, which wraps it and calls it on the FIRST error
          // (next-image-export-optimizer's own unoptimized retry starts on
          // that same event, and this swap pre-empts it: on the built site the
          // optimized variants always exist, so a first error means the file
          // itself is gone).
          onError={() => setFailedSrc(src)}
          // The second belt (G3 react L1): a photograph that failed BEFORE the
          // handler above existed never fires `error` again, so the ref reads
          // the verdict the browser already reached — a COMPLETE image with
          // no pixels is a dead one. Commit-phase state, the pre-hydration
          // idiom next/image itself uses for `onLoad`; ui/Image hands the ref
          // to the real <img>.
          ref={(img) => {
            if (img?.complete && img.naturalWidth === 0) setFailedSrc(src);
          }}
        />
      ) : (
        initials
      )}
    </span>
  );
}
