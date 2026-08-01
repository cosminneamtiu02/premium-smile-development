---
name: debug-deep
description: ECC-native root-cause debugging loop — reproduce minimally, gather evidence before any fix, hypothesize the causal chain, prove it, fix at the cause with a regression test, re-verify the full gate, then exit through quality review and the owner-gated seal. Use for any failure (test, build, visual diff, hydration, a11y) or when the owner asks for a root cause analysis.
---

# /debug-deep — find the cause, never patch the symptom

## When to Use

- The owner says: "run a root cause analysis on why…", "why does/do … break", "debug deep",
  "find the real cause" (the `trigger-debug-deep` hookify rule points here).
- Any red gate inside `/new-atom` (G1, V regression net, S8 fast re-run) or any failing
  check, unexpected visual diff, hydration warning, or a11y violation in this repo.

Self-contained + ECC — depends on no other plugin's process skills.

## How It Works

**No code changes before Phase 4's hypothesis is confirmed.**

### 0 · Branch context
Inside a `/new-atom` run → stay on its branch. Standalone fix → `git switch -c fix/<slug>`
off up-to-date `develop` (parallel fix branches are normal; the owner merges PRs and times
the `develop → main` promotion).

### 1 · Reproduce minimally
Smallest story/test/build target that shows the failure. Unreproducible = the first
mystery to resolve; never proceed on guesswork.

### 2 · Gather evidence (no fixes yet)
Full error text · chrome-devtools MCP (console, network, rendered DOM) · TypeScript LSP
(diagnostics, hover, references) · `git log`/`git bisect` for regressions · Playwright
report (`playwright-report/`) for visual diffs.

### 3 · Hypothesize the ROOT cause
State the causal chain: "X changed → Y recomputed → Z broke." Always "what chain produced
this?", never "what patch hides this?".

### 4 · Test the hypothesis
Smallest experiment that proves or refutes. Refuted → back to 3.
**Two refuted cycles → escalate:** build/type class → `ecc:react-build-resolver` /
`ecc:build-error-resolver` (minimal diffs); swallowed errors → `ecc:silent-failure-hunter`;
otherwise stop and hand the owner the evidence dossier (per
`ecc:agent-introspection-debugging`).

### 5 · Fix at the cause + regression test
Fix where the chain starts. Regression test **fails before, passes after** — prove both.

### 6 · Re-verify the FULL gate
Per `ecc:verification-loop`: complete G1 set (tsc, lint, prettier, vitest,
build-storybook), not just the failing check. Outputs shown — evidence, not assertions.

### 7 · EXIT RAMP — quality review + owner-gated seal (never dead-end at green)
1. **Contract-drift check:** if the fix touched a props interface, re-sync argTypes,
   stories, and every usage (LSP references; §6.6 one-commit discipline).
2. **G2 diff review:** `ecc:react-reviewer` + `ecc:typescript-reviewer` on the fix diff
   (+ `ecc:a11y-architect` if interaction/a11y was involved). Verified findings → back to 5.
3. **Mini visual pack** if pixels changed: affected stories at the six widths → owner
   points/approves on the canvas.
4. **READY** — wait. On the owner's "commit it": fast `npm run visual` re-run → one commit
   (fix + regression test) → push → PR into `develop` → owner merges.
   Inside a `/new-atom` run, control returns to the gate that failed instead.

## Banned moves

Retrying a command unchanged · weakening or deleting a failing test · `!important`/style
overrides to silence a visual diff · copying old-project CSS "because it worked" ·
catch-and-swallow · regenerating a pixel baseline to make a diff disappear without the
owner's explicit approval (the expected-diff manifest in `/new-atom` V is the only
sanctioned path).

## Examples

- "Run a root cause analysis on why the Button story overflows at 320" → reproduce in the
  320 story → computed styles via chrome-devtools → hypothesis: px `min-width` → prove by
  toggling the class live → fix in rem per §7 → regression story tagged 320 → full gate →
  exit ramp: reviewers on the diff → mini-pack (Button at 6 widths) → owner approves →
  "commit it" → PR.
- G1 red on `tsc` after a prop rename → LSP references show 3 stale usages → cause: §6.6
  missed a story file → fix all usages → full gate → return to `/new-atom` G1.
