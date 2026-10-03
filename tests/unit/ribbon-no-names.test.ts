import { describe, expect, it } from 'vitest';
import {
  codeOnly,
  RIBBON_FILES,
  sourceOf,
  withoutComments,
} from './ribbon-fence.ts';

// THE RIBBON RECOGNISES NOTHING BY ITS NAME (CLAUDE.md §15.26). The ribbon
// prototype's one serious bug: its painter recognised a segment by
// `seg.constructor.name`, the minified build renamed the classes, and the
// first minified page drew every wave as one straight bar — while every test
// of the unminified source passed. A minifier renames classes and functions,
// never the DATA a module writes, so the port carries each segment's `kind` as
// data and this fence keeps the old habit out of the ribbon's product files:
// no `class` in any form, no `constructor` at all, no `name` read — as a
// member, as a computed member, destructured, or through Reflect (a
// function's `name` is exactly what a minifier changes, and the ribbon's own
// objects are held by variable or by a key of a record, never looked up by
// the `name` they carry) — and no `Object.prototype.toString` or
// `Function.prototype` tag tricks.
//
// TWO READINGS OF EACH FILE (tests/unit/ribbon-fence.ts, the ribbon fences'
// one copy of them). CODE ONLY: comments and strings are stripped first — the
// files explain this very bug in prose, and an error message may mention a
// name — but a template literal that interpolates (`${`) is code, and stays.
// And the text with its comments stripped and its STRINGS KEPT: a string
// that IS one of the two names is how a computed member reaches them
// (`seg["constructor"]`, `Reflect.get(seg, "name")`). The files are
// ribbon-fence.ts's RIBBON_FILES — every module of the ribbon but its tests
// and its recorded numbers, and the atom; the last case proves the matchers
// still have teeth.

const IN_CODE: ReadonlyArray<readonly [string, RegExp]> = [
  ['a class', /\bclass\b/],
  ['a constructor', /\bconstructor\b/],
  ['a .name read', /\.\s*name\b/],
  [
    'a destructured name',
    /\{[^{}]*\bname\b[^{}]*\}\s*=(?![=>])|\(\s*\{[^{}]*\bname\b[^{}]*\}\s*(?::[^()]*)?\)\s*(?:=>|\{)/,
  ],
  ['a toString tag trick', /Object\s*\.\s*prototype\s*\.\s*toString/],
  ['a Function.prototype read', /Function\s*\.\s*prototype/],
];

const IN_STRINGS: ReadonlyArray<readonly [string, RegExp]> = [
  ['a string that is a name', /(['"`])(?:constructor|name)\1/],
];

/** What a source is caught by, in both readings. */
function caught(source: string): string[] {
  const code = codeOnly(source);
  const text = withoutComments(source);
  return [
    ...IN_CODE.filter(([, pattern]) => pattern.test(code)),
    ...IN_STRINGS.filter(([, pattern]) => pattern.test(text)),
  ].map(([what]) => what);
}

describe('the ribbon recognises nothing by its name (§15.26)', () => {
  it('reads every module of the ribbon, and the atom', () => {
    expect(RIBBON_FILES).toEqual(
      expect.arrayContaining([
        'src/lib/ribbon-model/ribbon-model.ts',
        'src/lib/ribbon-layout/ribbon-layout.ts',
        'src/lib/ribbon-paint/ribbon-paint.ts',
        'src/lib/ribbon-draw/ribbon-draw.ts',
        'src/components/ui/Ribbon/Ribbon.tsx',
      ]),
    );
    expect(RIBBON_FILES.some((file) => /\.(test|golden)\.ts$/.test(file))).toBe(
      false,
    );
  });

  it.each(RIBBON_FILES)('%s — none of the forbidden forms', (file) => {
    const source = sourceOf(file);
    // The fence never passes vacuously: every file is real code.
    expect(codeOnly(source).length).toBeGreaterThan(1_000);
    expect(caught(source)).toEqual([]);
  });

  it('has teeth: every spelling of the prototype’s habit is caught, and prose about it is not', () => {
    for (const habit of [
      'if (KIND[seg.constructor.name] === "wave") return 32;',
      'class Wave extends Seg {}',
      'const Wave = class {};',
      'const kind = seg["constructor"]["name"];',
      'const { constructor } = seg;',
      'const { name } = fn;',
      'const kinds = segments.map(({ name }) => name);',
      'function kindOf({ name }: Seg) { return name; }',
      'const label = `${seg.constructor.name}`;',
      'const tag = Reflect.get(seg, "constructor");',
      "const own = Object.getOwnPropertyDescriptor(fn, 'name');",
    ]) {
      expect(caught(habit), habit).not.toEqual([]);
    }
    const prose =
      '// it read seg.constructor.name\n' +
      'const kind = \'class Wave\'; const label = "fn.name";\n' +
      'const text = `a class of its own`;\n' +
      'const drop = { kind: "line", name, start: 0 };';
    expect(caught(prose)).toEqual([]);
  });
});
