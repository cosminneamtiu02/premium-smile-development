import { FranceFlag } from './FranceFlag';
import { GermanyFlag } from './GermanyFlag';
import { ItalyFlag } from './ItalyFlag';
import { RomaniaFlag } from './RomaniaFlag';
import { UnitedKingdomFlag } from './UnitedKingdomFlag';

// HAND-MAINTAINED — the ONE list of every flag component in this folder, the
// all-glyphs.ts pattern verbatim: nothing fails automatically when a new flag
// file is missing here — the Gallery story and the frame-contract tests simply
// won't cover it. So: ADDING A FLAG FILE = ADDING A ROW HERE, in the same
// commit. Alphabetical by name; the name is the exported component's own name.
export const ALL_FLAGS = [
  ['FranceFlag', FranceFlag],
  ['GermanyFlag', GermanyFlag],
  ['ItalyFlag', ItalyFlag],
  ['RomaniaFlag', RomaniaFlag],
  ['UnitedKingdomFlag', UnitedKingdomFlag],
] as const;
