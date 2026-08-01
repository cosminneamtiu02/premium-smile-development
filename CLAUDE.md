# PROJECT BRIEF — Dental Clinic Website (Romania)

> **How to use:** This file is the repository's `CLAUDE.md` — Claude Code reads it
> automatically as project memory. It is the single source of truth for goals,
> architecture, and non-negotiable rules. The companion file `MIGRATION_PLAYBOOK.md`
> defines the order of work and per-tier checklists.
> *(Amended 2026-07-31 — owner decisions via plan-canvas review: §3 Playwright/Docker
> rows, §13 visual policy, new §15.7, new §17.6. Everything else is as delivered.)*

---

## 1. What this project is

A **fully static, multilingual marketing website** for a dental clinic in Romania, built in React.
There is no backend, no database, no user accounts, and no forms. The site's one conversion goal
is that a visitor **calls the clinic** (tap-to-call / WhatsApp).

- **Audience:** local Romanian patients (skewing older — accessibility is a feature, not a checkbox)
  and foreign patients (dental tourism), hence five languages.
- **Locales:** `ro` (default), `en`, `de`, `fr`, `it`. All left-to-right. Blog is Romanian-only.
- **Definition of success:** fast, findable on Google in all five languages, usable by a 70-year-old
  on a phone, and maintainable — changing one component must never silently break another.

## 2. Non-negotiable direction

1. **Static output.** Next.js App Router with `output: 'export'`. Every locale × route is
   pre-rendered to plain HTML. No server, no middleware at runtime.
2. **No cookie-consent banner.** The only storage is one first-party language cookie set on the
   user's explicit click. Anything that would force a banner is banned (see §12).
3. **WCAG 2.2 AA** is an acceptance criterion, not an aspiration (see §9).
4. **SEO-ready by construction** — the developer-side checklist in §10 defines "ready".
5. **Component isolation.** Rules in §6 exist to kill the change-one-break-many failure mode.

## 3. Technology stack (locked — names, versions, roles, rationale)

**Version policy (tightened 2026-07-31): majors AND minors are locked.** Adopt the exact
versions listed (npm `latest` as verified 2026-07-30) or their newest **patch**; `package.json`
uses tilde (`~`) ranges; commit the lockfile as the source of truth. Crossing a minor or a
major — including for a security fix that only ships in a minor — is a deliberate, recorded
decision, never a side effect. Runtime: **Node.js 24 (Active LTS)**; npm as package manager.

