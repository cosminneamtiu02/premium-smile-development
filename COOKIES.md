# COOKIES.md — everything on this site that uses cookies, and why

> **Status:** reference document, written 2026-09-07 on the owner's instruction
> ("document everything that uses cookies … I'll think later of a solution for
> implementing the cookies"). The hand-rolled consent-banner implementation that briefly
> existed as an uncommitted lane was **deleted the same day on the owner's word** — its
> transferable design is preserved in §6. Nothing cookie-consent-related exists in the
> codebase. This file is the single place to read before choosing a cookie-management
> solution — first-party, third-party manager modal, or anything else.

---

## 0 · What a cookie physically is (30 seconds)

HTTP is stateless — the server forgets the visitor between requests. A **cookie** is a
small `name=value` pair a website asks the browser to store; the browser then
automatically re-sends it with every future request **to that same site**. Two ways one
gets written: the server sends a `Set-Cookie` response header (impossible here — this
site is static files, no server logic), or JavaScript on the page assigns
`document.cookie = "…"` — which is how every first-party cookie on this site is written.
A **third-party cookie** is one set by code loaded from a different domain (e.g. Google's
script inside an embedded map): it is sent back to *that* domain from every site that
embeds it, which is what makes it a cross-site tracking mechanism and the reason the law
treats it differently.

## 1 · The complete inventory

| # | Cookie | Party | Who writes it | When | Purpose | Legal class | Status |
|---|---|---|---|---|---|---|---|
| 1 | `NEXT_LOCALE` | First-party (ours) | LanguageSwitcher click · LanguageBanner accept/dismiss | Only on the visitor's explicit click | Remember the chosen language; root `/` and the 404 dispatcher read it to route | **Exempt-functional** — no consent needed, disclosure only | **LIVE** on develop |
| 2 | `MAP_CONSENT` | First-party (ours) | The future consent mechanism (Accept/Reject) | Only on the visitor's explicit click | Remember whether the visitor allowed the Google-Maps embed (`granted` / `rejected`) | **Exempt** (a consent *record* is itself strictly necessary) | **NOT BUILT** — design documented in §6; implementation deleted 2026-09-07 on owner instruction |
| 3 | Google's cookies (`NID`, and whatever Google decides — not under our control) | **Third-party** (google.com) | Google's JavaScript inside the maps-embed iframe | The moment the iframe loads | Google's own purposes: session, preferences, ad/tracking ecosystem | **Consent REQUIRED before load** — the entire reason a consent mechanism exists | **NOT SHIPPED** — the map is designed but blocked on the cookie strategy |

That is the whole list. Nothing else on the site stores anything on the visitor's
device: no analytics (banned by owner decision, §12), no sessionStorage/localStorage
use, no font CDN (fonts are self-hosted), no chat widgets, no server sessions
(there is no server).

## 2 · Cookie #1 — the language cookie, in full

- **Name:** `NEXT_LOCALE` (the `LOCALE_COOKIE` constant in `src/i18n/cookie.ts`).
- **Value:** one of `ro | en | de | fr | it`.
- **Written by:** the LanguageSwitcher (the corner dial — choosing a language), and the
  LanguageBanner (the "this page exists in your language" toast — both *accept* and
  *dismiss* write it, because "I'm fine where I am" is also a choice, §8.7/D2).
- **Read by:** the root `/` redirect (cookie → that locale, else `/ro` — PR #85) and the
  404 dispatcher (URL segment → cookie → `ro` — PR #86). Note these are *readers in
  JavaScript on our own pages* — on a static host the cookie never influences a server,
  because there is no server.
- **Attributes:** `path=/; max-age=31536000` (12 months); `SameSite=Lax` (not sent on
  cross-site requests — CSRF hygiene); `Secure` — being made **conditional on `https:`**
  in the `fix/404-polish` lane, because WebKit/Safari refuses `Secure` cookie writes
  from ANY insecure scheme *including* `http://localhost` (owner-hit in dev; Chrome is
  lenient there, Safari is not).
- **Why it needs NO consent banner:** the consent law (GDPR + ePrivacy) exempts storage
  that is *strictly necessary for a service the visitor explicitly requested*. Clicking
  "Deutsch" IS the request; remembering it IS the service. Regulator guidance names
  language-preference cookies as the canonical example of this exemption. The only
  obligation is **disclosure** — a paragraph on the future privacy-policy page — which
  is not a banner.
- **Known limitation (accepted, §15.14):** Safari's ITP caps any JavaScript-written
  cookie at ~7 days regardless of `max-age`, so iPhones simply re-ask sooner. No
  mechanism beats this; disclose it and move on.

## 3 · Cookie #3 — Google's cookies, and why the map is the whole problem

The "Ne găsești" section (ClinicLocation, designed 2026-09-06/07) wants the old site's
scrollable Google map. That map is an `<iframe>` — a browser-within-the-page loading
`google.com/maps/embed`. The instant it loads, **Google's JavaScript runs and writes
Google's cookies** on the visitor's device — before the visitor did anything. The legal
chain, link by link:

1. Storing anything non-essential on the device requires **prior consent** (ePrivacy).
2. Google's map cookies serve Google's tracking/ads ecosystem — nothing the visitor
   requested. No exemption applies.
3. Therefore consent must be collected **before the iframe loads**.
4. Consent must be a **specific, informed, affirmative act**. Things that do NOT count
   (all verified against regulator guidance + the Planet49 ruling): a sentence in the
   policy ("by using this site you agree"), continuing to browse, scrolling, clicking
   arbitrary links (the eBay wording), pre-ticked boxes, silence.
5. A site with no lawful consent mechanism may not load the iframe. Period.

**The lawful shapes** (the menu for the future decision):
- **Consent mechanism + zero-click embed** — a banner/modal/manager collects one
  affirmative act; once granted, the map is live at page load on every visit. This is
  what the owner picked on 2026-09-07 (board fb-371) and what the parked lane built.
- **Click-to-load facade** — the consent act is a click on the map picture itself; the
  iframe loads only after. No site-wide UI at all.
- **Static first-party map image linking out** — no Google on the page, no consent
  question exists.
- **Self-hosted interactive map** (MapLibre + our tiles) — scrollable with zero
  consent needs, but not Google's look.

## 4 · Cookie #2 — the consent record itself (the meta-cookie)

Whatever mechanism is chosen, it must REMEMBER the answer — and that memory is itself a
cookie (`MAP_CONSENT` in the parked lane: `granted`/`rejected`, 12 months, same
attribute family as the language cookie). Storing the visitor's consent answer is
strictly necessary to honor it, so this record is **exempt** — it needs disclosure, not
its own consent (no infinite regress). Any third-party manager will keep an equivalent
record; audit WHERE it stores it and WHAT ELSE it stores (see §5).

## 5 · Criteria for a third-party "cookie manager" modal (read before adopting one)

The owner may adopt a ready-made consent-management product (CMP). Non-negotiable
audit points, derived from this site's own law (§2/§12/§16 of CLAUDE.md):

1. **The CMP must not itself be a privacy problem.** Many load their script from a CDN,
   phone home with visitor data, or set their own tracking cookies. A CMP that does any
   of that recreates the disease it claims to cure. Requirements: **self-hostable
   script** (served from our domain), **no network calls** to the vendor at runtime,
   its own storage limited to the consent record.
2. **Static-host compatible.** No server, no middleware — the CMP must be pure
   client-side JavaScript.
3. **Blocking actually enforced.** The manager must prevent the map iframe from
   existing in the DOM until consent — not hide it (`display:none` still loads Google).
   The parked lane's rule stands: *the iframe is absent, not invisible*, and that is
   testable.
4. **Equal Accept/Reject prominence, nothing pre-ticked, revocable** — the validity
   conditions from §3.4 apply to the manager's UI too.
5. **Five locales.** The modal's strings must be translatable into ro/en/de/fr/it and
   fit German +30–35% expansion (§8.4).
6. **Weight.** The site's §16 doctrine is "islands only, minimal JS". Many CMPs ship
   hundreds of KB for features (per-category toggles, vendor lists, TCF strings) this
   site does not need — there is exactly ONE consent purpose here. Anything heavier
   than the problem is the wrong tool.
7. **Scope discipline.** Analytics stays banned by owner decision regardless of any
   banner existing (§12). A CMP's "just enable analytics now that you have consent"
   path is a trap, not a feature.

## 6 · Knowledge salvage — what was designed, proven, then deleted

A complete hand-rolled implementation was built, triple-reviewed and fully gated on
2026-09-07 (1166 tests, 218 visual frames, WCAG remediation), then **deleted on the
owner's instruction the same day** — the strategy is re-opened, and only this document
ships. The transferable knowledge, preserved here so ANY future implementation (hand
built or third-party manager) starts ahead:

**The record contract** (vendor-agnostic seam — whatever UI collects consent should
write through an API of this shape, so the map island never learns which vendor exists):

```ts
getMapConsent(): 'granted' | 'rejected' | null   // null = never answered → ask
hasMapConsent(): boolean                          // === 'granted'
grantMapConsent(): void                           // writes the record + notifies
revokeMapConsent(): void                          // writes 'rejected' + notifies
subscribeMapConsent(cb): () => void               // map island flips live, no reload
```

Cookie shape that was proven: `MAP_CONSENT=<v>; path=/; max-age=31536000; SameSite=Lax`
with `; Secure` appended **only when `location.protocol === 'https:'`** — WebKit refuses
`Secure` writes from any insecure scheme including `http://localhost` (Safari dev breaks
silently otherwise; Chromium is lenient, which hides the bug). Every read/write SSR
guarded and try/caught; unknown values → `null` (fall back to asking, never to consent).

**The banner strings, five locales, drafted and register-checked** (DE Sie / FR vous /
IT tu / RO informal):

| Key | RO | EN | DE | FR | IT |
| --- | --- | --- | --- | --- | --- |
| text | Pentru a afișa harta Google, avem nevoie de acordul tău — Google poate seta cookie-uri. | To show the Google map, we need your consent — Google may set cookies. | Um die Google-Karte anzuzeigen, benötigen wir Ihre Einwilligung — Google kann Cookies setzen. | Pour afficher la carte Google, nous avons besoin de votre consentement — Google peut déposer des cookies. | Per mostrare la mappa Google ci serve il tuo consenso — Google può impostare cookie. |
| accept | Acceptă harta | Allow the map | Karte erlauben | Autoriser la carte | Consenti la mappa |
| reject | Continuă fără hartă | Continue without the map | Ohne Karte fortfahren | Continuer sans la carte | Continua senza mappa |
| policy link | Detalii în politica de confidențialitate | Details in the privacy policy | Einzelheiten in der Datenschutzerklärung | Détails dans la politique de confidentialité | Dettagli nell'informativa sulla privacy |

**Hard-won findings that apply to ANY bottom-anchored consent UI on this site:**
- Coexistence with the corner discs + language toast needs a shared, MEASURED offset
  (a `--consent-lift` custom property published from the banner's real height — a fixed
  value breaks under German text, zoom and phone safe-areas) that the other bottom
  residents consume additively with a `0` fallback.
- The global `scroll-padding-bottom` steps must grow by the same offset, or keyboard
  focus can land fully hidden behind the banner on phones (WCAG 2.4.11 — found HIGH in
  review, remedy proven).
- Blocking must mean the iframe is **absent from the DOM**, not hidden — `display:none`
  still loads Google. Testable: assert absence pre-consent.
- Tailwind container-query variants must sit on a CHILD of the `@container` element —
  on the container itself they silently never match (found as a review HIGH: the
  desktop layout was dead code until moved).
- On the owner's resolved design questions (2026-09-07, board fb-365…369): banner
  bottommost on EVERY page, persistent until answered; discs/toast pushed up while it
  is pending and returning after; two equal-size Accept/Reject buttons; 12-month
  record; the eBay-style persistent FORM adopted but never its "clicking any link is
  consent" wording (invalid — §3.4).

**Live CLAUDE.md remains unamended and true:** the site today ships no banner and no
consent-requiring content. The ClinicLocation map section is blocked only on this
strategy decision; everything else about it (heading, address/phone rows, placement,
strings) is decided and waiting in its dossier.

## 7 · The disclosure obligation that exists NO MATTER WHAT

Whichever path is chosen, the future §12 privacy-policy page must disclose: the
language cookie (name, purpose, lifetime, the Safari ~7-day note), the consent record
if one ships, that loading the map hands the frame to Google which may set cookies, and
how to withdraw consent. Disclosure is plain text — it needs no interaction and no
banner, and it is required even for the exempt cookies.
