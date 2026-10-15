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
- **DONE 2026-10-10 — the smaller first step, `credentialless` (CLAUDE.md §15.38):** since
  2026-10-01 we knew §3's "the embed set zero cookies" held for WRITES only — in Chrome and Edge,
  which keep third-party cookies on, the frame SENT a signed-in visitor's existing Google cookies
  (19 of 46 requests in a probe of the shipped `<iframe>`), and the EU cookie rule covers reading
  what a device stores. The map's `<iframe>` now wears `credentialless` (spelled as its own name,
  because the export's React drops an empty string; a fresh, empty cookie jar, thrown away when
  the page closes: measured 19 → 0, the map, its dragging and its card
  buttons unchanged); Safari blocks those cookies anyway and Firefox keeps each site's cookies
  apart. The finding and the fix are in COOKIES.md §3 and §7 and CLAUDE.md §12's rider; the
  privacy page discloses the map (entry 3). A note under the map said it where it happens from 2026-10-10
  until the owner removed it on 2026-10-13 (CLAUDE.md §15.38 round 3): the policy, linked from every footer,
  carries it alone, and such a line is required again only beside the button if the map goes click-to-load.
- **The owner's direction, 2026-10-10 (advice session, no code changed by it):** "i want that thing
  with the map to work automatically when you open the website". The advice given, recorded here
  for the day this entry is picked up: automatic + Google's map + no consent — the law allows two
  of the three. KEEP IT AUTOMATIC for now (the accepted risk of 2026-09-09, its cookie half now
  closed); switch to click-to-load (below) the day any complaint or letter arrives, or BEFORE the
  site is marketed to German patients (the Google Fonts letters came from Germany, and GDPR lets a
  visitor sue at home); if "automatic AND no risk" is ever wanted, the answer is our own map
  (MapLibre), never a banner for one map. Measured the same day for comparison: jonaclinic.ro sets
  16 cookies before any click (Google Analytics, Google Ads, the Facebook and TikTok pixels,
  YouTube, reCAPTCHA) and keeps loading them after „Refuz" — the pattern ANSPDCP has fined
  (5,000–40,000 lei in 2024–2026, every case trackers without consent, none a map).
- **The rule that keeps the site banner-free:** no analytics, no Facebook or TikTok pixel, no
  Google Ads tracking, ever, without a consent tool that BLOCKS them until a "yes" (COOKIES.md §5).
  The day one is wanted, this entry's work becomes due.
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
  blog's list, the 404, the contact dialog, the language banner), in Romanian and in German:**
  - automated: the per-story axe run (CI already has it) plus an axe or Lighthouse pass over the
    built pages;
  - keyboard only: Tab and Shift+Tab through every page — focus always visible, nothing trapped,
    Escape closes the dialog and focus returns to its opener;
  - screen readers: VoiceOver on macOS and on an iPhone, NVDA with Firefox on Windows;
  - reflow at 320px and at 200% zoom with no sideways scroll; Windows High Contrast (forced
    colours); reduced motion.
