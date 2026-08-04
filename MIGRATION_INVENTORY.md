# MIGRATION_INVENTORY — old repo → new atoms

> One row per old-repo piece, appended by each `/new-atom` run (skill S2).
> Verdicts: **rewrite** = rebuilt fresh to the new contract · **merge** = job
> absorbed into another component · **drop** = not migrated, covered elsewhere.
> Merge/drop verdicts require explicit owner approval (recorded per row).

| Old source (premium-smile-webpage) | Verdict | Lands as | Owner approval |
|---|---|---|---|
| `ui/button` (shadcn-style variant map; scale/translate hovers) | rewrite | `ui/Button` — slot children, `variant solid/outline/ghost`, `size md/lg/xl`, `asChild`, one calm color crossfade on a shared 400ms clock (nothing moves; outline fades ground + label together, accepted transient per the invariant in `Button.tsx`) | plan canvas 2026-08-02 (`.claude/plans/button-migration.plan.md`); v1 sweep discarded and replaced by the crossfade, canvas fb-37/fb-38 2026-08-04 (`.claude/plans/button-hover-fade.plan.md`) |
| Footer's 2 hand-rolled ANPC `<a>` buttons | merge | `Button variant="outline" asChild` usages at Footer-section migration (fixed `lg:w-56` → parent `min-width`, §8.4) | plan canvas 2026-08-02 |
| Hero/TopBar "parent resizes button internals" pattern (`lg:[&>*]:h-16` …) | drop (pattern, not component) | `size` prop (§6.8) | canvas annotation fb-23, 2026-08-02 |
| `ui/rich-text` (bold-marker renderer) | drop | next-intl `t.rich()` at section level | canvas annotation fb-22, 2026-08-02 |
| `ui/icon-button`, `floating-book-cta` | out of scope (this run) | future `IconButton` atom (§6.3 typed aria-label lives there) + section composite | — |
