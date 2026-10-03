// lib/initials — the two-letter monogram as ONE value type and ONE guard,
// React-free (CLAUDE.md §4's foundation ring; fenced by
// tests/unit/lib-react-free.test.ts). Born in the reviews-deck run (master
// board fb-432…448, 2026-09-10): the owner's brief says a reviewer without a
// picture shows "2 letters turned to caps … if more than 2 letters, error".
//
// WHY A LIB MODULE — the same reason as lib/rating: ui/Avatar (its `initials`
// prop) and the data list in lib/reviews must mean the same thing, the atom may
// not import lib DATA and the ring may not depend on the spine, so the meaning
// sits below both as MECHANICS (the lib/scroll-lock precedent).
//
// THE TYPE IS THE EARLY ERROR. `Initials` is a template-literal type over the
// capitals the site's five languages use — the 26 Latin letters plus Romanian
// Ă Â Î Ș Ț (comma-below, U+0218/U+021A — the forms the font subset carries,
// §8.8; the legacy cedilla forms are deliberately absent), German Ä Ö Ü, and the
// French/Italian accented capitals. Two positions over that alphabet is a union
// of a few thousand members — trivial for the compiler — and it is what turns
// `initials: 'AND'` (three letters) or `'ap'` (lowercase) in the owner's list
// into a red squiggle and a failed `tsc` before anything renders. The list is
// typed data, not JSON, precisely so this check can exist (board D2).
//
// THE GUARD IS THE BELT, AND IT IS LOOSER ON PURPOSE. Past the compiler a
// value may arrive as any string (a cast, a story control), and the runtime
// question is only the owner's: "exactly two letters?" — any script, any case,
// because CSS `uppercase` does the shouting (the ui/Eyebrow rule: the browser
// owns Ș/Ț case mapping, the string stays as typed). So the guard is named
// for what it checks, `isTwoLetters`, and returns a PLAIN boolean: a
// `value is string` predicate would claim more than it checks and — worse —
// on its FALSE branch narrow an input that was already a `string` to `never`
// (TypeScript subtracts a predicate's type from the input on that branch),
// which the G3 typescript round measured with a compiler probe.
// `assertTwoLetters` keeps its `asserts value is string`: an assertion narrows
// only the path that did not throw, which is honest.
//
// THE ALPHABET IS THE OWNER'S TO GROW, one line at a time: a reviewer whose
// initial is outside `Cap` is a name, not an error — add the capital HERE,
// in the same commit as the row, never a cast at the row (the runtime belt
// below accepts any letter and would pass the cast silently).

type LatinCap =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';
type RomanianCap = 'Ă' | 'Â' | 'Î' | 'Ș' | 'Ț';
type GermanCap = 'Ä' | 'Ö' | 'Ü';
type FrenchItalianCap =
  'É' | 'È' | 'Ê' | 'Ë' | 'À' | 'Ç' | 'Ì' | 'Ò' | 'Ô' | 'Ù' | 'Û' | 'Ï';
/** The Hungarian capitals a Transylvanian clinic meets — a minority-language name is a name (G3 typescript L4). */
type HungarianCap = 'Á' | 'Í' | 'Ó' | 'Ú' | 'Ő' | 'Ű';

/** One capital letter of the site's five languages — plus the Hungarian ones its patients carry. */
export type Cap =
  LatinCap | RomanianCap | GermanCap | FrenchItalianCap | HungarianCap;

/** Exactly two capitals — the compile-time half of "more than 2 letters = error". */
export type Initials = `${Cap}${Cap}`;

/** Two letters of any script and any case, nothing else — the runtime belt. */
const TWO_LETTERS = /^\p{L}{2}$/u;

export function isTwoLetters(value: unknown): boolean {
  return typeof value === 'string' && TWO_LETTERS.test(value);
}

/**
 * @throws RangeError when `value` is not exactly two letters — the lib/clock
 * `createClock` style: the caller's name first, the received value last.
 */
export function assertTwoLetters(
  value: unknown,
  caller: string,
): asserts value is string {
  if (!isTwoLetters(value)) {
    throw new RangeError(
      `${caller}: initials must be exactly two letters; received ${typeof value === 'string' ? JSON.stringify(value) : String(value)}.`,
    );
  }
}
