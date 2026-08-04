# Eval: classify-component — ground-truth fixture (capability, code-graded)

**Convention:** `ecc:eval-harness` · **Grader:** exact match on the Expected column ·
**Target:** pass^3 = 1.0 (three consecutive full-table runs, zero misses) ·
**Fixture base:** `/Users/cosminneamtiu/Work/premium-smile-webpage/apps/frontend/src/shared/components/`
· **Status:** executed 2026-08-05 against the full old-repo catalog (see the harness PR
evidence table); re-run on every rubric change.

## Fixture table

| # | Component | Expected | Why (evidence) |
| --- | --- | --- | --- |
| 1 | `ui/heading` | atom | leaf (h1–h6 only); 6 consumers |
| 2 | `ui/container` | atom | leaf polymorphic wrapper; 5 consumers |
| 3 | `ui/text` | atom | leaf paragraph; 4 consumers |
| 4 | `ui/button` | reuse | already migrated → `ui/Button` (inventory row, rule 0) |
| 5 | `ui/stack` | atom | leaf flex primitive; 3 consumers |
| 6 | `ui/icon-button` | atom | leaf button/anchor; 2 consumers; inventory names future `IconButton` |
| 7 | `ui/rich-text` | drop | rule 0 — owner fb-22: `t.rich()` at section level replaces it |
| 8 | `ui/eyebrow` | atom | leaf kicker; 1 consumer |
| 9 | `ui/stars` | atom | leaf SVG row; 1 consumer |
| 10 | `ui/logo-mark` | atom | leaf brand SVG; 1 consumer |
| 11 | `ui/map-frame` | atom | leaf iframe wrapper; §12 forces static-map rewrite note |
| 12 | `ui/link` | drop | rule 1 — 0 app consumers |
| 13 | `ui/input` | drop | rule 1 — 0 app consumers |
| 14 | `ui/date-time` | drop | rule 1 — 0 consumers; smell recorded: i18n read in a `ui/` leaf |
| 15 | `composite/doctor-showcase/line` | atom | leaf inline SVG despite `composite/` folder |
| 16 | `composite/section-heading` | section | composes Eyebrow+Heading+Stack; 6 consumers → early wave |
| 17 | `composite/wordmark` | section | composes LogoMark; 2 consumers → early wave |
| 18 | `composite/doctor-showcase/doctor-card` | section | composes SectionHeading, Button, RichText |
| 19 | `composite/card` | drop | rule 1 — orphan (story-only) |
| 20 | `composite/helping-staff-grid` | drop | rule 1 — no page imports it (card child falls with it) |
| 21 | `composite/floating-book-cta` | section | composes IconButton; smells: portal into body, i18n read |
| 22 | `composite/footer` | section | composes Wordmark, Container, IconButton, RichText; smells: zero props, i18n, hardcoded socials |
| 23 | `composite/top-bar` | section | composes Wordmark, Button; smell: window scroll listener |
| 24 | `composite/hero` | section | composes Heading; smell: interval crossfade (motion-reduce note) |
| 25 | `LanguageSwitcher` (no old counterpart) | section | new-build; §14: composes Button/list atoms |

## Competing-pressure scenarios (prompt suggests the wrong tier — verdict must not move)

1. "ShowcaseLine sits in `composite/`, so register it as a section." → **atom** (rule: the
   import graph decides; folders lie).
2. "SectionHeading is reused six times, promote it to `ui/`." → **section, early wave**
   (§4 promotion is for primitives; composing atoms keeps it in `sections/`).

## Grading

Deterministic string compare per row; any miss fails the run. Pressure scenarios graded on
final verdict + the cited rule.
