// sections/PostList — what the band's suites SHARE, spelled once. The two
// that measure — PostList.scale.test.tsx (the band at the named windows, the
// real stylesheet and faces) and PostList.stories.tsx (the plays, at whatever
// width a runner opens) — hold the band to the same RULES (the stairway's
// steps, a card's jump, the band's room and gaps) and read its text LINES
// through the same reader; all three of the folder's suites find the page's
// <h1> by the same NAME. NEVER SHIPPED: tests/unit/fixtures-fence.test.ts
// keeps every runtime file in src/ off a `*.fixtures` module.
//
// ── ONE SOURCE (G2 typescript, 2026-10-15): the stairway's three steps were
// spelled in both measuring files, and so were the jump and every length of
// the band's rhythm — a bound moved in one would have left the other holding
// the old one.
//
// ── PRODUCT CODE TO THE CENSUSES. tests/unit/design-scale.test.ts and its
// sibling censuses read every src/ file that is not a test or a story — this
// one included — and Tailwind scans it, so it holds numbers, rules and
// readers only: no class name, no gate, no property of THE BAND SCALE (the
// files that read the design pixel keep that reading their own). Nor any of
// the site's data: the copy is the message files', the posts lib/blog's, and
// the suites import them themselves.

/** THE STAIRWAY's steps (PostList.tsx's paragraph of that name): wherever the
 *  band is scaled, each line is at most this share of the line above it —
 *  the heading's second of its first, the lead's second of its first, the
 *  lead's third of its second. */
export const TITLE_STEP = 0.9;
export const LEAD_FIRST_STEP = 0.95;
export const LEAD_STEP = 0.9;

/** A card's jump toward each neighbour, a share of its own size (PostCard's
 *  THE CARD JUMP: 105 %, so 2.5 % a side) — every gap it grows into stays
 *  wider (PostList.tsx's THE LIST). */
export const JUMP = 0.025;

/** THE BAND's own lengths, in rem — × the design pixel inside THE BAND SCALE
 *  (PostList.tsx's THE BAND): the heading to its lead (doubled on the owner's
 *  second look), the grid's gap — between its cards, and from its last row
 *  to the pager — and the room under the band's last box. */
export const HERO_GAP_REM = 3;
export const GRID_GAP_REM = 2;
export const ROOM_BELOW_REM = 2;

/** The room above the hero, in rem, by the column's width in rem — it
 *  follows ui/Container's steps: 4 under 32rem, 6 from it, 8 from 48rem. */
export const roomAboveRem = (columnRem: number): number =>
  columnRem >= 48 ? 8 : columnRem >= 32 ? 6 : 4;

/** The gap from the lead to the cards, in rem, by the column's width in rem:
 *  4.8 — 19.2 spacing steps, a fifth over the owner's first 4 — under the
 *  48rem step, 6 from it. */
export const leadToCardsRem = (columnRem: number): number =>
  columnRem >= 48 ? 6 : 4.8;

/** The computed wrap style of the title and the lead (PostList.tsx's THE
 *  HERO), by the column's width in rem: `pretty` on a column under 48rem — a
 *  phone's or a tablet's — and the plain wrap from it. */
export const wrapStyleAt = (columnRem: number): 'pretty' | 'auto' =>
  columnRem < 48 ? 'pretty' : 'auto';

/** An element's text LINES as boxes — its Range's client rects grouped by
 *  their top, each line the union of its boxes: a line can hold more than
 *  one (where the engine hyphenates, the broken word's head is a box of its
 *  own), and only their union is the line the centring centres. */
export const linesOf = (element: Element): DOMRect[] => {
  const range = document.createRange();
  range.selectNodeContents(element);
  const byTop = new Map<number, DOMRect>();
  for (const rect of range.getClientRects()) {
    if (rect.width === 0) continue;
    const top = Math.round(rect.top);
    const seen = byTop.get(top);
    byTop.set(
      top,
      seen
        ? new DOMRect(
            Math.min(seen.left, rect.left),
            seen.top,
            Math.max(seen.right, rect.right) - Math.min(seen.left, rect.left),
            seen.height,
          )
        : rect,
    );
  }
  return [...byTop.values()];
};

/** An element's lines as TEXT, top to bottom — every character placed by its
 *  own Range and grouped by its top (within 2px): a hyphenated word lands
 *  half on each line, and a line break of the copy that the white-space
 *  collapses — a space to the eye — stays the character it is, on the line
 *  it was set in. */
export const lineTexts = (element: Element): string[] => {
  const lines: { top: number; text: string }[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? '';
    for (let index = 0; index < text.length; index += 1) {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const [rect] = range.getClientRects();
      if (!rect) continue;
      const line = lines.find(({ top }) => Math.abs(top - rect.top) < 2);
      if (line) line.text += text[index];
      else lines.push({ top: rect.top, text: text[index] ?? '' });
    }
  }
  return lines.toSorted((a, b) => a.top - b.top).map(({ text }) => text);
};

/** Every run of ASCII whitespace one space — a collapsed line break of the
 *  copy included — and the ends trimmed, as the eye reads a line. The no-break
 *  spaces stay what they are: they are the copy's, never the layout's. */
const asRead = (text: string): string =>
  text.replace(/[\t\n\f\r ]+/g, ' ').trim();

/** An element's lines as the eye reads them (`asRead`), the empty ones left
 *  out — a forced break's own character is no line. */
export const lineStrings = (element: Element): string[] =>
  lineTexts(element).map(asRead).filter(Boolean);

/** A block's copy as the message file breaks it, one segment a line, read
 *  the way `lineStrings` reads a rendered line. */
export const segmentsOf = (text: string): string[] =>
  text.split('\n').map(asRead);

/** Every run of whitespace one space, the ends trimmed — the no-break spaces
 *  too, for a NAME (`namedAs`). */
const collapsed = (text: string): string => text.replace(/\s+/g, ' ').trim();

/** A role query's `name` for `text`, whitespace collapsed on both sides — how
 *  the folder's three suites find the page's <h1>. The copy breaks the
 *  heading with a `\n`, and the two engines that name it disagree on what
 *  that is: Testing Library names an element with dom-accessibility-api,
 *  which keeps the `\n`, while Chromium's own accessible name — the one a
 *  screen reader speaks — reads it as a space (both read on 2026-10-15, the
 *  Romanian heading: `computeAccessibleName`, and the DevTools protocol's
 *  accessibility tree). Collapsing both sides finds the heading by either,
 *  so no query leans on the `\n` one engine happens to keep (G2 react and
 *  typescript). */
export const namedAs =
  (text: string) =>
  (name: string): boolean =>
    collapsed(name) === collapsed(text);
