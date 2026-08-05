---
name: classify-component
description: Decide whether one old-repo (premium-smile-webpage) component lands as a ui/ atom or a sections/ composition — import-graph rubric with inventory precedence, drop and promotion rules, smell flags. Invoked per unknown node by /section-breakdown; run standalone whenever a component's tier is unclear or disputed. Verdicts feed ledger rows and dossiers.
---

# /classify-component — atom or section, decided by the import graph

## One principle

**The import graph decides. Folders lie.** In the old repo, `ShowcaseLine` is a leaf filed
under `composite/`, while `SectionHeading` lives in `composite/` yet is reused like an atom
by 6 consumers. Never classify by directory, filename, or size — only by what the component
imports and who consumes it.

## Inputs

- An old-repo component path under
  `/Users/cosminneamtiu/Work/premium-smile-webpage/apps/frontend/src/` (read-only), **or**
- a component with **no old counterpart** (e.g. `LanguageSwitcher`) plus its intended
  composition from `CLAUDE.md` §14.

## Evidence to gather (before any verdict)

1. **Custom imports** of the component file: every `from '@/…'` / relative import that is a
   component — exclude `cn`/`lib` utils, hooks, and type-only imports.
2. **Consumer count**: importers across the old `src/`, excluding `*.stories.tsx`,
   `*.test.tsx`, `*.a11y.test.tsx`:
   `grep -rl "components/<full/path/suffix>" /Users/cosminneamtiu/Work/premium-smile-webpage/apps/frontend/src --include='*.tsx' | grep -vE '(stories|test)'`
   — use the full path suffix (3-level paths like `composite/doctor-showcase/line` exist);
   before declaring 0 consumers, confirm no barrel re-export shadows the direct path.
3. **Existing verdicts**: the component's row in `MIGRATION_INVENTORY.md`, if any.

## The rubric — apply in order, first match wins (rules 4–5 are modifiers)

| # | Test | Verdict |
| --- | --- | --- |
| 0 | An inventory row already records an owner verdict of `rewrite`/`merge`/`drop`/`reuse` (e.g. `ui/rich-text` → drop, fb-22) | **that verdict stands** — recorded owner decisions outrank the rubric. Scope/scheduling notes ("out of scope this run") are advisory — still classify |
| 1 | Zero app consumers in the old repo (stories/tests only) | **propose `drop`** — inventory row; needs the owner's recorded approval |
| 2 | Renders only native HTML/SVG/library elements — no custom-component imports, no component-shaped slots (generic `children` pass-through does **not** count) | **atom** → `ui/` |
| 3 | Composes ≥1 custom component, or exposes a **component-shaped slot** — a *named prop* the §14 composition fills with a specific component (`icon=`, `actions=`). Generic `children` accepting arbitrary content never triggers this rule: `Stack`/`Container`-style wrappers are atoms | **section** → `sections/` — `/section-breakdown` recurses into it |
| 4 | Used by ≥2 distinct sections/pages (§4 promotion rule, primitives-only reading per the §15.12 canvas-approved rubric) | modifier: strengthens **atom**; if it also composes atoms it stays a **section**, but an *early-wave* one — schedule before its consumers |
| 5 | Smells present: `t()`/i18n read inside a leaf, portals, window listeners, measurement effects, hardcoded URLs/content, zero-props components | modifier: record as **required-rewrite notes** on the dossier — never silently "fixed", never changes the tier by itself |

New-builds without an old counterpart: classify by intended composition (§14 content
model) — composes atoms → section; pure primitive → atom.

## Verdict row (append to the run's ledger; one line per node)

```
| <Node> | <old path or NEW> | atom|section|rework|reuse|drop | <evidence: leaf / composes X,Y / 0 consumers> | <n consumers> | <smells or —> |
```

(Six columns — matches the ledger template's Verdicts table exactly.)

## Worked examples (ground truth — the eval fixture must reproduce these)

- `composite/doctor-showcase/line` → **atom**. Leaf (inline SVG + pure util import) despite
  the `composite/` folder.
- `composite/section-heading` → **section, early wave**. Composes Eyebrow + Heading + Stack
  (rule 3 beats rule 4 for placement); 6 consumers (rule 4 schedules it first).
- `composite/doctor-showcase/doctor-card` → **section**. Composes SectionHeading, Button
  (reuse `ui/Button`), RichText (rule 0: dropped per fb-22 — `t.rich()` at section level).
- `ui/date-time` → **drop** (rule 1: 0 consumers) + smell recorded: `useTranslation()`
  inside a `ui/` leaf — evidence for the §8.1 rewrite pattern even though it's dropped.
- `composite/footer` → **section** + smells: zero props, i18n reads, hardcoded social URLs,
  `window.scrollTo` — full props-in rewrite notes on its dossier.

## Common traps

- **The SectionHeading paradox**: heavy reuse does NOT promote a composite to `ui/` — §4
  promotion applies to primitives. Composing atoms keeps it in `sections/`; reuse only moves
  it earlier in the build order.
- **Smells never reclassify.** A portal or i18n read in a leaf is a rewrite note, not a
  reason to call it a section.
- **Drop still records smells** — dropped components often prove a pattern the new repo must
  avoid; the note travels to the inventory row.

## Verification

Eval fixture: `.claude/evals/classify-component.md` — 25 ground-truth rows, code-graded
(exact verdict match), target pass^3 = 1.0, plus two competing-pressure scenarios. Re-run
the fixture whenever this rubric changes.
