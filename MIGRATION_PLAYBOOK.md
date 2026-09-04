# MIGRATION PLAYBOOK — from old project to the new design system

> **How to use:** Give Claude Code access to the old project (read-only) and the new repo,
> with the brief saved as `CLAUDE.md` in the new repo root. Then work through
> the phases below **in order**. The brief defines *what is true*; this file defines
> *what to do next* and the per-tier checklists that gate every piece of work.
> *(Amended 2026-07-31 — owner decision CLAUDE.md §15.7: no local Docker; visual suite
> runs natively with dual platform-suffixed baseline sets. Phase −1 prerequisites and the
> Phase 0 visual-harness item reflect it.)*

**Inputs:**
- Old project path: `/Users/cosminneamtiu/Work/premium-smile-webpage` — read-only. It is a
  source of requirements (what components exist, what content they show), never a source of
  code, CSS, or patterns.
- New repo: this repository (`premium-smile-development`), scaffolded in Phase 0.

**Prime directive:** _rewrite, don't port._ The old components carry the exact coupling bugs
(global CSS bleed, baked-in margins, hardcoded strings, viewport-only responsiveness) this
project exists to eliminate. Copying markup for reference is fine; copying styles is not.

---

## Phase −1 — Repository & environments bootstrap (human, ~1 hour)

- [ ] Create the GitHub repo (private recommended until launch). Local prerequisites:
      Node 24 (via `.nvmrc`), git. *(Docker no longer required — amended 2026-07-31;
      the visual suite runs natively, see GITHUB_SETUP.md §7.)*
- [ ] Commit the governance set: `CLAUDE.md` (the brief) + this playbook at the root;
      `ci.yml`, `release.yml`, `visual-baseline.yml`, `dependabot.yml`,
      `PULL_REQUEST_TEMPLATE.md` under `.github/` per GITHUB_SETUP.md §1; `.nvmrc`
      containing `24`.
- [ ] Create `develop` from `main`; make `develop` the default branch; protections,
      merge methods, secret scanning per GITHUB_SETUP.md §2.
- [ ] Create GitHub Environments per GITHUB_SETUP.md §3: `development` (branch rule
      `develop`) and `production` (branch rule `main`, required reviewer: owner).
- [ ] Hosting: production is NOT GitHub Pages. Confirm the host (recommended:
      Cloudflare Pages) → tokens into the two environments → replace both DEPLOY
      PLACEHOLDER blocks. Staging must always build with `STAGING=1` (noindex).
- [ ] In parallel (owner track): obtain the logo file (settles the purple + favicon +
      OG image); start drafting Romanian content per page.

**Phase gate:** repo settings, branches, protections, and environments exist. Note that
`ci.yml` needs `package.json` to run — the CI-green check on a trivial PR becomes
meaningful only once Phase 0's scaffold lands, so expect (and ignore) `npm ci` failures
before that. (The first `develop → main` promotion likewise waits for Phase 0, since the
release gate runs the visual suite against a real Storybook.)

## Phase 0 — Scaffold & harness (everything must exist before the first atom)

- [ ] **Install the stack at the versions locked in the brief §3** (exact listed versions or
      their newest patch; tilde `~` ranges; Node.js 24 LTS); commit the lockfile; never cross
      a minor or major without asking.
- [ ] Next.js App Router + TypeScript, `output: 'export'`, `trailingSlash: true`.
- [ ] next-intl wired for `ro en de fr it`; `messages/*.json` created with the six namespaces
      (`common home services team blog contact`); `app/[locale]/layout.tsx` shell skeleton
      (html lang + provider + placeholder Header/Footer).
- [ ] Tailwind v4 with **provisional neutral tokens** in `styles/globals.css`, structured per
      the brief: primitives in `@theme` + semantic color tokens in a **light theme block**
      (`:root` / `[data-theme='light']` via `@theme inline`) — light is the only v1 theme
      (grayscale palette, one font stack, spacing scale) — structured so the real brand swaps
      in one file later.
- [ ] Self-hosted variable font subset incl. `Șș Țț ăâî äöüß` + fr/it accents; render a glyph
      test story and eyeball it.
- [ ] Storybook 10: the five named viewports from brief §7 (+320), a11y addon, locale toolbar
      (5 locales **+ pseudo-locale** that accents and expands strings ~40%), decorator wrapping
      stories in the next-intl provider.
