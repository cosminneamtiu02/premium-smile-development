import { isValidElement, type ReactNode } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { CalendarCheck } from '@/assets/glyphs/CalendarCheck';
import { People } from '@/assets/glyphs/People';
import { ToothCheck } from '@/assets/glyphs/ToothCheck';
import { Trophy } from '@/assets/glyphs/Trophy';
import type { StatIcon } from '@/lib/team/team';
import type { DoctorStatContent } from '../populate';
import twinSource from './Doctor.stories.tsx?raw';
import pageSource from './page.tsx?raw';
import { STAT_ICONS, toStatTiles } from './stat-tiles';

// stat-tiles — the doctor page's one JSX step, pinned where it is written
// (G2-R2 tier 3, react F1 / typescript F1). Three things, each the half of the
// promise a play cannot see: the glyphs are aria-hidden, so no role query
// reaches them, and a swapped drawing would have been photographed as the
// truth.
//   · THE TABLE: each of the four ids draws ITS glyph, and the four are four
//     different components.
//   · THE STEP: a stat row becomes a tile with its id as the key, its glyph
//     picked by that id, every word and number passed through, and `suffix`
//     carried exactly when the row has one.
//   · THE ONE COPY: ./page.tsx and its twin ./Doctor.stories.tsx both call
//     `toStatTiles` from this module and neither grows a table of its own
//     again — read off their source text, since no runtime assertion can see
//     where a mapping was written.
//
// It runs in the `components` project (src/**/*.test.{ts,tsx}), a real
// Chromium; nothing is rendered — the table's values are elements, and an
// element's `type` IS the component it will draw.

/** The four ids, spelled once for the loops below; the type pin in the first
 *  test proves it is ALL of lib/team's `StatIcon` and nothing else. */
const IDS = [
  'experience',
  'patients',
  'courses',
  'interventions',
] as const satisfies readonly StatIcon[];

/** The drawing each id must pick — the run's own four (D30/D32; CalendarCheck
 *  the owner's 2026-09-26 replacement). Changing a glyph is an edit here AND
 *  in ./stat-tiles.tsx, on purpose: the pair is the change's paper trail. */
const GLYPH_OF = {
  experience: CalendarCheck,
  patients: People,
  courses: Trophy,
  interventions: ToothCheck,
} satisfies Record<StatIcon, unknown>;

/** The component an element will draw, or `undefined` for a node that is not
 *  an element at all (a string, a fragment's children, `null`) — narrowed by
 *  React's own guard, never cast. */
const componentOf = (node: ReactNode): unknown =>
  isValidElement(node) ? node.type : undefined;

/**
 * The page's source with its PROSE removed, so the "no table of its own"
 * guard polices code and not the comments that discuss the table by name
 * (the mechanism of DoctorProfile.test.tsx's `stripComments`, copied: block
 * comments — JSX `{/* … *\/}` ones included — and whole-line `//` comments).
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

/** Two Romanian rows, one with a suffix and one without (§15.7). */
const ROWS: readonly DoctorStatContent[] = [
  {
    icon: 'experience',
    value: 12,
    suffix: '+',
    label: 'Ani de experiență',
    description: 'Peste doisprezece ani în ortodonție.',
  },
  {
    icon: 'courses',
    value: 9,
    label: 'Cursuri',
    description: 'Nouă cursuri de specialitate în opt ani.',
  },
];

describe('STAT_ICONS — the drawings behind the stat ids', () => {
  it('holds exactly lib/team’s four ids', () => {
    expectTypeOf<(typeof IDS)[number]>().toEqualTypeOf<StatIcon>();
    expect(Object.keys(STAT_ICONS).toSorted()).toEqual([...IDS].toSorted());
  });

  it('draws each id with ITS glyph', () => {
    for (const id of IDS) {
      expect(componentOf(STAT_ICONS[id]), id).toBe(GLYPH_OF[id]);
    }
  });

  it('draws the four ids with four DIFFERENT glyphs', () => {
    const components = IDS.map((id) => componentOf(STAT_ICONS[id]));
    expect(components.every((component) => component !== undefined)).toBe(true);
    expect(new Set(components).size).toBe(IDS.length);
  });
});

describe('toStatTiles — a stat row becomes a tile', () => {
  const tiles = toStatTiles(ROWS);

  it('keeps one tile per row, in the rows’ own order', () => {
    expect(tiles.map((tile) => tile.id)).toEqual(['experience', 'courses']);
  });

  it('keys each tile by its icon id and draws it with that id’s glyph', () => {
    for (const [index, tile] of tiles.entries()) {
      expect(tile.id).toBe(ROWS[index].icon);
      expect(tile.icon).toBe(STAT_ICONS[ROWS[index].icon]);
    }
  });

  it('passes the number and the words through untouched', () => {
    for (const [index, tile] of tiles.entries()) {
      expect(tile.value).toBe(ROWS[index].value);
      expect(tile.label).toBe(ROWS[index].label);
      expect(tile.description).toBe(ROWS[index].description);
    }
  });

  it('carries `suffix` exactly when the row has one — no key otherwise', () => {
    expect(tiles[0].suffix).toBe('+');
    // An own `suffix: undefined` would still be a key; the band's contract is
    // "absent", and the populator already leaves it out of the row.
    expect(Object.hasOwn(tiles[1], 'suffix')).toBe(false);
  });

  it('hands the band its tile shape and nothing more', () => {
    expect(Object.keys(tiles[0]).toSorted()).toEqual([
      'description',
      'icon',
      'id',
      'label',
      'suffix',
      'value',
    ]);
    expect(Object.keys(tiles[1]).toSorted()).toEqual([
      'description',
      'icon',
      'id',
      'label',
      'value',
    ]);
  });

  it('returns no tile for a doctor with no row', () => {
    expect(toStatTiles([])).toEqual([]);
  });
});

describe('the ONE copy — the page and its twin both call this module', () => {
  const twins = [
    ['./page.tsx', pageSource],
    ['./Doctor.stories.tsx', twinSource],
  ] as const;

  it.each(twins)('%s imports toStatTiles from ./stat-tiles', (_, source) => {
    expect(source).toMatch(
      /^import \{ toStatTiles \} from '\.\/stat-tiles';$/m,
    );
  });

  it.each(twins)('%s hands the band toStatTiles(page.stats)', (_, source) => {
    expect(stripComments(source)).toMatch(
      /\btiles=\{toStatTiles\(page\.stats\)\}/,
    );
  });

  it.each(twins)(
    '%s keeps no glyph table and no glyph import of its own',
    (_, source) => {
      const code = stripComments(source);
      expect(code).not.toMatch(/\bSTAT_ICONS\b/);
      expect(code).not.toMatch(/@\/assets\/glyphs\//);
    },
  );
});
