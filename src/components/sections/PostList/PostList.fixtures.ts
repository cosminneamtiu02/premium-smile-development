// sections/PostList — what the band's suites SHARE, spelled once. The two
// that measure — PostList.scale.test.tsx (the band at the named windows, the
// real stylesheet and faces) and PostList.stories.tsx (the plays, at whatever
// width a runner opens) — hold the band to the same RULES (a card's jump, the
// band's room and gaps). The HERO's rules and readers — the stairway's steps,
// the heading-to-lead gap, the wrap style, the line readers and the <h1>'s
// name matcher — are sections/PageHero's, in PageHero.fixtures.ts since
// 2026-10-15, when the hero left this band for a composition of its own; the
// band's suites import them from there. NEVER SHIPPED:
// tests/unit/fixtures-fence.test.ts keeps every runtime file in src/ off a
// `*.fixtures` module.
//
// ── ONE SOURCE (G2 typescript, 2026-10-15): the jump and every length of the
// band's rhythm were spelled in both measuring files — a bound moved in one
// would have left the other holding the old one.
//
// ── PRODUCT CODE TO THE CENSUSES. tests/unit/design-scale.test.ts and its
// sibling censuses read every src/ file that is not a test or a story — this
// one included — and Tailwind scans it, so it holds numbers and rules only:
// no class name, no gate, no property of THE BAND SCALE (the files that read
// the design pixel keep that reading their own). Nor any of the site's data:
// the copy is the message files', the posts lib/blog's, and the suites
// import them themselves.

/** A card's jump toward each neighbour, a share of its own size (PostCard's
 *  THE CARD JUMP: 105 %, so 2.5 % a side) — every gap it grows into stays
 *  wider (PostList.tsx's THE LIST). */
export const JUMP = 0.025;

/** THE BAND's own lengths, in rem — × the design pixel inside THE BAND SCALE
 *  (PostList.tsx's THE BAND): the grid's gap — between its cards, and from
 *  its last row to the pager — and the room under the band's last box. (The
 *  heading to its lead is the hero's own gap: PageHero.fixtures.ts's
 *  HERO_GAP_REM.) */
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
