import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Image } from './Image';

// One story per meaningful state (§13), six in total — they are also the
// declared visual manifest for this lane (contract board
// image-variants-contract-v2 §4, owner-approved 2026-08-20), so the export
// NAMES are load-bearing: renaming one renames its baseline file.
// Two stories carry the 'stress-320' tag so the visual net also samples them
// at the 320px accessibility width (§13 UI-tier opt-in) — the two that own
// fluid geometry. No DE/pseudo-locale stress variants here, a deliberate
// deviation from the Text/Heading pattern: this atom renders no text, so its
// only locale surface is the `alt` string, exercised in the tests and the axe
// gate rather than by layout.
// Alts are Romanian with diacritics (§15.7) and factual only — no
// superlatives, no promotions, no result guarantees (CMSR advertising rules
// for dental practices, in force since 2025-07-01).
//
// WHAT THESE STORIES PHOTOGRAPH (board §2, the D8 discovery): the built
// Storybook now runs the optimizer first, so the srcset URLs resolve and the
// net sees the REAL pipeline instead of ExportedImage's error fallback. In
// `storybook dev` the component's documented dev fallback serves the originals
// — nothing to configure, and no story should chase optimized variants itself.

// The alts live OUTSIDE the fixture objects on purpose: eslint-config-next
// maps <Image> to img for jsx-a11y/alt-text, and a spread does not satisfy it
// — the alt has to be readable at the JSX call site. Exactly the right
// enforcement for this atom, so it is honoured rather than disabled, and the
// render functions below destructure `alt` back out instead of duplicating it.

// The standing photo fixture: a clinic-interior photograph, 4:3 — the shape
// the future Hero and DoctorCard actually hand over.
const HERO = {
  src: 'images/demo/hero-calm.jpg',
  width: 1600,
  height: 1200,
};
const HERO_ALT = 'Cabinet stomatologic modern, luminos';

// The transparent-PNG fixture: stand-in for the Publio logo until the real
// vectorized file lands (§15.6). Everything the `artwork` variant promises is
// visible on it — whole image, no crop, and no ground painted behind the
// transparent pixels.
const CAT = {
  src: 'images/demo/transparent-artwork-cat.png',
  width: 847,
  height: 567,
};
const CAT_ALT = 'Ilustrație demonstrativă: pisică pe fundal transparent';

const meta = {
  title: 'UI/Image',
  component: Image,
  args: {
    ...HERO,
    alt: HERO_ALT,
    variant: 'plain',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['plain', 'framed', 'artwork'],
      description:
        'Presentation preset — a situation, not a CSS knob (D1). plain (default, pinned by D5) = zero classes of the atom’s own, the parent owns all geometry · framed = h-full w-full object-cover + the fixed rounded-xl 12px radius (D2/D3, fb-195) · artwork = h-auto max-w-full object-contain + placeholder="empty" (D4)',
    },
    alt: {
      control: 'text',
      description:
        'Required by the underlying types (D7, §6.3): translated content the section passes down (§11). Empty string ONLY for decorative images — see ArtworkDecorative',
    },
    src: {
      control: 'text',
      description:
        'Path under public/ — the optimizer generates the WebP width variants and bakes the srcset in at build time (§11, §15.5)',
    },
    preload: {
      control: 'boolean',
      description:
        'Eager + high fetch priority (Next 16 name; `priority` is its deprecated alias). Reserved for the LCP element (the hero), never for below-the-fold images (§10.6)',
    },
    placeholder: {
      control: 'select',
      options: ['blur', 'empty'],
      description:
        'Repo-wide default is the optimizer’s blur. `artwork` defaults to "empty" instead, and an explicit value here always wins over the variant default (D4, §6.8)',
    },
  },
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The pass-through at rest (D5): `plain` adds NOT ONE class, so what you see is
 * an `<img>` carrying its intrinsic width/height — the reserved space that
 * makes zero layout shift possible (§11). Read the scaling honestly: the photo
 * is 1600px wide and does not overflow the canvas because Tailwind's Preflight
 * resets every `img` to `max-width: 100%; height: auto`, i.e. the RESET makes
 * plain fluid-safe, not the atom. Flip the `variant` control to compare the
 * three presets on the same photo.
 */
export const Default: Story = {};

