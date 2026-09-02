// THE named test viewports — §7's five sampling points (Smartphone 390 ·
// Tablet 768 · Notebook 1280 · Laptop 1536 · Desktop 1920) plus the 320px
// accessibility stress width, in one place. §7's letter reads "defined once
// in Storybook and reused by visual tests"; until org-review F13a they were
// hand-maintained TWICE — once as .storybook/preview.tsx's toolbar options,
// once as playwright.config.ts's project list — so a corrected height in one
// file was a silent disagreement with the other. Both now derive their shapes
// from the rows below; neither spells a number of its own.
//
// WHY tests/ AND NOT src/: both consumers are workbench and test
// infrastructure, never shipped code. Nothing under src/ imports this, no
// bundle contains it, and §4's dependency direction (app → sections → ui) has
// no opinion about a module the site never reaches. tests/ is where the other
// harness-owned modules already live.
// WHY NOT .storybook/, the home §7's own words name: "in Storybook" predates
// the second consumer — a module inside .storybook/ would have
// playwright.config.ts reaching into Storybook's config tree for pure
// geometry. The neutral harness root keeps §7's intent (ONE definition) for
// both consumers; §7's two stale words are recorded for the owner on the org
// board (F13a).
//
// BOTH DERIVED SPELLINGS ARE LOAD-BEARING, which is the reason this file is
// data and not a loop that invents names:
//   · the Storybook option KEYS ('laptop', 'smartphone', 'notebook',
//     'stress320') are cited verbatim by pinned stories as
//     `globals: { viewport: { value: 'laptop' } }`. Rename a key and those
//     stories silently fall back to the default viewport — no error anywhere,
//     just a baseline photographed at the wrong width;
//   · the Playwright project names, built as `w${width}`, are baked into every
//     snapshot FILENAME by snapshotPathTemplate (…-w1280-darwin.png). Rename a
//     project and every existing baseline orphans at once (169 at the time of
//     writing), and the suite reports them as missing rather than as changed.
// So `key` and `width` are not display details: they are identifiers other
// files already hold references to. Changing either is a deliberate migration,
// never a tidy-up.
//
// `key` is carried as a FOURTH field rather than derived from `name`: the F13a
// sketch had {name, width, height}, but 'Stress 320' → 'stress320' and
// 'Smartphone 390' → 'smartphone' follow no single rule, and a derivation that
// has to be right about every row is a worse contract than the row saying so.

export const VIEWPORTS = [
  { key: 'stress320', name: 'Stress 320', width: 320, height: 568 },
  { key: 'smartphone', name: 'Smartphone 390', width: 390, height: 844 },
  { key: 'tablet', name: 'Tablet 768', width: 768, height: 1024 },
  { key: 'notebook', name: 'Notebook 1280', width: 1280, height: 800 },
  { key: 'laptop', name: 'Laptop 1536', width: 1536, height: 864 },
  { key: 'desktop', name: 'Desktop 1920', width: 1920, height: 1080 },
] as const;
