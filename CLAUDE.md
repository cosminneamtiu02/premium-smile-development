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
| Next.js | 16.x (16.3.4 — §15.16 minor crossing, 2026-09-06) | App Router with the `[locale]` segment; `output: 'export'` pre-renders every locale × route to static HTML; `generateStaticParams`; Metadata API for per-locale titles, descriptions, hreflang, OG | The locale-shell routing model (§5) and static export are first-class features; the Metadata API implements the SEO contract (§10) without hand-rolled head management |
| React | 19.x (19.2.8) | Component model for all three tiers | Required by Next 16; used as a plain rendering substrate — no client data fetching exists in this project |
| TypeScript | 7.x (7.0.2) | Types across app, components, tests; prop APIs as enforced contracts (e.g., `aria-label` required by the types when children aren't text) | Turns the §6 rules from review-time conventions into compile-time errors; TS 7 is the native-compiler generation, keeping full-repo checks fast in CI. If any tool in the chain lags TS 7, pinning to 6.x is the sanctioned fallback — record it in §15 |
| next-intl | 4.x (4.13.7 — re-verified against Next 16.3, §15.16: stays) | ICU messages in `messages/{locale}.json`; `useTranslations` in sections/pages only; localized metadata; `useLocale` as the locale source for both halves of the URL rule. **Navigation is not next-intl's job here (§15.13):** internal links are plain anchors built by `src/i18n/href.ts`, and the active-nav path comes from `src/i18n/navigation.ts`'s own hook over `next/navigation` | ICU MessageFormat handles Romanian one/few/other plurals; built for the App Router; works without middleware under static export |
| Tailwind CSS + @tailwindcss/postcss | 4.x (4.3.3) | All styling as utilities; design tokens via `@theme`; the semantic **light theme** block via `@theme inline`; container queries (core); logical-property utilities | CSS-first tokens make the two-layer/theme architecture native; container queries implement §6.5; the untouched default scales are the industry standard this whole plan leans on |
| Storybook | 10.x (10.5.5) | The component workbench: stories + controls for every component; the five named viewports + 320; locale toolbar incl. pseudo-locale; page stories with mock messages | Every checkpoint in this brief — viewport, language, a11y state — becomes a dropdown flip instead of a deploy |
| @storybook/addon-a11y | 10.x (10.5.5) | axe-core checks rendered per story; violations fail CI | Automates the machine-catchable share of WCAG 2.2 AA (§9) at the component level, continuously |
| Vitest | 4.x (4.1.10) | Unit + interaction tests (modal focus trap, switcher, accordion, mobile nav); story-based tests via Storybook's Vitest integration | One fast runner for logic and interaction; integrates natively with Storybook 10 |
| @testing-library/react | 16.x (16.3.2) | Role-based queries inside interaction tests | Querying by role/name forces accessible markup as a side effect — tests double as a11y enforcement |
| Playwright | 1.x (1.62.1) | **The decided visual-regression harness** (Lost Pixel fork closed 2026-07-30): one central spec runs `toHaveScreenshot` against the built Storybook; one Playwright project per named viewport; the tier matrix comes from story-title prefixes (`UI/*` → 1280 only · `Sections/*` → 390+1536 · `Pages/*` → all five + 320); **baselines are platform-suffixed dual sets (amended 2026-07-31): the darwin set generated natively on the dev machine (local pre-commit regression net), the linux set generated only in CI's pinned container via `visual-baseline.yml`** | Built-in pixel diffing, no services, unlimited free runs (§13); same tool serves launch smoke tests later; platform-suffixed snapshots kill cross-OS font-rendering false positives without local Docker |
| ESLint + eslint-plugin-jsx-a11y | ~~10.x (10.8.0)~~ **9.x (~9.39.5) — §15.11 pin** *(annotated 2026-09-02)* + 6.x (6.10.2) | Lint gate in CI incl. write-time accessibility rules (no div-as-button, required alt, ...) | Catches a11y and quality violations at typing time, before Storybook or review sees them |
| pre-commit framework + Prettier *(amended 2026-08-01, §15.8 — replaces Husky + lint-staged)* | pinned revs + 3.x (3.9.6) | `.pre-commit-config.yaml`: commit stage = eslint --fix + prettier --write on staged files; push stage = tsc --noEmit + vitest run; Prettier check-all repeated in CI | One hook manager, same tool as the owner's other repos; fast feedback before CI; hooks can be bypassed, CI cannot — both exist on purpose |
| @next/mdx | 16.x (16.3.4 — version-locked to next, §15.16) | Blog posts as MDX in `content/blog/`, Romanian only, compiled at build time | Official, zero-runtime, fully compatible with static export |
| next-image-export-optimizer + sharp | 1.x (1.20.1) + 0.35.x (0.35.3) | Build-time WebP/AVIF `srcset` generation behind the single `ui/Image` wrapper | Fills the static-export gap (no runtime image optimizer on a static host). Named candidate — confirm at Phase 0 per §15 before the first photo |
| next/font (local) — **Source Serif 4** (display + body) & **JetBrains Mono** (eyebrows/micro-labels) | OFL variable fonts, latest from google/fonts | Self-hosted, subset at build time with automatic fallback metrics; token names `--font-display` / `--font-body` / `--font-mono` (never `--font-sans`) | Closest verified match to the Publio logo lettering (see font_specimen.png); full five-language coverage incl. Ș ș Ț ț confirmed by cmap inspection; no font CDN (§12); Publio itself ships only inside the vectorized logo SVG |
| schema-dts | 2.x (2.0.0) | TypeScript types for the `Dentist` JSON-LD builder in `lib/seo/seo.ts` | Structured-data typos become compile errors instead of Rich Results Test failures |
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
      (home)/page.tsx    # Home content  → /ro (route group: folder only, URL-invisible; owner 2026-09-06)
      services/page.tsx  #               → /ro/services
      team/page.tsx      #               → /ro/team
      blog/page.tsx      # ro only       → /ro/blog
      blog/[slug]/page.tsx
      404/page.tsx       # localized 404 → /ro/404 — real shell page ×5 (S6, §5; dispatcher = out/404.html)
    page.tsx             # root "/" → client-side locale redirect (see §5)
  lib/                   # one folder per module, its test beside it (lib-foldering lane, 2026-09-06)
    clinic/clinic.ts     # SINGLE SOURCE of NAP: name, address, phone, hours, geo, sameAs links
    routes/routes.ts     # THE route list + matchesRoute/equivalentPath (one list, all consumers)
    hours/hours.ts       # schedule → printable rows (deterministic reference week)
    scroll-lock/scroll-lock.ts  # THE page scroll freeze (React-free mechanics)
    scroll-spy/scroll-spy.ts  # THE "which target am I in" mechanic: landing-line walk + bottom rule + top fallback + click pin (React-free; price-list pack round 2, 2026-09-14)
    sticky-rail/sticky-rail.ts  # THE "where does a sticky rail taller than the window pin" mechanic: fits · top · bottom · travel, direction-aware, a focused link reveals its edge (React-free; price-menu-pin lane, 2026-09-18)
    reduced-motion/reduced-motion.ts  # THE prefers-reduced-motion seam: read + watch (React-free; rotation lane 2026-09-09)
    clock/clock.ts       # THE auto-advance beat: timeout chain + the APG time manners (sticky pause/play, transient cause-keyed suspend/resume, first dwell, reduced-motion + tab-hidden reactions, external driver)
    rotation/rotation.ts # the ring on a clock: active index, step, wrapIndex, liveRegion, rotationControl, classifyFocusEntry/leavesRegion — consumed through useSyncExternalStore (its header IS the consumption law)
    rotation-group/rotation-group.ts  # one beat, many rings — opt-in sync; the site default stays independent clocks
    external-store/external-store.ts  # THE useSyncExternalStore protocol (subscribe · getSnapshot · getServerSnapshot · sync) — clock, rotation, rotation-group publish through it (org-review F1, owner fb-426, 2026-09-09)
    cx/cx.ts             # THE class-join helper — every tier imports it (fb-307 → PR #64)
    rating/rating.ts     # THE star-rating value type (eleven half-steps) + guards — atoms AND the data list import it (reviews run D17, 2026-09-10)
    initials/initials.ts # THE two-capital monogram type + guards — the twin of lib/rating (D17)
    reviews/reviews.ts   # THE review list (facts + five-language words per row; ships EMPTY until the owner's real reviews — D2/D15/D18; beside it `demoReviews`, the stories' six fabricated rows, of which the Home band shows five until then — owner 2026-09-20, flagged)
    prices/prices.ts     # THE price list — 11 categories · 102 fixed whole-RON rows, facts + five-language words per row (RO transcribed from the owner's printed tariff 2026-09-13; EN/DE/FR/IT DRAFTED, flagged; an eyebrow on EVERY category — eleven, eight drafted 2026-09-14); the Services page populates the DUMB band from it (§15.20)
    image-path/image-path.ts  # THE picture-path type (`/images/${string}`, type-only) — promoted by the hero lane on §15.19's recorded trigger; lib/reviews, lib/hero-slides, ui/Avatar, ReviewCard and ReviewsDeck all import it (2026-09-19)
    hero-slides/hero-slides.ts  # THE Home opener's slides — picture + five-language words per row (RO/EN the old site's own; DE/FR/IT, the short names and every `text` line DRAFTED, flagged; demo pictures until the owner's photographs); the Home page populates the DUMB Hero band from it (hero lane, 2026-09-19)
    not-found-html/not-found-html.ts  # THE 404 dispatcher document builder (out/404.html via tools/generate-404.ts; S6)
    seo/seo.ts           # JSON-LD builder, metadata helpers, sitemap/hreflang generation
  i18n/
    locales.ts href.ts navigation.ts routing.ts request.ts   # manifest · URL rule · "where am I" · next-intl wiring
  assets/glyphs/         # whole-svg NOUN components + hand-maintained registry (README = folder law)
  fonts/                 # self-hosted variable subsets via next/font (shell-only import)
  messages/
    ro.json en.json de.json fr.json it.json   # namespaces: common, home, services, team, blog, contact
  content/blog/          # MDX posts (ro)
  styles/globals.css     # Tailwind theme tokens
public/                  # pre-optimized images, self-hosted fonts, robots.txt
```

**Dependency direction (hard rule):** `app` → `sections` → `ui` → tokens. Never the reverse.
`ui/` never imports from `sections/` or `app/`.

*(Amended 2026-09-02 — owner approval on the develop-org-review board: the map below records
what the tree already practices; no code moved.)*

- **The foundation ring** sits beside the spine, importable from any tier: `lib/` (site DATA —
  clinic, routes, hours — and React-free MECHANICS — scroll-lock) and `i18n/` (the locale
  manifest + the URL rule). *("React-free", not "browser-free" — scroll-lock touches the DOM,
  not React; cx-to-lib lane, 2026-09-02.)* Constraints that keep the ring honest: `ui/` may
  import lib MECHANICS (the scroll-lock paper-trail precedent) and `assets/` glyphs, but never
  lib DATA and never `i18n/` (§8.1 — atoms are locale-agnostic); `fonts/` is the shell's alone;
  `tools/` may import `src` pure modules, and nothing imports `tools/`.
- **Section → section:** a section MAY compose another section's public component (Header and
  Footer render Wordmark; FloatingActions renders LanguageSwitcher — the dossier model). A
  section NEVER imports another section's internals — hooks, helpers, data modules; shared
  plumbing climbs to `lib/` or `ui/` instead (the lib/routes.ts precedent).
- **Promotion, corrected:** "used by 2+ sections → promote to `ui/`" applies to PRIMITIVES
  only. A composite (anything composing `ui/`) never promotes, however heavy its reuse —
  reuse only schedules it earlier in the build order (the SectionHeading paradox;
  /classify-component rules 3–4).
- **`sections/` holds three sub-kinds** — page BANDS wired to site data (Header, Footer,
  FloatingActions), props-in SHARED COMPOSITIONS with zero message keys (Wordmark,
  SectionHeading), and app-wired ISLAND CLUSTERS (ContactModal, LanguageSwitcher). Tier
  membership is decided by the import graph, never by size or reuse. Page-phase default: a
  repeated unit shared by 2+ consumers starts props-in; message keys stay with the band that
  composes it.
- **Sharing decision table** (the case law, indexed — full arguments live in the named files):

  | Situation | Move | Precedent |
  |---|---|---|
  | Identical MECHANICS, second consumer arrives | extract to the nearest tier both may import | `ui/slot.ts` (fb-64) · `ui/disc.ts` (D17) · `lib/routes.ts` |
  | Values that must AGREE while files stay independent ("feel": clocks, easings) | KEEP-IN-SYNC pair — bidirectional pointers, at least one side test-pinned | `--fade` (fb-44) · `discTransition` |
  | Byte-identical copies discovered at N ≥ 3 | dedicated promotion lane, never a drive-by | `lib/cx.ts` (fb-307) |
  | A fact about the site needed across sections | `lib/` from day one | `clinic.ts` · `routes.ts` |

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
  generated for `ro` only, and the Blog nav item is hidden on non-`ro` locales — and, since
  2026-09-20, offered NOWHERE for now (owner: "drop it for now"; `lib/routes`' `hidden` flag on
  the row, which the switcher's equivalent-path rule still reads).
- **Root `/`:** a tiny client-side script (static export has no middleware) redirects to the
  remembered locale cookie if present, else `/ro`
  *(re-amended 2026-09-06, owner — root Romanian-first, superseding the 2026-09-02 D1
  amendment: the `navigator.language` walk and its `/en` no-match branch left the stub; the
  §8.6 banner is the only auto-detect surface, so an unmatched visitor lands on Romanian with
  the switcher one tap away. hreflang routes Google searches before `/` is ever clicked, and
  `defaultLocale`'s roles are unchanged: the stub's `<html lang>`, its title source, and the
  sitemap `x-default` — already `/ro` — §10.4)*.
- **Language switcher** navigates to the *equivalent path* under the target locale prefix and sets
  the language cookie — a full document load, like every other link (§15.13). Blog pages switch to
  the target locale's home (no equivalent exists).
- Localized 404 per locale — **DECIDED 2026-09-06 (S6 lane, owner):** five real
  `/{locale}/404/` pages inside the shell (heading + message, both centred and
  the heading `404: `-prefixed — owner 2026-09-07, reversing §15.1's one-day
  justify exception) plus ONE tool-emitted `out/404.html`
  dispatcher (`tools/generate-404.ts` from `src/lib/not-found-html/not-found-html.ts`) — the
  file a static host serves with real 404 status for every miss; its inline
  script forwards instantly, URL first segment → language cookie → `ro`; no-JS
  fallback = five lang'd blocks + a visible link list. Routing a miss to home
  and timed redirects are BANNED as soft-404s. The five pages are noindex and
  never enter the sitemap. Set `trailingSlash: true` for clean static hosting.
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
   Internal labels (e.g., a modal's close button) are consumer-supplied **REQUIRED** props —
   no string defaults in `ui/`, nothing Romanian in an atom *(amended 2026-09-02 to match the
   owner's standing fb-259/260 decision, which reversed the earlier "props with defaults"
   clause; Modal's `closeLabel` and SpeedDial's bulb label are the precedents)*.
2. **ICU everywhere:** plurals via ICU categories (Romanian has one/few/other), interpolation
   instead of string concatenation, never build sentences from fragments, no text inside images.
3. **Formatting via `Intl`:** `Intl.NumberFormat` for prices (RON; EUR display on foreign locales
   is a parked decision — ask), `Intl.DateTimeFormat` for dates.
4. **Text expansion headroom:** German ≈ +30–35%, French/Italian ≈ +15–25% vs English. Use
   `min-width` on buttons, `min-height` on cards; never fixed widths on text containers.
5. **Language switcher:** in the Header; each language named in itself — Română, English,
   Deutsch, Français, Italiano. No flags-as-languages. Fully keyboard-accessible.
   *(Amended 2026-09-04, owner — speed-dial-flags lane: decorative country-flag art may
   back the switcher's codes — aria-hidden backgrounds behind white outlined codes,
   never the identification itself, which stays the name-in-itself + visible code;
   `en` wears the Union Jack, the owner's pick over any US flag. "No
   flags-as-languages" keeps meaning: no flag may ever be the only way a language is
   identified.)*
6. **First visit:** optional dismissible suggestion banner based on `navigator.language`.
   **Never** redirect by IP/geolocation.
7. **Language cookie:** first-party, set **only on explicit click** (switcher or banner accept —
   or **banner dismiss**, which stores the CURRENT page's locale, because "I'm fine here" is a
   choice too and §12 allows no second storage; D2, amended 2026-09-04),
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

1. **`lib/clinic/clinic.ts` is the single source of NAP** (name, address, phone, hours, geo, sameAs).
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
  **AMENDED 2026-09-09 (owner, ClinicLocation lane — option A, board fb-416):** the „Ne
  găsești" band ships the old site's live `google.com/maps/embed` `<iframe>` with **no
  consent gate for now** — an accepted, DEFERRED risk on the owner's word ("bypass somehow
  cookies consent for the moment … we'll get to cookies consent and implementation later").
  Measured before the decision (Playwright Chromium, clean profile, EU IP; positive control =
  3 cookies on a top-level maps.google.com visit): the embed itself set **zero** cookies, so
  the "would force a consent banner" premise does not hold for that endpoint — but it does
  hand every visitor's IP to Google's hosts on load (a GDPR data-transfer question, the
  Google-Fonts line of cases, the DE audience), and the page URL no longer travels
  (`referrerPolicy="no-referrer"`, measured). Consent for that transfer is deferred to the
  cookie-strategy lane — the checklist is **COOKIES.md §7**; the section's `CONSENT SEAM`
  comment marks where the future gate wraps the iframe. Everything else in this list stays
  banned as written; **§2 is untouched** — no banner exists, and the only storage on the
  visitor's device remains the language cookie.
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
  eslint + prettier on staged files, push = typecheck + tests. Dependabot: weekly grouped PRs into `develop`,
  **no automerge** — npm: **patch-only**, majors and minors ignored; GitHub Actions: latest allowed
  incl. majors, one grouped PR (carve-out, §15.9).

## 14. Content model

| Page | Sections | Namespace |
|---|---|---|
| Home | **Hero** (the opener — the old site's auto-iterating photo frame as a DUMB props-in rotator on `lib/rotation` through the shared `ui/use-rotation` shell: a full-bleed stage of grey-veiled photographs UNDER the pill filling the whole first screen (`-mt-[calc(6rem+2px)]` + `min-h-svh`, the SIXTH coupled spelling — round 2), the picture zone light (the old 20 % wash back), one slogan per slide on `ui/Heading` 'hero'/'inverse' over ONE static ground that reaches the old site's 0.40 veil at the words' own row (§15.1's rider), an eased fade into the page ground at the bottom, a ContactModalTrigger + an outline services link, beads only — buttons with `aria-current`, no pause/play and NOTHING that stops it for good on the owner's word (a bead press buys a full interval; keyboard focus inside is the one hold; no pointer hold at all); the page is the ONE populator from `lib/hero-slides`; hero lane 2026-09-19, pack rounds 2–3 2026-09-20, §15.21) · ServicesTeaser · **ClinicLocation** (the „Ne găsești" map + contact rows — the first Home band shipped, 2026-09-09, old-site order: late on the page, before the closing band) · **ReviewsCarousel** (the „Părerea ta contează" deck — SectionHeading + ReviewCards on `lib/rotation`; second Home band, built 2026-09-10, replaces the never-built "TrustStrip (opt)"; old-site order: after ClinicLocation; MOUNTED 2026-09-20 on the owner's word — the hero lane's rounds 4–5 — on the first five of `lib/reviews`' `demoReviews` (the Storybook "Five" story's rows, moved into shipped data on the owner's word, flagged) until the real list has a row, at which point the band drops them by itself — §15.19, §15.21) · CTABanner | `home` |
| Services | an `sr-only` h1 (page markup; the VISIBLE opener dropped — owner 2026-09-14, pack round 2 — while §9's one-h1 rule and the SEO outline keep the element) · **PriceList** (the sticky in-page jump menu inside an aura'd Card beside eleven aura'd category cards — SectionHeading eyebrow + title on EVERY card, `<dl>` name/price rows in ONE column always; the menu CARD (nav + title + `<ul>`) is the band's one client island `PriceMenu` on `lib/scroll-spy` (the current category marked `aria-current="location"` in BOTH directions, scroll and click) and `lib/sticky-rail` (a menu taller than the window pins by its bottom edge scrolling down and by its top edge scrolling up, never a scroll container — round 3, 2026-09-18); a DUMB props-in band populated by the page from `lib/prices` — owner brief 2026-09-13 + pack round 2 2026-09-14, board `price-list.plan.md`; supersedes the „ServiceCard list with price rows" dossier; FAQ void per §15.15) · CTABanner | `services` |
| Team | TeamIntro · **PersonnelCard** — doctor profiles (the centred portrait column beside a justified, quoted about-text, sides alternating) + the auxiliary-staff grid (owner brief 2026-09-10, a NEW design with no old-site reference; supersedes the TeamMemberCard dossier) · ClinicGallery (opt) | `team` |
| Blog (ro only) | PostCard list · PostPage (MDX) | `blog` |
| Contact (modal) | ContactModal: `tel:` phone, WhatsApp, address, hours, directions link | `contact` |
| Global | Header (nav + Contact button + LanguageSwitcher) · Footer (**full NAP** + hours + policy link) | `common` |

## 15. Parked decisions — ASK before deciding, do not improvise

1. Design tokens — **LOCKED 2026-07-30** on the TOKEN_AUDIT proposal plus these owner
   decisions: CTA restored to the green family (`#008854` button face, `#00A968` anchor);
   fonts **Source Serif 4** (display + body) + **JetBrains Mono** (eyebrows), Publio only
   inside the vectorized logo; body base **1.125rem**; default radius **6px**; star
   `#B29126` → **`#D4AF37` (amended 2026-09-12, owner — the rider at the end of this item)**; hero text scrim floor ≥ 0.55; single light theme; long prose `text-align:
   start`; `success` role dropped (17 semantic roles total). Amendments from contradiction
   review: font tokens are named `--font-display` / `--font-body` / `--font-mono` (never
   `--font-sans`); one additional role `--color-accent-decorative: #7A6D9C` for large
   display text (≥ 3:1 contexts) and graphics only — the a11y addon polices misuse.
   **Only open sub-item:** confirm the purple hue against the real logo/signage when the
   owner supplies it. Until Phase 0 writes these values, provisional neutrals stand.
   **Exception to the long-prose `text-align: start` lock (2026-09-06, S6 404 lane,
   owner) — REVERSED 2026-09-07 (owner, 404-polish live round: "f*ck justify keep
   centered"):** the 404 page's message paragraph now ships `text-center` as a
   per-element override (§15.15 b canon — the mechanics of the exception survive, its
   value flipped after one day); the dispatcher-fallback twins mirror it so the sentence
   before the forward stays the sentence after it. Scope unchanged: that one paragraph
   and its twins; everything else stays start-aligned. The original justify verdict and
   the SC 1.4.8 caution that accompanied it are recorded history, not live rules.
   **Star token amended 2026-09-12 (owner, reviews pack round 2 — "more golden,
   faded/yellowish, not a dark yellow"):** `--star` = `#D4AF37`, the old site's own gold,
   replacing `#B29126`. Measured: 2.1:1 on white (was 3.0:1 — the SC 1.4.11 star-on-card
   edge is no longer met by the letter; recorded as the owner's call), 3.5:1 against the
   `ink-muted` empties (was 2.4:1 — the two inks now differ in LIGHTNESS, which is what lets
   the rating survive a colour-vision deficiency without the outline the owner struck in the
   same round); the rating's number always travels in the star row's accessible name.
   **Hero veil amended 2026-09-20 (owner, hero pack round 3 — "still a little too dark
   the filter, i want it lighter like in old webpage"):** the Hero's ground peaks at the
   old site's own **0.40**, BELOW the 0.55 floor, spelled in `sections/Hero`'s
   `groundClasses`; the `--scrim` token itself (the modal's backdrop) stays 0.55. Measured
   by the letter: white ink on the worst-case ground (a white photograph at the picture's
   80 % over the page ground, under 0.40) = 2.88:1 and the idle bead 2.40:1, against §9's
   4.5:1 / 3:1 — the old page's `text-shadow` returns on the words as the legibility aid it
   used (the lavender stroke is not ported) and the beads gain a soft shadow; axe measures
   neither. RECORDED AS THE OWNER'S CALL; the lever is that one constant.
   **Second per-element exception — PersonnelCard (2026-09-10, owner verbatim: "extremley
   important. quotation text must be in justify"):** the doctor card's `<blockquote>`
   (sections/PersonnelCard, decision D8) ships `text-justify` ON THE ELEMENT — the §15.15 b
   canon once more; scope: that one element and nothing else, in every locale. WCAG's
   justified-text clause is SC 1.4.8 (AAA), outside the AA acceptance bar; the site-wide
   `hyphens: auto` is what keeps rivers out of justified lines.
2. Hosting & environments — **environments decided:** GitHub Environments `development`
   (auto-deploys every push to `develop` to a staging URL that is **always noindex** via the
   `STAGING=1` build flag) and `production` (deploys from `main` only, **required-reviewer
   approval** before going live). CI is GitHub Actions (two-branch model, PR template =
   playbook DoD, Dependabot patch-only per §3). Host still open with one exclusion:
   **production will not be GitHub Pages** (owner, 2026-07-31); recommended candidate
   Cloudflare Pages, pending confirmation.
   **AMENDED 2026-08-02 (owner): interim GitHub Pages + public repo.** The repo was made
   public (owner choice; the remembered Pro plan proved lapsed), which unlocked and
   activated: the `production` environment **required reviewer** (the go-live click),
   secret scanning + push protection, and GitHub Pages. **Interim production host =
   GitHub Pages** (project site, `PAGES_BASE_PATH=/premium-smile-development`;
   **NOINDEX=1 until the clinic's real domain is attached** — a github.io copy must
   never compete with launch SEO, same hard rule as staging). The 07-31 exclusion now
   applies to LAUNCH only: Cloudflare Pages remains the recommended final host; the
   staging deploy step remains a placeholder. Also enabled: `delete_branch_on_merge`.
3. Localized URL slugs (decide before launch).
4. EUR price display on non-`ro` locales.
5. ~~Image optimizer final pick~~ — **DECIDED 2026-08-01 (owner, Phase 0 kickoff):**
   **next-image-export-optimizer** (~1.20.1, with sharp ~0.35.3) as named in §3, behind the
   single `ui/Image` wrapper. Unblocks the first photo.
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
9. **GitHub-Actions version carve-out — DECIDED 2026-08-01 (owner, Phase 0 kickoff):** the
   §3 majors-and-minors lock protects the **built site's output** and therefore applies to
   the npm stack only. CI actions (`uses:` pins in `.github/workflows/`) cannot alter build
   output; they track **latest majors**, arriving as **one grouped weekly Dependabot PR**
   (still no automerge — owner reviews). Rationale: pinning them buys no determinism while
   accumulating runner-deprecation risk (GitHub already force-runs old actions on newer
   Node). First application: v4→v7 checkout/setup-node/upload-artifact, v4→v6 cache,
   folded into the Phase 0 branch; the four single-action Dependabot PRs (#1–#4) are closed
   as superseded once that lands.
10. **TypeScript pinned to 6.x (~6.0.3) — the §3-sanctioned fallback, exercised 2026-08-02
    (Phase 0):** two chain tools lag TS 7 — Next 16.2's build worker (workaround flag exists)
    and `typescript-eslint` via `eslint-config-next` (hard error, no workaround). Per the §3
    TypeScript row this fallback was pre-sanctioned; recorded here as required. Revisit when
    typescript-eslint ships TS 7 support (then restore ~7.0.2 in one deliberate bump).
    *(Annotated 2026-09-06, §15.16 upgrade: the Next half of this blocker is RESOLVED — Next
    16.3's build worker officially supports TS 7 type checking. typescript-eslint, still
    capping TS at <6.1.0 as of 8.69.0, is now the SOLE blocker; the revisit trigger stands.)*
11. **ESLint pinned to 9.x (~9.39.5) — DECIDED 2026-08-02 (owner, Phase 0):** the React lint
    ecosystem does not support ESLint 10 — `eslint-plugin-react` (newest 7.37.5, peer ≤^9.7)
    crashes on removed ESLint-10 APIs, and `eslint-config-next` ships it. Unlike TS there was
    no pre-sanctioned fallback, so this major crossing was owner-approved explicitly. Bonus:
    `eslint-plugin-jsx-a11y`'s peer range (≤9) is satisfied naturally again, so the
    package.json `overrides` workaround was removed. Revisit when eslint-plugin-react +
    eslint-config-next support ESLint 10; restore ~10.8.0 in one deliberate bump.
12. **Section-migration harness — DECIDED 2026-08-05 (owner, via new-section-flow canvas,
    fb-65–fb-82):** four-skill ECC-native harness: **`/section-breakdown`** (organizer —
    recursive walk with a live ledger, each node logged before descending; gitignored
    workspace `.claude/section-runs/<datetime>_<slug>/` with one implementation dossier per
    component under `atoms/` + `sections/`) · **`/classify-component`** (atom-vs-section
    import-graph rubric, inventory precedence) · **`/new-section`** (per-section build twin
    of `/new-atom`) · `section-builder` agent (Opus). Constraints: workflow deliverables
    reference **ECC machinery only** — no superpowers (fb-70); build lanes are git worktrees
    capped at **2 concurrent** (fb-67), Storybook ports 6007/6008; coordination state =
    **ECC epic GitHub issues** + `coordination:*` labels (fb-69); the **double gate stays** —
    pack approval never commits; each lane waits for its per-lane "commit it" (fb-66, §15.7
    unchanged). The breakdown never builds; every build is owner-triggered (fb-68). Ops
    reference: `.claude/skills/new-section/references/lane-and-epic-glue.md`.
13. **Full-document navigation — DECIDED 2026-08-24 (owner, via brainstorm + canvas
    `full-document-navigation.plan.md`):** every internal link is a plain `<a href>` built by
    `src/i18n/href.ts` (`localeHref`: locale prefix + trailing slash + the interim base path
    from `PAGES_BASE_PATH`, inlined into the browser bundle by `next.config` `env` and into
    the Chromium test project by a `define`). `next/link`, next-intl's `Link` and `useRouter`
    are not used — `src/i18n/navigation.ts` exports only `usePathname`, and
    `no-restricted-imports` rejects the rest — including next-intl's own `createNavigation`,
    which is not used either: destructuring one hook off it still drags `next/link` into the
    client graph as dead code, so `usePathname` is three hand-written lines over
    `next/navigation` and `href.ts`'s `stripLocale` (D9). **No prefetching of any kind.**
    Rationale: the visitor's model (each click = a fresh page), zero navigation JavaScript, no
    prefetch traffic on every page view, native scroll/bfcache/screen-reader behaviour, and
    §16's inert-HTML rule taken to its conclusion. Consequences: Header B1
    (close-on-route-change) and the shell's `data-scroll-behavior` attribute deleted — with
    one exception found in review: a **bfcache restore** DOES bring shell state back (Back
    returns the frozen document with the menu open), so `NavMenu` closes on `pageshow` with
    `persisted === true` (D1); the Phase 3 LanguageSwitcher is
    a list of plain links whose only script sets the cookie (§8.7); the Wordmark home link
    and every future in-content link call `localeHref`.
14. **LanguageSwitcher UI — DECIDED 2026-08-27 (owner, via the language-dial board
    `.claude/plans/language-dial.plan.md`, fb-262–297):** ui/SpeedDial atom (the
    mercury-thermometer chooser) + sections/LanguageSwitcher; D17 GlyphButton verdict =
    Road 3 (`ui/disc.ts` shared geometry, no split, no letters in GlyphButton — recorded
    future trigger: a second letters consumer); the fb-129/136 inert-pill risk closed with
    the FloatingActions swap (PR #49). **Amended 2026-08-28 + 2026-09-01 (owner):** the dial
    renders inside a NAMED `<nav>` landmark (`common.language.region`, one noun ×5 — the G2
    a11y recommendation adopted; the role word never appears in the name), and the bulb's
    `common.language.switch` separator is a comma, not "·" (screen readers speak the comma
    as a pause, the middle dot by name). **Amended 2026-09-01 (owner, hygiene round):**
    the cookie gains `Secure` (HTTPS-only travel) — **amended 2026-09-07 (owner-hit,
    WebKit-reproduced, 404-polish lane): `Secure` rides only `https:` documents.** The
    09-01 rider "localhost dev is a secure context, so development behaviour is
    unchanged" proved Chrome-true but Safari-FALSE — WebKit refuses `Secure` writes from
    any insecure scheme, localhost included, so the banner's ✕ and the switcher's pick
    silently wrote nothing on the plain-http local preview. `src/i18n/cookie.ts`'s pure
    `localeCookieString(locale, protocol)` is the one writer shape (both branches
    test-pinned in tests/unit/locale-cookie.test.ts; the section suites pin the
    http shape through the real writer); deployed HTTPS bytes are unchanged; `hyphens: auto` ships site-wide at the body tier
    (long words — German compounds first — may break at syllable points; engages only
    under a declared `lang`, which the Storybook decorator now stamps per locale exactly
    like the shell). Recorded limitation: Safari's ITP caps any JS-written cookie at
    ~7 days regardless of `max-age`, so the language choice simply re-asks sooner on
    iPhones — accepted for v1; disclose on the §12 policy page when it ships.
    **Amended 2026-09-04 (owner, app-shell polish round): interactive labels opt OUT of
    the site-wide `hyphens: auto`** — "text on menu buttons and on buttons in general is
    never allowed to be split … no split in syllables" (owner verbatim). `ui/Button` and
    `ui/TextButton` carry `hyphens-none` on their roots; wrapping between words is
    unaffected (§8.4's min-heights). Glyph-only controls (GlyphButton, SpeedDial codes)
    need no opt-out.
15. **Org-review round — outcome + standing triggers (owner, fb-320, 2026-09-01/02):** the
    whole-repo organization review (two blind passes; board `develop-org-review`) landed as
    PRs **#60–#63** (attach-ref promotion · DO-NOW docs · org-hygiene · overlay wiring),
    with **#64** (cx → `lib/cx.ts`; slot/disc/attach-ref stay `ui/` by the two-question
    test in lib/cx's header) in flight at record time. Standing items with NAMED triggers,
    deliberately NOT built now — do not "helpfully" build them early:
    - **Overlay-manners consolidation (WAIT):** Esc-close, bfcache-close, focus-return and
      warnOnce exist as two deliberately-divergent, cross-signposted copies (NavMenu ↔
      SpeedDial). Merge ONLY when a **third stateful overlay** ships — candidates: the §8.6
      language-suggestion banner (optional) or a ClinicGallery lightbox. **FAQ is out of
      scope forever (owner, 2026-09-02)** — never a trigger, never built; §14's `FAQ (opt)`
      entries are void. If no third overlay ever ships, the two copies stay — a final,
      correct state; nothing is owed.
    - **Two pre-page boards (SEQUENCING):** BEFORE the first Phase-4 page lane
      (Hero/ServicesIntro), run (a) the **Container/gutter board — DECIDED
      (owner, board `container-gutter.plan.md`, fb-343, 2026-09-04):**
      `ui/Container` promoted as the ONE gutter definition —
      `containerClasses = '@container mx-[clamp(1rem,10vw,12.5rem)]'` + a
      div-only component merging className caller-last; no width presets, no
      `as`/`asChild` (named re-open triggers in the board/atom header). The
      page-BAND recipe (full-bleed semantic outer owns paint + rhythm;
      Container inner owns width + the container-query context; named steps
      only, German-calibrated) is standing law in Container.tsx's header —
      every page lane consumes it. Retrofit 4A: Footer composes the component,
      Header imports the constant into its pill classes — both byte-identical,
      zero copies remain; and (b) the **text-align board — DECIDED
      2026-09-04 (owner, board `.claude/plans/text-align.plan.md`):** the globals base
      rule stays byte-identical and the per-element override is CANON. Centring prose
      means the utility ON each `p`/`li`/`blockquote` itself (for atoms: through the
      `className` merge, §6.8 — it lands on the host element); breakpoint re-assertions
      are per-element too and use `text-start`, never `text-left`/`text-right` (§3
      logical properties); wrapper-level blanket centring of prose is barred in every
      spelling, `[&_p]:text-center` included. Wrappers stay free to centre boxes and
      non-prose text — real headings sit outside the selector by design (display text
      may inherit centring; prose may not). Precedents: ContactModal's per-paragraph
      comment · Footer's copyright comment; SectionHeading's wrapping-centred-eyebrow
      limit resolves inside the pattern (its Eyebrow takes `text-center` via className
      on evidence). Same doctrine as §15.14's hyphens rider: global default in
      globals.css, deliberate exceptions ride the element. Reopen (→ scoped-rule board,
      option B) only if a page lane exceeds ~10 per-element overrides in one band or
      MDX must centre prose. Page lanes consume both decisions; opening one without
      them forces mid-lane improvisation.
    - Micro-items on the owner's word: mechanize the React-free `lib/` fence (eslint
      restriction or source-guard test — G2 LOW, cx lane); add `cx.ts` to §4's lib/ tree
      listing once #64 merges.
16. **Next.js 16.3 upgrade — DECIDED 2026-09-06 (owner, verbatim: "no, we are upgrading to the
    new nextjs right now" · "extremley important, versions compatiblity" · set approved "ok
    then just go"):** the first §3 minor crossing since the lock — **next ~16.2.12 → ~16.3.4**
    plus its two version-locked companions **@next/mdx ~16.3.4** and **eslint-config-next
    ~16.3.4**; NOTHING else moves. Purpose: stable `next/root-params` (ships in 16.3) unblocks
    the parked root-params migration lane (retiring `setRequestLocale`). Proven before the
    bump by a scratchpad differential build: an identical `[locale]` fixture with
    `output: 'export'` + `generateStaticParams` builds flag-free on 16.3.4 with correct
    per-locale HTML, and hard-fails on 16.2.12 ("can only be imported when
    `experimental.rootParams` is enabled"). Checked-and-stays (the Phase A matrix): next-intl
    ~4.13.7 (4.13.3 was "Next.js 16.3 compatibility preparation"; the rootParams recipe needs
    no 4.14 API), react/react-dom ~19.2.8 (= npm latest; peer ^19), next-image-export-optimizer
    ~1.20.1 + sharp (peer ^16), @storybook/nextjs-vite ~10.5.10 (peer ^16), @playwright/test
    ~1.62.1 (container lockstep intact). Upgrade evidence (Phase B lane
    `chore/next-rootparams-upgrade`): lint · prettier · tsc · vitest 1071/1071 ·
    build-storybook · build · linkinator all green; **visual net 178/178, zero diffs**; out/
    tree vs pre-upgrade build: css/fonts/images 0 bytes moved, root redirect byte-identical,
    app-authored markup byte-identical on all 23 differing pages after canonicalizing four
    framework classes (script tags — hashed srcs, inline flight, count 29→10; hashed
    preload-link paths; `next-size-adjust` meta reordered after `<title>`; RSC `.txt`
    metadata renames + buildID dirs). **Flagged, NOT taken:** the TS 7 restore (§15.10
    annotation — typescript-eslint is now the sole blocker); §15.11 unchanged (ESLint 9 pin
    unaffected: eslint-config-next@16.3.4 peers >=9 and still ships eslint-plugin-react ^7.37).
    Watch items for later lanes: `next dev` now auto-maintains an AGENTS.md block (hygiene
    decision on first dev run); build disk caching is default-on (use cold builds for
    byte-comparison rituals).
    **Phase C — the migration itself, executed same day (owner: "resume with phase c"; lane
    `refactor/root-params`, the superseded handoff run to completion on next 16.3.4 +
    next-intl 4.13.7):** `src/i18n/request.ts` resolves the locale as
    `explicitLocale ?? (await rootParams.locale())` — the NON-deprecated explicit-`locale`
    param must win, because the S1 probe caught the migration blog's plain recipe silently
    collapsing the layout's D6 banner block (five languages' strings) into the page's own
    locale; explicit `getTranslations({locale})` calls travel via `params.locale` (verified
    in next-intl's shipped dist). The five `setRequestLocale` call sites are deleted
    (layout + home + services/team/blog stubs, the pages also dropping their now-dead
    `params` plumbing) — the deprecated pair has ZERO references left in src, and future
    pages simply never add the call. Evidence: vitest 1071/1071 · visual 178/178 zero
    diffs · linkinator ✔ · out/ vs pre-migration baseline: 176/191 files byte-identical
    modulo the per-build random buildID (noise floor proven ZERO by an identical-source
    control build pair), the 15 home-page files differ only in RSC flight row ORDER —
    row-sets, script-stripped DOM bytes and byte-lengths all PROVEN equal across all five
    locales; root redirect byte-identical.
17. **Phase-4 content authorship — DECIDED 2026-09-06 (owner):** the Phase-4 content run
    (PR #81, one growing PR, stages S1–S7) was halted mid-S4 (owner "ok stop") and the PR
    **closed unmerged** — **the owner authors all page content personally**; Claude ships
    machinery only, each piece on an explicit dispatch (§15.7/§17.6 unchanged). Nothing
    from the run is on develop. Branch `feat/phase4-content` stays as the archive
    (S1 seo.ts pt 1 `cc749de` — pure machinery, cherry-pickable · S2 Home `f7eec73` ·
    S3 Services `13408db`; every commit gate-green at its seal). The standing SEO plan +
    salvage record — part-1 design recap, part-2 sitemap/robots plan, per-page metadata
    wiring recipe, content rules (CMSR, D-DASH), TODO(owner) gates, absorbed follow-ups —
    lives in **PHASE4_SEO_PLAN.md** (root); the full run ledger stays machine-local in the
    main checkout's `.claude/plans/phase4-content-ledger.md`. §14's content model remains
    the target; only WHO writes the content changed. No archived code lands without the
    owner's word — the recorded first candidate is the S1 cherry-pick plus the
    `next typegen && tsc` typecheck hardening (#83's flagged-not-taken item).

18. **Rotation clock — DECIDED (owner, board `.claude/plans/rotation-lib.plan.md`,
    fb-399–424 + G2 amendments, 2026-09-09):** the two old auto-iterators (the Hero's
    greyed-out photo frame and the reviews deck) share ONE React-free root in `lib/`,
    not an atom and not a hook — four modules, one job each: `lib/reduced-motion` (the
    `prefers-reduced-motion` seam), `lib/clock` (THE beat: a timeout chain, never
    `setInterval`; sticky `pause()`/`play()` vs transient cause-keyed
    `suspend(cause)`/`resume(cause)`; `startDelayMs` as the FIRST DWELL only; reduced
    motion declines the automatic start but an explicit `play()` runs; tab-hidden
    disarms and a return re-arms; `driver: 'external'` + `tick()` for a shared beat),
    `lib/rotation` (the ring: `active`, `step`, `wrapIndex`, `liveRegion`,
    `rotationControl`), `lib/rotation-group` (one beat driving many external-driver
    rings; `play()`/`pause()` fan out; members skip themselves and skip one beat after
    a hand navigation). Consumed through React's own `useSyncExternalStore` — construction
    is pure (§16), `start()` is the first browser touch, `dispose()` is re-entrant.
    `intervalMs` is REQUIRED per consumer (milliseconds, `Ms`-suffixed, `5_500` style —
    no site default; rhythms differ because content differs), and construction throws
    unless every delay is finite, at least 1 ms and ≤ 2 147 483 647. **The site default is
    independent clocks with distinct dossier-owned rhythms; a group is chosen
    deliberately, in writing.** `rotation.ts`'s header is the consumption LAW every
    rotator copies: region name + localized `aria-roledescription` from messages, DOM
    order control → prev/next → slides, the pause/play rotation control (WCAG 2.2.2 — struck from the reviews deck on the owner's word 2026-09-12, §15.19 round 2; the law for every other rotator)
    outside the hover wrapper and faced by `rotationControl(status)`, keyboard focus
    entering = sticky pause, pointer focus = transient, inactive slides `inert`, one
    static h1 outside the slides, no controls below two items, reading-time rider
    (~150 wpm against the longest slide). Every rotator is a client island: §16's list
    gains each one in its own lane. Consumer gates stay the owner's: photographs (§11)
    for the frame, real reviews + the CMSR testimonial check for the deck, the two
    owner-authored keys `common.carousel.role` / `common.carousel.slideRole` ×5, the
    "play, then Tab within the region" interaction test, a `next build` probe of the
    `.ts`-suffixed lib imports at the first consumer. Named triggers: a `RotationGroup`
    board only if a durable never-move-together guarantee is ever wanted; a
    discriminated `Rotation<'internal' | 'external'>` — OPTIONS **and** return type —
    so `intervalMs` is not required under `driver: 'external'`, `tick()` exists only
    on an external ring (today it is callable on an internal one, where it
    double-advances) and `group.add()` refuses an internal ring at compile time (the
    runtime throw stays as the belt), when the first group consumer lands. fb-67's
    two-lane cap was overridden by the owner for this story-less lane only ("get to
    development").
    **Amended 2026-09-09 (org-review board `.claude/plans/lib-rotation-org-review.plan.md`,
    owner fb-425–430):** the three stores publish through `lib/external-store`
    (row-1 extraction in the lane where the second and third consumers were born);
    `classifyFocusEntry`/`leavesRegion` in `lib/rotation` are part of the consumption
    law (the focus manners as code); WAIT triggers recorded in the headers —
    `lib/page-visibility` at the second consumer of tab visibility, the discriminated
    `Rotation<driver>` (options + return type) at the first group consumer, the shared
    shell/hook at the second rotator lane.

19. **Reviews deck run — DECIDED (owner, master board `.claude/section-runs/2026-09-10_17-01_reviews-carousel/ledger.md`,
    fb-432…fb-448, 2026-09-10):** the old reviews carousel returns as MACHINERY — `sections/ReviewsCarousel`
    (server band + in-folder `ReviewsDeck` client island on `lib/rotation`, the FIRST rotator to ship: the header
    recipe copied verbatim, the shared-shell extraction stays armed for the Hero frame) · `sections/ReviewCard`
    (props-in, zero keys) · NEW atoms `ui/Avatar` (picture via ui/Image OR two capital letters — the `Initials` and
    `Rating` value types live in React-free `lib/initials` + `lib/rating` (mechanics both the atoms and the data list
    import; type + guard written once) and make a third letter or a `4.3` a COMPILE error in the data list; ground `cta`;
    the Modal carve-out keeps it `ui/`) and `ui/StarRating` (eleven half-step values; ONE `Star` glyph painted three
    ways — a filled `Star` and its stroked twin `StarOutline` drawn on top of every slot, so empty is HOLLOW and the
    state is shape, not colour (G2 a11y); interim geometry = the old site's polygon until the owner's SVG lands) ·
    `ui/Card` REWORK = an additive tone crossfade on the shared `--fade` clock — PAINT ONLY (`background-color`, `border-color`;
    the Button doctrine: colours fade, nothing moves). Geometry stays off the list by MEASUREMENT: a transitioning
    `border-width` snaps to whole device pixels while `padding` interpolates, so the content would drift up to one device
    pixel mid-fade; with paint-only both change in one style recalculation and the content is provably still (drift 0); the
    `emphasized` ground became OPAQUE (a 10% mix over the surface with a white base for engines without
    color-mix) after the a11y reviewer found neighbour text bleeding through the deck's selected card · `lib/reviews` typed data list — facts AND the five-language `words` record per row, so a missing
    German title is a compile error; reviews are CONTENT like blog MDX, not message keys (ships EMPTY — the owner
    supplies real reviews + patient consents + the CMSR testimonial check; since 2026-09-20 the band mounts on Home over the first five of `demoReviews` — the stories' six fabricated rows, moved into this file on the owner's round-5 word, which REVERSES D15's "never enters this file" for the demo rows only and is flagged TODO(owner): consented real reviews must replace them before launch — until the real rows land) · quotation marks are CSS `open-quote`/`close-quote` from `quotes: auto` (locale-correct in all five
    languages from zero strings). **Delivery shape, the owner's COST rule (fb-447): ONE branch, ONE squashed commit,
    ONE G2 review round over the whole diff, ONE PR** — a recorded deviation from §17.3's one-component-per-commit
    for this run only. **fb-432 lifted fb-67's two-lane cap for this run** ("use however many parallel lanes you
    want"): wave 1 ran three parallel builder worktrees merged into the single branch. DE/FR/IT values of the
    eleven machinery keys (+ the RO/EN of the five new ones) were DRAFTED by Claude on the fb-448 dispatch and are
    flagged for the owner's confirmation (§15.17 stands for CONTENT; these are control labels).
    **Round 2 (owner pack feedback, 2026-09-12 — still ONE commit, the same PR):** the selected
    card's ground = the idle card's frame colour, ONE `--card-tint` in ui/Card (accent-decorative at
    20% over the surface = the old site's own rgb(229 228 236); opaque, white fallback) read by both
    rows · stars have NO outline: one `Star` glyph in two inks (empty = the body copy's `ink-muted`,
    earned = the star token, half = gold clipped over gray; the `StarOutline`, `Pause` and `Play`
    glyphs removed) and `--star` re-locked at `#D4AF37` (§15.1 rider) · NO rotation control on the
    deck ("absolutely no pause button") — hover suspends, keyboard entry stops, and a HAND NAVIGATION
    stops the rotation for good (`rotation.pause()` after prev/next: the touch-reachable stop SC 2.2.2
    needs, Swiper's `disableOnInteraction` default; the `home.reviews.pause/play` keys dropped ×5;
    lib/rotation's law records the per-consumer exception) · the deck's STAGE runs edge to edge (the
    full-bleed margin idiom, with the band's `overflow-x-clip` as the belt — the one deliberate breach
    of the band recipe, the stage only) and the card is a SHARE of the screen (`--deck-card:
    clamp(14rem, 66%, 8% + 20rem)`: two-thirds of a phone, half a tablet, a slow line above) so the
    neighbours peek on every device; every slide stays laid out (no `hidden`) so the stage height is
    constant at every position of the ring; the credential is pinned to the card's bottom by a second
    `flex-1` (the blockquote takes the slack) · rhythm 30 s / 34 s ("too fast" at 16 s — SUPERSEDED 2026-09-20 by the hero's 5.5 s / 1.5 s and the hero's manners, §15.21 round 6) · the demo decks
    alternate portrait / letters (`Review.picture.src` widened to §11's folder; the `reviews/`
    sub-folder stays a test-enforced convention for the shipped list) · both morph demos fixed (a flex
    column with `items-start` had let the inline-size-contained card collapse to ~50px).
    **Round 3 (owner-requested review-and-refactor pass, G3, 2026-09-12):** three Fable reviewers
    over the whole diff (react · typescript · organization); every MEDIUM/LOW folded — the band's
    `overflow-x-clip` belt gained its Safari ≤ 15 twin behind `@supports not (overflow: clip)`, the
    deck's one `react-hooks/refs` exception became React's render-time state adjustment, ui/Avatar
    reads a photograph that died before hydration from the element at commit, `isTwoLetters` returns
    a plain boolean (its predicate narrowed a failing string to `never`), ReviewCard Omits
    `aria-label`/`aria-labelledby`/`title` like PersonnelCard, the initials alphabet gained the
    Hungarian capitals. The organization verdict: no reorganization before merge. STANDING TRIGGERS
    (do not build early — the ledger's Round 3 table has the reasons): `signedOffset` → lib/rotation at
    the second ring-laid-out rotator · a demo-fixture module at the Home mount · a story/test HELPER
    PROMOTION LANE right after merge (`expectNoSidewaysScroll` ×6, `fill` ×6, `stripComments` ×7,
    `quietEnv` ×3 — all already ≥ 3 before this lane) · `parkPointer()` at the Hero-frame lane · the
    20% tint as a §15.1 token at its second consumer · a type-only `lib/image-path` at the next lane
    that types an image path · `isLocale()` at the next `Record<Locale, …>` band.

20. **Price-list run — DECIDED (owner, consultation board `.claude/plans/price-list.plan.md`,
    fb-449 – fb-466, 2026-09-13; build dispatched the same day, epic #99, lane `feat/price-list`,
    run ledger `.claude/section-runs/2026-09-13_17-50_price-list/ledger.md`):** the Services
    page's price list as MACHINERY — `sections/PriceList`, a **DUMB props-in band** (owner fb-459:
    zero message keys, zero data imports; every string arrives finished) — a `ui/Card asChild`
    `<nav aria-labelledby>` jump menu, sticky from the Container's `@3xl` step (`top-28` = the
    header's 6rem reach + 1rem, the FIFTH coupled spelling, registered in Header.tsx's mount
    contract) beside a column of in-folder `CategoryCard`s (`ui/Card asChild` onto
    `<section id tabIndex={-1} aria-labelledby>` so the fragment target RECEIVES focus;
    `sections/SectionHeading` eyebrow + h2; a `<dl>` of `ui/Text dt/dd` rows that stack below the
    card's `@sm` and flow into two CSS columns from the card's `@3xl`); below the step the menu is
    a stacked table of contents with a „back to categories" link under each card (fb-460). Data
    = `lib/prices/prices.ts`: a typed list (`Record<Locale, string>` words on every row — a
    missing language is a compile error; a `.ts` module, never JSON, fb-465), 11 categories ·
    102 rows, ALL fixed whole-RON amounts (the owner's printed tariff, transcribed 2026-09-13,
    full diacritics fb-454; five rows carry `TODO(owner): verify`); the discriminated `Price`
    union is the RECORDED upgrade path for the first non-fixed row; no discount/old-price variant
    by design (CMSR, §12's sibling rule). `i18n/locales.ts` gains `isLocale()` — the §15.19
    trigger, consumed. `app/[locale]/services/page.tsx` is THE ONE POPULATOR (`getLocale` →
    `isLocale` → `populatePriceList` → the band), the only place a number becomes words through
    `services.prices.amount = "{amount, number} RON"` — **„RON" everywhere, no euros (fb-450)**;
    a EUR column „maybe, on every language" is recorded as §15.4's successor, still parked.
    Fragment ids are English (fb-461). Every internal link stays a plain `<a href="#id">`
    (§15.13); zero client JavaScript ships for the band (§16's island list is unchanged) — **that JavaScript sentence is superseded by Round 2 below**.
    **Strings:** the three UI keys ×5, the 11 short category names, the three eyebrows and the
    EN/DE/FR/IT row words were DRAFTED by Claude on the owner's „create the whole thing here …
    I want to see the whole prices page" dispatch and are flagged in the file headers for the
    owner's confirmation — §15.17 stands for content; the §15.19 reviews-lane precedent. fb-466
    („decide for me everywhere needed") was a ONE-TIME delegation for the items then open, per
    the owner's same-day correction — not a standing rule. Delivery shape: the reviews-run
    shape — one branch, one commit on the owner's word, one review round, one PR.
    **Round 2 (owner pack feedback, 2026-09-14 — the same lane, still uncommitted; eight
    decisions, all the owner's):** (1) the menu title „Categorii" wears ui/Heading's `section`
    step (text-3xl — the category h2s' own step, honest siblings) over a rule line, so it reads
    as the navigation's TITLE and not as its first item; (2) ONE column of rows, always
    (`@3xl:columns-2` and its `break-inside-avoid` deleted); (3) the visible „Serviciile
    noastre" opener DROPPED — the `<h1>` survives `sr-only`, because §9's one-h1 rule and the
    SEO lane's outline both need the element and only its pixels were the complaint; (4) `aura`
    on the menu card and on every category card, the cards column opened to `gap-8` so
    neighbouring glows do not stack; (5) the sticky menu moves to `@3xl:top-34` = 8.5rem —
    MEASURED, not chosen: the pill's `--shadow-aura` tints the page ground down to y = 126px
    (pixel-sampled under Chromium at 1280/1536/1920) and the old 7rem top put the menu 14px
    INSIDE that glow; 8.5rem = 136px clears it by 10px, the midpoint of the owner's „1-2 rem".
    The belt follows (`calc(100dvh-9.5rem)`) and the cards' landing line moves to the SAME
    2.5rem (`scroll-mt-10`), so a jumped-to card's top edge and the stuck menu's rest on one
    line; still the FIFTH coupled spelling in Header.tsx's mount contract; (6) **BIDIRECTIONAL
    scroll <-> menu sync** — the ONE client island this band now ships,
    `sections/PriceList/PriceMenu` (the `<ul>` of links alone; the nav, its title, the card
    surfaces and all 102 rows stay inert HTML), on NEW React-free `lib/scroll-spy`: the current
    target is the last one that has reached its own LANDING LINE (`rect.top −
    scroll-margin-top ≤ scroll-padding-top` — the same two CSS properties the browser's own
    fragment jump consults, so a click and a scroll can never disagree about where „current"
    begins), plus the BOTTOM RULE (at the document's end the last target is current — measured:
    at 1920×1080 the last card is 145px short of its line and could otherwise never be
    reached), the TOP FALLBACK (the first target while none has reached its line) and the CLICK
    PIN (a menu click holds its mark through the scrolling the jump itself causes — until no
    scroll event has arrived for 150 ms AND the visitor then scrolls by hand; `hashchange` and
    a load-time hash pin the same way; a middle or modified click never pins; and at the
    settle the pin VERIFIES ARRIVAL — a target that never reached its landing line, because a
    reload or a Back restored the old position or a scroll lock froze the glide, hands the
    mark back to the walk within 150 ms (G2 react on Fable, 2026-09-15, measured in Chromium
    and WebKit); the visitor's own `wheel`/`touchmove`/scrolling keys drop it at once, keys a
    control swallows — `button`, `dialog`, inputs — never do). Marked
    `aria-current="location"` (the location WITHIN the page, never `page`) wearing
    ui/TextButton's `active` rest look; the static HTML carries no marker at all, so hydration
    is safe (§16's rule 2); consumed through `useSyncExternalStore` exactly like the reviews
    deck. Reverses board §4.3 option A and this item's own „zero client JavaScript" sentence;
    §16's island list amended in the same change-set; (7) the „înapoi la categorii" link
    DELETED outright, `services.prices.back` ×5 removed with it; (8) an eyebrow on EVERY
    category — `eyebrow` REQUIRED in the data type and in the band's props, so a category
    without one is a compile error rather than a card that quietly reads differently from its
    neighbours; the eight new eyebrows ×5 are Claude DRAFTS, flagged with the lane's other
    strings. Deliberately NOT built, named triggers in lib/scroll-spy's header: `scrollend`
    (every Safari before 26 lacks it, so the settle timer must exist anyway), scrolling the
    current link into view inside the menu's overflow belt, `setIds()` for a list that can
    change, a top-fallback option for a consumer whose targets sit below a long intro, and
    ignoring `wheel`/`touchmove` while the document is scroll-locked (needs lib/scroll-lock to
    expose `isLocked()`; today such a drop is bounded — it lands on what is on screen).

    **Round 3 (owner, 2026-09-18 — the sticky behaviour reworked; lane `fix/price-menu-pin`):**
    the HEIGHT BELT REVERSED. Measured in Chromium against the built export: the menu is
    653px tall with eleven categories (RO and DE identical), so under its 136px offset plus
    16px of bottom air a window must be ≥ 805px tall — and the belt's
    `max-h-[calc(100dvh-9.5rem)] overflow-y-auto` made the card its own scroll container on
    every laptop (1366×768 → 481px usable · 1080p at 125% → 585 · 1280×800 MacBook → 536 ·
    1440×900 → 637; only 1080p at 100% → 793 fits), the wheel scrolling the menu instead of
    the page ("that should absolutely not be possible"); it cannot be shrunk away (11 × 44px
    = 484px > 481px). Decided: DIRECTION-AWARE PINNING on NEW React-free `lib/sticky-rail`
    (the scroll-spy's shape — pure construction, `start()` the first browser touch, re-entrant
    `dispose()`, `lib/external-store`; snapshot `{ mode: 'fits' | 'top' | 'bottom' | 'travel',
    topPx }`; one passive scroll listener + a ResizeObserver on the rail + window resize,
    coalesced through requestAnimationFrame so state moves only at transitions; a `focusin`
    listener on the rail pins whichever edge reveals a focused link — the keyboard half of
    "every link reachable", since a pinned rail does not move with the browser's own
    scroll-into-view): a menu that FITS keeps exactly the CSS sticky at `top-34` with nothing
    written; a taller one rides with the page scrolling down until its bottom edge meets
    `innerHeight − 1rem` and pins there (sticky, negative `top`), rides up until its top edge
    meets the 8.5rem line and pins there (the static CSS), and holds a frozen relative offset
    between the two so it never jumps. The ISLAND WIDENED from the `<ul>` to the `<nav>`:
    `PriceMenu` is now the menu CARD (ui/Card asChild onto the nav, the h2, the list;
    PRICE_MENU_ID stays in PriceList.tsx and travels down as a prop, because a value exported
    from a 'use client' module reaches a server component as a client reference) holding BOTH
    stores through `useSyncExternalStore`; it renders the mode as `data-rail` (absent for
    'fits' — the server HTML and a desktop that fits are byte-identical, §16 rule 2), the
    number as an inline `top`, and gains ONE class, `@3xl:data-[rail=travel]:relative`, under
    the same container gate as the base sticky (an inline `position` would follow the mode
    below the step — a tablet rotated mid-travel would show the menu displaced over its own
    cards). The static classes `@3xl:sticky @3xl:top-34 scroll-mt-10` are untouched, the
    8.5rem / 2.5rem pair and Header.tsx's mount contract unchanged (the rail READS the line
    from its computed `top` rather than being told it — no sixth spelling). Evidence: the e2e
    suite `tests/e2e/price-menu-pin.spec.ts` (`npm run e2e` over the built export, its own
    `playwright.e2e.config.ts` + `tools/serve-export.mjs` on the engine extracted to
    `tools/serve-static.mjs` — 1366×633 RO + DE: bottom pin with the last link on screen, top
    pin at 136 with the title on screen, Tab and Shift+Tab through all eleven links each on
    screen, never a scroll container, the server HTML carrying no mode; 1920×945: no
    attribute, no style, 136px throughout). WAIT triggers in lib/sticky-rail's header:
    merging the spy's and the rail's listeners into one loop (the second consumer of both),
    tab-visibility handling (lib/clock's page-visibility seam). Known consequence, not a bug:
    one large jump (End key, a reduced-motion teleport) opens 'travel' with the menu still at
    its line until the next hand scroll. Visual: the Pages/Services 1280×800 frames (Romanian + German) are the only two
    that change — 800 < 805, the belt was engaged there (a 648px clip with a nested
    scrollbar) and is gone, ~21k differing pixels each, MEASURED before/after on this lane; Sections/PriceList (four categories) and every other width fit
    and are pixel-identical by construction. Darwin/linux re-records of those two frames are
    the owner's, on the owner's machine (no win32 set exists — §15.7).

21. **Hero run — BUILT ON THE OWNER'S DISPATCH (2026-09-19, verbatim: "i want to bring onto the new
    project … the images auto scrolling section … use here from lib the auto iteration of images
    with no stop play etc, just the n number of beads … use image atom … keep gray filter …
    the whole thing as a whole to be a dumb component and i populate it with path and text …
    one button is the contact us button that opens the contact us modal and the other is
    taking you to the services page. extremley careful with adaptability … the first thing
    you see when you open the page and it should sit below the top bar"; epic #103, lane
    `feat/hero`, board `.claude/plans/hero.plan.md` — machine-local, gitignored):**
    `sections/Hero`, the site's SECOND rotator, a DUMB props-in band (zero keys, zero data,
    the PriceList shape) populated by `app/[locale]/(home)/page.tsx` through its own
    `populate.ts` from NEW `lib/hero-slides` (picture + five-language words per row — RO/EN
    the old site's own slogans, DE/FR/IT and every `text` line DRAFTED and flagged, §15.17;
    demo pictures until the owner's photographs, §11). THE WHOLE BAND IS THE ISLAND (§16).
    Decisions, each argued in Hero.tsx's header: below the pill and filling the first
    screen as a MINIMUM — `min-h-[calc(100svh-6rem)]` with a `100vh` twin (the small
    viewport unit, never `dvh`, so the URL bar's collapse resizes nothing; the SIXTH coupled
    spelling of the pill's reach, registered in Header.tsx's mount contract) · a three-row
    grid with the slides stacked in row 1, the buttons in row 2 and the beads in row 3 —
    every text box in normal flow, so German at 320px pushes the stage taller and can never
    collide (the old absolute text block's failure class deleted) · the picture escapes to
    the stage through an UNPOSITIONED slide (`ui/Image fill` resolves against the nearest
    positioned ancestor; `ui/Container`'s `container-type` is a containing block, so the
    photograph can never sit inside it) · ONE `opacity` crossfades picture, scrim and words
    (1 s, the old site's; `motion-reduce:transition-none`), the scrim INSIDE each slide ·
    the grey filter kept as `grayscale blur-xs` ON the picture (same pixels as the old
    `backdrop-filter`, one paint, no containing-block caveat; the wrapper overshoots 4px for
    the blur's edge, `overflow-clip` trims it) — the old 20 % white wash dropped · a UNIFORM
    `bg-scrim` (§15.1's locked 0.55 floor: white on 0.55-black-over-white = 4.77:1) · the
    first dark band: `[--focus:var(--ink-inverse)]` on the band root remaps the ONE semantic
    focus variable for every control inside (§3's theme mechanism in miniature, no atom
    touched) · an intrinsic CTA row (`flex-wrap`, `*:grow *:basis-64`, `max-w-3xl`: side by
    side from ~33rem of column, stacked full-width below) · BEADS = buttons with
    `aria-current` (lib/rotation's law, not a tablist), named by the SAME „{index} din
    {total}" sentence as their slides (`home.hero.slide` ×5), DOM-first / picture-last, 24 ×
    44 hit boxes, only width and ink move · NO ROTATION CONTROL on the owner's word — the
    reviews deck's exception applied a second time (hover suspends, keyboard entry stops,
    A HAND ON A BEAD STOPS FOR GOOD) · rhythm 8 000 / first dwell 10 000 (the reading-time
    rider at the ~120 wpm of an older reader, G2 a11y) · ONE STATIC h1 outside the ring — the page's, `sr-only` (the Services
    precedent); the slogans are `<p>`s. **Atoms (additive, anticipated by their own
    headers):** `ui/Heading` gains `size: 'hero'` — FLUID `clamp(2rem, 1rem + 3.5vw,
    4.5rem)/tight`, 32 → 72px with the viewport, replacing the old four-prefix staircase
    (the `vw` term is the gutter's own licence: page-scale geometry follows the page) — and
    `tone: 'default' | 'inverse'` (the ink split from the size rows; every elder
    byte-identical, test-pinned); `ui/Text` gains `tone: 'inverse'`; `ui/Image` untouched
    (`plain` + `fill` + `preload` + `fetchPriority="high"` on the LCP slide was written for
    this consumer). **Two law-named extractions folded in:** `ui/use-rotation` — THE SHARED
    ROTATOR SHELL the consumption law reserved for "the second rotator lane" (useRotation +
    focusManners/pointerManners + handNavigation; ui/ by lib/cx's question 1, it imports
    React; ReviewsDeck rewired, 54/54 unchanged) — and `lib/image-path` (type-only
    `ImagePath`, the §15.19 round-3 trigger "at the next lane that types an image path":
    lib/reviews, ui/Avatar, ReviewCard, ReviewsDeck and lib/hero-slides all import it).
    **Strings:** `home.hero.{region,slide,picker,contact,services}` ×5 DRAFTED and flagged
    (RO/EN contact/services are the old site's); `home.hero.subtitle` is now unused (the
    stub's second line) and stays until the owner strikes it. **Evidence at READY:** see
    the lane's PR. **Visual:** no win32 baseline set exists (§15.7) — the darwin re-record of
    Pages/Home (RO + DE × 6 widths), Sections/Hero (5 stories × 2 + the 320 stress) and the
    two new UI stories per atom is the owner's, on the owner's machine. **G2 (three Fable
    reviewers, 2026-09-19, all folded or recorded in the files):** the beads' group name
    says a press stops the slideshow (SC 2.2.2's stand-in made audible); the demo pictures
    carry honest alts with the old site's alts parked in `TODO(owner)` rows; idle beads at
    80 % white (3.69:1 over the worst-case ground, KEEP-IN-SYNC with the scrim); the
    rhythm 8 s / 10 s; `HeroProps` refuses `aria-labelledby` and the four manner handlers
    by type; the hook hands back `RotationRing` (no lifecycle); lib/rotation's three
    stale pointers amended (§17.7). **Owner's calls, recorded not built:** the fixed
    WhatsApp disc over the outline button's last ~33 px on the phone first screen (not a
    WCAG failure; three levers in Hero.tsx's header); `reducedMotion: 'reduce'` on the
    visual Playwright projects as the harness-side stillness lever; a descriptive
    `home.hero.title` for the sr-only h1.
    **Round 2 (owner pack feedback, 2026-09-20 — the same lane, still uncommitted; four
    asks, all the owner's):** (1) **UNDER THE PILL** — "the auto-scrolling of images should
    be there on the whole starting screen of whatever device": the band pulls itself up by
    the Header's FLOW BOX, `-mt-[calc(6rem+2px)]` (mt-4 + h-20 + two 1px borders — the
    old site's own `-mt-4` idea), and the stage is `min-h-svh` (`min-h-screen` twin); the
    sixth coupled spelling is now TWO numbers in Hero.tsx (the margin, and a `minmax(8rem,
    1fr)` first row so the words never start under the pill when the content is taller
    than the screen); a negative outer margin on a band is a RECORDED departure from the
    recipe's "the outer owns rhythm", because the overlap is the band's nature and one file
    holding both numbers keeps the coupling one spelling. Both story files (Sections/Hero,
    Pages/Home) now mount the real `sections/Header` above the band — the first page story
    to compose the pill — since the band assumes the pill's box above it. (2) **IT
    AUTO-SCROLLS** — "I do not see it autoscrolling": MEASURED on the dev server, the
    system reports no reduced-motion preference and one mouse move over the band held bead
    1 for 12 s — the law's hover suspension on a band that IS the whole first screen means
    a mouse user at rest never sees a second picture. The pointer pair moved from the
    region to the BEADS ALONE (a hand about to choose gets a still target; leaving
    resumes) — the lane's second recorded departure from lib/rotation's letter, pointed to
    from the law and from `ui/use-rotation`; `HeroProps` no longer refuses the pointer
    pair; the interaction tests pin both halves (picker suspends, picture does not).
    Storybook gains a `Rotating` story (the product rhythm, a one-second first dwell) under
    a NEW `no-visual` tag the central spec skips — a frame that moves by design is never a
    baseline. (3) **LIGHTER** — "the filter … should not be that dark": round 1's uniform
    0.55 over the whole stage is replaced by ONE static ground (a grid item spanning the
    words, buttons, beads and fade rows, pulled 9rem into the picture row) whose gradient
    runs transparent → the §15.1 floor from 8rem down, held to the bottom: the floor is
    anchored to the words' OWN row, so every word, button and bead sits on 0.55 by
    construction in every language and at every height, while the picture zone above
    darkens by nothing — the old 20 % wash returns as the picture's `opacity-80` over the
    band's `bg-page` ground. The §15.1 lock ("hero TEXT scrim floor ≥ 0.55") is kept to the
    letter (white on the worst-case ground #727272 = 4.81:1; the idle bead 3.75:1). Per-
    slide fading moved from the slide box to its two children (picture wrapper, words
    Container), because a fading slide is a stacking context its words could never leave to
    paint above a ground outside the slides. (4) **THE FADE, WITHOUT THE LINE** — "a
    transition part where it fades towards a background color … do not port that thin
    line": a fifth grid row (`h-24`, IN FLOW, the band's last box) carrying the old site's
    own five-stop gradient into `--page`, over a band whose own ground is `bg-page`; the
    old line was an absolute fade over a stage of another colour meeting the next section
    at the band's edge — here the fade's last pixel, the band's ground and the next band's
    ground are one colour, and the words/buttons/beads ground is ONE element (two
    translucent boxes meeting at a fractional row edge leave a hairline), so no seam can
    exist by construction. CONSEQUENCE, measured: the corner-disc overlap round 1 recorded
    is gone — the fade and the beads now sit between the buttons and the phone's bottom
    edge (Hero.tsx's header carries the numbers). Visual: the Sections/Hero and Pages/Home
    frames all change; the darwin re-record remains the owner's (§15.7).
    **Round 3 (owner pack feedback, later on 2026-09-20 — the same lane, still uncommitted;
    six asks, all the owner's):** (1) **LIGHTER STILL, "like in old webpage"** — the veil
    under the words is the old site's own 0.40, below §15.1's 0.55 floor: the owner's
    amendment of the owner's lock, recorded as §15.1's rider with the contrast arithmetic
    (2.88:1 white ink, 2.40:1 idle bead on the worst case); the old page's `text-shadow`
    returns on the words' wrapper (inherited, no atom restyled) and the beads gain a soft
    shadow. (2) **IT RESUMES AFTER ANY INTERACTION** — "i want it to automatically resume
    even if you interact with it": a bead press now calls `goto` (lands, buys a full
    interval — the law's manner for a rotator WITH a control; `handNavigation`'s stop-for-
    good is no longer used here), keyboard focus inside the region is a TRANSIENT hold that
    lifts when focus leaves, and NO POINTER HOLDS IT AT ALL — round 2's hover hold on the
    beads went too, and so did the law's click-focus hold, because MEASURED a click leaves
    both the hand and the focus on the bead and either would have held the ring the owner
    wants moving (`ui/use-rotation`'s `focusManners` gains `keyboardEntry: 'pause' |
    'suspend'` and `pointerEntry: 'suspend' | 'none'`, defaults the law's). NOTHING STOPS
    THE BAND FOR GOOD. RECORDED, the owner's call: SC 2.2.2 (Level A) is met for a keyboard
    (Tab into the band holds it) but a MOUSE or TOUCH visitor has no way to stop the motion
    — the third departure from lib/rotation's law on this band, pointed to from the law and
    from the shell. (3) crossfade speed kept. (4)+(6) **THE FADE, LONGER, EASED, STARTING
    LOWER** — `h-27` (6.75rem, the asked tenth on the scale) with ten stops on a slow-in
    curve replacing the old front-loaded five (the "balcony"): invisible for its first
    fifth, so the visible onset sits lower though the row is taller; no straight segment,
    ~150 tonal steps over ~108px, so no banding. (5) **THE OUTLINE BUTTON GREYS ON HOVER**
    — `ui/Button`'s outline variant no longer fills green: ground → line-subtle, label →
    cta-hover (cta itself is 3.63:1 on that grey, under 4.5:1; cta-hover 5.31:1), border
    stays cta, press shares the hover face (ghost's precedent). The 2026-09-06 mirror law
    now holds in ONE direction (solid's hover is still outline's rest). This is the
    VARIANT, so the Footer's three outline buttons and the reviews deck's prev/next grey
    the same way — one look (§6.6); the owner may narrow it to the hero. **Harness:** the
    Sections/Hero stories run the product's own rhythm (the one-minute dwell dropped —
    the owner opened Default and saw nothing move); stillness in the net now comes from
    `reducedMotion: 'reduce'` on the visual projects (playwright.config.ts — the lever G2
    react named on 2026-09-19; the only `motion-reduce:` utilities in src are
    `transition-none`, which `animations: 'disabled'` already neutralises, so no earlier
    baseline's pixels change). `Stopped` → `Picked` (its premise died with the stop);
    baseline filename follows.
    **Round 4 (owner, later still on 2026-09-20 — the same lane, still uncommitted):**
    (1) **THE RHYTHM IS THE OLD SITE'S OWN 5.5 s**, first beat included ("it should be way
    shorter"): `HERO_INTERVAL_MS` = `HERO_FIRST_DWELL_MS` = 5 500 — the old component's
    `DEFAULT_INTERVAL_MS`; the reading-time rider's 8 000 / 10 000 (G2 a11y) is recorded as
    superseded by the owner's word. The tab-hidden rule is unchanged: a hidden tab disarms
    the clock and a return re-arms it with a full interval, so after switching back to the
    page the first change comes 5.5 s later. (2) The ring was always circular
    (`wrapIndex`, test-pinned: after slide 3 comes slide 1); the owner never saw the wrap
    because rounds 1–2 stopped the ring for good on a bead press. (3) **THE REVIEWS DECK
    MOUNTS ON HOME BELOW THE MAP** ("it is missing. It should be below the map") — reversing
    §15.19's "nothing mounts until the real reviews": `lib/reviews` gains `placeholderReviews`,
    three rows that SAY they are placeholders in all five languages (Demo 1–3, letters, no
    portraits; drafted, flagged), and `sections/ReviewsCarousel`'s default is the site list
    when it has rows, the placeholders while it is empty — the first real row retires them
    without touching the band or the page; an explicit empty prop still renders nothing. D15
    (no fabricated testimonials in shipped data) stands. (4) Storybook: the band IS under
    Sections › Hero (the story file's `title`); only the lane's Storybook on port 6007 was
    running when the owner looked, and it lists it.
    **Round 5 (owner, the same evening, 2026-09-20):** (1) **THE FIVE DEMO REVIEWS ON HOME**
    ("bring the 5 examples story from storybook as demo on home page"): the stories' six
    fabricated rows moved from `ReviewsCarousel.stories.tsx` into `lib/reviews` as
    `demoReviews` (the stories import them back, so page and workbench cannot drift); the
    band's default while the site list is empty is `demoReviews.slice(0, 5)` — the "Five"
    story — replacing round 4's three labelled placeholders. This REVERSES D15's "fabricated
    demo copy never enters this file" for the demo rows, on the owner's word: invented
    testimonials under invented names now ship in the export (the interim host is public,
    noindex), flagged TODO(owner) — consented real reviews must replace them before launch;
    the first real row retires them by itself. (2) **THE FIRST BEAT IS 1.5 s**
    (`HERO_FIRST_DWELL_MS` = 1 500; "instantly once you enter the page you see it"); the
    rhythm stays 5.5 s. lib/clock's return-from-hidden rule is untouched (a return re-arms
    the pending delay — normally the full 5.5 s). (3) Storybook, checked in a real browser:
    http://localhost:6007/?path=/story/sections-hero--default renders the band with no
    error, and the sidebar lists Sections › Hero with six stories; no other Storybook (6006,
    6009) was running. The screenshot was sent to the owner.
    **Round 6 (owner, the same evening, 2026-09-20 — "more of the older look"):** (1) **THE
    REVIEWS DECK ROTATES LIKE THE HERO** ("why … are the reviews not autoscrolling like a
    circular list like … the slides"): `REVIEWS_INTERVAL_MS` 30 000 → 5 500 and
    `REVIEWS_FIRST_DWELL_MS` 34 000 → 1 500 (the hero's numbers; §15.19 round 2's 30 s / 34 s
    recorded as superseded), and the deck ADOPTS THE HERO'S MANNERS: prev/next call the ring
    directly (a full interval, then on — `handNavigation` has no consumer), keyboard focus
    inside is a transient hold, NO pointer hold; the 2026-09-12 stand-ins (hover suspends,
    keyboard stops, a hand stops for good) are history, and the SC 2.2.2 record (no stop for
    mouse or touch) now covers both rotators. `Stopped` → `Picked` in the deck's stories too.
    The ring was always circular. (2) **BLOG OUT OF THE BAR** ("drop it for now"): `lib/routes`
    gains a `hidden?: true` field; the blog row wears it, so `primaryRoutes()` offers it
    nowhere (bar, panel, footer) while `equivalentPath` still sees the row (a blog post still
    switches languages to the target's home). Delete the flag to offer it again. (3) **THE
    HERO'S BLOCK IS CENTRED ON THE SCREEN** ("the median of the whole thing should coincide
    with the center of the screen on oy axis"): the stage is four rows — `minmax(8rem,1fr)` ·
    words · buttons · `minmax(9rem,1fr)` — the two spacers share the slack equally, the CTA
    row lost its bottom padding so the visual block IS the centred rows, and Default's play
    pins the median to ±3px of the viewport's centre. (4) **BEADS LOWER, FADE THINNER** ("as
    thin as in the old page"): both ABSOLUTE at the stage's bottom — the fade `h-[10%]` (the
    old page's own tenth; the eased ten stops kept), the beads `bottom-[8%]` over its
    invisible start — out of flow so they cannot pull the block down; the ground spans to the
    stage's bottom under them. (5) **THE OLD PAGE'S THICK STROKED HEADING** ("create … the
    thick heading with border … keep in mind the current heading"): `ui/Heading` gains
    `tone: 'inverse-stroked'` — the old atom's `font-bold tracking-tight` plus the old hero's
    2px `-webkit-text-stroke` in `--color-accent-decorative` (§15.1's display role) behind the
    fill (`paint-order: stroke fill`); Sections/Hero gains `slogan: 'stroked' | 'plain'`,
    default 'stroked' (applied), 'plain' one prop away (the PlainSlogan story). Heading's
    StrokedTone story added.
    **Round 7 (owner, 2026-09-20):** the `team` slide's drafted supporting line struck from
    `lib/hero-slides` ("remove this text … but leave the space it occupies there, but blank"
    — the stacked words cell keeps the row's height, nothing to spell); and, instead of
    rolling the slogan back, `slogan` gains **'alternate'** — slide 1 thin, slide 2 thick,
    slide 3 thin — which the page passes for now so the owner can compare the two faces on
    the rotating band ("1 slide thin, 1 slide thick so i can compare them"); the pick
    replaces the prop's value. And the block moved 8 % down from the centre ("a little more
    downwards, like maybe 5-10%"): `pt-[16svh]` on the stage above the two equal spacers
    (+ a `16vh` twin) puts the median at 58 % of the viewport; Default's play pins it.
    **Round 8 (owner, 2026-09-21):** a third face — "the third slide make it as the initial
    thin, but with that border that the old style has": `ui/Heading` gains
    `tone: 'inverse-outlined'` (the 2px accent stroke alone on the plain weight; OutlinedTone
    story, the same axe note as StrokedTone), Sections/Hero's `slogan` gains `'outlined'`, and
    `'alternate'` now cycles plain · stroked · outlined by slide; the page still passes it.
    And, clarifying round 7 ("i told you to remove all text … leave it blank on every slide …
    remove the whole thing that holds that text and replace with empty space"): EVERY
    supporting line is struck — `text` is gone from `lib/hero-slides`' type and rows, from
    `populate.ts` and from `HeroSlide`; the band renders an empty `aria-hidden` box one
    text line tall (`h-7`) where the line stood, so the slogan keeps its distance from the
    buttons. The WithoutText story is gone with the field; `ui/Text`'s `inverse` tone keeps no
    consumer for now (recorded, not removed).
    **Round 9 (owner, 2026-09-21):** "keep first and third as options" — `'alternate'` now
    alternates plain · outlined by slide (the bold face stays a value, out of the cycle); and
    "push downwards the heading until right above the button and keep buttons in place" —
    the blank is gone and its room (`pt-10`) sits ABOVE the slogan as the words Container's
    top padding, so the block keeps its height, the buttons stay where round 7 put them, and
    the slogan sits 24 px above them (Default's play pins both).
    **Round 10 (owner, 2026-09-21 — the pick): "i want to keep just the thin with no border
    heading. it does look pretty much perfect now, but do not create pr yet":** `slogan`
    defaults to `'plain'`, the page passes nothing, the `'alternate'` comparison mode is gone;
    `'stroked'` and `'outlined'` stay as values (Hero tests, StrokedSlogan / OutlinedSlogan
    stories, the atom's tones). NO commit, NO PR — the owner’s word; the lane stayed at READY until the owner’s seal, “create pr”, later on 2026-09-21: one squashed commit, one PR into develop.

22. **Header brand-to-nav gap — DECIDED (owner, 2026-09-26, verbatim: "small refactor on top
    bar. it should maintain at least a little space between 'premium smile' and first button of
    menu, like idk, 70% of the width of the menu button … if not fit due to thinning web tab or
    screen size, switch to dropdown menu"; lane `refactor/header-nav-gap`, its own worktree):**
    the bar's container step MOVES, `@3xl` (48rem) → a MEASURED arbitrary step `@min-[60rem]:`
    — Header.tsx's own doctrine ("move the NUMBER, never the architecture"), the architecture
    untouched: `1fr auto 1fr`, the nav on the screen's centre line (2026-09-04), no column-gap,
    no new element, zero JavaScript. MEASURED on three engines (Chromium, Firefox, WebKit agree
    at the visible edges): the brand paints 258.5px, the German row 279.3 (RO 231.3, EN 228.0),
    and the visible gap is `(row − nav) / 2 − 258.5`. At the 48rem step German sat 30.2px UNDER
    the first link and Romanian 6.2px — seen in a 985px Chromium window as side tracks of
    229.9 / 253.8px against the 258.5px brand, "Startseite" painted over "Smile" — because
    `1fr`'s auto floor is the brand's MIN-CONTENT, 150.8px in every engine, in which the
    percentage-height artwork counts for ZERO. A 4rem floor (≈ 70 % of "Startseite", 94px —
    the owner's number on the calibration language) needs a bar ≥ 956.3px → 60rem, the
    smallest whole rem: at the flip German 65.9px, Romanian 89.9, English 91.5. Named steps
    rejected: `@4xl` (56rem) leaves German 33.9px; `@5xl` (64rem) flips the 1280 Notebook
    sampling point to the burger (bar 1007px in Chromium with the 15px classic gutter
    `scrollbar-gutter: stable` reserves, 1022 in Firefox/WebKit, both < 1024). Rejected BY
    MEASUREMENT, recorded in Header.tsx: `column-gap` (it holds off the brand's TRACK edge,
    which can be narrower than the brand) and `minmax(max-content,1fr)` side tracks
    (Chromium's max-content is 258.5 and it works; Firefox/WebKit compute 406.8 — the artwork
    at its natural 256px — and shove the nav ≥ 100px right with the CTA out of the pill under
    ~1180px). The flip in a window: `0.8 × V − gutter − 2 ≥ 960` (`vw` counts the gutter, the
    containing block does not) → ≈ 1221px with Chromium's 15px gutter, ≈ 1203 with none (it was
    ≈ 981 at 48rem) — a 1024 landscape tablet and laptops under ~1220 now get the burger, where
    the row did not fit anyway (German overlapped the brand in every window under ~1055).
    Pixels: 1280 / 1536 / 1920 and 768 / 390 / 320 are identical by construction (the step is
    the only change and every sampled bar is on the same side of it as before; verified by
    before/after screenshots of every Header and Pages story); the only NEW frames are the
    `AtTheStep` story's (German, the bar pinned at 60rem + 4px by a story wrapper — the proof at
    the flip, its play pinning the gap within [4rem, 5rem]), and `tests/e2e/header-step.spec.ts`
    straddles the flip at 1180 / 1240 on the built export in RO + DE. The darwin re-record of the
    two new frames is the owner's (§15.7). The three files that spell the step (Header ·
    HeaderNav · NavMenu) are pinned to ONE spelling by a `?raw` fence in Header.test.tsx, and the
    folder's other two files (NavItem · BurgerToggle) to NONE.
    **G2 (owner's "did you review it?", the same day — three Fable reviewers, react · typescript
    · a11y): 0 CRITICAL / 0 HIGH.** Folded: the brand selector in the story play and the e2e no
    longer keys off Wordmark's D9 hrefless placeholder (the artwork `<img>` → `closest('a')`, a
    named throw when absent — the declared home-link wiring would have broken both with a bare
    TypeError); the play asserts the webfont is loaded before measuring (a 404'd woff2 would have
    failed it with a number that reads as "the step moved"); the e2e's lower window 1200 → 1180
    (1200 was 2px under the step on a scrollbar-less engine, and those 2px were the pill's
    borders); the fence covers named-container variants and all five files of the folder; the
    test's viewport-variant belt covers the named `min-*` / `not-*` media forms; the coupled
    spellings of 60 are registered in Header.tsx; the stale "not mounted / Phase 4 debts" framing
    in Header.tsx's header corrected (the shell mounts it, the two obligations are discharged).
    RECORDED, not built — the owner's calls: ui/Container's recipe rule 2 still cites the Header
    row-flip as a NAMED-step precedent (the law gains an "arbitrary when measured" clause or drops
    the example); an optional test for the open-below-the-step, widen-past-it, press-the-panel's-
    Contact path (focus falls back to the row's Home link, then the dialog returns there — sensible,
    unpinned); the Vitest storybook project's default 1200px canvas now sits UNDER the flip, so the
    unpinned Pages/Home stories render the burger there (plays and per-story axe stay green; the
    row state is audited by Sections/Header's own pinned stories; the pixel net sets its own widths
    and is unaffected — pin Home at `notebook` if the page audit should see the row); `stripComments`
    is now the ninth copy (the §15.19 round-3 helper-promotion trigger stands); AtTheStep's 390
    frame duplicates GermanStress's 390 (harmless).

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
  language-suggestion banner, root `/` redirect script, and the reviews rotator
  (`sections/ReviewsCarousel/ReviewsDeck` on `lib/rotation` — added by its own lane per
  §15.18, 2026-09-12; ui/Avatar's picture→letters fallback rides inside it), and the price
  menu CARD (`sections/PriceList/PriceMenu` on `lib/scroll-spy` + `lib/sticky-rail` — its own
  lane's pack round 2, owner 2026-09-14, widened from the `<ul>` to the `<nav>` in round 3,
  2026-09-18, §15.20: the nav, its title and the list of links — the current-category marker
  and, when the menu is taller than the window, where the card is held, as `data-rail` + an
  inline `top` that the server HTML never carries; every category card stays inert), and the **Home Hero** (`sections/Hero` — the WHOLE band is the island, on `ui/use-rotation` over `lib/rotation`: which picture is opaque, which slogan readable and which bead current all depend on the active index, and its one static part, the two calls to action, hydrates anyway through ContactModalTrigger; the static HTML still carries every slide, both buttons and the beads at index 0 — hero lane, 2026-09-19, §15.21). Everything else stays inert HTML.
- **Navigation: none.** Every internal link is a plain `<a href>`; the browser loads the next
  HTML document. No client-side route transitions, no link prefetching (§15.13).
- Visitor-dependent decisions: root redirect (cookie → `/ro`, §5), setting
  the language cookie on explicit click, banner show/dismiss state.
- Theme application: **in v1, nothing** — light is the `:root` default. If a second theme ever
  ships: one `data-theme` attribute flip on `<html>` plus a tiny inline pre-paint script to
  avoid a wrong-theme flash; values still come from the build-time CSS.
- The browser evaluating conditions inside the build-time CSS: media queries, container
  queries, `prefers-reduced-motion` (and `prefers-color-scheme` only if a dark theme exists).

**Never at runtime:** data fetching, loading translation files over the network, image
resizing, server rendering, client-side routing / link prefetching, analytics.

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
6. *(Added 2026-07-31, amended 2026-08-05)* The project skills **`/new-atom`** +
   **`/new-section`** (component/section migration flows), **`/section-breakdown`**
   (decomposition → dossier workspaces), **`/classify-component`** (tier rubric), and
   **`/debug-deep`** (ECC-native root-cause debugging loop) in `.claude/skills/` define the
   standing workflows — follow them (§15.12). Commits happen **only on the owner's explicit
   instruction** (§15.7); flows end at "ready + evidence" and wait.
7. *(Added 2026-09-02, org-review board)* Cross-file comment references cite **stable
   anchors** — constant names, comment headings, fb-/D-numbers — never bare line numbers,
   which drift with every edit to the target file. A lane that resolves a promised follow-up
   updates the promising comment in the same lane.