/**
 * `framed` in a FLUID column — the doctor-card shape on a phone, and half the
 * proof of D2: `h-full` resolves against an auto-height parent, so it becomes
 * `auto` and the photo keeps its natural 4:3 ratio while `w-full` makes it
 * follow the column. The 12px `rounded-xl` corners are the fixed radius that
 * arrives WITH the variant — more than the Header pill's 8px (fb-195), and not
 * a prop to configure (D3).
 * Tagged 'stress-320': at the accessibility width the column is the whole
 * screen, and nothing may overflow it (§7, §9).
 */
export const Framed: Story = {
  tags: ['stress-320'],
  args: { variant: 'framed' },
  render: ({ alt, ...args }) => (
    <div className="max-w-md">
      <Image {...args} alt={alt} />
    </div>
  ),
};

/**
 * The same `framed` recipe, unchanged, in a FIXED-ratio cell — the other half
 * of D2 and the exact geometry the future DoctorCard grid will hand over. The
 * parent says `aspect-square`; `object-cover` fills it, crops the overflow and
 * never distorts the face. One recipe serves both card shapes, which is why
 * `ratio` is not a prop either (D6): the cell belongs to the parent.
 * Note what is NOT needed: no `overflow-hidden` wrapper. The photo is itself
 * the rounded object, so the radius clips the image, not a box around it.
 * Boundary (G2 a11y L1): framed's crop is for photography where any slice
 * represents the whole — portraits, interiors. An image whose full extent is
 * informative (a radiograph, an annotated diagram) takes `artwork`
 * (letterboxes, never crops) or a cell matched to its ratio, because a crop
 * would discard information no alt text can be audited to cover (WCAG 1.1.1).
 */
export const FramedCoverCrop: Story = {
  args: { variant: 'framed' },
  render: ({ alt, ...args }) => (
    <div className="aspect-square max-w-xs">
      <Image {...args} alt={alt} />
    </div>
  ),
};

/**
 * Hero-ready proof, and the reason `plain` must stay unopinionated (board §2):
 * native `fill` + `sizes="100vw"` + `preload` (the LCP element, §10.6) inside
 * a fixed-height stage the SECTION owns. `fill` drops width/height and pins the
 * image to the stage's edges, so the caller supplies the fit — here
 * `object-cover` through `className`, which is exactly the §6.8 seam: the
 * parent positions the atom, it never restyles its internals.
 * The future Hero's gray-out stays a sibling overlay over this image, never a
 * mode inside it — the overlay variant is deliberately deferred (§6 of the
 * board).
 */
export const PlainFullBleed: Story = {
  render: () => (
    <div className="relative h-96 overflow-hidden">
      <Image
        src={HERO.src}
        alt={HERO_ALT}
        fill
        sizes="100vw"
        preload
        className="object-cover"
      />
    </div>
  ),
};

/**
 * `artwork` over two different grounds — the D4 proof that matters for a logo:
 * the atom paints NO background of its own, so the page ground shows through
 * the transparent pixels on the left and the surface ground on the right. If a
 * blur placeholder were left on (the repo-wide default), a smeared ghost
 * rectangle would flash in exactly that empty space, which is why `artwork`
 * opts out per-image instead.
 * `max-w-full` shrinks the illustration to each column and never upscales it
 * past its intrinsic 847px — blurry logos are banned by construction.
 * Tagged 'stress-320': two columns at the accessibility width is the real
 * squeeze, and nothing may overflow (§7, §9).
 */
export const ArtworkTransparent: Story = {
  tags: ['stress-320'],
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-page p-4">
        <Image {...CAT} alt={CAT_ALT} variant="artwork" />
      </div>
      <div className="border border-line-subtle bg-surface p-4">
        <Image {...CAT} alt={CAT_ALT} variant="artwork" />
      </div>
    </div>
  ),
};

/**
 * The decorative case, spelled out because it is the one place an empty `alt`
 * is CORRECT rather than a missing string: this illustration carries no
 * information the surrounding copy does not already give, so `alt=""` marks it
 * as presentational and assistive tech skips it entirely (D7, §9). The atom
 * still applies the full `artwork` recipe — decorative is not unstyled.
 * When the real Publio logo replaces this fixture (§15.6) it gets the opposite
 * treatment: a REAL alt naming the clinic, because a brand mark that is the
 * only thing identifying the page is content, not decoration.
 */
export const ArtworkDecorative: Story = {
  args: { ...CAT, variant: 'artwork', alt: '' },
};
