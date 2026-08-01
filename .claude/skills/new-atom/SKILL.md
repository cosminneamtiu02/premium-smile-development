---
name: new-atom
description: Build or rework one ui/ atom for Premium Smile — branch-first, locate (old repo for migration, new repo for rework), prop-contract-first, executable spec (tests + skeleton story), live-story build, machine+agent gates, expected-diff visual regression, all-viewport pack for owner approval, PR into develop. One run = one atom = one branch. Use when the owner asks for a new atom, to migrate a component, or to change an existing atom.
---

# /new-atom — one atom, one branch, one PR

## When to Use

- `/new-atom "<description>"` — e.g. `/new-atom "the star rating row under the doctor names"`.
- Plain language: "I need a new atom…", "migrate the … component" (the `suggest-new-atom`
  hookify rule points here), or **"change/extend/rework the … atom"** → run in `rework` mode.
- Phase 2 of `MIGRATION_PLAYBOOK.md` order: `Image` → `Heading`/`Text` → `Button` → `Icon`
  → `Card` → `Badge`/`Tag`.

Read `CLAUDE.md` first (§6, §8, §9, §13, §15.7–8). Old project is **read-only**:
`/Users/cosminneamtiu/Work/premium-smile-webpage`.

**Modes:** `migrate` (old component → new atom) · `rework` (existing NEW atom changes).
**Owner's roles:** describe at the start · point-and-approve the pack · say "commit it" ·
merge the PR. Promotion `develop → main` is **entirely owner-timed** — many atom branches
merge into develop in parallel; main waits until the owner feels develop is ready.

## How It Works

Stop-and-ask only for: ambiguous mapping, merge/drop verdicts, brief-§15 parked decisions.

### S0 · BRANCH
`git switch -c migrate/<atom>` (or `fix/…`, `rework/…`) off up-to-date `develop`.
Parallel branches for different atoms are normal and expected.

### S1 · LOCATE
- **migrate:** search the old repo (`shared/components/ui/` → `composite/` → `pages/` →
  `example/premium-smile (1)/`). Extract requirements only — copying styles/code is forbidden.
  Known deltas: old `card` (composite) → `ui/Card`; `ContactModal`/`ui/Image` have no old
  counterpart (brief spec only); old `map-frame` → §12-compliant static-map link.
- **rework:** locate the atom in THIS repo + **every usage via TypeScript LSP references**
  (§6.6: a prop change updates every usage + story in the same commit).

### S2 · SMELL-TAG / IMPACT → inventory
- migrate: tag smells (hardcoded strings, margins, px, global CSS, `t()` in atom, shadcn
  APIs, old tokens, dark/brand logic) → `MIGRATION_INVENTORY.md` row (`rewrite|merge|drop`).
- rework: impact analysis (which consumers/stories change) → inventory row amendment.
- **Declare the expected-diff manifest now:** the exact story IDs whose pixels are allowed
  to change in stage V (migrate: only the new atom's stories; rework: its stories + the
  knowingly-affected consumers; token/global restyle: declared-global with representative
  stories named). Declared BEFORE building — never after seeing the diffs.

### S3 · PROP CONTRACT
The atom's TypeScript props interface, before any implementation: variants as typed props;
content via `children`/slots; `aria-label` required by the types when children may be
non-text (§6.3); semantic tokens only; `rem`; no outer margins; container queries;
`'use client'` only if inherently stateful (justified in PR). Consult `ecc:react-patterns`
+ `ecc:coding-standards`; Context7 for exact-minor APIs; verify with the TypeScript LSP.

### S4 · EXECUTABLE SPEC — failing tests + skeleton story
Via `ecc:react-test`: Vitest + RTL role queries, **Romanian fixtures with diacritics**;
tests exist and fail. **Create the skeleton story now** — argTypes mirroring the S3
contract. The story is the spec made visible, not documentation written afterwards.

### S5 · BUILD — with the live story open
Implement against the running Storybook, inspecting the story **across widths
continuously** (Storybook viewport toolbar / chrome-devtools `resize_page`). Nothing about
the atom's look should be a surprise later. Tailwind utilities; focus-visible;
motion-reduce; props spread; `ref` as prop; `className` merged.

### S6 · FINALIZE STORIES
One story per state, controls wired, Romanian demo args ("Programează-te", "Ședință de
consultație"), DE-longest-word + pseudo-locale **stress variants**, opt-in 320 tag when
layout-relevant.

### G1 · MACHINE GATE
`npx tsc --noEmit` · `npm run lint` · `npx prettier --check .` · `npm run test -- --run` ·
`npm run build-storybook` · axe = 0 violations. Red → `/debug-deep`. Never tweak-and-retry.

### G2 · AGENT GATE
`ecc:react-reviewer` + `ecc:typescript-reviewer` (parallel); `ecc:a11y-architect` for
interactive atoms. Verify findings before applying; CRITICAL/HIGH → S5.
**Iteration economy:** on pack-annotation loops, G2 re-runs **only if the diff since the
last G2 touches types/logic** — pure class-string/token tweaks skip straight to V.

### V · REGRESSION NET (before the owner sees anything)
`npm run visual -- --workers=2` (native darwin set; Storybook already built at G1).
Result must **match the S2 manifest exactly**: every declared story diff present-or-updated,
**zero undeclared diffs**. Undeclared diff → `/debug-deep` (it's a regression, not noise).
New-atom baselines are created here via `npm run visual:update` scoped to the new stories.
(Phase 0 adds the tiny comparator script that checks the Playwright report against the
manifest.)

### S7 · VISUAL PACK → owner
Screenshot every story at **320 · 390 · 768 · 1280 · 1536 · 1920** (chrome-devtools MCP,
native) + stress variants; assemble the canvas review page (screenshot grid + prop contract
+ advisory notes). Owner annotates (→ S5) or approves. Pack shots are **not** baselines.

### S8 · READY → seal (owner-gated)
After Approve: wait on the branch. On the owner's **"commit it"**:
1. fast V re-run (confirm nothing moved since approval);
2. evidence summary per `ecc:verification-loop`;
3. ONE commit (atom + stories + tests + inventory + darwin baselines); `ecc:checkpoint`;
4. push the branch and open the PR into `develop` (PR template boxes filled) — **the owner
   merges** (squash).

**After parallel branches merge into develop:** run `npm run visual` once on develop — the
integration check for atoms that landed side by side. The linux baseline set refreshes via
the `visual-baseline.yml` workflow whenever the owner prepares a `develop → main` promotion.

## Examples

- `/new-atom "the green CTA button"` → migrate: old `ui/button` → new `ui/Button`.
- `/new-atom rework: Button needs a 'tone' prop` → rework mode: LSP references over this
  repo, manifest declares Button stories + affected consumers, §6.6 one-commit discipline.
- "I need a new atom for the eyebrow labels" → hookify suggests this skill → old
  `ui/eyebrow` → `ui/Eyebrow` (JetBrains Mono token, wide tracking).
- Token change ("darken the accent green") → not an atom: same pipeline from S2's manifest
  (declared-global) + representative-story pack; consider promoting to `/retoken` if frequent.