| Technology | Version | How it's used | Why it's here |
|---|---|---|---|
| Next.js | 16.x (16.2.12) | App Router with the `[locale]` segment; `output: 'export'` pre-renders every locale × route to static HTML; `generateStaticParams`; Metadata API for per-locale titles, descriptions, hreflang, OG | The locale-shell routing model (§5) and static export are first-class features; the Metadata API implements the SEO contract (§10) without hand-rolled head management |
| React | 19.x (19.2.8) | Component model for all three tiers | Required by Next 16; used as a plain rendering substrate — no client data fetching exists in this project |
| TypeScript | 7.x (7.0.2) | Types across app, components, tests; prop APIs as enforced contracts (e.g., `aria-label` required by the types when children aren't text) | Turns the §6 rules from review-time conventions into compile-time errors; TS 7 is the native-compiler generation, keeping full-repo checks fast in CI. If any tool in the chain lags TS 7, pinning to 6.x is the sanctioned fallback — record it in §15 |
| next-intl | 4.x (4.13.4) | ICU messages in `messages/{locale}.json`; `useTranslations` in sections/pages only; localized metadata; locale-aware navigation/links | ICU MessageFormat handles Romanian one/few/other plurals; built for the App Router; works without middleware under static export |
| Tailwind CSS + @tailwindcss/postcss | 4.x (4.3.3) | All styling as utilities; design tokens via `@theme`; the semantic **light theme** block via `@theme inline`; container queries (core); logical-property utilities | CSS-first tokens make the two-layer/theme architecture native; container queries implement §6.5; the untouched default scales are the industry standard this whole plan leans on |
| Storybook | 10.x (10.5.5) | The component workbench: stories + controls for every component; the five named viewports + 320; locale toolbar incl. pseudo-locale; page stories with mock messages | Every checkpoint in this brief — viewport, language, a11y state — becomes a dropdown flip instead of a deploy |
| @storybook/addon-a11y | 10.x (10.5.5) | axe-core checks rendered per story; violations fail CI | Automates the machine-catchable share of WCAG 2.2 AA (§9) at the component level, continuously |
| Vitest | 4.x (4.1.10) | Unit + interaction tests (modal focus trap, switcher, accordion, mobile nav); story-based tests via Storybook's Vitest integration | One fast runner for logic and interaction; integrates natively with Storybook 10 |
| @testing-library/react | 16.x (16.3.2) | Role-based queries inside interaction tests | Querying by role/name forces accessible markup as a side effect — tests double as a11y enforcement |
| Playwright | 1.x (1.62.1) | **The decided visual-regression harness** (Lost Pixel fork closed 2026-07-30): one central spec runs `toHaveScreenshot` against the built Storybook; one Playwright project per named viewport; the tier matrix comes from story-title prefixes (`UI/*` → 1280 only · `Sections/*` → 390+1536 · `Pages/*` → all five + 320); **baselines are platform-suffixed dual sets (amended 2026-07-31): the darwin set generated natively on the dev machine (local pre-commit regression net), the linux set generated only in CI's pinned container via `visual-baseline.yml`** | Built-in pixel diffing, no services, unlimited free runs (§13); same tool serves launch smoke tests later; platform-suffixed snapshots kill cross-OS font-rendering false positives without local Docker |
| ESLint + eslint-plugin-jsx-a11y | 10.x (10.8.0) + 6.x (6.10.2) | Lint gate in CI incl. write-time accessibility rules (no div-as-button, required alt, ...) | Catches a11y and quality violations at typing time, before Storybook or review sees them |
| pre-commit framework + Prettier *(amended 2026-08-01, §15.8 — replaces Husky + lint-staged)* | pinned revs + 3.x (3.9.6) | `.pre-commit-config.yaml`: commit stage = eslint --fix + prettier --write on staged files; push stage = tsc --noEmit + vitest run; Prettier check-all repeated in CI | One hook manager, same tool as the owner's other repos; fast feedback before CI; hooks can be bypassed, CI cannot — both exist on purpose |
| @next/mdx | 16.x (16.2.12) | Blog posts as MDX in `content/blog/`, Romanian only, compiled at build time | Official, zero-runtime, fully compatible with static export |
| next-image-export-optimizer + sharp | 1.x (1.20.1) + 0.35.x (0.35.3) | Build-time WebP/AVIF `srcset` generation behind the single `ui/Image` wrapper | Fills the static-export gap (no runtime image optimizer on a static host). Named candidate — confirm at Phase 0 per §15 before the first photo |
| next/font (local) — **Source Serif 4** (display + body) & **JetBrains Mono** (eyebrows/micro-labels) | OFL variable fonts, latest from google/fonts | Self-hosted, subset at build time with automatic fallback metrics; token names `--font-display` / `--font-body` / `--font-mono` (never `--font-sans`) | Closest verified match to the Publio logo lettering (see font_specimen.png); full five-language coverage incl. Ș ș Ț ț confirmed by cmap inspection; no font CDN (§12); Publio itself ships only inside the vectorized logo SVG |
| schema-dts | 2.x (2.0.0) | TypeScript types for the `Dentist` JSON-LD builder in `lib/seo.ts` | Structured-data typos become compile errors instead of Rich Results Test failures |
| ~~Docker~~ *(amended 2026-07-31)* | — | **Not required on the development machine.** The pinned Playwright container remains the CI environment where the linux baseline set is generated (`visual-baseline.yml`) and compared (release gate) | Deterministic rendering per platform set; baselines never mix environments (§13) |

**Standing configuration notes (unchanged decisions):**
- Tailwind **default breakpoints untouched** (sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536)
  and default spacing scale untouched.
- Design tokens in `styles/globals.css`: theme-independent **primitives** in `@theme`, plus
  **semantic color tokens scoped as themes** (`:root` / `[data-theme='light']`, wired to
  utilities via `@theme inline`). **v1 ships exactly one theme: light.** Future themes remap
  the same variable names additively — no renames, no component edits. `ui/` components consume
  only semantic tokens, never primitives.

## 4. Repository structure

```
src/
  components/
    ui/                  # unitary pieces (Button, Card, Heading, Icon, Input, Image, ...)
      Button/
        Button.tsx
        Button.stories.tsx
        Button.test.tsx
    sections/            # compositions (Header, Footer, Hero, ServiceCard, ContactModal, ...)
  app/
    [locale]/            # ro | en | de | fr | it
      layout.tsx         # THE SHELL: <html lang>, message provider, Header, {children}, Footer
      page.tsx           # Home content  → /ro
      services/page.tsx  #               → /ro/services
      team/page.tsx      #               → /ro/team
      blog/page.tsx      # ro only       → /ro/blog
      blog/[slug]/page.tsx
      not-found.tsx      # localized 404
    page.tsx             # root "/" → client-side locale redirect (see §5)
  lib/
    clinic.ts            # SINGLE SOURCE of NAP: name, address, phone, hours, geo, sameAs links
    seo.ts               # JSON-LD builder, metadata helpers, sitemap/hreflang generation
  messages/
    ro.json en.json de.json fr.json it.json   # namespaces: common, home, services, team, blog, contact
  content/blog/          # MDX posts (ro)
  styles/globals.css     # Tailwind theme tokens
public/                  # pre-optimized images, self-hosted fonts, robots.txt
```

**Dependency direction (hard rule):** `app` → `sections` → `ui` → tokens. Never the reverse.
`ui/` never imports from `sections/` or `app/`. Anything used by 2+ sections gets promoted to `ui/`.

## 5. Routing specification

The **shell is dictated by locale, content by the sub-route**: `app/[locale]/layout.tsx` renders
the Header and Footer in that locale's language and wraps `{children}`; child routes supply content.
`/de/team` = German shell + German team content.

| Route | ro | en | de | fr | it |
|---|---|---|---|---|---|
| Home | `/ro` | `/en` | `/de` | `/fr` | `/it` |
| Services (incl. prices) | `/ro/services` | ✓ | ✓ | ✓ | ✓ |
| Team | `/ro/team` | ✓ | ✓ | ✓ | ✓ |
| Blog index + posts | `/ro/blog`, `/ro/blog/[slug]` | — | — | — | — |
| Contact | modal, no route (see §14) | | | | |

- **Home lives at `/{locale}` itself.** Do not create `/{locale}/home`.
- `generateStaticParams` emits all locale × route combinations at build time; blog routes are
  generated for `ro` only, and the Blog nav item is hidden on non-`ro` locales.
- **Root `/`:** a tiny client-side script (static export has no middleware) redirects to the
  remembered locale cookie if present, else the closest match of `navigator.language`, else `/ro`.
- **Language switcher** navigates to the *equivalent path* under the target locale prefix and sets
  the language cookie. Blog pages switch to the target locale's home (no equivalent exists).
- Localized 404 per locale. Set `trailingSlash: true` for clean static hosting.
- **Parked decision:** localized slugs (`/de/leistungen`). Default to shared English slugs for now;
  ask before launch — changing URLs later requires redirects.

## 6. Component architecture rules

1. **Closed systems: props in, UI out.** `ui/` components hold no global state, import no app
   logic, and never style anything outside their own root.
2. **Slots over modes.** Content goes through `children` / named slots. A Button accepts arbitrary
   children (text, icon, image) — never `type="text" | "image"` props. Props are for genuine
   variants (size, tone, disabled).
3. **Accessible-name enforcement in the API.** If an interactive component's children are not
   text, an `aria-label` prop is **required by the TypeScript types**, not optional.
4. **No outer margins on `ui/` components.** Parents own spacing via gap/stack utilities.
5. **Container queries for component responsiveness** (Tailwind v4 `@container` + container
   variants); **media queries only for page-level layout** in sections/pages.
6. **Props are a public API.** Changing a prop's meaning is a deliberate breaking change: update
   every usage and every story in the same commit.
7. Scoped styling only (Tailwind utilities). No global CSS beyond the token layer and resets.
8. **Native-element fidelity:** `ui/` components spread remaining native props onto their root
   element, accept `ref` as a regular prop (React 19 — no forwardRef ceremony), and merge an
   incoming `className`. Parents may use `className` for positioning/spacing (consistent with
   rule 4: the parent owns spacing) — never for restyling a component's internals.

## 7. Responsive contract

- **Breakpoints:** Tailwind defaults, mobile-first, never customized.
- **Named test viewports** (CSS px), defined once in Storybook and reused by visual tests:
  Smartphone **390×844** · Tablet **768×1024** · Notebook **1280×800** · Laptop **1536×864**
  · Desktop **1920×1080** — plus **320px** as the accessibility stress width.
- Layouts are **fluid between checkpoints** (min/max, flex, grid) — the five sizes are sampling
  points, not the design. Nothing may require horizontal scrolling at 320px.
- All sizing in `rem` so browser zoom and user font settings behave.

## 8. Internationalization contract

1. **`ui/` components are locale-agnostic.** They receive already-translated strings via
   props/children and never call `t()`. Translation happens in `sections/` and pages.
   Exception: internal labels (e.g., a modal's close button) are props **with defaults**.
2. **ICU everywhere:** plurals via ICU categories (Romanian has one/few/other), interpolation
   instead of string concatenation, never build sentences from fragments, no text inside images.
3. **Formatting via `Intl`:** `Intl.NumberFormat` for prices (RON; EUR display on foreign locales
   is a parked decision — ask), `Intl.DateTimeFormat` for dates.
4. **Text expansion headroom:** German ≈ +30–35%, French/Italian ≈ +15–25% vs English. Use
   `min-width` on buttons, `min-height` on cards; never fixed widths on text containers.
5. **Language switcher:** in the Header; each language named in itself — Română, English,
   Deutsch, Français, Italiano. No flags-as-languages. Fully keyboard-accessible.
6. **First visit:** optional dismissible suggestion banner based on `navigator.language`.
   **Never** redirect by IP/geolocation.
7. **Language cookie:** first-party, set **only on explicit click** (switcher or banner accept),
   lifetime 6–12 months, disclosed on the policy page. Also stores banner-dismissed state.
8. **Fonts self-hosted** (never Google Fonts CDN): **Source Serif 4** for display + body,
   **JetBrains Mono** for the uppercase wide-tracked eyebrow pattern — both OFL variable fonts
   with verified full coverage of Romanian comma-below **Ș ș Ț ț (U+0218–021B) + ă â î**,
   German ä ö ü ß + ẞ, French/Italian accents. Verify visually in the Phase 0 glyph story.
9. **Pseudo-locale** in the Storybook locale toolbar: accented, ~40%-expanded strings.
   Untransformed text in pseudo-locale = hardcoded string = bug.
10. `<html lang>` set per locale in the layout. Translations are authored manually by the owner —
    keep them in the message files regardless, never inline.

## 9. Accessibility contract (WCAG 2.2 AA)

- Semantic HTML first: real `<button>`/`<a href>` (never click-handler divs), one `<h1>` per page,
  logical heading order, landmarks (header/nav/main/footer).
- Color contrast ≥ **4.5:1** for text, **3:1** for large text and UI components.
- **Visible focus** on every interactive element (`focus-visible` styles); never remove outlines
  without replacement.
- Touch/click targets ≥ **24×24px**, aim **44px** for primary actions (the phone CTA especially).
- Respect `prefers-reduced-motion` (Tailwind `motion-reduce:`) — no essential info in animation.
- **Reflow at 320px** with no horizontal scroll; test at 200% browser zoom.
- **ContactModal spec:** dialog semantics, focus moves in on open, Tab trapped, Esc closes,
  focus returns to the trigger, background scroll-locked and inert, phone number is a large
  `tel:` link, fits 320px.
- Icon-/image-only controls always have an accessible name (enforced per §6.3).
- Tooling: a11y addon on every story (zero violations = merge gate), `eslint-plugin-jsx-a11y`,
  role-based Testing Library queries. Page tier additionally gets a manual keyboard walkthrough
  and a screen-reader pass (NVDA or VoiceOver) before launch.

## 10. SEO-readiness contract (developer scope)

Marketing (Google Business Profile, reviews, directories) is the owner's job. The site's job:

1. **`lib/clinic.ts` is the single source of NAP** (name, address, phone, hours, geo, sameAs).
   It feeds the Footer, the ContactModal, **and** the JSON-LD — consistency by construction.
2. **JSON-LD on every page:** schema.org type **`Dentist`** (the specific type, not generic
   LocalBusiness) with name, address, geo, telephone, openingHoursSpecification, url, image,
   priceRange, sameAs. Optional `Service` markup on the Services page. Must pass Google's
   Rich Results Test with zero errors.
3. **Per-route, per-locale `<title>` + meta description**, authored in the message files
   (pattern: *Service — Clinic — City*). Open Graph tags + a default share image (links travel
   via WhatsApp/Facebook here).
4. **`sitemap.xml`** listing every locale URL with hreflang alternates + `x-default`;
   blog URLs listed without alternates. **hreflang link tags** in each page head mirroring it.
   Self-referencing canonical per page. `robots.txt` pointing at the sitemap.
5. Crawlable **Footer NAP** on every page (the contact modal is UX, the footer is for crawlers).
6. **Core Web Vitals as acceptance criteria:** run Lighthouse/PageSpeed against the built export
   for each page type; the hero image is the LCP element — treat regressions as failures.
7. Launch handoff: submit sitemap in Google Search Console; owner claims Google Business Profile.

## 11. Images contract

- **Build-time optimization** (static export cannot use Next's runtime optimizer): a build-step
  optimizer (e.g. `next-image-export-optimizer` or a sharp script — final pick is a parked
  decision that must be resolved **before the first photo enters the repo**) pre-generates
  WebP/AVIF at multiple widths for `srcset`.
- All images go through **one wrapper component `ui/Image`** that bakes in the optimizer,
  required width/height (reserve space — zero layout shift), lazy-loading below the fold,
  and eager + high-priority for the hero.
- `alt` text is required, translated content from the message files.
- Uniform aspect ratios for team photos.

## 12. Privacy & cookies contract

- **Allowed storage:** the language cookie of §8.7. Nothing else.
- **Banned (each would force a consent banner):** Google Analytics / any cookie-setting
  analytics, embedded Google Maps (use a static map image linking out, or click-to-load),
  YouTube embeds (click-to-load facade only), reCAPTCHA, third-party chat widgets
  (a plain `wa.me` link is fine), Google Fonts CDN (self-host).
- A short **privacy/cookie policy page** (all locales) disclosing the language cookie.
- **Analytics is out of scope by owner decision** — historical data explicitly not needed,
  so never install any analytics script. If this ever changes: cookieless only (Plausible/
  Umami/Cloudflare) = one script tag, no banner. Search Console + GBP insights already cover
  measurement.

## 13. Testing & quality gates

- **Stories:** every component has a Default story with controls + one story per meaningful
  state. Sections/pages additionally get viewport-pinned stories. Page stories render the real
  sections with mock messages via a decorator; ContactModal gets an **open-state** story.
  Story/demo/test values default to **Romanian (diacritics-bearing)**; DE + pseudo-locale are
  kept as dedicated stress variants *(amended 2026-07-31, §15.7)*.
- **Visual regression policy (final, amended 2026-07-31):** `ui/` = 1280 only (opt-in 320 tag
  where layout-relevant) · `sections/` = 390 + 1536 · pages = **390 / 768 / 1280 / 1536 / 1920
  + 320**, in RO + DE (longest language). One Playwright project per width; stories route to
  projects by title prefix. Baselines live in the repo as **platform-suffixed dual sets**:
  the **darwin set** generated natively on the development machine (the local pre-commit
  regression net), the **linux set** generated only inside the pinned Playwright container via
  the `visual-baseline.yml` workflow (compared by the release gate). Disable animations in
  snapshots.
- **a11y checks** run on every story and fail CI on violations.
- **Interaction tests** (Vitest + Testing Library) for anything stateful: modal, switcher,
  FAQ accordion, mobile nav.
- **Translation-parity test:** a Vitest check asserting all five `messages/*.json` share an
  identical key set — a missing translation fails CI instead of leaking English.
- **Link check:** linkinator crawls the built export for broken internal links and hreflang
  targets on every CI run.
- **CI lanes (decided, see GITHUB_SETUP.md):** branches `main` (production) + `develop`
  (default). Fast lane `ci.yml` on PRs/pushes to `develop`: format check → lint (incl.
  jsx-a11y) → typecheck → Vitest (unit/interaction/per-story axe) → Storybook build → site
  build → link check. Release gate `release.yml` on PRs to `main`: everything above **plus
  the full visual suite against the linux baseline set inside the pinned Playwright
  container**; push to `main` builds production (deploy step pending host). Day-to-day pixel
  testing runs **locally, native** (`npm run visual` / `visual:update` — the darwin set), at
  minimum in the commit ritual *(amended 2026-07-31)*. Hooks (pre-commit framework, §15.8): commit =
  eslint + prettier on staged files, push = typecheck + tests. Dependabot: weekly grouped **patch-only** PRs into `develop`,
  majors and minors ignored, **no automerge**.

## 14. Content model

| Page | Sections | Namespace |
|---|---|---|
| Home | Hero · ServicesTeaser · TrustStrip (opt) · CTABanner | `home` |
| Services | ServicesIntro · ServiceCard list with price rows · FAQ (opt) · CTABanner | `services` |
| Team | TeamIntro · TeamMemberCard grid · ClinicGallery (opt) | `team` |
| Blog (ro only) | PostCard list · PostPage (MDX) | `blog` |
| Contact (modal) | ContactModal: `tel:` phone, WhatsApp, address, hours, directions link | `contact` |
| Global | Header (nav + Contact button + LanguageSwitcher) · Footer (**full NAP** + hours + policy link) | `common` |

## 15. Parked decisions — ASK before deciding, do not improvise

1. Design tokens — **LOCKED 2026-07-30** on the TOKEN_AUDIT proposal plus these owner
   decisions: CTA restored to the green family (`#008854` button face, `#00A968` anchor);
   fonts **Source Serif 4** (display + body) + **JetBrains Mono** (eyebrows), Publio only
   inside the vectorized logo; body base **1.125rem**; default radius **6px**; star
   `#B29126`; hero text scrim floor ≥ 0.55; single light theme; long prose `text-align:
   start`; `success` role dropped (17 semantic roles total). Amendments from contradiction
   review: font tokens are named `--font-display` / `--font-body` / `--font-mono` (never
   `--font-sans`); one additional role `--color-accent-decorative: #7A6D9C` for large
   display text (≥ 3:1 contexts) and graphics only — the a11y addon polices misuse.
   **Only open sub-item:** confirm the purple hue against the real logo/signage when the
   owner supplies it. Until Phase 0 writes these values, provisional neutrals stand.
2. Hosting & environments — **environments decided:** GitHub Environments `development`
   (auto-deploys every push to `develop` to a staging URL that is **always noindex** via the
   `STAGING=1` build flag) and `production` (deploys from `main` only, **required-reviewer
   approval** before going live). CI is GitHub Actions (two-branch model, PR template =
   playbook DoD, Dependabot patch-only per §3). Host still open with one exclusion:
   **production will not be GitHub Pages** (owner, 2026-07-31); recommended candidate
   Cloudflare Pages, pending confirmation — until then both deploy steps are placeholders.
3. Localized URL slugs (decide before launch).
4. EUR price display on non-`ro` locales.
5. Image optimizer final pick (blocks the first photo, nothing else).
6. **Logo file, favicon, and OG share image** — the logo exists (set in Publio lettering)
   but is not in the repo; owner must supply it. Vectorize it to SVG (Publio never ships as
   a webfont) — this also settles the purple confirmation in item 1. Blocks §10.3 OG tags
   and the favicon, not the early phases.
7. **Visual-testing environment — DECIDED 2026-07-31 (owner, via plan-canvas review):**
   no Docker on the development machine. Playwright baselines are **platform-suffixed dual
   sets**: the **darwin set** is generated/compared natively on the workstation and serves
   as the pre-commit cross-component regression net (run at minimum in the commit ritual);
   the **linux set** is generated **only** by `.github/workflows/visual-baseline.yml` inside
   the pinned Playwright container and is what the release gate compares — refresh it at
   latest before each `develop → main` promotion. `release.yml` is unchanged. Also decided:
   story/test/demo values default to **Romanian with diacritics** (DE + pseudo-locale remain
   stress-only variants), and **commits happen only on the owner's explicit instruction** —
   flows end at "ready + evidence" and wait.
8. **Hook manager — DECIDED 2026-08-01 (owner, via flow-audit canvas):** the **pre-commit
   framework** (`.pre-commit-config.yaml`, pinned revs, deliberate manual rev bumps) replaces
   Husky + lint-staged from §3. Stages: commit = eslint --fix + prettier --write on staged
   files; push = tsc --noEmit + vitest run. Activation at Phase 0:
   `pre-commit install --hook-type pre-commit --hook-type pre-push`. CI is unchanged and
   remains the referee. Branch model reaffirmed: parallel feature branches → PRs into
   `develop`; the owner alone times the `develop → main` promotion.

## 16. Build-time vs runtime contract

**Decision rule: identical for every visitor — compiled at build. Depends on this visitor —
runtime in the browser, as the smallest possible client island.** There is no request-time
middle layer: `output: 'export'` means no server exists; the host serves files.

**Compiled at build (`next build`):**
- Every locale × route rendered to **complete static HTML** — all site content (services,
  prices, team, blog) with **all translations already resolved** into the markup by next-intl;
  messages needed by client islands are serialized alongside.
- All metadata (titles, descriptions, hreflang, OG, canonicals), the `Dentist` JSON-LD,
  `sitemap.xml`, `robots.txt`, the localized 404s.
- MDX blog compiled to markup; images pre-generated into WebP/AVIF width variants with `srcset`
  baked into the HTML; fonts subset with preload tags.
- The single Tailwind stylesheet **including all theme token values** — primitives and the
  light theme's semantic block. Theme *values* are never computed at runtime.
- JS bundles for the client islands only.

**Runtime, in the visitor's browser:**
- Hydration of the client islands **only**: ContactModal, LanguageSwitcher, mobile nav,
  language-suggestion banner, root `/` redirect script. Everything else stays inert HTML.
- Visitor-dependent decisions: root redirect (cookie → `navigator.language` → `/ro`), setting
  the language cookie on explicit click, banner show/dismiss state.
- Theme application: **in v1, nothing** — light is the `:root` default. If a second theme ever
  ships: one `data-theme` attribute flip on `<html>` plus a tiny inline pre-paint script to
  avoid a wrong-theme flash; values still come from the build-time CSS.
- The browser evaluating conditions inside the build-time CSS: media queries, container
  queries, `prefers-reduced-motion` (and `prefers-color-scheme` only if a dark theme exists).

**Never at runtime:** data fetching, loading translation files over the network, image
resizing, server rendering, analytics.

**Consequences:**
1. Content changes (a price, a bio, a post) require rebuild + redeploy: edit
   `messages/*.json` or MDX → push → CI builds → host updates. Intended workflow, not a bug.
2. **Hydration-safety rule:** visitor-dependent UI (banner, redirect) renders a neutral default
   in the build HTML and decides only **after mount** — never branch on cookies or browser
   state during initial render, or hydration mismatches follow.

## 17. Working agreements for Claude Code

1. Read this file and `MIGRATION_PLAYBOOK.md` before writing code; follow the playbook's phases.
2. The old project is **read-only reference** — requirements source, never an import source.
3. One component (or one route) per commit, with its stories and tests in the same commit.
4. Never violate §6 dependency direction; never hardcode a user-facing string; never add a
   dependency that stores data on the visitor's device.
5. When a situation isn't covered here, or a parked decision blocks you: **stop and ask** —
   don't decide silently. Record new decisions by appending to §15 or amending the relevant §.
6. *(Added 2026-07-31)* The project skills **`/new-atom`** (component migration flow) and
   **`/debug-deep`** (ECC-native root-cause debugging loop) in `.claude/skills/` define the
   standing workflows — follow them. Commits happen **only on the owner's explicit
   instruction** (§15.7); flows end at "ready + evidence" and wait.
