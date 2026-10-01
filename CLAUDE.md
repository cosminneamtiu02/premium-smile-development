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
    scroll-spy/scroll-spy.ts  # THE "which target am I in" mechanic, on ONE of three lines: the landing line (the default — where a fragment jump rests), the viewport's centre (`line: 'middle'` — the doctor page's timeline, round 2k) or THE READING LINE (`line: 'reading'` — the price menu, 2026-09-29: the middle of the CLEAR area, bent at both ends of the page so every target has a turn, every target's landing planned by lib/reading-line and WRITTEN as its `scroll-margin-top`, the module's one write) + bottom rule + top fallback (`topFallback: 'first' | 'none'` — the named trigger fired by the doctor page's timeline, 2026-09-26) + click pin, which judges only a page that has stopped (THE START GRACE, 2026-09-29) (React-free; price-list pack round 2, 2026-09-14)
    reading-line/reading-line.ts  # THE arithmetic of the reading line: where a jump to each target comes to rest (centred when it fits the clear area, on its old ceiling when it does not), landings kept inside the page and apart by a share of each target's size, and the probe the walk measures — numbers in, numbers out, no DOM (price-list round 5, 2026-09-29)
    sticky-rail/sticky-rail.ts  # THE "where does a sticky rail taller than the window pin" mechanic: fits · top · bottom · travel, direction-aware, a link the KEYBOARD focused reveals its edge — a pointer's focus is never answered, 2026-09-29 (React-free; price-menu-pin lane, 2026-09-18)
    ribbon-model/ribbon-model.ts  # THE floss ribbon's mathematics: one card's path as a chain of segments by arc length (each a plain `kind`, never a class), the gauge rule `k = max(0.0793 W, 0.192 + 0.0602 W)` and the lanes that follow from it, the clearance measure; its two waves SMOOTH beside a keep-out — no corner, no ruler line (§15.26 round 2); six frozen reference cards beside it, the side waves of four re-written from the module in that round (React-free, no DOM; ribbon lane 2026-09-30, §15.26)
    ribbon-layout/ribbon-layout.ts  # the page → the model's numbers: stations and their keep-out blocks found by `data-ribbon-keepout` MARKERS, never by their place in the markup; a keep-out is WHAT IS PAINTED (the element's box and its contents'), a marker that paints nothing is skipped; the portrait's inset; every second card mirrored (§15.26)
    ribbon-paint/ribbon-paint.ts  # numbers → pixels on the ordinary 2D canvas: the strip, the light, additive blending, the plane cut at the card's front face — what is deeper is not painted (§15.26)
    ribbon-draw/ribbon-draw.ts  # WHEN a card's stretch is drawn: the owner's centre-line rule and its two additions, the queue, the pen, reduced motion, a new geometry, the guard, ONE canvas per card joined behind the cards, one barrier round every entry from the browser — `startRibbonDraw(layer)` → `{ dispose, getSnapshot }`, and NOT the ring's construct / start / dispose protocol: nothing renders from it (§15.26)
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
    team/team.ts         # THE clinic's people — doctors (ONE picture, the transparent waist-up cutout — the framed portrait and the optional lib/prices category left with the card's services link, 2026-09-30, §15.25 — own week in lib/clinic's OpeningHours shape, course rows `{ year, words }` grouped by `coursesByYear`, `stats` rows `{ icon id, value, suffix?, words }` for the „în cifre” tiles) and auxiliaries (a 3:4 portrait), five-language words per row (`philosophy` = the `<k>…</k>` quote split by `splitKeywords`, `about` = third-person paragraphs); the clinic's six REAL doctors since 2026-09-30 (names + specialties the owner's; every other field a RANDOM placeholder on his word, EN/DE/FR/IT drafted, all flagged; nobody gendered) beside three still-DEMO auxiliaries (doctor-pages run, 2026-09-21; round 2 2026-09-25; round 3 2026-09-30, §15.23)
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
| Doctor pages *(2026-09-21, §15.23)* | `/ro/team/[slug]` — one per `lib/team` doctor id, every locale (`generateStaticParams` over the list, `dynamicParams = false`); no `lib/routes` row: `matchesRoute` already files them under Team and `equivalentPath` keeps the slug across languages | ✓ | ✓ | ✓ | ✓ |
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
- **CMSR wording scan** *(owner, 2026-09-27, doctor-pages round 2s: "add a step for checking for
  illegal guarantees or things aiming in that direction")*: `tests/unit/cmsr-scan.test.ts` walks every
  string lib/team ships (names excluded) and every `team.*` message value in the five languages
  against one narrow pattern list per language — superlatives, guarantees, pain/risk promises,
  percentages, "number one"/"leader"/"unique"/"excellent", a RESULT qualified as
  predictable/constant/safe/guaranteed, recognition and awards, a success count — and fails CI on a
  hit; an owner-maintained `ALLOWED` list carries documented exceptions verbatim. Widening it to
  other data lists and namespaces is one more `SOURCES` row, a deliberate act (the older copy must be
  read first).
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
| Home | **Hero** (the opener — the old site's auto-iterating photo frame as a DUMB props-in rotator on `lib/rotation` through the shared `ui/use-rotation` shell: a full-bleed stage of grey-veiled photographs UNDER the pill filling the whole first screen (`-mt-[calc(6rem+2px)]` + `min-h-svh`, the SIXTH coupled spelling — round 2), the picture zone light (the old 20 % wash back), one slogan per slide on `ui/Heading` 'hero'/'inverse' over ONE static ground that reaches the old site's 0.40 veil at the words' own row (§15.1's rider), an eased fade into the page ground at the bottom, a ContactModalTrigger + an outline services link, beads only — buttons with `aria-current`, no pause/play and NOTHING that stops it for good on the owner's word (a bead press buys a full interval; keyboard focus inside is the one hold; no pointer hold at all); the page is the ONE populator from `lib/hero-slides`; hero lane 2026-09-19, pack rounds 2–3 2026-09-20, §15.21) · **DoctorShowcase** (the doctors band, right under the Hero since 2026-09-30 — eyebrow „Familia Premium Smile" + h2 „Specialiștii cu care ne mândrim" over every `lib/team` doctor as the doctor card, in ONE column that the floss ribbon wraps (`ui/Ribbon`, drawn live on scroll, §15.26); the SAME band the Team page opens with, populated by the Team page's own walk and its `team.showcase.*` keys; its place on this page is the planner's pick, a lever — §15.25) · ServicesTeaser · **ClinicLocation** (the „Ne găsești" map + contact rows — the first Home band shipped, 2026-09-09, old-site order: late on the page, before the closing band) · **ReviewsCarousel** (the „Părerea ta contează" deck — SectionHeading + ReviewCards on `lib/rotation`; second Home band, built 2026-09-10, replaces the never-built "TrustStrip (opt)"; old-site order: after ClinicLocation; MOUNTED 2026-09-20 on the owner's word — the hero lane's rounds 4–5 — on the first five of `lib/reviews`' `demoReviews` (the Storybook "Five" story's rows, moved into shipped data on the owner's word, flagged) until the real list has a row, at which point the band drops them by itself — §15.19, §15.21) · CTABanner | `home` |
| Services | an `sr-only` h1 (page markup; the VISIBLE opener dropped — owner 2026-09-14, pack round 2 — while §9's one-h1 rule and the SEO outline keep the element) · **PriceList** (the sticky in-page jump menu inside an aura'd Card beside eleven category cards, of which ONLY the one the visitor is at wears the aura, faded in and out over 400ms — round 4, 2026-09-29; every card wore it from 2026-09-14 until then; "at" is THE READING LINE since round 5, the same day: a card lights as its top crosses the middle of the clear part of the window, the first card at the top of the page, and a menu click brings a card that fits to that middle, with no focus ring for a pointer — SectionHeading eyebrow + title on EVERY card, `<dl>` name/price rows in ONE column always; the menu CARD (nav + title + `<ul>`) is the band's one client island `PriceMenu` on `lib/scroll-spy` (the current category marked `aria-current="location"` on its link in BOTH directions, scroll and click, and — round 4 — by a `data-current` mark the island stamps on the card that link points at) and `lib/sticky-rail` (a menu taller than the window pins by its bottom edge scrolling down and by its top edge scrolling up, never a scroll container — round 3, 2026-09-18); a DUMB props-in band populated by the page from `lib/prices` — owner brief 2026-09-13 + pack round 2 2026-09-14, board `price-list.plan.md`; supersedes the „ServiceCard list with price rows" dossier; FAQ void per §15.15) · CTABanner | `services` |
| Team | an `sr-only` h1 (page markup, the Services page's shape — „Echipa noastră" was the VISIBLE opener until 2026-09-30, and §9's one-h1 rule and the tab title keep the element) · **DoctorShowcase** (the visible opener since that day, §15.25: eyebrow „Familia Premium Smile" + h2 „Specialiștii cu care ne mândrim" over the doctors as **PersonnelCard** doctor cards in ONE column inside `ui/Ribbon` (§15.26 — the ribbon's first mount) — each card ui/Card `framed`, the reviews deck's idle frame; the doctor's transparent waist-up cutout over name + specialty beside the justified, quoted `philosophy`, sides alternating; ONE solid button „Mai multe despre mine" → the doctor's page, level with the name on row 2 of a 40 / 60 grid at the card's own `@3xl`; below the step specialty → name → picture → words → button; the FIRST card's picture preloads on this page, its LCP element. The two-link card of 2026-09-21 is history, and the link to a doctor's prices left with it) · **TeamRoster** (the auxiliary-staff tiles ALONE since 2026-09-30 — `<h2>` names on `repeat(auto-fit, minmax(16rem, 1fr))`; until then it also held the visible h1 and the doctor cards; owner brief 2026-09-10, a NEW design with no old-site reference; supersedes the TeamMemberCard dossier) · **ClinicLocation** (the map, last — „so I can test how it goes back and forth on the page”) · TeamIntro / ClinicGallery (opt, unbuilt) | `team` |
| Doctor (`/team/[slug]`, one per doctor — §15.23; reshaped in round 2, 2026-09-25) | **DoctorIntro** (the opener, like jonaclinic.ro's doctor pages: OUTSIDE a card on the page ground, the transparent cutout portrait left, eyebrow = specialty + `<h1>` = full name right on Heading's `hero` step, an `align: start \| center \| end` axis for the words' seat beside the photo — the page passes `lowered`, the top seat dropped 7rem — 3rem on the owner's "push this a bit more down" of 2026-09-25, halved to 1.5rem on his "push it a little more upwards" of 2026-09-26, then 7rem (20 % of the figure's box at 1280) on his "push like 20% more down just the textual part" the same evening, round 2l, one token to dial; the band's own rhythm halved the same day (round 2j, "it starts height wise too low … also the image, so the whole thing") and the words track widened to ⅔ of the row for a BIGGER credo card, its quote on `text-xl`; then, in round 2k the same day, the picture ~30 % larger, the two columns content-sized and CENTRED in the row with the words capped at 28rem (a narrower, taller card — "70% as wide … and taller rather", "left and right they have same as much space"), and BELOW `@3xl` the order name → picture → credo card with the eyebrow and the h1 centred ("name and speciality … above the photo and … centered"); the `<k>` keywords in the quote at weight 650 in the deep violet `accent-strong` (round 2p: "add just a little more bold and underline them maybe"; round 2q, one look later: "remove the underline") (ui/Keyword, round 2m — one evening's road: darkest ink → bold ("a more serious contrast") → italic ("try italic") → "a darker lilla and just a little bold"); under the name the **CredoCard** — ui/Card `framed` + `aura`, the reviews deck's idle card under the price cards' lavender glow (round 2r, 2026-09-26: "add an aura around the filozofia mea card"), eyebrow „În cuvintele mele” + h2 „Filozofia mea” over the doctor card's quoted `<k>` words in the locale's own quotation marks; a free `children` slot after it) · **DoctorProfile** (the soft-lavender band — accent-decorative at 30 % over the page, half again ui/Card's 20 % tint ratio, the owner's „too faded” verdict of 2026-09-25 — with the Hero's ten eased stops fading in above and out below: „Biografie / Despre {name}” third-person paragraphs on ~75 % of the row ‖ the **ScheduleCard** on ~25 % — ui/Card `framed`, the deck's idle card like the credo card, on a named `<section>`, the h2 „Când mă găsiți la clinică” alone (its „Program” eyebrow struck 2026-09-26) centred over the doctor's own Mon→Sun week through `lib/hours` as a centred two-column block, closed days muted; ONE width, 20rem, at every screen (round 2k: "should not be widening as you widen the screen or tighten when you tighten it" — it shrinks only under a column narrower than 20rem); the biography a NAMED REGION of its own beside the week's (G2-R2 tier 2, a11y: the one content block a landmark walk skipped), the card `self-center` beside it in a one-row grid — its middle the band's vertical middle by construction, pixel-identical to round 2g's two-row placement (owner 2026-09-26, "center it also vertically in the lila section"); no divider, no rule) · **DoctorCourses** („Formare continuă / Cursuri și specializări”: h2 over a CV TIMELINE — the line down the LEFT at every width (owner 2026-09-26: "the line should be on the left side, not centered" — round 2e's alternating layout is history), one YEAR per row with a dot on the line, the year an `<h3>` on Heading's `title` step over a bulleted list, the rail capped at the prose's `max-w-4xl`; and ONE CURRENT YEAR on scroll through the **CourseTimeline** island on `lib/scroll-spy` (`topFallback: 'none'`), the years on Heading's `section` step over a doubled `gap-20` (round 2j): the line is PER-GROUP SEGMENTS, so at rest every subsection recedes — its segment and dot `bg-line`, the year in the `accent-idle` tone, the list muted, the whole group faded — and the last year whose top has crossed the CENTRE of the screen (round 2k, `line: 'middle'`) COMES FORWARD: the group scales toward the viewer (`--animate-forward`, settling at 1.04, `origin-left`), its segment and dot take the accent, the dot pops, the year turns `accent`, the list full ink; reduced motion = the colours and the fade without movement; the server HTML carries no current mark; owner 2026-09-25 round 2e, 2026-09-26 round 2g) · **DoctorStats** (the second lilac band — on the shared **TintedBand** ground — „În cifre / Excelență confirmată în timp” centred over a lead sentence and four tiles: a light disc with a green line glyph, the number counting up once from 0 through the `StatNumber` island (the static HTML prints the final value; reduced motion = no count, re-asked when the count would start), an `<h3>` label — BEFORE the number in the DOM since G2-R2 tier 2 (a screen reader's H key lands on the label with the number next), the paint order kept by two `order` tokens — a muted sentence; a tile's `value` is refused by `countFrames` unless a whole number ≥ 0; the sr-only twin SPEAKS the `+` suffix's meaning — „peste 3.000" / "over 3,000" / „über" / « plus de » / « oltre » — from the page's `team.doctor.stats.atLeast` key (owner 2026-09-27, round 2s; the visible span keeps „3.000+"); the band's title is „Experiență confirmată în timp" and every stat sentence descriptive — the CMSR scan (§13) refuses the old „Excelență" / „Rezultate predictibile și sigure" / „Intervenții reușite" / „Recunoaștere" shapes; four on a row from `@3xl`, two on a tablet, one column on a phone; the numbers and words per doctor in `lib/team`, the three band keys the page's; owner 2026-09-26 round 2f) · *[FUTURE, owner 2026-09-25: a band of this doctor's blog articles goes HERE, above the map — not built until the blog exists]* · **ClinicLocation**. Every side-by-side arrangement stacks one above the other below the Container's `@3xl` step (the owner's adaptability rule, play-pinned) | `team` |
| Blog (ro only) | PostCard list · PostPage (MDX) | `blog` |
| Contact (modal) | ContactModal: `tel:` phone, WhatsApp, address, hours, directions link | `contact` |
| Global | Header (nav + Contact button + LanguageSwitcher) · Footer (**full NAP** + hours + policy link) | `common` |

## 15. Parked decisions — ASK before deciding, do not improvise

1. Design tokens — **LOCKED 2026-07-30** on the TOKEN_AUDIT proposal plus these owner
   decisions: CTA restored to the green family (`#008854` button face, `#00A968` anchor);
   fonts **Source Serif 4** (display + body) + **JetBrains Mono** (eyebrows), Publio only
   inside the vectorized logo; body base **1.125rem**; default radius **6px**; star
   `#B29126` → **`#D4AF37` (amended 2026-09-12, owner — the rider at the end of this item)**; hero text scrim floor ≥ 0.55; single light theme; long prose `text-align:
   start`; `success` role dropped (17 semantic roles total — 18 since 2026-09-26, 19 the same evening — `--ink-faint` #766f69, washed prose that still passes body text's 4.5:1 (4.94:1 on white, 4.70:1 on the page ground; never on the 30 % tint at 3.24:1), the two doctor quotes its only consumers, the owner: "what if you make the faint text lighter" — and `--accent-strong` #4b3a86 (#655885 for its first hour — the owner: "a darker accent … make it just jump at you more, as keyword, important information"), the violet that passes body text's 4.5:1 with room — 8.88:1 on the page ground, 9.34:1 on white — for body-size accent INK, ui/Keyword's `<k>` fragments its first consumer; the owner, doctor-pages round 2m: "use a darker lilla and just a little bold"; `accent-decorative` keeps its display/graphics charter). Amendments from contradiction
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
   **Third per-element exception — the doctor page's prose (2026-09-25, owner, the
   doctor-pages run's round-2 pack, two sentences the same day: "these texts do not feel like
   justify" · "this text just isn't justified"):** the `CredoCard` `<p>` in sections/DoctorIntro
   — the SAME quoted words as the roster card's `<blockquote>`, repeated on the doctor's own
   page — and EACH „Despre” paragraph `<p>` in sections/DoctorProfile ship `text-justify` ON
   THE ELEMENT (§15.15 b once more). Both were built start-aligned first, because this
   exception's scope was "that one element", and flipped on the owner's sentences. Scope:
   those paragraphs, in every locale; every other prose on the site stays start-aligned.
   **Radius amended 2026-10-01 (owner, soft-corners lane — "i want that rounded corner
   effect that the doctor card from old webpage has … implemented in all mentioned
   parts"):** the 6px default STANDS for every control and card, and the site gains a
   SECOND, named corner — `--radius-soft` = **1rem**, the old site's own `rounded-2xl` card
   radius — worn by exactly four parts: sections/PersonnelCard (both kinds, through
   ui/Card's new `corners="soft"` situation), the Header pill with NavMenu's panel,
   ui/TextButton's box and ui/Modal's box (the contact dialog). The services page's cards
   wore it for an hour and went back to 6px on the owner's taste. Item 28 is the record.
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
      language-suggestion banner (optional), a ClinicGallery lightbox, or a **doctors dropdown
      under „Echipa" in the navigation** (owner, 2026-09-27: "what if you could have a dropdown in
      navigation? add for future implementation as possible option" — the SC 2.4.5 second way to
      a doctor page, §15.23 round 2s; recorded, not built). **FAQ is out of
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
    change, a top-fallback option for a consumer whose targets sit below a long intro (BUILT 2026-09-26 as `topFallback: 'none'` for the doctor page's timeline, §15.23 round 2g), and
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

    **Round 4 (owner, 2026-09-29, verbatim: "i need you on current prices page to add aura
    shadow jsut to currently selected/viewd price box. and on the menu of selecting the
    category. so what category card is not selected gets no aura. and aura has to be smooth
    when selected, like not sudden and upon deselect again smooth"; lane
    `rework/price-list-current-aura`, run workspace
    `.claude/section-runs/2026-09-29_price-current-aura/` — machine-local, gitignored):** THE
    GLOW FOLLOWS THE VISITOR. Round 2's decision 4 (the aura on every card) is reversed for
    the category cards: the MENU card keeps the glow it wears, permanently — the reading of
    "and on the menu" this round was built on, flagged to the owner — and among the eleven
    category cards ONLY the one the visitor is at wears it. "At" is `lib/scroll-spy`'s own
    answer, the one the menu link already carries as `aria-current="location"`: the landing-line
    walk, the click's pin, the bottom rule, a `#id` in the URL. One store, two marks that can
    never disagree (measured: 30 photographed states and every click timeline, 0
    disagreements). **How:** `ui/Card`'s `aura` gains a third answer — `CardAura = boolean |
    'current'`: never · worn · ARMED — and the atom exports `CARD_CURRENT_ATTRIBUTE`
    (`'data-current'`). An armed card carries the glow on its `::before` at opacity 0 and shows
    it while its element carries the attribute; the fade is that LAYER'S OPACITY on the atom's
    own `--fade` clock (400ms, ease-in-out), declared unconditionally so both directions ease,
    with its own `motion-reduce` reset (the glow still moves from card to card, at once).
    `cardClasses` is byte-identical, so no other card on the site changes by a byte. The mark
    is typed (`data-current?: ''` in the atom's props — a boolean would print `"false"`, which
    a presence selector matches) and the class assembly is total over `CardAura` and fails
    closed. `CategoryCard` changes ONE prop and stays an inert server component; the island
    `PriceMenu` gains ONE effect that STAMPS the attribute on the card its spy names and takes
    it off in its cleanup — the one runtime DOM write on this site that lands outside an
    island's own subtree (§16, amended). **Why opacity and not the shadow on a clock:** a
    box-shadow is painted, opacity is composited. MEASURED on the built page (Chromium 151,
    fourfold CPU throttle, a phone-sized screen at three times the density, the tallest card,
    ONE hand-over): some 90 Paint events, 23–26 ms of paint and 20–21 ms of raster work with
    the shadow animated, and the engine reporting it could not composite the animation; 4
    events and about 3 ms with the layer, all where the fades start and end. Four of the eleven
    cards are over 1000px tall on a phone (the tallest 2112px at 390). **Two alternatives
    weighed and declined:** rendering the cards from the island — it would SHRINK the document
    (184 KB → about 135 KB: the 102 rows are printed twice today, as markup and as the flight
    payload's element tree) but would ship the cards' render code and run it for 102 rows at
    every hydration, for markup that is identical for everyone; a client shell per card with a
    context — eleven hydrated components and a provider for one attribute. **A CORRECTION THAT
    OUTLIVES THIS LANE:** `container-type` makes a box NEITHER a positioning scope NOR a
    stacking context in current engines. It used to imply layout containment; the CSS Working
    Group removed that on 2024-07-24 and engines followed (Chrome from 129, Safari from 18.4;
    an iPhone on iOS 16–18.3 still does the opposite). Measured in Chromium 151 and WebKit
    26.5: an absolutely positioned child of a bare card resolves against the nearest
    positioned ancestor (702px wide around a 620px card). So the armed card says `relative`
    itself — load-bearing, test-pinned — and `ui/Card`'s header is corrected. THE SAME CLAIM
    STOOD in `ui/Container`'s header, `sections/Hero/Hero.tsx`, `sections/Header/NavMenu.tsx`,
    `sections/Header/Header.tsx`, §15.21 ("`ui/Container`'s `container-type` is a containing
    block") and MIGRATION_INVENTORY's Container row; every one of them is corrected in round
    5, below, on the owner's word. **Evidence at READY (round 4's own; round 5 has the lane's
    final numbers):** tsc · eslint · prettier
    clean; vitest 2660/2660 (123 files; develop stood at 2633); build-storybook and `next
    build` green; e2e 36 passed (the new `tests/e2e/price-current-aura.spec.ts`: the server
    HTML carries no mark and no Suspense boundary between `<main` and the band's end · the
    first card glows at load, RO + DE · a scroll moves the glow with the menu's mark · a click
    pins it at once · the fade is a real 400ms transition in both directions · reduced motion
    moves it at once · the jumped-to card keeps its focus ring · the phone); G2 = three Fable
    reviewers (react · typescript · a11y), 0 critical / 0 high in the diff, every medium and
    low folded in ONE round. **Visual:** the pixel net CANNOT SEE this change — all 428
    existing cells pass against pristine develop, because a 40 % lavender blur sits under
    Playwright's per-pixel threshold (the aura-token test's own note, confirmed). The manifest
    was therefore MEASURED at zero tolerance, before/after: exactly 24 cells move (12
    Sections/PriceList + 12 Pages/Services, 6–16 % of their pixels, all inside the cards
    column), the rest are byte-identical bar rendering noise, and that noise floor — measured
    across three shoots of one build — is 54 pixels at 2/255 (two unrelated stories, the open
    language dial and SpeedDial's focused disc, flicker by 6–9 pixels at 1/255 between runs). 25
    darwin baselines are recorded (the 24 + the new `ui/card/aura-on-current`); 14 of the 24
    were ALREADY STALE on develop before this lane — different heights since #107 enlarged
    every `<h2>` — so their re-record absorbs that debt too. The linux set is CI's
    (`visual-baseline.yml`), before the next promotion. **Found in this round, both
    pre-existing (#102 and #101), both FIXED in round 5, below, on the owner's "fix them for
    me":** (P2, the graver) `lib/sticky-rail` answered ANY `focusin`, so in Chromium, at a
    window where the menu is taller than the screen, a mouse PRESS on a link near the bottom
    edge re-pinned the menu 174px up at mouse-down and the mouse-up landed on the `<nav>` —
    the click was swallowed and nothing navigated (measured with a raw pointer at 1366×633;
    this round also recorded that Safari "focuses the nav instead and is unaffected", which
    was WRONG — round 5 has the measurement). (P1) `lib/scroll-spy`'s settle judged arrival
    150 ms after the pin whether or not the jump had begun, so under a starved main thread the
    pin was dropped and both marks walked through the cards the glide passed (WebKit 12 of 12
    on the built page under one 160 ms task; Chromium held there; on an idle main thread both
    held); the glow made it visible, the link did it before. Also recorded for the owner: in forced-colors mode
    `ui/TextButton`'s two marks are both dropped (pre-existing, the atom's); the e2e suite runs
    Chromium only (a WebKit project is the owner's call); without JavaScript no card glows
    (decoration — §16's neutral default); and the glow is FAINT BY DESIGN — about 1.45:1
    against the page at its darkest pixel — so if an older patient is meant to NOTICE the
    current box, the lever is the card's border colour, not the glow.

    **Round 5 (owner, the same day, 2026-09-29, on the round-4 pack — verbatim: "when you click
    on the menu om an item, it takes you to the item, but it also highlights it with a dark
    border. not the shadow, but a dark border. i want that removed. second, when you scroll, it
    turns on the shadow highlight too late, once it already passes the that point at which you
    see the top of the card because it already passes below the top bar … i need a new scrolling
    or selecting of current card that keeps the line lower for currently selected items and also
    selects top one, like idk, maybe somehting based on size of card … so smaller cars at top
    also get selection … and also the go to card when you click on the meniu on an option should
    be more to the center of the screen"; and on round 4's open questions: the menu CARD keeps
    its glow — "yes, that's what i meant" · the two defects — "fix them for me" · the stale
    `container-type` claim — "decide for me", a ONE-TIME delegation · the linux set — "there
    still is some way to go until then"; the same lane, still uncommitted):** (1) **THE RING IS
    THE KEYBOARD'S.** The dark border was the shell's `:focus-visible` outline on the card,
    which is focusable by script so that a jump is announced. Whether it is drawn is each
    engine's guess, MEASURED on the built page: after a MOUSE click on a menu link it matches in
    WebKit — the border the owner saw — and not in Chromium; after Tab + Enter in both. So the
    band states the rule itself: `CategoryCard` wears
    `not-data-[arrival=keyboard]:focus-visible:outline-hidden`, and the island stamps
    `data-arrival="keyboard"` on the target card when the click's `detail` is 0 (the keyboard's;
    1 for a mouse and a touch, both engines), lifting it when focus moves to something else in
    the page — a window that loses focus takes nothing off. A pointer draws no ring in any
    engine; the keyboard keeps the full ring in every engine; forced colours keep an outline
    (the `focus-visible:` variant is load-bearing — without it that branch would outline every
    card). The pair of constants lives in NEW `sections/PriceList/arrival.ts`, because the class
    is a server component's and the write is the island's. **RECORDED AGAINST SC 2.4.7 AS A
    RISK, THE OWNER'S CALL:** an arrival no click made — a pasted `#id`, Back, Forward — is
    never stamped, so it draws no ring for a keyboard visitor either; the inverse default was
    weighed and declined on a measurement (on a fresh load with a fragment BOTH engines focus
    the card and BOTH match `:focus-visible`, so it would draw the border for every visitor who
    follows a shared link, phones included); the lever, named and not built, is to stamp the
    focused card at the first key pressed while it holds focus. (2) **THE READING LINE.** NEW
    React-free `lib/reading-line` (pure arithmetic) and a THIRD line on `lib/scroll-spy`, `line:
    'reading'`, which `PriceMenu` now passes — the landing line stays the default and has no
    consumer. The line is the middle of the part of the window the page keeps CLEAR,
    `(scroll-padding-top + innerHeight) / 2` — not the screen's middle, the timeline's D49,
    which under the 96px pill sits 48px above the eye's. A card that fits lands CENTRED on it; a
    taller one with its top on its old ceiling, 6rem + its own stylesheet `scroll-mt-10` =
    136px, the menu's line. Near the page's two ends an ideal landing lies outside what the page
    can scroll, so landings are kept inside the page and at least half the distance between two
    tops apart (`READING_END_PACE = 2`, the owner's "based on size of card"), and the walk's
    probe is the straight line through every (landing, anchor). Two properties follow and are
    proven on the MEASURED page (twelve windows × RO/DE): every card has a turn, in order — the
    first at scroll 0 however short — and at each card's landing the walk names that card, so a
    click and a scroll cannot disagree. A card now lights when its top reaches 365px at
    1366×633, 521px at 1920×945, 471px at 390×844 (137px before, under the pill). The jump stays
    the BROWSER's — URL, focus, Back — because the spy only WRITES each card's planned
    `scroll-margin-top` inline (its one write, off again at dispose; the floor re-read at every
    resize with the write lifted); and it makes ONE scroll of its own, once per pin: a pinned
    card resting on the STYLESHEET's line was landed by a jump that did not know the plan — a
    pasted link, which the browser follows before any script runs and whose destination it fixes
    at the start (measured, both engines) — and is finished with `scrollIntoView`. Declined: one
    lower fixed line in CSS alone (cannot centre, skips the first card on a tall window);
    scrolling by script (rebuilds the jump by hand); "the card with the most pixels" (a short
    card between two tall ones never wins). Known and kept: at 1920×945 the SECOND card rests
    94px above centre so that the first keeps its turn; a card taller than the window lands
    where it always did. (3) **P2 FIXED** — `lib/sticky-rail` answers only a focus the KEYBOARD
    made (`:focus-visible` at `focusin`, a try/catch for engines before it). Round 4's reading
    of Safari was wrong, MEASURED: with the menu pinned by its bottom edge — every laptop once
    the visitor has scrolled — a press in WebKit focuses the `<nav tabindex="-1">` itself, the
    rail pinned 'top', the menu jumped 174px and the click landed on the `<ul>`; after the fix
    it navigates in both engines, both states. (4) **P1 FIXED** — THE START GRACE: the settle
    judges only a page that has stopped, and a pin whose page never moved gets one window more;
    a 250ms task right after the pin no longer walks the mark, both engines. (5) **THE STALE
    CLAIM, CORRECTED** (comment-only): `ui/Container`, `sections/Hero`,
    `sections/Header/{Header,NavMenu}`, `Header.test.tsx`, §15.21 (annotated) and the
    inventory's Container row. AUDITED, every page type at 390 and 1366, both engines: no
    painted box resolves differently under the pre-2024 model (four 1px `sr-only` spans are the
    only boxes that do). One assumption of the planner's own fell with it: NavMenu's sheet must
    still leave the bar, but because the bar's `backdrop-filter` makes it a containing block in
    every engine (a fixed box inside it measures 1076×80), not because of the container mark.
    **Evidence at READY:** tsc · eslint · prettier clean; vitest 2761/2761 (124 files);
    build-storybook and `next build` green; e2e 76 passed, 24 skipped (NEW
    `tests/e2e/price-reading-line.spec.ts`; the ring's test became three; two pointer-press
    tests in `price-menu-pin.spec.ts`); the planner's own verification on the BUILT page in
    Chromium 151 AND WebKit 26.5, RO + DE, 1366×633 · 1920×945 · 390×844 — 140 checks, 0
    failures; visual at zero tolerance against round 4's final shoot — 420 of 429 frames
    byte-identical, 9 within the measured noise floor (5–54 px at ≤ 2/255), so round 4's 25
    baselines stand; G2 = three Fable reviewers (react · typescript · a11y), all three APPROVE
    WITH CHANGES, 0 critical / 0 high; the one medium all three raised — the keyboard's stamp
    lifted by a WINDOW's blur, confirmed with a real tab switch — and two test gaps (no test
    observed a reading-line pin's arrival; the probe's interpolation was unpinned) folded, each
    new test proven to turn red under its mutation. Cost, measured by the React review: the
    services page ships 162,084 B of JavaScript gzipped against develop's 160,311 (the island
    chunk 3,400 → 5,175), and every doctor page's timeline chunk grows 9,661 → 10,980 because
    `lib/scroll-spy` imports `lib/reading-line`. **Recorded, not built:** the floor on a
    text-size change (no resize fires); the rail's gate as "a press in flight" rather than
    `:focus-visible` (a focus an assistive technology sets after a mouse press is not answered
    in Chromium — PLAUSIBLE, unverified); a second movement of the page after a pasted link
    (122–278px back towards the middle); forced colours carrying no "current" mark at all (older
    than the lane); Firefox, a real iPhone and screen readers NOT run — §9's page-tier
    walkthrough is still owed; the e2e suite is Chromium-only (a WebKit project is the owner's
    call).

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
    photograph can never sit inside it — *annotated 2026-09-29, §15.20 round 5: true of the
    engines before Chrome 129 / Safari 18.4 only, every iPhone on iOS 16–18.3 among them;
    the sibling placement is right in all of them*) · ONE `opacity` crossfades picture, scrim and words
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

23. **Doctor-pages run — BUILT ON THE OWNER'S DISPATCH (2026-09-21, verbatim: "starting from
    latest development … a rework on the doctors card … 2 buttons identical as aspect to the
    ones in the hero section … at the same level on the oy axis as [name + position] and
    centered below the description text … the left button is see services done by doctor and
    the right one takes you to the doctor page. Each doctor will have his own page … this page
    as structure will be reused for more doctors … accessibility and adaptability in mind …
    build every section … do not run full code review until i do large pr in the end … build
    personnel page as simple as possible as it is now in team composition and add at the end
    the map"; epic #107, lane `feat/doctor-pages`, run workspace
    `.claude/section-runs/2026-09-21_11-58_doctor-pages/` — machine-local, gitignored — whose
    ledger carries the run's D1–D11):** NET-NEW design (the old repo never had a per-doctor
    route, a schedule, courses or portrait assets — its short-lived `/$lang/team` page was
    deleted in `244192f`; §17.2 satisfied by absence). Eight units, built by five parallel
    Opus builders in wave 1 and two in wave 2, every band DUMB props-in (zero keys, zero data
    — the PriceList/Hero shape; `app/[locale]/team/populate.ts` is the ONE populator for both
    pages, with `renderAbout`/`closedLabel` callbacks as the seam): **`ui/Keyword`** — the
    promotion PersonnelCard D9 reserved for "the second section that wants keyword fragments"
    (`Keyword` byte-identical, plus `Keywords`: structural `{ text, keyword }` segments →
    fragments, so `lib/team` never imports ui) · **`sections/PersonnelCard` rework** — the
    doctor kind REQUIRES `actions: { services, profile }` (typed `never` on auxiliary): the
    Hero's pair face for face (`ui/Button` solid lg · outline lg, both `asChild` on plain
    `<a href>`s) in the Hero's own row under `max-w-3xl`; at the card's `@3xl` the layout is
    a 2×2 grid — portrait ‖ quote on row 1, name + position ‖ buttons on row 2, both row-2
    cells `self-center` (the owner's "same level on the oy axis"), the D6 block dissolving
    through `@3xl:contents` so the stacked phone shape is byte-identical to before; DOM order
    who → what they say → what you can do; `side` still a visual-only mirror; and
    `headingLevel: 2 | 3` (default 3) — D4's recorded trigger, fired INVERTED: the Team page
    puts the cards directly under the page `<h1>` (D10 struck the sub-headings), where a
    level-3 title skips a level (§9; axe's heading-order fired on every roster story), so
    TeamRoster passes 2 and NO axe rule is silenced anywhere (the builders' interim
    per-story suppression was removed by the planner) ·
    **`sections/DoctorIntro`** (`ui/Image artwork` + `preload`/`fetchPriority=high` — the
    page's LCP — `alt=""` by D3's adjacent-heading rule, h1 on Heading `hero`, `align`
    default `'start'` = the referenced page, the three seats storied for the owner's pick) ·
    **`sections/DoctorProfile`** (ONE `--tint` variable = `color-mix(in srgb,
    accent-decorative 20%, transparent)` over `bg-page`; the two fades are the Hero's ten
    eased stops with the tint in place of `--page`, so a fade's last pixel IS the middle's
    ground — no seam by construction; measured ink on the tint 11.0:1 / muted 5.5:1, AA; an
    engine without color-mix falls to the plain page, never a dark band) ·
    **`sections/DoctorTeam`** + in-folder **`ScheduleCard`** (`ui/Card emphasized asChild` on
    a named `<section>` — a "Programul meu" region inside the "Echipa mea" region — the
    Footer's `<dl>` recipe over `lib/hours` rows; `members` is a TUPLE of exactly two, the
    owner's "always … 2"; `@md:grid-cols-2` with the schedule spanning, `@3xl:grid-cols-3`
    = one row) · **`sections/TeamRoster`** (the visible h1, doctors alternating sides,
    auxiliaries on `repeat(auto-fit, minmax(16rem, 1fr))` — PersonnelCard D5's 16rem floor
    honoured at every width) · **`lib/team`** (D2 of the run: content is DATA — a doctor's
    words travel with his pictures, `Record<Locale, …>` per row, the `<k>…</k>` marks kept
    from D9 and split by `splitKeywords`; DEMO people = the PersonnelCard fixtures, two
    synthetic transparent cutouts `public/images/demo/cutout-{1,2}.png`; every EN/DE/FR/IT
    word DRAFTED and flagged; course lines D-DASH-clean) · **the pages**: `/team` rebuilt
    (TeamRoster + ClinicLocation) and NEW `/team/[slug]` (DoctorIntro → DoctorProfile →
    DoctorTeam → ClinicLocation; `generateStaticParams` over `lib/team`'s ids under the
    layout's five locales, `dynamicParams = false`), story twins Pages/Team + Pages/Doctor
    in RO + DE, ten `team.*` keys ×5 DRAFTED (§15.17). **G2 — the three-persona review, run
    on the owner's word the same day (react · typescript · a11y, Fable @ max; the run ledger's
    G2 section + `g2-fixes.md` carry the eighteen folded items):** 0 CRITICAL · 1 HIGH — both
    new pages shipped the bare site name as `<title>` (SC 2.4.2, Level A): each page now has a
    MINIMAL `generateMetadata` (`{h1 text} — {siteName}`, the 404 page's idiom) until the SEO
    lane authors the full §10.3 pattern · 3 MEDIUM — `splitKeywords` swallowed a doubled
    opening `<k>` (the capture is tempered, the residue check now throws); the Hero ↔
    DoctorProfile fade curve became a proper KEEP-IN-SYNC pair (pointer in Hero.tsx beside
    `fadeClasses`, a `?raw` cross-pin in DoctorProfile.test.tsx); every doctor card's two
    links carry `aria-labelledby="{link} {heading}"`, so a links list reads „Vezi profilul
    Dr. Elena Marin" (SC 2.5.3 holds — the visible label leads the name) · LOWs folded: the
    opener's h1 precedes the specialty in DOM (`flex-col-reverse` keeps the eyebrow above), the
    schedule `<dl>` capped at 24 rem, ceilings in the data test (16-char unbreakable name
    tokens at the `hero` step, 21-char mono positions — the DE draft „Patientenbetreuung"),
    the opener's `sizes` corrected to `min(28rem, 32vw)`, courses unique and `<k>`-free in
    every field, the two typings the earlier list had parked are TAKEN (`photo.src` is
    `ImagePath` on the four section shapes — the lane's own fixtures had spelled root-less
    paths), the vacuous "map is last" play fixed, a duplicate-assistant belt in the populator.
    **Owner decisions, recorded NOT built:** SC 2.4.5 Multiple Ways (AA) — a doctor page is
    reachable only through its Team card; options: an "other doctors" strip on the doctor page,
    the doctors listed under „Echipa" in the Footer's site map, or an HTML site-map page (the SEO
    lane's `sitemap.xml` is not a user-facing way); forced-colors on `ui/Button`'s solid face
    when it dresses an `<a>` (a ui/Button follow-up: `forced-colors:border`); the nav's
    `aria-current="page"` on „Echipa" while on a doctor page (`lib/routes`' section rule,
    pre-existing); the 320 sideways-scroll plays are not a failing gate (harness follow-up: a
    `pageerror` hook in the visual spec); `team.doctor.schedule.closed` duplicates
    `common.footer.closed`; `servicesCategory: string` stays (a compile-time union needs
    lib/prices re-declared `as const satisfies`); the doctor page ships no CTA pair of its own
    (the opener's slot exists — the `WithActions` story). **Visual:** no win32 set exists — the
    manifest in the run ledger (new UI/Keyword · Sections/{DoctorIntro,DoctorProfile,
    DoctorTeam,TeamRoster} · Pages/Doctor; changed Sections/PersonnelCard doctor frames ·
    Pages/Team) is the declaration; the darwin re-record is the owner's (§15.7).
    **Round 2 (owner pack feedback, 2026-09-25 — the same lane, still uncommitted; the run
    ledger's `round2/ledger-round2.md` carries D12–D21):** the doctor page RESHAPED. (1) **THE
    CREDO CARD** — "below [the specialty + the name] I need the card from reviews, but … the
    non current one … just the internationalised quotations and … the original doctor text
    from the doctor card with bold text … a heading with eyebrow with „filozofia mea” … an
    eyebrow text you decide": `DoctorIntro` gains a REQUIRED `credo`, rendered by the
    in-folder `CredoCard` — ui/Card `framed` (the deck's idle card: 3px `--card-tint` frame on white; since round 2r, 2026-09-26, with the atom's `aura` — the owner: "add an aura around the filozofia mea card" — the ONE prop PriceMenu and every CategoryCard pass, D61; the opener's phone floor `pb-8` so the next band never paints over the glow's 32 px tail) (the deck's idle card: 3px `--card-tint` frame on
    white) on a `<section>` named by its h2, SectionHeading eyebrow „În cuvintele mele” (Claude's
    pick) + „Filozofia mea”, a `<blockquote>` `<p>` in CSS `open-quote`/`close-quote` carrying
    the same `ui/Keyword` fragments the roster card quotes; built START-aligned (§15.1's
    justify exception was scoped to the roster card's one element) and JUSTIFIED the same
    day on the owner's pack verdict — "these texts do not feel like justify", then "this
    text just isn't justified" for the „Despre” paragraphs — now §15.1's third per-element
    exception, the doctor page's prose; the slot stays after the card (D12). (2) **„ECHIPA MEA” DROPPED** — "will be completely
    dropped": `sections/DoctorTeam` deleted, `assistants` out of lib/team, `team.doctor.team.*`
    removed ×5 (D13). (3) **THE LILAC BAND, NEW CONTENT** — the fades and the tint stay (the
    Hero KEEP-IN-SYNC pair and the `?raw` cross-pin untouched); inside: „Biografie / Despre
    {name}” (the title takes the doctor's name as an ICU argument, so every page's h2 is its
    own) over three third-person paragraphs (`text-ink`, not muted — reading prose for §1's
    70-year-old; `max-w-4xl` the one lever on line length) on ~80 % of the row ‖ the white
    **ScheduleCard** on ~20 % — "the reviews' current one, but white" = ui/Card `surface`, the
    atom's default row (no new tone: on the tint the 1px `line-subtle` edge is invisible and the
    white ground IS the edge), moved from DoctorTeam, now eyebrow „La clinică” + h2 „Program” over
    the `<dl>`; `@3xl:grid-cols-[minmax(0,4fr)_minmax(16rem,1fr)]`, MEASURED against the gutter
    box: 256 / 720px at 1280 (25 %), 256 / ~925 at 1536 (20.8 %, the 16rem floor still binds),
    ~298 / ~1190 at 1920 (19.4 %); the card its own height, `self-center` on the prose's (owner, the same day: "centered in its section vertically"); the prose OUTDENTED 2rem into the gutter at the step (`@3xl:-ms-8` on the about half — owner: "move left margin of text a bit more to the left … only the lilac band's prose"; a recorded departure from the band recipe, one utility, this band alone); the divider gone (D14). THE TINT
    IS 30 %, NOT THE CARD'S 20 % — the owner's same-day pack verdict, "the faded section is
    too faded": measured on the 30 % ground (rgb 212 207 220) `--ink` 9.7:1 · `--ink-strong`
    11.7:1 · `--ink-muted` 4.8:1, and that muted 14px eyebrow is the ceiling — 40 % would put
    it at 4.2:1, under §9's 4.5:1 — so a darker band means a darker eyebrow ink first; the
    two fade curves are untouched (the KEEP-IN-SYNC pair and the cross-pin still hold). THE
    SCHEDULE CARD, the same day ("a thin line like there is already in the project below
    heading and above effective schedule … schedule centered in its section"): the price
    menu's own rule under its heading — `mt-4 … border-t border-line-subtle pt-4` on the
    `<dl>`, the three utilities PriceMenu puts on its list — and the week CENTRED in the card
    as a two-column grid (`grid-cols-[auto_auto] justify-center`, the `<div>` pairs
    `contents`), which retires G2 F4's 24rem cap: a content-sized block keeps day and hours
    in one magnifier window by construction. ROUND 2E (the same evening, six asks): the
    schedule card BROADER — its track `minmax(20rem, 1fr)` beside `3fr` (~25 %: 320px on every
    laptop, 380 at 1920), the week's columns `gap-x-10`; the round-2c RULE STRUCK ("remove thin
    line"); the pair renamed „Program” / „Când mă găsiți la clinică” (the owner's direction, ×5
    drafts); the opener CENTRED with the week (SectionHeading `align="center"` — "equal space
    left and right in the section"); the card's top LEVEL WITH THE FIRST PARAGRAPH ("starts on y
    axis where text starts" — a two-row grid at the step: the „Despre” opener alone in row 1, the
    paragraphs and the card in row 2, the about half dissolving through `@3xl:contents`, the
    PersonnelCard idiom; supersedes 2d's `self-center`); the card now ui/Card `framed` ("the one
    with the non current review, the one with border" — the credo card's face; on the 30 % tint
    the 3px `--card-tint` frame is LIGHTER than the ground, 1.1:1, a pale halo, the white ground
    still the edge); the outdent moved from the about half to the GRID (`@3xl:-ms-8`, one
    spelling, the prose column widens leftward, the card's right edge stays on the gutter); the
    OPENER's words 3rem lower — `DoctorIntro`'s `align` gains `'lowered'` (`self-start` +
    `pt-12`, the fourth seat; the page passes it; `center` would have moved them ~125px, "a bit"
    is 48); and the COURSES BAND BECOMES A CV TIMELINE (D28 — "central a line, dots at year left and right alternatively, the years and with bullet the course per year"): a central `accent-decorative/40` line the rail's full height, one year group per row on `@3xl:w-1/2` alternating left (`pe-12`) and right (`self-end ps-12`), a 12px accent dot with a page-coloured ring on the line at each year's line; below the step one column, the line 1.5 spacing units in on the left (`start-1.25` + half of `w-0.5` — scale tokens, no pixel, §7), every group `ps-10`; line and dots `aria-hidden`, the h2 / h3-per-year / list semantics untouched; the page twin's courses play pins the stagger, the line and every dot on it in both branches.
    **Round 2f (owner, 2026-09-26, mid-turn: "a section below cursuri si specializari, another lila
    section like the one below … each page populated like a dumb component"):** THREE units. (1)
    **`sections/TintedBand`** (D29) — the lilac ground (the 30 % tint, the Hero's two ten-stop
    fades, the `bg-page` outer, ui/Container inside) EXTRACTED from DoctorProfile at its second
    consumer, §4's first sharing row; DoctorProfile and DoctorStats compose it; the Hero ↔ band
    KEEP-IN-SYNC pointer and the `?raw` cross-pin now live with it; names pass through, so a
    consumer may be a region while DoctorProfile stays unnamed by its own Omit. (2)
    **`sections/DoctorStats`** (D30) — DUMB props-in on TintedBand: SectionHeading `align="center"`
    + a centred lead `<p>` (per element) + a `<ul role="list">` of tiles — a 7rem `border-line
    bg-surface` disc with a 3rem `text-cta` glyph, the number on Heading's `page` step in a `<p>`
    (36px; the reference's ~48px is a Heading step away, recorded), an `<h3>` label, a muted
    sentence — `@md:grid-cols-2 @3xl:grid-cols-4`, one column on the phone (D21); `format` is the
    page's `Intl.NumberFormat(locale).format` (§8.3) — CALLED BY THE BAND ON THE SERVER: a function cannot cross into a client
    island (React refuses to serialize it; the ReviewsCarousel precedent), so `countFrames` runs the
    page's formatter once per step and the island receives 46 finished strings per tile (45 ease-out-
    cubic steps + `format(value)` itself; ~1 kB of flight for four tiles, 293 B gzipped — measured) and
    formats NOTHING — the builder's recorded friction, the band's public API unchanged. The lead and
    each description wear `wrap-anywhere` ON THE ELEMENT: the pseudo-locale's 70-character token laid
    the band 418px wide in a 375px window (measured); in a shrink-to-fit box `break-word` lowers no
    min-content, `anywhere` does. Four NEW glyphs drawn for the run per the
    README checklist (CalendarCheck — the owner's 2026-09-26 replacement for the first PersonCheck draft, "i do not like that one at all" — · People · Trophy · ToothCheck), the owner's to replace. (3)
    **`StatNumber`** (D31), the doctor page's FIRST OWN ISLAND (§16's list amended): the server
    HTML and the first client render print the FINAL value (rule 2); after mount, unless
    `prefersReducedMotion()`, the first ≥ 50 % intersection runs one 1.5 s eased rAF count 0 →
    value, once; the visible span is `aria-hidden`, an `sr-only` twin carries the final value
    throughout — AT never hears the count. The reference's rolling-digit odometer is not ported.
    **Data** (D32): `lib/team` `stats` per doctor (`icon` id · `value` · `suffix?` · five-language
    `{ label, description }`; a digit run in a sentence must equal the row's value; a `courses`
    tile never claims fewer than the rows the page lists — the demo numbers were re-aligned to the
    page: Elena 10+ years beside her „de peste zece ani”, five courses over five rows); the band's
    `team.doctor.stats.{eyebrow,title,lead}` ×5 (eyebrow „În cifre”; title + lead the owner's
    sentences, „Recunoaștere” / „Rezultate predictibile și sigure” flagged TODO(owner) as
    CMSR-sensitive, not rewritten). **Page order** (D33): … DoctorCourses → DoctorStats → [the
    D19 seam] → ClinicLocation.
    **Round 2g (owner, 2026-09-26, five asks; the run ledger's D34–D39):** (1) **THE LINE ON THE LEFT**
    (D34, "now that i think about it, the line should be on the left side, not centered"): the timeline
    keeps ONLY its stacked recipe at every width; the rail capped at `max-w-4xl`. (2) **ONE CURRENT YEAR
    ON SCROLL** (D35, "highlight top dot with year and dots … a single subsection … all are grayed out at
    rest … the current should have a non grayed out jump at you animation"): the doctor page's SECOND
    island, `sections/DoctorCourses/CourseTimeline` (`'use client'`, the rail + groups, strings only), on
    `lib/scroll-spy` — the price menu's mechanic at its second consumer, whose header's NAMED TRIGGER is
    fired: `topFallback: 'none'` ("none yet" while no target has reached its landing line; PriceMenu keeps
    `'first'`, byte-identical). Current = the last year that has reached the pill's landing line
    (`scroll-padding-top` 6rem — "the top dot"); REST = grey (line + dot `bg-line`, the year on
    ui/Heading's NEW additive tone `accent-idle` = bold `ink-muted` — the `accent` tone's rest twin at the
    same weight, so a lit/unlit pair never reflows —, the list `text-ink-muted`); CURRENT = the dot in the
    accent at `scale-125` + a pop, the year in the `accent` tone + a pop, the list in `text-ink` with accent
    markers; colours transition, `motion-reduce` = the colour change alone; `data-current` on the lit group
    only and NEVER in the server HTML (§16 rule 2). Nothing is interactive — no `aria-current`; the h2 →
    h3 → list semantics are the same in every state. (3) **`--animate-pop`** (D36) in globals.css's
    `@theme` — the token layer, not global CSS: 0.7 → 1.25 → 1 over 450 ms on an overshoot curve,
    composing with the dot's `scale-125`. (4) **THE SCHEDULE CARD** (D37, "remove the Program line …
    center it also vertically in the lila section"): `ScheduleCard` drops its `eyebrow` PROP (and
    `team.doctor.schedule.eyebrow` ×5 with it — a prop nobody passes is dead API); the card spans BOTH grid
    rows in column 2 (`row-start-1 row-span-2 self-center`), its middle on the opener + prose block's middle
    = the tinted box's middle; round 2e's "level with the first paragraph" is superseded. (5) **THE OPENER'S
    SEAT HALVED** (D38, "push it a little more upwards … not too much so that at rest it is not covered by
    the top bar"): `lowered` = `@3xl:pt-6` (1.5rem; 3rem was round 2e's "a bit"); the pill is IN FLOW
    above the band, so no seat can sit under it at rest — the worry cannot happen by construction.
    (6) **MORE DEMO ROWS** (D39, "add more examples"): four drafted rows more per doctor in all five
    languages — nine rows over eight years each — and the `courses` tiles say 9 (the round-2f guard: an
    exact count equals the rows).
    **Round 2j (owner, 2026-09-26, later — five builders in parallel, ONE per section, the owner's new
    process rule: "delegate an agent for sections/atoms that apply changes locally. Do not delegate 2
    agents / section/atom"; the run ledger's D42–D47):** (1) the BAND TITLES one step up — ui/Heading gains the
    container-responsive `band` step (30px on a phone column, 36px from the container's `@md`; D48 —
    a fixed 36px would have outranked the h1 on phones), SectionHeading's title step `section` → `band`,
    §15.24 amended, PriceMenu's title and PersonnelCard's level-2 names with it, the ContactModal's
    title the recorded exception; (2) the OPENER HIGHER — DoctorIntro's
    rhythm halved (`py-6 @lg:py-8 @3xl:py-10`), the whole block, picture included, starting right under
    the pill — and the CREDO CARD BIGGER: the words track ⅔ of the row (`[minmax(0,1fr)_minmax(0,2fr)]`),
    the quote `text-xl`, the title at `page`; the two eyebrows („Medic specialist ortodonție", „În
    cuvintele mele") are ONE atom with identical classes — measured equal by the builder, the optical
    difference (a 14px label beside a ~60px name vs beside a 36px title) recorded, nothing changed; (3) the
    TIMELINE: years on `section` (30px), `gap-20`, and the SPOTLIGHT reworked — the one line becomes
    per-group segments (each group's own stretch, `top-2 -bottom-20`, the last `bottom-0`), the current
    group comes forward (`--animate-forward` in `@theme`: scale 1 → 1.06 → 1.04, `origin-left`) with its
    segment, dot, year and list in colour, the others recede (the strongest opacity fade that keeps the
    idle list text ≥ 4.5:1 — the arithmetic in CourseTimeline's header); the mechanic (the spy, the
    pill's landing line, `topFallback: 'none'`, no `data-current` in the server HTML) is unchanged.
    **Round 2k (owner, 2026-09-26, "way better" — six builders in parallel, one per folder; the run
    ledger's D49–D53):** (1) **THE LINE IS THE SCREEN'S CENTRE** (D49): lib/scroll-spy gains `line:
    'landing' | 'middle'` (default `'landing'`, PriceMenu byte-identical) — with `'middle'` a target has
    reached its line when its top passes `innerHeight / 2`; the bottom rule, `topFallback`, the pins and
    the arrival check all use the one line; the timeline passes it, so a year lights as it crosses the
    middle of the screen. (2) **THE STRETCH STOPS SHORT** (D50): each group's stretch ends 0.25rem above
    the next group (`-bottom-19`), 12px of ground above every next dot, so a lit stretch never runs under
    the next subsection's dot — round 2j's seamless rail lasted a round, the owner's choice. (3) **THE
    OPENER** (D51): the picture ~30 % larger (the cap one step up; the band's rhythm unchanged); at `@3xl`
    content-sized tracks centred in the column (`grid-cols-[auto_auto] justify-center`), the words capped
    at 28rem — the credo card ~70 % of its round-2j width and taller by its wrapping; below `@3xl` the
    words block dissolves (`contents`) and the pair climbs above the picture (`-order-1`), the eyebrow
    and the h1 `text-center` per element (§15.15 b) — DOM order unchanged, the decorative picture stays
    first. (4) **BOLD KEYWORDS** (D52): ui/Keyword's `RECIPE` = `font-bold text-ink-strong` — weight AND
    ink; PersonnelCard D9's "ink, not weight" is superseded on the owner's word; the roster's quotes and
    the credo card both show it. (5) **THE SCHEDULE CARD'S ONE WIDTH** (D53): a `20rem` track at `@3xl`,
    `w-full max-w-80 mx-auto` below it.
    **Round 2l (owner, 2026-09-26, the last word of the evening: "push like idk, 20% more down just
    textual part next to image in doctor hero section. i'll adjust if needed"; D54):** the `lowered`
    seat's drop is 7rem (`@3xl:pt-28` — 112px, 20 % of the figure's 555px box at 1280; 17 % at 1536,
    15 % at 1920), only the words column beside the picture moves; one token to dial. And the KEYWORDS
    ITALIC, NOT BOLD (D55, minutes later: "bold is now too bold … with so much thin text the bold stick
    out too much. try italic instead of bold"): ui/Keyword's `RECIPE` = `font-normal italic
    text-ink-strong` — the slant and the darkest ink are the cue, the weight the running text's; the
    bundle ships no italic Source Serif 4, so the slant is browser-synthesized — a true italic face
    (`SourceSerif4Italic-subset.woff2` as a second `src` in `src/fonts/index.ts`) is the owner's call.
    **Round 2m (owner, 2026-09-26, minutes after the italic: "italic looks stupid. i liked more the bold
    before. what about, you use a darker lilla and just a little bold and drop italic. before it was too
    bold"; D56):** a NEW semantic role `--accent-strong` = `#655885` — re-set to **`#4b3a86`** within the hour, round 2n (D57, "a darker accent of lilla. a more seeable one … make it just jump at you more": 8.88:1 on the page, 9.34:1 on white, the keyword now DARKER than the muted quote around it, so lightness joins hue and weight as the cue; the weight stays 600; and, round 2o, the quote's RUNNING TEXT lighter — the owner's "what if you make the faint text lighter": a 19th role `--ink-faint` #766f69, 4.94:1 on the white cards, worn by PersonnelCard's `<blockquote>` and CredoCard's `<p>` alone, the keyword now 1.89:1 off its sentence) — (§15.1: 19 roles) — the lilac that
    clears body text's 4.5:1 (#655885 read 6.07:1 on the page and 6.39:1 on white; the live #4b3a86 reads 8.88:1 and 9.34:1, §15.1 — the two pairs were once run together here, G2-R2 tier 1; the display lilac `accent-decorative`
    is 4.44:1 and keeps its charter) — and ui/Keyword's `RECIPE` = `font-semibold text-accent-strong` — since round 2p `font-[650] text-accent-strong` (D59, then D60 one look later — "remove the underline" — dropping the `underline decoration-1 underline-offset-2` trio D59 had added: "looks better. add just a little more bold and underline them maybe" — 650 sits between the 600 of this round and the 700 the owner called too bold; the underline is the owner's "maybe", recorded with the link-lookalike risk: the site's links are green and not underlined, so the violet, non-interactive underline differs by colour and cursor):
    weight 600, no italic, the keyword set apart by hue and a little weight (1.15:1 against the quote's
    muted ink — not by lightness); the italic road (and its missing face) is history, recorded. (4) **COURSES
    BY YEAR** — "sub-sections … the heading without eyebrow with year … the courses with dot …
    the year headings bold and lilac; maybe they shouldn't even be headings, you decide": NEW
    `sections/DoctorCourses`, a named region (h2 „Cursuri și specializări”) over one group per
    year on `@3xl:grid-cols-2`; THE YEARS ARE `<h3>`s — a year labels the list beneath it, a
    screen reader's H key stops on each, the outline h2 → h3 is honest; a bold `<p>` would look
    the same and mean nothing (D15). `ui/Heading` gains tone `'accent'` = `font-bold
    text-accent-decorative`, additive, elders byte-identical — and BOLD BY CONSTRUCTION: §15.1's
    accent role is for large display text (≥ 3:1), and MEASURED #7a6d9c on `--page` #faf9f7 is
    4.44:1, under body text's 4.5:1, so at the `title` step (20px) the bold weight is what makes
    the text "large" in WCAG's sense (≥ 18.67px bold) and 3:1 the bar (D16). Row-major grid, not
    CSS columns: DOM order = reading order. `year` travels as a STRING label — `Intl.NumberFormat`
    prints „2.024” in Romanian (measured). (5) **lib/team reshaped** (D17): `DoctorWords.about`
    → `philosophy` (the `<k>` quote), NEW `about: readonly string[]` (three paragraphs, drafted
    in all five languages — the RO too, flagged: the owner's sample text was another clinic's and
    was not copied), courses as rows `{ year: number; words: Record<Locale, string> }` (the
    lib/prices row shape: the fact once, five-language words beside it; one extra row per doctor
    so a year shows two bullets) grouped by `coursesByYear` (years descending). (6) **THE FUTURE
    SEAM** (D19, owner: "remember this for the future, very important … links to blog … a new
    section with articles from this doctor … it will sit above map section"): a band of the
    doctor's blog articles goes between the courses and the map — NOT built (the blog is
    unbuilt, §5); a `FUTURE SEAM` comment marks the place in `[slug]/page.tsx`, §14's Doctor
    row and MIGRATION_INVENTORY carry the parked row. (7) **THE ADAPTABILITY RULE** (D21, owner
    rider: "sections that are next to each other when in phone mode … must come one above the
    other"): every side-by-side arrangement flips to one column below the Container's `@3xl`
    step, and every smartphone-pinned story ASSERTS it in a play. **Keys** (D20, drafts ×5):
    `team.doctor.philosophy.{eyebrow,title}` NEW, `about.{eyebrow,title}` reworded (title with
    `{name}`), `schedule.eyebrow` NEW, `schedule.title` „Program”, `courses.*` unchanged, `team.*`
    gone — twelve `team.*` keys in the namespace at D20, eleven of them this lane's; FOURTEEN since rounds 2f/2g (+ `doctor.stats.{eyebrow,title,lead}`, − `doctor.schedule.eyebrow`), thirteen the lane's — the count G2-R2 tier 3 re-took against the five files. **Page order** (D18): DoctorIntro → DoctorProfile → DoctorCourses
    → [seam] → ClinicLocation; the Team page untouched. **Visual:** new Sections/DoctorCourses (5)
    + UI/Heading/AccentTone; changed Sections/DoctorIntro (6), Sections/DoctorProfile (4, `Stacked`
    re-pinned to the phone, `NoCourses` gone), Pages/Doctor (RO + DE × 6); removed
    Sections/DoctorTeam (4). G2 still deferred to the owner's word before the big PR.

    **G2-R2 — the tiered three-persona review over the whole lane (owner, 2026-09-26: "run reviews on all new code, start from small and go to big, so start
    with new atoms and new helping components and stuff and then go to pages"; his "create pr" of the same
    minute withdrawn by his own "did you run the reviews?"):** three Fable personas (react · typescript ·
    a11y-architect, READ-ONLY) per TIER — 1 atoms · lib · tokens · glyphs, 2 shared compositions ·
    sub-components · sections, 3 pages · populator · twins · messages — each tier's findings folded through ONE
    Opus builder per folder before the next tier ran (the owner's process rule; the planner kept globals.css,
    lib data, the pages, the twins, the messages and the docs). Verdicts: nine reports, ZERO CRITICAL / HIGH,
    ONE MEDIUM (tier 1, react: ui/Heading's `'band' JOINED` paragraph put the credo card in the 36px group —
    a card title answers to the card's own `@container`, so „Filozofia mea" reads 30px beside the picture
    and 36px stacked on a tablet: RECORDED, an OPEN OWNER DECISION — accept 30px, a `size` seam on
    SectionHeading (the planner's recommendation), or a words column ≥ 498px), thirty LOW — all folded, none
    a shipped-byte defect except four the review MEASURED: the timeline's recede SNAPPED 1.04 → 1 in one frame
    (the settled size now lives in a static `scale-104` under RELATIVE `--animate-forward` keyframes
    0.9615 → 1.0192 → 1, each state with its own transition list so the entry pops from a drawn 1.00 and the
    exit eases over 300 ms; the lit dot likewise), StatNumber read the motion preference at mount only (now
    again when the count starts), `countFrames` accepted 6.5 / −5 / NaN / −0 (a server-side `RangeError`
    now), and ContactModal's tight state fit with 0 px to spare after §15.24's 30px title (re-measured; the
    tight rail's last gap collapsed → 4 px; a combined width-and-height query rule for the 200 %-zoom phone
    where both queries hold, RO pinned; the German dialog on a DESKTOP at 200 % zoom with classic scrollbars
    still scrolls — KNOWN BOUNDARY, the owner's). Structure: the biography is a named region (six regions on
    the doctor page), the stat tile's `<h3>` precedes its number in the DOM, `STRAY_TAG` is `/i`, the stat-
    icon map lives ONCE in `[slug]/stat-tiles.tsx` for the page and its twin, the populator imports no
    `react` specifier, `PersonnelPhoto` is the roster shapes' type and `Readonly`. Guards added: the
    `--ink-faint` census (its two wearers named WITH their white ground; never on the tint), the pictures'
    intrinsic size read off the PNG/JPEG headers, a D-DASH scan over every shipped team string, the 30-a-second
    count relation, the throw paths through the populator's `list` seam, viewport pins + a heading-level
    census in the page twins, clock-seeking hand-over pins in the timeline's `Current` play. Every stale
    header sentence the reviewers named was reworded (the `dynamicParams` docstring's reason from Next's own
    source: an explicit `true` throws under export). Recorded for later lanes (in `round2/g2/*.md`): SC
    2.4.5, the doctor title identical across ro/en/de, the twins' plays unobserved in the visual net, the
    helper-promotion census, the `hero` clamp under browser zoom, `accent` on the tint at 3.06:1 when the
    logo violet lands.

    **Round 2s (owner, 2026-09-27 — his answers to the review's open decisions, verbatim where it matters):**
    (1) ContactModal's tight state: "i accept this: Accept +4px. Nothing more to do" — the 4 px lever and the
    combined-query rule stand, the German desktop-at-200 %-zoom case stays a KNOWN BOUNDARY. (2) THE SPOKEN
    „PESTE": the stat tile's sr-only twin reads „peste 3.000" / "over 3,000" / „über 3.000" / « plus de 3 000 »
    / « oltre 3.000 » — a NEW page key `team.doctor.stats.atLeast` ×5 (Claude's drafts, flagged) passed to the
    DUMB band as REQUIRED `atLeast`, which composes the spoken string ON THE SERVER per suffixed tile and hands
    the island a finished `spoken` string (never a word in the data list, never one inside the island); the
    visible span keeps „3.000+". (3) THE FRENCH AND ITALIAN „DESPRE" TITLES ("fix or decide for me … a clean
    thing"): decided ARTICLE-FREE — fr « {name} en quelques mots », it « {name} in breve » — because « À propos de
    {name} » needs « du Dr » and « Chi è {name} » needs « la Dott.ssa » / « il Dott. », an article that depends on
    the honorific inside the name and on gender; the new shapes read cleanly for any doctor (drafts, flagged);
    ro/en/de keep „Despre / About / Über {name}". (4) THE CMSR SCAN ("these are very sensible. add a step for
    checking for illegal guarantees or things aiming in that direction"): `tests/unit/cmsr-scan.test.ts` (§13)
    — and the demo copy it refused was REWRITTEN to descriptive copy in five languages, drafts flagged like the
    rest: the band's title „Excelență confirmată în timp" → „Experiență confirmată în timp", its lead (a
    recognition-and-awards sentence) → „Cifrele de mai jos spun, pe scurt, cum lucrăm: …", the tiles
    „Intervenții reușite" → „Intervenții", „Rezultate predictibile și sigure, obținute prin …" → „Atenție la
    detalii, tehnologii moderne și o abordare personalizată pentru fiecare pacient.", „Recunoaștere pentru
    inovație, calitate și grijă autentică." → „Formare continuă în tehnici și tehnologii moderne."; the originals
    are in the run ledger for the owner. (5) The four stat glyphs STAY ("they are good"). (6) SC 2.4.5: a
    **doctors dropdown in the navigation** recorded as the future option (§15.15's third-overlay candidate),
    not built. (7) The doctor page's tab title with the specialty → the SEO lane (PHASE4_SEO_PLAN.md §4).
    (8) The credo card's h2 at 30 px beside the picture (tier-1 react F1), ACCEPTED ("idk i feel like it
    looks good now"): the rule is recorded in §15.24 — a title INSIDE A CARD reads one step under a band
    title, because the `band` step answers to the card's own `@container`.

    **Round 3 — THE REAL DOCTORS (owner, 2026-09-30, verbatim: "these are non fictopnal and need to make
    up the actual list of doctors from the clinic, not dummy ones as so far" · "so i need pages for each and
    to have them as doctor cards" · "what you do not have info yet, generate random"; lane
    `feat/real-doctors`):** `lib/team`'s two demo doctors are replaced by the clinic's SIX, in the owner's
    order — Malea (Sabău) Oana Bianca (protetică dentară și parodontologie), Toma Lucian (protetică dentară,
    specializat în endodonție microscopică), Nicu Elena Alina (parodontologie), Ivașcu-Zugravu Cătălina
    (ortodonție și ortopedie facială, his words; the specialty's official name „… dento-facială" is
    flagged), Opriș Mircea and Bozdog Horațiu (chirurgie dento-alveolară) — so the Team page prints six cards
    and the export writes thirty doctor pages, with no code change (`generateStaticParams` maps the list).
    The NAMES and SPECIALTIES are the owner's; the diacritics added to Ivașcu, Cătălina, Opriș and Horațiu
    are Claude's and flagged. EVERYTHING ELSE is a random placeholder on his word — the pictures (the demo
    silhouettes, in list order), the weeks (inside the clinic's real Monday to Friday, 09:00 to 19:00), the
    courses, the stats, the quotes and the biographies in all five languages — written to read as nobody's
    facts: no university, society, congress or hobby is named, each third paragraph is practical advice for
    patients, and every number agrees with its own rows. NOBODY IS GENDERED (the owner gave no pronouns):
    no pronoun for a doctor in any language, „Dr." in Italian too, German positions as „Fachrichtung …" —
    the gendered forms wait for the owner's word per doctor. The URL ids are the names in the owner's order,
    ASCII (`malea-sabau-oana-bianca`, `toma-lucian`, `nicu-elena-alina`, `ivascu-zugravu-catalina`,
    `opris-mircea`, `bozdog-horatiu`), free to change until launch (§5's redirect rule after). The three
    auxiliaries stay demo. lib/team's header TODO(owner) block is the detailed record. Combined with the
    doctor-showcase lane's mount, six doctors fire §15.26's WAIT trigger (six stretches due at once draw
    for ≈ 5.96 s, over SC 2.2.2's 5 s); that lane records it as ARMED.

    **Round 3's red check and the re-review (the same day; the owner: "checks are failing. i reset fable, go
    forward with fable and rereview work here with fablke" — `/debug-deep`, then three Fable reviewers:
    typescript · a11y · a five-language copy read):** CI failed on ONE test, Pages/Team › German, timed out at
    15 s. ROOT CAUSE, proven by experiment: the twin's `settled` awaited `img.decode()` on every picture; the
    portraits are lazy, and with six doctors the German phone frame is 7087px tall, so four portraits lie
    beyond Chromium's lazy-loading distance (MEASURED ≈ 3000px), are never requested, and their `decode()`
    never settles. It hid on the workstation because Romanian runs first in the same browser page and warms
    the memory cache with the same picture URLs; CI's Vitest step runs before the image optimizer, so those
    URLs answer 404 there and nothing is cached — run the German story ALONE and it hangs locally too. FIXED
    at the helper: every picture is flipped to `eager` first (HTML's lazy-load resumption — no scroll, no
    timer; React never writes the attribute back), then `complete` is polled under a 5 s timeout that names
    the stuck picture; no unbounded `decode()`. The Doctor twin's copy carries a pointer (its one picture is
    eager), and the three copies of the settle helper (Pages/Team · Pages/Doctor · Sections/DoctorIntro) join
    the §15.19 round-3 helper-promotion census. THE REHEARSAL every lane owes before a seal: hide
    `public/images/**/nextImageExportOptimizer/` and run the full Vitest — CI's exact condition (the
    six-doctor showcase lane, PR #117, met the same hang and took the same shape). RECORDED, not built:
    `tests/visual/stories.spec.ts` waits for fonts only before its full-page screenshot, so on a page taller
    than the lazy distance a far picture is photographed unrequested — invisible with today's shared demo
    files (a nearer card's copy paints it), a blur placeholder the day each doctor has an own photograph; the
    twin's flip covers Pages/Team, a spec-level "ask for every picture" step is the owner's call.
    **The reviews' folds:** (1) THE NAME IS NEVER SPLIT — the biography band's „Despre {name}" `<h2>`
    inherited the site-wide `hyphens: auto` and broke real names at a syllable on phones („Despre Dr. Malea
    (Sa-bău) Oana Bianca" at 390 ro/de, „Ele-na" at 360, „Hora-țiu" / „Cătă-lina" in fr/it — measured with
    `Range.getClientRects` on the built pages): `sections/DoctorProfile` passes `hyphens-none` to that one
    SectionHeading (the property inherits to the h2; the schedule title beside it keeps `auto` on purpose), a
    test pins the class and its scope, the Doctor twin pins the COMPUTED value. The other band titles still
    hyphenate ordinary words („confir-mată", „un-sere", „gă-siți" at 320–430) — §15.14 as written; turning it
    off for headings site-wide is the owner's call. (2) THE COPY — 3 high / 17 medium / 16 low, folded: no
    year of joining the clinic (a checkable employment fact about a real person), no city on a residency row
    (a residency plus a city names a university), nothing a first paragraph offers that lib/prices does not
    (aligners, removable appliances and ceramic veneers are NOT on the tariff — fixed braces and zirconia
    restorations are), fr/it positions „Spécialiste en …" / „Specialista in …" (a dentist is not a
    « médecin » / „medico" there; epicene too, so the one gendered participle is gone), Italian paragraphs on
    a null subject, German gapped passives made active with „Dr. X" as subject, the German „faziale
    Orthopädie" struck (Kieferorthopädie IS the specialty), „Formarea continuă include …" (the garden path),
    an inverted causality in Bozdog's quote, „DVT" glossed, English „periodontics" as the tariff says, the
    one foreign course city gone. (3) THE DATA TEST gains two rules: every doctor's week inside
    `clinic.hours` (never a patient at a closed door), and the numbers of every `about` paragraph equal
    across the five languages — the second refused the German „3D-Aufnahme" gloss before it shipped.
    **Visual:** every Pages/Team and Pages/Doctor frame changes (six cards, thirty pages);
    Sections/DoctorProfile's `pseudo-locale` at 390 by one line break; the darwin record is the owner's
    (§15.7). **THE OWNER'S CALLS, recorded and not built:** the invented WEEKLY HOURS and numbers under real
    names (all three reviewers: a patient could act on „Thursday: closed" — recommended: the clinic's own
    week for all six until each doctor's is known, one line per doctor or `hours: clinic.hours`); a release
    gate for placeholders (the repository is public, and a develop → main promotion would publish invented
    quotes and CVs under real names on the interim host — nothing mechanical stops it; a test that refuses a
    production build while lib/team is flagged placeholder is the shape); the specialty eyebrow's lead-in
    („Medic specialist în" is a full line at 320 — Toma's takes five); „Închis" for a doctor's day off (reads
    as the clinic shut); heading hyphenation site-wide; name order abroad; „Dr." in German implying a
    doctorate; French typography (a no-break space before « : », site-wide, fr.json included); the clinic
    routines the third paragraphs state (written aftercare instructions, check-ups booked from the start).

24. **Heading scale, app-wide — DECIDED 2026-09-26 (owner, verbatim: "i need all headings and
    eyebrows app wide to be made the same size as they are on the
    http://localhost:3000/ro/team/elena-marin/ page"):** ONE size per outline level, the doctor
    page's — `<h1>` = ui/Heading `hero` (the fluid `clamp(2rem, 1rem + 3.5vw, 4.5rem)`; sections/Hero
    and DoctorIntro already wore it — TeamRoster's „Echipa noastră” and the 404 page's h1 leave the
    `page` step), `<h2>` = **`band`** (a NEW container-responsive step, `font-display text-3xl @md:text-4xl`: 30px on
    a column narrower than the container's 28rem step — every phone column, the 320px schedule card —
    and 36px from it — the same day's round 2j, the owner on the band titles: "bring those headings to
    the next order of heading height … i do not want them so large [as the h1], but larger definitely";
    a fixed 36px would have outranked the h1 on phones, where `hero` bottoms out at 32px — the residual
    448px-column-to-571px-viewport window where the h2 may still exceed the h1 by up to 4px is accepted
    and recorded, D48): sections/SectionHeading's title step moved `section` → `band`, so every band and
    card opener follows — Home's two, the doctor page's five, Services' eleven categories, the stats
    band, the schedule and credo cards — and PriceMenu's „Categorii" and PersonnelCard's name at
    `headingLevel` 2 with it; the ONE exception is the ContactModal's title at `section`, 30px — a 32rem
    dialog is not a page, and a third title line would cost its tight-viewport states; the planner's
    call, the owner's to overrule — which that morning had left the Or-word's 27px dress, the ornament
    keeping 27px as its one consumer, Heading's third-step promotion disarmed), `<h3>` = `title`
    (text-xl, 20px: review titles, the modal's channel titles, the stat labels) with ONE exception, the
    timeline's years on `section` (30px — round 2j, the owner: "at least the size of what is now
    Cursuri și specializări"; an h3 one step under the band's h2 wherever the column is wide enough),
    eyebrows = ui/Eyebrow's one step (`font-mono text-sm font-medium tracking-widest uppercase` —
    unchanged everywhere). MEASURED on the dev server before the change (h1 · h2 · h3 · eyebrow):
    Home sr-only · 30 · 20 · 14; Services sr-only · 30 · 20 · 14; Team **36** · **20** (the card names)
    · 20 · 14; Doctor hero · 30 · 20 · 14; 404 **36**; the ContactModal on every page **27** · 20. The
    `page` step (36px) stays on the axis for its non-heading consumer, DoctorStats' numbers.
    PersonnelCard's name step now FOLLOWS ITS LEVEL (`band` at 2 since round 2j, `title` at 3): a card
    reads its size from the outline it sits in, never from the card. *(Amended 2026-09-30, §15.25: that is
    the AUXILIARY tile's rule. A DOCTOR's name wears `band` at BOTH levels — the look the owner approved
    live on the card — so in the doctors band it is an `<h3>` at the band title's own step, 36px from a
    28rem inset and 30px on a phone: there the level is the outline's and the size is the card's. One
    cell of PersonnelCard's `NAME_STEP` table moves it back. The Team page's own `<h1>` left the `hero`
    step the same day: it is `sr-only` now, the doctors band's `<h2>` being the visible opener.)* **A TITLE INSIDE A CARD READS ONE STEP
    UNDER A BAND TITLE (owner, 2026-09-27, accepting G2-R2 tier 1's react F1):** the `band` step answers to the
    nearest `@container`, and ui/Card is one, with 25px of border + padding per side, so a card title reaches
    36px only on a card at least 498px wide — the credo card (448px beside the picture), the 20rem schedule
    card and the price menu's „Categorii" all read 30px on a laptop, a smaller thing inside a band; the credo
    card reads 36px only where it stacks full-width on a tablet (the recorded inversion, D48). Not a defect,
    the rule; the arithmetic lives in Heading.tsx's `'band' JOINED` paragraph. Visual: Pages/Team, Sections/TeamRoster (the
    cards at level 2), Pages/NotFound and Sections/ContactModal's open frames change; Sections/
    PersonnelCard's own stories (default level 3) do not; the darwin re-record is the owner's (§15.7).

25. **Doctor-showcase run — BUILT ON THE OWNER'S DISPATCH (2026-09-30; lane `rework/doctor-showcase`; no epic
    issue and no contract board — the card was approved LIVE on Storybook stories; the seal word, verbatim:
    "create pr once also ribbon visual bug is done"):** the doctor card reworked a third time, a NEW band that
    shows the doctors on Home and on the Team page, and THE FLOSS RIBBON'S FIRST MOUNT (item 26).
    **How it came about, in the owner's words, in order:** "i want to refactor the doctor card … it has a
    section specially for buttons. that will disappear. i will keep only 1 button of the two" — three layouts
    as stories under the ribbon ("i want all 3 options as stories") — "i am leaning hard towards option 3,
    but button will stuck in a separate section at bottom of card below text. discard other other options" —
    "i forgot to mention i want dr name and specialization also sticky to bot of card next to the button" —
    "i do not want to use this button. i want the button that was befroe vezi servicii" — "yes but i want it
    to be named more about me, be wider and take you to adjacent dr page" — its width: "maybe make it as
    wide as the text box", "it's too wide now though", and at 28rem "button width is now perfect" — the
    picture: "it will be a taller image, about as wide as [the name and the specialty] … it will contain no
    background. it will contain the doctor from the waist up" — the dispatch: "ok. make this the official
    dr card under personell card and i'll keep working on it. integrate it in the page and crete it as a
    section in the home page and in the personell page with heading and eyebrow smth in the direction of
    specialistii cu care ne mandrim familia premium smile" — and, before the seal: "i want to use for this
    card the border of the non current review from the review carrousel". The two-section card of 2026-09-29
    (lane `rework/doctor-card-layout`, its "D16", never merged) is SUPERSEDED; its 40 / 60 split and its
    phone order are carried here.
    **The card (`sections/PersonnelCard`, its D17 and D18 — the DOCTOR kind only; the auxiliary tile is
    byte-identical):** ONE link — `profile: { href, label }`, REQUIRED; `actions` and its type are gone, a
    §6.6 breaking change with every usage moved in the same commit — on the old services button's solid `lg`
    face, to the doctor's OWN page, named „Mai multe despre mine Dr. Elena Marin" in a links list
    (`aria-labelledby`, the visible label leading — SC 2.5.3). The picture is the doctor page's transparent
    CUTOUT (`ui/Image` `artwork`, an 18rem cell), no longer the framed portrait. From the card's `@3xl` a
    40 / 60 grid: the cutout ‖ the justified quote on row 1, name + specialty ‖ the button on row 2 — the
    picture on its row's floor, so the waist stays 12px above the name however long the words run; the button
    as wide as the words up to 28rem. Below the step: specialty → name → picture → words → button, BY PAINT
    ALONE (`flex-col-reverse`; the DOM keeps who → what they say → what you can do and no control moves —
    SC 1.3.2, 2.4.3). The name wears `band` at both heading levels (item 24's amendment). The root is ui/Card
    `framed`, the reviews deck's idle frame: 3px + 22px, the same 25px as `surface`'s 1px + 24px, so no box
    moved when the frame arrived. MEASURED at a 1280 window (Pages/Team, the page's story twin): card
    1009 × 551.6px, picture 288 × 384, 12.0px down to the name, the name's and the button's centres 0.0px
    apart, the button 448 × 56, the name an `<h3>` at 36px.
    **The seam to the ribbon, without touching ui/Card** (item 26's first "owed at the mount"): the doctor
    card's one child is THE INSET — its own `@container`, padded `max(0px, lane − 1.5rem)` on top and on
    either side — so inside a ribbon the card's inset is the lane to the pixel, and outside one it is Card's
    own (the lanes' registered initial value is 24px; an engine without `@property` reads the fallback). The
    grid's `@3xl` and the name's `band` therefore measure the box the grid really has. Four LITERAL markers:
    `data-ribbon-keepout` on the name pair, the quote and the button, `data-ribbon-keepout="portrait"` on the
    picture's cell. THE HUG RULE, found by the owner's own eye: a keep-out is what is painted, so a marked
    box must HUG its words — the name pair, stretched across its grid column, marked empty space as a
    keep-out and the side wave turned a corner against it, the "rectangle" he reported; the pair is
    `justify-self-center` now, and the model's own corner was removed the same evening by PR #114 (item 26's
    Round 2), on which this lane is rebased.
    **The band (NEW `sections/DoctorShowcase`, its D1–D9):** DUMB props-in — `eyebrow`, `title`, `doctors`,
    `firstScreen?`; zero keys, zero data (the PriceList / Hero shape) — a `<section>` named by its own `<h2>`
    over `<Ribbon role="list">` with one `<RibbonStation role="listitem">` per doctor holding ONE card
    (`headingLevel={3}`), sides alternating by index. A SERVER component: `ui/Ribbon` is its one island and
    the cards pass THROUGH it as children (§16). Its rhythm is the band top alone — the ribbon's own head and
    tail room are the rest of its air. Empty renders nothing.
    **THE MOUNT — item 26's six owed items, where each landed:** the lanes → THE INSET above · the list
    route → route B, roles on the ribbon and on wrapper stations (SC 1.3.1) · the `asChild` probe → settled
    by reading the built page: a station's child reaches the client as a Flight lazy reference, which
    `slotClone`'s `isValidElement` guard would throw on, so route A is UNSAFE across the server-to-client
    boundary, not merely gainless (G2 react), and route B clones nothing · forced colours and print →
    `tests/e2e/doctor-showcase.spec.ts` on the built export · the 21-character ceiling → **17** for a
    doctor's position (below) · the census → PersonnelCard.test.tsx, every word of a doctor card inside a
    keep-out and none inside the portrait's.
    **The pages:** TEAM = an `sr-only` `<h1>` „Echipa noastră" in the page's own markup (the Services
    precedent; the visible opener is the band's eyebrow and `<h2>`) → DoctorShowcase (`firstScreen`) →
    `sections/TeamRoster`, REWORKED to the auxiliary tiles alone (`{ members }`, `<h2>` names) →
    ClinicLocation; the outline reads 1 · 2 · one 3 per doctor · one 2 per tile · 2. HOME = Hero →
    DoctorShowcase → ClinicLocation → ReviewsCarousel. `app/[locale]/team/populate.ts` stays the ONE
    populator (`populateDoctorShowcase`, `populateTeamRoster`), imported by both pages and by their story
    twins.
    **Words:** `team.showcase.{eyebrow,title,profile}` ×5 — RO „Familia Premium Smile" / „Specialiștii cu
    care ne mândrim" / „Mai multe despre mine", the owner's direction; EN/DE/FR/IT are Claude's DRAFTS,
    flagged (§15.17) — and `team.roster.{services,profile}` ×5 removed: sixteen `team.*` keys. The CMSR scan
    (§13) passes on all five.
    **Also in the lane:** `ui/Button`'s base row gains `text-center` — a label that WRAPS was start-aligned
    inside a centred box (the card's button on a 320px phone showed it); no single-line button moves, and
    the labels that already wrapped re-centre (the manifest's Button, Hero and Home cells). `lib/team` LOSES
    `Doctor.portrait` and `Doctor.servicesCategory`, their data and their checks — neither had a reader once
    the card wore the cutout and lost the services link (the owner's standing "i want no dead code");
    `servicesCategory` returns the day a link to a doctor's prices does.
    **Measured on the BUILT export:** (1) THE RIBBON draws at every window width from 2560 down to 320 on
    `/ro/team/`, `/de/team/`, `/ro/` and `/de/` — Chromium every 8px, WebKit every 16px — with no sideways
    scroll; two columns down to a 1136px window (1120 in WebKit), stacked below. The static HTML carries no
    canvas. And at SIX cards, the size of the clinic's real roster (item 26 had recorded "more than three
    doctors" as not tested): the band's `SixDoctors` story, swept over the same widths in both engines —
    six stations, the ribbon painted, never sideways; 4.7 million canvas pixels in all at a 1280 window and
    1.6 million on a phone, before the device's pixel ratio. (2) THE LARGEST PAINT on the Team page IS the first doctor's cutout — at 390, 1280, 1366 × 633
    and 1920 — and it shipped lazy; `firstScreen` (the band's D9) now makes the band preload that ONE picture
    at high priority (`preload` on the card, its D18 → ui/Image; a preload link in `<head>`). On Home the
    largest paint is the hero and the first cutout sits near y = 1100, so the band stays lazy there. (3) THE
    LINE INSIDE THE LANES: at the 320px window (a 241px column under the classic scrollbar gutter) the name
    block has 174.5px where the plain card had 206px. The mono eyebrow advances 9.8px a character — 17 fit,
    18 do not — so `tests/unit/team-data.test.ts` holds a DOCTOR's position to 17 unbreakable characters (an
    auxiliary keeps 21). WHAT A LONGER WORD COSTS, measured rather than assumed: the block grows past its
    line, the ribbon's guard finds words in its lane and WITHHOLDS THE WHOLE RIBBON at that window; the
    page does not scroll sideways and no word is lost. A 12-letter surname still leaves the ribbon drawn at
    320; a 14-letter one („Constantinescu") withholds it under ~345px and draws from 360. A NAME gets no
    ceiling — a person cannot be renamed; the lever is the name's step on a narrow card (`NAME_STEP`).
    **Reviews (G2 — react-reviewer, typescript-reviewer and a11y-architect on Fable, over the lane rebased on
    PR #114; a first round on Fable and a second on Opus were both cut short by interruptions, and the
    owner's word for the third was "keep going with fable reviewers and fable development"):** three times
    APPROVE WITH CHANGES — 0 critical, 0 high, 5 medium, 19 low. THE MEDIUMS, folded: (react) NOTHING A GATE
    RUNS PINNED THE REAL PAGES — a story twin re-spells its page by hand, and its plays pin the twin: NEW
    `src/app/[locale]/page-twins.test.ts` reads both pages and both twins as SOURCE and holds their bands,
    in order, and the doctors band's props equal (dropping `firstScreen` from the Team page, or adding it
    on Home, each turns one test red — tried) · (typescript) THE STAFF BAND COULD STILL BE NAMED: TypeScript
    exempts a hyphenated attribute written in JSX from its excess-property check, so the Omit alone refused
    nothing and `<TeamRoster aria-label="…">` rendered a named region — the section now resets the three
    naming attributes after the spread · the card's stories left a `kind` radio that crashed the Default
    story (it is no control now) · a test fixture still carried the removed `portrait`, hidden by the
    directive above it · (a11y, plausible, SC 1.4.8 — AAA) the justified quote on Android, recorded under
    the owner's calls. THE LOWS, folded: always-true "tombstone" pins removed and three type pins made to
    fail for their stated reason · the `TeamComposition` story deleted (no band stacks that shape) · the
    ContactModal's two call-site `text-center` classes removed, the atom's now · the kind split made
    total (`satisfies`) · plays for the picture's floor and for the name over the specialty · the
    spread-first belt tested on the band and on the card · stale comments corrected across the lane and
    in the neighbours that named the old "roster card" or promised this mount (§17.7) · the
    e2e asserting a clean hydration and exactly ONE preload link with the picture's own `sizes`.
    **A CI-ONLY HANG, found by the real-doctors lane's CI and reproduced here in a REHEARSAL OF CI** (the
    optimized image variants hidden, as they are when `ci.yml` runs Vitest before any build): a play that
    awaits `decode()` on a LAZY picture more than 3 000px below the window waits forever — `SixDoctors`
    timed out. `settled()` in the band's stories and in both page twins now asks every picture to load
    first (`loading = 'eager'`, HTML's own resumption of a deferred load), and what a play asserts about
    how a picture ships is read before it.
    **Measured for the accessibility review's plausible items:** Chromium's accessibility tree exposes the
    ribbon as a `list` with one `listitem` per doctor (the role-less column box is pruned) · Chromium and
    WebKit on macOS both hyphenate Romanian · forced colours leave the link with no border and no shadow.
    **Recorded, not built:** the ribbon sizes one canvas per card at MOUNT, also on Home, where the band
    starts below the first screen (nominally 8–29 MB of backing store for two cards at 2–3× density) —
    lazy canvas creation belongs in `lib/ribbon-draw`, beside the SC 2.2.2 cap · `ui/Image` threads no
    base path, so on the interim Pages host the new preload targets a 404 like every optimized image
    there (the debt Wordmark.tsx and Footer.tsx record) · the e2e suite runs in no workflow and no hook ·
    `lib/team`'s `findAuxiliary` has no caller but its own test (older than the lane; left to the
    real-doctors lane, which is rewriting that file) · ui/Ribbon's stand-in column still imitates the
    parked two-button card (re-dressing it re-records the atom's eight cells).
    **Evidence at READY:** see the lane's PR. **Visual (measured at ZERO tolerance against a fresh build of
    develop 198709a, the ribbon fix in — 441 cells):** 39 existing cells change — Pages/Home RO + DE at all
    six widths (the band under the hero; the page grows by 1 500–2 000px) · Pages/Team RO + DE at all six
    (the band, the frame, the staff tiles alone) · Sections/PersonnelCard's four doctor stories at 390 and
    1536, two of them at 320 too, while every auxiliary story is byte-identical · Sections/TeamRoster's two
    stories at 320 / 390 / 1536 · Sections/Hero's German Stress at 320, the wrapped button label centred —
    the ONE Button-side cell the net sees (UI/Button's own 320 stress cells do not move). 13 NEW cells:
    Sections/DoctorShowcase's six stories at 390 + 1536, Narrowest at 320 as well. 9 cells REMOVED:
    TeamRoster's `doctors-only`, `members-only` and `pseudo-locale`, PersonnelCard's `TeamComposition`.
    Everything else identical, bar the known flicker of PriceList's glow, the language dial and
    SpeedDial's discs (1–9 px, a different cell on every shoot — three re-shoots). NO darwin baseline is
    committed: the re-record is the owner's, on the owner's machine (§15.7) — the committed Pages/Home,
    Pages/Team and PersonnelCard doctor baselines are stale from this merge on, and TeamRoster and
    DoctorShowcase have none.
    **The owner's calls, recorded — each a lever, none built:** the Team page's visible „Echipa noastră"
    (hidden in favour of the band's own opener; one class brings it back) · the band's place on Home (right
    under the hero) · the doctor's name at the band title's own 36px · the four drafted languages · the link
    to a doctor's PRICES, gone with „Vezi serviciile" (the doctor's own page could carry it) · SC 2.4.5
    (item 23) stands: the card's button is still the only way to a doctor page · the staff tiles keep the
    thin `surface` edge while the doctor cards wear the frame · the superseded `rework/doctor-card-layout`
    worktree, to discard on the owner's word · **item 26's SC 2.2.2 WAIT trigger has FIRED:** it fires
    at FIVE doctors, and PR #115 (the clinic's six real doctors, §15.23 round 3) merged into develop the
    same evening and was taken into this lane (the owner: "bring it here too and adapt") — so six stations
    stand under the ribbon on Home and on Team, and due at once (a visitor who jumps to the page's end
    with every card still waiting) six stretches draw for 2 s × Σ 1/(1 + 0.6 j), j = 0 … 5 ≈ 5.96 s, past
    the criterion's 5 s; the bound belongs in `lib/ribbon-draw` (its queue and its pen — item 26's D2
    names the two shapes: a cap on the whole queue's time, or finishing at once a card that is off
    screen when its turn comes), NOT built in this lane, and which lane builds it and which shape is the
    owner's call · the same six under the hero lengthen Home by roughly 4 000px of cards before the map
    (a lever: the band's place, or fewer doctors on Home) · **from the
    accessibility review, none a WCAG AA failure:** THE JUSTIFIED QUOTE ON ANDROID — `hyphens: auto` needs
    a dictionary for the language; Chromium and WebKit on macOS hyphenate Romanian (measured), while
    Chromium's own pattern set (Android, Windows, Linux) is believed to carry none, so a phone's justified
    lines — 226px at 390 inside the lanes — may show wide word gaps there: NOT verifiable on this
    workstation, the owner's to look at on an Android phone; the lever is `@md:text-justify` (start-aligned
    on a narrow card) · THE STAFF TILES HAVE NO GROUP LABEL, and from a ~670px window the doctors' level-3
    names (36px) outrank the staff's level-2 names (30px); a heading over the tiles needs one string ×5 ·
    IN FORCED COLOURS the card's one button loses its face (measured: no border, no shadow — link-coloured
    text; the card keeps its 3px border): item 23's parked ui/Button follow-up, `forced-colors:border`,
    now on the only way to a doctor page · a WRAPPED `lg` label fills the button's 56px exactly (two
    28px lines), a small `py` is the look's lever · one LISTEN is owed on iOS VoiceOver — the list
    ("list, N items"; Chromium's tree exposes exactly that, measured) and the phone's reading order.

26. **Floss-ribbon run — DECIDED (owner, consult board `.claude/plans/ribbon-3d.plan.md`, five rounds on
    2026-09-29, fb-489 … fb-513; contract board `.claude/plans/ribbon-floss.plan.md`, approved in the chat
    on 2026-09-30, verbatim: "you run the reviewers now. if you useless, discard. i want no dead code. a the
    ribbon alone and i approve everything else"; item 25 is the doctor-showcase lane's, which MOUNTS it):** a
    DECORATIVE ribbon that wraps a column of cards — down into each card's top corner, round its edge, along
    the top lane as a calm wave, behind the card, back round the opposite edge, down the side lane to the next
    card, which it wraps mirrored — painted on ordinary 2D canvases and DRAWN LIVE, card by card, as the visitor
    scrolls. It began as the owner's own design package (a verified mathematical model, pasted 2026-09-29) and
    REPLACES the straight connector of 2026-09-25 (lane `feat/ui-ribbon`, never committed), of which it keeps
    the two colours and the two component names.
    **The look, each decision in the owner's words:** the thickness is a RATIO of the card ("absolutely
    perfect … exact thickness and prominence … the same on every device as ratio", fb-489) and the ribbon has
    NO LOOPS (the same annotation) · the hook sits lower ("place it lower a bit. like 100% lower", fb-492) ·
    the entry sways ("must also be superficially waive, so not a straight line, make it a little wayvy",
    fb-494) · the phone is BOLDER ("b all day here, looks way better", fb-501) · the tail "ends in the air all
    day" (fb-504; the planner's tucked tail was rejected) · ONE look ("looks perfect now, I do not need
    alternatives or rebuilds", fb-505) · NO DOT on the ribbon (fb-475, the connector's board) · colours
    `--ribbon-light` `#8377a3` and `--ribbon-dark` `#2d263c`, both from the old site's palette, raw tokens
    with NO utility name (nothing paints with a class; the painter reads them) — ONE colour since round 2,
    below: `--ribbon` `#8377a3`, and `--ribbon-shadow` `#2d263c` for the shadow alone.
    **The motion (fb-502, fb-503, fb-507):** "drawn while scrolling but remains drawn" — a card's stretch is
    drawn when "the fixxed center line of the screen" reaches "the center line of the card", in order, and it
    stays drawn: no undoing on the way up, no pinning, the page's scroll never touched (source-fenced by
    `tests/unit/ribbon-never-moves-the-page.test.ts`, the listener `passive`); "it's a core feature, it's
    crucial it works" on "absolutely every browser from phone to desktop"; reduced motion paints the whole
    ribbon at once, also when it is switched on mid-visit. One stretch takes two seconds. Two additions of the
    planner's, agreed (fb-509): a card taller than about THREE QUARTERS of the screen (76 % — the planner's
    words to the owner were "taller than the screen", which was imprecise) starts when its top is 12 % under
    the screen's top; and at the page's END every card still waiting becomes due, in order — on a page that
    cannot scroll, at load. Two behaviours came with the prototype the owner approved by feel (fb-511, "moves
    good"): the pen HURRIES when cards wait (1.25 s a card with one waiting, 0.91 s with two), and a card
    already above the screen at load is simply there. **SC 2.2.2 (Level A), by arithmetic and pinned:** one
    stretch never repeats and nothing moves afterwards; n cards due at once draw for 2 s × Σ 1/(1 + 0.6 j) —
    3.25 s for two (the roster today), 4.87 s for four, 5.46 s for FIVE.
    **The painter (fb-496 → fb-508 "ok"):** the ordinary 2D canvas. The consult's first two candidates were
    WebGL (hand-written, and three.js at 149.6 kB gzip); the owner's every-browser condition reopened the
    question, and without loops the ribbon never crosses itself on screen and hides only behind a box, so
    "behind" is a plane test, not a depth buffer. **No dependency is added; §3 is unchanged.** Neighbouring
    quads join by ADDITIVE blending (`'lighter'`), which is what removes the hairlines a 2D canvas otherwise
    leaves between anti-aliased neighbours. MEASURED on the built component against the approved prototype
    (the 1009 px column, both painted at once): ink 59,818 px against 59,825 (0.012 % apart), colour within
    one level in 255 for 97.8 % of pixels and within two for 99.96 %.
    **The gauge (fb-510 "agree"):** `k = max(0.0793 W, 0.192 + 0.0602 W)` in card units (1 unit = 100 CSS px,
    `W` the card's width) — the desktop's approved ratio above the knee, one straight line down to the bolder
    phone below it, no breakpoint; what follows from it: thickness `T = 0.5 k`, wavelength
    `l = 2.3 (0.8 / k)^0.6`, and the LANES the ribbon runs in — top `max(24, 62 k + 8)` px, side
    `max(24, 60 k + 12, 83 k + 1)` px, the gap between cards `100 k + 60` px. The rule was MEASURED DURING
    THE CONSULT on the prototype over the doctor-card lane's real card (164 layouts, 320 … 1920, RO + DE,
    short and long quotes; every pixel of card width 900 … 1600) — not a test of this repository. THE
    REPOSITORY'S PIN is the stand-in column swept from 241 to 2145 px (the widest `ui/Container` gives, at a
    2560 window), every 8 px, RO + DE, short and long quotes. The lanes are px and `cqw` ON PURPOSE, an
    exception to §7's "all sizing in rem": the ribbon follows the COLUMN's width, not the text's size; only
    their `1.5rem` floor follows the font.
    **No Python, anywhere (fb-506, fb-507):** "I do not want any python in this project. I want it to be just
    js/ts etc". The package's Python was for modelling; it never enters the repository, in any folder.
    **No dead code (the approval's own sentence):** nothing the approved design does not use is ported — not
    the package's unused wave drifts and their phases, not the loop-era segments, not the tail option — and
    the earlier connector's nine uncommitted paths were DISCARDED on the same word (2026-09-30: seven tracked
    files restored, two folders removed, in the main checkout). The reviews applied the same rule to the
    build itself: a clip for what is behind the card (never visible), a refusal that could not fire, the
    ring's construct / start / restart shape (no caller), an unread attribute on the root, two registrations
    that changed nothing, a baseline that repeated another's pixels.
    **Order (fb-500) and scope ("a the ribbon alone"):** the RIBBON FIRST, the doctor card's rework after it —
    the reverse of the planner's recommendation. This lane ships the ribbon as machinery with its own stories
    over a stand-in column (`Ribbon.fixtures.tsx` — a story fixture, the first of its kind beside an atom) and
    MOUNTS IT NOWHERE; the Team page gains it in the card's lane. §14 and §16 are therefore unchanged: §16's
    island list gains `ui/Ribbon` in the lane that mounts it.
    **The machinery — five pieces:** `lib/ribbon-model` (the mathematics: the path as a chain of segments by
    arc length, the gauge rule, the lanes, the clearance measure; SIX FROZEN REFERENCE CARDS written out by
    the approved prototype, reproduced to 1e-9 — the side waves of four re-written from the module in
    round 2, below) · `lib/ribbon-layout` (the page → numbers, blocks found by MARKERS, never by their place
    in the markup) · `lib/ribbon-paint` (numbers → pixels) · `lib/ribbon-draw`
    (when: the owner's rule, the queue, the pen, reduced motion, a new geometry; `startRibbonDraw(layer)` →
    `{ dispose, getSnapshot }` — one call starts it, one function stops it, and NOT the ring's construct /
    start / dispose protocol: nothing is built before the effect and nothing renders from it) · `ui/Ribbon`
    (`Ribbon` + `RibbonStation`, `'use client'`, NO props beyond children, the native ones and `asChild` on
    the station). The port is closures, never classes, and every segment carries a plain `kind`: the
    prototype's one serious defect was recognising a segment by its class's NAME, which a minifier renames —
    the first minified page drew every wave as a straight bar (source-fenced by
    `tests/unit/ribbon-no-names.test.ts`).
    **The seam to a card** — all a card and the ribbon share: the card marks four blocks with the LITERAL
    attributes `data-ribbon-keepout` (quote, name block, buttons row) and `data-ribbon-keepout="portrait"`
    (the portrait's cell; its keep-out is the central 60 % × 70 %), and spells its padding
    `max(1.5rem, var(--ribbon-lane-top, 1.5rem))` — the same for `--ribbon-lane-side` — so it is exactly
    today's card outside a ribbon, on an engine without `@property`, and at any root font size. The two lanes
    are REGISTERED (`@property`, two rules in globals.css) — measured in Chromium and WebKit: unregistered,
    `cqw` inside them is resolved against the CARD wherever a box inside the card reads them (ui/Card is a
    container), and the lanes come out up to 13.4 px too narrow; registered, they match the rule to 0.001 px.
    The gauge and the gap between stations are the ribbon's own variables and are NOT registered: tried both
    ways, nothing depends on it. **A KEEP-OUT IS WHAT IS PAINTED**, not only the marked element's box: the
    union of the element's box and its contents' (text that overflows, the children of a `display: contents`
    marker); a marker that paints nothing is skipped — measured as its all-zero rectangle it became a dot at
    the WINDOW's corner that pushed a wave 347 px off course with the guard silent.
    **One canvas per card**, not one for the page (a column of doctors on a tablet passes the 16.7 million
    pixels iOS gives one canvas), and EVERY JOINT BETWEEN TWO CANVASES LIES BEHIND A CARD, where nothing is
    painted: a card's canvas also holds the NEXT card's entry (its drop-in and its hook). The first build
    joined its canvases on the visible run between two cards and measured a band 3 to 5 levels darker at
    every joint — the later canvas's shadow falling on the earlier one's ribbon; a joint nobody can see has
    neither a hairline nor a shadow to explain. **What is deeper than the card's front face is simply not
    painted:** by the model's own bound it stays within 0.056 k of the card's outline, so it was never seen
    — the first build's clip for it changed 0 to 4 pixels per card and was removed as dead code.
    **The guard:** a ribbon whose strip would enter a keep-out is NOT painted — the whole column, never one
    card — and development builds warn, saying what happened. A ribbon over a doctor's words is worse than no
    ribbon. **A DECORATION NEVER TAKES THE PAGE DOWN:** every entry from the browser (the start, each frame,
    the observer, the listeners) runs behind one barrier — on any throw the ribbon removes itself and the
    error is reported, never handed to React, which without a barrier replaces the page. **NO REBUILD WITHOUT
    A NEW GEOMETRY:** a phone fires `resize` when its address bar collapses mid-scroll; the ribbon depends on
    the column's width, so an unchanged column touches no canvas.
    **Layers and the static page:** the root is `relative isolate` and takes no number from the closed
    stacking order (30 / 40 / 45 / 50); the canvases are `aria-hidden`, unfocusable, click-through (pinned by
    `elementFromPoint` on every control of the stand-in), hidden in forced colours and in print (pinned by
    the class only, in this lane); the server's HTML carries no canvas and no state, so §16's rule 2 holds by
    construction. **A LIST STAYS A LIST (SC 1.3.1):** the header names the two routes a consumer has — its own
    `<ul>` with each `<li>` the station (`asChild`), or `role="list"` on the ribbon with `role="listitem"` on
    wrapper stations; the stand-in uses the second, pinned by role.
    **Reviews (G2, on the owner's word "you run the reviewers now" — the first ribbon board's "I'll run the
    reviews when done", fb-483/484, is superseded for this lane):** react-reviewer, typescript-reviewer and
    a11y-architect on Fable, each APPROVE WITH CHANGES, no critical and no high finding; six medium and
    twenty-three low, folded in two rounds, plus one round of the planner's own before them.
    **Evidence at READY:** see the lane's PR. **Visual:** EIGHT new cells (`ui/ribbon/`, seven stories at
    1280 and `narrowest` at 320) and no existing one, proven by a before-and-after comparison against a
    fresh build of develop (429 existing cells unchanged); `ReducedMotion` and `Drawing` are `no-visual` —
    the net already runs with reduced motion, so the first would repeat `Desktop`'s pixels, and the second
    moves by design. The darwin record is the owner's, on the owner's machine (§15.7). **Shadow on the
    ground under a doctor's words, measured:** at most 3 levels in 255, at one corner pixel of the quote's
    box on a 1521 px column — the faint ink still 4.82:1 there; none on phones and tablets.
    **NOT tested, recorded:** Firefox (not installed on the workstation), a real phone, more than three
    doctors. **The owner's to decide, recorded and not built** (the accessibility review's D1–D5): the line
    at the reading position or half a screen earlier · the hurry, or "finish at once a queued card that is
    off screen when its turn comes" · the ribbon's prominence beside the faintest text on the site (4 px of
    air guaranteed) · the empty lanes in print · the portrait's inset once real photographs arrive.
    **OWED AT THE MOUNT (the card's lane):** how the real card takes the lanes (`ui/Card` fixes `p-6` and
    forbids `className` as a padding API: a Card mechanism, or an inset on the card's inner column) · the
    list route · a probe of `asChild` across the server-to-client boundary (`slotClone` and a keyed root) ·
    forced colours and print as an e2e check · `tests/unit/team-data.test.ts`'s 21-character ceiling
    re-derived for the narrower column the lanes leave · a census that every text of a card lies inside a
    keep-out. *(ALL SIX DISCHARGED at the mount, 2026-09-30 — §15.25's THE MOUNT paragraph says where each
    one landed.)* **WAIT triggers** (do not build early): two canvases per card (a top band and a side band — a
    third of the memory) when a column of more than six doctors or a measured memory complaint arrives · a
    bound on SC 2.2.2 by construction when the roster reaches FIVE doctors · the painted-pixel loop has three
    spellings in this lane's tests and stories — the repo-wide test-helper promotion lane takes it · the
    ribbon's line moved from the screen's centre to the CLEAR part's centre (`lib/reading-line`) only on the
    owner's word — the rule is the owner's own sentence.
    **Round 2 (owner, the same day, 2026-09-30 — a bug report and a colour, lane `fix/ribbon-smooth-keepout`,
    `/debug-deep`; verbatim: "a visual bug in the ribbon. it looks like a rectangle. i hate how it looks. it's a
    bug and want it removed … i want a smooth one", then "i need you to also change the color to part of the
    ribbon. drop the dark mauve,/ black one and use the mov, the purple that is used at: «FAMILIA PREMIUM SMILE /
    Specialiștii cu care ne mândrim» for first traversal section"):** (1) **SMOOTH BESIDE A KEEP-OUT.** The
    rectangle was not two stretches overlapping (the owner's guess): in `lib/ribbon-model`'s `wave()` a wave's
    base line drifts towards the next card's drop-in and was held off each keep-out by a hard `max(0, ·)` — a
    CORNER where the drift met the limit (4.75° on the card of the report, 10.5° on a German card with a short
    side wave, 5° to 8° on a phone), then the base line lay ON the limit with no room left, the hump towards the
    card was cancelled, and the ribbon ran as a ruler line for half a wavelength (50 to 60 px), evenly lit. It
    showed on that card because its name block's keep-out spanned its whole grid column; the fault was the
    model's, wherever a keep-out holds a wave back: three of the six recorded cards had it (tablet, phone,
    narrowest), and about 30 % of the waves of 1 199 random layouts. Three changes inside `wave()`: THE KNEE
    (the hinge rounded over ± `SOFT` k, 0.05 k, never below `max(0, x)`), THE HUMP'S ROOM (the base line stops a
    damped hump's amplitude short of the limit, so beside a block the wave goes on, calmer — rounding the corner
    alone left the ruler line: prototyped, rejected by the picture) and THE LAYERED UNION (what a box asks for
    beyond the next-nearest applies wherever any box at least as near is present, `1 − Π (1 − p)`, in place of
    `min` over the boxes and the eighth-power sum, which turned corners where two plateaus crossed). Measured: 0
    corners on 30 measured cards and on the 1 199 random ones (20 of 60 and 715 of 2 398 waves before); never
    closer to a keep-out than the clamp allowed; a wave no keep-out touches is the same to the last bit; beside
    a block that holds it back the ribbon runs 2.4 to 7 px further out. The two records were re-written FROM
    THE PORT as their headers provide (the side waves of `desktopMirrored`, `tabletStacked`, `phoneMirrored`,
    `narrowestLongGerman`; `desktop` and `widestMirrored` did not move). Pinned in `ribbon-model.test.ts`: no
    corner, no ruler line, no keep-out entered — on the recorded cards, on four layouts that showed the fault
    (`ownerCard` among them) and, for corners and keep-outs, on a seeded sweep of forty. THE SEAM, for a card:
    a keep-out is what is PAINTED, the marked element's own box included — mark the element that hugs the
    words, or the ribbon is kept out of empty space. (2) **ONE COLOUR.** The dark face is gone: the whole ribbon
    wears `--ribbon` `#8377a3` (the old `--ribbon-light`), and `--ribbon-shadow` `#2d263c` is the colour of its
    shadow alone, unchanged at 0.38 — so every stretch that was purple keeps its pixels. `lib/ribbon-paint`'s
    `Faces` type is gone (`buildStrip(model, mirror, base)`), the painter's recorded colours were re-written,
    no geometry moved. The model's hidden half twist STAYS — its one job was to show the second colour, and it
    is the way back to two tones; removing it is the owner's word. **Reviews:** a Fable TypeScript review of (1)
    — approve with changes, no defect in `wave()`, its comment and test findings folded; the adversarial maths
    read was stopped unfinished and (2) was not reviewed by a separate agent (the owner's Fable quota).
    **Visual:** no existing cell moves — the ribbon is mounted nowhere on develop; all eight `ui/ribbon/*` cells
    change (they still have no darwin baseline: the owner's). **Evidence at READY:** see the lane's PR.

27. **The clinic's real data — ON THE OWNER'S WORD (2026-09-30, verbatim: "find everywhere in the page where
    the page has data about the clininc ,that is not photos and add those ones … tell me if i skipped any" ·
    "the slogan of the clinic is "Totul pentru zambetul tau", not Stomatologie modernă. Îngrijire onestă." ·
    then the pin, the listing's share link and the two profiles, with "for the moment leave same number, i'll
    modify that" · "i'll update domain later. add those and create pr"; lane `feat/real-clinic-data`):**
    `lib/clinic` stops being placeholders for everything the owner supplied, each value as the clinic's
    Google listing carries it: the phone `+40770162765` („0770 162 765"), the address „Strada Gheorghe Dima
    nr 3A, 550409 Sibiu" (the listing's own spelling, no dot after „nr", so the site and the listing carry ONE
    address — §10.1), the pin `45.7765271, 24.1439856`, the two profiles
    (`instagram.com/premium.smile.sibiu`, `tiktok.com/@premium.smile.sibiu`), the name as the listing spells
    it, and THE WEEK: Monday to Friday 09:00–19:00, Saturday AND Sunday closed. **Still placeholders, the
    owner's:** the WhatsApp number (the phone's for now, on his word) and the production domain (`url`).
    **The week changed a sentence, not only a row.** The Footer prints one row per day from the data, so
    „Sâmbătă" turned „Închis" by itself; the contact dialog's one-line caption `contact.callHours` NAMED a
    Saturday in all five languages, so it lost that half ×5 („Lun–Vin {weekOpens}–{weekCloses}") and
    `sections/ContactModal`'s build-time guards were reshaped with it — the week must be exactly ONE entry
    covering Monday to Friday and no weekend day, or the build fails naming everything a reshaped week costs:
    the key ×5, the arguments t() passes it, the guards themselves (they used to REQUIRE a separate Saturday
    entry). The caption holds one line at the 320px width now where it took two, so the dialog's recorded
    heights there were RE-MEASURED (`ContactModal.tsx`, the note under its table): 506 / 482px at 320×568 and
    466 / 442 at 320×500, RO / DE. On the engine that measured them (Chromium on macOS) Romanian is the
    taller language at that width — its title breaks „WhatsApp." onto a fifth line — which had left the
    Romanian 320×500 box 22px OVER its budget before this lane; it clears it by 2 now. The German rail is
    391.88px before and after: the WhatsApp label sets it.
    **The slogan** is `common.footer.tagline`, the Footer its one consumer: „Totul pentru zâmbetul tău" — the
    owner's words, written with the diacritics every Romanian string on the site carries (he typed it
    without); EN/DE/FR/IT are Claude's DRAFTS, flagged (§15.17): "Everything for your smile" · „Alles für Ihr
    Lächeln" · « Tout pour votre sourire » · «Tutto per il tuo sorriso».
    **The map is the listing itself, in the page's language.** The owner's share link (`maps.app.goo.gl/…`)
    renders nothing in a frame, so `mapEmbedUrl` is the embed form BUILT around the place that link resolves
    to and checked in a browser: Google's own card („Premium Smile", the address, the rating) and the pin on
    Strada Gheorghe Dima at laptop widths, the card collapsing to a chip on phones. Google's controls and card
    take their language from two fields INSIDE that URL and from nothing else (measured: `ro` there gives
    Romanian, `de` German; an appended `&hl=` is ignored), so NEW `mapEmbedUrlFor(url, locale)` swaps them
    and `sections/ClinicLocation` reads `useLocale()` — five pages, five frames, ONE pasted URL, and a URL of
    another shape fails the build. That closes the English-controls-everywhere finding of 2026-09-09 (G2 a11y
    LOW-4), as that lane's own note asked for the day the real URL arrived. `clinic.test.ts` also ties the
    blob's centre to `geo` — the two placeholders had sat a kilometre apart with nothing to notice — and the
    shown phone to the dialled one. **COOKIES.md's standing item is discharged:** the probe re-run on the
    built page in all five languages — zero cookies, no `Set-Cookie` on any of Google's 38–39 responses,
    nothing in the frame's other storage; the IP limb and §12's deferred consent are unchanged.
    **Reviews (G2):** react-reviewer, typescript-reviewer and a11y-architect on Fable, each APPROVE WITH
    CHANGES, no critical and no high finding; the one medium (the stale 320px record) and the lows folded in
    ONE round, the per-locale map among them.
    **Recorded, not built — the owner's:** the demo doctors' weeks contradict the clinic's (`lib/team`:
    `andrei-serban`'s Saturday morning prints on his page above a Footer that says „Sâmbătă — Închis", and
    `elena-marin`'s two evenings run to 20:00 — demo people, replaced with the real team; all three reviewers
    flagged it); the dialog's caption could spell its days out („Luni–Vineri" — it fits now) and could say
    the weekend is closed; „nr" without its dot; the phone in its national format on the four foreign pages;
    Google's card shows the listing's RATING inside the frame — a CMSR question, not a markup one;
    `home.hero.subtitle` ×5 is still unused (§15.21); the site shows no e-mail address and no legal identity
    (company name, CUI, trade-register number) — the §12 policy page's lane; `ui/` story fixtures keep their
    generic „Strada Exemplu" copy on purpose (atoms hold no site data, §4).
    **Visual:** measured by a before/after differential against a pristine build of develop `198709a` (437
    cells, a private port, the darwin set's classic-scrollbar mode): exactly 55 cells move — every
    Sections/Footer story, Sections/ClinicLocation's three, the open Sections/ContactModal's two, and
    Pages/Home · Team · Doctor in both languages — and 382 are identical; the map's language moves none (the
    net fences the frame). The 19 `sections/*` cells among them are re-recorded in the darwin set (7 were in
    sync before the lane, 12 already stale); the 36 `pages/*` cells stay as develop has them — 12 stale, 24
    never recorded — because lanes in flight change those pages again and own their record. **Evidence at
    READY:** see the lane's PR.

28. **The soft corner — ON THE OWNER'S WORD (2026-10-01, verbatim: "refactor on docotr cards, top bar and
    TEXT buttons, contact us modal. take a look at old webpage. i want that rounded corner effect that the
    doctor card from old webpage has … so i want round corner from that card. the aspect and ratio or idk
    how to call it implemented in all mentioned parts" · "doctor cards mean also personell cards"; lane
    `rework/soft-corners`):** the old site's doctor card was `rounded-2xl` — Tailwind's 2xl step, **1rem**,
    on a radius scale that repo never overrode (its `@theme` holds no `--radius-*`; read, not assumed) — as
    were its staff card and its review card; its top bar was `rounded-lg` (8px), its buttons `rounded`
    (4px), its desktop nav anchors square boxes with an underline. That 1rem ships as ONE token,
    **`--radius-soft`** in globals.css' `@theme` (an ADDITION to the `--radius-*` namespace; the default
    scale stays untouched — §3), minting `rounded-soft`, `rounded-b-soft` and the other side and corner
    forms, and it is worn by exactly the four parts the owner named: (1) **the personnel card, both
    kinds** — ui/Card gains a SECOND situation axis, `corners: 'house' | 'soft'` (default `house` = the
    §15.1 6px `rounded-md`), a lookup like `tone`, emitted in the slot where `rounded-md` always stood so
    every card that does not ask is byte-identical (the atom's recorded "A RADIUS PROP" rejection is
    re-written as the fired trigger: the premise "one value for the whole site" fell on the owner's word;
    a KNOB — `radius={16}` — stays refused); sections/PersonnelCard passes `corners="soft"` for the doctor
    and the auxiliary alike; the portrait's own 12px (ui/Image `framed`) is untouched — the old staff card
    paired a 16px card with a 12px picture frame too; (2) **the top bar** — the Header pill `rounded-lg` →
    `rounded-soft`, and NavMenu's panel with it (the two glass cards have matched since 2026-08-16); the
    bar's CONTROLS keep 6px (the Contact ui/Button, the burger's GlyphButton `square`); (3) **the TEXT
    buttons** — ui/TextButton's box wears `rounded-soft`: a chrome-less control has no ground and no border,
    so TODAY THE CORNER SHOWS ON THE FOCUS RING ALONE (an outline follows `border-radius` in every current
    engine) and on any future hover ground (fb-126's "bordered look" variant) — recorded plainly, the
    owner's to widen; (4) **the contact modal** — ui/Modal's box `rounded-lg` → `rounded-soft` and its body
    `rounded-b-lg` → `rounded-b-soft` (the body reaches the box's bottom edge; square, it would paint over a
    rounded box's lower corners from inside); ContactModal composes it unchanged. **(5) THE SERVICES PAGE,
    TRIED AND REVERTED THE SAME EVENING:** on the owner's "apply to all cards on services page too",
    sections/PriceList's menu card (`PriceMenu`) and its eleven `CategoryCard`s passed `corners="soft"` —
    built, gated, measured (zero tolerance: exactly Sections/PriceList 12 + Pages/Services 12 cells moved,
    the armed glow's `::before` layer and the keyboard arrival ring following the corner by construction),
    shown on the preview — and taken off again on his look: "ngl i liked cared fro before better for
    services. it looked perfect." A card KIND's corner is TASTE, chosen per kind and recorded, never
    inferred from a neighbour: the price cards keep §15.1's 6px, the census's askers list names
    PersonnelCard alone, and CategoryCard.test / PriceList.test now PIN the house corner on the menu and
    on every category card with the owner's words, so a later "to match" needs a new word. NOT changed,
    each one class
    away, the owner's calls: the LanguageBanner toast (the third member of the old `rounded-lg` overlay
    family — it keeps 8px and its header says so), ui/Button (the Contact button, „Mai multe despre mine",
    the hero CTAs — 6px), the burger, the review / price / credo / schedule cards (6px — the reviews deck's
    idle FRAME the doctor card borrowed keeps its 6px; the price cards by the taste decision above), the
    map frame. **Guards:** ui/Card's fence
    (`tests/unit/card-single-spelling.test.ts`) is re-keyed to the geometry's four utilities
    `@container flex flex-col gap-3` with the old dossier shape `flex flex-col gap-3 rounded-md` fenced to
    Card.test.tsx's byte-pin alone; NEW `tests/unit/soft-corner-census.test.ts` pins the value inside
    `@theme` (1rem, one spelling), counts each wearer's wear outside prose (Card 1 · TextButton 1 · Header 1 ·
    NavMenu 1 · Modal 1 + 1 bottom), sweeps src for a fifth wearer and for a second asker of `corners="soft"`,
    and proves its stripper has teeth; Card.test (the axis: default byte-identical, soft in the geometry's
    slot on every tone, exactly ONE `rounded-*` per corner × tone, 16px / 6px computed, the armed glow's
    layer inheriting 16px, `corners="round"` refused at compile time), PersonnelCard.test (both kinds, one
    radius), TextButton.test, Header.test (pill + panel one token, the burger 6px), Modal.test (box + body,
    16px computed). **Overlap, recorded:** the uncommitted `rework/text-button-lavender` lane edits
    TextButton's `base` (its colours), Header.test and globals.css too — whichever merges second rebases;
    the hunks are adjacent lines, not the same ones. **Evidence at READY:** see the lane's PR.

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
  inline `top` that the server HTML never carries; every category card stays inert — and,
  since round 4, 2026-09-29, the island WRITES OUTSIDE ITS OWN SUBTREE: after mount it stamps
  one `data-current` attribute on the category card its spy names and takes it off again; the
  card's static classes answer it with the glow, `ui/Card`'s `aura="current"`. Round 5, the
  same day, adds TWO more writes on those same cards, and they are the only runtime DOM
  writes on this site that land on markup no island renders: the spy's inline
  `scroll-margin-top` on every card — where a jump to it comes to rest, `lib/scroll-spy`'s
  reading line — and the island's `data-arrival="keyboard"` on the one card a keyboard jump
  landed on, off again at its blur. The server HTML carries none of the three), and the **Home Hero** (`sections/Hero` — the WHOLE band is the island, on `ui/use-rotation` over `lib/rotation`: which picture is opaque, which slogan readable and which bead current all depend on the active index, and its one static part, the two calls to action, hydrates anyway through ContactModalTrigger; the static HTML still carries every slide, both buttons and the beads at index 0 — hero lane, 2026-09-19, §15.21). **The doctors band adds ONE island, on Home and on the Team page alike: `ui/Ribbon`** (mounted 2026-09-30, §15.25, §15.26) — `sections/DoctorShowcase` is a server component that hands its server-rendered cards THROUGH the client component as children, so the ribbon never re-renders a card; after mount an effect starts the drawing and appends one canvas per card to the ribbon's empty `aria-hidden` layer, which is all the static HTML carries of it: no canvas, no state, nothing that depends on the visitor (rule 2 below). Until that day the Team page added no island. **The doctor pages add TWO** (doctor-pages run, 2026-09-21, round 2 2026-09-25, rounds 2f–2g 2026-09-26, §15.23): TeamRoster, DoctorShowcase's own section, heading and list, DoctorIntro (with its CredoCard), DoctorProfile (with its ScheduleCard), the DoctorCourses band's heading, TintedBand and the reworked PersonnelCard compile to inert HTML; `sections/DoctorStats/StatNumber` is the count-up under each „în cifre” tile, which prints the final value in the static HTML and only decides after mount whether to count (reduced motion: never), and `sections/DoctorCourses/CourseTimeline` is the timeline's rail on `lib/scroll-spy` — which year is CURRENT depends on the scroll position, so the static HTML carries every group grey and no `data-current` at all — plain `<a href>` links, CSS-only layout; the only script that rides with them is ui/Image's optimizer island under each portrait (PersonnelCard D11), which every page with a photograph already pays. Everything else stays inert HTML.
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
