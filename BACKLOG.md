# BACKLOG.md — work left for later, on purpose

Started 2026-10-01 on the owner's word: "create also in this pr a list with stuff to do later if
it doesn't exist already. add there coookies, complete accesibility test rerun and policy page for
the moment". Each entry says what the work is, why it waits and where its record already lives.
The records stay the source of truth (CLAUDE.md, COOKIES.md); this file points at them. An entry
leaves the list in the lane that does the work, or when the owner drops it, and a new one joins it
on the owner's word. Decisions still go to CLAUDE.md §15.

An entry keeps its number for good, because CLAUDE.md and code comments cite the numbers: one that
leaves takes its number with it. Entry 5 — larger text on the Services page — left on 2026-10-10
on the owner's word ("drop this one"), the day entries 7 and 8 joined.

## 1 · Cookies — consent for the Google Maps embed

- **Why it waits:** the owner, 2026-09-09: "bypass somehow cookies consent for the moment … we'll
  get to cookies consent and implementation later" — recorded as CLAUDE.md §12's rider. The
  smaller first step below, `credentialless`, was proposed on 2026-10-01 and sent here by the
  owner on 2026-10-02: "add to backlog cookies".
- **Today:** the „Ne găsești" map (`sections/ClinicLocation`, on Home, Team and every doctor page)
  loads Google's `<iframe>` with the page, with no consent gate. The only cookie the site itself
  writes is the language cookie (COOKIES.md §2).
- **Known since 2026-10-01, not yet in COOKIES.md:** §3's "the embed set zero cookies" holds for
  WRITES only. In Chrome and Edge, which keep third-party cookies on, the frame SENDS a signed-in
  visitor's existing Google cookies and Google's page can read them: 19 of 46 requests carried one
  in a probe of the shipped `<iframe>` (the real Romanian map with the band's own attributes, on a
  test page, in Chromium holding a stand-in Google sign-in cookie). The EU cookie rule covers
  reading what a device stores, not only writing it. Safari blocks these cookies (0 sent, measured
  in WebKit); Firefox keeps each site's cookies apart by default (documented, not measured).
- **The smaller first step, no modal — `credentialless`:** the attribute gives the frame a fresh,
  empty cookie jar, thrown away when the page closes. Measured on the same probe: 19 → 0 requests
  carrying the visitor's cookie; the same picture and the same dragging; the place card's „larger
  map" and directions buttons open the same Google pages in a new tab as without it; no extra
  download (about 637 kB on a first visit and 2 kB on the next, either way). Chrome, Edge, Opera
  and Samsung Internet support it; Safari and Firefox ignore it and are covered above. The job:
  `credentialless=""` on the `<iframe>` under the `CONSENT SEAM` comment in ClinicLocation.tsx —
  the empty string, because React drops `credentialless={true}` with a warning (checked on
  19.2.8) — a few lines declaring the attribute for TypeScript (`@types/react` does not list it),
  a pin beside the attribute pins in ClinicLocation.test.tsx, and the read finding written into
  COOKIES.md §3 and §7 and CLAUDE.md §12's rider. No visual baseline moves: the visual net already
  blocks the map's traffic (`THE NETWORK FENCE` in `tests/visual/stories.spec.ts`).
- **What no attribute fixes:** the visitor's IP address reaching Google whenever the map loads by
  itself — the risk accepted and postponed on 2026-09-09 (COOKIES.md §3, the Google Fonts case).
  Routing the map through our own address does not help: Google's page fetches its pieces
  straight from Google's servers, and a static site has no server to route them. The two ways
  out without a modal are both in COOKIES.md §3's list. Click to load inside the map's own box: a
  picture of the map, one button and one line saying Google will see the visitor's IP address;
  the click is the consent and nothing is stored, so it asks again on every page with the map,
  and the map is not live until the click (for the picture, an OpenStreetMap image with its
  credit line or a drawn map; whether Google's terms allow a screenshot of its map is not
  checked). Or our own map (MapLibre with map data we host): live, with no Google and no consent,
  but not Google's look, no rating card and a large new library.
