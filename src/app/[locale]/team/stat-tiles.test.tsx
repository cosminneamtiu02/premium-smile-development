import { isValidElement, type ReactNode } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { CalendarCheck } from '@/assets/glyphs/CalendarCheck';
import { People } from '@/assets/glyphs/People';
import { ToothCheck } from '@/assets/glyphs/ToothCheck';
import { Trophy } from '@/assets/glyphs/Trophy';
import { locales } from '@/i18n/locales';
import { clinicStats, type StatIcon } from '@/lib/team/team';
import homeTwinSource from '../(home)/Home.stories.tsx?raw';
import homePageSource from '../(home)/page.tsx?raw';
import { populateStats, type StatContent } from './populate';
import doctorTwinSource from './[slug]/Doctor.stories.tsx?raw';
import doctorPageSource from './[slug]/page.tsx?raw';
import teamTwinSource from './Team.stories.tsx?raw';
import teamPageSource from './page.tsx?raw';
import { STAT_ICONS, toStatTiles } from './stat-tiles';

// stat-tiles — the one JSX step every „în cifre" page takes, pinned where it
// is written (G2-R2 tier 3, react F1 / typescript F1; moved up from ./[slug]/
// with its module on 2026-10-01, when Home and the Team page began to draw
// tiles too). Four things, each the half of the promise a play cannot see:
// the glyphs are aria-hidden, so no role query reaches them, and a swapped
// drawing would have been photographed as the truth.
//   · THE TABLE: each of the four ids draws ITS glyph, and the four are four
//     different components.
//   · THE STEP: a stat row becomes a tile with its id as the key, its glyph
//     picked by that id, every word and number passed through, and `suffix`
//     carried exactly when the row has one.
//   · THE CLINIC'S THREE: lib/team's `clinicStats`, walked and drawn the way
//     Home and the Team page do it, come out as the calendar, the people and
//     the tooth — the owner's experience, patients and procedures.
//   · THE ONE COPY: SIX modules draw tiles — the doctor page and its twin, the
//     Team page and its twin, the Home page and its twin — and every one calls
//     `toStatTiles` from this module on ITS OWN exact import line, hands the
//     band the walk its page makes, and grows no table of its own again —
//     read off their source text, since no runtime assertion can see where a
//     mapping was written.
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
 * A consumer's source with its PROSE removed, so the "no table of its own"
 * guard polices code and not the comments that discuss the table by name —
 * block comments (JSX `{/* … *\/}` ones included) and `//` comments.
 *
 * A SCANNER since 2026-10-01, ../page-twins.test.ts' own (copied, not a new
 * copy: this file already carried one): the regular-expression pair the other
 * suites share reads a `/*` inside a LINE comment as a block opening and
 * swallows the code down to the next `*\/`, and four of the six sources below
 * write one in their headers (`Pages/*`, `src/messages/*.json`). In
 * Team.stories.tsx that swallowed the twin's whole band function — the very
 * JSX these guards read. Read in order, a `//` ends at its line, a block at
 * its close, and neither is looked for inside a string.
 */
const stripComments = (code: string): string => {
  let kept = '';
  let quote: string | null = null;
  let i = 0;
  while (i < code.length) {
    const char = code[i];
    const pair = code.slice(i, i + 2);
    if (quote !== null) {
      if (char === '\\') {
        kept += pair;
        i += 2;
        continue;
      }
      if (char === quote) quote = null;
      kept += char;
      i += 1;
    } else if (pair === '//') {
      const end = code.indexOf('\n', i);
      i = end < 0 ? code.length : end;
    } else if (pair === '/*') {
      const end = code.indexOf('*/', i + 2);
      i = end < 0 ? code.length : end + 2;
    } else {
      if (char === '"' || char === "'" || char === '`') quote = char;
      kept += char;
      i += 1;
    }
  }
  return kept;
};

/** Two Romanian rows, one with a suffix and one without (§15.7). */
const ROWS: readonly StatContent[] = [
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

describe('the clinic’s three — Home’s and the Team page’s tiles (owner, 2026-10-01)', () => {
  // The walk those two pages make, run here in every language: what a play
  // cannot see on either page is WHICH drawing each tile wears.
  it.each(locales)(
    'draws experience, patients and procedures as the calendar, the people and the tooth, in that order (%s)',
    (locale) => {
      const tiles = toStatTiles(populateStats(locale, clinicStats));

      expect(tiles.map((tile) => tile.id)).toEqual([
        'experience',
        'patients',
        'interventions',
      ]);
      expect(tiles.map((tile) => componentOf(tile.icon))).toEqual([
        CalendarCheck,
        People,
        ToothCheck,
      ]);
      expect(tiles.map((tile) => tile.label)).toEqual(
        clinicStats.map((stat) => stat.words[locale].label),
      );
    },
  );
});

/** The walk Home and the Team page hand the band — the clinic's own rows. */
const CLINIC_WALK = 'toStatTiles(populateStats(locale, clinicStats))';

/**
 * EVERY MODULE THAT DRAWS TILES, with the one import line it must carry (its
 * own relative path to this module, so a second copy beside it could not
 * satisfy the pin) and the tiles it must hand the band: a doctor page walks
 * his rows, Home and the Team page the clinic's.
 */
const CONSUMERS = [
  [
    './[slug]/page.tsx',
    doctorPageSource,
    "import { toStatTiles } from '../stat-tiles';",
    'toStatTiles(page.stats)',
  ],
  [
    './[slug]/Doctor.stories.tsx',
    doctorTwinSource,
    "import { toStatTiles } from '../stat-tiles';",
    'toStatTiles(page.stats)',
  ],
  [
    './page.tsx',
    teamPageSource,
    "import { toStatTiles } from './stat-tiles';",
    CLINIC_WALK,
  ],
  [
    './Team.stories.tsx',
    teamTwinSource,
    "import { toStatTiles } from './stat-tiles';",
    CLINIC_WALK,
  ],
  [
    '../(home)/page.tsx',
    homePageSource,
    "import { toStatTiles } from '../team/stat-tiles';",
    CLINIC_WALK,
  ],
  [
    '../(home)/Home.stories.tsx',
    homeTwinSource,
    "import { toStatTiles } from '../team/stat-tiles';",
    CLINIC_WALK,
  ],
] as const;

describe('the ONE copy — every page that draws tiles, and its twin, calls this module', () => {
  it('knows all six: three pages, three twins', () => {
    expect(CONSUMERS).toHaveLength(6);
    expect(new Set(CONSUMERS.map(([where]) => where)).size).toBe(6);
  });

  it.each(CONSUMERS)(
    '%s imports toStatTiles on its own exact line, and nothing else of this module',
    (_, source, line) => {
      expect(source.split('\n')).toContain(line);
      // ONE import of this module per file: a second line, or the table
      // pulled in beside the step, would read past the exact line above.
      expect(
        source.match(/from '(?:\.\.?\/)+(?:team\/)?stat-tiles';/g),
      ).toEqual([line.slice(line.indexOf('from '))]);
    },
  );

  it.each(CONSUMERS)(
    '%s hands the band the walk its page makes, once',
    (_, source, _line, walk) => {
      const code = stripComments(source);
      expect(code).toContain(`tiles={${walk}}`);
      expect(code.match(/\btoStatTiles\(/g)).toHaveLength(1);
    },
  );

  it.each(CONSUMERS)(
    '%s keeps no glyph table and no glyph import of its own',
    (_, source) => {
      const code = stripComments(source);
      expect(code).not.toMatch(/\bSTAT_ICONS\b/);
      expect(code).not.toMatch(/@\/assets\/glyphs\//);
    },
  );
});
