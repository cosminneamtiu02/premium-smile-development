# Lane + epic glue — shared ops reference

Used by: `/new-section` N0/N6 · `/new-atom` dossier mode · `/section-breakdown` B4.
ECC root: `~/.claude/plugins/cache/ecc/ecc/2.1.0` (invoke scripts by absolute path).

## Worktree lane recipe

```bash
git fetch origin
git worktree add ../premium-smile-worktrees/<branch> -b <branch> origin/develop
cd ../premium-smile-worktrees/<branch>
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
npm ci                       # worktrees do not share node_modules (~1–2 min, the lane cost)
```

- Builder-dispatch env per lane: `GATEGUARD_STATE_DIR=<worktree>/.gateguard` (keeps ECC
  fact-gates active but lane-isolated). If gates get noisy:
  `ECC_DISABLED_HOOKS=pre:edit-write:gateguard-fact-force` (surgical) — never `--no-verify`.
- Optional materializer: `<ecc-root>/scripts/orchestrate-worktrees.js` (plan → worktree +
  branch + task/status files; dry-run by default, `--write-only` to materialize). The plain
  recipe above is the fallback and the default.
- **Conflict radar before every PR:** `<ecc-root>/scripts/worktree-lifecycle.js --base develop`
  (predicts merge conflicts via `git merge-tree`, touches nothing).
- **Cleanup after merges:** `<ecc-root>/scripts/worktree-lifecycle.js --cleanup-plan` — never
  removes dirty or unmerged lanes. `git worktree remove` only what it lists as safe.

## Storybook ports (no registry exists — this table IS the allocator)

| Checkout | Port |
| --- | --- |
| main working copy | 6006 |
| lane slot 1 | 6007 |
| lane slot 2 | 6008 |

`npm run storybook -- --port <p> --no-open` inside the lane. **Cap: 2 concurrent lanes**
(owner fb-67). Port assignment is recorded in the component's dossier.

## Epic coordination (GitHub issues are the canonical lane state)

CLI: `node <ecc-root>/scripts/github-coordination.js <cmd> --repo <owner>/<repo>`.
State mirror: `~/.claude/ecc/state.db` (`work_items` table; `scripts/work-items.js` reads it).

**One-time bootstrap (labels must pre-exist or every command errors):**

```bash
for l in epic coordination:available coordination:claimed coordination:ready \
  coordination:blocked coordination:validated coordination:review-requested \
  coordination:review-approved coordination:review-changes-requested \
  coordination:published coordination:synced; do gh label create "$l" || true; done
```

**Per breakdown run (B4):**

- `gh issue create` per `to-develop`/`rework` component — title `<tier>: <Name>`, body =
  purpose + dossier path. **Section issues** add a `## Tasks` list:
  `- [ ] <Child> #<child issue>` — checkboxes become `tasks[]`, and **every `#N` anywhere in
  the body becomes a dependency** (keep bodies clean; no stray issue refs).
- Sections: `claim <n> --status blocked` at creation (blocked-from-birth while children are
  open). Atoms: left `available` until a build claims them.

**Per build lane:**

- Start: `claim <n> --actor <lane|session> --branch <branch>` — **claim before any file
  write; first claim wins; on conflict, stop.** (ECC's claim has a read-modify-write race —
  the single coordinator serializes its own claims; side-sessions rely on claim-first.)
- **Halt/abandon recovery (no unclaim verb exists; re-claiming a `claimed` issue throws):**
  comment the issue with the halt reason, flip the label by hand —
  `gh issue edit <n> --remove-label coordination:claimed --add-label coordination:blocked`
  (edit the body block's `"status"` to `blocked` in the same pass if `sync` doesn't) —
  then run `sync`. Remove the lane worktree if one was created.
- After G2 green: `review <n> --review approved`.
- Seal: `validate <n>` → `publish <n>` (publish requires review approved; it never closes
  the issue).

**After every owner merge (`Closes #N` closed the child on GitHub, ECC doesn't notice
alone):** `sync` then `unblock` — blocked sections whose children are all closed flip to
`ready`. Close the root section's issue manually when its own PR merges
(`gh issue close <n>`).

## Write-surface ownership (cross-lane safety)

- Atom lanes: only `src/components/ui/<Name>/` + their own baselines — disjoint by
  construction.
- `messages/*.json`: **section lanes only**, only the dossier's enumerated keys, all five
  locales in the same commit, values owner-authored (§8.10).
- `MIGRATION_INVENTORY.md`: appended by the planning loop at seal time, one lane at a time,
  never inside builders.
- Same-atom reworks: never two lanes at once (§6.6 — one owner per atom API at a time).

## Cost ledger

Each lane session's cost lands in `~/.claude/metrics/costs.jsonl` (ECC cost-tracker hook);
`/ecc:cost-report` aggregates when the owner asks what a wave cost.