- **Open records to confirm or re-open in that pass:**
  - SC 2.2.2 on the three rotators — no stop for mouse or touch, and no hold while a screen reader's
    reading cursor is on a review (CLAUDE.md §15.19 round 4, §15.21 round 3); the third, since
    2026-10-13, is the doctor page's courses column, whose highlight moves from idea to idea every
    3 seconds on its own (§15.23 round 7) — it hides nothing, every idea stays readable, but it
    starts by itself, never stops while the courses are on screen, and runs BESIDE the biography,
    the page's main reading; and unlike the Hero and the reviews deck, which hold while keyboard
    focus is inside them, it has NO STOP FOR ANYONE, keyboard included — nothing in it is
    focusable (the accessibility review's MEDIUM of that day). What would conform: a pause/stop
    control, or one sweep that finishes within 5 seconds when the list comes into view and then
    rests; a hover hold alone, or one lap then stop (18 seconds), would not;
  - SC 2.4.5 Multiple Ways — a doctor page is reachable only through its card (§15.23; the doctors
    dropdown recorded in §15.15 is one answer);
  - forced colours — `ui/Button`'s solid face loses its boundary when it dresses an `<a>` (§15.23,
    §15.25: the `forced-colors:border` follow-up) — the contact dialog's call and WhatsApp
    controls among them, the site's main conversion controls (§15.30 round 5);
  - owed listens — iOS VoiceOver on the doctors list and its phone reading order (§15.25), and on
    the stat tiles, plus NVDA with Firefox in browse mode on a tile (§15.23 round 5); and, on the
    blog's list at a laptop width (`/ro/blog/`), the site's first forced line breaks (§15.39 round 3
    (7)): the `<h1>` and the lead keep their line breaks there, so check with NVDA in Chrome and in
    Firefox, and with VoiceOver in Safari (WebKit computes its own accessible name), that H and the
    headings list announce the WHOLE heading — its second line, which ends on „prin blogul nostru",
    is what says the page is the blog — and that arrowing reads both heading lines and the lead's
    three (Chromium's accessible name has a space at the break, measured; the tests' library keeps
    the break, so only a real screen reader proves it);
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
    1366 × 768 at 200 % zoom and phones held sideways are the cases. The lever — drop the card to the
    corner row on short, wide screens — was TAKEN on 2026-10-09 for the price strip's sake (CLAUDE.md
    §15.20 round 6: under 30rem of height and from 40rem of width); a short window NARROWER than 40rem
    keeps the lift. MEASURED there since (Chromium, an Italian browser on `/ro/services/`, before any
    scroll): an SC 2.4.11 FAILURE, older than the strip — on develop the stacked menu's first link
    „Consultații" is wholly hidden at 390×500 and 390×525, and with the strip the first two chips are
    at 390 × up to ~481px (partly to ~525), so a link or chip focused there is entirely hidden. The
    a11y review's recommended cure, the banner's own lane: no suggestion on windows narrower than
    40rem and shorter than about 32rem (§8.6 makes it optional; the corner language button is one tap
    away), and Escape to dismiss it everywhere;
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
  - the price STRIP (CLAUDE.md §15.20 round 6) — on a real iPhone: its touch scrolling, the hidden
    scroll indicator (iOS 18.2 and later), a link straight to a category on a slow connection (the
    load wait) and VoiceOver's reading order through the chips; on a laptop window under 60rem with
    a mouse only: whether the row stays discoverable with its scrollbar hidden (the owner's call);
  - the blog's list (CLAUDE.md §15.39 rounds 2 and 3, 2026-10-14), in every language: in FIREFOX
    with View → Zoom → "Zoom Text Only", the cards' category chips — drawn in a pixel of their own,
    relative to the card (THE CHIPS' PIXEL in tests/unit/design-scale.test.ts) — may zoom twice,
    like the price list's floor above: open `/de/blog/` in a 1920 window at 150 and 200 % and check
    that a chip's label reads ≈ 1.5× and 2× its 100 % size, not more, and stays on its picture; on
    page 1 in a 390px window in SAFARI (macOS: Settings → Advanced → "Press Tab to highlight each
    item on a webpage", or Option+Tab; an iPhone: Full Keyboard Access), scroll until the pager rests
    behind the bottom-right discs, then Tab onto its forward arrow — the pager sits right-aligned
    under the call and WhatsApp discs, and WebKit leaves a focused control where it is, so the arrow
    can be entirely hidden (SC 2.4.11; the root's `scroll-padding-bottom` keeps it clear only where
    a browser scrolls the focused control into view); on a phone held sideways, open the menu and
    reach „Blog", the panel's fourth link, below the screen's fold — the panel scrolls by design (its
    height capped to the screen), so check that a finger reaches „Blog" and that Tab brings it into
    view; and the top bar's step with four links in every row was measured in Chromium only
    — re-measure it at 62rem in Firefox and Safari (CLAUDE.md §15.22's arithmetic; French binds);
  - SC 1.4.4 Resize Text on Home, Team and Services, on every doctor page since 2026-10-13 —
    its map band first, then the whole page the same day — and on the blog's list since 2026-10-14
    (at a 1140 window its summaries and its hero's lead — the page's introduction — read 13px, its
    authors 11.4 and its card titles 24.3, and a
    20px default font is not followed — ACCEPTED as on Home by the owner on 2026-10-15, the floor
    left to this pass with every scaled page) — the band scale (CLAUDE.md §15.25 round
    2, §15.32 and its rounds 2, 3 and 4; a doctor's biography is the page's longest reading): on a laptop
    or desktop every band there — the Services page's price list since
    the same evening, which a floor holds at the theme's own size under the reference, so there it
    follows a zoom as rem does — draws in a design pixel that follows its column, so a browser
    zoom leaves its text the same size on screen until the column drops under the scale's step (the
    map band's address at 200 %: ×1.45 on a 1920 screen, ×1.31 on 2560, against develop's ×2; on a
    doctor's page, since 2026-10-13, the map band is the ONE band that keeps its size — on a 1440
    laptop its address holds 16.4 device px at 100, 110 and 125 % while the biography grows 18 →
    22.5, on a 1920 screen 22px up to 150 %, CLAUDE.md §15.32 round 3), and a
    larger default font size is not followed (a 20px setting on a 1440 laptop reads the address at
    16.45px) — so the 200 % zoom check above must test that text GROWS, not only that nothing
    scrolls sideways. The owner's levers are in §15.25 round 2 (a cap at the reference) and §15.32
    round 2 (THE FLOOR — on every scaled page at once, so the pages keep matching); he accepted the
    trade for the whole doctor page on 2026-10-13 ("Accept, like Home"), leaving the floor to this
    pass. The
    price list's OWN numbers (§15.32 round 2, the a11y review's arithmetic, Chromium page zoom):
    under the reference a floor keeps it never smaller than develop and growing with a zoom as rem
    does; past it a 200 % zoom grows the price rows ×1.45 on a 1920 screen and ×1.44 on 2560
    (develop ×2), the 110 and 125 % steps leave them unchanged on 1920 and the 175 % step on 2560,
    and twice the 100 % size arrives at ≈ 275 %.

## 3 · The privacy and cookie policy page

- **BUILT 2026-10-10 (CLAUDE.md §15.38; the owner: "build all things mentioned and all fixes and
  add to backlog what needs to be done"):** `/{locale}/privacy` in all five languages
  (`sections/PrivacyPolicy`), linked from the Footer's legal strip („Confidențialitate și
  cookie-uri") on every page (a note under the map also pointed at its map part until
  2026-10-13); the Services page
  says under its last card that the prices include all taxes. The page states what the site
  measurably does: the host's logs, the ONE language cookie (its name and its 12 months read from
  the code, Safari's ~7 days), the Google map and its IP transfer, phone and WhatsApp contact, the
  links out, the visitor's rights and the complaint to ANSPDCP, and who runs the clinic.
- **Why it still waits — the owner's part, before launch:**
  - **the clinic's legal facts** — `legal` in `src/lib/clinic/clinic.ts`: the company's registered
    name, CUI, Trade Register number, registered office, and an e-mail for privacy requests. All
    five are on the registration certificate (Certificat de înregistrare) or with the accountant.
    Until each arrives the page prints „[de completat]" in its place and the e-mail is no link;
  - **the professional details** the page states (Law 365/2002 art. 5 for a regulated profession):
    that the doctors hold the title „medic dentist", granted in Romania, and are members of the
    Colegiul Medicilor Stomatologi din România — `controller.profession` in
    `src/messages/privacy/*.json`; correct it if any doctor's title was granted elsewhere;
  - **the prices line** — „Prețurile sunt exprimate în RON și includ toate taxele."
    (`services.prices.taxNote` ×5): confirm it is true of every price on the list;
  - **the patient part** — the page says the patient file is handled at the clinic, where the
    patient is informed about it (`contact.patient`); align it with the clinic's own patient
    privacy notice, if one exists, and say whether the clinic has a data protection officer
    (none is named today; a single clinic is normally not required to have one);
  - **a lawyer's read of the Romanian text**, then the four translations confirmed — EN, DE, FR
    and IT are Claude's drafts, flagged in this lane's record (§15.38 lists the points the drafts
    raised: the GDPR wording for art. 6(1)(b), the one-month reply that GDPR lets extend by two,
    the gloss for the College's name in each language);
  - **from the five-language copy review (2026-10-10), the owner's or the lawyer's to settle:**
    the clinic's LEGAL FORM first (an SRL, or a cabinet medical individual or societate civilă
    medicală, which registers with the DSP's Registrul unic al cabinetelor medicale and holds a
    CIF — the page's labels were made form-neutral until then); how long phone and WhatsApp
    messages are kept (the page states criteria today, „cât timp ne trebuie", not a number);
    whether the Law 365/2002 art. 5 information should name the DSP as the authority that
    authorises the clinic; whether the 12-month language cookie fits the cookie law's exemption
    as Romania applies it (Opinion 04/2012 reads it narrowly; the CNIL and the Garante treat
    language cookies as exempt — a shorter `LOCALE_COOKIE_MAX_AGE_S` is the lever); the reviews
    part's legal basis, which the reviewers' written consent (entry 7) would settle;
- **At launch (the host changes):** the page names the interim host, GitHub Pages
  (`HOST` in `PrivacyPolicy.tsx`, `TODO(launch)`); switch it to the launch host and move
  `POLICY_UPDATED` the same day. On Cloudflare keep bot protection off, or the page must list its
  `__cf_bm` cookie (entry 1). Any later change to the words moves `POLICY_UPDATED` too.
- **If entry 1 ever ships a consent record:** the page lists that cookie as well (COOKIES.md §4)
  and says how to withdraw consent.

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
    noindex until it is attached (§15.2);
  - the company's five legal facts (`legal`, since 2026-10-10) — name, CUI, Trade Register number,
    registered office, a privacy e-mail; the privacy page prints „[de completat]" until each
    arrives. Entry 3 has the whole list of what that page still needs.
- **`src/lib/team/team.ts`:**
  - the six doctors — their names and specialties are the owner's; everything else is a random
    placeholder under those real names, in all five languages: the pictures (demo silhouettes),
    the course rows, the four „în cifre" numbers, the quotes and the three biography paragraphs
    with their key words (§15.23 round 3 and round 7, and the file's `TODO(owner): REAL DOCTORS,
    PLACEHOLDER DETAILS` block, which also flags Claude's two edits to the names and the
    specialties for confirmation). The weekly hours left the site with the doctor page's schedule
    card on 2026-10-13 (§15.23 round 7), so no placeholder "Thursday: closed" remains for a
    patient to act on. Also Claude's drafts, from the same day: the courses' eyebrow „Repere din
    drumul meu spre specializare" in five languages, and each doctor's second biography paragraph
    and „Cursuri" tile written around it;
  - the clinic's three numbers on Home and Team — 16+ years, 8.000+ patients, 11.000+ procedures —
    placeholders too (`clinicStats`, §15.23 round 5): no clinic-wide count exists in the
    repository or on the old site.
- **`src/lib/prices/prices.ts`:** five rows read off a skewed photograph of the printed tariff
  carry `TODO(owner): verify against the printed sheet` (§15.20).
- **`src/lib/hero-slides/hero-slides.ts`:** the Home opener's three slogans and their picture
  descriptions are Claude's drafts in all five languages (§15.21 round 11) — to confirm or rewrite.
- **`src/content/blog/posts.json`** (the blog's list page, §15.39 — added 2026-10-11): the twelve
  posts are Claude's placeholder drafts — titles, summaries, dates and tags written so the blog
  page can be seen, attributed to the clinic's real doctors and illustrated with the clinic's own
  three photographs — and, since round 3 (2026-10-14), translated by Claude into English, German,
  French and Italian, the blog being in every language. No article exists behind any of them. They
  landed on develop with the page on the owner's word (2026-10-14), so the next promotion publishes
  them on the interim host — linked from the top bar of every page in every language since rounds 2
  and 3 of the same day (§15.39), and noindex like the whole host. Their reading times („4 min de
  citit", `readingMinutes`) are placeholders too, and so are the list page's hero heading and lead
  and the card's „Citește mai mult…" — Claude's drafts in all five languages (`blog.hero.*`,
  `blog.card.*`); since 2026-10-15 the heading ends on "through our blog" (the German one the
  owner's, refined with him: „…wie Sie es pflegen, in unserem Blog") and the lead is three phrases, its middle item dropped for the stairway. Replace them, or have each named doctor confirm theirs, in every language, before
  launch (the next promotion already publishes them, linked from every page, on the noindex interim
  host).
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
  - translated URLs — `/de/leistungen` instead of today's shared English slugs (`/de/services`,
    and since 2026-10-10 `/ro/privacy` for the policy page, which could be `/ro/confidentialitate`).
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

## 9 · Re-check the privacy policy against the website

- **Why it waits:** the owner, 2026-10-11: "also add in the backlog to recheck policy if it is
  compliant with my website". The policy page (entry 3, CLAUDE.md §15.38) was written on
  2026-10-10 from what the site did that day, and the site keeps changing. Entry 3 holds what only
  the owner and a lawyer can settle; this entry is the check that every sentence of the policy is
  true of the site as it ships, and that the site does nothing the policy leaves out.
- **When:** before launch, on the launch host and the real domain; and again after any change to
  something the policy describes — the host, the map, the language cookie, a new link to another
  site, a page that shows people's names or photos, anything loaded from another site (a script,
  a font, a picture, a video), or a form.
- **What to check — each claim, on the built export served the way the host serves it (never
  `next dev`), in a fresh browser profile:**
  - "a single cookie, only after a language choice" — browse every page type, scroll, open the
    contact dialog, move the map: no cookie at all; then pick a language, and accept and close the
    language suggestion: exactly one cookie, `NEXT_LOCALE`, holding only the language code, for
    12 months (`LOCALE_COOKIE_MAX_AGE_S` in `src/i18n/cookie.ts`; Safari keeps it 7 days at
    most). The page prints the name and the lifetime from the code, so those two cannot drift;
    what it says about WHEN the cookie is written can;
  - "no other form of storage in your browser" — localStorage, sessionStorage and IndexedDB empty
    for the site, and no service worker;
  - "no analytics, advertising or tracking cookies", and Google's map as the only other company —
    a network capture on every page type: every request goes to the site's own address, except
    Google's map frame on the pages that show the map;
  - "no forms" — no `<form>` and no text field on any page;
  - the map — "loads when you scroll close to it", does not tell Google which page you are
    reading, and in current browsers carries none of your Google cookies: the `<iframe>` wears
    `loading="lazy"`, `referrerPolicy="no-referrer"` and `credentialless`; re-run the cookie probe
    of COOKIES.md §3; the section name the policy quotes („Ne găsești") is still the band's heading
    in each language, and the address and the phone stay beside the map and in every footer;
  - "reviews on the home page, with names and, for some, a photo" — still on Home only, and the
    reviewers' consents in hand (entry 7);
  - "the links to Instagram, TikTok, WhatsApp or Google Maps" — list every link to another site on
    the built pages and compare (today's list is below);
  - "hosted by" — the host the page names, and the privacy policy it links, are the host that
    actually serves the site (entry 3's launch switch);
  - the clinic's details — the legal facts once the owner supplies them (entries 3 and 7); the
    phone and the address come from `src/lib/clinic` and follow by themselves;
  - the five languages still say the same thing — `tests/unit/privacy-parity.test.ts` checks the
    keys and the placeholders, not the meaning;
  - every change to the words moves `POLICY_UPDATED` in `PrivacyPolicy.tsx`, the date at the top.
- **Today — a quick look at develop `823bce1`'s build, 2026-10-11, not the full check:** the map
  frame wears all three attributes; no page has a form; no code in `src/` uses any other browser
  storage; the only thing loaded from another site is Google's map frame, on the 40 pages that
  show the map; the links to other sites go to WhatsApp, Instagram, TikTok, Google Maps and ANPC's
  complaint site `reclamatiisal.anpc.ro` (in every footer), and, from the policy page itself, to
  the College of Dentists, ANSPDCP, GitHub, Google and WhatsApp. The one gap found: the policy's
  links part does not name the ANPC link — whether it should is the lawyer's call (entry 3).
- **A lever, not built:** the mechanical half of this list — no form, nothing from another site
  but the map, the frame's three attributes, no storage in the code — could become a test over the
  built export, so that CI fails the day the site and the policy part ways.

## 10 · Getting found on Google — the search-engine work (SEO)

- **Why it waits:** the owner, 2026-10-11: "now that i think about it add to backlog optimisation
  of the website" — and, asked whether he meant speed or Google search, "both i think?". Speed
  is entry 6; this entry is the other half. CLAUDE.md §2 makes "SEO-ready by construction" a
  non-negotiable and §10 is its checklist, but the work was planned inside the content run the
  owner halted on 2026-09-06 (§15.17), and none of it reached develop. The plan is
  PHASE4_SEO_PLAN.md §3, §4 and §7 — its §6 and §7 predate the clinic's photos, the map, the
  real reviews and the favicon, so read them as the plan for the machinery, not as today's state.
- **Today (develop `823bce1`'s build, 2026-10-11):** no page carries the clinic's structured
  data (the `Dentist` JSON-LD), a canonical link, links to its other languages (hreflang) or
  Open Graph tags; there is no `sitemap.xml` and no `robots.txt`; Home and Services are titled
  „Premium Smile" alone (Team „Echipa noastră — Premium Smile", a doctor's page „Dr. {name} —
  Premium Smile"), and only the privacy page has a meta description. The interim host is built
  with `NOINDEX=1` (`src/app/[locale]/layout.tsx`), so none of this costs anything until the
  domain is attached — and all of it is due before launch.
- **The work, in §10's order:**
  - the `Dentist` JSON-LD on every page, fed only by `src/lib/clinic` (§10.1–2), with zero
    errors in Google's Rich Results Test — the archived S1 commit `cc749de` (closed PR #81,
    PHASE4_SEO_PLAN.md §2) still applied cleanly on 2026-10-10 and is the recorded first
    candidate;
  - a title and a meta description for every page in every language, "Service — Clinic — City"
    (§10.3) — the words are the owner's (§15.17), drafted by Claude only on his word; the doctor
    pages' pattern is in PHASE4_SEO_PLAN.md §4;
  - Open Graph tags and the share image (entry 8);
  - `sitemap.xml` with hreflang alternates and `x-default`, hreflang links in every page's head,
    a self-referencing canonical, and `robots.txt` pointing at the sitemap (§10.4);
  - optionally, `Service` markup on the Services page (§10.2; the archived `servicesJsonLd`);
  - at launch: the sitemap submitted in Google Search Console, and the owner claims the Google
    Business Profile (§10.7).
- **Depends on:** the production domain (entry 7 — every canonical, hreflang link, sitemap row
  and the JSON-LD's `url` is built from it); translated URLs (entry 8 — once Google has indexed
  a URL, changing it needs a redirect); the share image (entry 8). Already done: the Footer's
  address and phone on every page (§10.5). Core Web Vitals (§10.6) are entry 6.

## 11 · The threshold scroll steps against the „Echipa" dropdown — check them together

- **Why it waits:** the owner, 2026-10-15: "add to backlog to check if a bug arrises from the 2
  things that are right now being developed, a trashhold based scroll focus vs a take to doctor
  card from top bar dropdown" — and: "just add it to the backlog, do not fix anything yet". Both
  are lanes in flight — uncommitted, each branched from develop `bfadb0a`, neither aware of the
  other — so the check needs a tree that has both: it belongs to whichever lane merges SECOND (it
  rebases onto the first), or to develop once both are in, before the next promotion to main.
  The entry leaves the list in the lane that runs it.
- **The two pieces, as their code stood on 2026-10-15** (their records, CLAUDE.md §15.26 round 8
  and §15.40, are not on develop yet, and either lane may still change):
  - THE STEPS — `rework/doctor-scroll-steps`, NEW `src/lib/scroll-steps`: inside the doctors band
    (on Home and on the Team page) the page stops scrolling; the wheel or a finger adds up as
    intent and, past 140px of it, the page glides (650ms) to the next card, the card being left
    first hurried to the end of its ribbon stretch (a scroll key counts as the whole 140px). A
    card that fits the window under the top bar's 6rem strip rests CENTRED there; a taller one
    with its top 1rem under that strip (112px). A page left BETWEEN two such resting places is
    glided onto the nearer one by THE SETTLE — 140ms after the last scroll the steps did not
    make, and only within 4s of a wheel, a touch, a pointer press or a scroll key; any focus
    move, and any other key, cancels that window.
  - THE DROPDOWN — `rework/nav-dropdowns`, NEW `src/lib/nav-sections`: the top bar's „Echipa"
    opens on hover a card listing the six doctors — on a phone, a ⌄ list under „Echipa" in the
    menu — each a plain link to `/{locale}/team/#{doctor id}`; each card's ribbon station wears
    its doctor's id (DoctorShowcase's D13, THE ANCHOR), so the browser's own jump — smooth,
    through the html's `scroll-behavior` — rests the card's top 136px down (the root's 6rem
    `scroll-padding-top` and the station's 2.5rem `scroll-margin-top`).
- **Where they may collide — read off both lanes' code, NOT measured:**
  1. TWO RESTING PLACES FOR ONE CARD — 136px against centred, or 112px — so after a dropdown jump
     the page rests BETWEEN two of the steps' resting places, and:
     - THE SETTLE may move it again once the jump stops: a second, shorter glide onto the steps'
       own place for that card. Whether it runs hangs on details neither lane has settled —
       Chromium focuses a clicked link, which cancels the settle's window, and Safari does not;
       whether the dropdown hands focus back to „Echipa" as it closes is not written yet;
     - the FIRST NUDGE skips the threshold: from between two resting places THE DECISION enters
       a card at once, so one wheel tick, a short swipe or one arrow key after the jump glides to
       another doctor — DOWN to the next one where the card fits under the strip (every phone:
       the cards are about 480–550px tall at 390×844), UP to the previous one's end where it is
       taller (the steps' own header names 1366×633, 1536×730 and 1920×945) — where inside the
       band a step takes 140px of intent;
     - the steps do not learn where the jump went: their current step stays the one before it
       (none after a page load), so the next step hurries the wrong card's ribbon stretch while
       the jumped-to card's keeps drawing at its own pace.
  2. A CLICK DURING A STEP. A step lasts about a second (its hurry, then the glide, which writes
     the page's position every frame). A script scroll of the page during the browser's smooth
     fragment glide CANCELS that glide (§15.20 round 6 measured it for `scrollIntoView`, in
     Chromium and WebKit), and the steps' glide gives way only once something else has moved the
     page more than 2px — so a dropdown click in that second may end on the step's card, or on
     neither.
  3. THE KEYS. The steps take the arrow keys, PageUp/PageDown and Space from the window unless the
     key was already prevented (Space on a link or a button is left alone). So with focus inside
     the open dropdown and the page resting in the band, an arrow key the dropdown does not
     prevent moves the page a whole card behind it — wrong if the dropdown moves between its
     entries with the arrows (it must then prevent them), a choice to confirm if it leaves the
     arrows to the page.
- **How to check:** on the built export with reduced motion OFF — the visual net runs every story
  with `reducedMotion: 'reduce'` (playwright.config.ts), where the steps stand down and the jump
  is instant, so it can never see this — in Chromium AND WebKit (case 1 differs between them; the
  e2e suite is Chromium-only, §15.20 round 5), RO + DE, at 1366×633 (a doctor card taller than
  the space under the strip), in a taller window where one fits, and on a phone through the
  menu's ⌄ list (390×844, where the cards fit; the open menu freezes the page, which stands the
  steps down until it closes). For each doctor, from the top of `/ro/team/` and from inside the
  band: open „Echipa" and click — a second after the page stands still, the clicked doctor's card
  is the one on screen and nothing moved again (or only onto that same card); then one small
  scroll or swipe down, one up and one arrow key; then a click while a step glides; then the
  arrow keys inside the open dropdown. Last, a cold load of
  `/ro/team/#{id}` on a slowed connection: the steps move nothing at start, so it should land, but
  §15.20 round 6 found fragment loads fragile. If `rework/team-hero` is in by then, measure with
  it: it puts a hero above the band on the Team page and moves every card down.
- **Levers, if it breaks (none is a decision, and nothing is built):**
  - ONE RESTING PLACE — the price list's answer to "a click and a scroll cannot disagree" (§15.20
    round 5): the steps write each station's planned resting place as its `scroll-margin-top`, so
    the browser's own jump comes to rest ON a step. It costs `lib/scroll-steps` its "writes
    nothing but the window's scroll position", and D13 its 2.5rem — a jumped-to doctor card would
    no longer rest on the price cards' line;
  - THE STEPS ADOPT A JUMP — on a `hashchange`, and at load when the URL names a station, they
    take that card as the current step and its position as resting there (a second click on the
    same doctor fires no `hashchange`, though the browser scrolls again);
  - THE STEPS GIVE WAY TO A CLICK — a click on an in-page link ends a step under way at once, so
    the browser's jump is the only movement left.

## 12 · The patients' reviews — the „[…]" cuts and the CMSR's testimonial rule

- **Why it waits:** the owner, 2026-10-16, after asking why the reviews on Home show „[…]" and
  whether showing them straight from Google would still leave the clinic answerable for them
  („ele sunt pubblice pe google reviews adica daca de exemplu iau un api care numa streamuieste
  reviewurile, mai is "liable" de chestia asta??"): "add to backlog that i should come back on
  this". Nothing changes until he decides.
- **Today:** the seven reviews (`src/lib/reviews/reviews.ts`, CLAUDE.md §15.19 round 4) are the
  patients' Google reviews with eleven phrases cut, each cut marked „[…]" — on 2026-09-30 the
  owner picked "Trim" over "Word for word". The four other languages were translated from the
  cut Romanian and carry the same marks. What each mark hides, by the card's title (the names
  stay in the data rows alone: the repository is public, and the consents are still owed —
  entry 7):
  - „Empatie și implicare": „Recomand cu […] încredere!" ← „cea mai mare";
  - „Procedura, explicată clar", four: the opening „Experiența mea … a fost extraordinară, …",
    „de optimă calitate", „impecabilă", „o super profesionistă";
  - „De la recepție până în cabinet": „este una […]." ← „impecabilă, din toate punctele de
    vedere";
  - „Atenție la detalii": „a fost […]." ← „extraordinară", and „experiențe stomatologice […]." ←
    „de calitate";
  - „Instrumente și tratamente noi": „sunt noi […]." ← „și foarte calitative";
  - „Același medic de zece ani": „de aproximativ 10 ani […]." ← „și colaborarea cu ea a fost la
    superlativ";
  - „Grijă și pentru cei mici": „cât și de profesionalism […]." ← „- premium 😄".
- **The rule, in the adopted text:** Decizia CMSR nr. 04/2CN/2025 (Monitorul Oficial nr. 529 of
  6 June 2025, in force since 1 July 2025), annex, pct. 3.1 lit. d): „Forma de exercitare a
  profesiei sau medicul care preia pe site-ul web sau paginile din cadrul rețelelor de socializare
  afirmațiile/testimonialele pacienților este responsabil conform legii și poate fi sancționat în
  conformitate cu prevederile Codului deontologic al medicului stomatolog pentru conținutul
  preluat." The banned words are pct. 3.3 lit. (a)(iii) — „cea mai bună", „top", „optim",
  „excelență", „servicii profesionale" / „calitative" / „de înaltă calitate", „servicii premium
  sau exclusiviste" among them. Read on 2026-10-16 in the copy the Argeș county college published
  (cmsarges.ro, „Ghidului de bune practici privind publicitatea medicilor stomatologi"); cmsr.ro's
  own page for the guide serves the April 2025 draft, the same paragraph in substance, and the old
  PDF address under cmsr.ro/wp-content/uploads/2025/04/ answers 404.
- **The API question — no, read off the guide (not a lawyer's opinion):** being public on Google
  is not the point. There the patient publishes; on the site the clinic does, and the rule's verb,
  „preia", says nothing about how the taking is done. A feed of Google's reviews (the Places API)
  leaves the liability where it is and adds risks:
  - the text arrives whole, the banned words included; cutting them makes it a feed no longer;
  - Google picks the reviews — "A maximum of 5 reviews can be returned", "sorted by relevance" —
    so a new review would appear on the site unread, and the clinic would answer for it;
  - Google's display rules ("Policies and attributions for Places API") require each review's
    author and avatar and a link to the original, while the guide's same page asks the patient's
    prior consent for photos, „inclusiv cu privire la indicarea numelui";
  - Google forbids storing Places API content (place IDs excepted), so the reviews could not be
    written into the static HTML at build: each visitor's browser would fetch them, which
    CLAUDE.md §16 rules out — a paid API key, and the visitor's IP sent to Google before any
    consent, entry 1's question a second time.
- **Found while checking (2026-10-15 and 16):**
  - two cuts leave a sentence without its point — „Atenție la detalii"'s „… a fost […]." and „De
    la recepție până în cabinet"'s „… este una […]."; the rule was the smallest cut that leaves a
    whole sentence, and screen readers skip the brackets at their default settings, so a listener
    hears "My experience … was." The lever: cut the whole clause, as „Procedura, explicată clar"
    does for its opening;
  - the line between kept and cut is a judgment: „sunt mulțumit de calitatea lucrărilor" stayed
    and „experiențe stomatologice de calitate" went; and while the guide bans „servicii
    profesionale", six of the seven quotes keep „profesionalism", „profesionalitate" or „foarte
    profesional", said by patients about their visit — for the lawyer's read (entry 3);
  - the CMSR scan (`tests/unit/cmsr-scan.test.ts`, CLAUDE.md §13) would catch ONE of the eleven
    phrases if it came back, „cea mai mare" (run against its Romanian patterns on 2026-10-16): it
    has none for „extraordinar", „impecabil", „optim" alone, „super", „la superlativ",
    „calitativ" or „premium" — the last needs care, since the clinic's own name carries it.
    lib/reviews' header says such a word "fails CI instead of shipping"; for these it would not.
- **The choices when the owner comes back (none taken):**
  1. keep the cuts and their marks — honest and inside the guide; the cost is the look;
  2. settle it with the consents entry 7 already owes: show each patient the shortened text when
     asking, and a text the patient approved is theirs — the marks on that card can go (the
     recommendation of 2026-10-15);
  3. replace the reviews with ones that need no cut — every one on the site needs one today;
  4. no reviews on the site, a link to the clinic's Google listing instead: nothing is taken
     over. The same guide, pct. 2 lit. f (iii), bars links to pages whose content may be
     considered contrary to the profession's ethical and deontological principles; a link to the
     clinic's own listing is common practice, but that is the lawyer's call (entry 3);
  5. word for word — the 2026-09-30 choice reversed: no marks, and every phrase the guide bans
     shown on the clinic's own site.
- **Not on the list:** the API (above), and the cuts without their marks, which would show a
  shortened text as the patient's whole words.
- **The work, once decided:** the rows of `src/lib/reviews/reviews.ts` in all five languages, its
  data test (`tests/unit/reviews-data.test.ts`) and the CMSR scan; lib/reviews' header and
  CLAUDE.md §15.19 round 4 record the decision; the screenshots that show the deck — Pages/Home,
  Sections/ReviewsCarousel and Sections/ReviewCard.
