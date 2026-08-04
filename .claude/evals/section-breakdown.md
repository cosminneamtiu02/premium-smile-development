# Eval: section-breakdown — stage-boundary capability checks (defined, not yet executed)

**Convention:** `ecc:eval-harness` · **Status:** defined 2026-08-05; **not executed** by
owner decision (fb-68 — nothing runs until the owner triggers the first live breakdown,
which is the acceptance test). Graders are code-checks runnable at that first run.

| # | Boundary | Check (code grader) | Pass |
| --- | --- | --- | --- |
| 1 | B0 workspace | `.claude/section-runs/<ts>_<slug>/{atoms,sections,ledger.md}` all exist; folder name matches `YYYY-MM-DD_HH-mm_<slug>` | dirs + ledger present |
| 2 | B0 canvas | plan-canvas session open for `ledger.md` (server `sessions.json` has its key) | session listed |
| 3 | B1 ledger-before-descent | every `d(n+1)` row's parent `d(n)` row exists with an earlier append (ledger is append-only; order = file order) | no orphan depths |
| 4 | B1 verdicts | every non-reuse node has a `/classify-component` verdict row citing a rule | rows complete |
| 5 | B2 dossiers | one dossier per non-reuse ledger node; statuses from the legal set; every `rework` dossier has a non-empty prop-delta | 1:1 mapping |
| 6 | B3 gate | no build artifact exists anywhere (no branch, no worktree, no `src/` change) after B3 approval | `git status` clean; no new worktree |
| 7 | B4 issues | every `to-develop`/`rework` dossier carries a real issue `#N` with an `ecc-coordination` block; section issues are `coordination:blocked` with `## Tasks` refs | `gh issue view` matches |
| 8 | Recursion | a nested section in the fixture (`DoctorShowcase` → `DoctorCard`) produced its own sub-tree + dossiers | depth ≥ 2 covered |

**Fixture for the first run:** the owner's chosen section (playbook order suggests
`TopBar` → Header). Record results here after that run.
