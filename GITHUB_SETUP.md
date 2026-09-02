# GITHUB_SETUP.md — repo base, flows, and where every test lives

> **Amended 2026-07-31 (owner decision, recorded in CLAUDE.md §15.7):** the
> pixel suite's home moved from "local Docker" to **local native (darwin
> baseline set) + CI's pinned container (linux baseline set)**. §1, §6 and §7
> reflect the amendment; everything else is as originally delivered.

## 1. File placement

| Delivered file | Goes to |
|---|---|
| `ci.yml` | `.github/workflows/ci.yml` |
| `release.yml` | `.github/workflows/release.yml` |
| `visual-baseline.yml` | `.github/workflows/visual-baseline.yml` *(added 2026-07-31)* |
| `dependabot.yml` | `.github/dependabot.yml` |
| `PULL_REQUEST_TEMPLATE.md` | `.github/PULL_REQUEST_TEMPLATE.md` |

Also add at repo root: `.nvmrc` containing `24` (the workflows read it).

## 2. Branch model (decided)

- **`main` = production.** Only receives promotion PRs from `develop`. A push to
  `main` produces the production build (deploy step is a placeholder until the
  host is chosen).
- **`develop` = integration.** Default branch. Feature branches (`feat/…`,
  `fix/…`, `migrate/…`) branch off it and merge back via PR.
- **Flow:** feature → PR → `develop` (fast CI lane) → promotion PR
  `develop → main` (release gate incl. the full visual suite) → merge → deploy.
  *(Amended 2026-08-02:)* the release gate **fails instantly for any PR into
  `main` whose source branch is not `develop`** (guard step in release.yml) —
  promotions have exactly one origin. Merge methods are ruleset-enforced:
  squash-only into `develop`, merge-commit-only into `main`.

**One-time settings (GitHub → Settings):**
1. Create `develop` from `main`; set `develop` as the default branch.
2. Branch protection `main`: require a pull request, require status checks
   **Full gate incl. visual regression**, block force-pushes, no direct pushes.
3. Branch protection `develop`: require status check
   **Lint · Types · Tests · Builds**; allow yourself to merge.
4. Merge methods: squash for feature → `develop` (clean history), merge commit
   for `develop → main` promotions (preserves what shipped).
5. Enable **secret scanning + push protection** (Settings → Code security).
   Costless insurance even though this repo should never hold a secret.

## 3. Environments: development & production (decided)

Create two **GitHub Environments** (Settings → Environments); the workflow jobs
are already bound to them:

- **`development`** — deployment branch rule: `develop` only. No approval. Every
  push to `develop` runs CI and then the `deploy-staging` job, giving a staging
  URL for real-phone checks and owner demos. Holds the staging host token
  (later).
- **`production`** — deployment branch rule: `main` only. **Required reviewer:
  you** — a one-click approval between "merged to main" and "live", the last
  human gate before the clinic's real site changes. Holds the production host
  token (later).

**Staging is never indexable — hard rule.** The staging job builds with
`STAGING=1`; the layout must emit `<meta name="robots" content="noindex">` and
`robots.txt` becomes disallow-all under that flag (Phase 0 wires it). Reason:
Google finding the staging copy would compete with and dilute the production
site's SEO — the one asset this whole project optimizes.

**Hosting status (amended 2026-08-02):** **interim production = GitHub Pages**
(owner reversal; the 2026-07-31 exclusion now applies to launch only). The repo
is public; the Pages site (source: GitHub Actions) deploys from `release.yml`
on pushes to `main`, behind the `production` environment's required-reviewer
click. Interim constraints: project-site base path
(`PAGES_BASE_PATH=/premium-smile-development`) and **noindex until the clinic's
real domain is attached** — a public github.io copy must never compete with
launch SEO. For LAUNCH the recommendation is unchanged: **Cloudflare Pages**
(free static tier, fast EU edge, headers/redirects control); Netlify is the
equivalent alternative. On confirmation: create the host project(s), put tokens
in the two environments, replace the Pages deploy in `release.yml` and the
staging DEPLOY PLACEHOLDER in `ci.yml`.

## 4. Dependabot (decided: npm patch-only · actions latest — no automerge)

The config targets `develop` and arrives Monday mornings, always as grouped
PRs, never automerged. Two regimes on purpose (carve-out decided 2026-08-01,
brief §15.9):

- **npm** — **groups all patch updates into one PR** and is structurally
  incapable of proposing a major *or a minor* (both ignored at the source —
  policy tightened 2026-07-31; `package.json` uses tilde `~` ranges to match).
  This is the regime that protects the built site's bytes.
- **github-actions** — **one grouped PR, majors allowed**: workflow actions
  can't change the built site, and holding them back only accrues
  runner-deprecation risk. You review the grouped PR, CI runs, you merge.
One consequence to know: a security fix that ships only in a minor gets no PR —
the repo's Security tab still alerts you, and that one bump becomes a deliberate
manual decision. Auto-merge remains deliberately not installed.

## 5. Git hooks — pre-commit framework (amended 2026-08-01, brief §15.8; replaces Husky + lint-staged)

Philosophy unchanged: commits stay fast, pushes get thorough, CI stays the
referee. The pixel suite is deliberately **not** a git hook — it runs in the
`/new-atom` commit ritual (before the owner-ordered commit) and on demand.

