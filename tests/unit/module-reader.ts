import ts from 'typescript';

// THE READER — one TypeScript module, read as the TypeScript compiler parses
// it. Not a test itself (the unit project collects `*.test.ts` only): the
// helper its readers import, the shape tests/unit/ribbon-fence.ts set. Moved
// here from tests/unit/lib-react-free.test.ts on 2026-10-21 (round 1 of
// lib/visible-text's review), when a second test needed it to compare the
// blog's two parsers' three byte-identical checks; round 2 of that review
// (the same day) moved the three into lib/json-shape and deleted that test
// with them. Its readers: the two import fences of lib-react-free.test.ts.
//
// THE READER (2026-10-21) parses each module with the TypeScript compiler, the
// parser tsc itself runs, and walks the syntax tree: a comment, a string, a
// template's text and a regular expression are never read as code, and code
// is never mistaken for prose. Until that day the fences read source TEXT
// with regular expressions, and the round-2 review found where they failed: a
// dynamic import whose path was concatenated, or which carried a second
// argument (`{ with: … }`), was not read at all, though Next bundles both
// (measured in a scratch Next app, Turbopack and webpack); a regular
// expression holding a block-comment opener hid every import after it up to
// the next closer; an import() in a TYPE position, which the compiler erases,
// was read as a value; a default import named `type` read as type-only. Every
// form one module names another by is read: the import declarations (static,
// side-effect, deferred, type-only), the re-exports, `import x = require()`,
// a dynamic `import()` (its second argument ignored), `require()`, and an
// `import()` in a type. A path built at run time (a template with `${…}`, a
// `+`, a variable) is reported as COMPUTED, its source text standing in for
// the path.

/** One module a source names, as the reader found it. */
export type ImportUse = Readonly<{
  /** The path as written — or, when `computed`, the argument's source text. */
  specifier: string;
  /** Erased before any bundler runs: `import type …`, braces whose every name
   *  says `type`, `export type …`, `import type x = require()`, and an
   *  `import()` in a TYPE position (`typeof import('x')`, `import('x').T`). */
  typeOnly: boolean;
  /** A path built at run time: no reader can tell which module it names. */
  computed: boolean;
}>;

/** What the reader makes of one module. */
export type ModuleReading = Readonly<{
  /** Does the module's directive prologue hold 'use client'? */
  client: boolean;
  uses: readonly ImportUse[];
}>;

/** Braces whose every name says `type` (`{ type A, type B }`). Empty braces,
 *  a namespace or one plain name are values. */
const everyNameIsType = (
  bindings: ts.NamedImportBindings | ts.NamedExportBindings | undefined,
): boolean =>
  bindings !== undefined &&
  (ts.isNamedImports(bindings) || ts.isNamedExports(bindings)) &&
  bindings.elements.length > 0 &&
  bindings.elements.every((element) => element.isTypeOnly);

/** Each text is parsed once, however many copies of src the teeth build. */
const READINGS = new Map<string, ModuleReading>();

/**
 * THE READER: `source`, the module `file` (its extension picks the TS or the
 * TSX grammar), as the TypeScript compiler parses it — whether it is a client
 * module, and every module it names (the header lists the forms).
 */
export const readModule = (file: string, source: string): ModuleReading => {
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const key = `${kind}\u0000${source}`;
  const known = READINGS.get(key);
  if (known !== undefined) return known;
  const tree = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    false,
    kind,
  );
  const uses: ImportUse[] = [];
  const name = (path: ts.Node | undefined, typeOnly: boolean): void => {
    if (path === undefined) return;
    uses.push(
      ts.isStringLiteralLike(path)
        ? { specifier: path.text, typeOnly, computed: false }
        : { specifier: path.getText(tree), typeOnly, computed: true },
    );
  };
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      name(
        node.moduleSpecifier,
        clause !== undefined &&
          (clause.phaseModifier === ts.SyntaxKind.TypeKeyword ||
            (clause.name === undefined &&
              everyNameIsType(clause.namedBindings))),
      );
    } else if (ts.isExportDeclaration(node)) {
      name(
        node.moduleSpecifier,
        node.isTypeOnly || everyNameIsType(node.exportClause),
      );
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      name(node.moduleReference.expression, node.isTypeOnly);
    } else if (ts.isImportTypeNode(node)) {
      name(
        ts.isLiteralTypeNode(node.argument)
          ? node.argument.literal
          : node.argument,
        true,
      );
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require'))
    ) {
      name(node.arguments[0], false);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  // The directive prologue: the bare string statements a module opens with.
  let client = false;
  for (const statement of tree.statements) {
    if (
      !ts.isExpressionStatement(statement) ||
      !ts.isStringLiteral(statement.expression)
    ) {
      break;
    }
    if (statement.expression.text === 'use client') {
      client = true;
      break;
    }
  }
  const reading: ModuleReading = { client, uses };
  READINGS.set(key, reading);
  return reading;
};
