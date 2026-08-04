# <SectionName> — section dossier

**Status:** to-develop · **Run:** `<workspace path>` · **Issue:** #<N> ·
**Board:** `<.claude/plans/… or pending>` · **Depth:** d<n>
**Old source:** `<old repo path>` or **no old counterpart** (brief-spec build, §14)
**Purpose:** <one line>

## Children (build precondition: every row `merged` before this lane starts)

| Child | Tier | Status | Issue |
| --- | --- | --- | --- |

## Composition contract

| Slot | Filled by | Props passed | Notes |
| --- | --- | --- | --- |

Layout: <grid/flex/container-query plan; §6.4 — this section owns child spacing, no outer
margin on children; headings start at h2 (§ playbook Phase 3)>.

## Message-namespace plan (the ONLY messages/*.json keys the build may touch)

Namespace: `<home|services|team|blog|contact|common>` — a key ships only when **all five
values are owner-authored** (§8.10; the parity test checks key sets, not authorship):

| Key | RO | EN | DE | FR | IT |
| --- | --- | --- | --- | --- | --- |

All five locales get the keys in the same commit; RO-only rows block the build at
`/new-section` N2.

## Interaction tests (stateful behavior only)

- <behavior → RTL test summary>

## Smells / required rewrites (from classification)

- <e.g. zero-props old Footer → full props-in rewrite; portal → in-flow dialog per §9>

## Expected-diff manifest (story IDs allowed to change)

- <sections-name--story> (new) · pinned viewports: Smartphone 390 / Laptop 1536

## Interaction with waves

Starts only when the Children table is all-`merged`; branch off develop AFTER those merges.

## Lane

Branch `migrate/<name>` · Worktree `../premium-smile-worktrees/<branch>` ·
Storybook port <6007|6008>.

## Run me

Point any Claude session at this file: **`/new-section from <this path>`**. Claim issue
#<N> first (first claim wins); verify the children precondition; if status is `approved`
**and every message key carries all five owner-authored values**, the composition contract
is settled → straight to the section-builder dispatch. RO-only rows → the owner supplies
the missing values first (N2).