- **The work:** COOKIES.md §7 is the checklist — nine items, one lane: the consent record, the
  `<iframe>` absent (never hidden) until consent, the design of the no-consent branch (an image, a
  "show map" button or a plain link out — that lane's call), hydration safety (CLAUDE.md §16 rule
  2), the live flip, the tests, the disclosure (entry 3) and the clean-up of §12's rider. Read
  COOKIES.md §5 before adopting any third-party consent manager.
- **Also checked on 2026-10-01:** nothing else stores anything — the only cookie writer is
  `src/i18n/cookie.ts`, no other browser storage is used, and GitHub Pages, the interim host,
  sends no cookies (its response headers). A link inside the map opens Google's own pages in a
  new tab, where Google sets its own cookies (five Google Analytics cookies on its Terms page, in
  the probe) — the visitor's own visit, like any link out. Cloudflare, §15.2's candidate launch
  host, can add a cookie of its own (`__cf_bm`) through its bot protection: keep that off, or list
  it on the policy page (entry 3).

## 2 · A complete accessibility test, re-run on the finished site

- **Why it waits:** CLAUDE.md §9 makes WCAG 2.2 AA an acceptance criterion and asks the page tier
  for "a manual keyboard walkthrough and a screen-reader pass (NVDA or VoiceOver) before launch".
  Every lane has tested its own part; nobody has yet walked the whole site as built.
- **The work, on the built export, on every page type (Home, Services, Team, a doctor page, the
  404, the contact dialog, the language banner), in Romanian and in German:**
  - automated: the per-story axe run (CI already has it) plus an axe or Lighthouse pass over the
    built pages;
  - keyboard only: Tab and Shift+Tab through every page — focus always visible, nothing trapped,
    Escape closes the dialog and focus returns to its opener;
  - screen readers: VoiceOver on macOS and on an iPhone, NVDA with Firefox on Windows;
  - reflow at 320px and at 200% zoom with no sideways scroll; Windows High Contrast (forced
    colours); reduced motion.
