import { unitsOf } from '@/components/sections/PostCard/PostCard.fixtures';
import type { GalleryCard } from './GalleryCard';

// sections/PostGallery — WHAT ITS TESTS AND ITS STORIES SHARE: the eight
// cards they draw, and, about a caption's words, the line a gallery card's
// caption sets them on, the units of its one text, and the one reading that
// finds a unit laid out on two lines. NEVER SHIPPED: no runtime file may
// import this one (tests/unit/fixtures-fence.test.ts walks the whole of src/
// for it).
//
// ── THE EIGHT CARDS — the owner's "8 fake photos" (2026-10-16: "all must be
// instantiated … *and must also have 8 instances*"): the eight gallery
// placeholders, /images/demo/gallery-1.jpg … gallery-8.jpg (portrait crops,
// 1080px wide), under the Romanian captions and alts sections/CardCarousel's
// demo cards wear (§15.7) — the eight both of the article's galleries hold,
// circular and end to end. COPIED, never imported: the article's galleries
// name the same files, but site data stays the page's (§8.1), and another
// section's stories are its internals (§4).
//
// ── THE CUT RULE IS POSTCARD'S, IMPORTED, NEVER SPELLED AGAIN. A caption
// breaks where a card title breaks — both wear `hyphens-none` beside the
// `wrap-anywhere` belt (GalleryCard.tsx's THE CAPTION NEVER SPLITS A WORD;
// PostCard's THE TITLE NEVER SPLITS A WORD) — so a unit is what
// PostCard.fixtures.ts's `unitsOf` cuts: the text between two breakable
// spaces, cut once more after a written hyphen, a no-break space joining. One
// spelling of the rule for the whole site, so a rule learnt for one (a soft
// hyphen, the day copy marks one) reaches the other.
//
// ── THE CAPTION'S ONE TEXT. GalleryCard's <figcaption> holds the dot (an
// aria-hidden <span>) and then the caption as ONE text node — the flex row's
// anonymous item, which takes the line the dot and its gap leave. A Range per
// unit needs that one node; anything else throws by name.
//
// ── THE DOT TAKES ITS ROOM ONLY WHILE IT IS DRAWN. On a card under 8.5 of its
// caption's ems the dot is `display: none` (GalleryCard.tsx's THE DOT STEP):
// no flex item, so no width and no gap after it — the line is the caption's
// width less its padding alone. `captionLine` reads the dot's display before
// its width, which a dot that is not drawn does not have.
//
// ── A UNIT ON TWO LINES, COUNTED, NEVER MEASURED. The stories read the cards
// where the carousel stands them — the line's side cards turned in 3D and
// scaled, the centre one straight — so a reading of positions would read a
// projection. Instead each unit's Range is asked for its rectangles: a unit
// the engine keeps whole is ONE text fragment on one line, ONE rectangle
// wherever the card is turned; a unit the belt broke is two fragments on two
// lines, two rectangles. A count no transform can change.
//
// ── NO IMPORTS BUT THE CUT RULE AND THE CARD'S TYPE: the stories run in
// Storybook and the tests in Vitest, so neither runner's API may appear here —
// the DOM and the language alone (PostCard.fixtures.ts's rule).

/** THE EIGHT CARDS (the header), in the article's order. */
export const GALLERY_CARDS: readonly GalleryCard[] = [
  {
    image: {
      src: '/images/demo/gallery-1.jpg',
      alt: 'Holul clinicii și ușa deschisă a unui cabinet, prin care se vede scaunul stomatologic mov',
    },
    caption: 'Ușa cabinetului',
  },
  {
    image: {
      src: '/images/demo/gallery-2.jpg',
      alt: 'Două fotolii galbene în fața unui perete cu un model rotund în relief și, în prim-plan, o canapea galbenă',
    },
    caption: 'Sala de așteptare',
  },
  {
    image: {
      src: '/images/demo/gallery-3.jpg',
      alt: 'Sertare albe, aparate mici și un scaun mov într-un cabinet',
    },
    caption: 'Masa de lucru',
  },
  {
    image: {
      src: '/images/demo/gallery-4.jpg',
      alt: 'Un scaun mov sub lampă și, pe peretele mov, un ecran cu o radiografie panoramică',
    },
    caption: 'Scaunul stomatologic',
  },
  {
    image: {
      src: '/images/demo/gallery-5.jpg',
      alt: 'Prim-plan cu un instrument subțire și o piesă de mână, suspendate pe brațul unității dentare',
    },
    caption: 'Instrumentele de lucru',
  },
  {
    image: {
      src: '/images/demo/gallery-6.jpg',
      alt: 'Prim-plan cu două piese de mână argintii, una cu un inel roșu, lângă un vârf de culoare bej',
    },
    caption: 'Piesele de mână',
  },
  {
    image: {
      src: '/images/demo/gallery-7.jpg',
      alt: 'Un pacient cu ochii închiși, cu oglinda ținută lângă dinți',
    },
    caption: 'Oglinda dentară',
  },
  {
    image: {
      src: '/images/demo/gallery-8.jpg',
      alt: 'Mâini în mănuși țin o sondă cu mâner portocaliu lângă dinții unui pacient',
    },
    caption: 'La control',
  },
];

