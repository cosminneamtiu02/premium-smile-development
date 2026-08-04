---
name: new-section
description: Build or rework one sections/ composition for Premium Smile — dossier-first (from /section-breakdown workspaces), claim-then-lane, children-merged precondition, composition contract with owner-authored five-locale strings, section-builder dispatch (Opus), machine+agent gates incl. translation parity, pinned-viewport stories + all-width pack, READY + evidence, PR into develop on the owner's per-lane "commit it". One run = one section = one branch = one PR. Use when the owner asks to build or change a section, or points at a section dossier.
---

# /new-section — one section, one branch, one PR

## When to Use

- `/new-section from <dossier path>` — the normal path: a `/section-breakdown` workspace
  produced `sections/<Name>.md`.
- `/new-section "<description>"` — no workspace covers it → run `/section-breakdown` first;
  this skill builds, it does not decompose.
- Rework of an existing `sections/` component runs the same stages with an impact analysis
  instead of a dossier (LSP references over this repo, §6.6 one-commit discipline).

Read `CLAUDE.md` first (§4, §6, §8, §9, §13, §14, §15.7, §15.12). Sections are the tier
that calls `t()` (§8.1) — atoms stay locale-agnostic.

**Owner's roles:** approve the composition contract (board) · supply the five-locale
strings (§8.10 — translations are owner-authored) · point-and-approve the pack · say
"commit it" per lane · merge the PR.

### Model routing (owner rule: Fable coordinates/reviews, Opus builds)

Planning and judgment run in the **main loop**: N0–N2, every canvas interaction, G2
finding-verification, V, N4, N5. The mechanical build **N3 is dispatched in ONE Agent call**
to `section-builder` (`.claude/agents/section-builder.md`, pinned `model: opus`). On return
the main loop **re-runs G1 itself** (trust but verify). G2 reviewers = the project-shadow
agents `react-reviewer` + `typescript-reviewer`, plus `a11y-architect` for anything
stateful/interactive (dispatch the UNSCOPED names — project scope beats plugin). Consult
`ecc:react-patterns` + `ecc:frontend-a11y` while shaping the contract (preventive, not a
substitute for the gate).

## Stages

### N0 · CLAIM (no lane yet)
Claim the component's epic issue **before touching anything**:
`ECC_ROOT=$(ls -d ~/.claude/plugins/cache/ecc/ecc/*/ | sort -V | tail -1)` then
`node "${ECC_ROOT}scripts/github-coordination.js" claim <n> --repo <owner/repo> --actor <session> --branch <migrate|rework>/<name>`.
Already claimed by someone else → **stop and report**. The lane is **not** created here —
an N1 halt must strand no worktree and no cap-2 slot.

### N1 · PRECONDITION — children merged, then the lane
Every row of the dossier's Children table must be `merged` (ledger + closed issues). Not
yet → **halt**, list blockers, offer the `sync` + `unblock` sweep, and follow the glue
file's halt/abandon recovery so the claim doesn't stay stuck. On pass, create the lane —
branched off `develop` **after** those merges so it composes real code (§4 dependency
direction): another lane/session active (cap 2, owner fb-67) → worktree per
`references/lane-and-epic-glue.md`; otherwise a plain branch off up-to-date `develop`
(`/new-atom` S0 parity).

### N2 · CONTRACT
Composition contract + message-namespace plan from the dossier. Dossier status `approved`
settles slots/props/layout **only** — if any message key lacks its five owner-authored
values (RO-only rows), collect them from the owner now; **N3 is blocked until every key
carries all five** (§8.10: the parity test checks key sets, not authorship, so invented
translations would pass silently). Not yet approved: board on the canvas (contract,
slots/props, layout plan, namespace table incl. all five locale columns) and `await` the
verdict. **The namespace table carries all five locale columns —
the owner fills them at approval; no key ships without its five values** (§8.10, parity
test). Rework mode: manifest declares the section's stories + knowingly-affected consumers.

### N3 · DISPATCH → `section-builder` *(Opus, one Agent call)*
Payload: approved composition contract (slots, props, layout, children import paths) ·
message-key allowlist **with five-locale values** · interaction-test list · fixtures ·
expected-diff manifest · section path `src/components/sections/<Name>/` · lane root.
Contract friction returns to this loop — never into improvised code.

### G1 · MACHINE GATE *(re-run by the main loop after N3 returns)*
`npx tsc --noEmit` · `npm run lint` · `npx prettier --check .` · `npm run test -- --run`
(includes the translation-parity test) · `npm run build-storybook` · axe = 0 · literal-string
sweep of the section's JSX (zero hardcoded user-facing strings, §17.4). Red → `/debug-deep`.

### G2 · AGENT GATE *(reviewers = Fable @ max effort)*
As in `/new-atom`: verify findings before applying; CRITICAL/HIGH → back to N3 scope.
Pack-annotation loops re-run G2 only when the diff touches types/logic.

### V · REGRESSION NET
`npm run visual -- --workers=2` in the lane. Must match the manifest exactly — zero
undeclared diffs (undeclared → `/debug-deep`). Section baselines: **390 + 1536** (§13).

### N4 · PACK → owner
Every story at **320 · 390 · 768 · 1280 · 1536 · 1920**, RO + DE variants for text-heavy
states; one `ecc:make-interfaces-feel-better` polish line (spacing/hit-areas/motion) as an
advisory note. Canvas pack board → owner annotates (→ N3 scope) or approves.

### N5 · READY → seal (owner-gated, per lane)
Pack approved → park at **READY + evidence** and wait. On the owner's **"commit it"**:
1. fast V re-run; 2. evidence summary per `ecc:verification-loop`; 3. **conflict radar** —
`<ecc-root>/scripts/worktree-lifecycle.js --base develop` (merge-tree prediction, trees
untouched); 4. ONE commit (section + stories + tests + message keys ×5 + inventory row +
baselines); `ecc:checkpoint`; 5. push, PR into `develop` (template's sections-tier boxes;
body `Closes #<n>` — develop is the default branch, so the merge auto-closes the issue) —
**the owner merges** (squash). After the merge: `sync` + `unblock` sweep (readies dependent
sections), run `npm run visual` once on develop (integration), lane cleanup via
`--cleanup-plan`.

## Examples

- `/new-section from .claude/section-runs/2026-08-05_10-30_top-bar/sections/Header.md` —
  children `LogoMark`/`Wordmark` merged → claim → lane → contract approved → build → PR.
- `/new-section "the footer"` → no workspace → `/section-breakdown "footer"` first (its
  dossier carries the zero-props → props-in rewrite notes).
- Rework: "Header needs a phone number in the bar" → impact analysis, §6.6, same gates.
