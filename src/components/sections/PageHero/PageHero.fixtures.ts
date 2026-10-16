// sections/PageHero — what the hero's suites SHARE, spelled once: the RULES
// every copy is held to (the stairway's three steps, the heading-to-lead
// gap, the wrap style by column), the READERS that see a rendered line (as a
// box, as text, as the copy's segment) and find the page's <h1> by its NAME,
// and the stairway's five rules as ONE pure reader (`stairwayViolations`,
// which asserts nothing — each suite asserts its list empty with its own
// `expect`). Read by the hero's own suites (PageHero.test.tsx, the measuring
// PageHero.scale.test.tsx and PageHero.stories.tsx) and by the suites of the
// bands that compose it — sections/PostList's three and the Pages/Blog twin
// among them. Moved here from PostList.fixtures.ts on 2026-10-15 with the
// hero itself; that file keeps the blog band's own rules.
// NEVER SHIPPED: tests/unit/fixtures-fence.test.ts keeps every runtime file
// in src/ off a `*.fixtures` module.
//
// ── ONE SOURCE (G2 typescript, 2026-10-15): the stairway's three steps were
// spelled in both of the blog band's measuring files, and so were its jump
// and every length of its rhythm — a bound moved in one would have left the
// other holding the old one. With two bands composing the hero, the same
// holds across folders: a step moved here moves for every suite.
//
// ── PRODUCT CODE TO THE CENSUSES. tests/unit/design-scale.test.ts and its
// sibling censuses read every src/ file that is not a test or a story — this
// one included — and Tailwind scans it, so it holds numbers, rules and
// readers only: no class name, no gate, no property of THE BAND SCALE (the
// files that read the design pixel keep that reading their own). Nor any of
// the site's data: the copy is the message files', and the suites import it
// themselves.

/** THE STAIRWAY's steps (PageHero.tsx's paragraph of that name): wherever the
 *  hero's band is scaled, each line is at most this share of the line above
 *  it — the heading's second of its first, the lead's second of its first,
 *  the lead's third of its second. */
export const TITLE_STEP = 0.9;
export const LEAD_FIRST_STEP = 0.95;
export const LEAD_STEP = 0.9;

/** The heading to its lead, in rem — × the design pixel inside THE BAND
 *  SCALE (PageHero.tsx's THE HERO, CENTRED: the hero's one gap, doubled on
 *  the owner's second look at the blog's hero). */
export const HERO_GAP_REM = 3;

/** The computed wrap style of the title and the lead (PageHero.tsx's ON A
 *  PHONE'S OR A TABLET'S COLUMN), by the column's width in rem: `pretty` on a
 *  column under 48rem — a phone's or a tablet's — and the plain wrap from
 *  it. */
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

/** THE STAIRWAY (PageHero.tsx's paragraph of that name), read off a rendered
 *  hero inside the band scale — one message per broken rule, in this order,
 *  and an empty list when the stairway holds:
 *    1. no line wider than its box — the white-space wraps a line too long
 *       for its box, never lets it spill;
 *    2. the heading in exactly TWO lines and the lead in exactly THREE;
 *    3. each line exactly its segment of the copy — the breaks are the copy's,
 *       not the wrap's;
 *    4. the steps: the heading's second line at most TITLE_STEP of its first,
 *       the lead's second at most LEAD_FIRST_STEP of its first and its third
 *       at most LEAD_STEP of its second;
 *    5. the stair runs on into the lead: the heading's second line wider
 *       than the lead's first.
 *  ONE READER for every suite that holds a hero to it (G2 react: the two
 *  measuring suites had each spelled the five rules): it reads the
 *  layout and asserts nothing, so each suite asserts with its own `expect`
 *  that the list is empty, and a failure prints every rule that broke, by
 *  name and number. */
export const stairwayViolations = (
  hero: { h1: Element; lead: Element },
  copy: { title: string; lead: string },
): string[] => {
  const violations: string[] = [];
  const blocks = [
    ['the title', hero.h1, copy.title],
    ['the lead', hero.lead, copy.lead],
  ] as const;
  for (const [name, element] of blocks) {
    const width = element.getBoundingClientRect().width;
    for (const [index, line] of linesOf(element).entries()) {
      if (line.width > width + 0.5) {
        violations.push(
          `${name}’s line ${index + 1}, ${line.width}px, wider than its ${width}px box`,
        );
      }
    }
  }
  const title = linesOf(hero.h1).map(({ width }) => width);
  const lead = linesOf(hero.lead).map(({ width }) => width);
  if (title.length !== 2) {
    violations.push(`the title in ${title.length} lines, not 2`);
  }
  if (lead.length !== 3) {
    violations.push(`the lead in ${lead.length} lines, not 3`);
  }
  for (const [name, element, text] of blocks) {
    const lines = lineStrings(element);
    const segments = segmentsOf(text);
    if (
      lines.length !== segments.length ||
      lines.some((line, index) => line !== segments[index])
    ) {
      violations.push(
        `${name}’s lines ${JSON.stringify(lines)}, not the copy’s ${JSON.stringify(segments)}`,
      );
    }
  }
  const [t1 = 0, t2 = Infinity] = title;
  const [l1 = 0, l2 = Infinity, l3 = Infinity] = lead;
  if (!(t2 <= TITLE_STEP * t1)) {
    violations.push(
      `the title’s second line, ${t2}px, over ${TITLE_STEP} of its first, ${t1}px`,
    );
  }
  if (!(l2 <= LEAD_FIRST_STEP * l1)) {
    violations.push(
      `the lead’s second line, ${l2}px, over ${LEAD_FIRST_STEP} of its first, ${l1}px`,
    );
  }
  if (!(l3 <= LEAD_STEP * l2)) {
    violations.push(
      `the lead’s third line, ${l3}px, over ${LEAD_STEP} of its second, ${l2}px`,
    );
  }
  if (!(t2 > l1)) {
    violations.push(
      `the title’s second line, ${t2}px, not wider than the lead’s first, ${l1}px`,
    );
  }
  return violations;
};

/** Every run of whitespace one space, the ends trimmed — the no-break spaces
 *  too, for a NAME (`namedAs`). */
const collapsed = (text: string): string => text.replace(/\s+/g, ' ').trim();

/** A role query's `name` for `text`, whitespace collapsed on both sides — how
 *  every suite that renders the hero finds the page's <h1>. The copy breaks
 *  the heading with a `\n`, and the two engines that name it disagree on what
 *  that is: Testing Library names an element with dom-accessibility-api,
 *  which keeps the `\n`, while Chromium's own accessible name — the one a
 *  screen reader speaks — reads it as a space (both read on 2026-10-15, the
 *  blog's Romanian heading: `computeAccessibleName`, and the DevTools
 *  protocol's accessibility tree). Collapsing both sides finds the heading by
 *  either, so no query leans on the `\n` one engine happens to keep (G2 react
 *  and typescript). */
export const namedAs =
  (text: string) =>
  (name: string): boolean =>
    collapsed(name) === collapsed(text);
