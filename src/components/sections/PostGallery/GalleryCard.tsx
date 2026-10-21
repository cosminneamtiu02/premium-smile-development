import type { ReactElement } from 'react';
import { Image } from '@/components/ui/Image/Image';
import type { ImagePath } from '@/lib/image-path/image-path';

// sections/PostGallery/GalleryCard — ONE card of the blog article's photo
// gallery: a photograph filling a 3:4 portrait card under the soft corner,
// a soft drop shadow, and the card's caption over the photo's bottom-left
// behind a small white dot. The owner asked for the carousel in the
// placeholder's place (2026-10-14, verbatim: "for: Galeria foto vine în curând
// — place that caroussell") and, of what the carousel holds: "not to hold pure
// image, alwas hold a card and i'll decide later on card". So THIS CARD IS
// PROVISIONAL: the look his screenshot showed, made real, until he decides
// the card.
//
// ── KEEP IN SYNC with sections/CardCarousel's demo card (`PhotoCard` in
// CardCarousel.stories.tsx, its THE DEMO CARD IS A STAND-IN): the same figure,
// the same caption, the same dot, the same photo — the workbench shows the
// carousel the way the article does. PostGallery.test.tsx reads that file and
// fails the day the two recipes part. FOUR CHOICES OF THIS CARD'S OWN, which
// the demo took too — the first three on 2026-10-15, the fourth on 2026-10-16
// — so the two are equal token for token and the pin holds them so. THE
// FIRST: the caption's fade is 16 theme steps, `var(--spacing)*16`, never the
// first demo's `4rem`. At the default root the two are the same 64px, so the
// pictures match; but the article wears THE BAND SCALE (CLAUDE.md §15.32),
// which redraws every theme step in the page's design pixel and leaves a rem
// literal alone. The caption's top padding, `pt-17`, is a theme step — 68
// design pixels — so with a 4rem fade, wherever the design pixel is under
// 64/68 ≈ 0.94 (laptop windows from the scale's step, ≈1120px, to ≈1300px)
// the first line of words would start INSIDE the fade, on a scrim lighter than
// the one their contrast is worked out on (below). In the theme's step the
// fade and the padding scale together, and the words stay one step — a
// quarter rem at the default root — below the fade at every scale. THE
// SECOND: the caption wears `wrap-anywhere`, the belt for a word wider than
// its whole line. The caption never hyphenates (`hyphens-none`, the
// short-label rule), and the card can be narrow — 155.8px at §7's 320 window
// behind a classic scrollbar — so under SC 1.4.12's text spacing (0.12em
// between letters) a long word runs past its line and the card's
// `overflow-hidden` would cut its end off: „Instrumentele", 107.5px at the
// narrow step's 16px (MEASURED, the real face), sets 132.4px with that
// spacing — its 13 letters 1.92px wider each — against the 115.8px line that
// card draws (THE CAPTION NEVER SPLITS A WORD, below).
// The belt breaks only such a word, after the spaces have had their chance; at
// ordinary spacing it breaks nothing — every caption word the articles ship
// fits its line, measured. THE THIRD: THE NARROW STEP — the figure is its
// caption's query container at the caption's own size (`@container
// text-lg`), and under 10 of those ems the caption takes the narrow step,
// 16px words and 12px a side (THE CAPTION NEVER SPLITS A WORD — the two
// tokens are spelled there whole, as the caption wears them: a bare utility
// in a comment ships a rule nothing wears). THE FOURTH: THE DOT STEP — under
// 8.5 of the same ems the dot is not drawn (THE CAPTION NEVER SPLITS A WORD).
// The demo took all four, pixel for pixel identical in its stories — its 320
// window's card no longer cuts „Instrumentele" either.
//
// ── THE CAPTION NEVER SPLITS A WORD (2026-10-15, found by the German
// translation; its second step 2026-10-16, found by the wheel). A caption is
// this card's title, and the owner's rule for a card's title is that it never
// splits a word (PostCard's THE TITLE NEVER SPLITS A WORD): with hyphenation
// off, only the belt can break one — at any letter, with no hyphen — so every
// word a caption ships must fit its line. It did not. The line is the card
// less 2 × 16px of padding, the 8px dot and its 8px gap: 116.4px on a 320
// phone (a 164.4px card), 107.8 behind a classic scrollbar (155.8) — and
// MEASURED (Chromium, the real face, 18px at weight 500) the Romanian
// „Instrumentele" sets 118.5px and the German „Wartezimmer" 114.2: the belt
// cut the first on both cards and the second on the narrower. THE NARROW STEP
// is the fix: on a card under 10 of its caption's ems — 180px at the default
// root — the caption takes the next step down, 16px words and 12px a side
// (`@max-[10em]:text-base` and `@max-[10em]:px-3`), its line the card less
// 40px. Two levers together, because neither alone left room: 16px words on
// the old padding left „Instrumentele" (107.5px) 0.3px on the three-card
// window's narrowest line, and 18px words would have needed the padding down
// to 8px a side. THE QUERY READS THE CARD'S OWN EM — CSS evaluates a
// container query's `em` against the container's font, which is why the
// figure wears the caption's step — and not a rem, because the article wears
// THE BAND SCALE (§15.32): there the card, the caption and its ems are all
// design pixels, so each threshold moves with the scale, where a rem one
// would sit still in CSS pixels and put a scaled card on a step its words
// were never measured on (WHY THE EM, below). A larger default font moves
// the thresholds with the words.
// THE DOT STEP (2026-10-16). The wheel — sections/CardCarousel's five-card
// window that day — showed THREE cards on phones on its own narrower window,
// a 137.0px card behind a classic scrollbar, and on the narrow step's line,
// the card less 40px, the belt cut „Instrumentele" (107.5px at 16px),
// „Zahnarztstuhl" (105.4), „Wartezimmer" (103.7), „odontoiatrica" (101.5) and
// „Arbeitsfläche" (99.9). THE DOT STEP is the fix: on a card under 8.5 of its
// caption's ems — 153px at the default root — the decorative dot is not drawn
// (`@max-[8.5em]:hidden` on the dot, read against the same container), and
// the flex gap after it goes with it: the words keep their 16px — the site's
// older readers read them — and take the dot's room, a line of the card less
// 24px.
// THE LINE ALONE (2026-10-17). The wheel and then the ring left the carousel,
// and the five-card window left the article (the owner: "the fiver option …
// do not represent it in the article, represent it on home page"), so an
// article's gallery is the three-card window on the line, 1.7521 card widths
// to the stage: a 320 phone's card is 164.4px and the one behind a classic
// scrollbar 155.8 — 8.66 of its ems, 2.8px over the threshold — and from §7's
// 320 up, at the default root, every card keeps its dot. THE STEP STAYS, for
// its threshold is the caption's own ems and the card is not: the card is a
// share of the column, and the column gives up only its two 1rem gutters as
// the default font grows. At an 18px default font a 320 phone's column is
// 284px and its card 162.1px — 8.0 of its 20.25px ems, on the dot step —
// whose dotless line, 135.1px, holds „Instrumentele" at 18px (118.5px) where
// the dotted one, 117.1, would not (PostGallery.captions.test.tsx shows it).
// At the default root the step is reached under §7's floor — on a window
// under ≈300px (≈315 behind a scrollbar) — and needed under ≈290 (≈305),
// where the dotted line falls under „Instrumentele": the 280px cover screen
// of a Galaxy Fold among them, a 141.5px card and a 117.5px dotless line.
// WHY 8.5, STILL: the dotted line holds „Instrumentele" on a card down to
// 147.5px, so the dot may come back anywhere from 8.2 ems up; at 8.5 — 153px
// — the dotted line is 113px, 5.5 over the word, and about 4.5 on CI's Linux,
// which sets the face about 1 % wider; and a threshold at 9 — 162px — would
// drop the dot from §7's narrowest card, 155.8px, and sit 2.4px under a 320
// phone's 164.4, the dot coming and going with a few pixels of measure there.
// WHY THE EM, today: inside THE BAND SCALE the three-card card is 320 design
// pixels at every width — 17.8 of its ems, far over both thresholds — so
// today the em decides no card the gallery draws there; it keeps every step
// in the caption's own unit, so a smaller scaled card (another window, another
// measure) could never sit on a step its words were not measured on: at the
// scale's step, s = 896 / 1106, a rem threshold reads 180 CSS px where 10 of
// the card's ems are 145.8.
// WHERE THE LINES ARE NARROWEST, MEASURED (the same face;
// PostGallery.captions.test.tsx holds every caption word of every article, in
// all five languages, to these lines, and lays every caption out on the cards
// between them finding no word on two lines):
//   · THE NARROW STEP's narrowest line from §7's 320 up: §7's narrowest window
//     behind a classic scrollbar, a 273px measure (320 less the 15px bar less
//     ui/Container's 1rem a side), a 155.8px card — 115.8px: „Instrumentele"
//     107.5, „Zahnarztstuhl" 105.4, „Wartezimmer" 103.7, „odontoiatrica"
//     101.5, „Arbeitsfläche" 99.9 (a 124.4px line on a 320 phone, a 164.4px
//     card). Its narrowest at ANY root is its own threshold, a card of exactly
//     8.5em — 113px — which a ≈300px window draws (≈315 behind a scrollbar),
//     as do a zoomed phone and a larger default font;
//   · THE DOT STEP: no card from §7's 320 up at the default root (above); a
//     hair under its threshold its line is 128.5px;
//   · THE CAPTION STEP's narrowest line: the threshold itself, a 180px card,
//     which phones draw at ≈350px (≈367 behind a scrollbar) — 132px:
//     „Instrumentele" 118.5, „Zahnarztstuhl" 115.8, „Wartezimmer" 114.2,
//     „odontoiatrica" 111.6, „Arbeitsfläche" 110.0 (a 360 phone's card is
//     184.9px, a 136.9px line);
//   · INSIDE THE BAND SCALE: the card is 320 design pixels at every width — the
//     CAPTION step with its dot, a 272-design-pixel line — so the narrowest is
//     the scale's step, s = 896 / 1106: a 259.2px card, 14.6px words, a
//     220.4px line.
// The tightest margin is 5.5px (5.1 %) — „Instrumentele" on the narrow step's
// own threshold — then 8.3px (7.8 %) behind §7's scrollbar and 13.5px
// (11.4 %) at the caption step's threshold — measured on macOS; CI's Linux
// sets the face about 1 % wider (PostCard's THE MARGIN IS THE MAC'S), well
// inside all of them, and the measured test is the gate either way: its red
// names the word and its width.
// THE PRICE: on a card under 180px the caption reads 16px, not 18 — on phones
// from 320 to ≈350px (≈367 behind a classic scrollbar). On a card under 153px
// the dot is gone too — at the default root only under §7's 320, and at a
// larger default font (THE DOT STEP). Every other card is what it was. An
// engine without container queries (Safari before 16, Chrome before 105)
// keeps the 18px caption and its dot everywhere, the belt cutting the word as
// before.
//
// ── THE CAPTION'S CONTRAST (§9, SC 1.4.3; the demo's own arithmetic): the
// caption box is ONE gradient — the site's locked 0.55-black `--scrim` (§15.1),
// solid from the bottom up to 16 steps under the box's top and fading out over
// those 16 steps into the photograph — and the words begin a step BELOW the
// fade (`pt-17`), so not a letter sits on anything lighter than the solid
// scrim. The brightest pixel a photograph can put under them is white under
// 0.55 black, rgb(115 115 115), and white words — 18px, or 16px on the narrow
// step, normal text either way — read 4.74:1 there, on any photo. ONE
// gradient and not a solid box under a separate fade: two boxes meeting at a
// transformed card's fractional edge drew a light hairline in WebKit (the
// demo's lane saw it). The caption never splits a word at a syllable
// (`hyphens-none`, the short-label rule) and breaks one only when it is wider
// than its whole line (`wrap-anywhere`, above) — which no caption the articles
// ship is (THE CAPTION NEVER SPLITS A WORD).
//
// ── THE CARD: a <figure> and its <figcaption> — HTML-AAM's rule makes the
// caption the figure's accessible name, a rule Chromium 151 does not apply:
// its own accessibility tree names such a figure "" (measured 2026-10-20,
// sections/PostPhoto's THE HEADING; Firefox and WebKit not measured). A
// screen reader still reads the caption inside the figure, in reading order —
// the photograph's `alt`, then the caption. The figure is `relative` for the
// photo's `fill`, its 3:4 from `aspect-[3/4]`, cut to the soft corner
// (`rounded-soft`, §15.29's 1rem) by `overflow-hidden`, on a `line-subtle`
// ground that shows while the photograph loads — and its caption's query
// container at the caption's own size (THE THIRD and THE FOURTH; an
// inline-size container changes nothing else here: its width is its box's,
// and the `relative` is what places the photo and the caption, §15.20's
// correction). THE SHADOW is `shadow-xl`, Tailwind's default token the
// contact dialog and the language banner already wear — no token minted; the
// carousel's stage keeps room under the cards for its 40px (CardCarousel.tsx's
// THE ROOM). The dot is decoration, `aria-hidden`, and not drawn at all on a
// card under 8.5 of its caption's ems (THE DOT STEP).
//
// ── THE PHOTOGRAPH: ui/Image's `plain` situation on `fill`, with
// `object-cover` — the atom's rule for a consumer whose geometry differs: it
// takes `plain` and owns it (Image.tsx's merge-order note). The photo covers
// the 3:4 cell and crops what overflows. LAZY, the atom's default: the gallery
// sits below the article's cover, never its first picture. ITS COST (the
// review, 2026-10-20): a lazy picture is fetched only once its box, clipped by
// its ancestors, comes within the browser's distance of the window — a
// distance that widens the window, never a clip — and the carousel's stage
// clips sideways (CardCarousel's THE FADE), so a card loads once it is a
// neighbour — the ring's every step brings the next one in before it is
// centred — but a bead press two or more cards away centres one that has not
// started: from the first card, a press on the sixth bead brings the sixth
// to the centre, and its photograph loads there, behind its placeholder
// (MEASURED by the review). The lever is not this card's, which cannot see
// the stage: the island switching its cards' pictures to eager once the
// stage first comes into view — sections/CardCarousel's to take. Its `sizes`
// arrives from sections/PostGallery, which derives it from the carousel's
// three-card card (PostGallery.tsx's THE `sizes`, DERIVED — and its THE
// PHOTO, NOT THE BOX: the hint is the box's, and this cover draws a
// photograph of another shape wider than its box).
//
// ── A DUMB SERVER COMPONENT: every word arrives finished (§8.1) — the caption
// and the alt are the page's — no message key, no hook, no 'use client'. It
// renders on the server and travels THROUGH sections/CardCarousel's island as
// one of its `slides`, which moves the card's box and never renders inside it.
//
// The type `GalleryCard` is the card's DATA (a picture and its caption), the
// component of the same name draws it — one name for one thing, the way a
// page writes it: `cards: GalleryCard[]`, `<GalleryCard … />`.

