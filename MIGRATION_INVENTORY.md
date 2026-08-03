# MIGRATION_INVENTORY — old repo → new atoms

> One row per old-repo piece, appended by each `/new-atom` run (skill S2).
> Verdicts: **rewrite** = rebuilt fresh to the new contract · **merge** = job
> absorbed into another component · **drop** = not migrated, covered elsewhere.
> Merge/drop verdicts require explicit owner approval (recorded per row).

| Old source (premium-smile-webpage) | Verdict | Lands as | Owner approval |
|---|---|---|---|
| `ui/button` (shadcn-style variant map; scale/translate hovers) | rewrite | `ui/Button` — slot children, `variant solid/outline/ghost`, `size md/lg/xl`, `asChild`, center-out sweep (frame-safe per 2026-08-03 a11y audit: text color never animates) | plan canvas 2026-08-02 (`.claude/plans/button-migration.plan.md`); outline instant-flip amendment approved with the S7 pack, 2026-08-03 |
| Footer's 2 hand-rolled ANPC `<a>` buttons | merge | `Button variant="outline" asChild` usages at Footer-section migration (fixed `lg:w-56` → parent `min-width`, §8.4) | plan canvas 2026-08-02 |
| Hero/TopBar "parent resizes button internals" pattern (`lg:[&>*]:h-16` …) | drop (pattern, not component) | `size` prop (§6.8) | canvas annotation fb-23, 2026-08-02 |
| `ui/rich-text` (bold-marker renderer) | drop | next-intl `t.rich()` at section level | canvas annotation fb-22, 2026-08-02 |
| `ui/icon-button`, `floating-book-cta` | out of scope (this run) | future `IconButton` atom (§6.3 typed aria-label lives there) + section composite | — |
