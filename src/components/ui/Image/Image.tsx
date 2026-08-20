import ExportedImage from 'next-image-export-optimizer';
import type { ComponentPropsWithRef, ReactElement } from 'react';

// THE single image wrapper (§11) — every image on the site goes through here.
// Bakes in next-image-export-optimizer (owner decision 2026-08-01, §15.5):
// build-time WebP width variants with srcset in the static HTML. width/height
// (or `fill`) reserve the box — zero layout shift (§11). Layer precision
// (G2 ts M2): the TYPES require only `alt`; width/height are optional in the
// type BECAUSE `fill` is the alternative shape, and are enforced at RUNTIME by
// next/image (loud throw on first render). Sections treat them as
// mandatory-unless-fill;
// lazy below the fold by default — pass `preload` for the hero (LCP, §10.6;
// Next 16's name — `priority` survives only as its deprecated alias).
//
// v2 adds ONE axis, `variant` (contract board image-variants-contract-v2,
// owner-approved 2026-08-20): three named SITUATIONS, not CSS knobs. D1 — one
// atom, one axis: the three situations share ~95% of the contract (the
// optimizer pipeline, required alt + width/height-or-fill, lazy/preload,
// className/ref fidelity) and differ by exactly one class-string row each, so the difference
// is a lookup table — the shape of Text's tone map — never a component
// boundary. Splitting into FramedImage/ArtworkImage would triple the public
// API for a styling delta and turn §11's "one wrapper" from a fact of the
// import graph into a convention to police (board §5).
// The honest split threshold, on record: the day a mode grows BEHAVIOUR (the
// deferred gray-out overlay with state, click-to-load, carousel logic) that is
// a SECTION composing Image, never a fork of this atom.
//
// CLIENT-ISLAND BOUNDARY — deliberately no 'use client' in this file, and the
// omission is the strictly BETTER choice, not a neutral one: ExportedImage
// ships its own directive at line 1 of its bundle (it needs client state for
// the error fallback), so the boundary already sits one module deeper — while
// a directive HERE would drag the variant lookup + cx into the client bundle
// instead of letting them resolve at render time on the server (G2 react NIT). Consequence to keep in mind at
// call sites: every <Image> costs a small JS island on the visitor's device,
// so zero-JS corners keep using a plain <img> — the Footer's ANPC badge
// precedent (fb-83), unchanged by this rework (board §2).
//
// §8.1: locale-agnostic. `alt` is finished, already-translated content handed
// down by the section (§11) — this atom never calls t().

export type ImageVariant = 'plain' | 'framed' | 'artwork';

type ImageOwnProps = {
  /**
   * Presentation preset. plain = the untouched optimizer pass-through
   * (parent owns all geometry) · framed = the photo-object: fills its box,
   * crops overflow, rounded-xl corners · artwork = whole image always
   * visible, never upscaled, no background, no blur placeholder.
   * @default 'plain'
   */
  variant?: ImageVariant;
};

// House Omit shape (Text/Heading precedent). Today the Omit is zero-width —
// `variant` exists nowhere on the underlying side (not in ImgHTMLAttributes,
// next's ImageProps, or ExportedImageProps; G2-verified) — it exists so that
// IF an upstream ever ships its own `variant`, this atom's prop SHADOWS it
// visibly here instead of silently intersecting at every call site
// (G2 ts M1 + react NIT, 2026-08-20).
export type ImageProps = ImageOwnProps &
  Omit<ComponentPropsWithRef<typeof ExportedImage>, keyof ImageOwnProps>;

// D2 — framed geometry is `h-full w-full object-cover`, and the CSS fact doing
// the work is that a percentage height against an auto-height parent resolves
// to auto: in a fluid column the photo renders at its NATURAL ratio, while in
// a fixed-ratio cell (aspect-square, a grid row) the very same classes make it
// fill and crop. object-cover = cover the box, crop the overflow, never
// distort. One recipe, both doctor-card shapes. Grid consumers: pass `sizes`
// (e.g. "(min-width: 768px) 50vw, 100vw") — without it the browser assumes
// 100vw and over-downloads, a §10.6 LCP/CWV concern (G2 a11y A5).
// D3 — the radius is INTERNAL to framed and fixed at rounded-xl = 12px (owner
// "agree", fb-195): more than the Header pill's 8px, and the exact step the
// old doctor-card chose for the same photo-in-card job. The direct input the
// owner asked for (fb-193/fb-196) IS `variant="framed"` — one prop, radius
// included, nothing to configure at the call site. A `radius` PROP stays out:
// an axis with one value and no consumer asking for a second is speculative
// API (§6.6); it joins additively the day DoctorCard or a gallery demands a
// different step. Same reasoning keeps `ratio` out (D6) — the parent owns the
// cell.
// D4 — artwork is `h-auto max-w-full object-contain`: max-w-full shrinks below
// intrinsic size but never stretches a raster past it (blurry logos banned by
// construction), and contain letterboxes instead of cropping when a parent
// constrains both axes. The first two RESTATE what Tailwind's Preflight
// already gives every <img>, deliberately: a variant's promise must hold as
// its own utilities, never by borrowing a global reset that a future base
// layer could change under it (§6.1 closed system). Its placeholder half lives
// in the map below.
// D5 — plain contributes NOTHING, pinned forever as the default: the future
// Hero section owns 100% of its geometry (fill + sibling overlays), and union
// growth must never restyle an existing call site (§6.6 silent-break guard).
const variantClasses: Record<ImageVariant, string> = {
  plain: '',
  framed: 'h-full w-full rounded-xl object-cover',
  artwork: 'h-auto max-w-full object-contain',
};

// D4, second half — blur under transparency would flash a smeared ghost
// rectangle exactly where a logo's ground must stay empty, so artwork opts out
// per-image via the optimizer's documented escape hatch. plain and framed
// carry `undefined`, which is NOT the same as 'empty': it means this atom says
// nothing and the repo-wide blur default (ExportedImage's own
// `placeholder = "blur"`) applies untouched.
const placeholderDefaults: Record<ImageVariant, ImageProps['placeholder']> = {
  plain: undefined,
  framed: undefined,
  artwork: 'empty',
};

const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(' ');

export function Image({
  variant = 'plain',
  className,
  placeholder,
  ...rest
}: ImageProps): ReactElement {
  return (
    <ExportedImage
      {...rest}
      // §6.8 merge order: the atom's own classes first, the caller's
      // className appended last — a deterministic merge CONVENTION, not a
      // cascade promise: attribute order never decides CSS conflicts (the
      // compiled stylesheet's emission order does), and §6.8 sanctions caller
      // className for positioning/spacing only, never for out-styling a
      // variant's internals — a consumer needing different geometry takes
      // variant="plain" and owns it (G2 react MEDIUM, 2026-08-20). No outer
      // margin is ever added here — the parent owns spacing (§6.4).
      // `|| undefined` is the pass-through-purity guard for `plain`: an empty
      // class="" is still an attribute the parent has to reason about, so a
      // bare <Image> must reach the DOM byte-exactly as the 14-line
      // pass-through this rework replaces.
      className={cx(variantClasses[variant], className) || undefined}
      // The variant sets a DEFAULT, never a policy the caller cannot leave:
      // an explicit `placeholder` always wins (§6.8 native fidelity). Passing
      // `undefined` on through is identical to omitting the prop — it is what
      // triggers ExportedImage's own destructuring default.
      placeholder={placeholder ?? placeholderDefaults[variant]}
    />
  );
}