- [ ] Visual regression harness (Playwright `toHaveScreenshot`): runs against the built
      Storybook; **dual platform-suffixed baseline sets (amended 2026-07-31): darwin set
      generated natively on the workstation (the pre-commit regression net), linux set
      generated only by the `visual-baseline.yml` workflow in the pinned container**;
      animations disabled in snapshots; width policy per brief §13.
- [ ] Vitest + Testing Library; ESLint with `eslint-plugin-jsx-a11y`; **pre-commit
      framework** hooks per GITHUB_SETUP.md §5 (commit: eslint + prettier on staged ·
      push: tsc + vitest — amended 2026-08-01, brief §15.8; activate with
      `pre-commit install --hook-type pre-commit --hook-type pre-push`); workflow files
      already placed per GITHUB_SETUP.md; `develop` default and branch protection as
      documented there. Close Phase 0 with `ecc:harness-audit` + `ecc:agent-sort` +
      `ecc:skill-health` (moved here per flow-audit F15).
- [ ] Translation-parity test: all five `messages/*.json` share one identical key set
      (Vitest).
- [ ] `lib/clinic.ts` created with placeholder NAP values, typed and exported.
- [ ] **Resolve the image-optimizer parked decision now** (ask the owner per brief §15), then
      build `ui/Image` as the very first component.

**Phase gate:** an empty Button story renders in Storybook at all 5 viewports, passes the a11y
panel, and produces committed baselines (darwin natively; linux seeded via the
`visual-baseline.yml` workflow) with CI green. Only then does migration start.

## Phase 1 — Audit the old project

Produce `MIGRATION_INVENTORY.md` in the new repo:

| Old component | Verdict | Target | Notes |
|---|---|---|---|
| e.g. `OldButton` | rewrite | `ui/Button` | 3 boolean props → variant prop + children |
| e.g. `PromoCard` | drop | — | feature removed |

