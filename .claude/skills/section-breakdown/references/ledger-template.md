# Breakdown ledger — <OldSectionName>

**Run:** `.claude/section-runs/<YYYY-MM-DD_HH-mm>_<slug>/` · **Initiated:** <YYYY-MM-DD HH:mm>
**Old source:** `<old repo path>` · **Root issue:** #<N or pending>
**Statuses:** `already-existing` · `rework` · `to-develop` · `approved` · `ready` ·
`pr-open` · `merged` · `dropped?`

---

## Tree (each row appended BEFORE descending into it — fb-65)

```
<Root> (section, d0, to-develop, #12) — <one-line purpose>
├─ <Child> (section, d1, to-develop, #13) — <purpose> · slot: <parent slot>
│   └─ <Leaf> (atom, d2, to-develop, #14) — <purpose> · slot: <parent slot>
├─ <Existing> (atom, d1, REUSE ui/<Name>) — <purpose> · slot: <parent slot>
└─ <Changed> (atom, d1, rework, #15) — <purpose> · delta: <prop change>
```

## Verdicts

| Node | Old path / NEW | Verdict | Evidence | Consumers | Smells |
| --- | --- | --- | --- | --- | --- |

## Waves (build order — DAG bottom-up)

- **Wave 1 — atoms, parallel ≤ 2 lanes:** <list>
- **Wave 2+ — sections, each only after ALL its children show `merged`:** <list>
- **Serialized reworks (§6.6 — one lane owns an atom's API at a time):** <list or —>

## Keep + parametrise (reworks)

| Existing atom | Prop delta | Driven by | Board |
| --- | --- | --- | --- |

## Boards

| Component | Board file | Status |
| --- | --- | --- |