- **Open records to confirm or re-open in that pass:**
  - SC 2.2.2 on the two rotators — no stop for mouse or touch, and no hold while a screen reader's
    reading cursor is on a review (CLAUDE.md §15.19 round 4, §15.21 round 3);
  - SC 2.4.5 Multiple Ways — a doctor page is reachable only through its card (§15.23; the doctors
    dropdown recorded in §15.15 is one answer);
  - forced colours — `ui/Button`'s solid face loses its boundary when it dresses an `<a>` (§15.23,
    §15.25: the `forced-colors:border` follow-up) — the contact dialog's call and WhatsApp
    controls among them, the site's main conversion controls (§15.30 round 5);
  - owed listens — iOS VoiceOver on the doctors list and its phone reading order (§15.25), and on
    the stat tiles, plus NVDA with Firefox in browse mode on a tile (§15.23 round 5);
  - the map — the corner buttons over Google's zoom controls at 320 and 390px, and the Tab order
    through Google's frame (COOKIES.md §7);
  - SC 2.4.11 Focus Not Obscured under the language banner — an ACCEPTED gap (the owner, 2026-10-03,
    CLAUDE.md §15.33): with the suggestion card open (a visitor whose browser language differs from
    the page), a keyboard visitor in Chrome or Edge in a window 1024 to 1280px wide who Tabs into the
    footer finds „Acasă" or „Servicii" ENTIRELY hidden behind the card. The footer's logo, a link
    since that day and the footer's first stop, makes Chromium scroll to the page's end, where the
    card covers the site map; Firefox and Safari keep 76 to 95 % of those links visible, and develop
    before that day hid none (measured on the built export). The page cannot scroll past its end, so
    the cure belongs to the banner: keep room for the card at the page's end while it is open — the
    planner's recommendation, declined for now (LanguageBanner.tsx, its SC 2.4.11 record). Those
    numbers were taken with the card 16px lower than today (it rose with the corner buttons on
    2026-10-09, CLAUDE.md §15.36), so the walk re-measures which footer links hide at 1024–1280px;
  - the language banner on SHORT screens (CLAUDE.md §15.36, computed by the a11y review, not yet
    measured): the card's top slides under the sticky top bar on a viewport under about 408px tall
    (392 before 2026-10-09), and between about 277 and 315px both of its controls hide entirely —
    1366 × 768 at 200 % zoom and phones held sideways are the cases; the lever, the owner's, is to
    drop the card to the corner row on short, wide screens;
  - the phone gutter (CLAUDE.md §15.35) — in SAFARI on a phone (320 to 480px), Tab a short footer
    site-map link („Acasă", "Home", "Team") into the bottom strip: WebKit leaves a focused control
    where it is, and with the halved gutter the label can sit almost entirely under the 56px language
    bulb (the G2 a11y review's arithmetic: the label at x ≈ 16–61 against the bulb's 16–72 at 320;
    it used to end clear of it); confirm that its ring and part of the label stay visible (SC 2.4.11,
    met by that arithmetic) or move the strip's links in;
  - the price menu — Firefox, a real iPhone and screen readers never run (§15.20 round 5); and, since
    the band scale reached it (CLAUDE.md §15.32 round 2), two zoom paths never measured: open
    `/de/services/` in a 1920 window in FIREFOX with View → Zoom → "Zoom Text Only" at 150 and 200 % —
    the price rows must read ≈ 1.5× and 2× their 100 % size (not 2.25× and 4×, the double zoom the
    rem floor may cause), and no menu label may cross into the cards column; and compare SAFARI's page
    zoom at 125 / 150 / 200 % against the Chromium numbers below;
  - SC 1.4.4 Resize Text on Home, Team and Services — the band scale (CLAUDE.md §15.25 round 2, §15.32
    and its round 2): on a laptop or desktop every band there — the Services page's price list since
    the same evening, which a floor holds at the theme's own size under the reference, so there it
    follows a zoom as rem does — draws in a design pixel that follows its column, so a browser
    zoom leaves its text the same size on screen until the column drops under the scale's step (the
    map band's address at 200 %: ×1.45 on a 1920 screen, ×1.31 on 2560, against develop's ×2), and a
    larger default font size is not followed (a 20px setting on a 1440 laptop reads the address at
    16.45px) — so the 200 % zoom check above must test that text GROWS, not only that nothing
    scrolls sideways. The owner's levers are in §15.25 round 2 (a cap at the reference). The
    price list's OWN numbers (§15.32 round 2, the a11y review's arithmetic, Chromium page zoom):
    under the reference a floor keeps it never smaller than develop and growing with a zoom as rem
    does; past it a 200 % zoom grows the price rows ×1.45 on a 1920 screen and ×1.44 on 2560
    (develop ×2), the 110 and 125 % steps leave them unchanged on 1920 and the 175 % step on 2560,
    and twice the 100 % size arrives at ≈ 275 %.

## 3 · The privacy and cookie policy page

