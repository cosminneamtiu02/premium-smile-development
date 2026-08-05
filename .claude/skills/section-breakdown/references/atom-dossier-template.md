# <AtomName> — atom dossier

**Status:** to-develop · **Run:** `<workspace path>` · **Issue:** #<N> ·
**Board:** `<.claude/plans/… or pending>` · **Depth:** d<n>
**Old source:** `<old repo path>` or **no old counterpart** (brief-spec build)
**Purpose:** <one line — why this atom exists>

## Consumption contract — how parents call it on section construction

| Parent | Slot / usage | Props exercised |
| --- | --- | --- |

## Prop contract (draft until its board is approved)

```ts
// TypeScript interface per CLAUDE.md §6: variants as typed props, content via
// children/slots, aria-label required by types when children may be non-text.
```

## Fixtures

- RO (diacritics): <"Programează-te">
- DE (longest): <word>
- pseudo: <string>

## Expected-diff manifest (story IDs allowed to change in stage V)

- <ui-name--story> (new)

## Smells / required rewrites (from classification — never silently fixed)

- <smell → required pattern in the new build>

## Lane

Branch `migrate/<name>` · Worktree `../premium-smile-worktrees/<branch>` ·
Storybook port <6007|6008> · Cap: 2 concurrent lanes.

## Run me

Point any Claude session at this file: **`/new-atom from <this path>`**. The session claims
issue #<N> first (first claim wins — stop if already claimed), opens the lane above when
running in parallel, and uses this dossier as its S1–S3 evidence; status `approved` here
means the contract board is already settled → straight to the S4 dispatch.
