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
  and default spacing scale untouched. *(A scaled design remaps the UNIT, never the scale: globals.css's
  `design-scale` utility re-expresses every default length step — spacing, text, container, radius — in a
  band's own design pixel, inside that band alone, each step keeping Tailwind's ratio; §15.25 round 2 —
  since 2026-10-02 ONE design pixel for every band of Home and Team and, the same evening, for the Services
  page's price list, spelled once in ui/Container's THE BAND SCALE; §15.32.)*
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
    icon.svg             # THE BROWSER TAB'S ICON — a byte copy of public/images/brand/mark.svg (Next's icon convention; §15.31)
    favicon.ico          # its raster twin, the mark at 16 · 32 · 48px PNG-in-ICO, for every Safari before 26 (§15.31)
    (no page.tsx)        # root "/" is out/index.html, the client-side locale redirect tools/generate-root-redirect.ts writes at build (see §5)
  lib/                   # one folder per module, its test beside it (lib-foldering lane, 2026-09-06)
    clinic/clinic.ts     # SINGLE SOURCE of NAP: name, address, phone, hours, geo, sameAs links
    routes/routes.ts     # THE route list + matchesRoute/equivalentPath (one list, all consumers)
    hours/hours.ts       # schedule → printable rows (deterministic reference week)
    scroll-lock/scroll-lock.ts  # THE page scroll freeze (React-free mechanics)
    scroll-spy/scroll-spy.ts  # THE "which target am I in" mechanic, on ONE of three lines: the landing line (the default — where a fragment jump rests), the viewport's centre (`line: 'middle'` — the doctor page's timeline, round 2k) or THE READING LINE (`line: 'reading'` — the price menu, 2026-09-29: the middle of the CLEAR area, bent at both ends of the page so every target has a turn, every target's landing planned by lib/reading-line and WRITTEN as its `scroll-margin-top`, the module's one write) + bottom rule + top fallback (`topFallback: 'first' | 'none'` — the named trigger fired by the doctor page's timeline, 2026-09-26) + click pin, which judges only a page that has stopped (THE START GRACE, 2026-09-29) (React-free; price-list pack round 2, 2026-09-14)
    reading-line/reading-line.ts  # THE arithmetic of the reading line: where a jump to each target comes to rest (centred when it fits the clear area, on its old ceiling when it does not), landings kept inside the page and apart by a share of each target's size, and the probe the walk measures — numbers in, numbers out, no DOM (price-list round 5, 2026-09-29)
    sticky-rail/sticky-rail.ts  # THE "where does a sticky rail taller than the window pin" mechanic: fits · top · bottom · travel, direction-aware, a link the KEYBOARD focused reveals its edge — a pointer's focus is never answered, 2026-09-29 (React-free; price-menu-pin lane, 2026-09-18)
    ribbon-model/ribbon-model.ts  # THE floss ribbon's mathematics: one card's path as a chain of segments by arc length (each a plain `kind`, never a class), the gauge rule `k = max(0.0793 W, 0.192 + 0.0602 W)` and the lanes that follow from it, the clearance measure; its side wave SMOOTH beside a keep-out — no corner, no ruler line (§15.26 round 2) — and its top run A LOW RIPPLE — three normal-distribution bumps, a valley, a crest, a valley, their depth and height shares of the run and capped by the lane's room and the top edge's headroom (round 3, 2026-10-01: the top wave, "too much" to the owner, is history); and the LAST card's tail TUCKED under its bottom edge — `G: null`, the side wave straight down, the hook's circle, over the bottom edge at the top's 35° and onto the back (round 5, 2026-10-01: the hanging tail, fb-504, is history); six frozen reference cards beside it, re-written from the module in both rounds (React-free, no DOM; ribbon lane 2026-09-30, §15.26)
    ribbon-layout/ribbon-layout.ts  # the page → the model's numbers: stations and their keep-out blocks found by `data-ribbon-keepout` MARKERS, never by their place in the markup; a keep-out is WHAT IS PAINTED (the element's box and its contents'), a marker that paints nothing is skipped; the portrait's inset; every second card mirrored (§15.26)
    ribbon-paint/ribbon-paint.ts  # numbers → pixels on the ordinary 2D canvas: the strip, the light, additive blending, the plane cut at the card's front face — what is deeper is not painted — and, since round 3 (2026-10-01), THE SHADOW, painted under the ribbon as one path's drop shadow, never a CSS filter on the canvas; since round 6 (2026-10-02) THE ANCHORED LIGHT — a face turned to the viewer shows the colour token itself, the light's accents kept in their ratios round it — and THE WIDTH SHARE, `buildStrip(…, widthShare)`: the strip drawn at a share of its width along the very same centre line (§15.26)
    ribbon-draw/ribbon-draw.ts  # WHEN a card's stretch is drawn: the owner's line — a card's centre a QUARTER of the screen above its bottom since round 4 (the screen's centre until then), a card taller than the screen its top the same quarter under the top — and the end-of-page rule, the FIRST card drawn without its head (round 4), the queue, the pen, reduced motion, a new geometry, the guard, ONE canvas per card joined behind the cards, one barrier round every entry from the browser, and — since round 6 (2026-10-02) — the width share read off the root's `--ribbon-width-share` (0.7 in the doctors band's laptop and desktop regime, 1 everywhere else), and — since round 7 (2026-10-02) — the pieces painted IN SOFTWARE on one off-page scratch canvas (`willReadFrequently`) and copied onto each tile, which lays its shadow itself: a graphics card's rasteriser sowed white specks in the additive seams — `startRibbonDraw(layer)` → `{ dispose, getSnapshot }`, and NOT the ring's construct / start / dispose protocol: nothing renders from it (§15.26)
    reduced-motion/reduced-motion.ts  # THE prefers-reduced-motion seam: read + watch (React-free; rotation lane 2026-09-09)
    clock/clock.ts       # THE auto-advance beat: timeout chain + the APG time manners (sticky pause/play, transient cause-keyed suspend/resume, first dwell, reduced-motion + tab-hidden reactions, external driver)
    rotation/rotation.ts # the ring on a clock: active index, step, wrapIndex, liveRegion, rotationControl, classifyFocusEntry/leavesRegion — consumed through useSyncExternalStore (its header IS the consumption law)
    rotation-group/rotation-group.ts  # one beat, many rings — opt-in sync; the site default stays independent clocks
    external-store/external-store.ts  # THE useSyncExternalStore protocol (subscribe · getSnapshot · getServerSnapshot · sync) — clock, rotation, rotation-group publish through it (org-review F1, owner fb-426, 2026-09-09)
    cx/cx.ts             # THE class-join helper — every tier imports it (fb-307 → PR #64)
    rating/rating.ts     # THE star-rating value type (eleven half-steps) + guards — atoms AND the data list import it (reviews run D17, 2026-09-10)
    initials/initials.ts # THE two-capital monogram type + guards — the twin of lib/rating (D17)
    reviews/reviews.ts   # THE review list — the clinic's own Google reviews since 2026-09-30 (facts + five-language words per row, NEWEST FIRST; `postedOn` the day Google shows, the card says how long ago through lib/time-ago; quotes spelling-corrected with CMSR-banned phrases cut „[…]", EN/DE/FR/IT DRAFTED, flagged; one characteristic per title, no two alike — §15.19 round 4). No invented review exists anywhere: the six fabricated demo rows were deleted and the stories render this list (owner 2026-10-01: "all fabricated ones need to be dropped")
    time-ago/time-ago.ts # "how long ago" the way Google's review list says it: a `YYYY-MM-DD` day + a `now` → one unit rounded down (year · month · week · day) → Intl.RelativeTimeFormat's words in five languages („acum 2 ani", "vor 2 Jahren"); computed at BUILD by the reviews band (React-free, real-reviews lane 2026-09-30)
    prices/prices.ts     # THE price list — 11 categories · 102 fixed whole-RON rows, facts + five-language words per row (RO transcribed from the owner's printed tariff 2026-09-13; EN/DE/FR/IT DRAFTED, flagged; an eyebrow on EVERY category — eleven, eight drafted 2026-09-14); the Services page populates the DUMB band from it (§15.20)
    image-path/image-path.ts  # THE picture-path type (`/images/${string}`, type-only) — promoted by the hero lane on §15.19's recorded trigger; lib/reviews, lib/hero-slides, ui/Avatar, ReviewCard and ReviewsDeck all import it (2026-09-19)
    hero-slides/hero-slides.ts  # THE Home opener's slides — picture + five-language words per row: the clinic's OWN three photographs since 2026-10-01 (lobby · treatment room · handpieces, `public/images/hero/`, 1920 × 1280, EXIF stripped) under slogans and alts DRAFTED by Claude in all five languages on the owner's word, flagged (§15.21 round 11); the Home page populates the DUMB Hero band from it (hero lane, 2026-09-19)
    team/team.ts         # THE clinic's people — doctors (ONE picture, the transparent waist-up cutout — the framed portrait and the optional lib/prices category left with the card's services link, 2026-09-30, §15.25 — own week in lib/clinic's OpeningHours shape, course rows `{ year, words }` grouped by `coursesByYear`, `stats` rows `{ icon id, value, suffix?, words }` for the „în cifre” tiles) and auxiliaries (a 3:4 portrait), five-language words per row (`philosophy` = the `<k>…</k>` quote split by `splitKeywords`, `about` = third-person paragraphs); the clinic's six REAL doctors since 2026-09-30 (names + specialties the owner's; every other field a RANDOM placeholder on his word, EN/DE/FR/IT drafted, all flagged; nobody gendered) beside the clinic's three REAL auxiliary staff since 2026-10-01 (names and roles the owner's, the titles FEMININE on the owner's word and translated by Claude; portraits still the demo silhouettes) — and, since 2026-10-01, the clinic's OWN numbers, `clinicStats` (three rows of the doctors' `stats` shape, now named `Stat`: years · patients · procedures, the Home and Team pages' „în cifre" band; placeholder values, flagged) (doctor-pages run, 2026-09-21; round 2 2026-09-25; round 3 2026-09-30; rounds 4 and 5 2026-10-01, §15.23)
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
  images/brand/mark.svg  # THE clinic's tooth mark — two paths in the brand's two colours, traced from the owner's PNG (2026-10-01, §15.28); sections/Wordmark's default artwork; an .svg the optimizer never touches
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
- All sizing in `rem` so browser zoom and user font settings behave. *(One exception, owner 2026-10-01:
  on a mouse or trackpad device — a laptop or a desktop — from a column of max(56rem, 896px) the doctors
  band — sections/DoctorShowcase, cards and ribbon — measures in its OWN design pixel, its column ÷ 1106, so
  it keeps the proportions of the owner's 1401 window at every laptop and desktop width; on every touch
  device (a tablet held either way included), below the step, and in an engine that cannot register custom
  properties it is rem like everything else. What that costs browser zoom and the user's font size is
  recorded in §15.25 round 2. Since 2026-10-02 the exception covers EVERY band under the Home hero and
  every band of the Team page — one design pixel, ui/Container's THE BAND SCALE, so their headings are one
  size and one offset at every laptop and desktop width — and, the same evening, the Services page's price list,
  its menu and its cards one design (§15.32 round 2) — and nothing else on the site; §15.32.)*

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
  read first; `lib/reviews` joined 2026-09-30 with the real reviews, `lib/hero-slides` on
  2026-10-01, the day its copy was rewritten — §15.21 round 11).
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
| Home | **Hero** (the opener — the old site's auto-iterating photo frame as a DUMB props-in rotator on `lib/rotation` through the shared `ui/use-rotation` shell: a full-bleed stage of grey-veiled photographs UNDER the pill filling the whole first screen (`-mt-[calc(6rem+2px)]` + `min-h-svh`, the SIXTH coupled spelling — round 2), the picture zone light (the old 20 % wash back), one slogan per slide on `ui/Heading` 'slogan'/'inverse-aura' — the old page's stroked letters under a lilac halo at the plain weight, changing hands in a sequence instead of a dissolve, and the tablet's own ratio of the viewport from the tablet up (round 12, 2026-10-01) — over ONE static ground that reaches the old site's 0.40 veil at the words' own row (§15.1's rider), an eased fade into the page ground at the bottom, a ContactModalTrigger + an outline services link — both in ui/Button's lilac `accent` family since 2026-10-01, the services link under the top bar's aura and greying one step darker on hover, both with the old site's hover jump (§15.30 round 3) —, beads only — buttons with `aria-current`, no pause/play and NOTHING that stops it for good on the owner's word (a bead press buys a full interval; keyboard focus inside is the one hold; no pointer hold at all); the page is the ONE populator from `lib/hero-slides`; hero lane 2026-09-19, pack rounds 2–3 2026-09-20, §15.21) · **DoctorStats** (the clinic's NUMBERS since 2026-10-01 — the doctor page's „în cifre" band on the plain page ground (`ground="page"`: no tint, no fades), its eyebrow „În cifre" and h2 „Experiență confirmată în timp" at the START like every Home band's (`align="start"`), NO lead, and THREE tiles — lib/team's `clinicStats`: years · patients · procedures, the numbers placeholders flagged TODO(owner) — one row from the column's `@xl`, stacked below; right under the Hero, BEFORE the doctors, on the owner's word the same evening ("i need to swap these 2 sections between them … so first in cifre and then doctors" — it had stood between the doctors and the map, the planner's pick) — §15.23 round 5) · **DoctorShowcase** (the doctors band since 2026-09-30, between the numbers and the map since the owner's swap — eyebrow „Familia Premium Smile" + h2 „Specialiștii cu care ne mândrim" over every `lib/team` doctor as the doctor card, in ONE column that the floss ribbon wraps (`ui/Ribbon`, drawn live on scroll, §15.26) — on a laptop or desktop (a mouse or trackpad device), from a 56rem column, the whole band is ONE design scaled to its column, the proportions of the owner's 1401 window at every width up to a 1920 desktop's, while every touch device keeps it unscaled (§15.25 round 2); the SAME band the Team page opens with, populated by the Team page's own walk and its `team.showcase.*` keys — §15.25) · ServicesTeaser · **ClinicLocation** (the „Ne găsești" map + contact rows — the first Home band shipped, 2026-09-09, old-site order: late on the page, before the closing band) · **ReviewsCarousel** (the „Părerea ta contează" deck — SectionHeading + ReviewCards on `lib/rotation`; second Home band, built 2026-09-10, replaces the never-built "TrustStrip (opt)"; old-site order: after ClinicLocation; MOUNTED 2026-09-20 on the owner's word — the hero lane's rounds 4–5 — first over five fabricated demo rows, and since 2026-09-30 over the clinic's OWN Google reviews from `lib/reviews` (seven rows; each card's bottom line says how long ago the review was posted, „acum 2 ani", computed at build; the card is four-fifths of a phone's stage so the longest review fits — §15.19 round 4, §15.21) · CTABanner. EVERY band under the Hero draws in ONE scale on a laptop or desktop since 2026-10-02 — ui/Container's THE BAND SCALE, one heading size and one offset for all four: the doctors band whole, the numbers band whole with its tiles at 9/8 (a tile's sentence the doctor card's quote size), the map band whole, the reviews band's opener alone (its deck untouched); §15.32 | `home` |
| Services | an `sr-only` h1 (page markup; the VISIBLE opener dropped — owner 2026-09-14, pack round 2 — while §9's one-h1 rule and the SEO outline keep the element) · **PriceList** (the sticky in-page jump menu inside an aura'd Card beside eleven category cards, of which ONLY the one the visitor is at wears the aura, faded in and out over 400ms — round 4, 2026-09-29; every card wore it from 2026-09-14 until then; "at" is THE READING LINE since round 5, the same day: a card lights as its top crosses the middle of the clear part of the window, the first card at the top of the page, and a menu click brings a card that fits to that middle, with no focus ring for a pointer — SectionHeading eyebrow + title on EVERY card, `<dl>` name/price rows in ONE column always; the menu CARD (nav + title + `<ul>`) is the band's one client island `PriceMenu` on `lib/scroll-spy` (the current category marked `aria-current="location"` on its link in BOTH directions, scroll and click, and — round 4 — by a `data-current` mark the island stamps on the card that link points at) and `lib/sticky-rail` (a menu taller than the window pins by its bottom edge scrolling down and by its top edge scrolling up, never a scroll container — round 3, 2026-09-18); a DUMB props-in band populated by the page from `lib/prices` — owner brief 2026-09-13 + pack round 2 2026-09-14, board `price-list.plan.md`; supersedes the „ServiceCard list with price rows" dossier; FAQ void per §15.15 — and on a laptop or desktop, since 2026-10-02, the band draws in ONE scale, ui/Container's THE BAND SCALE: its menu and its cards one design scaled to the column past the 1401 reference and floored at the theme's own size under it (the owner's delegated decision — the price text never smaller than today), the stuck menu's 8.5rem line and the cards' 2.5rem landing still rem, coupled to the pill — §15.32 round 2) · CTABanner | `services` |
| Team | an `sr-only` h1 (page markup, the Services page's shape — „Echipa noastră" was the VISIBLE opener until 2026-09-30, and §9's one-h1 rule and the tab title keep the element) · **DoctorShowcase** (the visible opener since that day, §15.25: eyebrow „Familia Premium Smile" + h2 „Specialiștii cu care ne mândrim" over the doctors as **PersonnelCard** doctor cards in ONE column inside `ui/Ribbon` (§15.26 — the ribbon's first mount), scaled as one design on a laptop or desktop (§15.25 round 2) — each card ui/Card `framed`, the reviews deck's idle frame; the doctor's transparent waist-up cutout over name + specialty beside the justified, quoted `philosophy`, sides alternating; ONE solid button „Mai multe despre mine" → the doctor's page, level with the name on row 2 of a 40 / 60 grid at the card's own `@3xl`; below the step specialty → name → picture → words → button; the FIRST card's picture preloads on this page, its LCP element. The two-link card of 2026-09-21 is history, and the link to a doctor's prices left with it) · **TeamRoster** (the auxiliary-staff tiles ALONE since 2026-09-30, until then also the visible h1 and the doctor cards; owner brief 2026-09-10, a NEW design with no old-site reference; supersedes the TeamMemberCard dossier — and since 2026-10-02 a TITLED band, its own eyebrow „Echipa de sprijin" over the h2 „Oamenii fără de care nu ne-am descurca" (`team.roster.*`, Claude's drafts ×5), the tiles `<h3>`s at ONE width: 18rem on phones and tablets, a third of the scaled column on a laptop or desktop — §15.32; the `<h2>` names on `repeat(auto-fit, minmax(16rem, 1fr))` are history) · **DoctorStats** (the clinic's numbers since 2026-10-01 — the Home page's band, prop for prop, between the staff and the map: the owner, "same component as on main page with the stats on the team page between map and helping staff"; §15.23 round 5) · **ClinicLocation** (the map, last — „so I can test how it goes back and forth on the page”) · TeamIntro / ClinicGallery (opt, unbuilt). EVERY band of this page draws in ONE scale on a laptop or desktop since 2026-10-02 — ui/Container's THE BAND SCALE, one heading size and one offset for all four (`scaled` on the numbers and the map); §15.32 | `team` |
| Doctor (`/team/[slug]`, one per doctor — §15.23; reshaped in round 2, 2026-09-25) | **DoctorIntro** (the opener, like jonaclinic.ro's doctor pages: OUTSIDE a card on the page ground, the transparent cutout portrait left, eyebrow = specialty + `<h1>` = full name right on Heading's `hero` step; on a laptop and a desktop, since 2026-10-01 (§15.23 round 6), the owner's TWO CONTAINERS across the whole column — the picture's track a third of the column after an inset of 15 % of the gutter, a gap of a sixth of the column clamped to 3–10.5rem, the words in the rest: the specialty over the name a ninth of the column down and the credo card under them on ONE left edge 1.5rem into the words, the card up to 36rem wide and centred in the height the name leaves (as much space above it as below), and the cutout drawn out of flow as tall as the row, growing (centred, up to 1.4 × its third) until it stands on the words' floor, so the two containers share ONE floor — the `align` seat axis (rounds 2e–2l's `lowered`) and round 2k's centred content-sized columns retired with it; the band's own rhythm halved in round 2j ("it starts height wise too low … also the image, so the whole thing"), the credo's quote on `text-xl`; and BELOW `@3xl` the order name → picture → credo card with the eyebrow and the h1 centred (round 2k: "name and speciality … above the photo and … centered"); the `<k>` keywords in the quote at weight 650 in the doctor card button's lavender `accent` since 2026-10-02 (§15.1's keyword rider — "i want that highlighted text to actually be the color of the current mai multe despre mine button"; the deep violet `accent-strong` until then) (round 2p: "add just a little more bold and underline them maybe"; round 2q, one look later: "remove the underline") (ui/Keyword, round 2m — one evening's road: darkest ink → bold ("a more serious contrast") → italic ("try italic") → "a darker lilla and just a little bold"); under the name the **CredoCard** — ui/Card `framed` + `aura`, the reviews deck's idle card under the price cards' lavender glow (round 2r, 2026-09-26: "add an aura around the filozofia mea card"), eyebrow „În cuvintele mele” + h2 „Filozofia mea” over the doctor card's quoted `<k>` words in the locale's own quotation marks; a free `children` slot after it) · **DoctorProfile** (the soft-lavender band — accent-decorative at 30 % over the page, half again ui/Card's 20 % tint ratio, the owner's „too faded” verdict of 2026-09-25 — with the Hero's ten eased stops fading in above and out below: „Biografie / Despre {name}” third-person paragraphs on ~75 % of the row ‖ the **ScheduleCard** on ~25 % — ui/Card `framed`, the deck's idle card like the credo card, on a named `<section>`, the h2 „Când mă găsiți la clinică” alone (its „Program” eyebrow struck 2026-09-26) centred over the doctor's own Mon→Sun week through `lib/hours` as a centred two-column block, closed days muted; ONE width, 20rem, at every screen (round 2k: "should not be widening as you widen the screen or tighten when you tighten it" — it shrinks only under a column narrower than 20rem); the biography a NAMED REGION of its own beside the week's (G2-R2 tier 2, a11y: the one content block a landmark walk skipped), the card `self-center` beside it in a one-row grid — its middle the band's vertical middle by construction, pixel-identical to round 2g's two-row placement (owner 2026-09-26, "center it also vertically in the lila section"); no divider, no rule) · **DoctorCourses** („Formare continuă / Cursuri și specializări”: h2 over a CV TIMELINE — the line down the LEFT at every width (owner 2026-09-26: "the line should be on the left side, not centered" — round 2e's alternating layout is history), one YEAR per row with a dot on the line, the year an `<h3>` on Heading's `title` step over a bulleted list, the rail capped at the prose's `max-w-4xl`; and ONE CURRENT YEAR on scroll through the **CourseTimeline** island on `lib/scroll-spy` (`topFallback: 'none'`), the years on Heading's `section` step over a doubled `gap-20` (round 2j): the line is PER-GROUP SEGMENTS, so at rest every subsection recedes — its segment and dot `bg-line`, the year in the `accent-idle` tone, the list muted, the whole group faded — and the last year whose top has crossed the CENTRE of the screen (round 2k, `line: 'middle'`) COMES FORWARD: the group scales toward the viewer (`--animate-forward`, settling at 1.04, `origin-left`), its segment and dot take the accent, the dot pops, the year turns `accent`, the list full ink; reduced motion = the colours and the fade without movement; the server HTML carries no current mark; owner 2026-09-25 round 2e, 2026-09-26 round 2g) · **DoctorStats** (the second lilac band — on the shared **TintedBand** ground — „În cifre / Experiență confirmată în timp” (the reference's „Excelență" until round 2s) centred over a lead sentence and four tiles: a light disc with a line glyph — LILAC (`accent-decorative`) since 2026-10-01, the owner: "paint it's svgs lilla"; green until then —, the number counting up once from 0 through the `StatNumber` island (the static HTML prints the final value; reduced motion = no count, re-asked when the count would start), an `<h3>` label — BEFORE the number in the DOM since G2-R2 tier 2 (a screen reader's H key lands on the label with the number next), the paint order kept by two `order` tokens — a muted sentence; a tile's `value` is refused by `countFrames` unless a whole number ≥ 0; the twin (`sr-only` until 2026-10-01, since then an invisible copy laid exactly over the digits on one line, so a screen reader's cursor outlines the number and VoiceOver touch finds it — §15.23 round 5) SPEAKS the `+` suffix's meaning — „peste 3.000" / "over 3,000" / „über" / « plus de » / « oltre » — from the page's `team.doctor.stats.atLeast` key (owner 2026-09-27, round 2s; the visible span keeps „3.000+"; a space grouping the spoken number's digits dropped since round 5 — « plus de 3000 »); the band's title is „Experiență confirmată în timp" and every stat sentence descriptive — the CMSR scan (§13) refuses the old „Excelență" / „Rezultate predictibile și sigure" / „Intervenții reușite" / „Recunoaștere" shapes; four on a row from `@3xl`, two on a tablet, one column on a phone; the numbers and words per doctor in `lib/team`, the three band keys the page's; owner 2026-09-26 round 2f) · *[FUTURE, owner 2026-09-25: a band of this doctor's blog articles goes HERE, above the map — not built until the blog exists]* · **ClinicLocation**. Every side-by-side arrangement stacks one above the other below the Container's `@3xl` step (the owner's adaptability rule, play-pinned) | `team` |
| Blog (ro only) | PostCard list · PostPage (MDX) | `blog` |
| Contact (modal) | ContactModal: `tel:` phone, WhatsApp, address, hours, directions link | `contact` |
| Global | Header (the logo — a link home since 2026-10-02, §15.33 — + nav + Contact button + LanguageSwitcher) · Footer (the logo, the same link + **full NAP** + hours + policy link) | `common` |

## 15. Parked decisions — ASK before deciding, do not improvise

1. Design tokens — **LOCKED 2026-07-30** on the TOKEN_AUDIT proposal plus these owner
   decisions: CTA restored to the green family (`#008854` button face, `#00A968` anchor);
   fonts **Source Serif 4** (display + body) + **JetBrains Mono** (eyebrows), Publio only
   inside the vectorized logo; body base **1.125rem** (inside the doctors band's scale, 18 of its design pixels — §15.25 round 2); default radius **6px**; star
   `#B29126` → **`#D4AF37` (amended 2026-09-12, owner — the rider at the end of this item)**; hero text scrim floor ≥ 0.55; single light theme; long prose `text-align:
   start`; `success` role dropped (17 semantic roles total — 18 since 2026-09-26, 19 the same evening — `--ink-faint` #766f69, washed prose that still passes body text's 4.5:1 (4.94:1 on white, 4.70:1 on the page ground; never on the 30 % tint at 3.24:1), the two doctor quotes its only consumers, the owner: "what if you make the faint text lighter" — and `--accent-strong` #4b3a86 (#655885 for its first hour — the owner: "a darker accent … make it just jump at you more, as keyword, important information"), the violet that passes body text's 4.5:1 with room — 8.88:1 on the page ground, 9.34:1 on white — for body-size accent INK, ui/Keyword's `<k>` fragments its first consumer (until 2026-10-02, when they took `--accent` — the keyword rider at the end of this item; the role keeps the accent button family's press and hover ink); the owner, doctor-pages round 2m: "use a darker lilla and just a little bold"; `accent-decorative` keeps its display/graphics charter; 20 since 2026-10-01 — `--accent` #746894, the menu buttons' lavender, the rider at the end of this item; 22 the same day — `--brand-grey` #939598 and `--brand-lilac` #8576b1, the logotype's two colours, legal on the brand name alone by WCAG 2.2 SC 1.4.3's logo clause and worn by nothing else, the census test, §15.28). Amendments from contradiction
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
   **Fourth per-element exception — the review card's quote (2026-10-01, owner, the real-reviews
   lane: "make review text in justify" · "they look perfect now"):** the quoted body of
   sections/ReviewCard ships `text-justify` ON THE ELEMENT (§15.15 b once more) — the one line the
   2026-09-10 build deliberately did NOT port from the old card. Scope: that body paragraph, in every
   locale; the site-wide `hyphens: auto` keeps rivers out of the 312px phone card.
   **Menu-button lavender — the 20th role (2026-10-01, owner, verbatim: "refactor on all menu
   buttons. i need them not to be that green. i want them to be same color as in old website
   on the same top bar buttons"; lane `rework/text-button-lavender`):** `--accent` = `#746894`,
   a NEW semantic role worn by `ui/TextButton` alone (alone until later that day — §15.30 gives the
   two button atoms an `accent` FAMILY, worn per call site on the owner's word) — its hover label, current-page label and
   2px underline, still ONE colour (the old top bar's single-`accent` unity, 2026-08-06) — so
   every menu button turns lavender at once: the Header's row and burger panel, the Footer's
   links, the price menu's categories. **The Contact button stays GREEN** (the owner, the same
   day, after a lavender Contact was tried on the preview and reverted: "contact button MUST STAY
   GREEN AS IT MUST JUMP INTO YOUR EYES") — the CTA keeps the green family while the quiet menu
   controls around it wear the lavender, and `Header.test.tsx` pins both of the Header's Contact
   buttons to ui/Button's solid green face. **REVERSED BY THE OWNER THE SAME EVENING (§15.30
   round 3, verbatim: "also paint the contact button from top bar a lilla and make it wider, more
   seszable and adjust to widest language form"):** both of the Header's Contact buttons wear
   ui/Button's lavender `accent` family since — the bar's under a 10rem floor, wider only, and with
   the old site's hover jump — and `Header.test.tsx` pins the lilac; the green CTA family keeps the
   language bulb (under its flag) — the fixed corner's two discs followed the Contact into the lilac
   later that evening (§15.30 round 4), and the contact dialog's two buttons last, that night
   (round 5). The old top bar's own `--accent` is `#8377a3`
   (top-bar.tsx: `text-accent`, `after:bg-accent`); MEASURED, it reads 4.09:1 on white and
   3.89:1 on `--page` — under the 4.5:1 an 18px medium label owes SC 1.4.3, and the
   current-page label is a resting state, so axe would fail every story that shows one. The
   value is that accent with its OKLCH hue and chroma kept and its lightness lowered to the
   lightest step that passes on THE GLASS FLOOR (L 0.597 → 0.546): the pill and the phone's
   menu panel are `bg-surface/95`, see-through, and with the menu open the scrim dims the page
   behind the panel — axe measured it at #f8f8f8 and failed a first pick, #786c98, there at
   4.49:1 (the Menu Open story) — so the value must pass on 95 % white over black, #f2f2f2:
   4.52:1 there, 4.76:1 on #f8f8f8, 4.81:1 on `--page`, 5.06:1 on white, 3.32:1 on the 30 %
   lilac tint (barred there, like `--ink-faint`). The green it
   replaces, `cta-hover` #006b42, is untouched as a token — ui/Button, GlyphButton, SpeedDial
   and the language banner's accept link keep it *(the banner's link left it on 2026-10-02 —
   §15.30 round 6)*. `tests/unit/accent-census.test.ts` names
   every wearer and renderer with its ground and MEASURES the value from globals.css, so the
   old site's exact `#8377a3` fails there with its number. **The owner's lever:** the exact
   old value is one line in globals.css plus an exception in that test — an AA failure on the
   site's navigation, to be recorded here as the owner's call if taken.
   **Radius amended 2026-10-01 (owner, soft-corners lane — "i want that rounded corner
   effect that the doctor card from old webpage has … implemented in all mentioned
   parts"):** the 6px default STANDS for every control and card, and the site gains a
   SECOND, named corner — `--radius-soft` = **1rem**, the old site's own `rounded-2xl` card
   radius — worn by exactly four parts: sections/PersonnelCard (both kinds, through
   ui/Card's new `corners="soft"` situation), the Header pill with NavMenu's panel,
   ui/TextButton's box and ui/Modal's box (the contact dialog). The services page's cards
   wore it for an hour and went back to 6px on the owner's taste. Item 29 is the record.
   **Keyword ink amended 2026-10-02 (owner, verbatim: "i have the highlights in text. there
   are some keywords in text that are a lilla. but i do not like that lilla. exaplems of
   words: „soluția potrivită", „fiecare etapă" … i want that highlighted text to actually be
   the color of the current mai multe despre mine button"; lane `rework/keyword-accent`):**
   ui/Keyword's `<k>` fragments — the key words of the doctors' quotes, on the doctor card
   and on the doctor page's „Filozofia mea" card — wear `--accent` #746894, the face of
   ui/Button's lavender family at rest, the doctor card's „Mai multe despre mine" link among
   its wearers (measured on the built page: both rgb(116, 104, 148)), in place of the deep
   violet `--accent-strong` #4b3a86; the weight stays 650. NO TOKEN VALUE MOVED — the
   UTILITY did (`text-accent-strong` → `text-accent` in the atom's RECIPE), so every key word
   moved at once and nothing else on the site did; `--accent-strong` keeps its charter as
   the accent family's press and hover ink. MEASURED (WCAG 2.2): 5.06:1 on the white cards
   both quotes sit on — body text's 4.5:1 met — and 4.81:1 on the page; but 1.02:1 against
   the quotes' `--ink-faint` (the violet stood 1.89:1 darker), so the key words now have
   their sentence's own lightness and stand apart by HUE and WEIGHT alone — a greyscale view
   or a colour-vision deficiency keeps the 650 only; salience, not information, so SC 1.4.1
   is untouched (the atom's THREE LIMITS). The 30 % lilac tint is barred again (3.32:1; the
   violet read 6.12:1 there) and no key word sits on it: `tests/unit/accent-census.test.ts`
   names ui/Keyword a wearer, the three pages that render key words and the one walk that
   applies them to a doctor's philosophy only — its comment stripper fixed on the way (a
   `/*` inside a line comment had been eating real code up to the next `*/`, the Team page's
   `<Keywords>` among it). The doctor card's story pins the key words EQUAL to its link's
   face — a KEEP-IN-SYNC relation (§4). **The owner's levers**, if the key words stop
   catching the eye: the weight (700 was "too bold" on 2026-09-26) or a darker step of the
   same lavender — the latter a new role, since `--accent` is the buttons' too.
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
   **THE MARK LANDED 2026-10-01 (owner: "this is the actual logo of the clinic premium
   smile"; the run is §15.28):** the tooth mark, traced from the owner's PNG into
   `public/images/brand/mark.svg`, is sections/Wordmark's default artwork in the header and
   the footer of every page, and the name beside it wears the brand's two lettering colours
   („Premium" grey, „Smile" lilac). The lettering itself stays LIVE text in Source Serif 4
   (the Publio stand-in, §3) — the owner supplied the mark and the colours, not Publio
   lettering; if that ever arrives it replaces the words as a second file. The purple
   confirmation is now a NUMBER, not a change: the logo's lilac is #8576B1 against
   `accent-decorative`'s #7A6D9C and the ribbon's #8377A3 — adopting it is the owner's call
   (§15.28). *(Since 2026-10-02 the ribbon follows `accent-decorative`: `--ribbon` is the
   lilac band's ground, #D4CFDC, held to that mix by a test — §15.26 round 6.)* THE FAVICON LANDED THE SAME DAY (§15.31): the mark itself is the tab's icon —
   `src/app/icon.svg`, a byte copy, beside `src/app/favicon.ico` rasterised from it. STILL OPEN: the
   OG share image, for which the mark is the natural source.
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
    import; type + guard written once) and make a third letter or a `4.3` a COMPILE error in the data list; ground `cta` (→ the lavender `accent` role on 2026-10-01, §15.30);
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
    **Round 4 — the REAL reviews (owner, 2026-09-30, verbatim: "i want to start filling the page with
    custom data … reviews … scrape the following few ones with picture and everything … take number
    of starts, internationalise them and correct spelling obviously … for title … make a summary of
    what is the most important thing, like features … i do not want any repetitions … if review too
    short … just drop … take image from google review and place here and optimise them and instead of
    the procedure … „PLAN COMPLET" just say how long ago it took place like it says in the google
    reviews" · "obviously adapt review card to longest review"; lane `feat/real-reviews`):** an Opus
    agent read the clinic's Google Maps listing HEADLESS (never the owner's browser): signed out, Maps
    shows a handful of reviews and answered the rest with a CAPTCHA, so FOUR landed from the listing;
    the rest came from links the owner sent the next day (a contributor's page filtered to the clinic,
    one headless request each — the signed-in-Safari route by AppleScript was tried and stopped on the
    owner's word after two page loads, its window closed, nothing of the login read). Of the owner's
    ten, one — a single line whose only characteristic was a superlative, by a different reviewer than
    the owner remembered — was DROPPED by the owner's own rule and one was swapped on the owner's word
    for another: NINE rows were read, all 5★, every date Google's own timestamp — and SEVEN ship: after a
    preview the owner took out the two longest (2026-10-01: "remove too long reviws … jsut to see how it
    looks without them" → "they look perfect now"). No reviewer's name is written anywhere but the data rows themselves (G2 typescript: the
    repo is public and consent is still owed). Decisions: (1) THE TEXT is
    the patient's, spelling and diacritics corrected, and — the owner's choice between "trim" and
    "word for word", asked with the evidence — every phrase the CMSR's advertising guide bans CUT and
    marked „[…]": Decizia 4/2CN/2025 (in force 2025-07-01) lets a clinic show its own patients'
    testimonials and makes it ANSWERABLE for their content, and lists „cea mai bună", „optim",
    „top", „premium" among the banned wording; a cut takes the smallest span that leaves the sentence
    grammatical; EN/DE/FR/IT drafted by Claude, flagged; (2) THE TITLE names the ONE characteristic a
    review is about, in the clinic's words, CMSR-clean — so NOT the owner's two examples, „echipă
    profesionistă" and „materiale de calitate", which sit on the guide's list („servicii profesionale /
    calitative") — no two alike in any language (tests/unit/reviews-data.test.ts) and read by the CMSR
    scan (its first new SOURCES row — the titles AND the cut quotes, 0 hits in five languages, so the
    next review's missed superlative fails CI); a long review yields its unique characteristic to a
    short one that has no other; the scan's ALLOWED list stays EMPTY (the one quote that needed it left
    with the two longest); (3) THE DATE LINE replaces
    the procedure eyebrow (§6.6: `procedure` → `postedOn` + `postedAgo` on ReviewCard and the deck's
    slide): `Review.postedOn` is a `YYYY-MM-DD` fact and NEW React-free `lib/time-ago` turns it into
    Google's own wording at BUILD — one unit, rounded down, Intl.RelativeTimeFormat with a digit
    („acum 2 ani", "vor 2 Jahren", « il y a 2 ans ») — printed as `<time dateTime>`; the band takes a
    `now` (default the build's clock, so each rebuild refreshes the phrase) and every story pins it;
    (4) THE DEMO ROWS ARE GONE (owner, 2026-10-01: "all fabricated ones need to be dropped"): the
    six invented testimonials first left shipped data for a stories-only fixture (this item's
    round-3 trigger "a demo-fixture module at the Home mount"), then were deleted outright — the
    band's and the card's stories and tests render the REAL list (the card's half-star story went:
    no real review has half stars, and ui/StarRating's own stories cover them; mechanics tests use
    plainly-labelled placeholders, never invented patient prose); `ReviewsCarousel.fixtures.ts` keeps
    only `REVIEWS_NOW`, the clock every story pins, held by the data test at or after the newest
    review; NEW tests/unit/fixtures-fence.test.ts keeps every runtime file in src/ off any
    `*.fixtures` module; (5) AVATARS: the reviewers'
    own Google photographs (three) are cropped square at 256px — the largest width the 3rem disc
    can use at 3× among §11's baked sizes — under public/images/reviews/; the four Google letter
    avatars became ui/Avatar's own two letters; (6) THE CARD, ADAPTED TO THE LONGEST REVIEW: the deck
    already stretches every card to the tallest, so the lever was the WIDTH — `--deck-card`
    `clamp(14rem, 66%, 8% + 20rem)` → `clamp(14rem, 80%, 8% + 20rem)`, which moves only stages under
    ~552px: MEASURED, with the first four reviews the tallest card on the 390×844 phone went 785 → 637px
    in DE (93% → 75% of the screen); with all NINE (the built export, /ro/ /de/ /fr/) the tallest is
    674px DE (80%; RO 626, FR 650) and 559px at 1280×800; with the SEVEN that ship, 550px DE (65%; RO 526,
    FR 578) and 459px at 1280×800 — the longest review fits one phone screen in every language, each neighbour still peeking 39px (was ~66); 768px and wider pixel-identical; the
    320×568 stress screen stays taller than one card by nature (~790px), reflowing without sideways
    scroll; (7) THE QUOTE IS JUSTIFIED — §15.1's fourth per-element exception (owner, 2026-10-01). G2 (three Fable reviewers — react ·
    typescript · a11y): 0 critical; react and typescript APPROVE WITH CHANGES, every medium and low
    folded — the story clocks above; an Invalid Date `now` refused by name before it reaches Intl;
    `IsoDate` tightened so „2025-6-14" and „14-06-2025" fail to compile; the card's import of
    lib/time-ago pinned TYPE-ONLY (no clock in the browser); a sentence a patient wrote in another
    language is given in the page's language (SC 3.1.2 — a rule lib/reviews' header keeps; its one case
    left with the two longest rows) and a sentence break restored after an emoji; „[…]" is silent at screen readers' default punctuation,
    and every cut sentence still reads whole. THE a11y HIGH IS THE OWNER'S, RECORDED NOT CHANGED —
    §15.21 round 6's SC 2.2.2 record, re-measured with the real text: the rhythm's reading-time
    trigger FIRED and NO card is readable in one 5.5 s dwell (the shortest, 18 words, needs 7.2 s at
    150 wpm; with the seven that ship the longest is ~70–78 words, 28–31 s), and a THIRD group has no hold
    beside mouse and touch: a screen reader's READING CURSOR (NVDA browse mode, VoiceOver swipe) is
    not DOM focus, so the card it is reading is swapped out every 5.5 s, silently (`aria-live` off
    while running). The owner's options, each keeping "it always moves on": a per-card dwell from its
    own word count (one per-beat delay seam in lib/clock), a hold while a pointer rests on the CENTRE
    card only, or the struck rotation control. THE OWNER'S GATE STANDS: the patients' consent to show
    their names and pictures (GDPR art. 9 — a name beside a dental review).

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
    line; still the FIFTH coupled spelling in Header.tsx's mount contract *(re-spelled 2026-10-02 as rem
    LITERALS, `@3xl:top-[8.5rem]` and `scroll-mt-[2.5rem]` — the same 8.5rem and 2.5rem — because the price
    band now draws in the band scale's design pixel and the pill the pair follows does not; §15.32 round 2)*;
    (6) **BIDIRECTIONAL
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
    **Round 11 (owner, 2026-10-01 — THE CLINIC'S PHOTOGRAPHS; lane `feat/hero-clinic-photos`;
    verbatim: "refactor on images in the auto scrolling component on main page. i need you to use
    the following they are in downloads under POZE CLINICA: _DSF3109-HDR.jpg - this is a photo of
    the lobby of the clinic … _DSF2784-HDR.jpg - this is a photo with a dental chair …
    _DSF2694-HDR.jpg - this is a photo with a dental chair. paired text wise, idk, you decide on
    the text. these sound kind of pretentious, make them sound friendlier. discard dead code and
    photos" — and on the third, mid-lane: "it's some of those tools used by dentists"):** the demo
    pictures are gone and the band shows the clinic. (1) THE PICTURES:
    `public/images/hero/{lobby,treatment-room,instruments}.jpg`, the three photographs in the
    owner's order (the third is `_DSF2694.jpg` in his folder — no `-HDR` copy of it exists),
    re-encoded by the lane and never committed raw: 1920 × 1280 — the largest `deviceSizes` width
    in next.config, and the optimizer never makes a wider variant, so a 6000px source would buy
    nothing but repository bytes — progressive JPEG at quality 82, the EXIF orientation baked in
    and every other tag dropped (the originals carried the camera model and timestamps), 74–202 KB
    each; the band's `grayscale blur-xs` at 80 % is untouched, so the grey look stays the band's
    and the files stay in colour. `lib/hero-slides` rows `lobby → treatment-room → instruments`;
    the data test now ENFORCES `/images/hero/` (the convention the module promised "the day a
    non-demo path appears"), a source at least 1920 wide and landscape (read off the JPEG header —
    the team-data reader's second copy, filed with the helper-promotion census), a 16-character
    ceiling on a slogan's unbreakable word (lib/team's `hero`-step arithmetic), D-DASH on every
    word, and an alt that never repeats its slogan. (2) THE WORDS, FRIENDLIER: every slogan and
    alt is a Claude DRAFT in all five languages, flagged (§15.17) — RO „Bine ai venit! Te
    așteptăm cu drag." on the lobby, „Ne facem timp să îți explicăm fiecare pas." on the
    treatment room, „Instrumente moderne, mâini blânde." on the handpieces — each paired to its
    picture; the old site's three slogans („… ca într-un studio de lux") left with the demo
    pictures on the owner's word; the register is each message file's (tu · you · Sie · vous ·
    tu); the French „!" carries U+202F, the language's own no-break space. The CMSR scan (§13)
    gains its SECOND widening (the first was `lib/reviews`, 2026-09-30) — `lib/hero-slides` is a
    `SOURCES` row — and every row passes it.
    (3) DEAD CODE AND PHOTOS: `public/images/demo/hero-team.jpg` and `hero-result.jpg` deleted
    (no other reader); `hero-calm.jpg` STAYS as the Image atom's demo photograph (ui/Image,
    ui/Avatar and ReviewCard read it, five files — a rename is a separate lane); the old site's
    alts parked in `TODO(owner)` rows went with the scenes they described; `home.hero.subtitle`
    ×5 STRUCK (unused since round 1, "stays until the owner strikes it" — this dispatch's
    "discard dead code" is that word); Hero.test.tsx reads its Romanian rows from the module
    instead of a copy. (5) ONE UTILITY ON THE BAND: the slogan's `<p>` wears `hyphens-none` —
    measured at 390 on the built page, the site-wide `hyphens: auto` (§15.14) split „Te aș-teptăm"
    at a syllable on the clinic's own copy; the DoctorProfile name precedent (§15.15 b, one utility
    on the element, test-pinned), safe by the data test's 16-character ceiling. FOUND, NOT FIXED,
    OLDER THAN THE LANE (measured on develop's own build too, `e0e1158`): in Chromium a bead that
    RECEIVES KEYBOARD FOCUS scrolls the page by about 44 % of the viewport — 350px at 1280×800, 476
    at 1920×1080, 360 at 390×844 — although the bead is fully in view; `focus()` and
    `scrollIntoView({block:'nearest'})` both move it, `focus({preventScroll:true})` does not, a
    mouse or touch press never scrolls, and WebKit does not scroll on focus; the band's own
    `overflow-clip` `<section>` is the one clipping ancestor and the likely cause — the owner's
    call, the lever is the band's clip. (6) VISUAL, measured at ZERO tolerance against a pristine build of develop
    `e0e1158` (441 cells, a private-port differential): exactly the 25 hero cells move — Pages/Home
    RO + DE at all six widths (the Romanian 320 frame 40px SHORTER: the shorter slogan wraps to
    fewer lines where the stage outgrows the screen) and Sections/Hero's six stories at 390 + 1536
    with German Stress at 320 — by 80 to 93 % of their pixels, the photographs; on two shoots of
    the lane, 7 and then 6 OTHER cells differed (the language dial, the price list's glow, the
    reviews deck, SpeedDial's disc — a different set each time), each by 5 to 79 px at ≤ 5/255, and
    four of them failed against their OWN reference on a re-shoot of the same build — the harness's
    known flicker, not this lane's. NO darwin baseline is committed: the
    re-record is the owner's, on the owner's machine (§15.7; pages/home's six Romanian baselines
    were stale since #117 already, sections/hero has never had one). Gates at READY: prettier ·
    eslint · tsc clean; vitest 3143/3143 (136 files), the same 3143 with the optimizer variants
    hidden (the CI rehearsal, §15.23 round 3); build-storybook and `next build` green; e2e 118
    passed, 36 skipped. No reviewer round was run and nothing is committed — both the owner's word.
    **Round 12 (owner, 2026-10-01 — THE OLD PAGE'S HEADING, ITS CALM CHANGE AND THE TABLET'S RATIO; lane
    `rework/hero-glow-heading`; verbatim: "i need a new heading like the old one in the old website at the
    section with the clinic photos/sliding windows on home page … the ones that is white on interior and has a
    lila aura shadow as top bar around letters and with that lilla contour and i think it is in bold.
    implement that bold too. so a searate heading stile implemented here which is atm used only in this
    component but likely to be reused in the future. be very carful, it's transition animation is very stiff
    on old website. i want a calm transition that harmonizes with the transition between images, a gradual
    one. also extremley important. raport wise, there are significant differences between screen sizes. on
    laptop it looks decent. on tablet it looks very good, on phone it loks good. so leave on phone as is, on
    tablet is perfect, but adapt text component raports in sizing for laptop and desktop as on tablet, as it
    looks very good there"):** three changes, each measured before it was built. (1) THE FACE — ui/Heading's
    NEW tone `inverse-aura`, the Hero's DEFAULT (`slogan` defaults to 'aura'; 'plain' — the round-10 pick —
    'stroked' and 'outlined' stay as values, each with a story): the old hero MEASURED `font-bold
    tracking-tight` (its heading atom's level 1), white ink, a 2px `--accent` stroke behind the fill and a 24px
    DARK text-shadow (`0 2px 24px rgba(20,15,30,.35)`) — what the owner reads as a lilac aura is that blurred
    dark edge under the lilac rim — and he named the pill's lavender glow as the thing "around letters", so
    the tone is the stroked letterforms plus a lilac HALO — AMENDED the same day on the pack, the owner: "drop the
    bold." — so the row is 'inverse-outlined' plus one token, the plain weight and tracking: two centred text-shadows mixed from
    `--color-accent-decorative` (the aura token's own source, so §15.1's hue confirm re-tints both), 0.28em at
    60 % and 0.08em at 40 % — in em, because the step runs 32 → 107px and a px glow is a cloud on a phone and
    a hairline on a desktop; five glows were compared on the built page at 1280 and three at 390 / 1280 /
    1920, and the pill's exact value (`0 8px 22px` at 40 %) read as a drop shadow on letters, not an aura. axe
    reads the stroke as the foreground, as on the two stroked tones: the AuraTone story carries the same
    color-contrast exemption; the Hero stories never did need it (a photograph under the words leaves axe
    with nothing to measure). (2) THE CHANGE OF WORDS — the old page crossfaded its stacked slogans in step
    with the picture, 1 s both at once, so for the middle third of every change two bold, stroked sentences
    were legible on top of each other (MEASURED frame by frame on the old site's dev server: at 397 and 561 ms
    „O echipă care ascultă, a modernă / pe limba ta a familia"); this band had the same double exposure on
    thinner letters. The PICTURE keeps the 1 s crossfade; the WORDS now run a sequence of their own: out over
    500 ms (ease-in-out, sinking 12px), in over 1 s (ease-out, rising 12px) after a 450 ms delay — one text is
    gone before the next begins, the new words settle at ~1.45 s, just after the picture at 1 s; the delay
    rides the shown state only (a transition reads its timing from the element's NEW classes), and
    `motion-reduce:transition-none` snaps it. Three candidates — today's crossfade, the sequence, the sequence
    with the rise — were photographed at 1280 on the built page; the sequence alone removes the overlap, the
    rise is what makes the arrival read as gradual. (3) THE RATIO — the `hero` step gave the tablet its 42.88px
    at 5.58 % of its 768px width and then flattened: 4.75 % at 1280, 4.54 % at 1536, 3.75 % at 1920 where the
    72px cap bound — and the words block was capped at `max-w-4xl` (896px), so on a desktop the slogan wrapped
    inside the left half of the screen (MEASURED on the built export). Now a NEW `slogan` step beside `hero` —
    `clamp(2rem, max(1rem + 3.5vw, 5.5833vw), 6.7rem)`: `hero`'s curve to the tablet, byte-for-byte in value (the phone's 32px floor, 42.88px at
    768 — "leave on phone as is, on tablet is perfect"), the tablet's own ratio from there — 71.5px at 1280,
    85.8px at 1536, 107.2px at 1920, where the cap, that very value, holds — and the words block is the COLUMN,
    uncapped (no viewport under 1120px ever met the cap). `hero` ITSELF IS UNTOUCHED: §15.24 made it THE h1
    step — the doctor page's name, the 404 title — and the lane's first differential, which reshaped `hero`,
    moved 22 cells the owner never pointed at (Pages/Doctor, Sections/DoctorIntro and Pages/NotFound at 1280 and
    above — a doctor's name heading for 107px inside DoctorIntro's 28rem column); a step named by its role and
    added beside moves exactly the opener, and the test file pins the slogan curve's first stretch to `hero`'s.
    The 15px classic-scrollbar gutter is why the laptop
    and desktop slogans run on ONE line where the tablet's wraps „drag." onto a second: the column is 80 % of
    the viewport less that gutter, 13.98em at 768 and 14.12em at 1280. (4) THE BUTTONS SCALE TOO — ROUND 12c
    (the owner, on the pack: "buttons should also expand retract in accord to adjusting of current tab for all
    screens. so they should be corellated size wise in expanding or retracting."): ui/Button gains the fluid
    `hero` size, worn by the opener's pair, under the `vw` licence the slogan step holds. ROUND 12d, the same
    day, SET ITS ANCHOR: the first cut was the lg box times the viewport over the tablet's 768px, capped at
    the 1920 value (140 / 70 / 45px) — the tablet's block magnified — and on the owner's ~1500 × 1063 window
    it stood 581 × 109px with a 35px label under the 84px slogan; his verdict, verbatim: "text looks great now,
    but buttons ar horibly large, they look awful. i need them raport wise as they would look on 1500x1063
    aproxmiatley as screen size. so that would be the sizing ratio i'd want to keep between buttons and
    text." So the box is the lg box (56px tall, 28px of side padding, an 18px label) up to the LAPTOP
    CHECKPOINT, 1536px — §7's named sampling point standing in for his "approximately 1500", 2.4 % off it —
    which is the first pack's pair under the slogan's 84px, the ratio he named (a label 0.21 of the slogan's
    size, a box 0.67 of it); from there each measure is `clamp(lg, vw·lg/1536, lg × 1.25)` — 3.6458vw /
    1.8229vw / 1.171875vw, capped at the 1920 value, 70 / 35 / 22.5px (the label's line-height text-lg's own
    ratio) — and the CTA row's cap, gap and basis follow in the same ratio (`max-w-3xl` → `clamp(48rem, 50vw,
    60rem)`, 12 → 15px, 16 → 20rem): from the checkpoint up the block of slogan and buttons is ONE shape
    magnified (both curves are lines through the origin, 5.5833vw against 1.171875vw), below it the slogan
    retracts over a pair that holds — the look of every phone and of the tablet he called perfect, nothing
    under 1536px moving by a pixel; the 24px between slogan and buttons and the beads stay as they were (the
    owner named the buttons). MEASURED on the built export (RO, classic scrollbars): 378 × 56 with an 18px label
    at 1280, 1500 and 1536; 472 × 70 with a 22.5px label at 1920 and beyond; 294 × 56 at 768 and 297 × 56 stacked
    at 390 — as before. For the record, the old site's pair at 1500 was 376 × 64 with a 20px label under a 72px
    heading. (5) ON THE FLOOR — ROUND 12e (the owner, on PR #125: "checks failing"): CI's Default play read
    131px between the first slogan and the buttons where round 9 pins 24. The slides' words are stacked in ONE
    grid cell as tall as the tallest slogan, each aligned to its TOP; round 12's larger, uncapped slogan lays the
    first Romanian slogan on ONE line from 1024px up while the other two take two, so it stood a line higher than
    „right above the buttons" — 72 / 90 / 104 / 107 / 134px at 1024 / 1280 / 1500 / 1536 / 1920, and it jumped at
    every change (measured on the built export; German wraps all three alike). The row now wears `md:items-end`:
    from the tablet up every slogan's last line sits the round-9 24px above the buttons whatever its line count,
    and the play checks every slide's box on the row's floor, its block top read off the row itself. It passed on
    this machine only because it measured before Source Serif 4 had arrived (`font-display: block` lays text out
    in the fallback serif, which wrapped the first slogan onto two lines): the play now loads the real face
    first, DoctorIntro's recipe, and turned red here with CI's 131 before the fix. BELOW THE TABLET NOTHING MOVED
    (the owner: "leave on phone as is"); a 40px float there predates this lane (Romanian at 360 and 390, German at
    320) — dropping `md:` is the lever. RECORDED, the owner's calls: the cap at the 1920
    value (a wider screen stops scaling there, as the gutter stops at 12.5rem); the halo's two numbers, the
    three motion numbers and the buttons' three clamps with their anchor (each a one-line lever in the atom or
    the band; the anchor is the 1536 in six slopes — the atom's three, the row's three); the
    §15.1 veil arithmetic is unchanged (white letters with a lilac rim and halo over the 0.40 veil, and axe
    measures nothing over a photograph). Visual: every
    Sections/Hero and Pages/Home cell moves (the face at every width, the size from 1120px up) plus TWO new
    UI/Heading stories (SloganStep and AuraTone, 1280 + 320 each), UI/Button's new HeroSize (1280 + 320) and
    Sections/Hero's new PlainSlogan; nothing else — `hero`'s four stories, the doctor pages, the 404 and every
    other Button cell are byte-identical by the atoms' pins. MEASURED
    by the lane's differential against a pristine build of develop c984613 (440 cells, a private port): at zero
    tolerance every Sections/Hero and Pages/Home cell moves (24 — the phone widths among them ONLY there: a 2px
    stroke behind the fill and a 60 % halo on thin letters sit under Playwright's 0.2 per-pixel threshold, as the
    aura token did, §15.20), plus 8 NEW cells (PlainSlogan, SloganStep, AuraTone, HeroSize — two each) and 7 more
    of 1–9 px in the harness's known flicker families (the language dial, the price glow, SpeedDial's disc, a
    Services page); 33 darwin cells are recorded in the lane under classic scrollbars (gutter 15, measured): 23
    files re-recorded, 8 new, the stroked and outlined faces' 390 cells unchanged; ROUND 12d re-recorded 14 of
    them — Sections/Hero's seven at 1536, Pages/Home at 1280 / 1536 / 1920 in both languages, HeroSize at 1280,
    the cells the anchor moves at zero tolerance (the 390 / 320 / 768 cells and HeroSize at 320 did not move by a
    pixel, measured). FOUND, NOT THIS LANE'S: UI/Button's Hover Outline darwin baseline is STALE on develop — it
    still shows the green hover fill the outline variant lost on 2026-09-20 (5 971 px at zero tolerance, the
    lane and its pristine reference identical there); left as develop has it. Gates at READY: prettier ·
    eslint · tsc clean; vitest 141 files / 3299 tests WITH the optimizer variants hidden (the CI rehearsal;
    develop had 3280); build-storybook + `next build` green; story plays + per-story axe for the four touched
    story files 39/39 (round 12d re-ran the three the anchor touches — Button, Hero, Home — 23/23, the full suite
    again at 3299 with the variants hidden, the export and the Storybook rebuilt); e2e not run (no hero spec); G2
    not run (the owner's call, the ribbon lane's lesson); nothing committed (§15.7). SEALED on the owner's
    "create pr" the same day, REBASED onto develop 79042ae (#124, the lilac buttons — §15.30, merged first by the
    two lanes' agreement): the opener's two calls to action carry both lanes' words, `size="hero" tone="accent"
    motion="jump"` (the services link `className="shadow-aura"` too), ui/Button's `hero` row and paragraph sit after
    #124's `motionClasses` table untouched, §14's Home row holds both phrases, the inventory both rows; the pair's
    geometry is unchanged by the tone (re-measured on the rebased export: 378 × 56 at 1500, 472 × 70 at 1920). The
    rebase moved exactly 25 cells at zero tolerance — Pages/Home's 12 and Sections/Hero's 13 bar the stroked and
    outlined faces at 390 — the lilac pair inside this lane's frames; re-recorded over #124's set, and
    UI/Button's two HeroSize cells did not move (the `cta` default). Gates re-run on the rebased tree before the
    push: prettier · eslint · tsc clean, the Button / Hero / Heading suites with both census tests 184/184, the four
    story files' plays + axe 44/44, the full suite with the variants hidden — 142 files / 3 399 tests, 3 394 passed in
    the one run and five 15 s timeouts under load (the Home, Services and Team twins' Romanian plays, LanguageSwitcher's
    cookie test, DoctorStats' Counting play — none in a file this lane touches), all five green 49/49 re-run alone under
    the same hidden condition; the pre-push hook ran typecheck + the full suite once more. The two 1920 Pages/Home cells
    record only with a 20 s settle budget (the lane-local differential config's `VISUAL_DIFF_EXPECT_TIMEOUT`): the
    full-page capture expands the viewport to ~7000px, every doctor card comes into view and the ribbon paints DURING
    the capture, so under load two consecutive screenshots keep differing past Playwright's 5 s; the committed
    playwright.config.ts is untouched — the budget is the lever if `npm run visual` ever times out there.

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
    *(Annotated 2026-10-01: THE STEP MOVED to `@min-[62rem]:` — the owner's logo sizes grew the brand to 270.1px, which left
    German 56.25px at 60rem and overlapping under text spacing; §15.31 (a) has the arithmetic and the measurements.)*

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
    is 4.44:1 and keeps its charter) — and ui/Keyword's `RECIPE` = `font-semibold text-accent-strong` — since round 2p `font-[650] text-accent-strong` *(→ `font-[650] text-accent` since 2026-10-02, the colour of the doctor card's „Mai multe despre mine" button — §15.1's keyword rider)* (D59, then D60 one look later — "remove the underline" — dropping the `underline decoration-1 underline-offset-2` trio D59 had added: "looks better. add just a little more bold and underline them maybe" — 650 sits between the 600 of this round and the 700 the owner called too bold; the underline is the owner's "maybe", recorded with the link-lookalike risk: the site's links are green and not underlined, so the violet, non-interactive underline differs by colour and cursor):
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
    for ≈ 5.96 s, over SC 2.2.2's 5 s); that lane records it as ARMED *(discharged 2026-10-01 by §15.26
    round 3's 1.3 s pace: six draw for 3.88 s)*.

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

    **Round 4 — THE REAL STAFF (owner, 2026-10-01, verbatim: "these are just the 3 standard personell cards.
    one of them is Stan Ioana-Ecaterina as registrator medical, Gurgu Aurelia as assistant so instead of
    Mihaela Crăciun and Cândea Angelica instead of Ana-Maria Dobre and create pr"; then, on the PR: "role is
    good already to what was before. receptionist, schedulings, etc" · "use feminine for ioana use just stan
    ioana ecaterina and you translate job titels"; lane `feat/real-staff`, PR #118):** `lib/team`'s three demo
    auxiliaries are replaced by the clinic's staff, each on the card the owner named, so the Team page's staff
    grid keeps its order: Stan Ioana Ecaterina (registratoare medicală) on Ioana Țepeș's card, Gurgu Aurelia
    (asistentă medicală) on Mihaela Crăciun's, Cândea Angelica on Ana-Maria Dobre's, whose reception wording
    („Recepție, programări și comunicarea cu pacienții") the owner confirmed. The NAMES are the owner's,
    surname first; the first WITHOUT the hyphen the first message carried, on the owner's word (as
    „Ioana-Ecaterina" it broke into „Stan Ioana-" / „Ecaterina" at every width). THE STAFF'S TITLES ARE
    FEMININE on the owner's word: the confirmation round 3's NOBODY IS GENDERED waits for, given for the staff,
    while every doctor still waits for it. The feminine JOB TITLES are translated by Claude on that word — DE
    „Medizinische Rezeptionistin" · „Zahnmedizinische Fachangestellte", FR „Secrétaire médicale" · „Assistante
    dentaire", IT „Segretaria medica" · „Assistente di studio odontoiatrico", EN „Medical receptionist" ·
    „Dental nurse". The ids are the names in ASCII (`stan-ioana-ecaterina`, `gurgu-aurelia`,
    `candea-angelica`) and are React keys only, never a URL. The portraits stay the demo silhouettes until the owner's photographs, and the consent owed for
    the doctors is owed for the staff. The TeamRoster and PersonnelCard stories and tests keep their own
    invented people: fixtures, not site data. **Visual:** only the Pages/Team frames change (the three tiles'
    names and eyebrows), already stale since #117; the darwin record is the owner's (§15.7).

    **Round 5 — THE NUMBERS BAND ON HOME AND TEAM, THE GLYPHS LILAC (owner, 2026-10-01, verbatim: "there is
    this component that is used in doctor pages the one with interventions etc. first of all i want you to
    paint it's svgs lilla. second of all i want it on home page too with just 3 components. experience,
    patients and nr of procedures. i want it without that gradient lilla background and to haave : [the
    eyebrow and the title] left alligned as other headings nad eyebrows on main page and without this: [the
    lead] so dorp that part" — and, minutes later: "i realised now i want same component as on main page
    with the stats on the team page between map and helping staff"; the run's rule: "DO NOT USE OR DELEGATE
    ANY FABLE IN THE PROCESS, ONLY OPUS AGENTS FOR REVIEWS AND WHATNOT"; lane `feat/home-stats`):** (1) THE
    GLYPHS — sections/DoctorStats' disc paints its drawing `text-accent-decorative` (#7a6d9c, 4.67:1 on the
    white disc, computed) on every page that carries the band; `--accent`, the menu buttons' lavender, stays
    barred from it by tests/unit/accent-census.test.ts (it fails as text on the tint the band wears on a
    doctor's page), and a drawing is a graphic — the decorative role's charter (§15.1). The ring stays
    `border-line`. (2) ONE BAND, THREE SETTINGS — `ground: 'tint' | 'page'`, `align: 'center' | 'start'` and
    an optional `lead`, each defaulting to the doctor page's answer, so that page's call did not change by a
    character (§6.6). On the page ground the band is the other Home bands' shape — a `bg-page` <section>
    around ui/Container, no tint, no fades —, start-aligned like them; without a lead no <p> renders. Three
    tiles have a row of their own (one column below the container's `@xl`, all three across from it — never
    two and one); any other count keeps the four-tile steps. (3) THE CLINIC'S NUMBERS ARE DATA — lib/team
    gains `clinicStats`, three rows of the doctors' shape (the type renamed `DoctorStat` → `Stat`,
    `DoctorStatWords` → `StatWords`, now that it is not only a doctor's): experience 16+, patients 8.000+,
    procedures 11.000+, PLACEHOLDERS flagged TODO(owner) — no clinic-wide figure exists in the repository or
    on the old site; chosen not to contradict the doctors' own placeholder rows — the years at least the
    longest-serving doctor's (16+), the procedures under what the six doctors' rows add up to (11.900) —, a
    TUPLE of exactly three rows (the owner's "just 3": a fourth is a compile error, the DoctorTeam tuple's
    precedent), worded with the doctors' tiles' sentences, which were already in the clinic's voice („Punem grija …"),
    and read by the data test and the CMSR scan like a doctor's rows. ONE walk, team/populate's NEW
    `populateStats(locale, rows)` (the doctor page's walk calls it too); the glyph map `stat-tiles.tsx`
    moved up from `team/[slug]/` to `team/`, beside populate.ts, because two routes import it now. The words
    are the doctor page's keys, `team.doctor.stats.{eyebrow,title,atLeast}` — the showcase's precedent, one
    band with one wording wherever it stands; no key added. (4) THE PLACES — Home: Hero → DoctorShowcase →
    DoctorStats → ClinicLocation → ReviewsCarousel (after the people the numbers describe and before the map,
    as on a doctor's page — the planner's pick, a lever *(PULLED by the owner the same evening, verbatim: "i
    need to swap these 2 sections between them … so first in cifre and then doctors" — Home is Hero →
    DoctorStats → DoctorShowcase → ClinicLocation → ReviewsCarousel since; the Team page, where the two bands
    are not neighbours, keeps its order; lane `rework/home-stats-first`)*); Team: h1 → DoctorShowcase →
    TeamRoster →
    DoctorStats → ClinicLocation (the owner's place). §16: StatNumber, the doctor page's count-up island, now
    rides Home and Team too. **Reviews (G2 — react-reviewer, typescript-reviewer and a11y-architect, all three
    on OPUS by the run's rule):** APPROVE · APPROVE WITH CHANGES · APPROVE; 0 critical, 0 high; folded in one
    round: an exhaustive tripwire on `ground` (`void (ground satisfies 'tint' | 'page')`, PersonnelCard's
    `kind` precedent) and a Record for what `align` does to the opener (SectionHeading's ALIGN precedent),
    the clinic list typed as a three-row TUPLE, its years 15+ → 16+ (never under a doctor's own 16+), the
    populator's `DoctorStatContent` → `StatContent` beside `Stat`, the doctor page's `lead` and the band's
    `ground`/`align` VALUES pinned page against twin in page-twins.test.ts, a 16-character ceiling on the
    clinic labels (the three-across row's narrowest tile, 165px), and every comment anchor the move and the
    rename left behind; one rule the build proposed was REMOVED in review — "the clinic never below one
    doctor's number" would refuse true figures, a doctor's career can be older than the clinic. MEASURED for
    the a11y review on the built export (Chromium, classic scrollbars): the row turns three-across between a
    738 and a 739px window (165px tiles), and at 320×568, 738, 739 and 768 — ro, de, fr, Home and Team, with
    and without SC 1.4.12's text spacing — no sideways scroll and no word outside its element or its tile.
    **Evidence at READY:** prettier · eslint · tsc clean; vitest 142 files / 3 495 tests green twice — in
    CI's condition (the optimizer's variant folders hidden) and with them back; build-storybook and `next
    build` green; e2e 118 passed / 36 skipped (develop's count; the Team page's "one h1, no level skipped"
    among them). VISUAL, at zero tolerance against a pristine build of develop b3461c8 (463 cells, the
    private-port differential): exactly the declared cells move — Pages/Home and Pages/Team at all six
    widths in both languages (the new band), Pages/Doctor's twelve and Sections/DoctorStats' eleven by
    ~1 320 px each (the four glyphs turning lilac, nothing else) — plus 7 NEW cells (PageGround at 320 / 390 /
    1536, PageGroundStacked and PageGroundGerman at 390 / 1536); 404 cells byte-identical; 5 more of 1–2 px in
    the harness's known flicker families (SpeedDial's disc, the open language dial, PriceList's glow — each
    shown to differ between shoots of ONE build). **Pack approved, placeholders kept (owner, the same day,
    verbatim: "it's perfet and leave placeholders").** **The accessibility follow-ups, DELEGATED (owner, the
    same day: "fix howver you fell like with that wcag, i delegate that to you" — a one-time delegation for
    the items then open), three fixes on every page that carries the band:** (a) THE TWIN LIES ON THE
    DIGITS — StatNumber's spoken copy was `sr-only`, a 1×1px clipped speck, so VoiceOver's touch
    exploration found nothing under the big number and every screen reader's cursor outlined the speck;
    the island now wraps both spans in its own `relative inline-block` box and the twin is `absolute
    inset-0 overflow-hidden whitespace-nowrap opacity-0 select-none` inside it (`data-spoken` names it for
    the suites) — the accessible custom checkbox's technique, opacity hiding nothing from the accessibility
    tree, on ONE line (`sr-only`'s one property the overlay must keep, the re-review below); MEASURED in
    Chromium: the twin is the box, as wide as the digits and centred on them within 1px, a mutation back to
    `sr-only` fails the test, and so do a twin whose words wrap (a Range over them must report one line) and
    a twin a finger would miss (the platform's own hit test at the number's centre must land on it); (b)
    THE EAR'S SPACES — `spokenNumber` DROPS a space the formatter puts between two digits (French's U+202F,
    any U+00A0), in the twin alone: « plus de 8000 » is one number to every voice — a French page read by
    another language's voice included — and to every braille table (in 6-dot literary braille a space ends
    a number), it leaves no break point inside the number, and it is how the tiles' own sentences already
    write it; the dots and commas of ro, de, it and en are untouched, and the visible digits keep the page's
    own spacing (first built as a plain space, dropped on the re-review); (c) THE TITLE NEVER SPLITS A WORD —
    `hyphens-none` on the band's SectionHeading (DoctorProfile's „Despre {name}" precedent): „confir-mată"
    no longer breaks on phones; the longest title word (Italian „Un'esperienza", 13 characters) fits the
    241px column at 320 — and `wrap-anywhere` beside it is the belt (the re-review): a word too long for a
    line by itself, at a larger default text size (~175 % by the reviewer's arithmetic) or a 200 % zoom on
    a phone, breaks instead of pushing the page sideways; at an ordinary size it breaks nothing. MEASURED by the same
    differential re-shot after the three fixes: the same cells move against develop and no other (the
    flicker families aside — 8 cells of 1–9 px, a different set from the first shoot's); the twin's overlay
    paints nothing — at 768 and wider every band cell differs from develop by exactly the first shoot's
    pixel count — and only the title's breaks changed: at 320 the Romanian and the German titles take one
    line more, +36px („Experiență / confirmată în / timp" where „Experiență confir- / mată în timp" stood),
    and at 390 the German „bestätigte" moves whole to the second line at the same height; `text-balance` on
    the title is the one-class lever for the lone „timp" — the owner's. NOT changed, by the
    planner's judgment on that delegation: the centred tiles and the faint disc (no AA criterion, and the
    look the owner had just called perfect). **The re-review (an Opus a11y-architect over the three fixes,
    the same day): APPROVE WITH CHANGES, 0 critical / 0 high.** Its one MEDIUM, folded test-first: the
    overlay had lost `sr-only`'s `white-space: nowrap`, so the spoken words wrapped inside the digits' box —
    „peste" over „3.000", the one-line test reading tops 7 and 65px on the unfixed island — and a screen
    reader reading by visual line would split the number from its word or run the two together; the twin
    is `whitespace-nowrap` since. Its LOWs, folded: the hit test pinned (pointer events on, and
    `elementFromPoint` at the number's centre IS the twin — a `pointer-events-none` or a z-index change would
    otherwise pass every box assertion while a finger fell through), the spoken grouping DROPPED rather than
    made plain (b), the title's `wrap-anywhere` belt (c), the doctor page's twin play spoken through
    `spokenNumber` instead of raw Intl; RECORDED, not changed: Firefox's exposure of opacity-0 text (the
    owner's calls below). MEASURED after the folds: the four groups' 54 cells re-shot at ZERO tolerance
    against the baselines recorded before them — 54 identical, the twin invisible and the belt idle at
    every ordinary size, so the baselines stand. Gates at the seal, after the folds and the rebase onto
    develop 6630f9f: prettier · eslint · tsc clean; vitest 142 files / 3 505 tests in CI's condition (the
    optimizer's variant folders hidden); build-storybook and `next build` green; e2e 118 passed / 36
    skipped. **The owner's calls, recorded:** the
    three real numbers (one line each in lib/team) — LEFT AS PLACEHOLDERS on that word; they become the CLINIC'S headline claims on Home, and
    nothing blocks a develop → main promotion while they are placeholders (the release gate recorded in
    round 3 was never built); the tiles stay CENTRED under a start-aligned opener (the owner named the
    eyebrow and the title; start-aligned tiles are one lookup away); its name, „Experiență confirmată în timp", does not say whose
    experience — on Team it follows three staff names; a tile already on screen at a reload counts from 0
    once (StatNumber's accepted trade-off, likelier on Home after Back — skipping the count when the first
    intersection is there at mount amends D31); Home and Team read the doctor page's own keys — a
    doctor-only rewording would reach them (the twins' region-name plays would catch a broken key; a neutral
    `team.stats.*` group is the lever); one iOS VoiceOver listen (touching the number — fix (a) above made
    it findable by construction, a real device confirms it — and stepping through it by character, which
    `select-none` might refuse in WebKit: if it does, that class goes) joins the listen §15.25 already owes,
    and so does one NVDA + Firefox browse-mode read of a tile (Firefox may keep an opacity-0 node in its tree
    marked INVISIBLE — the re-review's one unverified risk, and the reason to listen); the tile descriptions hyphenate inside a word („fieca-re",
    „dedica-re") — §15.14's site-wide rule, the same on every doctor's page today; NOT `hyphens-none`,
    which would leave a German compound („Einfühlungsvermögen", about a tile wide) to break with no
    hyphen at all under the descriptions' `wrap-anywhere` (the Opus a11y review) — the levers are a later
    start for the three-across row (`@2xl`) or a hyphenation limit (`hyphenate-limit-chars`, Chromium
    only); on the page ground the white disc all but vanishes (1.05:1) and its `line` ring is
    the edge — a darker ring is one class; the patients sentence's „profesionalism" echoes the CMSR guide's
    „servicii profesionale" — the scan passes it, as on every doctor's page; the band keeps its name,
    `DoctorStats`, while it shows the clinic's numbers on two pages — a rename is a cross-repo prose sweep, not
    taken in this lane.

    **Round 6 — THE OPENER ON A LAPTOP AND A DESKTOP (owner, 2026-10-01, four looks in one lane,
    `rework/doctor-intro-desktop`; sections/DoctorIntro's D62–D64 paragraphs carry the arguments and the
    measurements):** the phone and the tablet untouched on the owner's word ("on phone and tablet it's perfect
    how they behave and look now, so i want to mentain that") — every change spelled in `@3xl:` tokens and the
    stack pixel-identical to develop at 320 / 390 / 768 on five pages. (1) **TWO CONTAINERS (D62):** "one big
    container … in it there are another 2 containers. one handles the image … the other … is also split into 2
    containers that sit one above the other. the top one handles the heading and eyebrow and bottom one handles
    the "philosophy" … philosophy has to have same space between it and headings and eyebrow contianer as to
    bottom of container it is within … both heading and philosophy are sticky to left side of respective
    containers": the grid across the whole column, a picture track and a words track; in the words a flex
    column — the pair on top, under it the bottom container (`flex-1`, a one-track grid, `content-center` over
    1.5rem above and below), so the space over the card always equals the space under it. The `align` axis and
    its `lowered` seat (rounds 2e–2l, D54) RETIRED — the prop, its table, three stories and the page's
    `align="lowered"`, one change (§6.6) — and round 2k's centred, content-sized pair with it; the name and the
    specialty balanced when they wrap beside the picture („Dr. Malea (Sabău)" / „Oana Bianca"). (2) **THE
    SPACING AND THE CARD (D63):** "15% extra space on ledft side of picture and 250% more space between photo
    and right container. disregard before mentioned sizings in contaners, procentages etc" · "make filozofia mea
    card stay a little more to the right and like 30% wider": numbers read off the column (`cqi`) — an inset of
    15 % of the page gutter (`min(1.875cqi, 1.875rem)`), the picture a THIRD of the column, the gap a sixth of it
    clamped to 3rem–10.5rem (3.5 × D62's 3rem), the card's track 36rem (28rem × 1.3), and the name a quarter of
    the way down the picture ("media aritmetica" between develop's top and the previous look's middle). The
    card's title follows its width: 36px from ~1366px windows up, 30px at 1024 and 1280 — §15.24's card rule, and
    the "wider words column" road of G2-R2 tier 1's open call on that title. (3) **ONE FLOOR, ONE LEFT EDGE
    (D64):** "heading and filozofie have to have same offset … currrent positioning is good, but at same time
    image is separated as asset and has to adjust height wise while both large containers share same floor":
    the name joins the card's 1.5rem (the words' container's `ps-6`); the name's offset is spelled from the
    column alone (`pt-[calc(100cqi/9)]`, the same pixels for every 3:4 cutout); and the cutout leaves the row's
    sizing — absolutely placed in its container, which stretches to the row and never falls under the cutout at
    its third — drawn as tall as the row, centred on its third, standing on the floor the words stand on, up to
    1.4 × its third wide (`object-contain` + `object-bottom` past the cap). MEASURED on the built page (the
    longest name the clinic ships, Romanian, classic scrollbar): 449 × 598 at 1280 (1.33 × its third), 445 × 593
    at 1500; at 1920 and 2560 the picture at its third is the taller container and nothing grows; at 1024 the
    cap binds and the figure stands on the floor with 146px of air above it; at every width the two floors are
    0px apart. The cutout takes `variant="plain"` now and spells `artwork`'s recipe as its stacked geometry
    (ui/Image's own rule for a consumer whose geometry differs), its `placeholder="empty"` explicit; `sizes`
    hints the cap (`calc(80vw * 7 / 15)`) with every `vw` after a `(` — Next's `getWidths` reads a
    space-preceded `vw` as a floor and dropped the phone's small files in D62's first spelling (pinned by a
    test). On the result, the owner: "for the moment it feels perfect". Two belts from the review (below): the
    words' track is `minmax(auto,1fr)` — never narrower than the pair's longest unbreakable run, so at the
    step's narrowest (~979px: ~346px for the pair, seven `hero` ems) a long name token (the team-data test
    allows sixteen characters, written for the phone; none ships) makes the PICTURE's track give way instead
    of crossing into the gutter — no pixel moves for any real name, and a new `AtTheStep` play pins the give;
    and the words' container is `@3xl:relative`, so it would paint above the cutout should they ever meet.
    **RECORDED, the owner's calls:** the demo figure's shoulders reach up to ~17px past the column's left edge
    at 1024–1366, where the top bar's edge stands; "same offset" was read as the name joining the card (the
    other reading is the same token one box down); the darwin cells are below. **Reviews (three Opus
    reviewers — react · typescript · a11y, §15.30's rule):** react APPROVE, typescript and a11y APPROVE WITH
    CHANGES — 0 critical / high / medium, 16 low, every one folded but one nit (a cast-free style type,
    declined for the `as CSSProperties` precedent; the unit test pins the style's two keys): the words'
    `auto` floor with `AtTheStep` and the words' `relative` (a11y); the picture's third capped at the
    cutout's own width — `--cutout-width`, so no window draws the 900px file larger than it is, which a
    third did past ~3115px (react); the `sizes` numbers derived in a unit test from the gutter, the step and
    the cap; the page twin naming the name layout it expects; finite proportions; the real face before every
    measuring play; stale comments (all three). **Visual:** the Pages/Doctor darwin set (twelve cells, recorded
    by #129) moves at 1280 / 1536 / 1920 in RO + DE — the opener — and is stale from this merge on; its 320 /
    390 / 768 cells and every other cell are unaffected (the band renders on the doctor page and in its two
    story files alone, and the stack measured pixel-identical to develop on five built pages at all three
    widths). Sections/DoctorIntro has no darwin baseline. Not re-recorded in the lane: the machine was in
    overlay-scrollbar mode (a 0px gutter, measured) and the set is recorded under classic scrollbars — the
    owner's, with a mouse connected (§15.7).

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
    step the same day: it is `sr-only` now, the doctors band's `<h2>` being the visible opener.)* *(Amended
    2026-10-02, §15.32: the auxiliary's per-level rule is SUPERSEDED too — the staff band gained its own
    eyebrow and `<h2>`, its tiles became `<h3>`s, and the owner wants their names at his screenshot's 30px,
    so a person's name wears `band` at both levels, for both kinds: the level is the outline's, never the
    look's. Every NAME_STEP cell now says `band`; the table stays so a cell can move again.)* **A TITLE INSIDE A CARD READS ONE STEP
    UNDER A BAND TITLE (owner, 2026-09-27, accepting G2-R2 tier 1's react F1):** the `band` step answers to the
    nearest `@container`, and ui/Card is one, with 25px of border + padding per side, so a card title reaches
    36px only on a card at least 498px wide — the credo card (448px beside the picture), the 20rem schedule
    card and the price menu's „Categorii" all read 30px on a laptop, a smaller thing inside a band; the credo
    card reads 36px only where it stacks full-width on a tablet (the recorded inversion, D48). *(Amended 2026-10-01, §15.23 round 6: beside the picture the credo card's track is up to 36rem since DoctorIntro's D63, so its title reads 36px from ~1366px windows up and 30px at 1024 and 1280 — the "wider words column" road of the owner's open call.)* Not a defect,
    the rule; the arithmetic lives in Heading.tsx's `'band' JOINED` paragraph. Visual: Pages/Team, Sections/TeamRoster (the
    cards at level 2), Pages/NotFound and Sections/ContactModal's open frames change; Sections/
    PersonnelCard's own stories (default level 3) do not; the darwin re-record is the owner's (§15.7).
    *(Amended 2026-10-01, §15.25 round 2: INSIDE THE DOCTORS BAND'S SCALE — a mouse or trackpad device, a column
    of max(56rem, 896px) — every size above is its step × the band's design pixel (column ÷ 1106, up to 1.389):
    the band's h2 and the doctors' h3 names read 29.2px at the step, 36 at the 1401 window and 50 past the cap,
    the eyebrows 11.3 → 14 → 19.4px, while every other band keeps the steps above — so on a 1920 desktop the
    doctors' names (49.5px) outrank the map band's h2 (36) and the staff tiles' names (30–36) by more than
    §15.25 already recorded. The steps themselves are untouched.)* *(Superseded on Home and Team 2026-10-02,
    §15.32: every band there shares the design pixel — at 1920 the map band's h2 reads 49.5px and the staff
    tiles' names 41.3, so the doctors' h3 names EQUAL the band h2s instead of outranking them. The doctor page
    keeps the steps above; the Services page's price list joined the scale the same evening — §15.32 round 2.)*

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
    DoctorShowcase → ClinicLocation → ReviewsCarousel *(since 2026-10-01 Hero → DoctorStats → DoctorShowcase
    → ClinicLocation → ReviewsCarousel: the clinic's numbers joined after the doctors that day, §15.23 round
    5, and moved above them the same evening on the owner's word, "so first in cifre and then doctors")*.
    `app/[locale]/team/populate.ts` stays the ONE
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
    under the hero — *PULLED 2026-10-01: below the clinic's numbers, the owner's swap, §15.23 round 5*) · the
    doctor's name at the band title's own 36px · the four drafted languages · the link
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
    owner's call *(DISCHARGED 2026-10-01, §15.26 round 3: the pen's stretch is 1.3 s, six draw for
    3.88 s, no cap built; the question returns at a roster of eleven)* · the same six under the hero lengthen Home by roughly 4 000px of cards before the map
    (a lever: the band's place, or fewer doctors on Home) · **from the
    accessibility review, none a WCAG AA failure:** THE JUSTIFIED QUOTE ON ANDROID — `hyphens: auto` needs
    a dictionary for the language; Chromium and WebKit on macOS hyphenate Romanian (measured), while
    Chromium's own pattern set (Android, Windows, Linux) is believed to carry none, so a phone's justified
    lines — 226px at 390 inside the lanes — may show wide word gaps there: NOT verifiable on this
    workstation, the owner's to look at on an Android phone; the lever is `@md:text-justify` (start-aligned
    on a narrow card) · THE STAFF TILES HAVE NO GROUP LABEL, and from a ~670px window the doctors' level-3
    names (36px) outrank the staff's level-2 names (30px); a heading over the tiles needs one string ×5
    *(BUILT 2026-10-02, §15.32: the staff band's eyebrow and `<h2>` — two strings ×5 — over tiles whose names
    are `<h3>`s, so no level-3 name outranks a level-2 one)* ·
    IN FORCED COLOURS the card's one button loses its face (measured: no border, no shadow — link-coloured
    text; the card keeps its 3px border): item 23's parked ui/Button follow-up, `forced-colors:border`,
    now on the only way to a doctor page · a WRAPPED `lg` label fills the button's 56px exactly (two
    28px lines), a small `py` is the look's lever · one LISTEN is owed on iOS VoiceOver — the list
    ("list, N items"; Chromium's tree exposes exactly that, measured) and the phone's reading order.
    **Round 2 — THE SCALE (owner, 2026-10-01, verbatim: "so about the doctors component with the line. i like
    how it looks on phone and tablet and i want to keep that unchanged. but on  laptop and desktop if you make it
    bigger/smaller in width it gets highly disproportioned. i want card and component and all contents to adjust
    in size harmonically all at once and mentain raports as on following sizes: 1401x1063. i might even make it
    myself smaller for it to fit in a different container or smth but i think i'd want same rations to still
    remian. no fable reviewers, all you delegate must be in opus on max"; lane `rework/doctor-band-scale`, every
    delegated agent on Opus at max effort):** THE PROBLEM, MEASURED on develop's export (a 1063px-tall window, the
    classic 15px scrollbar): the words, the picture and the button are rem while the card follows the window, so
    the band held its proportions at ONE width — the card's height ÷ width 0.679 at a 1136 window, 0.557 at 1401,
    0.392 at 1920, 0.283 at 2560; the picture ÷ the width 0.322 → 0.260 → 0.189 → 0.134; the quote's size per
    mille of the width 20.1 → 16.3 → 11.8 → 8.4 — and the ribbon's gauge followed the column while its side
    waves followed k^−0.6 and its lanes carried px offsets, so a wider card wore denser waves. THE DECISION: on a
    MOUSE OR TRACKPAD device — a laptop or a desktop; the owner's answer when G2 found landscape iPads inside
    the first cut's range (2026-10-01, asked "how should tablets be treated?": "Touch devices unchanged") — from
    a column of max(56rem, 896px) — about a 1120px window, 1139 with a classic scrollbar: the Container's named
    `@4xl` step, the first past the card's own two-column flip at an 893px column, floored in px so a smaller user
    font cannot start it on a tablet-wide column — the WHOLE band (eyebrow, title, the ribbon, every card and
    everything in it) is ONE design drawn at the owner's 1401 window and scaled to its column: every length is its
    length at a 1106px column (the 1401 window's: 1401 − 15 − 2 × 140.1 = 1105.81, measured) × column ÷ 1106.
    BYTE-IDENTICAL on every phone, on every touch tablet held either way, below the step, and in an engine that
    cannot register custom properties (Safari before 16.4, Firefox before 128 — there the design pixel would be
    pasted as text and the cards' contents drawn at ≈0.865 of the design, measured by G2). CAPPED at a 96rem
    column — 1536px at the default root, the 1920 window's (§7's largest sampling point; "laptop and desktop") and
    in rem so the step and the cap keep their ratio at any root font: beyond it the band stops growing and centres
    in its column. CONTAINER-RELATIVE, the owner's "make it myself smaller": in a narrower
    container the same band, smaller, the same proportions (the NarrowContainer story). DoctorShowcase D10
    carries the levers — REFERENCE 1106, CAP 96rem (1536px at the default root), STEP max(`@4xl`, 896px), GATE
    `scalable:`. THE MECHANISM — no prop, no new
    component: (1) globals.css THE DESIGN SCALE — Tailwind v4 compiles every utility to its theme variable (`p-6`
    is `calc(var(--spacing) * 6)`, read off the built sheet), so a NEW `@utility design-scale` remaps every
    default LENGTH step (--spacing, --text-xs…9xl, --container-3xs…7xl, --radius-xs…4xl, --radius-soft), the
    box's font size and the ribbon's unit to multiples of `--scale-px`, a REGISTERED `<length>` (unregistered, its
    `cqw` is measured again against whichever card reads it — 86.48 where 100 was due, probed in Chromium and
    WebKit, which agree to 0.001px); the band's rhythm box declares `scalable:@4xl:@min-[896px]:[--scale-px:
    calc(min(100cqw,96rem)/1106)]` and `scalable:@4xl:@min-[896px]:design-scale` with `mx-auto
    scalable:max-w-[96rem]` — `scalable:` a custom variant in globals.css, `@supports (color: rgb(from red r g
    b))` (relative colour syntax shipped with `@property` in Safari 16.4 and Firefox 128, after it in Chrome 119 —
    read off caniuse-lite) × `@media (pointer: fine)`, spelled once; tests/unit/design-scale.test.ts holds every
    multiplier to Tailwind's own default (rem × 16) and the regime to one spelling, and
    tests/unit/soft-corner-census.test.ts counts one VALUE now (the remap is the name's second declaration).
    (2) ui/Ribbon THE UNIT — a registered `--ribbon-unit` (100px, lib/ribbon-model's UNIT_PX) is the ribbon's
    card unit: the COLUMN's px constants became unit fractions (byte-identical at 100px, measured at 243 widths
    in both engines; `var(--ribbon-unit,100px)` keeps today's column where `@property` is missing),
    lib/ribbon-layout's `placeColumn(cards, unitPx)` and lib/ribbon-draw convert with the computed unit (the
    boxes, the placement, the shadow, the rebuild key), so a ribbon inside a scaled design is the REFERENCE
    ribbon scaled — the same waves, the lanes × s; the head and tail room follow the unit (0.16 and 0.76 of it:
    1rem and 60px + 1rem at the default root, no longer growing with a larger user font). (3) ui/Card's FRAMED
    padding in the spacing step, `p-[calc(var(--spacing)*6_-_2px)]`, the 3px frame KEPT: an engine FLOORS a
    border to whole device pixels (measured: 4.5 → 4, 2.9995 → 2) and a frame spelled in the step lost a whole
    pixel at the owner's own 1401 window, so the frame stays a px border and the padding carries the step — THE
    SUM RULE exact at any root and in any scale (six steps + 1px); a frame that grows in whole pixels (a
    `supports`-gated `round()`) is the recorded lever. (4) PersonnelCard D19 — the INSET subtracts six steps
    instead of 1.5rem, the cutout asks `sizes="(min-width: 70rem) and (pointer: fine) 21vw, 18rem"` (CUTOUT_SIZES — a touch
    tablet's cell stays 18rem, so it asks 18rem; the preload link
    carries it). MEASURED AFTER (the e2e on the built export, /ro/team/ and /de/, classic scrollbar): the 1401
    window s = 0.99983, the first card's height ÷ width 0.5572 (develop's 0.557); 1140 → s 0.811 · 1280 → 0.912 ·
    1536 → 1.097 · 1920 → 1.375 · 2560 and 2800 capped at 1.389 (the band 1536 wide, centred); the worst drift
    from the 1401 window's ratios over six cards and every window: height ÷ width 0.12 %, picture 0.004 %,
    quote 0.0006 %, name 0.0003 %, link 0.003 %. The quote reads 14.6px at the step, 16.4 at 1280, 19.8 at 1536,
    24.75 at 1920 and 25.0 past the cap; the name 29.2 → 50.0. RECORDED FOR THE OWNER, each his call: (a) ZOOM,
    WCAG 2.2 SC 1.4.4 (the F94 pattern) — browser zoom narrows the window in CSS px by the factor it enlarges
    them, so inside the regime the band's text keeps its size on screen until the zoomed column drops under the
    step: on a 1920 screen the quote is 24.75 device px at 100, 125 and 150 %, 31.5 at 175 % and 36 at 200 %
    (×1.45); on a 1440 laptop 18.5 at 100 and 125 %, 27 at 150 %, 36 at 200 %; on a 2560 screen 25.0 → 31.25 at
    125 % → 33.1 from 150 to 225 % → 45 at 250 %; THE FLOOR (G2 a11y, verified) is a screen of ≈2240–2560px,
    where 200 % draws the quote at only ×1.17–×1.32 of 100 % — a 24″ iMac at its default resolution (2240) reads
    25.0 / 27.5 / 29.2 / 29.2 / 29.2 / 29.2 / 45 at 100 / 110 / 125 / 150 / 175 / 200 / 250 %: four zoom
    presses that leave it unchanged. A first cut capped at the 2560 window's column made zoom SHRINK the text
    there (34.9 → 33.1) — the reason the cap is the 1920 window's; and the cap being rem, the gutter can no
    longer make it shrink at any root. ONE shrink remains, AT THE STEP, for roots under ≈13px: the px floor holds
    the regime's quote at 14.6px while the theme's quote below the step is 13.5px at a 12px root — on a 1366
    laptop at a 12px root it reads 17.54 / 17.56 / 16.88 / 20.25 device px at 100 / 110 / 125 / 150 %, one zoom
    press ≈4 % smaller (measured on the final build).
    Firefox's "Zoom Text Only" multiplies every font size, px ones included, so there the band's words grow
    while its boxes keep their size and the words reflow inside the card. Levers: CAP, STEP, a cap at the
    REFERENCE (the band never grows; 200 % then reaches the theme's own 36px everywhere but on ≈2260–2780px
    screens), a floor on the design pixel. (b) The user's DEFAULT FONT SIZE is not followed inside the regime
    (§7's exception): the step and the cap are rem, so a larger root moves the regime's start and its end
    (a 20px root from a 1120px column), but inside it the design pixel is the column's, not the font's — a
    20px-root reader at a given column gets the 16px-root band's sizes; a SMALLER root cannot start the regime
    under an 896px column (the px floor), so the scale never drops under 0.81 on a tablet-wide column (G2
    react measured 0.61 at a 12px root before the floor). (c) THE STEP is a jump: 1–3px under it the unscaled
    TWO-column card at 18px (it stacks only below an ≈893px column), 1px over it the same card at 14.6px.
    (d) Source Serif 4's optical sizes (`font-optical-sizing: auto`) set larger text a little narrower per em (a
    word box 3.3 % under × s at × 1.389) — kept, the 1401 look being the owner's: the card ratios hold to 0.12 %
    while every quote is SHORTER than its picture; a quote taller than the picture can gain a line at s < 1 and
    lose one at s > 1 — ≈±4 % of the card's height ÷ width, measured by G2 react with quotes ×5 — so with real,
    longer biographies the band is the 1401 design to within a line of text; the lever is pinning the optical
    size inside the regime to each text's DESIGN size (the quote at `'opsz' 18` — measured by G2's verifier at
    0.004 % on the 1401 look, with no re-wrap from 1140 to 2560; `font-optical-sizing: none` would cost ≈2 %). (e) The bare `.design-scale`
    rule ships (≈0.4 KB gzipped): every mention of the word generates it — accepted; a test sets its design pixel
    with an inline style, never an arbitrary class (two dead rules found and removed). (f) PAGE-SCALE (the
    uncommitted whole-page root scale, `rework/page-scale`): if it lands, its 64rem column cap and this REFERENCE
    must be reconciled — REFERENCE = the capped column (1024 at the default root) moves the two together.
    (g) `refactor/ribbon-tucked-tail` (#130) edits the same COLUMN and `placeColumn`: whichever merges second
    rebases, and the tuck's tail room `0.13 × --ribbon-k + 8px` becomes `+ 0.08 × --ribbon-unit`. (h) THE GUARD'S
    AIR: the ribbon's keep-outs grow by M/2 card units — 4 CSS px at the default unit, 4·s px inside the scale
    (3.24px at s 0.81) — while a focus ring stays 4px, so inside the scale it is the model's own clearance M
    (8·s ≥ 6.5px) that keeps the strip off a ring: measured closest approach to a name block 7.33px at s 0.811,
    nothing crossed. (i) The headings: §15.24's amendment records the band's sizes against the other bands'.
    **Visual,
    MEASURED** at zero tolerance against a pristine build of develop 6630f9f (456 cells, a private port): exactly
    the declared 18 cells move — Pages/Home and Pages/Team, Romanian and German, at 1280, 1536 and 1920 (the band
    inside the scale) and Sections/DoctorShowcase's six stories at 1536 — plus 2 NEW (NarrowContainer at 390 and
    1536); every 390, 320 and 768 cell and every UI/Card, UI/Ribbon, PersonnelCard, ReviewCard, ReviewsCarousel,
    DoctorIntro and DoctorProfile cell is byte-identical (the framed padding's new spelling and the ribbon's unit
    are pixel-identical at the default root); the PriceList and SpeedDial cells that differed by 1–9px differ on
    pristine develop against its OWN reference too (7 of 31 on a re-shoot) — the harness's known flicker. THE
    DARWIN SET, at the seal (the owner: "just create pr"), on the tree rebased onto develop 04599e1 (#129–#132,
    the tuck among them) under classic scrollbars (the site's gutter measured at 15px): this lane's 20 cells
    recorded and verified — Pages/Home and Pages/Team, Romanian and German, at 1280, 1536 and 1920, the six
    Sections/DoctorShowcase stories at 1536 and NarrowContainer at 390 and 1536 (new). FOUND, NOT THIS LANE'S,
    left as develop has it: 58 stories with no darwin baseline at all (Sections/DoctorCourses, DoctorIntro,
    DoctorProfile, TintedBand; some UI/Heading, UI/Keyword and UI/Text stories) and 28 stale cells
    (Pages/Doctor and Pages/NotFound at several widths, Sections/ReviewCard, Sections/SectionHeading at 1536,
    UI/Button's Hover Outline, UI/Glyphs' Gallery) — every one of their components pixel-identical under this
    lane at zero tolerance (above), the staleness from the PRs merged since. **G2 — three Opus reviewers at
    max effort (react-reviewer, typescript-reviewer, a11y-architect), every finding above LOW handed to an Opus
    verifier told to refute it:** react APPROVE WITH CHANGES — it compared every box of the band (97 elements) at
    eight widths against the 1401 window × s and found no length that does not scale beyond the ones named here,
    and swept 186 loads in Chromium and WebKit (1132–2600): the ribbon painted, never sideways, LCP still the first
    cutout, +709 B gzipped of CSS; typescript APPROVE WITH CHANGES; a11y REQUEST CHANGES. VERIFIED REAL, every one
    MEDIUM, every one FOLDED: landscape tablets inside the first cut's range (A1/R1 — the owner's answer, the
    `scalable:` gate); an engine without `@property` drawing the cards' contents at ≈0.865 (A3/R5 — the gate's
    `@supports`); the zoom record's floor (A2 — the 24″ iMac); real-length quotes re-wrapping under optical sizing
    (R2 — record (d); the e2e holds the card's structure, not its wrapped text); the e2e's 1401 check failing under
    overlay scrollbars (T1/R3 — derived from the measured gutter). The LOWs, folded too: the cap in rem (T2), the
    step's px floor (R6), `placeColumn`'s unit required and validated (T3), the census reading every `@theme` block
    and named spacing keys (T4), CUTOUT_SIZES tied to the band's numbers by the census and to the pointer (T5/R7),
    the tile-edge bound 2.5 (T6), tighter e2e ratios (T7), the guard's air and record (c) corrected (T8/R8/A4), the
    comments that shipped dead rules reworded (R4), §15.1, §15.24 and ui/Button's zoom sentence amended (A5), the
    NarrowContainer outline drawn inside its box (A6). RECORDED, NOT BUILT — the owner's: Tailwind scans markdown
    too, so a class spelled only in these docs (MIGRATION_INVENTORY's old Card row still names the framed tone's
    first padding) ships a dead rule; an `@source not` for `*.md` in globals.css would end that whole class of
    leftovers, a site-wide one-liner. **Evidence at READY** (the main loop, on the final tree, the scrollbar's
    gutter checked at 15px first): tsc · eslint · prettier clean; vitest 143 files / 3469 tests, the same with
    the optimizer variants hidden (CI's condition); build-storybook and `next build` green, the built sheet's
    regime rule inside `@supports (color:rgb(from red r g b))` and `@media (pointer:fine)`; e2e 133 passed /
    52 skipped and one timeout in the price list's reading-line spec while four heavy jobs shared the machine —
    the spec passes alone, 32/32, and the band agent's full run on the same build was 134 passed / 0 failed;
    the visual differential re-run on the final tree moves the same 18 cells by the same pixel counts (the
    gates change nothing a fine-pointer Chromium draws), the NarrowContainer story only by its outline, now
    drawn inside the box, and nothing else beyond the known flicker. AT THE SEAL, rebased onto develop 04599e1:
    tsc · eslint · prettier clean; vitest 143 files / 3691 tests; build-storybook and `next build` green; e2e 134
    passed / 52 skipped / 0 failed.
    *(Amended 2026-10-02, §15.26 round 6: the band gained one class of its OWN under the regime's chain —
    DoctorShowcase D11, `--ribbon-width-share: 0.7`, the chain re-spelled in the band's own rhythm string, the
    shape §15.32's census allows — so on a laptop or a desktop the band's ribbon is drawn 30 % thinner, the
    owner's "on desktop, laptops whatever screen larger than tablet make it 30% thinner"; every touch device and
    every column under the step keeps its whole width.)*

26. **Floss-ribbon run — DECIDED (owner, consult board `.claude/plans/ribbon-3d.plan.md`, five rounds on
    2026-09-29, fb-489 … fb-513; contract board `.claude/plans/ribbon-floss.plan.md`, approved in the chat
    on 2026-09-30, verbatim: "you run the reviewers now. if you useless, discard. i want no dead code. a the
    ribbon alone and i approve everything else"; item 25 is the doctor-showcase lane's, which MOUNTS it):** a
    DECORATIVE ribbon that wraps a column of cards — down into each card's top corner, round its edge, along
    the top lane as a calm wave *(A LOW RIPPLE — valley, crest, valley — since round 3, 2026-10-01)*, behind the card, back round the opposite edge, down the side lane to the next
    card, which it wraps mirrored — painted on ordinary 2D canvases and DRAWN LIVE, card by card, as the visitor
    scrolls. It began as the owner's own design package (a verified mathematical model, pasted 2026-09-29) and
    REPLACES the straight connector of 2026-09-25 (lane `feat/ui-ribbon`, never committed), of which it keeps
    the two colours and the two component names.
    **The look, each decision in the owner's words:** the thickness is a RATIO of the card ("absolutely
    perfect … exact thickness and prominence … the same on every device as ratio", fb-489) and the ribbon has
    NO LOOPS (the same annotation) · the hook sits lower ("place it lower a bit. like 100% lower", fb-492) ·
    the entry sways ("must also be superficially waive, so not a straight line, make it a little wayvy",
    fb-494) · the phone is BOLDER ("b all day here, looks way better", fb-501) · the tail "ends in the air all
    day" (fb-504; the planner's tucked tail was rejected — REVERSED by the owner on 2026-10-01, round 5 below:
    the tail tucks under the last card, the first card's start turned upside down) · ONE look ("looks perfect now, I do not need
    alternatives or rebuilds", fb-505) · NO DOT on the ribbon (fb-475, the connector's board) · colours
    `--ribbon-light` `#8377a3` and `--ribbon-dark` `#2d263c`, both from the old site's palette, raw tokens
    with NO utility name (nothing paints with a class; the painter reads them) — ONE colour since round 2,
    below: `--ribbon` `#8377a3`, and `--ribbon-shadow` `#2d263c` for the shadow alone — and since round 6
    (2026-10-02) `--ribbon` `#d4cfdc`, the lilac band's ground, under a light ANCHORED to show it.
    **The motion (fb-502, fb-503, fb-507):** "drawn while scrolling but remains drawn" — a card's stretch is
    drawn when "the fixxed center line of the screen" reaches "the center line of the card", in order, and it
    stays drawn: no undoing on the way up, no pinning, the page's scroll never touched (source-fenced by
    `tests/unit/ribbon-never-moves-the-page.test.ts`, the listener `passive`); "it's a core feature, it's
    crucial it works" on "absolutely every browser from phone to desktop"; reduced motion paints the whole
    ribbon at once, also when it is switched on mid-visit. One stretch takes two seconds *(1.3 since round 3,
    2026-10-01)*. Two additions of the
    planner's, agreed (fb-509): a card taller than about THREE QUARTERS of the screen (76 % — the planner's
    words to the owner were "taller than the screen", which was imprecise) starts when its top is 12 % under
    the screen's top *(round 4, 2026-10-01: the line is a QUARTER of the screen above its bottom — the owner:
    "move it at the 25% of the bottom of the screen, not at the half of the screen" — and the floor the same
    quarter under the screen's top, for a card taller than the screen)*; and at the page's END every card
    still waiting becomes due, in order — on a page that
    cannot scroll, at load. Two behaviours came with the prototype the owner approved by feel (fb-511, "moves
    good"): the pen HURRIES when cards wait (1.25 s a card with one waiting, 0.91 s with two), and a card
    already above the screen at load is simply there. **SC 2.2.2 (Level A), by arithmetic and pinned:** one
    stretch never repeats and nothing moves afterwards; n cards due at once draw for 2 s × Σ 1/(1 + 0.6 j) —
    3.25 s for two (the roster today), 4.87 s for four, 5.46 s for FIVE *(round 3 set the pace at 1.3 s: 2.11 / 3.17 s,
    3.88 s for the six real doctors, the five seconds reached at eleven — the WAIT trigger below is discharged)*.
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
    painted: a card's canvas also holds the NEXT card's entry (its drop-in and its hook — the FIRST card's are
    built and never drawn since round 4). The first build
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
    bound on SC 2.2.2 by construction when the roster reaches FIVE doctors *(FIRED at six on 2026-09-30,
    DISCHARGED by round 3's pace on 2026-10-01 — six draw for 3.88 s; it re-arms at eleven)* · the painted-pixel loop has three
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

    **Round 3 (owner, 2026-10-01 — one day, four messages; verbatim: "i need arefactor on the ribbon. i do not
    need it's animation per section to be twice as fast. so make the generation twice as fast" · "and i also
    feel the traversal waves at the top of he card are too much. make smthe simplier more phisically pkausable
    there" · shown a straight run at 1 s: "speed is too fast. make it 30% slower now. that raectangular
    traversal section looks absolutley horrible. what i meant iwth a more natural, phisically plausible look i
    mweant to round it like idk a second degree function until the point wher eit curs to go behind the card
    and to make the imbination look find and also extremley important, find a way for it to be adaptable with
    screen widening and tightening, so for it to be adaptable in fucntion of screen type" · shown that bow:
    "when ribbon is generated, so as you scroll as ribbon comes up, it's shadow is squareish and after a while
    it rerenders and transforms intoa a smooth one. i want it directley generated as smooth … it is like a
    shadow aura, but drawn as a balcony below it outside the ribbon" and "the horizontal section looks too
    plain low still, i need it now to have 3 waves … the parabola top pointed downwards, then … pointed
    upwards and then … downwards again … pretty low, pretty smooth and whole section has to stay inbounds of
    the card … like some pretty well distributed nortmal distributions … slightly different widths so that
    they do not look that mechanical … bind with each other in a harmonised manner"; lane
    `refactor/ribbon-pace-top-run`):** (1) **THE PACE IS 1.3 s A CARD.** `lib/ribbon-draw`'s `DRAW_MS` 2 000 →
    1 000 on the first sentence, → 1 300 on the third (a third slower than the 1 s he saw); the hurry (0.81 s
    with one card waiting, 0.59 s with two), the centre-line rule, the end-of-page rule and reduced motion are
    as they were. "The generation" was read as the drawing itself — the per-card animation IS how the ribbon is
    generated — and the "30% slower" confirmed the reading. CONSEQUENCE, by arithmetic: six cards due at once
    draw for 1.3 s × Σ 1/(1 + 0.6 j) ≈ 3.88 s (2.11 s for two, 3.17 s for four), so §15.25's FIRED SC 2.2.2
    trigger — 5.96 s for the six real doctors at 2 s — is DISCHARGED with no cap built: the criterion's five
    seconds are reached at ELEVEN cards due at once (ten draw for 4.83 s), and a roster of eleven re-arms it.
    `ribbon-draw.test.ts` pins six under 5 000 ms. (2) **THE TOP RIPPLE.** The top lane's calm wave — four to
    five humps riding over a desktop card's top edge, rolling as they went, with a bulge towards the viewer —
    is replaced by a LOW RIPPLE flat on the face: three bumps of normal-distribution shape, a VALLEY, a CREST
    and a VALLEY, centred at 0.22 / 0.52 / 0.79 of the run with standard deviations 0.10 / 0.115 / 0.095 of it
    (not quite even, not quite alike — "not mechanical"), their sum levelled at both ends, and the two corner
    arcs easing the ribbon only to the ripple's own end slopes instead of to horizontal, so fold, arc, ripple,
    arc and fold are one tangent-continuous curve with no flat stretch. Two shapes were built and shown FIRST
    the same day and rejected: a straight run ("rectangular … horrible") and one parabola ("too plain low").
    ADAPTABLE BY RULE, not by breakpoint: a valley hangs DIP = 3 % of the run and the crest rises CREST = 1.5 %
    of it — "pretty low" — and never more than the ROOM the top lane leaves above its floor (the lane, less the
    ribbon's depth at the deeper end, its half width and the air M = 8 px) nor more than the HEADROOM under the
    card's top edge (the ribbon's depth at the shallower end, less its half width and HEADROOM_AIR = 0.04 k):
    "inbounds of the card", clear of every word. MEASURED on the six recorded cards (run / valley / crest): a
    1280 window 715 px / 20.8 px / 5.6 px (the crest headroom-bound: its upper edge 3.2 px under the card's
    top edge; the valleys' lower edge 8 px above the lane's floor), a 1920 window 1 078 / 31.4 / 8.4, the
    tablet 392 / 11.8 / 3.8, the phone 167 / 5.0 / 2.5, the narrowest 117 / 3.5 / 1.7; the corner arcs turn
    about 31.7° instead of 35°. The end slopes, the chord, the room and the headroom depend on one another
    through the arcs, so `buildCard` solves them as a fixed point (forty iterations of a contraction, the
    bumps' sizes scaled each time so the profile's real extremes meet their caps). The side wave is untouched.
    In `lib/ribbon-model`: a NEW segment kind `'ripple'` (`SegmentKind` is public; the painter cuts it 32 to
    the unit like a wave), the builder `ripple()` over a `Profile` and `rippleShapes()`, the atom `rippleTop`
    (`AtomName` is public; `waveTop` would lie), the design constants `RIPPLE`, `DIP`, `CREST`,
    `HEADROOM_AIR`; the bonded branch of `wave()` — the envelope `rise()`, the phase reference `REF`, the
    base-line shift, the shear's bonded form, `TOP_WAVE` — is DELETED (the approval's own rule, no dead code),
    `WaveShape` is the free shape alone. The lane rule is unchanged (`lanes()` ↔ ui/Ribbon's CSS pins hold), so
    no card's padding moved; a higher crest is a LANE decision (the headroom binds everywhere). THE RECORDS,
    re-written from the port — the record's own rule, the third time: on every card the `t` segment is a
    'ripple', the atom `rippleTop`, the two arcs beside it shorter, S and every later start a little longer,
    every sample from the lead arc on moved, and the HEADING of every sample before the run by 5.1e-5 rad (the
    old wave's finite-difference heading at its start was not exactly zero, and a segment's start value is
    added to every point before it); the twist, the hidden S and the entry did not move. In the painter's:
    every card's count, total effort and nine sample indices. Pinned: "ripples along the top lane — a valley, a
    crest, a valley — low, and inside the card" on every recorded card (exactly those three turning points in
    that order, level ends, the valleys ≤ 3 % and the crest ≤ 1.5 % of the run, the upper edge ≥ 0.04 k under
    the top edge, the lower edge ≥ M above the lane's floor); the width-vector test holds the ripple to 1e-3
    like a straight (its heading is analytic); the smooth-beside-a-keep-out suite and the seeded sweep walk the
    ONE wave a card has now. (3) **THE SHADOW IS PAINTED, NOT FILTERED.** Until this round each canvas wore a
    CSS `filter: drop-shadow(…)`; REPRODUCED from a video of the built page in headless Chromium (a screenshot
    forces a fresh raster and hides it, as the owner found): two seconds into a stretch the frame shows a faint
    rectangular shade over the whole card — the engine's shadow of the canvas's BOX, not of the ribbon — with
    the ribbon not yet composited at all, and the real per-pixel shadow only once the canvas holds still.
    `lib/ribbon-paint` now paints the shadow: the one piece loop painting and outlining share (`piecesOf`),
    `outlineStretch` (a stretch's visible pieces as ONE `Path2D`) and `paintShadow` (that path's drop shadow
    laid UNDER whatever the canvas holds with `'destination-over'`, the canvas's own shadow at the filter's
    offset and blur — 0 / max(1, 3k) px / max(1.5, 4k) px at 0.38 — the shape itself drawn 100 000 px above
    the canvas where it is clipped away, so only its shadow lands; one path, one shadow, no seam between
    pieces). `lib/ribbon-draw` REPAINTS a tile from what is drawn whenever a card on it moves — cleared, each
    half's drawn range painted, one shadow under all of it — instead of appending pieces; each tile is grown
    by the shadow's reach (its blur all round, its offset below) and carries no filter; the finished tiles are
    not touched; a frame's picture is the canvas's own bitmap, final the moment it is painted, in every engine.
    MEASURED (headless Chromium, software rendering — the pessimistic case): during a stretch the frame gaps
    are 11 ms at the median and 26–32 ms at the 95th percentile at 1280×800@2, 390×844@3 and 1920×1080@2,
    the worst 36–50 ms. The painter's record is untouched (the strip is the same; the shadow is not part of
    it). **Visual:** every `ui/ribbon/*` cell changes, and with them every Pages/Home,
    Pages/Team and Sections/DoctorShowcase frame on which the ribbon is painted; no other cell, by
    construction — `lib/ribbon-*` is the only runtime code that moved (round 4 measured and recorded them). **Evidence at READY:** see the lane's PR.
    **Round 4 (owner, the same day, 2026-10-01, on the round-3 pack — verbatim: "looks perfect. two more things
    to coment on. on first card and first card only of the exhibition should not have that top right
    component, because it looks like it starts from nowhere and it should just spawn as ferst step the
    traversal section" · "move lower the start animation for generating the ribbon, a little lower, because it
    starts generating it on some screens jsut after you are past it, so idk, move it at the 25% of the bottom
    of the screen, not at the half of the screen" · "on widening still just 3 waves has the traversal sectioon
    to have, not more but wider and still well connected"; the same lane, still uncommitted):** (1) **THE FIRST
    CARD HAS NO HEAD.** `lib/ribbon-draw` cuts a card's stretch at its hand-over point behind its top corner
    into a HEAD — the drop-in and the hook, painted on the canvas before — and a BODY; a head is the ribbon
    ARRIVING from the card before, and the first card has none, so its stretch is its body alone, the pen's
    effort counted from the hand-over, and the first stroke the visitor sees is the ribbon coming over the
    card's top edge into the ripple (the hidden S that leads to the edge is 0.5–2 % of the stretch at the hidden
    pace; the head that is gone was 4–15 % of the whole — MEASURED on the six recorded cards). The model still
    builds every card's whole chain (the record stands, no number moved); ui/Ribbon's head room above the first
    card — once the drop-in's — stays at `--ribbon-k` + 1rem as the band's air, so no page moved: ONE spelling
    to shrink, the owner's. (2) **THE LINE IS A QUARTER OF THE SCREEN ABOVE ITS BOTTOM** — `LINE` = 0.25 in
    `lib/ribbon-draw`, replacing BOTH the screen's centre and the 12 % floor (`TALL_LINE`): a card is due when
    its centre reaches the line; a card taller than the screen when its top reaches the same quarter under the
    screen's top — one number for both halves, so a card exactly as tall as the screen is due at the same scroll
    by either and the rule hands over without a jump. MEASURED on the built pages (the first doctor card,
    597–851px tall): with the line at the centre it was due with its top 96px under the screen's top at
    1280×800 and 76px at 1366×633 — under the header pill, which reaches 112px — and at the floor, 101px, on a
    390×844 phone; with the quarter line its top is at 294, 167 and 211px there, and at 396 / 337 / 512px at
    768×1024 / 1536×864 / 1920×1080. (3) **THREE WAVES AT EVERY WIDTH**, pinned: `ribbon-model.test.ts` builds
    717 cards — every column width ui/Container gives, 241 to 2 145px every 8px, at three heights — and finds a
    valley, a crest and a valley on each, at the SAME shares of the run (0.2175 / 0.515 / 0.794, within one
    sample): the bumps are shares of the run, so a wider card gets wider waves, never more. **Not built, the
    owner's musing recorded:** the card itself not widening with the screen but scaling as a whole ("a fix
    raported size with the rest of the screen … through rem or smth"); no lane does that today — the column
    follows ui/Container's gutters and the type stays in rem; the levers are a viewport-scaled root font size
    (every rem on the site; §7's zoom and user-font-size concern), a cap on the column's width, or
    container-unit type inside the card. **Visual, at the seal (rebased on develop `21116f7`):** exactly the 45
    cells the ribbon paints differ from develop's darwin set — Pages/Home 12, Pages/Team 12,
    Sections/DoctorShowcase 13 and the 8 `ui/ribbon/*` cells, which never had a baseline — while 29 control cells
    this lane cannot move (Sections/Footer, ClinicLocation and Hero, all recorded on 2026-10-01) match, which also
    proves the classic-scrollbar mode (a 15px gutter, probed). The 45 are RECORDED in the darwin set with
    `--update-snapshots=all` and verified 74/74 on a second run — not left stale, because the DoctorShowcase and
    Home baselines were hours old (#124, #125); Pages/Team's twelve also absorb #124's lilac button, which had
    left them stale. The linux set is CI's (`visual-baseline.yml`). **Evidence at READY:** see the lane's PR.
    **Round 5 (owner, the same day, 2026-10-01 — verbatim: "one thing i'd refactor about the ribbon. as on the
    first card of the list where it starts from behind the card, i want the ribbon to also end on the last card
    behind the bottom side of the last card tucked in behind it, not just hanging as it is now." · "you have an
    example for tucked in behind card on first card where it comes from behind the card"; lane
    `refactor/ribbon-tucked-tail`):** **THE TUCK** — the owner's own reversal of fb-504. Under the LAST card
    there is no next card, so `lib/ribbon-layout` gives it `G: null` (until that day the lanes' gap, where the
    tail hung) and `lib/ribbon-model` ends its chain the way a card's top edge is crossed, turned upside down:
    the side wave runs STRAIGHT DOWN its lane; the ribbon turns towards the card's middle until it heads β below
    the horizontal (`tuck`), goes over the bottom edge at β — the 35° of every crossing of the top edge —
    (`bfold1`), across the bottom face (`bcross`) and onto the back (`bfold2`), where the chain ends out of sight
    (the nine atoms unchanged — a tenth, `tuckOut`, had no reader and left at the review). It is NOT the consult's option B of 2026-09-29 (straight
    down and over the edge square — a flat cut seen from the front, the look the owner turned down then). **THE
    TURN IS THE HOOK'S CIRCLE** (`R_1`, 0.5 k), not the lead's 0.9 k: under a card there is no lane, only the
    card's own bottom padding (1.5rem and its border, 25px), which keeps its px while the ribbon grows with the
    column. MEASURED on the built Team and Home pages, Romanian and German, every 8px of window from 320 to
    2 560 — through the drawing's own guard arithmetic: the 0.9 k turn makes the guard withhold the whole
    ribbon on 66 of 564 windows measured every 16px, the first at 1 232px (up to 2.3px into the last row's
    margin; some 13px into a block filling the content box at the widest gauges), while the hook's circle keeps
    at least 4.5px of air beyond the words' 4px margin on all 1 124 windows measured every 8px. Also measured and set aside: 55° and 90° crossings (safe, steeper —
    90° IS option B), and drifting the side wave towards the card's edge to make the 0.9 k turn fit (it rode the
    wave's last outward hump up to 1.5px off the card). No new number: BETA and R_1 are the design's own.
    Everything above the side wave is unchanged (pinned: the chain down to `d`, and the twist); a last card must
    be taller than about 2.8 k (223px at a laptop's gauge — the real doctor card is ~550px), and a shorter one
    is refused by name, which the guard turns into no ribbon. **PINNED:** the six recorded cards rebuilt AS the
    last card pass every "the path is sound" property (continuity, no kink, the width across the travel, hidden
    pieces within 0.056 k — the bottom crossing reaches 0.05594 k, exactly the top's: the same bend — no
    keep-out entered) and the smooth-beside-a-keep-out pair; the tuck's shape on those six and the four pinned
    layouts (the wave straight down; the turn π/2 − β on 0.5 k; the 35° crossing towards the middle, 0.074 k
    inside the edge; the end on the back, where the chain closes); TUCKED — no point more than 0.056 k under the
    card's bottom edge; THE MOST A CARD CAN HOLD — a block filling the content box down to its bottom padding,
    entered by no part of the ribbon at every 8px of column from 241 to 2 145, in four bands; THE TUCK'S LIMIT
    (below), by name; and a browser pin on the stand-in column — the ribbon's own lowest row lies at the last
    card's edge and within the curl, and below it only the shadow. Each pin was MUTATION-CHECKED: the turn on
    the 0.9 k circle fails 17 tests (the block sweep and the limit among them); a hanging tail puts the ribbon's
    own lowest row 54–57px past the browser pin's reach, and a ribbon that stops above the edge (no tuck) fails
    it from the other side, 15–38px short. `lib/ribbon-draw` changes two comments
    and no code — a card's stretch ends where its chain ends, behind the card. **THE TAIL ROOM, REMOVED** (the
    owner, shown the tuck: "remove that space"): ui/Ribbon's column kept `60px + 1rem` under the last card —
    the room the tail hung in — and now keeps only what the tuck needs, its curl (0.056 k) and its shadow
    (0.03 k down, blurred 0.04 k): `pb-[calc(0.13*var(--ribbon-k)_+_8px)]`, the 8px for the tile's 2px margin,
    the shadow's floors and a pixel of rounding — about 13px on a phone, 18px at a 1280 laptop, 30px at the
    widest column, where it was 76px — so everything under the doctors band, on Home and on the Team page,
    moves up by 46 to 64px; every tile still lies inside the ribbon's box (Ribbon.test.tsx, six widths), and
    `tests/unit/ribbon-lanes-sync.test.ts` holds the room against the model's own curl and lib/ribbon-draw's
    `shadowOf` and `TILE_MARGIN` (exported for it) at every gauge of the 320–2 560 windows. The head room above the
    first card stays as round 4 left it. **G2, on the owner's word ("run opus reviews by my review
    methodology") — `react-reviewer`, `typescript-reviewer` and `a11y-architect`, each on Opus, read-only:**
    three times APPROVE WITH CHANGES, no critical and no high finding; FOLDED — the dead `tuckOut` atom (it had
    no reader), `validate` letting a null through for any field but G, a test literal that made Tailwind ship
    the old `60px + 1rem` rule as dead CSS (a class-like string in any scanned file is a class), the shadow's
    numbers retyped in two tests (now read), the pixel pin's lower bound met by the shadow alone (now the
    ribbon's own row, alpha ≥ 200), the as-last twins printing the records' "tail in the air", three
    pre-existing stale comments, and every number in a comment re-measured to the reviewers' figures. **THE
    TUCK'S LIMIT, RECORDED — the owner's call:** the turn needs the last card taller than about 2.8 k, and the
    gauge grows with the column (ui/Container has no width cap) while a doctor card hardly grows, so MEASURED on
    the built Team page the last card falls under it from a window of about 3 400 CSS px — an ultrawide screen at
    100 % — where the guard withholds the whole ribbon (32 of 84 windows from 2 560 to 3 840 refused; the hanging
    tail drew on all 84); a test pins the boundary by name (3 328 holds, 3 840 refused). Levers: the page-scale
    lane's 64rem column cap (in flight — it keeps k near 1.2 and the limit never comes), a fallback in the model
    for a card too short (a smaller turn, or the hanging tail there), or a cap on the gauge. THE OWNER, the same
    day: "Do nothing now" — the page-scale lane's cap is the lever, and nothing else is built. Near the limit the
    side wave grows very short and its joint can kink at sub-pixel scale (informational: up to the 2 560 window
    real cards stay ≥ 1.3 units above it). **RECORDED from the accessibility review, the owner's calls, no AA
    failure:** on the Team page the gap from the last doctor card to the first staff tile is now SMALLER than
    the gap between two doctors (61 against 98px at a 390 phone, 98 against 140 at 1280), so the two groups can
    read as one where the ribbon is absent (forced colours, print, a withheld column, before a stretch is
    drawn) — levers: the staff tiles' heading (§15.25's recorded one string ×5) or a bottom padding on the
    Team page's doctors band alone — the owner: "i'll get to that later" *(the heading TAKEN 2026-10-02,
    §15.32: the staff band's eyebrow and `<h2>` stand between the last doctor card and the first tile)*; and,
    older than this lane (#124's
    hover jump), a full-width stacked "Mai
    multe despre mine" grows 5 % on hover into the side lane, where its edge and ring can slide a few px under
    the side wave (SC 2.4.11 still met) — growing its keep-out by the jump is the lever. **Visual:** the cells whose ribbon reaches a last card change — every
    `ui/ribbon/*` story, Sections/DoctorShowcase, Pages/Home and Pages/Team (the last two also move below the
    band) — and nothing else, by construction (`lib/ribbon-*` and ui/Ribbon's one class string are the only
    runtime code that moved). **Evidence at READY:** see the lane's PR.
    **THE UNIT (2026-10-01, §15.25 round 2):** the ribbon's whole geometry is measured in ONE registered length,
    `--ribbon-unit` (globals.css; 100px = UNIT_PX by default): ui/Ribbon's COLUMN spells its gauge, lanes, gap and
    room as fractions of it, lib/ribbon-layout's `placeColumn(cards, unitPx)` and lib/ribbon-draw convert with the
    computed value, and lib/ribbon-model never sees it — so the doctors band's design scale (which sets the unit
    to 100 of its design pixels) draws the REFERENCE ribbon scaled instead of a new one for a wider column. At
    the default unit the column is byte-identical (243 widths, Chromium and WebKit) and every ribbon test stands.
    **Round 6 (owner, 2026-10-02 — THE BAND'S SHADE, AND A SLIMMER RIBBON ON A LAPTOP; verbatim: "important
    refactor on the color and width of the ribbon. i want it on every screen to be the shade that the background
    of "IN NUMBERS / Experience confirmed over time / The numbers below say, in short, how we work: …" is while
    also mentaining the accents of light upon it AND very important on desktop, laptops whatever screen larger
    than tablet make it 30% thinner. on tablet phone etc, the width is fine" · "i hav eeven attatched a ss with
    desired color"; lane `rework/ribbon-tint-slim`):** (1) **THE COLOUR.** The screenshot is one colour,
    rgb(212 207 220) in every one of its 30 400 pixels — sections/TintedBand's ground, `--accent-decorative` at
    30 % over `--page`, the doctor page's „În cifre" band. `--ribbon` = **`#d4cfdc`**, a LITERAL (lib/ribbon-draw
    reads it through a canvas round-trip that answers `#rrggbb`), held to the band's own mix by NEW
    `tests/unit/ribbon-tint-sync.test.ts`: the day §15.1's hue confirm moves `--accent-decorative`, that test
    names the ribbon's new value. `--ribbon-shadow` #2d263c is unchanged. (2) **THE ANCHORED LIGHT.** The token
    alone would not have done it: the approved light multiplies a colour by the light that reaches it, and a face
    turned squarely to the viewer gets about half — `#8377a3` showed on screen as rgb(97 87 114), never as
    itself, and `#d4cfdc` would have shown as a grey rgb(155 147 152). lib/ribbon-paint's `shade` now sets an
    EXPOSURE, one per channel, that makes a face turned squarely to the viewer show the colour it is given
    EXACTLY, every other direction keeping its own ratio to that face: the approved light's accents, whole —
    brighter towards the key light, a glint whiter still, dimmer turned away. MEASURED on the six recorded cards:
    the median of the visible ribbon's area is the token itself on every card, 50 to 82 % of that area within
    three levels of it (the ripple, flat on the face, all of it), and the accents from about rgb(204 198 211) to
    rgb(219 214 228) between the 5th and 95th centiles — the record's own samples from (185, 182, 196) to (238,
    235, 252); on the built pages the ripple's centre reads 212 / 207 / 220 at every width. (3) **THE WIDTH
    SHARE.** `buildStrip(model, mirror, base, widthShare = 1)` draws the strip at a SHARE of the model's width
    along the very SAME centre line: the route, its waves, the ripple and every fold stay the model's, laid for
    the design's 0.25 k, so a thinner ribbon keeps MORE air beside every keep-out and under every edge, never
    less. Thinning the model's own width instead would have moved shapes the owner had called perfect — the
    ribbon coming back over a card's top edge ≈ 9px nearer the drop-in on a laptop, and the ripple's crest, which
    the top edge's headroom caps there, up to half again as high. lib/ribbon-draw reads the root's
    `--ribbon-width-share` (a plain number, NOT registered: it needs no computing where it is declared; anything
    outside (0, 1] reads as 1; part of the rebuild key), and THE GUARD measures the strip as drawn.
    sections/DoctorShowcase declares it, its D11 — `scalable:@4xl:@min-[896px]:[--ribbon-width-share:0.7]` —
    under its scale's VERY variant chain (§15.25 round 2), in the band's OWN rhythm string: since §15.32 the
    regime's classes live in ui/Container's strings, every band wears them, and a ribbon setting has no place
    among them, so the band re-spells the chain for its one class — the shape tests/unit/design-scale.test.ts
    allows a class that must follow the regime (TeamRoster's tiles are the precedent), held to that chain
    exactly, so the share can never switch at another width than the scale. "Larger than tablet" read as the band's
    laptop-and-desktop regime, a mouse or trackpad from a column of max(56rem, 896px), ≈ 1140px of window — the
    boundary the owner drew on 2026-10-01 ("Touch devices unchanged") — so every phone, every touch tablet held
    either way and a narrow window keep the whole width. MEASURED on the built pages (the body's run through the
    ripple): 22 → 15px at the owner's 1401 window, 20 → 14 at 1280, 30 → 21 at 1920; 14px on a 768 touch tablet
    and 9 on a 390 phone, unchanged; the drawn body 0.693 to 0.695 of the same page's at its whole width at every
    laptop and desktop window from 1140 to 2560, Romanian and German (70 % less the anti-aliased fringe).
    **Pinned:** ribbon-paint.test — a face turned squarely to the viewer shows any colour as itself (six colours,
    to 1e-9), the accents' order round it, and the share's edges with the centre line, colours and efforts
    unmoved (1e-12); ribbon-draw.test — 0.689 of the body on a 13.8px ribbon, its centre of mass within half a
    pixel, invalid shares read as 1, a new share rebuilds; DoctorShowcase.test — the byte pin, ONE declaration,
    the share 0.7 from THE STEP and 1 a pixel before it, its compiled rule under both gates and both container
    steps; design-scale.test — the band among the files that may re-spell the gate chain, its one token the
    share at 0.7 on the regime's own chain; the e2e
    (doctor-showcase.spec) — 0.66 to 0.70 at the owner's window and every laptop and desktop width, exactly 1
    below the step and on the four sideways touch tablets. The paint record was re-written FROM THE PORT,
    colours only (no edge, count or effort moved — checked against the port before every number was written).
    **Recorded, the owner's calls:** the share is one class's number, 0.7 — the lever; the shadow keeps the
    gauge's offset and blur (a thinner strip casts a thinner shadow, no lighter or nearer); the pale ribbon reads
    1.53:1 against the white card and 1.45:1 against the page ground — a decoration, its dark shadow its edge; a
    window under the step on a laptop keeps the whole width (a tablet's), and the step is a jump like the band's
    own (≈ 18 → 12px across it). **Visual,** MEASURED by the lane's differential at zero tolerance against a
    pristine build of develop bdb9611 on a private port: exactly the declared 47 cells move — every cell with a
    painted ribbon: `ui/ribbon/*` 8, Sections/DoctorShowcase 15, Pages/Home 12, Pages/Team 12 (the colour in all
    of them, the width too wherever the band's regime applies) — plus ONE new cell, `ui/ribbon/width-share` at
    1280 (the atom's NEW WidthShare story: the Desktop column with the share declared on an ancestor, as the band
    declares it); 5 more of 1–9 px in the harness's known flicker families (the open language dial, SpeedDial's
    discs, the language switcher, the price list) — pristine develop re-shot against its OWN reference minutes
    later differed in 8 cells of those same families, 1–6 px. AT THE SEAL, rebased onto develop 32595a1 (#139,
    THE BAND SCALE promoted to ui/Container — D11 moved into the band's own rhythm string, and the census and
    the band's source test allow exactly that one re-spelled class): the 48 cells re-recorded in the darwin set
    under classic scrollbars (the 15px gutter measured first) and verified 48/48. **Evidence at READY:** see
    the lane's PR.
    **Round 7 (owner, 2026-10-02 — THE WHITE SPECKS, a bug report; verbatim: "the ribbon here on windows
    chrome is having on and off some white dots. like some of the popular "purici pe televizor" why is that",
    then "can you implement the fix asap?"; lane `fix/ribbon-gpu-specks`, `/debug-deep`):** THE CAUSE, measured
    on the owner's workstation (Chrome 154, Intel graphics, Direct3D 11): lib/ribbon-paint joins its pieces by
    ADDITIVE blending (its NO HAIRLINES), which is seamless only where the rasteriser computes each piece's
    anti-aliased coverage TRUE — half plus half is one. Chrome's software rasteriser does; its graphics-card
    one, a canvas's default wherever Chrome trusts the GPU, estimates it, high for a piece thinner than a pixel,
    and where the ribbon bends over a card's edge many such pieces share a pixel: the sum passes the ribbon's
    colour and clips. The Team page's six canvases at a 1401 window held 1 200 to 1 700 pure-white pixels at
    pixel ratios 1, 1.25 and 1.5, against none in Playwright's bundled Chromium, which draws in software — the
    browser every test and baseline uses, so nothing caught it; a page that READS a canvas's pixels hides it
    too (Chrome moves a canvas to the processor after a few readbacks). The specks are OLDER than round 6:
    with the old `#8377a3` the same ~2 700 pixels stood out as pale violet; the pale tint only pushed them to
    white. A speck stays where the pen painted it ("on and off" is the pen arriving — measured, nothing
    twinkles once drawn). Two experiments closed it: additive blending off → 0 specks and the hairline seams
    back; the canvases in software → 0 specks and the very picture of the tests. THE FIX (lib/ribbon-draw's
    DRAWN IN SOFTWARE): a tile's PIECES are painted on THE SCRATCH — one off-page canvas, the widest tile's
    width by the tallest's height (capped like a tile), its context `willReadFrequently`, which keeps it off
    the graphics card in Chrome — and the
    tile copies the box 1:1 and lays its shadow under it ITSELF, on its default context: the shadow is one
    path's blur (no addition, no speck) and in software it was the cost — a resize repainting the six tiles
    kept the main thread busy ~1 000 ms at a pixel ratio of 2 with it, ~490 ms without it (develop's ~320).
    Measured after the fix: 0 specks and 0 isolated bright pixels in that Chrome; in software every canvas
    byte-identical to develop's at ratios 1 and 1.5, painted at once and drawn by the pen, so NO visual
    baseline moves. AND A REPAINT ADDS TO THE SCRATCH (the React review's lever): the scratch keeps the tile
    it holds, and a pen frame paints only the pieces it does not hold yet — exact, because additive sums
    ignore order and a frame ends on a whole sample (a range ending inside a piece, a rebuild's, is never
    added to); the reduced-motion paint repaints each tile once, not once per card. Against develop's own
    module on the same quiet machine, scrolling the band while it draws: the main thread busy 1.5 s against
    1.9 at a ratio of 1, 2.1 against 2.0 at 2, 14.1 s against 13.6 on a phone screen with the processor
    slowed four times; frames slower than 50 ms 0 against 1, 1 against 16, 85 against 159 — as smooth as
    develop's or smoother everywhere, for about its main-thread time. Tried and DROPPED on the way: all canvases in software (the speck fix alone — the
    drawing stuttered, the slowest 5 % of frames at 50 and 100 ms, single frames up to 300 ms) and a redraw of
    only the box a frame's stroke changes (cheap, but a clip changes how the software rasteriser anti-aliases
    a shape it cuts — measured, up to 35 levels on an edge pixel — so the picture was no longer the one
    painted whole). Pinned: ribbon-draw.test.ts's DRAWN IN SOFTWARE block — every additive fill lands on a
    `willReadFrequently` context and the tiles keep the default, at start and after a rebuild (red against
    develop's module, green with the fix); the scratch in each tile's transform (a pixel ratio of 2 gives the
    same ribbon in twice the pixels each way); every copy 1:1 from a scratch that holds the tile, a later and
    larger tile included; a browser that refuses the software context refuses the column before a tile is
    touched; the scratch's memory given back under THE GUARD and on dispose; a pen's drawing ending on the
    picture of repainting each tile whole, pixel for pixel; ONE clearing of the scratch for a whole stretch on
    one tile; the ribbon its own colour (no pure-white pixel, the body's median the token within 3 levels) at
    once and under the pen; the scratch resized to a tile it cannot hold where the widest by the tallest
    passes one canvas — each test shown red on the mutation it guards; the width-write counts split into the
    canvases on the page and the scratch. **G2** (react-reviewer and typescript-reviewer on Opus): APPROVE
    WITH CHANGES twice, 0 critical, 0 high; every finding folded in one round — the colour pin, the phone
    cost (A REPAINT ADDS TO THE SCRATCH, the reduced-motion paint once per tile), the tests above, the scratch
    obtained before any tile, given back under THE GUARD, capped like a tile and named exactly, two comments
    narrowed to what was measured. The React reviewer measured the same Intel GPU independently: develop
    2 302 – 2 488 pure-white pixels across the six tiles, this lane 0, its GPU picture within 0.06 px of its
    software one. **Recorded, the owner's calls:**
    `willReadFrequently` is a hint — Safari and Firefox were NOT measured on real devices (an engine that
    ignores it keeps its default and, if its graphics-card rasteriser estimates like Chrome's, its specks);
    the road that needs no hint is to stop relying on the addition — pieces that overlap by a pixel, painted
    one over the other, which can never pass the ribbon's colour — a change to the picture (the edges at every
    joint), so the owner's eye first; the scratch is CPU memory held while the band is mounted and painted —
    at a 1401 window 3.8 MB at a pixel ratio of 1 and 8.6 MB at 1.5 (measured), about 15 MB at 2; speed was
    measured on the workstation only, a phone as an emulated screen with the processor slowed four times — a
    real mid-range Android phone, where the same path uploads a whole tile every pen frame, is worth one trace
    before launch. **Evidence at READY:** see the lane's PR.

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

28. **The clinic's mark and its lettering colours — ON THE OWNER'S WORD (2026-10-01, verbatim: "refactor on
    logo section this is the actual logo of the clinic premium smile and on the text use those colors as
    described: Lilac/purple: #8576B1 (RGB 133, 118, 177) Grey: #939598 (RGB 147, 149, 152) on Premium the gray
    and on smile the liliac"; lane `rework/wordmark-brand`):** §15.6's logo is in the repository. **THE MARK:**
    the owner's 261×262 PNG (a cut-out with real alpha and a whitish fringe: the tooth's lilac stroke, its grey
    stroke and a thinner smile in a duller lilac) TRACED into `public/images/brand/mark.svg` — two paths, one
    per colour, 2.3 KB, viewBox 258×261 (the ink's own box plus one unit of air). The recipe, JavaScript only
    (§15.26's "no Python" rule; the tracer stays machine-local, never a dependency): a pixel is ink at alpha
    ≥ 0.5 unless it is the fringe (max channel > 225); ink is lilac or grey by a COVERAGE-INVARIANT hue ratio,
    (blue − red) / (255 − max channel) > 0.12 — the main stroke reads ≈ 0.6, the smile ≈ 0.21, the grey ≈ 0.05,
    and both a plain hue threshold and an RGB-distance rule misfiled the anti-aliased smile (measured: a grey rim
    round every lilac stroke, then a grey smile); the lilac mask is dilated one source pixel under the grey at
    their one seam and the grey path is drawn last, so no hairline opens and the source's layering (the lilac
    slides under the grey, top right) is kept; each mask upscaled 4× (lanczos), blurred σ 3 at that scale, traced
    by the potrace port (specks under 3 source px dropped, 8 for the grey layer — the smile's two washed tips),
    curve tolerance 1, coordinates rounded to whole units by svgo (half a unit is 0.14 px at the header's 72 px).
    Judged by eye at every crop against the source and accepted. It ships as a FILE by fb-83's rule (static,
    fixed-colour artwork; the optimizer's extension list has no .svg, so the one file serves in dev, vitest,
    storybook and the build — the demo cat's committed WEBP derivative, F12, is deleted with its consumer).
    **THE WORDS:** `sections/Wordmark` splits `clinic.name` once at build time (`brandWords` — anything but two
    words is a build error by name) and paints „Premium" `text-brand-grey`, „Smile" `text-brand-lilac`: two NEW
    semantic roles (`--brand-grey` #939598, `--brand-lilac` #8576b1 — §15.1, roles 21 and 22 beside the menu
    buttons' `--accent`, the 20th, minted the same day by its own lane), the host `hyphens-none`
    (§15.14's label rider). **CONTRAST, MEASURED and RECORDED as the owner's brand:** grey 3.00:1 on white ·
    2.85:1 on the page; lilac 4.02:1 · 3.82:1 — all under §9's 4.5:1 (20px regular is not large text; bold
    would lift the bar to 3:1 and the grey would still miss it on the page ground). Legal by WCAG 2.2 SC 1.4.3's
    own clause — "text that is part of a logo or brand name has no minimum contrast requirement" — and by SC
    1.4.11's for the mark. axe cannot tell a logotype from a paragraph (measured: it flags the two words at 20px
    regular, still flags them bold on the page ground, inside a `role="img"` wrapper and behind `aria-hidden`;
    only an image escapes it), so the two words carry `data-logotype` and `.storybook/preview.tsx` narrows the
    color-contrast rule by that attribute — `axe.configure`'s per-rule `selector`, measured to leave an unmarked
    neighbour flagged; NOT the run-context `exclude`, which lifts every rule. NEW
    `tests/unit/logotype-census.test.ts` keeps it honest: the two utilities and the marker are worn by
    Wordmark.tsx and nowhere else, the exemption is keyed on the same literal, the .svg is painted with exactly
    the two token values (a file cannot read a token — a KEEP-IN-SYNC pair), its viewBox equals the component's
    width/height, and no text, script or href rides in the file. The name still reaches everyone in full ink (the
    Footer's copyright line and site-map title; the JSON-LD), and the two spans read as ONE string. **THE PHONE,
    FIXED ON THE WAY:** the Header's brand cell wore `whitespace-nowrap` at every width, so the two-line wrap
    Wordmark's D10 arithmetic promised at 320 could never happen there — the one-line name painted „Smile" 32 px
    under the burger (measured on develop's preview; the real-clinic-data lane's flag of 2026-09-30). The class
    now wears the bar's step, `@min-[60rem]:whitespace-nowrap` (the grid's reason starts where the grid starts),
    and at 320 the name wraps „Premium" over „Smile" inside the 5rem row with 23.7 px of slack; the Wordmark
    story harness, which had sampled the old 4rem row since 2026-09-04 (the stale claim recorded then), is
    aligned to `h-20` in the same change, and every Wordmark frame is re-recorded anyway. **THE BRAND SHRANK,
    THE STEP STAYED:** near-square, the mark draws 71.2 px wide at the row's 72 px where the 1.49:1 cat drew
    107.8, so the lockup is ~222 px, not 258.5 — the German gap at the 60rem step is ~104 px (AtTheStep's
    ceiling moved 5rem → 7rem; the same evening's owner sizes took the lockup to 270.1px and the gap to 56.25px,
    under the floor — §15.31), and re-run, the §15.22 arithmetic's smallest whole rem would be 56rem, which is
    Tailwind's NAMED `@4xl` and moves the flip from ≈1221 to ≈1141 px of window. NOT taken: a behaviour change
    the owner did not ask for with the logo — his lever. **Recorded, not built — the owner's:** `accent-decorative`
    #7A6D9C and `--ribbon` #8377A3 to the logo's own #8576B1 (repaints tints, auras, keywords, the ribbon;
    #8576B1 reads 3.82:1 on the page, inside the display charter's 3:1) *(the ribbon's half is moot since
    2026-10-02: `--ribbon` is the lilac band's ground and follows `accent-decorative` — §15.26 round 6)*; the favicon (`src/app/icon.svg`) *(BUILT
    2026-10-01, §15.31)* and the OG share image from the mark; the mark's size in the pill (90 % / 40 % of the row,
    kept from the cat — one number in Wordmark.tsx) *(TAKEN 2026-10-01, §15.31: 68.85 % / 30.6 %, the name to the
    30px `section` step, in both instances)*; the Publio lettering, if it ever arrives, as a second file; the placeholder `<a>` →
    `<span>` now that the home link is dropped for good (three suites and the e2e find the lockup through it);
    striking the uncalled `common.brand.ariaLabel` key ×5 *(both VOID since 2026-10-02: the owner restored the home
    link — the placeholder became the real `<a href>` and the key is called, §15.33)*. **Evidence at READY:** see the lane's PR. **Visual:**
    every cell with the shell moves (the brand corner is on every page) — Sections/Wordmark (5), Sections/Header
    (8), Sections/Footer (8), Sections/Hero (the Header above the band), Pages/* in both languages; the darwin
    re-record is the owner's, on the owner's machine (§15.7).
29. **The soft corner — ON THE OWNER'S WORD (2026-10-01, verbatim: "refactor on docotr cards, top bar and
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

30. **The lilac buttons — ON THE OWNER'S WORD (2026-10-01, verbatim: "take latest develpment. there
    is a set of buttons i need you to make lilla, like the one that the latest menu buttons are.
    those are: -all "mai multe despre mine" buttons from the doctor cards. -all round glyph buttons
    from the footer but do not modif yat least yet the hovering buttons from bottom right
    -programeaza o consultatie button from auto scrolling with images and slides component at rest.
    when on hover it muat still turn white. -vezi serviciile button border ant text at rest, but not
    background color and on hover it should still turn current slight gray -round scrolling buttons
    from reviews, the left and right ones. -buttons for location and phone next to the map" — and,
    mid-lane: "old see our services button on the auto scrolling page has also a little lilla aura
    around it. i want it implemented on the sliding window with images on home page at see our
    services … same aura as on top bar aura"; lane `rework/buttons-lavender`):** `ui/Button` and
    `ui/GlyphButton` gain a `tone: 'cta' | 'accent'` axis — the colour FAMILY a face is cut from,
    orthogonal to `variant` (and to GlyphButton's `shape` / `size`), default `'cta'`, so every call
    site that says nothing is byte-identical. The `accent` family is the SAME bundles with three
    substitutions and nothing else — `cta → accent`, `cta-hover → accent-strong`, the hairline
    `→ inset-ring-accent` — which both atoms' tests DERIVE from the green cells rather than list a
    third time; ghost paints with ink and ignores the axis (one bundle, both cells, pinned equal).
    Hover contract, `--fade` clock, press snap and mirror law unchanged: Button's outline still
    GREYS (the label one step darker for the green's own reason — `accent` reads 4.07:1 on
    `line-subtle`, under 4.5:1, `accent-strong` 7.51:1; the border stays `accent`, 4.07:1 ≥ 3:1),
    GlyphButton's outline still FILLS. Measured (WCAG 2.2): white on `accent` 5.06:1 (the green
    4.52), white on `accent-strong` 9.34:1 (6.60), `accent` on white / `--page` 5.06 / 4.81 —
    `tests/unit/accent-census.test.ts` computes them from the tokens' own lines, and now names FIVE
    wearers (TextButton 3 · Button 5 · GlyphButton 6 · ClinicLocation's `ROW_HOVER` 2 · Avatar 1)
    and the five files that pass `tone="accent"`, each with its ground. **Who wears it, each on the owner's
    word:** PersonnelCard's doctor link (solid) · the Hero's contact trigger (solid — drains to white
    on hover) and services link (outline — lilac border and label on the white box, the grey on
    hover, AND the top bar's `--shadow-aura` through className, the one Button to wear it;
    `tests/unit/aura-token.test.ts` counts the wear) · the Footer's four discs (outline) · the
    reviews deck's prev/next (outline) · the map band's two row discs (solid, `ROW_HOVER`
    re-spelled to the accent cell — its KEEP-IN-SYNC test derives from that cell) · and, after the
    pack ("i forhot to mention. also on review cards i want the circle of persons initials to be in
    lilla, not in current green"), the GROUND of `ui/Avatar`'s initials disc, `bg-cta` → `bg-accent`
    — the avatar board's D3 reversed with a role it did not have: white on #746894 reads 5.06:1,
    more room than the green's 4.52 (the one consumer is sections/ReviewCard) — and, since round
    3 below, the Header's Contact button in the bar and in the panel. **Who does NOT,
    pinned:** the fixed corner's
    call and WhatsApp discs ("do not modify at least yet …" — FloatingActions.test.tsx; lilac since
    round 4, below) · the contact dialog's buttons (lilac since round 5) · the burger. On the Hero's dark veil the outline's lavender border
    reads 1.75:1 against the worst-case photograph (the green read 1.57:1): the control's boundary
    is its white box, unchanged. Stories: UI/Button and UI/GlyphButton each gain Accent ·
    AccentOutline · HoverAccent · HoverAccentOutline (the last two `pin-hover`). No reviewer round
    was run — PR #120's recolour precedent; the owner's call. Evidence at READY and the visual
    manifest: see the lane's PR.
    **Round 3 (owner, the same evening, 2026-10-01, verbatim: "like in old webpage i want the book
    consultation, see our services, call hover button in bottom right and whatsapp button, contact
    button in top bar, more about me button in doctor card, to have that jump at you animation on
    hover. this should not affect buttons from footer. on hover of vezi serviciile i want little
    darker shade of gray. also paint the contact button from top bar a lilla and make it wider,
    more seszable and adjust to widest language form" — the same lane, still uncommitted):**
    (1) **THE JUMP.** `ui/Button` and `ui/GlyphButton` gain a SECOND axis, `motion: 'still' |
    'jump'`, default `'still'` (every elder byte-identical): `jump` is the old site's
    `hover:scale-105 active:scale-100` — the growth half of the pop fb-49/fb-50 cut on 2026-08-05
    (the GlyphButton board's D2), back for SIX buttons on the owner's word — on ITS OWN clock,
    `--jump` 200ms ease-out (the old site's numbers), beside the colours' `--fade` 400ms ease-in-out,
    spelled as per-property lists on the three transition longhands (one `duration-*` utility would
    give the scale the fade's 400ms, and a swell is not a jump; two utilities on one property are
    decided by the sheet's order — Header.tsx's `display` lesson — so the jump cell carries no
    `transition-[…]` / `duration-*` / `ease-*` utility at all, and `ui/disc.ts` handed its
    `duration-(--fade) ease-in-out` pair to each disc atom's own transition line, GlyphButton's
    `motionClasses.still` and SpeedDial's `discTransition`, zero pixels moved). The press snaps the
    box back to rest; under reduced motion the box never moves (`motion-reduce:hover:scale-100`).
    The pop's OTHER half — the glow's growth, `shadow-cta` → `shadow-cta-lg` — is NOT ported: shadow
    utilities stay banned in every bundle, and a consumer's static `shadow-aura` simply scales with
    the box. Wearers, each `motion="jump"` on the owner's list and nothing else —
    `tests/unit/jump-census.test.ts` names the Hero's two calls to action, the doctor card's link,
    the Header's bar Contact and, through ui/GlyphButton, the fixed corner's call and WhatsApp
    discs, and pins the Footer's discs ("this should not affect buttons from footer"), the reviews
    deck's prev/next, the map band's row discs, the burger panel's full-width Contact (a row that
    grows past its panel's padding reads as a glitch on a touch surface) and the dialog's buttons
    STILL; GlyphButton.test pins the two atoms' jump cells byte-identical. (2) **THE DARKER GREY.**
    `ui/Button`'s outline ACCENT cell greys to `--line` #d8d4cf on hover and press, one step under
    the green cell's `--line-subtle` #e9e6e2 — the family's declared FOURTH substitution (Button.test's
    derivation names it, scoped to outline). The green cell cannot follow: `cta-hover` reads 4.47:1 on
    `--line`, under SC 1.4.3's 4.5:1, while `accent-strong` reads 6.33:1 there and the `accent` border
    3.43:1 (SC 1.4.11's 3:1); `accent` itself reads 3.43:1 on `--line`, so the hover label still
    darkens one step (accent-census measures all of it from the tokens' own lines). (3) **THE
    CONTACT BUTTON, LILAC — THE OWNER'S OWN REVERSAL.** §15.1's rider of that morning ("contact
    button MUST STAY GREEN AS IT MUST JUMP INTO YOUR EYES") is reversed by the owner's evening
    sentence above: the bar's Contact is `<ContactModalTrigger variant="solid" tone="accent"
    motion="jump" className="min-w-40">` — lilac, the atom's `md` face (44px, the row's own height
    — the `lg` face was tried for "more seszable" and taken off on the owner's look the same
    evening: "it's jsut too high th button. i wanted the contact button wider just, not also
    taller"), jumping, under a 10rem floor the section owns (§6.8, §8.4), MEASURED on the built
    page at the label's 18px medium: „Contact" 63.6px (ro/en/fr) · „Kontakt" 65.3 · „Contatti"
    66.4, the widest, + 2 × 20px of padding = 106.4px natural, so the floor binds in every language
    and all five render the SAME 160 × 44px box with ≥ 26.8px of slack a side (the Header stories' Default and
    GermanStress plays pin the box to the floor; the floor is one token, the lever). The panel's
    full-width Contact turns lilac with it — the same control, one look — and does not jump.
    `Header.test.tsx`'s green pin flipped to the lilac; `tests/unit/accent-census.test.ts` names
    Header.tsx and NavMenu.tsx as callers on the glass floor. Still green: the fixed corner's two
    discs (their colour, until round 4; they jump), the dialog's two buttons (until round 5), the language bulb. Visual, MEASURED
    (the lane differential against pristine develop f6981af, 447 cells): 109 move — the 103 of
    rounds 1–2 plus Sections/Header's six (AtTheStep · Default · GermanStress · NonRomanianLocale at
    1536, where the bar shows the Contact; MenuOpen at both widths, the panel's) — 0 undeclared, 0
    errors; the bar's Contact is ~6.4k px of each Header cell (re-shot after the height came off —
    the same 109-cell set, cell for cell), Pages/Home and Pages/Team carry it too, Sections/Hero's
    thirteen with them (the Header above the band). The DARKER GREY the net CANNOT SEE: UI/Button's
    HoverAccentOutline passes unchanged because #e9e6e2 → #d8d4cf sits under Playwright's 0.2 YIQ
    per-pixel threshold (the aura's own note, §15.20 round 4) — measured on the built page instead
    (rgb(216,212,207) on hover), and the darwin record at the seal must use
    `--update-snapshots=all`, which rewrites a cell the default mode would skip. The two new `Jump`
    stories are `no-visual` — the net runs under reduced motion, where the box holds still by rule,
    so their frames would only repeat the rest frames' pixels. Gates at READY: prettier · eslint ·
    tsc clean; vitest 3348/3348 (141 files; develop stood at 3143); e2e 118 passed, 36 skipped;
    build-storybook and `next build` green. No reviewer round was run; the owner's call stands.
    **Round 4 (owner, later the same evening, 2026-10-01, verbatim: "i thaught i told you to refactor
    the whatsapp and call buttons to be lilla too" — and, asked which pair, "Bottom-right corner
    discs" over the contact dialog's two buttons; lane `rework/call-whatsapp-lilac`):** the record had
    held the corner back — the morning's list said "do not modif yat least yet the hovering buttons
    from bottom right", and round 3 gave the two discs the jump, not the colour — so this sentence is
    the word the "at least yet" waited for. `sections/FloatingActions` passes `tone="accent"` on both
    discs, one prop each, the path its own comment named; the jump, the aura, the placement and the
    size steps are unchanged. The face: lilac at rest under the white glyph, 5.06:1 (the green read
    4.52:1); on hover the white face with a lilac glyph and hairline; the deep violet on press, white
    9.34:1 — measured on the built page too (rest: an rgb(116,104,148) face, white glyph; hover: a white
    face, lilac glyph and hairline, scale 1.05). The discs are `fixed`, so every band scrolls under
    them, and the face's EDGE (SC 1.4.11's 3:1) gains on every ground: `--page` 4.81:1 (the green
    4.29), white 5.06 (4.52), and the doctor pages' 30 % tint 3.31:1, where the green read 2.96:1 —
    under 3:1, unnoticed until this lane measured it. `tests/unit/accent-census.test.ts` names
    FloatingActions.tsx its eighth `tone="accent"` caller, measures the face against those three
    grounds in a new `it`, and keeps ContactModal.tsx as the one file that must say nothing (until
    round 5); `FloatingActions.test.tsx`'s green pin flipped to the lilac. STILL GREEN, and why: the
    contact dialog's two buttons (ui/Button's default family — the owner's pick passed them over;
    lilac since round 5) and the
    language bulb's fill under its flag (not named; the opaque flag hides its colour and its scrim
    answers no hover — but an artless bulb would now be green beside lilac discs, and ui/SpeedDial has
    no lavender tone: the owner's lever, recorded in LanguageSwitcher.tsx and its test, whose "parity
    with the call disc" title is reworded). CONSEQUENCE, recorded: no ui/GlyphButton call site wears
    `cta` any more (the burger is ghost), so the atom's green family is its DEFAULT with only its
    stories and tests as readers — kept, Button's twin, whose green the dialog's buttons wore until
    round 5; the
    GlyphButton `Jump` story wears `tone: 'accent'` like its only wearers (`no-visual`, no cell).
    Visual, MEASURED (the lane differential against pristine develop b3461c8, 456 cells): exactly the
    eight Sections/FloatingActions cells move — Default at 390 / 1536, Clearance320 and GermanOpen at
    320 / 390 / 1536 (~4 000 px at the phone widths, 6 825 at 1536: the two discs) — 448 identical, 0
    undeclared, 0 flaky; no other story renders the corner (the `[locale]` layout mounts it on every
    page). The eight darwin baselines are recorded in the lane under classic scrollbars (the 15px
    gutter measured first) and verified 8/8. Gates at READY: prettier · eslint · tsc clean; vitest 142 files / 3 409 tests with the
    optimizer variants hidden (the CI rehearsal); build-storybook and `next build` green; e2e not run
    (no spec covers the corner). No reviewer round was run — the #120/#124 recolour precedent; from
    this evening every reviewer runs on Opus unless the owner explicitly says otherwise (his rule, set
    in the flows on branch `chore/reviewers-on-opus`).
    **Round 5 (owner, later that night, 2026-10-01, two messages, verbatim: "idk if this was
    implemented but on the modal with contact opened from the contact button i need the 2 buttons
    for calling by phone and contatcatine pe whatsap to be also lilla at standstill" · "so all is
    green there rurn to liliac or however it is called."; lane `rework/contact-dialog-lilac`):** it
    was not implemented — round 4's pick passed the dialog's pair over — so this is the word the
    record was waiting for. `sections/ContactModal` passes `tone="accent"` on its two channel
    controls (solid, `lg`, across the rail's full width), one prop each, and those two props ARE "all
    is green there": the ✕ is a ghost GlyphButton in ink, the focus ring `--focus` ink, the scrim
    black, and both glyphs paint `currentColor`. No jump — not asked, and
    `tests/unit/jump-census.test.ts` keeps the dialog still. The face, from the tokens: lilac at rest
    under the white label and glyph, 5.06:1 (the green read 4.52:1); on hover the white face with a
    lilac label (5.06:1) and hairline; the deep violet on press, white 9.34:1 (the green's 6.60:1);
    the face's edge on the dialog's white box 5.06:1 (SC 1.4.11). MEASURED on the built pages too,
    /ro/ at 1280 × 800 and /de/ at 390 × 844: rest rgb(116,104,148) under a white label and glyph,
    hover a white face with a lilac label, glyph and 1px inset hairline, press rgb(75,58,134) — no
    console error, no navigation. `ContactModal.test.tsx` pins the lilac in a new `it` (the corner's
    shape: the accent tokens, no `cta` token, no `tone` in the DOM); `tests/unit/accent-census.test.ts`
    names ContactModal.tsx its ninth `tone="accent"` caller, with its ground, and its stays-green
    loop — the Header's two files, then the corner, then the dialog alone — went with its last
    member. The stories' stand-in opener behind the dialog (`ContactModal.stories.tsx`'s Ground)
    wears the lilac too, as every opener on the site does — a green one there would have shown the
    dialog's page a colour the site no longer has (G2 react). CONSEQUENCE, recorded: since that
    night no page the site ships wears ui/Button's green family — the atom's DEFAULT stays (every
    elder byte-identical), read only by story and test code (ui/Ribbon's stand-in fixture among
    it): GlyphButton's state since round 4. A FACT, NOT A RULE: nothing refuses a new green call
    site; a census `it` that would (every shipped non-ghost button atom passing `tone="accent"`) is
    the owner's call. The green LEFT on the site, outside the dialog and not asked: the language
    bulb's fill under its flag (ui/SpeedDial has no lavender tone) and the language-suggestion
    banner's accept link (`text-cta`, a text link) *(lilac since the next day, on the owner's word
    — round 6)*.
    Visual, MEASURED (the lane differential against pristine develop 04599e1, 457 cells, private port
    6141): exactly seven cells move — Sections/ContactModal Default at 320 / 390 / 1536 and German
    Stress at 390 / 1536, 24k–41k px each (the two faces; the stand-in opener behind the scrim moves
    by less than the net's per-pixel threshold), and Closed at 390 / 1536, ~4k px each (the stand-in
    opener) — and 450 are identical: 0 undeclared. At ZERO tolerance (the pass before the stand-in
    turned) nine more cells differed by 1–9 px, all in the harness's known flicker families (the
    open language dial, SpeedDial's disc, the price list's glow and the Services page that carries
    it); the pristine build, re-shot against its own reference, differed in six of them — a
    different set on every shoot. The seven darwin cells are recorded in the lane under classic
    scrollbars (the 15px gutter measured off the body's width first) and verified 7/7. Gates at READY: prettier · eslint · tsc clean; vitest 142
    files / 3632 tests with the optimizer variants hidden (the CI rehearsal); build-storybook and
    `next build` green; e2e not run (no spec covers the dialog).
    G2 on OPUS, on the owner's word ("run whatever you feel you have to run with opus"): react and
    typescript APPROVE WITH CHANGES, a11y APPROVE — 0 critical, 0 high; one medium (a stale "green
    `tel:` control" in Header.tsx's comment) and the lows folded in one round (the "only readers"
    wording, the stand-in opener, `tone` after `variant` like the other eight callers, a stale
    GlyphButton story note, two reflows); a computed-colour assertion was declined (a resting
    pointer flips the face to hover — the class pin is the corner's and the Header's shape, and the
    darwin cells pin the paint). RECORDED, pre-existing, the a11y reviewer's: the 400ms hover
    crossfade passes through 1:1 at its midpoint (the label under 4.5:1 for ~294ms, the green's
    ~380ms; no resting state under 5.06:1, keyboard and touch never see it); in forced colours both
    controls show as link text with no box — ui/Button's parked `forced-colors:border` (§15.23,
    §15.25), now on the dialog's conversion controls too (BACKLOG.md, entry 2). ADVISORY, the
    owner's: the lilac is as light as the green but about half as colourful (OKLCH chroma 0.069
    against 0.129) — more contrast, less pop, and "call the clinic" now shares its colour with the
    secondary controls; the hover's hairline is 1px.
    **Round 6 (owner, 2026-10-02, three messages, verbatim: "i need a fix. i had that "continue in
    englis" or "continue in spanish" modal, the one with an x button alos. i has "continue in englis"
    or "continue in spanish" in that green. drop that green and replace with the casual lilla from the
    app, the one that the "mai multe despre mine" button has" · "also, is that green used anywhere else
    in the webapp right now? like in the composed broser?" · "i hope you understood you do not have to
    like literally color the toast lilla but rather just that button."; lane
    `rework/language-banner-lilac`):** the "modal" is sections/LanguageBanner, the §8.6 suggestion
    toast — „Continue in English" beside a ✕ — and its accept link was the green text round 5 left.
    Its two colour classes moved and NOTHING ELSE in the toast did (the card stays white with ink
    words, the ✕ ink — the third sentence): `text-cta` → `text-accent` (#746894, the face of
    ui/Button's `accent` family at rest — the doctor card's „Mai multe despre mine" wears it) and
    `hover:text-cta-hover` → `hover:text-accent-strong` (#4b3a86, the family's own hover step); the 2px
    underline is currentColor and follows. MEASURED (WCAG 2.2): 5.06:1 at rest and 9.34:1 on hover on
    the card's opaque white (the green read 4.52 / 6.60), against the 4.5:1 a 16px label owes; on the
    built pages (/ro/ at 1280 × 800 and /de/team/ at 390 × 844, each for a visitor of another
    language): rest rgb(116, 104, 148) — the button face's own value — hover rgb(75, 58, 134), 0 green
    pixels left in the card (~4 500 before), no console error. The compiled stylesheet is
    BYTE-IDENTICAL to develop's: both lavender utilities already shipped and both green ones still do
    (the two button atoms' default family), so only the link's class list changed. PINS:
    `tests/unit/accent-census.test.ts` names the banner a wearer — the one that is neither an atom nor
    dressed through one, so it carries its own ground, the opaque card — and measures its hover pair on
    `--surface`; LanguageBanner.test.tsx pins the PAINT: with the real pointer parked away, the link's
    computed colour and underline EQUAL a real `<Button tone="accent">`'s face, and under a real hover
    the family's deep violet — a KEEP-IN-SYNC relation with the button, held by paint; three mutants
    turn it red (the green back · `text-ink` beside the lavender · the same ink, on hover only,
    beside the hover — named in words here because Tailwind scans this file, and a spelled class
    nothing wears would ship as a dead rule).
    THE AUDIT (the second sentence), measured on all 55 real pages of develop's build (five languages ×
    home, services, team, six doctors and the 404) at 1280 × 800 and 390 × 844 — every element's
    computed colours, its `::before` and `::after`, and every class in every state: the site's green
    showed in TWO of our controls — this link and the language bulb's fill (ui/SpeedDial's `cta` tone,
    LanguageSwitcher's `tone="cta"`) — and the bulb's is HIDDEN under the current language's flag: 0
    green pixels on the desktop bulb, and on the phone's a one-device-pixel anti-aliased rim where a
    dark flag stripe meets the edge (36 device pixels on the German flag, invisible at 4× zoom); its
    hover and press steps sit under the flag too. The one other green is the Italian flag's own stripe
    in the dial (rgb(0, 146, 70)) — a national flag, not the site's colour. The root redirect and the
    404 dispatcher carry none; the green rules still in the stylesheet belong to the two button atoms'
    default family, which no page wears; the map frame is Google's own content. After this lane the
    bulb's hidden fill is the site's ONLY green: turning it lilac needs a lavender tone on ui/SpeedDial
    — the owner's lever, not built. Visual, MEASURED (the lane differential against pristine develop
    bdb9611, 459 cells, private port 6152): exactly the five Sections/LanguageBanner cells move —
    Default at 390 / 1536 and Longest Fit 320 at 320 / 390 / 1536, 696–737 px each (the link's letters
    and underline) — and 454 are identical: 0 undeclared; at ZERO tolerance two more differ by 1 and 5
    px, UI/SpeedDial's Host Scaled and Sections/PriceList's Smartphone 390 at 1536 — the harness's
    known flicker families. Gates at READY: prettier · eslint (0 errors; the one warning is develop's,
    `UNIT_PX` in lib/ribbon-layout) · tsc clean; vitest 143 files / 3694 tests with the optimizer
    variants hidden (the CI rehearsal); build-storybook and `next build` green; e2e not run (no spec
    covers the banner, and the stylesheet is byte-identical). No reviewer round was run — the recolour
    precedent (#120, #124, #127, #137); Opus reviewers if the owner asks. SEALED on the owner's
    "perfect, pr" the same day, REBASED onto develop 32595a1 (#139, the bands scale, merged while
    the lane waited; one conflict, MIGRATION_INVENTORY's last row — both rows kept) and re-measured
    on the combined tree against a pristine build of 32595a1 (461 cells, the same private port): the
    same five cells by the same pixel counts at the net's tolerance, 456 identical; at zero
    tolerance seven more of 1–4 px (Pages/Services ×2, Sections/PriceList ×3, UI/SpeedDial's Open
    Right, Sections/LanguageSwitcher's Open — the glow and dial flicker families, a different set
    from the first shoot's). That comparison also caught a dead CSS rule of the lane's own making:
    Tailwind scans this file, and the first wording of the mutants above spelled a hover ink class
    nothing wears; reworded, the compiled stylesheet is byte-identical to 32595a1's again. The
    audit re-run on the combined build finds the same two greens and nothing else. The five darwin
    cells are recorded under classic scrollbars (the 15px gutter measured off the body's width) and
    verified, with Sections/ContactModal's seven passing against the committed set as the mode's
    control. Gates on the rebased tree: prettier · eslint (0 errors) · tsc clean; vitest 143 files /
    3747 tests with the optimizer variants hidden; build-storybook and `next build` green. Rebased
    once more the same day onto develop 548d691 (#140, the ribbon in the band's shade, merged after
    the PR opened — the same one-row inventory conflict, all three rows kept): the stylesheet
    byte-identical to 548d691's, and the five banner cells and Sections/ContactModal's seven passing
    against the committed set on the combined tree.

31. **The logo's sizes and the tab icon — ON THE OWNER'S WORD (2026-10-01, four messages, verbatim: "use the logo
    from top bar also in the tab. and make logo in top bar 15% smaller" · "make the logo 10% smaller again and make
    the premium smile text next to it same height" — asked, because one line of letters as tall as the mark (~55px
    type, ~380px wide) would push the menu row out of every window under ~1690px, and two stacked lines would not —
    "ok then just make the text 50% bigger than it is now and i'll see about top bar fittings later" · "update als
    in footer. now it looks sensational"; lane `rework/header-mark-favicon`):** two of §15.28's recorded levers,
    taken. "Logo" is read as the MARK — the owner's own word for the tooth when supplying it, and the only part of
    the lockup a tab can show.
    **(1) THE LOGO'S SIZES — sections/Wordmark, both instances.** The mark 72 → **55.08px** (90 % × 85 % × 90 % of
    the 5rem box, spelled as a FIXED `h-[3.4425rem]` with `max-w-none`, below) and, below the phone step, 32 →
    **24.47px** (`@max-sm:h-[1.53rem]`); the name from ui/Heading's `title` step (20px) to its **`section`** step
    (30px — 1.5× the size, a little under 1.5× the width: the face has an optical-size axis), kept at **20px below
    the phone step** (`@max-sm:text-xl`). While the owner's words named the top bar, the sizes were built in the
    Header's box (85 %, then 76.5 % of its row) plus a name-size prop; "update also in footer" made them the
    lockup's look everywhere, so they moved INTO the component (Wordmark.tsx's THE OWNER'S SIZES), the Header's cell
    went back to `self-stretch`, the prop was deleted, and fb-205 ("both read at the same size") holds. MEASURED on
    the built export: desktop and tablet — the mark 55.08 × 54.44px, the name 203.7px on one line, the lockup
    270.1px, header and footer identical, the name on the row's centre line; phones — the 170.9px phone lockup on ONE
    line in the bar from a ~311px viewport (fb-207's one line at 390, restored) and in the footer always; in the
    runner's 15px-gutter 320 cell (163px) it wraps to two 28px lines with 47px of slack. Corrected on the way: the
    Header's row has had NO gap since the shell mount took its `gap-4` off on 2026-09-04 (#69), so the 147px cell
    Wordmark.tsx's D10 and its Stress320 harness recorded, right when written, had been stale since that day; both
    say 163px now. WCAG: at 30px the name is large text (3:1): the lilac clears it on both grounds; the grey reaches
    it only on pure white (3.00:1) and misses it on the page (2.85:1) and on the bar's glass (~2.7:1 over the Hero) —
    the logotype exemption (§15.28) carries it. Pinned by measurement in the Header stories
    (`expectMarkAtTopBarSize`, Default + MenuOpen: the mark 68.85 % / 30.6 % of the row, the name 1.875 / 1.25rem by
    the step, both on the centre line), the Wordmark stories (69 / 31 % rounded, 55.08 × 54.44, the 163px cell, the
    two lines one line box apart — both plays load the real face first), the Footer stories' lockup chain, and by
    class in the unit suites.
    **THE FITTINGS — RULED (owner, the same evening, on the two left open: "whatever, do your thing"), measured in
    Chromium, Firefox and WebKit on the built export:** (a) THE STEP MOVED, `@min-[60rem]:` → **`@min-[62rem]:`**
    (§15.22's arithmetic with the 270.1px brand: a bar ≥ 2 × (270.1 + 64) + 279.3 + 32 = 979.5px → 62rem). At 60rem
    the German gap at the step had fallen to 56.25px, under the 4rem floor, and under WCAG 1.4.12's text-spacing
    overrides „Smile" and „Startseite" OVERLAPPED (−13.8px of ink at a 1225px window, −7.8 at 1240). At 62rem German
    keeps 70.6px at the step (Chromium; 73–78 in Firefox and WebKit, whose bars are 15px wider at the same window),
    the flip moves from ≈1221 to ≈1261px of window (≈1243 without a scrollbar gutter) and the 1280 Notebook keeps the
    row. (a′) THE MARK COUNTS: the a11y review's lever — a fixed rem height so the grid's `1fr` auto floor sees the
    artwork — did NOT work alone (measured: the lockup's min-content stayed its text, 215.7px, in all three engines),
    because Tailwind's preflight gives every `<img>` `max-width: 100%`, which makes it COMPRESSIBLE (CSS Sizing 3: a
    min-content contribution of zero, whatever its height) — the true reason, too, behind Header.tsx's 2026-09-26
    record of the artwork "counting for ZERO". With `max-w-none` added, the min-content is the whole lockup: under
    the text-spacing overrides at the step the left track floors at 321.7px and the nav moves 7px right of centre
    instead of under the brand — no box overlaps, no ink closer than 1px, in any engine; at normal spacing nothing
    moves. (b) THE PHONE STEP MOVED, `@max-xs` (20rem) → **`@max-sm`** (24rem, Tailwind's next named step), and
    below it the name keeps the old 20px: with the 30px name at 20rem the bar wrapped the name on every phone up to
    ~392px and gave the large iPhones (403–435px) a 55px mark beside a two-line name; now every phone shows the
    phone lockup on one line, and the full sizes start where they fit on one line (a ~398px bar). Below 320 (a phone
    at a large text size) the burger stays on screen down to a ~223px layout (measured before the fitting).
    Tests that moved with it: Header.test's `STEP`, AtTheStep's 62rem frame (expected gap ≈72.2px, its 7rem
    ceiling unchanged), tests/e2e/header-step.spec.ts's windows 1180 / 1240 → 1220 / 1280 (the same 15–33px
    margins either side of the flip, gutter or not), the Wordmark phone-step pins.
    **(2) THE TAB ICON.** Next's own file conventions, no metadata code: `src/app/icon.svg` — a BYTE COPY of
    `public/images/brand/mark.svg` (the convention reads a file inside src/app; the `<img>` needs the mark in
    public/) — and `src/app/favicon.ico`, the mark rasterised to 16 · 32 · 48px PNG entries in one ICO (3.6 KB).
    MEASURED on the build: every page's head carries `<link rel="icon" href="/favicon.ico?…" sizes="48x48"
    type="image/x-icon">` then `<link rel="icon" href="/icon.svg?…" sizes="any" type="image/svg+xml">`, both files at
    the export root — Next collects `favicon` for the top-level segment although the root layout is
    `[locale]/layout.tsx` — and with `PAGES_BASE_PATH` set both hrefs carry the prefix (the Wordmark's own `<img>`
    does not: its KNOWN DEBT, so on the interim host the tab shows the logo while the header's is the recorded 404).
    WHY TWO FILES: SVG tab icons are drawn by Chrome 80+, Firefox 41+ and Safari 26+ only — every Safari up to 18.7,
    on the Mac and on the iPhone, draws none (caniuse link-icon-svg), and an older patient's iPhone may never run iOS
    26; the ICO is their icon, and it is also the file a browser asks for by default on the two documents Next does
    not write (`out/index.html`, the root redirect, and `out/404.html`, the dispatcher — no link tags there): that
    request goes to the domain root, so it finds the file on a root-served host and misses it on the interim Pages
    host's base path. The ICO's `sizes="48x48"` — not `any` — is what lets Chrome prefer the SVG. THE RECIPE,
    JavaScript only (§15.26's rule; the script stays machine-local, like the tracer): sharp renders the mark
    straight at each size — `sharp(svg, { density: 72 × size / 261 }).resize(size, size, { fit: 'contain',
    background: transparent }).png()`; sharp re-renders a vector at the target size, so supersampling changes
    nothing (measured: byte-identical) — and the ICO is a 6-byte header (0 · 1 · 3), three 16-byte entries (size ·
    size · 0 · 0 · planes 1 · 32 bpp · length · offset) and the three PNGs. `tests/unit/logotype-census.test.ts` pins
    the copy byte for byte (the mark's own census then covers it), the ICO's PROVENANCE — the SHA-256 of the mark it
    was rendered from, so a re-cut mark fails there until the ICO is regenerated and the hash moved with it — and
    its structure (16 / 32 / 48, each a whole PNG: signature, IHDR matching its entry, IEND last, every read
    bounds-checked). THE LOOK, measured: at 16px (a 1× screen) the strokes are under a pixel wide and the tooth reads
    faint; at 32px — a Retina tab, every iPhone — it reads clearly. On the common tab grounds the lilac half reads
    ≥ 3:1 and the grey half 2.3–5.4:1 (lowest on Chrome's light inactive tab, #dee1e6) — the logo's own colours,
    exempt as a logo (SC 1.4.11). The old site shipped Vite's default lightning bolt as `public/favicon.svg` and
    never linked it, so its tabs showed no icon at all (MIGRATION_INVENTORY).
    **REVIEW (G2 — react-reviewer, typescript-reviewer and a11y-architect, all on Opus by the owner's rule; asked:
    "did you run opus reviews?"):** three times APPROVE WITH CHANGES, 0 critical, 0 high. The mediums — AtTheStep's
    ceiling raised for a size that never shipped (back to develop's 7rem), widths computed as 1.5 × the 20px ones
    where the page measures less (every number in the lane now measured), the ICO not tied to its source mark (the
    SHA-256 pin), the text-spacing overlap (measured, then RULED under (a) and (a′)) — and the lows (stale comments, the 147px
    history, "every phone", a float compared exactly, the old site's unlinked favicon, the Pages note) folded in one
    round. Recorded, not built: `loadFace` in Wordmark.stories.tsx is the sixth copy of the `document.fonts.load`
    idiom (the §15.19 helper-promotion census).
    **Recorded, not built — the owner's:** an `apple-icon.png` (180 × 180: the iPhone home-screen and bookmark
    tile, one more file beside these); the OG share image (§15.6's last open item); a bolder small-size cut of the
    mark for 1× screens. Overlap, recorded: the uncommitted page-scale lane rewrites the same
    assertions in Wordmark.stories.tsx's Default play and Footer.stories.tsx's `expectLockupChain` (rem-relative
    sizes) — whichever merges second folds the other's numbers into its own (68.85 % of `5 * rem()`, the 30px name
    as `1.875 * rem()`).

32. **The bands scale as one — Home and Team — ON THE OWNER'S WORD (2026-10-02, verbatim: "ok this is a huge
    mission now and it is concerning laptop and desktop view of a webpage, size wise and allignment wise they are
    perfect on phone and tablet, so do not medle there. i need you to take whole of home page from the sliding
    window with photos downwards … I want both section to in parallel on widening of screen to be responsive and
    adapt in parallel, so headings and eyebrows grow together, always have same size and extremley important for
    headings and eyebrows, same offset always … the other page you have to implement the same thing once done is
    the team page"; lane `rework/bands-scale`):** on a laptop or a desktop the doctors band was drawn in its own
    design pixel (§15.25 round 2) while the bands around it stayed in rem, so its heading and eyebrow parted from
    theirs above the 1401 window (MEASURED on develop's build: 48.5 / 18.9px against 36 / 14 at 1882, 49.5 against
    36 at 1920) and its opener centred past the cap while theirs kept the column's edge (x 504.5 against 200 at
    2560). **THE MECHANISM — THE BAND SCALE:** the doctors band's regime is promoted to ui/Container and spelled
    there ONCE — `bandScaleClasses` (the design pixel `min(100cqw, 96rem) / 1106 × var(--band-zoom, 1)` and the
    `design-scale` remap behind the variant chain `scalable:@4xl:@min-[896px]:`) and `bandColumnClasses` (`mx-auto
    w-full scalable:max-w-[96rem]`) — and a band wears both on its RHYTHM box (ui/Container's recipe rule 5). Every
    band under the Home hero and every band of the Team page then draws in ONE pixel and caps at ONE width, so every
    eyebrow and every `<h2>` is one size and stands on one left edge at every laptop and desktop width, by
    construction; the reference point is the owner's own 1401 window (a design pixel = a CSS pixel there, every band
    its unscaled self, both openers 36 / 14px). Phones, every touch tablet, every window under the step and every
    engine that cannot register custom properties: nothing declared, nothing remapped, every pixel as before (§7's
    one exception, amended). **WHO WEARS IT:** sections/DoctorShowcase always (it invented it; D10 keeps the
    numbers' arguments and the recorded trades); sections/DoctorStats and sections/ClinicLocation when the page
    passes the NEW opt-in `scaled` prop — Home and Team do, the doctor page does not, because its other bands do not
    scale yet and its headings must stay one size with them (page-twins.test.ts holds all three pages); the reviews
    band's OPENER alone (the owner: "the reviews carrousell which you will not touch under any circumstance, it is
    already responsive BUT it's heading and eyebrow isnt" — the opener box carries the band's top step and the gap to
    the deck, the deck is its sibling and inherits nothing; ReviewsDeck.tsx is byte-identical); sections/TeamRoster
    always (its one page scales). **THE NUMBERS BAND'S TILES AT 9/8 — THE ZOOM** (the owner: "Some other text that
    should always mentain a ratio of 1 to 1 is for example from this [a doctor card's quote] and this [a tile's
    sentence] … raporst between [the sentence] and "Ani de experiență" and "11.000+" and svg in circle as they are now
    ar eperfect"): the tiles' list wears `bandScaleClasses` again with `--band-zoom` 1.125, so a tile is drawn at
    9/8 of the band's pixel — its sentence (text-base, 16) is 18 design px, the doctor quote's text-lg, at every
    width, and every ratio inside the tile is unchanged; the opener stays at the band's pixel. **THE MAP BAND, WHOLE**
    (the owner: "the map keeps expanding and the text with adress and phone number next to it keeps remianing the
    same … i do not want the map to be too large, the space the buttons take up too small or disproportioned" — the
    exact shape left to the planner, "those are not clear requirements"): opener, map, rows, discs and text are one
    design drawn at the 1401 window, so the map's share of the band never changes with the window again; the address
    keeps text-base, 16 design px — equal to the review cards' 16px body at the reference window (the owner's "base
    reference … 1 to 1") and growing with the map past it; the row discs follow through ui/disc.ts's host variable,
    `--disc-size: calc(var(--spacing) * 11)` (exactly 2.75rem outside the scale). LEVERS: the address one step up
    (text-lg, the doctor quote's size — the rows widen, the map narrows) and the map's share of the row. **THE
    TEAM PAGE'S STAFF** (the owner: "create an eyebrow and headline for the 3 cars with helping staff … the cards
    for helping staff are always adjusting in width. that should not happen. they should be fixed … also here
    important for phone and tablet make them a fixed size or smth"): TeamRoster gains REQUIRED `eyebrow` / `title`
    (`team.roster.*` — RO „Echipa de sprijin" / „Oamenii fără de care nu ne-am descurca", EN "Our support team" /
    "The people we couldn't do without", DE „Unser Praxisteam" / „Die Menschen, ohne die es nicht ginge", FR « Notre
    équipe de soutien » / « Les personnes sans qui nous n'y arriverions pas », IT « Il nostro staff » / « Le persone
    senza cui non ce la faremmo » — Claude's DRAFTS in all five languages, gender-neutral on purpose, flagged,
    §15.17) and names itself by its `<h2>`; its tiles become `<h3>`s and PersonnelCard's NAME_STEP gives an
    auxiliary's name `band` at level 3 too, so the names keep the owner's 30px (§15.24's per-level rule superseded
    for a name); the tiles hold ONE width — `w-72` (18rem, 288px) wherever the scale does not apply, fixed on every
    phone from 360px (a 360 phone's column is exactly 288) and giving way only at the 320 stress width (256px, never
    sideways), two to a row on a 768 tablet, three on an iPad held sideways; `w-88` in the scale, 352 design px,
    three tiles filling the 1106-design-px column at every laptop and desktop width (352px at 1401, ≈ 401 at the
    owner's ≈ 1594 window, where his screenshot showed 404) — and the staff portrait's `sizes` follows the scale
    (`(min-width: 70rem) and (pointer: fine) 14vw, 12rem`, PersonnelCard D19, derived by the census like the doctor
    cutout's). **MEASURED on the built export** (/ro/ and /ro/team/, Chromium, a classic scrollbar; develop's
    build beside it): every band's `<h2>` / eyebrow 29.2 / 11.4px at a 1140 window, 32.8 / 12.8 at 1280, 36 / 14
    at 1401, 39.5 / 15.4 at 1536, 48.5 / 18.9 at 1882, 49.5 / 19.3 at 1920 and 50 / 19.4 at 2560 — all four on
    ONE x at every width (504.5 at 2560, centred) where develop drew the doctors band alone at those sizes and the
    rest at 36 / 14 on x 200; a stats tile's sentence = the doctor quote at every width (14.6 / 16.4 / 18 / 19.8 /
    24.3 / 24.8 / 25px); the map 761 × 381 at 1401 (unchanged), 1041 × 521 at 1882 (develop 1146 × 573), 1074 ×
    537 at 2560 (develop 1800 × 900), the address 13 / 14.6 / 16 / 17.6 / 21.6 / 22 / 22.2px and the row discs 44
    × s; the map's share of its band within two points (68.5 % to 69.9 %) where develop's ran 65.8 % to 83.9 %
    — the typeface's optical sizing the remainder; the review cards' body 16px at every width (the deck
    untouched); the staff tiles 288px at 390 and 768 and on both touch tablets, 285.5 / 321 / 352 / 386 / 474 /
    484 / 489px from 1140 to 2560, their names `<h3>` at 30 × s. Unchanged: every 390 and 768 window and the 1180
    and 1366 touch tablets on Home; no sideways scroll at any width. **GUARDS:** tests/unit/design-scale.test.ts (the regime spelled ONCE in Container.tsx, the five
    wearers importing it, the zoom's one setter at 9/8, the one re-spelled gate chain — the staff tile's width —
    equal to the regime's *(two since the same day: the doctors band's ribbon width share, DoctorShowcase D11,
    §15.26 round 6, held to the same chain)*, the two picture hints derived), Container.test.tsx (the two strings' bytes, and the
    engine measured: 36px at a 1106 column, the cap at 1536 centred, rem under the step, the zoom), page-twins.test.ts
    (`scaled` on Home and Team, never on the doctor page, TeamRoster's two props), each band's own suite and stories,
    and NEW tests/e2e/band-scale.spec.ts on the built export (every opener = 36 / 14 × s on one left edge at seven
    laptop windows from 1140 to 2560, the tiles at 9/8 with the sentence equal to the quote, the map one proportion,
    the reviews body still 16px, the staff tiles 352 × s; unchanged at 390 and 768, on two touch tablets, and the
    staff tile at 288 on four phones and the 256px column at 320). **REVIEWS (G2 — react-reviewer,
    typescript-reviewer and a11y-architect, all three on Opus, each MEDIUM-or-above finding handed to an Opus
    verifier told to refute it):** three times APPROVE WITH CHANGES, 0 critical, 0 high. VERIFIED and FOLDED: the
    staff row's `justify-between` (the first fold of the builder's 768 finding) opened a 228–319px hole between
    two tiles on a 1024–1138px mouse window and 367–553px between a two-member staff's two tiles at every laptop
    width — the row is START-ALIGNED now, `gap-x-5` outside the scale and the regime's `gap-x-6` inside it (D9);
    the census's gate-chain reader missed backtick classes and a reordered chain (it reads both now, with a teeth
    test) and the zoom had no fence (no product code but ui/Container's read and DoctorStats' one class may name
    `--band-zoom`, an INHERITED property). The LOWs folded too: page-twins reads `scaled` as a BARE flag
    (`scaled={false}` fails), the reviews test refuses any attribute form and any spread on the deck, THE ZOOM's
    precondition (ui/Container the zoomed box's nearest container), stale captions and records. **EVIDENCE AT
    READY:** prettier · eslint (one older warning, in lib/ribbon-layout, untouched) · tsc clean; vitest 143 files
    / 3746 tests, and the same with the optimizer's variant folders hidden (CI's condition); build-storybook and
    `next build` green; e2e 192 passed / 110 skipped (the new band-scale spec 58 of 58); the visual differential
    at ZERO tolerance against a pristine build of develop bdb9611 (459 cells, private port): exactly the declared
    cells move — Pages/Home at 1280 / 1536 / 1920 in both languages (its 320 / 390 / 768 frames byte-identical),
    Pages/Team at all six widths, Sections/DoctorStats' three page-ground stories and Sections/ReviewsCarousel's
    six at 1536, Sections/TeamRoster's two and Sections/PersonnelCard's three auxiliary stories at 320 / 390 /
    1536, and Sections/ClinicLocation's NEW Scaled story at 390 / 1536 — plus 6 cells of 1–9 px in the harness's
    known flicker families (SpeedDial, the language dial, the price list); DoctorShowcase and ClinicLocation's
    existing stories byte-identical. **THE DARWIN SET, at the seal** (the owner, on the live previews, verbatim:
    "create pr. looks great"), on develop bdb9611 itself — develop had not moved, so nothing was rebased and the
    evidence above is the committed tree's: the 43 declared cells recorded under classic scrollbars (the 15px
    gutter read off the body's width first; `innerWidth − clientWidth` prints 0 in either mode) and verified 43
    of 43 — 41 re-recorded, Sections/ClinicLocation's Scaled at 390 / 1536 new — while Pages/Home's 320 / 390 /
    768 cells, which this lane does not move, still match the baselines #135 and #137 recorded: the proof of the
    mode. **RECORDED — the owner's calls, none built:** the regime's trades are §15.25
    round 2's (a browser zoom inside the regime leaves text the same size on screen until the column drops under the
    step — F94 under SC 1.4.4; the user's default font size not followed inside it; the jump at the step) and now
    hold for every band of Home and Team — a REGRESSION from develop for the numbers band, the map band, the staff
    band and the reviews opener, which were rem and doubled at 200 %: MEASURED by the a11y verifier, the map band's
    address grows ×1.95 at 200 % on a 1440 screen, ×1.82 on 1536, ×1.45 on 1920 and ×1.31 on 2560 (develop ×2
    everywhere), and a 20px default font on a 1440 laptop reads it at 16.45px where develop drew 20 — the contact
    rows, the path to the site's one conversion goal (§1), among them. The owner's acceptance of that trade for
    the doctors band now covers these bands too, or §15.25 round 2's levers apply (a cap at the reference keeps
    every band at its 1401 size and lets zoom enlarge it like rem); BACKLOG.md entry 2 lists it for the launch
    accessibility pass; the doctor page and the Services page are NOT scaled yet *(the Services page joined the
    same evening — round 2, below)* (the owner: "i
    will soom send your way other pages where you have to do the same") — turning `scaled` on for the doctor page's
    numbers and map is part of that page's lane; the uncommitted page-scale lane (`rework/page-scale`, a root
    font-size clamp) is the other road to the same wish and must never land beside this one.
    **Round 2 — THE PRICES PAGE (owner, 2026-10-02 evening, verbatim: "i need this responsiveness refactor also on
    the prices page. the best ration i see is on 1392 x 1179. so i do not want the cards jsut to wide, i want the menu
    and cards to adapt too with the width of the screen"; lane `rework/prices-scale`):** sections/PriceList — the
    Services page's one band — wears THE BAND SCALE on its rhythm box (`RHYTHM`, the grid that holds the menu card and
    the cards column), unconditionally (ui/Container's recipe rule 5 — it lives on one page, and that page now scales). ONE design pixel
    site-wide, no own reference: the owner's 1392 window is a 1098.6px column under the classic scrollbar, 0.7 % under
    the shared 1106 — and THE FLOOR, below, holds that window, like every window under the reference, at develop's own
    look to the pixel (under the classic scrollbar the darwin set is recorded in; with overlay scrollbars a 1392 window's
    column is 1113.6px and s = 1.007). TWO LITERALS MOVED, each the opposite way: (1) the menu track's floor `minmax(15rem,1fr)` →
    `minmax(calc(var(--spacing)*60),1fr)`, 15rem outside the scale and 240 design px inside it — at the reference the
    floor BINDS (1fr = (1106 − 32) / 5 = 214.8 < 240), so a rem literal would have held 240px while the cards scaled
    and the menu's share of the row would have drifted with the window; (2) the pill-coupled pair — the sticky menu's
    `@3xl:top-34` (the FIFTH coupled spelling of the pill's reach, §15.20) and the `scroll-mt-10` on the menu and on
    every card — re-spelled as rem LITERALS, `@3xl:top-[8.5rem]` and `scroll-mt-[2.5rem]`, the same values, because the
    pill they follow does not scale: the stuck menu still rests 136px down at every width, clear of the pill's aura
    (y 126), lib/sticky-rail still reads its line off the computed `top`, and lib/scroll-spy's reading line still reads
    a card's 40px stylesheet floor (measured on the built page at every laptop window); the comments that cite the pair
    — Header.tsx's MOUNT CONTRACT, lib/reading-line, lib/scroll-spy, lib/sticky-rail, two e2e specs — name the new
    spellings. **THE FLOOR — the owner's delegated decision** (verbatim, on this round's first pack and its open calls:
    "decide for me on decisions and create pr"): the band never draws SMALLER than the theme. ui/Container's design
    pixel gained an opt-in floor — `max(var(--band-floor,0px), …)` around the formula, its header's THE FLOOR — and the
    price list sets `--band-floor` to 0.0625rem (1rem / 16, the theme's own pixel at ANY root) on its rhythm box; every
    other wearer leaves it unset, 0px, and computes exactly what it did. Why: the owner's own BACKLOG entry 5 asks for
    LARGER price text for older patients, never smaller, and his complaint was the wide screens — so up to the
    reference the band is develop's look, and only past it does it grow. What it changes, measured: no jump at the
    regime's step at the default root (an 880 and a 900px column draw alike); under the reference a larger default font
    size and a browser zoom enlarge the band as rem does (a 20px root at a 1200px column: the card titles 45px, where an
    unfloored band reads 39.06); the gap between cards never under 32px, so the current card's 30px glow never reaches
    the next; the menu's link boxes never under 44px; a story's German stress label never overruns its link. Unregistered
    and INHERITED like the zoom, the variable is fenced by tests/unit/design-scale.test.ts — ui/Container's one read,
    PriceList's one setter, nothing else. **MEASURED on the built export** (/ro/services/, Chromium, a classic scrollbar;
    develop's build beside it): from the step (≈ a 1140 window) to the 1401 reference the band is develop's to the pixel
    — the menu card 240 × 655, the first card 625 / 737 / 827 / 834px wide at 1140 / 1280 / 1392 / 1401, card titles
    36px, rows 16px, the menu's links 18px on 44px boxes, the rail's modes as develop's; past the reference everything
    grows together — the menu 263 × 718 at 1536, 323 × 882 at 1882, 330 × 900 at 1920 and 333 × 908 at 2560, centred
    there (x 504.5); the first card 915 / 1124 / 1147 / 1158px wide, card titles 39.5 / 48.5 / 49.5 / 50px — the Home and
    Team headings' size from the reference up — rows 17.6 / 21.6 / 22.0 / 22.2px, links to 25px on 61.1px boxes; where
    develop's menu stayed 240 × 655 (its `1fr` track wider only past a ≈ 1560 window: 292 at 1882, 423 at 2560) and its
    cards widened alone, 942 → 1690px. Phones (390), tablets (768) and the two touch tablets (1180 × 820, 1366 × 1024):
    byte-identical; no sideways scroll at any width. **THE MENU'S HEIGHT, A CONSEQUENCE:** past the reference the menu
    grows with the design (655 design px), so it fits a window where 136 + 655 × s + 16 ≤ the window's height — under the
    reference exactly as on develop, but on a 1536 × 864 laptop (by 6px) and in a 1920 × 945 desktop browser window it no
    longer fits where develop's did, and the rail holds it as it has held the laptop's since 2026-09-18 (never a scroll
    container). The e2e specs followed their premises: price-menu-pin's parity story ("the menu fits") and
    price-reading-line's "second card above the middle at load" case moved to the owner's 1392 × 1179 window (the second
    card there starts at 422px against a 590px middle; at 1920 × 945 it now starts at 542 against 472); the laptop
    project's 1366 × 633 is develop's geometry under the floor, so the tall-menu story runs as it did — and since the
    review (below) it runs at the desktop project's 1920 × 945 too, a tall-menu geometry develop never had (a 900px menu
    with 60.5px links, bottom-pinned at top 29.5px), every height read off the window. **GUARDS:**
    tests/unit/design-scale.test.ts (PriceList among the WEARERS; the floor read in the pixel's formula, its one setter,
    its fence); Container.test.tsx (the floored bytes; a floored band holding 36px at a 900 column, scaling at 1300, 45px
    at a 20px root); PriceList.test.tsx's class contract (the rhythm box wears exactly its own classes, the floor and the
    two strings; no other element in the folder a `scalable:` class or the floor; no `top` or `scroll-mt` spelled as a
    spacing step anywhere in the folder — with a self-test); NEW PriceList.scale.test.tsx (measured, globals.css imported:
    the reference's lengths at 880 / 900 / 1098.6 / 1106px columns, × s at 1300, capped and centred at 1800, the 20px-root
    case, the nav's 136px top and the 40px margins at every column); the stories' plays (the floored design pixel read off
    the page); NEW tests/e2e/price-scale.spec.ts (eight laptop windows, the owner's among them, Romanian and German: every
    width and word design × the floored s, develop's exact sizes at 1392 × 1179, centred past the cap, the stuck menu at
    136px wherever it fits; the theme's own sizes at 390 and 768 and on the two touch tablets — with a REMAP reading,
    the band's `--spacing` against the root's, true at every laptop window and false at every other: under the floor
    a redrawn band and an untouched one draw alike, so this is the one reading that tells the floor from a gate that
    never opened). **REVIEWS (G2 — react-reviewer, typescript-reviewer and a11y-architect, all three on Opus):**
    three times APPROVE WITH CHANGES, 0 critical, 0 high. FOLDED — the census's comment stripper, which removed
    `/* */` blocks before `//` lines so that a `/*` inside a line comment hid whole page components from it (the
    typescript reviewer proved a floor setter on the Services page slipping past both fences): ONE left-to-right pass
    now, the fences reading globals.css's code too, and the D-LIT rule extended to the floor's and the zoom's setters;
    the 1392 test's unstated classic-scrollbar premise, now a named skip; the remap reading above, in the e2e reader,
    Container's floored-band test and the stories' plays (tests that could not tell the floor from a closed gate); the
    desktop's tall menu in price-menu-pin; unchecked casts in the new tests made named checks; the floor and the zoom
    recorded as never nesting (the floor is not multiplied by the zoom; their setters live in two other files); stale
    numbers in comments. **EVIDENCE AT READY:**
    on the tree rebased onto develop bed8003 (#142): prettier · eslint (one older warning, lib/ribbon-layout's `UNIT_PX`, untouched) · tsc clean; vitest 145 files / 3790 tests, and the same with the optimizer's variant folders hidden (CI's condition); build-storybook and `next build` green; e2e 236 passed / 126 skipped (the tall-menu story at both geometries now); the visual differential at ZERO tolerance against a pristine build of develop bed8003 (462 cells, private port): exactly the declared 10 cells move — Pages/Services at 1536 and 1920 in both languages and Sections/PriceList's six stories at 1536 — plus 8 cells of 1–6px in the harness's known flicker families (UI/SpeedDial, the language switcher, the open language dial in Sections/FloatingActions); Pages/Services at 1280 and every 320, 390 and 768 cell byte-identical (THE FLOOR), and nothing on Home or Team moved. THE DARWIN SET, at the seal: the 10 declared cells recorded under classic scrollbars (the 15px gutter read off the body's width first) and verified 10 of 10, Sections/LanguageBanner's five cells — recorded by #141 the same day — passing against the committed set as the mode's control. **RECORDED — the
    owner's calls, none built:** (a) THE FLOOR's one inconsistency: under the reference the Home and Team bands shrink
    while this one holds, so at a 1280 window a price card's title reads 36px where Home's headings read 32.8 — the same
    floor is one class on any band, a lever not taken for those pages (the a11y review names it the one-class fix for
    their own default-font regression); (b) SC 1.4.4 — under the reference the price list now follows a zoom and the
    default font size as rem does (never smaller than develop at any zoom or root), and past it the regime's trade
    stands, in the price list's own numbers (the a11y review's arithmetic, Chromium page zoom): a 200 % zoom grows the
    rows ×1.45 on a 1920 screen and ×1.44 on 2560 (develop ×2), the 110 and 125 % steps leave them unchanged on 1920 and
    the 175 % step on 2560, and twice the 100 % size arrives at ≈ 275 % — BACKLOG.md entry 2 carries the numbers; (c)
    three unused CSS rules still ship — `@3xl:top-34`, `scroll-mt-10` and `@3xl:grid-cols-[minmax(15rem,1fr)_4fr]` —
    because §15.20's history, the inventory's rows 54 and 99 and seven tests' className examples spell them (§15.25
    round 2's `@source not` for `*.md` is the lever for the docs half); (d) TWO ZOOM PATHS NOBODY HERE CAN MEASURE
    (no Firefox on the workstation, an e2e suite that runs Chromium only): Firefox's "Zoom Text Only" may zoom the price
    text TWICE — it zooms px font sizes, and the floor's rem resolves against the text-zoomed root before the registered
    pixel multiplies into every font step (≈ 4× text in 2× boxes at 200 %, the menu's unbreakable German labels then
    crossing into the cards) — and Safari's page zoom applies inside style computation, unlike Chromium's; both are
    explicit checks in BACKLOG.md entry 2, and the remedy if the first reproduces is to take the floor out of the
    registered pixel and spell it in the size steps themselves (`max(1rem…, …)`), whose font-relative units zoom once.

33. **The logo is a link home — ON THE OWNER'S WORD (2026-10-02, verbatim: "i want to create  a new button
    class. so i just want the "premium smile" logo from top bar and from footer bto be a component that takes
    you to home"; lane `rework/wordmark-home-link`):** the owner's own reversal of the 2026-09-06 drop ("i am
    dropping wordmark home link") and of fb-179 ("no second link to home in the footer"). sections/Wordmark's
    root — fb-200's hrefless placeholder `<a>` (D9) since 2026-08-20 — is a real link to the page's locale home
    in BOTH consumers, `/ro/`, `/de/` … (§15.13: a plain `<a href>`, a full document load, zero JavaScript),
    named „Premium Smile, acasă": the reserved `common.brand.ariaLabel` ×5 ("{name}, acasă" · "{name}, home" ·
    "{name}, Startseite" · "{name}, accueil" · "{name}, home"), called at last — the visible name leads the
    accessible name (SC 2.5.3) and the destination is spoken (SC 2.4.4); Header.test.tsx holds every language to
    open with `{name}`. "Button" is the owner's word for any control; a control that NAVIGATES is a link (§9).
    **The decisions — the planner's, each a lever:** (1) PROPS-IN — `href` and `aria-label` are REQUIRED props
    (§6.6: both consumers moved in the same change) and the consumers pass `localeHref(locale, '/')` and the
    translated label, so Wordmark keeps zero message keys, no hook and its four imports (§4's page-phase default,
    the owner's dumb-component preference) and §4's sub-kind list stands as written; (2) THE BOX HUGS the lockup —
    `h-full` left the root, `min-h-11` keeps a phone's target at 44px, and both consumers centre it
    (`items-center` on the Header's brand cell and on the Footer's `h-20` box — load-bearing: a flex parent's
    default stretch would pull the link back to the full row); MEASURED on the built export, Chromium and
    WebKit: 270.1 × 55.1px on a laptop, 171 × 44px on a phone, the link's width equal to the lockup's to the
    hundredth of a pixel; (3) THE RING is ui/TextButton's recipe — 2px of `--focus` at a 2px offset — on §15.1's
    6px `rounded-md`, inside the bar's 80px row at every width (measured); NOT the soft corner, whose census
    (§15.29) keeps four wearers; (4) NO HOVER LOOK — the old site's logo link had none, and it is the web's
    convention (the browser gives every `<a href>` the pointer); CONFIRMED by the owner on 2026-10-03, offered
    the jump or a slight dim: "no effect"; (5) THE BURGER'S FOCUS RETURN keeps landing on the row's first link: NavMenu's fallback —
    "the first `a[href]` in the bar", which would now be the logo — is scoped to the row's `<nav>`
    (Header.test.tsx pins that focus lands there and NOT on the logo). **Consequences, measured** on the built
    export in Chromium and WebKit: the Tab order is skip link → the logo → the row's first link (the burger on
    a phone); with the phone menu open the logo stays live (the bar is never frozen, the page below is), so the
    menu's cycle is logo → ✕ → Contact → the links; a click on either logo lands on its language's home
    (`/ro/team/` → `/ro/`, `/de/services/` → `/de/` from the footer); each page now carries two links home in
    the Header (beside „Acasă") and two in the Footer (beside the site map's „Acasă"), every pair under two
    names. No new message key, no new client island, and the compiled stylesheet lost one dead rule (the
    pointer-cursor class only the old D9 test named). **Visual, MEASURED** at ZERO tolerance against a pristine
    build of develop bed8003 (462 cells, private port 6181, classic scrollbars): NO existing cell moves — every
    Pages/*, Sections/Header, Sections/Footer, Sections/Hero and Sections/Wordmark cell byte-identical (the link
    paints nothing at rest; a 1/64px change in the name's layout position at desktop widths, measured in both
    engines, never reaches a pixel) — plus the 2 NEW cells of Sections/Wordmark's `FocusVisible` story (390 +
    1536: one Tab press, the ring) and 3 cells of 9–37px at 1–2/255 in the known flicker families (SpeedDial,
    the price list's glow, the Services page — located inside the price list, nowhere near the logo). **Reviews
    (G2, three Opus reviewers on the owner's word — "opus reviewers, no effect"):** react APPROVE, typescript and
    a11y APPROVE WITH CHANGES, 0 critical / 0 high; every LOW folded in one round — the hover guard reads every
    variant segment (`group-hover:` would have slipped past; proven red), the fallback scoped `:scope nav a[href]`,
    the props' docs say what the types guarantee (required; only `href`, `aria-label` and `artwork` reach the
    DOM), Esc from the logo with the menu open lands on the burger (the disclosure pattern — documented and
    tested), the logo live and ordered before the burger with the menu open (tested), the ring's colour pinned,
    stale comments. **THE BANNER — a measured regression, ACCEPTED by the owner (2026-10-03, offered a fix or
    the record: "2"):** the a11y review's MEDIUM predicted the footer logo fully hidden under the language
    banner at ≥1536px; MEASURED on the built export (Chromium, Firefox, WebKit; 390–1920px; the banner shown by
    a browser language unlike the page's) the logo never is — it rests 405–451px above the viewport's bottom,
    because the page cannot scroll past its end — but the measurement found what IS hidden: in Chromium, in
    windows 1024 to 1280px wide, Tab reaching the logo scrolls the page to its end, where the card covers the
    site map, and „Acasă" or „Servicii" is then ENTIRELY hidden when Tab reaches it (SC 2.4.11, AA; Firefox and
    WebKit keep 76–95 % visible; develop hid no footer stop at any width). The banner's own record named this
    case its re-open trigger and now says it fired (LanguageBanner.tsx); the cure, recommended and not built,
    is the banner's — keep its reach free at the page's end while it is open — and the gap is listed in
    BACKLOG.md entry 2. **Gates at the seal** (on develop e3837e2, the lane rebased onto #143 by a 3-way patch,
    MIGRATION_INVENTORY the one hand merge): prettier · eslint (0 errors; develop's one warning) · tsc clean;
    vitest 145 files / 3796 tests with the optimizer variants hidden (CI's condition); build-storybook and `next
    build` green; e2e 236 passed / 126 skipped / 0 failed; the visual differential at zero tolerance against a
    pristine build of e3837e2: no existing cell moved, the 2 new FocusVisible cells, 6 cells of 1–14px in the
    flicker families (SpeedDial, the language dial, the price list — none renders the logo). The 2 new darwin
    cells are recorded under classic scrollbars (a 15px gutter, read off the body's width). The compiled
    stylesheet lost two dead rules (a pointer-cursor class and a `@max-xs` gap rule, each spelled only in a
    test or a comment) and gained none. **Recorded, the owner's calls:** `aria-current` on the logo while you are on the home page
    (it needs the page's path in the browser — a client island for one attribute; the row's „Acasă" already
    carries it); in the test runner's 320 stress cell (a 15px scrollbar gutter, a 163px cell) the ring reaches
    4px into the burger's transparent box — on a real 320 phone, with no gutter, it clears it by 3px; §15.28's
    two levers (the placeholder `<a>` → `<span>`, striking the key) are void.

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
  landed on, off again at its blur. The server HTML carries none of the three), and the **Home Hero** (`sections/Hero` — the WHOLE band is the island, on `ui/use-rotation` over `lib/rotation`: which picture is opaque, which slogan readable and which bead current all depend on the active index, and its one static part, the two calls to action, hydrates anyway through ContactModalTrigger; the static HTML still carries every slide, both buttons and the beads at index 0 — hero lane, 2026-09-19, §15.21). **The doctors band adds ONE island, on Home and on the Team page alike: `ui/Ribbon`** (mounted 2026-09-30, §15.25, §15.26) — `sections/DoctorShowcase` is a server component that hands its server-rendered cards THROUGH the client component as children, so the ribbon never re-renders a card; after mount an effect starts the drawing and appends one canvas per card to the ribbon's empty `aria-hidden` layer, which is all the static HTML carries of it: no canvas, no state, nothing that depends on the visitor (rule 2 below). Until that day the Team page added no island. Since 2026-10-01 Home and Team carry a second one apiece: the clinic's numbers band (sections/DoctorStats on the page ground, §15.23 round 5) hydrates the doctor pages' `StatNumber` count-up under each of its three tiles — its section, heading and tiles stay inert HTML. **The doctor pages add TWO** (doctor-pages run, 2026-09-21, round 2 2026-09-25, rounds 2f–2g 2026-09-26, §15.23): TeamRoster, DoctorShowcase's own section, heading and list, DoctorIntro (with its CredoCard), DoctorProfile (with its ScheduleCard), the DoctorCourses band's heading, TintedBand and the reworked PersonnelCard compile to inert HTML; `sections/DoctorStats/StatNumber` is the count-up under each „în cifre” tile, which prints the final value in the static HTML and only decides after mount whether to count (reduced motion: never) — and, since 2026-10-01, the same island counts the clinic's three numbers on the Home and Team pages (§15.23 round 5: the band on the page ground, its section, heading and tiles still inert HTML) —, and `sections/DoctorCourses/CourseTimeline` is the timeline's rail on `lib/scroll-spy` — which year is CURRENT depends on the scroll position, so the static HTML carries every group grey and no `data-current` at all — plain `<a href>` links, CSS-only layout; the only script that rides with them is ui/Image's optimizer island under each portrait (PersonnelCard D11), which every page with a photograph already pays. Everything else stays inert HTML.
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
8. *(Added 2026-10-01, owner: "create also in this pr a list with stuff to do later")* Work
   deliberately left for later is listed in **`BACKLOG.md`** at the root — today the cookie
   consent for the map, a complete accessibility re-run on the finished site and the
   privacy/cookie policy page. Read it before planning launch work. An entry leaves the list in
   the lane that does the work, and a new one joins it on the owner's word.