- **Verdicts:** `rewrite` (need survives, code doesn't) · `merge` (several old ones → one new) ·
  `drop`. There is no `copy`.
- While auditing, tag each old component's **smells** so the rewrite consciously fixes them:
  hardcoded strings · outer margins · px sizing · global/leaking CSS · viewport media queries
  inside components · missing focus styles · div-as-button · images without dimensions.
- List every page of the old site and map its content onto the brief §14 section model;
  flag any content that has no home in the new model and **ask** about it.

## Phase 2 — `ui/` atoms

**Order:** `Image` → `Heading`/`Text` → `Button` → `Icon` → `Card` → `Badge`/`Tag` →
form primitives only if actually needed. Reference the inventory; don't build speculative atoms.
*(Run each atom through the `/new-atom` project skill — it encodes this checklist.)*

### Per-atom checklist (every atom, every time)
1. **Design the API first.** Variants as typed props; content as `children`/slots; if children
   may be non-text and the element is interactive, `aria-label` is required by the types.
   Write the API as the story's `argTypes` before implementing.
2. **Build:** Tailwind utilities only; `rem` sizing; no outer margin; `focus-visible` styles;
   `motion-reduce` honored; container-query behavior instead of media queries if it adapts.
3. **i18n check:** zero user-facing string literals; internal labels are props with defaults.
4. **a11y check:** correct native element/role; targets ≥24px; a11y addon panel clean.
5. **Stories:** Default with full controls + one story per state (hover/disabled/loading/etc.);
   Romanian demo args with diacritics; flip through pseudo-locale and DE in the toolbar —
   nothing may truncate or overflow.
6. **Tests:** interaction test if it has behavior; visual baseline at 1 width (+320 if the
   atom does anything layout-relevant).
7. **Definition of Done:** CI green · story documented · imports nothing from `sections/`/`app/`
   · every old-project usage of its predecessor is accounted for in the inventory.

Commit = one atom + its stories + tests. Nothing else rides along. **Commits happen only on
the owner's explicit instruction (brief §15.7).**

## Phase 3 — `sections/` compositions

**Order (shell first):** `Header` (+ `LanguageSwitcher`) → `ContactModal` → `Footer` →
`Hero` → `ServiceCard` → `ServicesTeaser`/`ServicesGrid` → `TeamMemberCard` → `TeamSection` →
`CTABanner` → `FAQAccordion` (if kept) → `PostCard`.

### Per-section checklist
1. **Compose, don't invent:** built from `ui/` pieces + layout utilities; if a new primitive is
   needed, stop and build it in `ui/` first (promotion rule).
2. **Own the spacing:** the section spaces its children (gap/stack); it still has no outer
   margin itself — pages own inter-section rhythm.
3. **i18n wiring:** this is the layer that calls `t()`; strings live in the section's namespace;
   prices through `Intl.NumberFormat`; check DE + pseudo-locale at 390px and 1536px.
4. **Responsiveness:** container queries for the section's internal adaptation; verify fluid
   behavior by dragging between checkpoints, not only at them.
5. **a11y:** heading levels are relative (sections start at h2); landmarks where appropriate;
   `ContactModal` must satisfy the full dialog spec in brief §9 with an interaction test proving
   focus trap / Esc / focus return.
6. **Stories:** Default + states + **two viewport-pinned stories** (Smartphone, Laptop);
   ContactModal gets an open-state story.
7. **Tests:** interaction tests for stateful sections (modal, switcher, accordion, mobile nav);
   visual baselines at 2 widths.
8. **DoD:** CI green · zero hardcoded strings (pseudo-locale proves it) · a11y panel clean ·
   old-project counterpart marked migrated in the inventory.

## Phase 4 — Routes & pages

**Order** *(amended 2026-09-02, org-review board — seo.ts split so the per-page checklist's
items 3–4 have their helpers from page one instead of refactoring four pages at the end)*:
locale layout shell (real Header/Footer + skip-link — **the mount contract below**) → root
`/` redirect script → `seo.ts` **part 1**: JSON-LD builder + metadata helper → Home →
Services → Team → Blog (ro-only MDX pipeline) → localized 404 → `seo.ts` **part 2**:
sitemap + robots generation (needs every route to exist — stays last).

### Shell mount contract (assembled 2026-09-02, org-review board)

Pointers only — each number keeps its ONE home in the named file's header; the mount lane
ticks every box and the numbers never fork. Ticked 2026-09-03 by the app-shell-mount lane
(boards `.claude/plans/app-shell-layers.plan.md` + `.claude/plans/app-shell-mount.plan.md`);
`src/app/[locale]/shell.test.tsx` is where the ticked boxes are pinned at runtime. Three
boxes stay open BY DESIGN, annotated below — they are not lane debt:

- [x] `scroll-padding-top: 5rem` on `<html>` — Header.tsx "THE MOUNT CONTRACT" (a). The 5rem
      reach is currently derived independently in Header.tsx, NavMenu's panel cap and
      FloatingActions' `--stem-inset` arithmetic — the three move together or the debt reopens.
- [x] header · main · footer · FloatingActions as **body-level siblings** — Header.tsx (b);
      NavMenu's dev tripwire guards this one (and only this one) at runtime.
- [x] `scroll-padding-bottom` in **three steps**, each keeping its `env()` term —
      FloatingActions.tsx mount-contract block (a).
- [x] FloatingActions mounts **after** `{children}` + Footer — its clearance spacer must be
      the last box in normal flow.
      *(**REVERSED by owner decision 2026-09-04**: spacer removed; the section now renders
      nothing in normal flow, so the mount order buys DOM/tab order rather than geometry and
      the FOOTER ends the flow. The footer keeps corner-band focusables centred/inset, which
      makes box 5's rule load-bearing rather than belt-and-braces; `scroll-padding-bottom`
      (box 3) is RETAINED and now carries the scroll-clearance duty alone. Same round added
      the sticky footer — `flex min-h-dvh flex-col` on `<body>`, `flex-1` on `<main>`.)*
- [ ] Page-composition rule: no standalone focusable narrower than ~72px flush at the
      left/right margins in blocks that scroll past the corners (FloatingActions b); keyboard
      walkthrough at several scroll positions (FloatingActions c).
      *(standing rule — every page lane; never "done", so the box never ticks. **Promoted to
      the PRIMARY guarantee on 2026-09-04** when the clearance spacer was removed: it is what
      makes "the corner discs cover nothing operable" true.)*
- [ ] The dormant `viewport-fit` decision (FloatingActions header caveat) — decide with the
      first full-bleed hero.
      *(dormant — decide with the first full-bleed hero; the `env()` terms are already
      written, so that day changes one export and no expression)*
- [x] ContactModalProvider wraps the whole shell; the dialog renders **last**
      (ContactModalProvider header). Header/NavMenu → ContactModalTrigger wiring is ONE
      commit that closes the menu and opens the dialog (inventory row 34) **plus** the
      focus-return decision + interaction test (org-review board F1 — the opener unmounts
      when the menu closes, so the platform's focus restore needs a named target).
      *(the trigger-wiring half shipped earlier, in PR #63; this lane added the provider
      that makes it live — a Header outside one THROWS by design, which is what the mount
      discharges)*
- [ ] Wordmark's declared two-line home-link wiring diff (Wordmark.tsx header) — landing it
      re-poses fb-179 (second home link in the Footer).
      *(parked — owner supplies the wiring moment)*
- [x] **Skip-link** — named in the Order above and carried by NO section header: it is a NEW
      build item of this shell lane, not a mount of something that exists.
- [x] Delete the placeholder header/footer markup in `layout.tsx` (and its duplicate
      copyright/NAP lines).

### Per-page checklist
1. **Route:** page under `app/[locale]/…`; `generateStaticParams` covers all five locales
   (blog: `ro` only, Blog nav item hidden elsewhere); home at `/{locale}`, never `/{locale}/home`.
2. **Content:** the page is a thin stack of sections + page-level spacing; media queries allowed
   here for macro layout.
3. **Metadata:** per-locale title + description from the message files; OG tags + share image;
   canonical; hreflang links to the four siblings + x-default (blog: none).
4. **Structured data:** `Dentist` JSON-LD from `clinic.ts` on every page; `Service` markup on
   Services; validates in Rich Results Test with zero errors.
5. **a11y:** exactly one h1; logical heading outline; landmarks; keyboard walkthrough
   (reach, operate, escape everything — including the modal) noted in the PR.
6. **Stories:** full-page story with mock messages, `layout: fullscreen`, **pinned stories for
   all five viewports**.
7. **Tests:** visual baselines at all 5 viewports in RO + DE; Lighthouse against the built
   export for this page type — Core Web Vitals pass or the page isn't done.
8. **DoD:** appears in the generated sitemap with correct alternates · language switcher
   round-trips to/from every sibling locale on this page · CI green.

## Phase 5 — Launch verification (one sitting, checklist in the final PR)

- [ ] Rich Results Test: zero errors on every page type.
- [ ] Lighthouse/PageSpeed on the built export: all page types pass CWV; hero is optimized LCP.
- [ ] Pseudo-locale sweep of the whole site: no untransformed strings, no overflow.
- [ ] 320px sweep: no horizontal scroll anywhere. 200% zoom sweep: nothing breaks.
- [ ] Full keyboard-only walkthrough + one screen-reader pass (NVDA or VoiceOver) per page type.
- [ ] Diacritics glyph check on real content in all five languages.
- [ ] Language cookie: set only on explicit click; root `/` redirect honors it; banner dismiss
      persists; policy page lists it in every locale.
- [ ] No request leaves the site to any third party (network tab audit) except intentional
      outbound links.
- [ ] `sitemap.xml` + `robots.txt` valid; hreflang reciprocal on every page.
- [ ] Handoff notes for the owner: submit sitemap in Search Console; claim Google Business
      Profile using the exact NAP string from `clinic.ts`.

---

## Standing rules while executing

1. Follow phase order; within a phase, follow the listed component order unless blocked.
2. Every commit leaves CI green — visual baselines update only via explicit approval, never
   silently.
3. When old-project behavior conflicts with the brief, **the brief wins**; note the difference
   in the inventory.
4. When something is ambiguous or a parked decision blocks progress (tokens, slugs, EUR,
   hosting): stop, summarize the options in one paragraph, and ask.
5. After each phase, append a short progress note to `MIGRATION_INVENTORY.md`: what moved,
   what was dropped, what surprised you.
6. Respect the build/runtime contract (brief §16): universal content is compiled at build;
   visitor-dependent behavior lives in the smallest possible client island and decides
   **after mount** (hydration-safe) — theme values are build-time CSS, never runtime
   computation.