/** One card of the gallery: the photograph and its caption, finished (§8.1). */
export type GalleryCard = Readonly<{
  /** The photograph — an informative picture: `alt` says what it shows. */
  image: Readonly<{ src: ImagePath; alt: string }>;
  /** The card's caption, over the photo's bottom-left. */
  caption: string;
}>;

export type GalleryCardProps = GalleryCard &
  Readonly<{
    /** The photograph's `sizes`, derived by sections/PostGallery from the
     *  carousel's three-card card (PostGallery.tsx's THE `sizes`, DERIVED). */
    sizes: string;
  }>;

/** THE CARD (the header): 3:4, the soft corner, the shadow, the ground — and
 *  the caption's container at the caption's own step (the header's THE THIRD
 *  and THE FOURTH), so its queries read the card's width in the caption's
 *  ems. */
const CARD =
  'relative aspect-[3/4] overflow-hidden rounded-soft bg-line-subtle shadow-xl @container text-lg';

/** THE CAPTION (the header's THE CAPTION'S CONTRAST): ONE gradient, the solid
 *  scrim under the words and a 16-step fade into the photograph above them —
 *  `pt-17` puts the words a step below the fade — the belt for a word wider
 *  than its line (the header's THE SECOND), and on a card under 10 of its
 *  ems the narrow step, 16px words and 12px a side (THE THIRD). */
