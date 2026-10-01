import type { ReactNode } from 'react';
import { CalendarCheck } from '@/assets/glyphs/CalendarCheck';
import { People } from '@/assets/glyphs/People';
import { ToothCheck } from '@/assets/glyphs/ToothCheck';
import { Trophy } from '@/assets/glyphs/Trophy';
import type { DoctorStatTile } from '@/components/sections/DoctorStats/DoctorStats';
import type { StatIcon } from '@/lib/team/team';
import type { StatContent } from './populate';

// app/[locale]/team/stat-tiles — THE last step between a list of „în cifre"
// rows and sections/DoctorStats' tiles: the stat ID becomes its glyph, and
// the row becomes the band's tile shape. Written ONCE for every page that
// draws tiles — the doctor page (./[slug]/page.tsx) with its story twin
// (./[slug]/Doctor.stories.tsx), and, since 2026-10-01, the Team page
// (./page.tsx, ./Team.stories.tsx) and the Home page (../(home)/page.tsx,
// ../(home)/Home.stories.tsx), whose bands show the clinic's own numbers
// (lib/team's `clinicStats`) — and all six import it (G2-R2 tier 3, react F1
// / typescript F1). Until this file, the
// glyph table and the seven-line tile mapping were spelled by hand in the
// doctor page and its twin, byte-equal on the day of the review and seen by
// no play: the glyphs are aria-hidden, so a swapped drawing in the twin would
// have gone green everywhere and been photographed as the truth.
//
// ── WHY HERE, beside ./populate.ts. It lived in ./[slug]/ while the doctor
// route was its only caller, and moved up when the Team and Home routes began
// to draw tiles too (2026-10-01): beside the team walk every caller already
// imports — the doctor page and Home import ./populate.ts from this folder,
// and the Team page lives in it — rather than inside one route's own
// sub-folder, where Home would have had to reach into ./[slug]/.
//
// ── WHY A SIBLING MODULE, and not one of the three homes that look nearer:
//   · NOT ./populate.ts. That walk is JSX-free by its own header, and this
//     step is nothing BUT JSX — four glyph elements. The walk hands over the
//     icon as an ID (`StatContent.icon`) precisely so that it never
//     builds an element; this file is where the element gets built.
//   · NOT lib/team. lib is React-free (tests/unit/lib-react-free.test.ts bans
//     even a type-only `react` import), so a Record whose values are
//     components cannot live there — the G2-R2 tier-1 fold's record, and the
//     reason `StatIcon` is an id in the first place (run ledger D30/D32).
//   · NOT a page module with the twins importing it. A page module exports
//     the framework surface and nothing else (the `SERVICES_TITLE_ID`
//     docblock in ../services/populate.ts: a convention held on purpose, not a
//     wall), and a twin cannot import an async Server Component module anyway
//     — the reason ./populate.ts exists.
// So it is populate.ts' own argument, one step further: a module every side
// imports is what keeps a mapping written once instead of twinned by hand and
// left to drift. ./stat-tiles.test.tsx pins the table and the step, and pins
// that no page and no twin grows a table of its own again.

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
 * A list of stat rows — a doctor's or the clinic's — already in the visitor's
 * language, → the band's tiles: the icon ID becomes the tile's key AND picks
 * its glyph, everything else passes through as it came. The spread carries
 * `suffix` exactly when the row has one — ./populate.ts's `populateStats`
 * already leaves the key out of a row that has none (its suite pins "no
 * `suffix` key at all"), so a second conditional here would guard a shape
 * that cannot arrive. Order passes through unchanged: display order is
 * lib/team's.
 */
export function toStatTiles(
  stats: readonly StatContent[],
): readonly DoctorStatTile[] {
  return stats.map((stat) => ({
    ...stat,
    id: stat.icon,
    icon: STAT_ICONS[stat.icon],
  }));
}
