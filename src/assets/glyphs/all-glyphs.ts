import { Burger } from './Burger';
import { ChevronLeft } from './ChevronLeft';
import { ChevronRight } from './ChevronRight';
import { Close } from './Close';
import { Instagram } from './Instagram';
import { Phone } from './Phone';
import { Pin } from './Pin';
import { Star } from './Star';
import { Tiktok } from './Tiktok';
import { Whatsapp } from './Whatsapp';

// HAND-MAINTAINED — the ONE list of every glyph component in this folder.
// The compile-checked registry died with the whole-svg pattern refactor
// (board 2026-08-16, accepted down §5·2-2): nothing fails automatically when
// a new glyph file is missing here — the gallery story and the frame-contract
// tests simply won't cover it. So: ADDING A GLYPH FILE = ADDING A ROW HERE,
// in the same commit (./README.md checklist, step 5).
// Alphabetical by name; the name is the exported component's own name.
export const ALL_GLYPHS = [
  ['Burger', Burger],
  ['ChevronLeft', ChevronLeft],
  ['ChevronRight', ChevronRight],
  ['Close', Close],
  ['Instagram', Instagram],
  ['Phone', Phone],
  ['Pin', Pin],
  ['Star', Star],
  ['Tiktok', Tiktok],
  ['Whatsapp', Whatsapp],
] as const;