/** A unit of a caption and a Range over it in the caption's one text. */
export type CaptionUnit = Readonly<{ unit: string; range: Range }>;

/**
 * The caption's ONE text node (the header's THE CAPTION'S ONE TEXT) — throws
 * by name when the caption holds no text or more than one.
 */
export const captionText = (caption: HTMLElement): Text => {
  const texts = [...caption.childNodes].filter(
    (node): node is Text => node instanceof Text,
  );
  const [text] = texts;
  if (text === undefined || texts.length !== 1) {
    throw new Error(
      `PostGallery.fixtures: the caption „${caption.textContent ?? ''}" is not one text.`,
    );
  }
  return text;
};

/** Each unit of a caption (PostCard's cut rule), with a Range over it. */
export const captionUnits = (caption: HTMLElement): CaptionUnit[] => {
  const node = captionText(caption);
  const text = node.data;
  let from = 0;
  return unitsOf(text).map((unit) => {
    const start = text.indexOf(unit, from);
    from = start + unit.length;
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, from);
    return { unit, range };
  });
};

/**
 * The caption's dot — throws by name when it is missing.
 */
const captionDot = (caption: HTMLElement): HTMLElement => {
  const dot = caption.firstElementChild;
  if (!(dot instanceof HTMLElement)) {
    throw new Error('PostGallery.fixtures: the caption has no dot.');
  }
  return dot;
};

/**
 * Whether the caption's dot is DRAWN (the header's THE DOT TAKES ITS ROOM
 * ONLY WHILE IT IS DRAWN): false on a card under 8.5 of its caption's ems.
 */
export const captionDotShown = (caption: HTMLElement): boolean =>
  getComputedStyle(captionDot(caption)).display !== 'none';

/**
 * THE CAPTION'S LINE, in LAYOUT pixels: the caption box's width — a computed
 * length, which no transform touches — less its inline padding and, while the
 * dot is drawn, the dot and the flex gap after it. What the words have, line
 * by line. Throws by name when the dot is missing or a length does not read
 * as a number.
 */
export const captionLine = (caption: HTMLElement): number => {
  const dot = captionDot(caption);
  const style = getComputedStyle(caption);
  const dotted = captionDotShown(caption);
  const line =
    parseFloat(style.width) -
    parseFloat(style.paddingLeft) -
    parseFloat(style.paddingRight) -
    (dotted
      ? parseFloat(getComputedStyle(dot).width) + parseFloat(style.columnGap)
      : 0);
  if (!Number.isFinite(line)) {
    throw new Error(
      `PostGallery.fixtures: the caption „${caption.textContent ?? ''}" has no line to read.`,
    );
  }
  return line;
};

/**
 * The units of a caption that its card LAYS OUT ON MORE THAN ONE LINE (the
 * header's A UNIT ON TWO LINES, COUNTED): each unit's non-empty rectangles,
 * one per line it stands on. Throws by name for a unit with none, which would
 * make the reading vacuous.
 */
export const captionUnitsAcrossLines = (caption: HTMLElement): string[] =>
  captionUnits(caption)
    .filter(({ unit, range }) => {
      const fragments = [...range.getClientRects()].filter(
        (rect) => rect.width > 0,
      ).length;
      if (fragments === 0) {
        throw new Error(`PostGallery.fixtures: „${unit}" is not laid out.`);
      }
      return fragments > 1;
    })
    .map(({ unit }) => unit);