const CAPTION =
  'absolute inset-x-0 bottom-0 flex items-center gap-2 bg-[linear-gradient(to_top,var(--scrim)_calc(100%_-_var(--spacing)*16),transparent)] px-4 pt-17 pb-4 text-lg font-medium text-ink-inverse hyphens-none wrap-anywhere @max-[10em]:text-base @max-[10em]:px-3';

/** The small white dot before the words — decoration, not drawn on a card
 *  under 8.5 of its caption's ems, the gap after it going with it (the
 *  header's THE DOT STEP): there the words keep their 16px and take its room.
 *  KEEP IN SYNC with the demo's dot (the header). */
const DOT = 'size-2 shrink-0 rounded-full bg-ink-inverse @max-[8.5em]:hidden';

/** The photograph covers its cell (THE PHOTOGRAPH). */
const PHOTO = 'object-cover';

export function GalleryCard({
  image,
  caption,
  sizes,
}: GalleryCardProps): ReactElement {
  return (
    <figure className={CARD}>
      <Image
        src={image.src}
        alt={image.alt}
        variant="plain"
        fill
        sizes={sizes}
        className={PHOTO}
      />
      <figcaption className={CAPTION}>
        <span aria-hidden="true" className={DOT} />
        {caption}
      </figcaption>
    </figure>
  );
}
