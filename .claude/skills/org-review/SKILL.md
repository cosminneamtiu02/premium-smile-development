---
name: org-review
description: Use at the code-review step of a build lane (after machine gates), or whenever the owner asks whether a senior React developer would reorganize, split, merge, rename, or modularize existing code differently — file layout, module boundaries, hook extraction timing, naming. Organization only — correctness bugs, type safety, a11y and pixels have their own gates. Ends at an owner-annotatable canvas board; only owner-approved DO-NOW items get applied.
---

# /org-review — would a senior have organized this differently?

## One principle

**Structure is reviewed like code: two grounded passes, verdicts with costs,
and "already correct" is a finding.** The methodology is the executed
2026-08-17 Header run (board `.claude/plans/header-code-organization-review.plan.md`,
approved fb-169): main-loop close read + a blind `react-org-reviewer` pass,
converging or disagreeing in the open, delivered as a canvas board the owner
annotates.

## Inputs

- A target: one section/atom folder (`src/components/...`), a diff, or "the
  new code on this branch". Default when invoked inside a lane: the lane's
  own component folder.
- The lane must be PAST its machine gates (tsc · lint · prettier · vitest) —
  organization review on red code reviews noise.

## The loop

1. **Read everything yourself** (main loop). Every target file, every line.
   Note per-file code-vs-comment counts
   (`grep -cvE '^\s*(//|/\*|\*|\*/|$)' <file>`).
2. **Ground the facts**: grep importers of every export; check the in-repo
   precedents (`ui/slot.ts` fb-64 second-caller extraction, FloatingActions
   single-file baseline, deep-imports/no-barrels, noun/verb assets rule,
   D2 lying-name rule).
3. **Dispatch `react-org-reviewer`** (Agent tool) with: the file list, the
   §4/§6/§16 constraints, the comment-convention note, and the explicit
   instruction that "already correct, here is why" is a valid per-item answer.
   The agent is Fable-pinned in its frontmatter (owner routing rule: Fable
   reviews, Opus builds) — never pass a model override. Run it blind: do not
   show it your own conclusions.
4. **Verify every agent claim against the code** before it reaches the owner.
   A finding neither pass can ground in a file/line/grep does not ship.
5. **Compose the board** at `.claude/plans/<target>-org-review.plan.md`, in
   the owner's explanation register (fresh CS graduate, zero React — the
   `explain-cs-grad` hook enforces it for chat; the board carries it for
   documents). Required sections:
   - The question, scope ("organization only, zero pixels"), and **verdict
     semantics** (Approve = the summary table executes exactly as written).
   - A short React primer defining every term the findings use.
   - The map as built: file table (code lines, job, runs-where) + a mermaid
     import graph marking any suspect edge.
   - **What is already senior-grade**, each item paired with the naive
     version a first attempt produces.
   - Findings F1…Fn: WHAT / WHY / COST / VERDICT
     (DO NOW · WAIT FOR RULE-OF-TWO · KEEP AS-IS) / confidence, with the
     blind pass's concordance or disagreement stated per finding.
   - Summary table + what Approve applies, explicitly listing the expected
     diff and the expected zero-DOM/zero-test/zero-visual blast radius.
6. **Open the canvas** (ECC plan-canvas: `open` then `await`, background) and
   run the annotate → revise → reply loop until a verdict.
7. **On approval, apply ONLY the DO-NOW items**, re-run the machine gates,
   run the visual net expecting **zero pixel diff**, and end at
   **ready + evidence**. Never commit — the owner's per-lane "commit it" is
   the second gate (§15.7). Ambiguous feedback (e.g. a chat message that can
   be read two ways) is asked back in the canvas, never guessed.

## Discipline

- Findings the code does not support are the failure mode of this skill —
  an all-KEEP board with evidence is a success, not an embarrassment.
- Every DO NOW must predict its blast radius before it is applied, and the
  gate run afterward must confirm the prediction (the Header run: 267/267
  tests green, zero test edits, zero pixel diff).
- WAIT verdicts name their trigger (the concrete second consumer) so the
  debt is collectable, and get recorded in the moved-code's header comment.
- The board never proposes visual changes; if one surfaces, it exits to its
  own lane and board.

## Related

- Agent: `react-org-reviewer` (Fable-pinned, structure only) — bugs and types
  stay with `react-reviewer` + `typescript-reviewer` at the same review step.
- Eval: `.claude/evals/org-review.md` — the executed Header ground truth;
  re-run it after any edit to this skill or the agent.
- Boards land in `.claude/plans/` (gitignored — boards are working state,
  not repo history).
