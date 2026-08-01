<!-- .github/PULL_REQUEST_TEMPLATE.md -->
<!-- Delete the tier sections that don't apply to this PR. -->

## What & why

<!-- One or two sentences. Link the MIGRATION_INVENTORY.md row if migrating. -->

## Checks that CI cannot see

- [ ] **Native visual suite run locally** (`npm run visual`) — cross-component
      regressions clean; darwin baselines committed if intentionally changed
      (linux set refreshed via the visual-baseline.yml workflow before any
      develop → main promotion) <!-- amended 2026-07-31, owner decision D4 -->
- [ ] Flipped through **pseudo-locale + DE** in Storybook — no truncation/overflow,
      no untransformed strings
- [ ] a11y panel clean on every touched story

## Tier: `ui/` component

- [ ] API designed first: variants as typed props, content via children/slots;
      `aria-label` required by types when children aren't text (brief §6.3)
- [ ] No outer margins; rem sizing; `focus-visible`; `motion-reduce` honored
- [ ] Container queries (not media queries) for any internal adaptation
- [ ] Stories: Default + states, controls wired
- [ ] Imports nothing from `sections/` or `app/`

## Tier: `sections/` composition

- [ ] Composes `ui/` only; new primitives were promoted first
- [ ] All strings via its namespace; prices/dates via `Intl`
- [ ] Headings relative (starts at h2); landmarks correct
- [ ] Two pinned viewport stories (Smartphone 390 / Laptop 1536)
- [ ] Interaction tests for any stateful behavior

## Tier: page / route

- [ ] `generateStaticParams` covers the right locales (blog = ro only)
- [ ] Per-locale metadata + OG; hreflang siblings + x-default; canonical
- [ ] `Dentist` JSON-LD present and valid
- [ ] One h1; keyboard walkthrough done (reach, operate, escape everything)
- [ ] Five pinned viewport stories; Lighthouse/CWV checked on the built export

## Ledger

- [ ] `MIGRATION_INVENTORY.md` updated (migrated / dropped / surprises)
- [ ] No parked decision (brief §15) was silently decided here
