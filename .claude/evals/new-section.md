# Eval: new-section — stage-boundary capability checks (defined, not yet executed)

**Convention:** `ecc:eval-harness` · **Status:** defined 2026-08-05; **not executed** by
owner decision (fb-68). The first dossier-driven section build is the acceptance test.

| # | Boundary | Check (code grader) | Pass |
| --- | --- | --- | --- |
| 1 | N0 claim-first | the epic issue's coordination block shows `claimed` + this branch BEFORE the first file write in the lane | claim timestamp precedes first commit-able change |
| 2 | N0 lane | worktree exists at `../premium-smile-worktrees/<branch>`, branch tracks develop, Storybook port from the dossier table | `git worktree list` + port free-check |
| 3 | N1 precondition | build refused while any Children row ≠ `merged` (halt message lists blockers) | negative test blocks |
| 4 | N2 five-locale rule | no message key present in fewer than 5 locale files at any point after N3 returns | translation-parity test green |
| 5 | N3 write surface | builder touched only `src/components/sections/<Name>/` + enumerated keys | `git status` path audit |
| 6 | G1/V | full gate green in the lane; visual diffs == manifest, zero undeclared | gate log + Playwright report |
| 7 | N5 double gate | after pack approval and before "commit it": zero commits on the lane branch | `git log` empty vs base |
| 8 | N5 PR | PR into develop with `Closes #<n>`, sections-tier template boxes filled; after owner merge: `unblock` flips dependents | `gh pr view` + issue states |

**Fixture for the first run:** the first section whose children merge (Header path:
`Wordmark` after `LogoMark`). Record results here after that run.
