# BACKLOG.md — work left for later, on purpose

Started 2026-10-01 on the owner's word: "create also in this pr a list with stuff to do later if
it doesn't exist already. add there coookies, complete accesibility test rerun and policy page for
the moment". Each entry says what the work is, why it waits and where its record already lives.
The records stay the source of truth (CLAUDE.md, COOKIES.md); this file points at them. An entry
leaves the list in the lane that does the work, and a new one joins it on the owner's word.
Decisions still go to CLAUDE.md §15.

## 1 · Cookies — consent for the Google Maps embed

- **Why it waits:** the owner, 2026-09-09: "bypass somehow cookies consent for the moment … we'll
  get to cookies consent and implementation later" — recorded as CLAUDE.md §12's rider.
- **Today:** the „Ne găsești" map (`sections/ClinicLocation`, on Home, Team and every doctor page)
  loads Google's `<iframe>` with the page, with no consent gate. The only cookie the site itself
  writes is the language cookie (COOKIES.md §2).
- **Known since 2026-10-01, not yet in COOKIES.md:** §3's "the embed set zero cookies" holds for
  WRITES only. In Chrome and Edge, which keep third-party cookies on, the frame SENDS a signed-in
  visitor's existing Google cookies (19 of 46 requests in a probe on the built page) and Google's
  page can read them. The `credentialless` attribute on the `<iframe>` stopped that with no visible
  or functional change (Chrome and Edge 110+; Safari blocks third-party cookies anyway — 0 sent,
  measured — and Firefox partitions them). What no attribute fixes while the map loads by itself:
  the visitor's IP address reaching Google. Record this in COOKIES.md §3 and §7 when the lane
  starts.
- **The work:** COOKIES.md §7 is the checklist — nine items, one lane: the consent record, the
  `<iframe>` absent (never hidden) until consent, the design of the no-consent branch (an image, a
  "show map" button or a plain link out — that lane's call), hydration safety (CLAUDE.md §16 rule
  2), the live flip, the tests, the disclosure (entry 3) and the clean-up of §12's rider. Read
  COOKIES.md §5 before adopting any third-party consent manager.

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
  - the price menu — Firefox, a real iPhone and screen readers never run (§15.20 round 5).

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
