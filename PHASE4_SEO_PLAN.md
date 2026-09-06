# PHASE 4 — SEO PLAN & CONTENT-RUN SALVAGE

> **What this file is.** On 2026-09-06 the owner halted the Phase-4 content run (PR #81,
> "one growing PR", stages S1–S7) and decided: **the owner authors all page content
> personally** — Claude does not populate pages. This file preserves everything from that
> run that was NOT content-population: the SEO machinery design, the decisions made along
> the way, the resurrection map for the archived code, and the follow-ups the run
> discovered. It is deliberately **textual — it builds nothing**. Every build item below
> happens only on the owner's explicit dispatch (§15.7 / §17.6 of CLAUDE.md).

---

## 1. The decision (2026-09-06, owner)

- The seven-stage content run was halted mid-S4 (owner: "ok stop") and PR #81 was closed
  **unmerged**. Verdict: the PR was too big, and pages are the owner's to write.
- Claude's remaining Phase-4 scope is **machinery, not copy**: the SEO plumbing described
  here, and whatever plumbing the owner dispatches later. §14's content model (which
  sections exist on which page) remains the target — only WHO writes the content changed.
- Nothing from the run reached `develop`. The branch `feat/phase4-content` is kept as an
  **archive** so no work is lost; see the resurrection map below.

## 2. Resurrection map — what the archived branch holds