- **Why it waits:** CLAUDE.md §12 asks for "a short privacy/cookie policy page (all locales)
  disclosing the language cookie". Nothing exists yet: no route, no Footer link, no message keys
  (§14's Footer row names the link).
- **What it must say, gathered from the records:** the language cookie — its name, purpose,
  lifetime and Safari's ~7-day cap (§8.7, §15.14); the consent record, if entry 1 ships one; that
  loading the map hands the frame to Google, and how to withdraw consent (COOKIES.md §8, which
  notes the disclosure is owed even for an exempt cookie); and the clinic's legal identity and an
  e-mail address, which the site shows nowhere today — company name, CUI, trade-register number
  (§15.27).
- **Who writes what:** the words are the owner's (§15.17); the machinery — the route in five
  languages, the Footer link, the page itself — is built on his dispatch. Entry 1's disclosure
  lands here.

## 4 · New words for the doctors band's eyebrow, „Familia Premium Smile"

- **Why it waits:** the owner, 2026-10-02: "add to backlog changing familoia premium smile as that
  sounds particularly toxic". The label came from his own direction of 2026-09-30 ("… in the
  direction of specialistii cu care ne mandrim familia premium smile", CLAUDE.md §15.25); no
  replacement is chosen yet, and the words are the owner's (§15.17).
- **Today:** `team.showcase.eyebrow` — RO „Familia Premium Smile", EN "The Premium Smile family",
  DE „Die Premium-Smile-Familie", FR « La famille Premium Smile », IT «La famiglia Premium Smile»
  (the last four Claude's drafts) — the small mono label above „Specialiștii cu care ne mândrim"
  in the doctors band (`sections/DoctorShowcase`), on Home and on the Team page. The title stays
  unless the owner widens this entry.
- **The work:** the five values in `src/messages/*.json` — the CMSR scan (CLAUDE.md §13) reads
  every `team.*` value, so a new label passes it or fails CI; the band's own fixtures that quote
  today's Romanian, `EYEBROW_RO` in DoctorShowcase.stories.tsx and `EYEBROW` in
  DoctorShowcase.test.tsx (the page twins read the key and follow by themselves; the e2e spells
  only the title); the records that quote it — CLAUDE.md §14's Home and Team rows and §15.25's
  **Words**; and the screenshots that show it — Pages/Home, Pages/Team, and Sections/DoctorShowcase
  if its fixtures follow.
- **Directions, if useful when the time comes (drafts, not decisions):** a plain name for the
  people — „Echipa medicală", „Medicii noștri"; not „Echipa noastră", which is already the Team
  page's own `<h1>` (hidden, but read by screen readers just before this band).

## 6 · Re-optimise the site for all its static content

- **Why it waits:** the owner, 2026-10-02, while the ribbon's white specks were being fixed: "add also
  with this pr in the backlog to reoptimize site for all static content". The ribbon fix (CLAUDE.md
  §15.26 round 7) is the trigger: it was a performance question too, and it showed how much the
  browser can still be spared.
- **What it is:** one pass over everything the static export serves — the HTML of every locale ×
  route, the stylesheet, the client islands' JavaScript, the fonts, the optimised pictures — for
  weight and for the work the visitor's browser does with it, against CLAUDE.md §10.6, which already
  makes Core Web Vitals an acceptance criterion: Lighthouse / PageSpeed on the built export for each
  page type, the hero picture as the LCP element. The exact scope is the owner's to set when the
  work starts.
- **Starting points already recorded (read them first; none is a decision):**
  - the doctors band's ribbon sizes one canvas per card at mount, also on Home where the band starts
    below the first screen; lazy canvas creation is the recorded lever (CLAUDE.md §15.25) — and since
    round 7 each tile's pieces are painted in software and copied, at about develop's main-thread time
    on the workstation and a phone emulated with a slowed processor, never on a real phone (§15.26
    round 7 has the numbers);
  - the services page ships about 162 KB of JavaScript gzipped (§15.20 round 5's measurement), most of
    it the framework every page carries;
  - the hero's three photographs ship at 1920 × 1280, 74–202 KB each before the optimiser's variants
    (§15.21 round 11).
- **How to measure it:** on the built export, served the way the host will serve it, never the dev
  server — `next dev` ships unminified bundles and a different image pipeline. Record each page
  type's numbers before and after, in five languages where the words change the weight.

## 7 · What only the owner can supply — the placeholders

- **Why it waits:** these are the clinic's facts and words, and the owner authors the site's
  content (CLAUDE.md §15.17). Each is marked `TODO(owner)` where it lives; until it arrives, the
  site shows a placeholder. Added on the owner's word, 2026-10-10.
- **`src/lib/clinic/clinic.ts`:**
  - the WhatsApp number — the phone's for now, on the owner's word ("for the moment leave same
    number, i'll modify that", §15.27);
  - the production domain — still `https://example.com`. The metadata §10 asks for needs it
    (canonical URLs, hreflang links, the sitemap, the Open Graph tags), and the interim host stays
    noindex until it is attached (§15.2).
- **`src/lib/team/team.ts`:**
  - the six doctors — their names and specialties are the owner's; everything else is a random
    placeholder under those real names, in all five languages: the pictures (demo silhouettes),
    the weekly hours, the course rows, the four „în cifre" numbers, the quotes and the three
    biography paragraphs (§15.23 round 3, and the file's `TODO(owner): REAL DOCTORS, PLACEHOLDER
    DETAILS` block, which also flags Claude's two edits to the names and the specialties for
    confirmation). The hours matter most: a patient could act on a placeholder "Thursday: closed".
    The reviewers' interim fix is the clinic's own week for all six until each doctor's is known;
    the uncommitted `rework/drop-doctor-schedule` lane takes the doctors' weeks off the site
    altogether — if it merges, the hours leave this entry;
  - the clinic's three numbers on Home and Team — 16+ years, 8.000+ patients, 11.000+ procedures —
    placeholders too (`clinicStats`, §15.23 round 5): no clinic-wide count exists in the
    repository or on the old site.
- **`src/lib/prices/prices.ts`:** five rows read off a skewed photograph of the printed tariff
  carry `TODO(owner): verify against the printed sheet` (§15.20).
- **`src/lib/hero-slides/hero-slides.ts`:** the Home opener's three slogans and their picture
  descriptions are Claude's drafts in all five languages (§15.21 round 11) — to confirm or rewrite.
- **Consent (GDPR):** written consent from the patients whose seven Google reviews show their
  names, three with their photographs — a name beside a dental review is health data, art. 9
  (§15.19 round 4, `src/lib/reviews/reviews.ts`); and the same from every doctor and every member
  of staff the site names, pictures and describes (`lib/team`'s block). The staff's portraits are
  still demo silhouettes (§15.23 round 4).
- **Already public:** nothing in CI refuses a release while these placeholders remain — the
  release gate recorded in §15.23 round 3, a test that refuses a production build while `lib/team`
  is flagged placeholder, was never built — and the 2026-10-03 promotion published them on the
  interim host, which is built with `NOINDEX=1` (`.github/workflows/release.yml`), so search
  engines skip it.
- **The work:** the owner sends each value; it lands in its file, where the data tests and the
  CMSR scan (§13) check it.

## 8 · Decisions parked until launch

- **Why it waits:** each is recorded as the owner's to make before launch, and none blocks the
  work in progress. Added on the owner's word, 2026-10-10.
- **The decisions:**
  - translated URLs — `/de/leistungen` instead of today's shared English slugs (`/de/services`).
    Decide before launch: changing a published URL afterwards needs redirects (CLAUDE.md §5,
    §15.3);
  - EUR prices on the four foreign-language pages — every price is in RON today, on every page
    (§8.3, §15.4; §15.20 records a EUR column "maybe, on every language");
  - the share image — the picture WhatsApp and Facebook show beside a link to the site, the Open
    Graph image (§10.3; §15.6's last open item, for which the logo mark is the natural source);
  - the final host — Cloudflare Pages is the recommendation, not yet confirmed; GitHub Pages is
    the interim host only and will not be the launch host (§15.2);
  - the purple — whether `accent-decorative` #7A6D9C moves to the logo's own lilac #8576B1, which
    re-tints the lilac tints, the auras and the ribbon with it (§15.1's one open sub-item, §15.28).
