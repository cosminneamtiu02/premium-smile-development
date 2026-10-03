---
name: section-breakdown
description: Break one old-repo section into a gitignored workspace of buildable dossiers — recursive walk with a live ledger (each node logged before descending), atom/section verdicts via /classify-component, one implementation dossier per component under atoms/ and sections/, master + per-component canvas boards, ECC epic issues as coordination state. Organizes only — never builds, never touches src/. Use when the owner points at an old section, says "break this into smaller separate pieces" / "break down …" / "decompose …" / "split … into components", or before any /new-section build that lacks a workspace.
---

# /section-breakdown — one old section in, one workspace of dossiers out

## When to Use

- `/section-breakdown "<old section>"` — e.g. `/section-breakdown "the top bar"`.
- Plain language: "break this into smaller separate pieces", "break down the footer",
  "decompose the hero" (the `suggest-section-breakdown` hookify rule points here).
- Before any `/new-section` build when no workspace exists for that section.

Read `CLAUDE.md` first (§4, §6, §8, §14, §15.7, §15.12). Old repo is **read-only**:
`/Users/cosminneamtiu/Work/premium-smile-webpage`.

**Owner's roles:** point at the section · watch the ledger grow on the master board ·
approve the decomposition (B3) · approve per-component boards (B4) · **trigger every build
personally** — this skill never starts one.

## Hard rules

1. **Organize only.** Never dispatch a builder, create a branch/worktree, or write to
   `src/`, `messages/`, or baselines. Output = workspace files + boards + issues +
   `MIGRATION_INVENTORY.md` rows for owner-approved verdicts (a file edit — commits stay
   owner-gated, §15.7).
2. **Ledger before descent** (owner fb-65): a node's row is appended and visible on the
   canvas **before** the walk recurses into it.
3. Workspace lives in gitignored `.claude/section-runs/` — the durable record remains
   `MIGRATION_INVENTORY.md` rows + canvas dates + epic issues, never the workspace itself.
4. Commits: none, ever, from this skill (§15.7 untouched).

## Stages

### B0 · INIT
`slug=$(kebab of old section)`; `run=.claude/section-runs/$(date +%Y-%m-%d_%H-%M)_$slug`;
create `$run/{atoms,sections}` + `$run/ledger.md` from
`references/ledger-template.md`. Open the master board now (B3's file is the ledger) so the
owner watches from the first row:
`ECC_ROOT=$(ls -d ~/.claude/plugins/cache/ecc/ecc/*/ | sort -V | tail -1)` then
`node "${ECC_ROOT}scripts/plan-canvas.js" open $run/ledger.md` (dynamic root — survives
ECC version bumps).

### B1 · WALK (recursive)
Locate the section in the old repo (the first three of `/new-atom` S1's four locations:
`shared/components/ui/` → `composite/` → `pages/`). For each node of its custom-import
tree:
1. **Match** against this repo — `src/components/ui/`, `src/components/sections/`, and
   `MIGRATION_INVENTORY.md` verdicts (recorded owner decisions outrank everything) →
   `reuse` | `rework` (+ exact prop-contract delta) | missing.
2. Missing → **`/classify-component`** (rules + smells; its rubric owns the verdict).
3. **Append the ledger Tree line, then descend** into section-verdict children
   (recursion) — and fill the node's Verdicts-table row in the same pass. Depth-mark every
   line (`d0` root, `d1`, `d2`…). The canvas live-reloads per append.

### B2 · DOSSIERS
One file per non-`reuse` node: `$run/atoms/<Name>.md` /
`$run/sections/<Name>.md` from `references/atom-dossier-template.md` /
`references/section-dossier-template.md`. Dossier statuses: `rework` · `to-develop` ·
`approved` · `ready` · `pr-open` · `merged` · `dropped?` (needs the owner's recorded
approval per inventory policy); `already-existing` is the **ledger-only** marker for
`reuse` nodes, which get no dossier. The **keep + parametrise** list = every `rework`
dossier's prop-delta section.

### B3 · MASTER BOARD verdict
The ledger (already on canvas) plus: verdict tables, the dependency DAG, wave order
(wave 1 = atoms, parallel ≤2; wave N = sections whose children merged), reworks-serialization
note (§6.6: one lane owns an atom's API at a time). `await` the verdict; annotate rounds
revise in place. **Approval unlocks B4 only — no build.** On approval, immediately append
every owner-approved `drop` (+ its smell notes) as a `MIGRATION_INVENTORY.md` row —
dossiers are gitignored, and without the row a later run's rule 0 finds nothing and
re-litigates a decided drop.

### B4 · FAN-OUT + EPIC INIT
- Per-component boards, all concurrent tabs: atoms via `/new-atom` S1–S3 evidence; sections
  via the composition-contract block of their dossier. Each board is its own file —
  `.claude/plans/<component>.plan.md` — opened with
  `node "${ECC_ROOT}scripts/plan-canvas.js" open <file>` (one tab per file). Board approval
  flips the dossier status to `approved`. A dossier left `to-develop` can be picked up later by any session,
  which then runs its board first.
- Epic issues per `../new-section/references/lane-and-epic-glue.md`: one-time label
  bootstrap; `gh issue create` per `to-develop`/`rework` component; section issues carry
  `## Tasks` checkboxes + `#N` child refs; sections claimed `--status blocked` from birth.
  Issue numbers written back into dossiers + ledger.

**Then stop.** Report the workspace path + board tabs + open approvals, and wait.

## Hand-off (why the workspace exists)

Every dossier is a self-contained work packet: purpose, consumption contract, prop
contract, fixtures, manifest, smells, issue `#N`, lane, and a run-me line. The owner points
**any fresh Claude session** at one file (`/new-atom from <path>` · `/new-section from
<path>`) and works there directly — that session claims the issue first (first claim wins)
and opens its own lane, so side-sessions, coordinator lanes, and the ledger stay coherent.

## Verification

`.claude/evals/section-breakdown.md` — stage-boundary capability evals (defined; first live
run is the acceptance test, owner-triggered).

## Examples

- `/section-breakdown "top bar"` → `TopBar` → Header workspace: `Wordmark` (section, d1) →
  `LogoMark` (atom, d2, NEW) · `Button` (d1, REUSE) · `LanguageSwitcher` (d1, NEW-BUILD) —
  ledger, 4 dossiers, master board, issues.
- "break the doctor showcase into smaller separate pieces" → hookify points here → recursion
  three levels deep (`DoctorCard` → `SectionHeading` → atoms), `RichText` dropped per fb-22.