The hook manager is the **pre-commit framework** (`.pre-commit-config.yaml` at
the repo root — same tool as the owner's other repositories; requires Python,
already on the workstation). Stages: **commit** = eslint --fix + prettier
--write on staged files; **push** = `tsc --noEmit` + `vitest run`. Hook `rev`s
are pinned exactly and bumped deliberately (Dependabot cannot see them — §3
version policy applies manually).

```jsonc
// package.json (additions — Phase 0)
{
  "scripts": {
    "lint": "eslint .",
    "test": "vitest",
    "visual": "playwright test tests/visual",
    "visual:update": "playwright test tests/visual --update-snapshots"
  },
  "devDependencies": {
    // linkinator ~pinned here so CI's `npx linkinator` never floats (audit F9)
  }
}
```

```bash
# one-time activation (Phase 0, after npm ci)
pre-commit install --hook-type pre-commit --hook-type pre-push
```

Storybook/site builds are deliberately **not** in hooks (too slow for a commit
loop) — CI covers them within minutes on every PR. `--no-verify` remains
blocked by hookify + re-checked by CI.

## 6. Where every test lives (the decided split — amended 2026-07-31)

| Check | Pre-commit | Pre-push | CI (`develop`) | Release gate (`main`) | Local native |
|---|:-:|:-:|:-:|:-:|:-:|
| Prettier format | staged files | | check-all | check-all | |
| ESLint + jsx-a11y | staged files | | ✅ | ✅ | |
| TypeScript (`tsc --noEmit`) | | ✅ | ✅ | ✅ | |
| Vitest: unit + interaction + per-story axe a11y | | ✅ | ✅ | ✅ | |
| Translation-parity test (all 5 locale JSONs share one key set) | | ✅ (part of Vitest) | ✅ | ✅ | |
| Storybook builds | | | ✅ | ✅ | |
| Site export builds | | | ✅ | ✅ | |
| Internal link + hreflang check (linkinator 8.x over `out/`) | | | ✅ | ✅ | |
| **Visual pixel suite (Playwright)** | | | | **✅ linux set (pinned container)** | **✅ darwin set — the pre-commit regression net, run in the commit ritual** |
| Lighthouse / Core Web Vitals | | | | Phase 4+ manual, optional job later | |

The pixel suite's home is **local-native** (owner decision 2026-07-31): the
darwin baseline set catches cross-component regressions before every commit;
the release gate re-verifies against the **linux baseline set** maintained by
`visual-baseline.yml` in the identical pinned image, so nothing unverified
reaches `main`.

## 7. The local visual workflow (amended 2026-07-31 — native, no Docker)

Playwright names snapshots per platform (`…-darwin.png` / `…-linux.png`), so
the repo carries **two baseline sets that never collide**:

- **darwin set — yours.** Generated and compared natively on the Mac (arm64
  Chromium, no emulation, fast). Commands, from the repo root:

```bash
# verify (the cross-component regression net — also runs in the commit ritual)
npm run visual -- --workers=2

# approve intentional changes — updates the committed darwin PNGs
npm run visual:update -- --workers=2
```

- **linux set — CI's.** Generated **only** by the `visual-baseline.yml`
  workflow (Actions tab → "Visual baselines (linux set)" → run on the branch),
  inside the same pinned container the release gate uses. The refresh **lands
  as a PR** (amended 2026-08-02: develop's required status check rejects
  direct bot pushes — the workflow pushes a `chore/linux-baselines-*` branch
  and opens the PR; you review the PNG diffs and merge). Refresh whenever
  intentional visual changes accumulate — at latest before each
  `develop → main` promotion, or the release gate will fail on stale
  baselines.

  **Expected asymmetry (recorded 2026-09-02, org-review board):** the darwin
  set is the day-to-day net and grows with every lane (~165 PNGs at the time
  of writing); the linux set refreshes in batches and may lag far behind
  (4 PNGs at the same moment). A sparse linux set is the WORKFLOW, not
  corruption — the refresh trigger is the promotion above, never parity for
  its own sake. Also budget the calendar in the promotion ritual: the Footer's
  copyright year is read at BUILD time, so the first baseline run of a new
  year changes every Footer shot in BOTH sets with zero code change
  (Footer.tsx's YEAR docstring carries the full note) — re-record, don't
  investigate.

Review changed PNGs in the git diff, commit them with the code change, and tick
the PR-template box. The failure report (`playwright-report/`) shows
expected/actual/diff side by side. Keep the pinned image tag (in `release.yml`
and `visual-baseline.yml`) in lockstep with the `playwright` version in
`package.json` (bump both in the Dependabot PR).

Docker, OrbStack and Rosetta are **no longer prerequisites** on the
workstation. Documented fallback if native/CI rendering ever diverges
problematically: run the container flow locally again (the old §7 commands
live in git history of the delivery docs).

## 8. Recommended tests you didn't ask for (added above)

1. **Translation-parity test** — a tiny Vitest asserting all five
   `messages/*.json` files have identical key sets. Catches the silent classic:
   a key added in `ro` but forgotten in `de` leaking English (or nothing) into
   production. Cheap, brutal, worth it.
2. **Link + hreflang check on the built export** — broken locale switches and
   dead internal links are the most embarrassing static-site bug class, and a
   filesystem crawl catches them in seconds.
3. **Per-story axe (a11y) in Vitest** — WCAG violations fail CI, not just the
   Storybook panel.
4. **Prettier check-all in CI** — hooks can be bypassed (`--no-verify`); CI
   can't be.
5. Deliberately deferred: Lighthouse CI (Phase 4, once real pages exist) and
   bundle-size guards (only if client islands ever grow).
