// sections/PostCard — WHAT ITS TESTS AND ITS STORIES SHARE ABOUT A TITLE'S
// WORDS: the one rule that cuts a title into the units a line cannot break,
// and the one reading that finds a unit laid out on two lines. NEVER SHIPPED:
// no runtime file may import this one (tests/unit/fixtures-fence.test.ts
// walks the whole of src/ for it).
//
// ── THE CUT RULE, SPELLED ONCE (the review of 2026-10-15, typescript).
// PostCard.titles.test.tsx and PostCard.stories.tsx's `expectTitleWordsWhole`
// each spelled the cut and each walked its own Range over the units, so the
// two could drift apart: a rule learnt in one file — the soft hyphen, the day
// the copy marks one (PostCard's WHERE THE BELT BREAKS) — would leave the
// other cutting the old way. They import both from here now — and so do
// FOUR files outside this folder, each holding words of its own to the same
// rule: sections/PostGallery's PostGallery.fixtures.ts (2026-10-15 — a
// gallery card's caption is that card's title) and
// sections/PostConclusion's PostConclusion.stories.tsx, which cut their units
// with `unitsOf`; sections/PostProse's PostProse.subheadings.test.tsx and
// sections/PostPhoto's PostPhoto.headings.test.tsx, which read their
// headings with `unitsAcrossLines`. Shared across five folders, it joins
// CLAUDE.md §15.19's helper-promotion census.
//
// ── A UNIT, NOT A WORD: what a line cannot break — the text between two
// breakable spaces, cut once more after a hyphen, where CSS may break („six-"
// then „monthly": `hyphens: none` leaves a written hyphen's break alone —
// MEASURED, „Why the six- / monthly check- / up matters" on the card's 222px
// line). With the title's hyphenation off, these are the only places it
// breaks (PostCard's THE TITLE NEVER SPLITS A WORD). A no-break space JOINS
// (French sets the narrow U+202F before its colon, so „adulte :" is one unit),
// and punctuation rides with its word („Zahnaufhellung:").
//
// ── LAYOUT, NEVER PAINT (the review of 2026-10-15, react). The card JUMPS: a
// resting pointer is :hover, and a hovered card is painted at 105 % (PostCard's
// THE CARD JUMP), while every rectangle the engine reports — an element's, a
// Range's — is PAINTED. A reading that compared one with a layout length went
// red with nothing wrong: MEASURED, PostCard.titles.test.tsx run after
// PostCard.test.tsx in one browser page, the frame's first card turned :hover
// within 100ms under the pointer the earlier file had left on it, and its
// title, 222px laid out, read 233.1px painted. So every length read here is a
// LAYOUT length — a painted one divided by the element's own `paintScaleOf`,
// its painted width over the computed width no transform touches.
//
// ── NO IMPORTS: the stories run in Storybook and the tests in Vitest, so
// neither runner's API may appear here — the DOM and the language alone.

/**
 * A title's UNITS (the header's A UNIT, NOT A WORD) — THE CUT RULE, spelled
 * once: cut at the spaces a line may break at — ASCII ones; a no-break space
 * joins — and once more after each hyphen.
 */
export const unitsOf = (title: string): string[] =>
  title
    .split(/[ \t\n\r]+/)
    .flatMap((piece) => piece.split(/(?<=-)/))
    .filter(Boolean);

/**
 * How much larger than its layout an element is PAINTED — the scale a
 * transform on it or on an ancestor draws it at: 1 at rest, 1.05 at the card
 * jump's height. Its painted width over its computed width, which no
 * transform touches; the preflight's border-box sizing makes the computed
 * width the box the engine paints. Throws by name for an element with no
 * width to read a scale from.
 */
export const paintScaleOf = (element: Element): number => {
  const scale =
    element.getBoundingClientRect().width /
    parseFloat(getComputedStyle(element).width);
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error(
      `PostCard.fixtures: the <${element.tagName.toLowerCase()}> has no laid-out width to read a scale from.`,
    );
  }
  return scale;
};

/**
 * Each unit of a title's ONE text, with a Range over it — throws by name when
 * the title is not a single text node (a Range per unit needs one).
 */
export const unitRanges = (
  title: HTMLElement,
): { unit: string; range: Range }[] => {
  const [node] = title.childNodes;
  if (!(node instanceof Text) || title.childNodes.length !== 1) {
    throw new Error(
      `PostCard.fixtures: the title „${title.textContent ?? ''}" is not one text.`,
    );
  }
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
 * The units of a title that its element LAYS OUT ON MORE THAN ONE LINE: a
 * Range over each unit, its fragments' tops more than half a line apart IN
 * LAYOUT PIXELS — the painted spread divided by the title's `paintScaleOf`,
 * so a jumping card reads as a still one. A unit the engine keeps whole
 * stands on one line; a syllable break, or the belt's, would put it on two.
 * Throws by name when the title's line height is no length, which would make
 * every comparison false — and the reading vacuous.
 */
export const unitsAcrossLines = (title: HTMLElement): string[] => {
  const halfLine = parseFloat(getComputedStyle(title).lineHeight) / 2;
  if (!Number.isFinite(halfLine)) {
    throw new Error(
      `PostCard.fixtures: the title's line height is no length („${getComputedStyle(title).lineHeight}").`,
    );
  }
  const scale = paintScaleOf(title);
  return unitRanges(title)
    .filter(({ unit, range }) => {
      const tops = [...range.getClientRects()]
        .filter((rect) => rect.width > 0)
        .map((rect) => rect.top);
      if (tops.length === 0) {
        throw new Error(`PostCard.fixtures: „${unit}" is not laid out.`);
      }
      return (Math.max(...tops) - Math.min(...tops)) / scale > halfLine;
    })
    .map(({ unit }) => unit);
};
