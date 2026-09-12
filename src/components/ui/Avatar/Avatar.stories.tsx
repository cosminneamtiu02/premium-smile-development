import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Avatar } from './Avatar';

// FOUR stories, and the count is the honest one: the two faces, the diacritics
// the Romanian and German fixtures actually carry, and the failure that turns
// one face into the other. The export NAMES are load-bearing — each names a
// baseline file (`ui-avatar--letters`, `ui-avatar--picture`,
// `ui-avatar--diacritics`, `ui-avatar--broken-picture`) — so this list IS the
// atom's contribution to the lane's visual manifest, exactly as the dossier
// declares it.
//
// `Letters` is the DEFAULT frame in §13's sense: it is the first export, it
// carries the live controls, and it shows the face this atom exists for (most
// Romanian reviews arrive without a photograph). It is named for what it shows
// rather than `Default`, because this atom's two faces are equals — neither is
// a fallback for the other in the layout, only in the data.
//
// ── NO 'stress-320' TAG ON ANY FRAME, deliberately: `UI/*` routes to the 1280
// project (§13), and the accessibility width is an opt-in for atoms whose
// LAYOUT has something to say there. A 3rem disc has none — it is a fixed,
// `shrink-0` circle with no text to wrap and no track to collapse; what must
// survive 320px is the CARD around it, so that opt-in belongs to
// sections/ReviewCard's stories.
//
// ── NO PseudoLocale FRAME either — the ui/Card and ui/Container precedent for
// the same reason: this component renders no translated string and reads no
// message key (§8.1 — `initials` and `alt` arrive finished). Flip the locale
// toolbar to Pseudo and nothing here may change; that is the §8.9 sweep
// passing, not a gap.
//
// Demo values are Romanian with diacritics (§15.7) and are people, not lorem:
// Andreea Popescu and Ștefan Toma are the dossier's reviewer fixtures. The
// photograph is the committed clinic-interior demo asset, standing in until
// real reviewer portraits arrive through the owner's §11 photographs gate; the
// alt copy is factual — no superlatives, no promotions, no result guarantees
// (CMSR advertising rules for dental practices, in force since 2025-07-01).

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  args: {
    initials: 'AP',
  },
  argTypes: {
    initials: {
      control: 'text',
      description:
        'Exactly two capitals, the reviewer’s own — never derived from a name. Guarded twice: the `Initials` type (26 Latin caps + Ă Â Î Ș Ț · Ä Ö Ü · É È Ê À Ç · Ì Ò Ù) refuses a third letter, a digit or lowercase at compile time, and a RangeError refuses them at render for values that crossed a data seam. Type three letters into this control to watch the second belt fire.',
    },
    src: {
      control: 'text',
      description:
        'Optional photograph, path under `public/images/` — the folder next-image-export-optimizer scans (§11, §15.5). Travels WITH `alt` or not at all: the pair is one prop in the types, so a picture without its alt cannot be spelled. Clear it to see the letters face.',
    },
    alt: {
      control: 'text',
      description:
        'Finished, already-translated text (§11, §8.1). The EMPTY string is the deck’s default and a decision, not a missing string (D-A1): the card prints the reviewer’s name two lines below, so a named picture would announce the person twice.',
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The letters face — the one most Romanian reviews will actually wear.
 * `bg-cta` + `text-ink-inverse` is the site's CTA pair (owner D3), measured at
 * 4.52:1 for white on `#008854`, which clears §9's 4.5:1 for normal text with
 * nothing to spare; the old site's lavender ground is gone because
 * `--accent-decorative` is licensed for ≥3:1 display text and graphics only
 * (§15.1), and two 16px letters are neither.
 *
 * Type lowercase into the `initials` control and watch it still render
 * uppercase: the shouting is `text-transform`, never a `toUpperCase()` call,
 * so the browser owns the Ș/Ț case mapping (ui/Eyebrow's invariant, and it
 * matters more here — the comma-below capitals U+0218/U+021A are the ones a
 * visitor sees). Type three letters and the RangeError belt fires in the
 * canvas: that is the runtime half of the contract doing its job, not a
 * broken story.
 */
export const Letters: Story = {};

/**
 * The picture face, in the shape the reviews deck will hand over: `alt=""`,
 * i.e. decorative (D-A1). The disc is the SAME 3rem circle as the letters
 * frame above — `overflow-hidden` + `rounded-full` clip the photograph,
 * `object-cover` crops it instead of distorting a face — which is the whole
 * reason this is one atom rather than two: a card whose reviewer has no photo
 * lines up pixel-for-pixel with the one beside it.
 *
 * The 1px `line-subtle` ring is on the PICTURE only (owner D-A4, the old
 * site's split): it separates a light photo edge from a light card, which a
 * solid green disc does not need.
 */
export const Picture: Story = {
  args: {
    src: '/images/demo/hero-calm.jpg',
    alt: '',
  },
};

/**
 * The five-locale alphabet on the face that has to draw it: Romanian
 * comma-below Ș Ț (U+0218/U+021A — Ștefan Toma) beside German Ä Ö. Both pairs
 * are members of the `Initials` union, both are uppercased by CSS rather than
 * by JavaScript, and both must sit optically centred in the same circle — a
 * subset that dropped the comma-below forms would show here as a fallback
 * glyph or a cedilla, in the one frame that looks for it.
 *
 * The row's gap belongs to this wrapper, never to the atom (§6.4).
 */
export const Diacritics: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar initials="ȘT" />
      <Avatar initials="ÄÖ" />
    </div>
  ),
};

/**
 * A photograph that does not exist, which is the point (D-A3): the atom must
 * degrade to the letters rather than leave a hole where a face was. What this
 * frame photographs is the END of the fallback chain, and the chain is worth
 * knowing when reading it:
 *
 * 1. `ui/Image` asks the optimizer's loader for
 *    `/images/reviews/nextImageExportOptimizer/missing-opt-<w>.WEBP`. The
 *    built Storybook runs `next-image-export-optimizer` first, but it only
 *    generates variants for files that EXIST — there is no
 *    `public/images/reviews/missing.jpg` — so that URL 404s.
 * 2. The `<img>` fires `error`; next/image's own handler passes it to
 *    ExportedImage, which does two things on that FIRST failure: it flips its
 *    loader to the unoptimized original (`/images/reviews/missing.jpg`, which
 *    would 404 too) and it calls the `onError` this atom supplied.
 * 3. This atom's handler wins the race by unmounting the picture: the retry
 *    never paints, and the disc settles on the letters — one state change,
 *    then stillness, which is what makes this frame safe to photograph.
 *
 * Consequence worth carrying to the section lane: on the BUILT site the
 * optimized variants always exist, so a first error means the file itself is
 * gone. In `storybook dev` (no optimizer pass) every picture takes that same
 * first error, so the Picture frame above shows its letters there — the built
 * Storybook, which is what the visual net photographs, shows the photograph.
 */
export const BrokenPicture: Story = {
  args: {
    initials: 'ȘT',
    src: '/images/reviews/missing.jpg',
    alt: '',
  },
};
