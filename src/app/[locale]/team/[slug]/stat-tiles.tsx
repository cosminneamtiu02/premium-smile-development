import type { ReactNode } from 'react';
import { CalendarCheck } from '@/assets/glyphs/CalendarCheck';
import { People } from '@/assets/glyphs/People';
import { ToothCheck } from '@/assets/glyphs/ToothCheck';
import { Trophy } from '@/assets/glyphs/Trophy';
import type { DoctorStatTile } from '@/components/sections/DoctorStats/DoctorStats';
import type { StatIcon } from '@/lib/team/team';
import type { DoctorStatContent } from '../populate';

// app/[locale]/team/[slug]/stat-tiles — THE last step between a doctor's
// „în cifre" rows and sections/DoctorStats' tiles: the stat ID becomes its
// glyph, and the row becomes the band's tile shape. Written ONCE for the
// doctor page (./page.tsx) and its story twin (./Doctor.stories.tsx), which
// both import it (G2-R2 tier 3, react F1 / typescript F1). Until this file,
// the glyph table and the seven-line tile mapping were spelled by hand in
// both, byte-equal on the day of the review and seen by no play: the glyphs
// are aria-hidden, so a swapped drawing in the twin would have gone green
// everywhere and been photographed as the truth.
//
// ── WHY A SIBLING MODULE, and not one of the three homes that look nearer:
//   · NOT ../populate.ts. That walk is JSX-free by its own header, and this
//     step is nothing BUT JSX — four glyph elements. The walk hands over the
//     icon as an ID (`DoctorStatContent.icon`) precisely so that it never
//     builds an element; this file is where the element gets built.
//   · NOT lib/team. lib is React-free (tests/unit/lib-react-free.test.ts bans
//     even a type-only `react` import), so a Record whose values are
//     components cannot live there — the G2-R2 tier-1 fold's record, and the
//     reason `StatIcon` is an id in the first place (run ledger D30/D32).
//   · NOT ./page.tsx with the twin importing it. A page module exports the
//     framework surface and nothing else (the `SERVICES_TITLE_ID` docblock in
//     ../../services/populate.ts: a convention held on purpose, not a wall),
//     and the twin cannot import an async Server Component module anyway —
//     the reason ../populate.ts exists.
// So it is populate.ts' own argument, one step further: a module both sides
// import is what keeps a mapping written once instead of twinned by hand and
// left to drift. ./stat-tiles.test.tsx pins the table and the step, and pins
// that neither twin grows a table of its own again.

/**
 * THE DRAWINGS BEHIND THE STAT IDS (run ledger D30/D32). A Record, so a fifth
 * id in lib/team's `StatIcon` cannot compile until it names its glyph here.
 * Decorative by the glyphs' own default (aria-hidden); the tile's <h3>
 * carries the meaning. The four drawings are the run's own, drawn per the
 * glyph README's checklist and the owner's to replace (CalendarCheck is his
 * 2026-09-26 replacement for the first draft).
 */
export const STAT_ICONS: Readonly<Record<StatIcon, ReactNode>> = {
  experience: <CalendarCheck />,
  patients: <People />,
  courses: <Trophy />,
  interventions: <ToothCheck />,
};

/**
 * One doctor's stat rows, already in the visitor's language, → the band's
 * tiles: the icon ID becomes the tile's key AND picks its glyph, everything
 * else passes through as it came. The spread carries `suffix` exactly when
 * the row has one — ../populate.ts already leaves the key out of a row that
 * has none (its suite pins "no `suffix` key at all"), so a second conditional
 * here would guard a shape that cannot arrive. Order passes through
 * unchanged: display order is lib/team's.
 */
export function toStatTiles(
  stats: readonly DoctorStatContent[],
): readonly DoctorStatTile[] {
  return stats.map((stat) => ({
    ...stat,
    id: stat.icon,
    icon: STAT_ICONS[stat.icon],
  }));
}