Branch `feat/phase4-content` (PR #81, closed 2026-09-06), three sealed commits, every one
gate-green at its seal (machine gates, two Fable reviews each, visual net, Lighthouse):

| Commit | Stage | Contents | Content or machinery? |
| --- | --- | --- | --- |
| `cc749de` | S1 | `lib/seo.ts` (Dentist JSON-LD builder + metadata/hreflang helpers, 191 lines) + `tests/unit/seo.test.ts` (198 lines) + the JSON-LD mount in `[locale]/layout.tsx` + shell-test pin | **Pure machinery — zero content.** `git cherry-pick cc749de` is expected to apply near-clean onto develop whenever the owner wants it. *(Lib-foldering rider, 2026-09-06: the pick lands the since-retired FLAT `src/lib/seo.ts` — follow with `git mv` into `src/lib/seo/seo.ts` and respell its importers to `@/lib/seo/seo` in the same motion, per the §4 folder convention.)* |
| `f7eec73` | S2 | Home page (Hero · ServicesTeaser · CTABanner), 20 keys × 5 locales (provisional), `lib/services.ts` price data, the `next typegen` typecheck fix, 24 visual baselines | Content, except two machinery nuggets: the typecheck fix (§5 below) and `lib/services.ts`'s data-vs-copy split (D-S2-6). Reference only. |
| `13408db` | S3 | Services page + `sections/ServiceCard` + `servicesJsonLd` (ItemList/Service) + D-DASH string sweep + 34 baselines | Mostly content; `servicesJsonLd` inside it is machinery and extractable. |

Also part of the archive:

- **S4 leftover:** the halted Team builder left ONE untracked folder,
  `src/components/sections/TeamMemberCard/`, in the worktree
  `premium-smile-worktrees/phase4-content` — inspect or delete at will; the branch itself
  is clean at `13408db`.
- **The full run record** (every D-numbered decision, gate evidence, Lighthouse numbers,
  owner mid-run asks): `.claude/plans/phase4-content-ledger.md` in the main checkout
  (gitignored, machine-local).
- **Provisional five-locale strings** for Home/Services live in the commits' diffs
  (`git show f7eec73 -- src/messages/ro.json`, same for S3); drafted 404 strings and two
  Romanian blog drafts live in the ledger. All were flagged PROVISIONAL for the owner's
  rewrite — which is now simply the owner's authorship.

## 3. SEO part 1 — machinery that already exists as code (design recap)

So the design survives even if the code is never cherry-picked, this is what `cc749de`
implements and why. (JSON-LD = a `<script type="application/ld+json">` block carrying
schema.org structured data that Google reads to show rich results; hreflang = `<link>`
tags telling search engines "this same page exists in these languages"; canonical = the
page's one official URL, so indexed duplicates don't split ranking.)

- **`dentistJsonLd()`** — the schema.org **`Dentist`** object (the specific type, §10.2),
  typed by `schema-dts` so a typo is a compile error, fed **only** from `lib/clinic/clinic.ts`
  (§10.1: one NAP source feeds Footer, ContactModal AND JSON-LD — consistency by
  construction). schema-dts quirk, found and solved: `Dentist = DentistLeaf | string`, so
  the builder returns `WithContext<Exclude<Dentist, string>>` to keep property access.
- **`pageMetadata(...)`** — per-page `title` / `description` / self-referencing canonical /
  full hreflang alternates / Open Graph block. It returns a **plain object shaped like
  Next's `Metadata`** rather than importing the type: the foundation-ring fence (PR #66)
  bans `lib/` from naming `next` even type-only. The shape is pinned by a typed
  `const _: Metadata` assignment in `tests/unit/seo.test.ts` — if Next's type drifts, the
  pin fails the typecheck.
- **`absoluteUrl(locale, path)`** = `clinic.url + localeHref(locale, path)` — the §5 URL
  rule stays spelled exactly once (in `i18n/href.ts`); seo.ts only prepends the origin.
  Interim-GitHub-Pages nuance: `localeHref` includes `PAGES_BASE_PATH`, so interim
  canonicals carry the base path — harmless while NOINDEX=1, and the real-domain build has
  no base path.
- **Mount point:** ONE JSON-LD `<script>` as the first body child in
  `[locale]/layout.tsx` — every page gets it from the shell (D-S1-1). Safe against the
  shell contract because `shellChildren()` filters `<script>` out ("renders no box"); a
  source-guard line in `shell.test.tsx` pins the mount so it can't silently vanish.

Decisions that ride with it (D-S1-4…8):

| Decision | Value |
| --- | --- |
| `Dentist.url` | `absoluteUrl('ro', '/')` — the ro home; root `/` is a redirect stub |
| hreflang `x-default` | the `ro` URLs (locales.ts charter) |
| JSON-LD `image` | **omitted** — §15.6: no asset in repo; inventing a URL = dead link (recommended field, not required — zero-errors target unaffected) |
| `og:image` | **omitted** — §15.6 blocks the share image |
| `og:locale` map | ro→`ro_RO`, en→`en_GB` (Union Jack precedent §8.5 — **confirm en_GB vs en_US**), de→`de_DE`, fr→`fr_FR`, it→`it_IT` |
| Blog pages | `alternates=false` → canonical only, no languages map (§10.4) |

Proof achieved at S1 seal: built `out/` HTML carries exactly one parseable JSON-LD script
per page, `@type: Dentist`, values === clinic.ts, no raw `<` in the payload.

## 4. SEO work that remains (never built — the plan)

1. **Per-page wiring recipe** for every owner-authored page: export metadata built by
   `pageMetadata` (title + description from that page's message namespace, §10.3 pattern
   _Service — Clinic — City_), which brings canonical + hreflang + OG along. New pages
   **never call `setRequestLocale`** — §15.16 Phase C retired the pair; the locale
   arrives via `next/root-params` inside `i18n/request.ts` automatically.
2. **seo.ts part 2 (the old S7)** — build-time generation (§16: everything identical for
   every visitor is compiled) of:
   - `sitemap.xml`: every locale × route with hreflang alternates + `x-default` (ro);
     blog URLs listed **bare** (ro-only, no alternates);
   - `robots.txt` pointing at the sitemap;
   - respecting the staging/interim rule (§15.2): NOINDEX=1 until the real domain — the
     sitemap ships but the interim host must never compete with launch SEO.
3. **`servicesJsonLd`** (ItemList/Service markup for the Services page, §10.2 optional) —
   code exists inside `13408db`; decision D-S3-4: Service items get finished strings,
   only real tiers, **no prices in structured data** while prices are provisional.
4. **Acceptance gates carried from the run:** Google Rich Results Test with zero errors
   (§10.2); Lighthouse SEO = 100 — already held at S2/S3 seals (98 / 100 / 96 / 100 on
   both Home and Services, LCP 1.1s, CLS 0, CWV pass; the Best-Practices deduction was
   solely the §15.6 favicon 404).

## 5. Small infra gap worth its own tiny lane (owner's word)

**Typecheck chain hardening:** on a fresh clone, `tsc` types `next/root-params` as `any`
until `next typegen` has run — the fix is `"typecheck": "next typegen && tsc --noEmit"`
(package.json + ci.yml + pre-push hook). It exists inside `f7eec73` but is **not on
develop**; PR #83 recorded it as flagged-not-taken. One tiny PR whenever dispatched.

## 6. Content rules to carry into owner-authored pages (distilled from the run)

These bind the copy regardless of who writes it:

- **CMSR** (medical-advertising law, since 2025-07-01): no superlatives, no promotions,
  no result guarantees — all five locales.
- **D-DASH** (owner wording rule, 2026-09-06): no mid-sentence punctuation dashes in site
  copy — rephrase via period/comma/colon; word-internal grammatical hyphens stay
  (Sună-ne, Contactează-ne, rendez-vous). Two interpretation calls left open for the
  owner: meta-**title** separators keep their dash (§10.3 prescribes it); the team-role
  separator `·` stays (a dot, not a hyphen).
- **Evidence-based drops** (recorded in MIGRATION_INVENTORY by the run): TrustStrip /
  ReviewsCarousel / ui/stars — the old repo's only trust content is 12 fabricated demo
  reviews, unshippable (honesty + CMSR); ClinicLocation + ui/map-frame — Google-Maps
  embed is §12-banned; DiceBear portraits — third-party at runtime, §12.
- **No photography exists** anywhere in either repo (old hero = Unsplash URLs). Until the
  owner supplies photos: hero stays a token-gradient paint band and the LCP element is
  the `h1` **text** — measured CWV-safe (LCP 1.1s). When a real photo arrives: §11
  pipeline + eager/high-priority wiring, and the LCP story changes.
- **Prices are data, not copy** (D-S2-6): values live in `lib/services.ts`, names and
  descriptions are message keys, rendering is `Intl.NumberFormat` RON + ICU `priceFrom`
  (§8.2/§8.3); only the 3 sourced tiers exist (consultation 100 · cleaning 250 ·
  whitening 800 RON); EUR display stays parked (§15.4). Full service list + prices =
  TODO(owner).
- **Copy note at 320px:** site-wide `hyphens: auto` may split "Whats-App" in prose
  (labels are exempt per §15.14, prose is not) — rephrase or accept, owner's call.
- **Blog design (D-S5, unbuilt):** posts as `content/blog/<slug>.mdx`, each exporting
  `export const meta = {title, description, date}` — zero new dependencies (§3 lock keeps
  gray-matter out; the shape is compiler-checked). ro-only mechanics: slug pages
  subtract via child `generateStaticParams` returning `[]` off-ro; the static index
  cannot be subtracted, so it calls `notFound()` for non-ro. Zero real posts exist —
  content is the owner's.
- **Localized 404 (old S6):** `common.notFound {title, text, home}` × 5 — Romanian drafts
  in the ledger (needs building + the owner's wording).

## 7. TODO(owner) — assets & data that gate SEO fields

| Item | What it unblocks |
| --- | --- |
| `lib/clinic/clinic.ts` real NAP (name, phone, WhatsApp, address, geo, hours, **url**) | `url` gates real canonicals, hreflang and JSON-LD `url`; the rest fills the Dentist object, Footer and ContactModal in one move (§10.1) |
| §15.6 logo → vectorized SVG → **favicon** + OG share image | favicon is the ONLY Lighthouse deduction; OG image + JSON-LD `image` fields un-omit |
| og:locale confirmation | `en_GB` vs `en_US` (D-S1-6) |

## 8. Follow-ups absorbed from the run (recorded so they're not lost)

- **Heading `page` step promotion** — now has TWO measured consumers (Hero's h1 sits as a
  raw `<h1>` because the atom's biggest step is `section`; Services showed h1/h2 visual
  flattening). Serialized atom rework, own lane.
- **AppConfig `Messages: typeof ro` augmentation** — moves message-key safety to compile
  time, repo-wide.
- **Footer/Wordmark `ms-` margin-regex sweep** — their §6.8 margin pins miss logical
  margin-start utilities.
- **Dentist/Service JSON-LD `@id` linking** (G2 LOW: provider `@id` cross-reference).
- **Capture-artifact note:** the right-edge sliver on contrasting bands in page frames is
  the headless browser's ~15px classic-scrollbar reserve painting `bg-page` — NOT
  overflow; §7 intact; recorded so nobody "fixes" it.

---

_Provenance: distilled 2026-09-06 from PR #81 (closed unmerged), its three commit
messages, and `.claude/plans/phase4-content-ledger.md`. The companion decision record is
CLAUDE.md §15.17._
